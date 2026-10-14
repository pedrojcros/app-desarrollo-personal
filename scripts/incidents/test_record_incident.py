import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name('record_incident.py')


class RecordIncidentTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.incidents_path = Path(self.temporary_directory.name) / 'incidents.jsonl'
        self.environment = dict(os.environ, ADP_INCIDENTS_FILE=str(self.incidents_path))

    def run_script(self, *arguments):
        return subprocess.run(
            [sys.executable, str(SCRIPT), *arguments],
            capture_output=True,
            text=True,
            env=self.environment,
        )

    def test_records_incident_and_confirms(self):
        result = self.run_script('--type', 'environment', '--minutes', '20', '--cause', 'ADB perdido')
        self.assertEqual(result.returncode, 0)
        self.assertIn('Incidencia registrada', result.stdout)
        self.assertIn('"source": "orchestrator"', self.incidents_path.read_text(encoding='utf-8'))

    def test_invalid_type_exits_with_code_two(self):
        result = self.run_script('--type', 'unknown', '--minutes', '20', '--cause', 'fallo')
        self.assertEqual(result.returncode, 2)
        self.assertIn('tipo', result.stderr)

    def test_invalid_minutes_exits_with_code_two(self):
        result = self.run_script('--type', 'tool', '--minutes', '-2', '--cause', 'fallo')
        self.assertEqual(result.returncode, 2)
        self.assertIn('minutos', result.stderr)
