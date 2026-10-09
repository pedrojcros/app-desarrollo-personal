import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT_PATH = Path(__file__).with_name('measure.py')
TEST_DATA_PATH = Path(__file__).with_name('test_data')


class MeasureCommandTests(unittest.TestCase):
    def run_measure(self, *arguments, environment=None):
        process_environment = os.environ.copy()
        process_environment.update(environment or {})
        return subprocess.run(
            [sys.executable, str(SCRIPT_PATH), *arguments],
            capture_output=True,
            check=False,
            text=True,
            env=process_environment,
        )

    def test_task_sums_session_usage_and_reports_pull_request_duration(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            source_path = Path(temporary_directory)
            (source_path / 'codex').mkdir()
            (source_path / 'claude').mkdir()
            (source_path / 'codex' / 'codex.jsonl').write_bytes(
                (TEST_DATA_PATH / 'codex_session.jsonl').read_bytes()
            )
            (source_path / 'claude' / 'claude.jsonl').write_bytes(
                (TEST_DATA_PATH / 'claude_session.jsonl').read_bytes()
            )
            pull_requests_path = source_path / 'pull_requests.json'
            pull_requests_path.write_text(
                json.dumps([
                    {
                        'number': 70,
                        'title': 'ADP-16: ejemplo',
                        'createdAt': '2026-10-01T10:00:00Z',
                        'mergedAt': '2026-10-01T11:00:00Z',
                        'headRefName': 'pedrojcros/ADP-16-ejemplo',
                    }
                ]),
                encoding='utf-8',
            )
            incident_path = source_path / 'incidents.jsonl'
            incident_path.write_text(
                json.dumps({
                    'date': '2026-10-01T09:00:00+00:00',
                    'type': 'tool',
                    'task': 'ADP-16',
                    'minutes': 12,
                    'cause': 'fallo de ejemplo',
                    'fix': 'arreglo de ejemplo',
                    'source': 'orchestrator',
                }) + '\n',
                encoding='utf-8',
            )
            result = self.run_measure(
                'task',
                'ADP-16',
                environment={
                    'ADP_CODEX_SESSIONS': str(source_path / 'codex'),
                    'ADP_CLAUDE_SESSIONS': str(source_path / 'claude'),
                    'ADP_PULL_REQUESTS_FILE': str(pull_requests_path),
                    'ADP_INCIDENTS_FILE': str(incident_path),
                },
            )

        self.assertEqual(result.returncode, 0)
        self.assertIn('gpt-6-luna', result.stdout)
        self.assertIn('claude-sonnet-4-5', result.stdout)
        self.assertIn('700 nuevos', result.stdout)
        self.assertIn('500 nuevos', result.stdout)
        self.assertIn('2.100', result.stdout)
        self.assertIn('Minutos perdidos: 12', result.stdout)
        self.assertIn('PR #70', result.stdout)

    def test_task_jira_output_is_one_short_line_in_spanish(self):
        result = self.run_measure(
            'task',
            'ADP-99',
            '--jira',
            environment={
                'ADP_CODEX_SESSIONS': str(TEST_DATA_PATH / 'missing-codex'),
                'ADP_CLAUDE_SESSIONS': str(TEST_DATA_PATH / 'missing-claude'),
                'ADP_PULL_REQUESTS_FILE': str(TEST_DATA_PATH / 'missing-prs.json'),
            },
        )

        self.assertEqual(result.returncode, 0)
        self.assertEqual(len(result.stdout.strip().splitlines()), 1)
        self.assertTrue(result.stdout.startswith('Medida:'))

    def test_sessions_lists_claude_activity_since_requested_date(self):
        result = self.run_measure(
            'sessions',
            '--since',
            '2026-10-01',
            '--folder',
            '/work/ADP-16-task',
            environment={
                'ADP_CLAUDE_SESSIONS': str(TEST_DATA_PATH),
            },
        )

        self.assertEqual(result.returncode, 0)
        self.assertIn('claude-sonnet-4-5', result.stdout)
        self.assertIn('500 nuevos', result.stdout)
        self.assertIn('media 1.050', result.stdout.lower())

    def test_missing_source_is_reported_without_failing_other_sources(self):
        result = self.run_measure(
            'task',
            'ADP-99',
            environment={
                'ADP_CODEX_SESSIONS': str(TEST_DATA_PATH / 'missing-codex'),
                'ADP_CLAUDE_SESSIONS': str(TEST_DATA_PATH / 'missing-claude'),
                'ADP_PULL_REQUESTS_FILE': str(TEST_DATA_PATH / 'missing-prs.json'),
            },
        )

        self.assertEqual(result.returncode, 0)
        self.assertIn('no existe', result.stderr.lower())


if __name__ == '__main__':
    unittest.main()
