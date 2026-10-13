import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from scripts.orca import clean_worktrees


class CleanWorktreesTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.root = Path(self.temporary_directory.name)
        self.worktree_path = self.root / 'worktree'
        self.worktree_path.mkdir()

    def worktree(self, path=None, main=False, head='commit'):
        return {
            'path': str(path or self.worktree_path),
            'isMainWorktree': main,
            'head': head,
            'branch': 'refs/heads/topic',
            'displayName': 'topic',
        }

    def test_classifies_main_worktree_as_omitted(self):
        result = clean_worktrees.classify_worktree(self.worktree(main=True), [], [], self.root)
        self.assertEqual(result.group, 'principal')

    def test_classifies_worktree_with_live_worker_as_in_use(self):
        worker = {'projection': {'liveness': {'verdict': 'live'}}, 'resource': {'worktreeId': str(self.worktree_path)}}
        result = clean_worktrees.classify_worktree(self.worktree(), [worker], [], self.root)
        self.assertEqual(result.group, 'en uso')

    def test_classifies_worktree_with_terminal_as_in_use(self):
        terminal = {'worktreePath': str(self.worktree_path / 'child')}
        result = clean_worktrees.classify_worktree(self.worktree(), [], [terminal], self.root)
        self.assertEqual(result.group, 'en uso')

    def test_worker_cli_failure_marks_all_worktrees_in_use(self):
        with mock.patch.object(clean_worktrees, 'load_workers', side_effect=clean_worktrees.CommandFailure('fallo')):
            result = clean_worktrees.load_activity()
        self.assertTrue(result.unknown)

    def test_classifies_missing_path(self):
        result = clean_worktrees.classify_worktree(self.worktree(self.root / 'missing'), [], [], self.root)
        self.assertEqual(result.group, 'no existe')

    def test_classifies_tracked_changes_and_untracked_files(self):
        with mock.patch.object(clean_worktrees, 'git_output', return_value=' M file.txt\n?? new.txt\n'):
            result = clean_worktrees.classify_worktree(self.worktree(), [], [], self.root)
        self.assertEqual(result.group, 'con cosas sin guardar')
        self.assertIn('file.txt', result.reason)
        self.assertIn('new.txt', result.reason)

    def test_classifies_unmerged_head_with_commit_count(self):
        with mock.patch.object(clean_worktrees, 'git_output', return_value=''), mock.patch.object(
            clean_worktrees, 'is_ancestor', return_value=False
        ), mock.patch.object(clean_worktrees, 'missing_commit_count', return_value=3):
            result = clean_worktrees.classify_worktree(self.worktree(), [], [], self.root)
        self.assertEqual(result.group, 'sin fusionar')
        self.assertIn('3', result.reason)

    def test_classifies_merged_clean_worktree_as_deletable(self):
        with mock.patch.object(clean_worktrees, 'git_output', return_value=''), mock.patch.object(
            clean_worktrees, 'is_ancestor', return_value=True
        ):
            result = clean_worktrees.classify_worktree(self.worktree(), [], [], self.root)
        self.assertEqual(result.group, 'se puede borrar')

    def test_reports_sibling_directories_not_registered(self):
        registered = self.worktree()
        loose_directory = self.root / 'loose'
        loose_directory.mkdir()
        result = clean_worktrees.find_loose_directories([registered], self.root)
        self.assertEqual(result, [loose_directory])

    def test_dry_run_never_calls_worktree_remove(self):
        with mock.patch.object(clean_worktrees, 'collect_snapshot') as collect_snapshot, mock.patch.object(
            clean_worktrees, 'run_orca'
        ) as run_orca:
            collect_snapshot.return_value = clean_worktrees.Snapshot([], [], [], self.root)
            self.assertEqual(clean_worktrees.main([]), 0)
        run_orca.assert_not_called()

    def test_apply_removes_only_deletable_worktrees_without_force(self):
        deletable = clean_worktrees.Classification(self.worktree(), 'se puede borrar', 'limpio')
        with mock.patch.object(clean_worktrees, 'collect_snapshot') as collect_snapshot, mock.patch.object(
            clean_worktrees, 'classify_worktree', return_value=deletable
        ), mock.patch.object(clean_worktrees, 'git_output', return_value=''), mock.patch.object(
            clean_worktrees, 'run_orca', return_value={'ok': True, 'result': {'removed': True}}
        ) as run_orca:
            collect_snapshot.return_value = clean_worktrees.Snapshot([self.worktree()], [], [], self.root)
            self.assertEqual(clean_worktrees.main(['--apply']), 0)
        command = run_orca.call_args.args
        self.assertIn('rm', command)
        self.assertNotIn('--force', command)

    def test_failed_removal_does_not_stop_later_removals(self):
        classifications = [
            clean_worktrees.Classification(self.worktree(self.root / 'one'), 'se puede borrar', 'limpio'),
            clean_worktrees.Classification(self.worktree(self.root / 'two'), 'se puede borrar', 'limpio'),
        ]
        paths = [Path(item['path']) for item in [classification.worktree for classification in classifications]]
        for path in paths:
            path.mkdir()
        with mock.patch.object(clean_worktrees, 'collect_snapshot') as collect_snapshot, mock.patch.object(
            clean_worktrees, 'classify_worktree', side_effect=classifications
        ), mock.patch.object(clean_worktrees, 'git_output', return_value=''), mock.patch.object(
            clean_worktrees, 'run_orca', side_effect=[clean_worktrees.CommandFailure('fallo'), {'ok': True, 'result': {'removed': True}}]
        ) as run_orca:
            collect_snapshot.return_value = clean_worktrees.Snapshot(
                [item.worktree for item in classifications], [], [], self.root
            )
            self.assertEqual(clean_worktrees.main(['--apply']), 1)
        self.assertEqual(run_orca.call_count, 2)

    def test_apply_skips_worktree_that_gains_changes(self):
        classification = clean_worktrees.Classification(self.worktree(), 'se puede borrar', 'limpio')
        with mock.patch.object(clean_worktrees, 'collect_snapshot') as collect_snapshot, mock.patch.object(
            clean_worktrees, 'classify_worktree', return_value=classification
        ), mock.patch.object(clean_worktrees, 'git_output', return_value='?? new.txt'), mock.patch.object(
            clean_worktrees, 'run_orca'
        ) as run_orca:
            collect_snapshot.return_value = clean_worktrees.Snapshot([self.worktree()], [], [], self.root)
            self.assertEqual(clean_worktrees.main(['--apply']), 0)
        run_orca.assert_not_called()


if __name__ == '__main__':
    unittest.main()
