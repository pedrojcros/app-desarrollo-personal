import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name('report.py')


class IncidentReportTests(unittest.TestCase):
    def test_summarizes_types_causes_and_tasks_in_date_range(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            incidents_path = Path(temporary_directory) / 'incidents.jsonl'
            incidents = [
                {'date': '2026-10-02T10:00:00+02:00', 'type': 'quota', 'task': 'ADP-2', 'minutes': 30, 'cause': ' Cuota agotada ', 'fix': '', 'source': 'supervisor'},
                {'date': '2026-10-03T10:00:00+02:00', 'type': 'tool', 'task': 'ADP-2', 'minutes': 15, 'cause': 'cuota agotada', 'fix': '', 'source': 'orchestrator'},
                {'date': '2026-10-04T10:00:00+02:00', 'type': 'quota', 'task': 'ADP-3', 'minutes': 10, 'cause': 'otra causa', 'fix': '', 'source': 'orchestrator'},
                {'date': '2026-10-05T10:00:00+02:00', 'type': 'tool', 'task': 'ADP-9', 'minutes': 500, 'cause': 'fuera de fecha', 'fix': '', 'source': 'orchestrator'},
            ]
            incidents_path.write_text(
                ''.join(json.dumps(incident) + '\n' for incident in incidents),
                encoding='utf-8',
            )
            environment = dict(os.environ, ADP_INCIDENTS_FILE=str(incidents_path))
            result = subprocess.run(
                [sys.executable, str(SCRIPT), '--since', '2026-10-02', '--until', '2026-10-04'],
                capture_output=True,
                text=True,
                env=environment,
            )
        self.assertEqual(result.returncode, 0)
        self.assertIn('quota: 40 minutos', result.stdout)
        self.assertIn('tool: 15 minutos', result.stdout)
        self.assertIn('cuota agotada', result.stdout.lower())
        self.assertIn('ADP-2: 45 minutos', result.stdout)
        self.assertNotIn('ADP-9', result.stdout)
