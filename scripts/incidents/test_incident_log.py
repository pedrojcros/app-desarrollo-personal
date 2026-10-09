import json
import os
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest import mock

from scripts.incidents import incident_log


class IncidentLogTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.incidents_path = Path(self.temporary_directory.name) / 'incidents.jsonl'

    def test_append_writes_validated_incident_as_one_line(self):
        incident = incident_log.append_incident(
            path=self.incidents_path,
            date='2026-10-09T20:31:00+02:00',
            type='environment',
            task='ADP-27',
            minutes=20,
            cause='ADB perdió el emulador',
            fix='docker/android/reset',
            source='orchestrator',
        )
        lines = self.incidents_path.read_text(encoding='utf-8').splitlines()
        self.assertEqual(len(lines), 1)
        self.assertEqual(json.loads(lines[0]), incident)

    def test_rejects_invalid_type_and_negative_minutes(self):
        with self.assertRaises(ValueError):
            incident_log.append_incident(
                path=self.incidents_path,
                date='2026-10-09T20:31:00+02:00',
                type='unknown', task='', minutes=0, cause='x', fix='', source='orchestrator',
            )
        with self.assertRaises(ValueError):
            incident_log.append_incident(
                path=self.incidents_path,
                date='2026-10-09T20:31:00+02:00',
                type='tool', task='', minutes=-1, cause='x', fix='', source='orchestrator',
            )

    def test_reads_valid_lines_and_counts_invalid_lines(self):
        self.incidents_path.write_text('{bad json}\n{"type":"tool"}\n', encoding='utf-8')
        records, invalid_count = incident_log.read_incidents(self.incidents_path)
        self.assertEqual(records, [])
        self.assertEqual(invalid_count, 2)

    def test_environment_variable_overrides_default_path(self):
        with mock.patch.dict(os.environ, {'ADP_INCIDENTS_FILE': str(self.incidents_path)}):
            self.assertEqual(incident_log.incidents_file_path(), self.incidents_path)

    def test_requires_timezone_in_date(self):
        with self.assertRaises(ValueError):
            incident_log.append_incident(
                path=self.incidents_path,
                date='2026-10-09T20:31:00',
                type='tool', task='', minutes=0, cause='x', fix='', source='orchestrator',
            )
