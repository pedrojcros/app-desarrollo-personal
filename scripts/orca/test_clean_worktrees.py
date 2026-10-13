import io
import json
import subprocess
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock

from scripts.orca import clean_worktrees


class CleanWorktreesTests(unittest.TestCase):
    def setUp(self):
        temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(temporary_directory.cleanup)
        self.root = Path(temporary_directory.name)
        self.main_path = self.root / 'main'
        self.main_path.mkdir()
        self.worktree_path = self.root / 'topic'
        self.worktree_path.mkdir()
        self.worktrees = [self.worktree()]
        self.workers = []
        self.terminals = []
        self.statuses = {}
        self.heads = {}
        self.unmerged = set()
        self.removed = []
        self.commands = []
        self.worker_pages = None
        self.orca_failure = False
        self.truncated_command = None
        self.omitted_command = None
        self.merge_code = None
        patcher = mock.patch.object(subprocess, 'run', side_effect=self.run_command)
        patcher.start()
        self.addCleanup(patcher.stop)

    def worktree(self, path=None, main=False):
        return {
            'path': str(path or self.worktree_path),
            'isMainWorktree': main,
            'head': 'stale-orca-head',
            'displayName': 'app-desarrollo-personal',
        }

    def worker(self, path=None, verdict='live'):
        worker = {'resource': {'worktreeId': f'repo::{path or self.worktree_path}'}}
        if verdict is not None:
            worker['projection'] = {'liveness': {'verdict': verdict}}
        return worker

    def run_command(self, command, cwd=None, **options):
        self.commands.append(command)
        output = ''
        code = 0
        path = str(cwd)
        if command[0] == 'git':
            arguments = command[1:]
            if arguments == ['worktree', 'list', '--porcelain']:
                output = f'worktree {self.main_path}\nHEAD main-head\n\n'
            elif arguments == ['rev-parse', '--show-toplevel']:
                output = str(self.worktree_path)
            elif arguments == ['status', '--porcelain']:
                status = self.statuses.get(path, '')
                if isinstance(status, Exception):
                    raise status
                output = status
            elif arguments == ['rev-parse', 'HEAD']:
                output = self.heads.get(path, 'merged-head')
            elif arguments[:2] == ['merge-base', '--is-ancestor']:
                code = 1 if arguments[2] in self.unmerged else 0
                if self.merge_code is not None:
                    code = self.merge_code
            elif arguments[:2] == ['rev-list', '--count']:
                output = '3'
            elif arguments != ['fetch', 'origin']:
                raise AssertionError(f'Unexpected git arguments: {arguments}')
        else:
            arguments = command[1:-1]
            if self.orca_failure and arguments[0] == 'orchestration':
                return subprocess.CompletedProcess(command, 2, '', 'Orca unavailable')
            if arguments[:2] == ['worktree', 'list']:
                result = {'worktrees': self.worktrees}
            elif arguments[:2] == ['terminal', 'list']:
                result = {'terminals': self.terminals}
            elif arguments[:2] == ['orchestration', 'worker-list']:
                result = {'workers': self.workers, 'page': {'hasMore': False}}
                if self.worker_pages is not None:
                    page_index = 1 if '--cursor' in arguments else 0
                    result = self.worker_pages[page_index]
            elif arguments[:2] == ['worktree', 'rm']:
                self.assertNotIn('--force', arguments)
                self.removed.append(arguments[3])
                result = {'removed': True}
            else:
                raise AssertionError(f'Unexpected Orca arguments: {arguments}')
            if arguments[0] == self.truncated_command:
                result['truncated'] = True
            if arguments[0] == self.omitted_command:
                result['hostScope'] = {'omittedHostIds': ['remote']}
            output = json.dumps({'ok': True, 'result': result})
        return subprocess.CompletedProcess(command, code, output, 'command failed')

    def classify(self, worktree=None):
        activity = clean_worktrees.load_activity()
        return clean_worktrees.classify_worktree(
            worktree or self.worktree(), activity.workers, activity.terminals, self.root,
            activity.unknown,
        )

    def run_main(self, arguments=None):
        output = io.StringIO()
        with redirect_stdout(output):
            code = clean_worktrees.main(arguments or [])
        return code, output.getvalue()

    def test_main_is_protected_without_orca_flag_and_when_contained(self):
        for flag in [None, False, 0]:
            for path in [self.main_path, self.root]:
                with self.subTest(flag=flag, path=path):
                    worktree = self.worktree(path)
                    if flag is None:
                        del worktree['isMainWorktree']
                    else:
                        worktree['isMainWorktree'] = flag
                    self.assertEqual(self.classify(worktree).group, 'principal')

    def test_unknown_or_missing_worker_liveness_is_in_use_but_exited_is_free(self):
        for verdict, expected in [('unknown', 'en uso'), (None, 'en uso'),
                                  ('exited', 'se puede borrar')]:
            with self.subTest(verdict=verdict):
                self.workers = [self.worker(verdict=verdict)]
                self.assertEqual(self.classify().group, expected)

    def test_worker_paths_use_directory_boundaries(self):
        for candidate, expected in [(str(self.worktree_path) + '-bar', 'se puede borrar'),
                                    (self.worktree_path / 'child', 'en uso')]:
            self.workers = [self.worker(candidate)]
            self.assertEqual(self.classify().group, expected)

    def test_terminal_inside_worktree_is_in_use(self):
        self.terminals = [{'cwd': str(self.worktree_path / 'child')}]
        self.assertEqual(self.classify().group, 'en uso')

    def test_real_head_is_used_instead_of_orca_head(self):
        self.heads[str(self.worktree_path)] = 'new-head'
        self.unmerged.add('new-head')
        self.assertEqual(self.classify().group, 'sin fusionar')

    def test_merge_base_exit_codes_other_than_zero_and_one_are_errors(self):
        for code in [2, 128]:
            self.merge_code = code
            with self.assertRaises(clean_worktrees.CommandFailure):
                clean_worktrees.is_ancestor('head', 'origin/develop', self.root)

    def test_git_status_does_not_request_ignored_files(self):
        self.assertEqual(self.classify().group, 'se puede borrar')
        self.assertIn(['git', 'status', '--porcelain'], self.commands)

    def test_apply_only_removes_eligible_groups(self):
        dirty_path = self.root / 'dirty'
        dirty_path.mkdir()
        active_path = self.root / 'active'
        active_path.mkdir()
        unmerged_path = self.root / 'unmerged'
        unmerged_path.mkdir()
        self.worktrees.extend([self.worktree(self.main_path), self.worktree(dirty_path),
                               self.worktree(active_path), self.worktree(unmerged_path),
                               self.worktree(self.root / 'missing')])
        self.statuses[str(dirty_path)] = '?? new.txt'
        self.workers = [self.worker(active_path)]
        self.heads[str(unmerged_path)] = 'new-head'
        self.unmerged.add('new-head')
        code, output = self.run_main(['--apply'])
        self.assertEqual(code, 0)
        self.assertEqual(self.removed, [f'path:{self.worktree_path}'])
        self.assertIn(
            f'topic ({self.worktree_path}) [app-desarrollo-personal]: resultado de borrado',
            output,
        )

    def test_apply_does_not_promote_previously_ineligible_worktrees(self):
        self.workers = [self.worker()]
        classification = self.classify()
        self.assertEqual(classification.group, 'en uso')
        self.workers = []
        with redirect_stdout(io.StringIO()):
            clean_worktrees.apply_removals([classification], self.root)
        self.assertEqual(self.removed, [])

    def test_command_failure_in_status_continues_to_other_worktrees(self):
        self.statuses[str(self.worktree_path)] = clean_worktrees.CommandFailure('status failed')
        later_path = self.root / 'later'
        later_path.mkdir()
        self.worktrees.append(self.worktree(later_path))
        code, output = self.run_main(['--apply'])
        self.assertEqual(code, 1)
        self.assertIn('error al clasificar', output)
        self.assertEqual(self.removed, [f'path:{later_path}'])

    def test_apply_reloads_activity_before_each_candidate(self):
        later_path = self.root / 'later'
        later_path.mkdir()
        classifications = [self.classify(), self.classify(self.worktree(later_path))]
        original_run_command = self.run_command

        def run_with_new_worker(command, **options):
            result = original_run_command(command, **options)
            if command[1:3] == ['worktree', 'rm']:
                self.workers = [self.worker(later_path)]
            return result

        with mock.patch.object(subprocess, 'run', side_effect=run_with_new_worker):
            with redirect_stdout(io.StringIO()):
                clean_worktrees.apply_removals(classifications, self.root)
        self.assertEqual(self.removed, [f'path:{self.worktree_path}'])

    def test_dry_run_with_eligible_worktree_never_removes(self):
        code, output = self.run_main()
        self.assertEqual(code, 0)
        self.assertIn('1 se pueden borrar', output)
        self.assertEqual(self.removed, [])
        self.assertIn(f'topic ({self.worktree_path})', output)

    def test_apply_rechecks_new_commit_worker_and_main_path(self):
        classification = self.classify()
        for change in ['commit', 'worker', 'main', 'dirty']:
            with self.subTest(change=change):
                self.workers = []
                self.heads = {}
                self.statuses = {}
                classification.worktree = self.worktree()
                if change == 'commit':
                    self.heads[str(self.worktree_path)] = 'new-head'
                    self.unmerged.add('new-head')
                elif change == 'worker':
                    self.workers = [self.worker()]
                elif change == 'main':
                    classification.worktree = self.worktree(self.main_path)
                else:
                    self.statuses[str(self.worktree_path)] = '?? new.txt'
                with redirect_stdout(io.StringIO()):
                    clean_worktrees.apply_removals([classification], self.root)
                self.assertEqual(self.removed, [])

    def test_worker_pagination_includes_live_worker_on_second_page(self):
        self.worker_pages = [
            {'workers': [], 'page': {'hasMore': True, 'nextCursor': 'second'}},
            {'workers': [self.worker()], 'page': {'hasMore': False}},
        ]
        self.assertEqual(self.classify().group, 'en uso')

    def test_orca_failure_marks_worktree_in_use(self):
        self.orca_failure = True
        self.assertEqual(self.classify().group, 'en uso')

    def test_incomplete_activity_lists_mark_worktree_in_use(self):
        for field in ['truncated_command', 'omitted_command']:
            for command in ['terminal', 'worktree']:
                with self.subTest(field=field, command=command):
                    setattr(self, field, command)
                    self.assertEqual(self.classify().group, 'en uso')
                    setattr(self, field, None)

    def test_classification_failure_continues_and_returns_nonzero(self):
        self.statuses[str(self.worktree_path)] = OSError('cannot read status')
        later_path = self.root / 'later'
        later_path.mkdir()
        self.worktrees.append(self.worktree(later_path))
        code, output = self.run_main()
        self.assertEqual(code, 1)
        self.assertIn('error al clasificar', output)
        self.assertIn(str(later_path), output)
        self.assertIn('1 se pueden borrar', output)

    def test_result_requires_dictionary_response(self):
        for response in [[], None, 'invalid']:
            with self.assertRaises(clean_worktrees.CommandFailure):
                clean_worktrees.get_result(response)

    def test_path_resolution_failure_is_conservatively_within(self):
        with mock.patch.object(Path, 'resolve', side_effect=OSError('cannot resolve')):
            self.assertTrue(clean_worktrees.path_is_within(self.worktree_path, self.root))

    def test_loose_directories_ignore_hidden_folders(self):
        (self.root / '.orca-worktree-trash').mkdir()
        loose_path = self.root / 'loose'
        loose_path.mkdir()
        result = clean_worktrees.find_loose_directories(
            [self.worktree(), self.worktree(self.main_path)],
        )
        self.assertEqual(result, [loose_path])


if __name__ == '__main__':
    unittest.main()
