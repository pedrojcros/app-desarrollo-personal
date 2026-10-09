import datetime
import os
import tempfile
from pathlib import Path
import unittest
from unittest import mock

from scripts.orca import supervise_workers
from scripts.orca.supervise_workers import (
    detect_model_capacity,
    detect_usage_limit,
    is_worker_waiting_for_quota,
    parse_retry_time,
    should_retry_capacity,
)

WORKER = {'dispatchId': 'dispatch-1', 'agentTerminalHandle': 'terminal-1'}
OLD_HISTORY = '\n'.join(f'old output line {number}' for number in range(30))
QUOTA_SCREEN = "You've hit your usage limit. Try again at {time}\n2. Keep current model"
START = datetime.datetime(2026, 10, 7, 16, 0)
ONE_ROUND = datetime.timedelta(seconds=20)


def setUpModule():
    temporary_directory = tempfile.TemporaryDirectory()
    unittest.addModuleCleanup(temporary_directory.cleanup)
    incident_path = Path(temporary_directory.name) / 'incidents.jsonl'
    environment_patch = mock.patch.dict(
        os.environ, {'ADP_INCIDENTS_FILE': str(incident_path)}
    )
    environment_patch.start()
    unittest.addModuleCleanup(environment_patch.stop)


class SupervisorIsolationTests(unittest.TestCase):
    def test_incident_writes_are_redirected_to_module_temporary_directory(self):
        incident_file = os.environ.get('ADP_INCIDENTS_FILE')
        self.assertIsNotNone(incident_file)
        incident_path = Path(incident_file)
        self.assertTrue(incident_path.parent.is_dir())
        self.assertTrue(incident_path.parent.is_relative_to(Path(tempfile.gettempdir())))
        supervise_workers.append_supervisor_incident(
            'tool', 0, 'ejemplo', 'ejemplo', WORKER
        )
        self.assertTrue(incident_path.is_file())


class SupervisorScreenTests(unittest.TestCase):
    def test_detects_model_capacity_message(self):
        self.assertTrue(detect_model_capacity('Selected model is at capacity'))

    def test_detects_usage_limit_message(self):
        screen_text = "You've hit your usage limit. Try again at 18:55\n2. Keep current model"
        self.assertTrue(detect_usage_limit(screen_text))

    def test_detects_usage_limit_without_readable_time(self):
        screen_text = "You've hit your usage limit. The retry time is unavailable."
        self.assertFalse(detect_usage_limit(screen_text))
        self.assertIsNone(parse_retry_time(screen_text, datetime.datetime(2026, 10, 7, 16, 0)))

    def test_detects_usage_limit_without_menu_option(self):
        screen_text = "You've hit your usage limit. Try again at 18:55"
        self.assertTrue(detect_usage_limit(screen_text))

    def test_reads_24_hour_retry_time(self):
        current_time = datetime.datetime(2026, 10, 7, 16, 0)
        retry_time = parse_retry_time("You've hit your usage limit. Try again at 18:55", current_time)
        self.assertEqual(retry_time, datetime.datetime(2026, 10, 7, 18, 55))

    def test_reads_12_hour_retry_time(self):
        current_time = datetime.datetime(2026, 10, 7, 16, 0)
        retry_time = parse_retry_time("You've hit your usage limit. Try again at 6:55 PM", current_time)
        self.assertEqual(retry_time, datetime.datetime(2026, 10, 7, 18, 55))

    def test_reads_retry_time_with_ordinal_date_and_line_break_in_url(self):
        screen_text = (
            "You've hit your usage limit. Upgrade to Pro "
            "(https://chatgpt.com/explore/pro), visit https://chatgpt.com/settings/\n"
            "usage to purchase more credits or try again at Oct 8th, 2026 2:09 AM."
        )
        retry_time = parse_retry_time(screen_text, START)
        self.assertEqual(retry_time, datetime.datetime(2026, 10, 8, 2, 9))

    def test_reads_retry_time_with_full_month_and_24_hour_clock(self):
        retry_time = parse_retry_time(
            "Try again at October 8, 2026 14:09",
            START,
        )
        self.assertEqual(retry_time, datetime.datetime(2026, 10, 8, 14, 9))

    def test_keeps_explicit_retry_date_even_when_it_has_passed(self):
        current_time = datetime.datetime(2026, 10, 8, 16, 0)
        retry_time = parse_retry_time(
            "Try again at Oct 8th, 2026 2:09 AM",
            current_time,
        )
        self.assertEqual(retry_time, datetime.datetime(2026, 10, 8, 2, 9))

    def test_reads_english_month_abbreviations_and_ordinal_suffixes(self):
        retry_cases = (
            ('Try again at Jan 1st, 2026 14:09', datetime.datetime(2026, 1, 1, 14, 9)),
            ('Try again at Feb 2nd, 2026 14:09', datetime.datetime(2026, 2, 2, 14, 9)),
            ('Try again at Mar 3rd, 2026 14:09', datetime.datetime(2026, 3, 3, 14, 9)),
            ('Try again at Sept 4th, 2026 14:09', datetime.datetime(2026, 9, 4, 14, 9)),
        )
        for retry_text, expected_time in retry_cases:
            with self.subTest(retry_text=retry_text):
                self.assertEqual(parse_retry_time(retry_text, START), expected_time)

    def test_moves_passed_retry_time_to_tomorrow(self):
        current_time = datetime.datetime(2026, 10, 7, 19, 0)
        retry_time = parse_retry_time("Try again at 6:55 PM", current_time)
        self.assertEqual(retry_time, datetime.datetime(2026, 10, 8, 18, 55))

    def test_capacity_retry_respects_cooldown_and_limit(self):
        current_time = datetime.datetime(2026, 10, 7, 16, 10)
        self.assertFalse(should_retry_capacity(current_time, current_time - datetime.timedelta(minutes=4), 1))
        self.assertTrue(should_retry_capacity(current_time, current_time - datetime.timedelta(minutes=5), 2))
        self.assertFalse(should_retry_capacity(current_time, current_time - datetime.timedelta(minutes=5), 3))

    def test_quota_wait_is_not_idle(self):
        self.assertTrue(is_worker_waiting_for_quota(datetime.datetime(2026, 10, 7, 18, 55, 59), datetime.datetime(2026, 10, 7, 18, 55)))
        self.assertFalse(is_worker_waiting_for_quota(datetime.datetime(2026, 10, 7, 18, 56), datetime.datetime(2026, 10, 7, 18, 55)))
        self.assertTrue(is_worker_waiting_for_quota(datetime.datetime(2026, 10, 7, 18, 54), datetime.datetime(2026, 10, 7, 18, 55)))
        self.assertFalse(is_worker_waiting_for_quota(datetime.datetime(2026, 10, 7, 18, 57), datetime.datetime(2026, 10, 7, 18, 55)))


class SupervisorCurrentSituationTests(unittest.TestCase):
    def setUp(self):
        send_patcher = mock.patch.object(supervise_workers, 'send_to_terminal')
        self.send_to_terminal = send_patcher.start()
        self.addCleanup(send_patcher.stop)
        self.worker_states = {}

    def run_round(self, screen_text, current_time):
        return supervise_workers.handle_codex_wait(WORKER, screen_text, self.worker_states, current_time)

    def sent_texts(self):
        return [call.args for call in self.send_to_terminal.call_args_list if call.args[1] == '--text']

    def test_old_capacity_warning_in_history_is_ignored_while_screen_changes(self):
        for round_number in range(5):
            screen_text = f"Selected model is at capacity\n{OLD_HISTORY}\nworking, step {round_number}"
            outcome = self.run_round(screen_text, START + round_number * ONE_ROUND)
            self.assertEqual(outcome.status, supervise_workers.CodexStatus.NOTHING)
        self.assertEqual(self.sent_texts(), [])

    def test_recent_capacity_warning_on_still_screen_continues_worker(self):
        screen_text = f"{OLD_HISTORY}\nSelected model is at capacity"
        first_outcome = self.run_round(screen_text, START)
        second_outcome = self.run_round(screen_text, START + ONE_ROUND)
        self.assertEqual(first_outcome.status, supervise_workers.CodexStatus.NOTHING)
        self.assertEqual(second_outcome.status, supervise_workers.CodexStatus.ACTED)
        self.assertEqual(self.sent_texts(), [('terminal-1', '--text', 'continúa')])

    def wait_for_quota_and_resume(self):
        screen_text = QUOTA_SCREEN.format(time='18:55')
        self.run_round(screen_text, START)
        self.run_round(screen_text, START + ONE_ROUND)
        resume_time = datetime.datetime(2026, 10, 7, 18, 57)
        return self.run_round(screen_text, resume_time)

    def test_quota_wait_resumes_worker_and_forgets_its_state(self):
        outcome = self.wait_for_quota_and_resume()
        self.assertEqual(outcome.status, supervise_workers.CodexStatus.ACTED)
        self.assertEqual(self.worker_states['dispatch-1'], {})

    def test_quota_with_menu_selects_model_and_resumes_after_delay(self):
        screen_text = QUOTA_SCREEN.format(time='18:55')
        self.run_round(screen_text, START)
        self.run_round(screen_text, START + ONE_ROUND)
        outcome = self.run_round(
            screen_text,
            datetime.datetime(2026, 10, 7, 18, 56),
        )
        self.assertEqual(outcome.status, supervise_workers.CodexStatus.ACTED)
        self.assertEqual(
            self.sent_texts(),
            [
                ('terminal-1', '--text', '2'),
                ('terminal-1', '--text', 'continúa'),
            ],
        )

    def test_quota_without_menu_waits_and_resumes_after_delay(self):
        screen_text = (
            "■ You’ve hit your usage limit. Upgrade to Pro "
            "(https://chatgpt.com/explore/pro), visit https://chatgpt.com/settings/\n"
            "usage to purchase more credits or try again at Oct 8th, 2026 2:09 AM.\n"
            "› Ask Codex to do anything"
        )
        self.run_round(screen_text, START)
        waiting_outcome = self.run_round(screen_text, START + ONE_ROUND)
        self.assertEqual(waiting_outcome.status, supervise_workers.CodexStatus.ACTED)
        self.assertEqual(self.sent_texts(), [])

        retry_time = self.worker_states['dispatch-1']['quota_retry_time']
        self.assertEqual(retry_time, datetime.datetime(2026, 10, 8, 2, 9))
        waiting_time = datetime.datetime(2026, 10, 8, 2, 9)
        waiting_outcome = self.run_round(screen_text, waiting_time)
        self.assertEqual(waiting_outcome.status, supervise_workers.CodexStatus.WAITING)
        self.assertEqual(self.sent_texts(), [])

        resume_time = datetime.datetime(2026, 10, 8, 2, 10)
        outcome = self.run_round(screen_text, resume_time)
        self.assertEqual(outcome.status, supervise_workers.CodexStatus.ACTED)
        self.assertEqual(self.sent_texts(), [('terminal-1', '--text', 'continúa')])

    def test_new_quota_is_detected_after_resuming(self):
        self.wait_for_quota_and_resume()
        new_screen = f"{OLD_HISTORY}\n" + QUOTA_SCREEN.format(time='21:30')
        later = datetime.datetime(2026, 10, 7, 19, 0)
        self.run_round(new_screen, later)
        outcome = self.run_round(new_screen, later + ONE_ROUND)
        self.assertEqual(outcome.status, supervise_workers.CodexStatus.ACTED)
        retry_time = self.worker_states['dispatch-1']['quota_retry_time']
        self.assertEqual(retry_time, datetime.datetime(2026, 10, 7, 21, 30))

    def test_still_worker_is_reported_as_idle_after_resuming(self):
        self.wait_for_quota_and_resume()
        quiet_screen = {'tail': f"{OLD_HISTORY}\nsome other question"}
        screen_history = {}
        start_seconds = 1000.0
        problems = []
        for elapsed_minutes in (0, 1, 9):
            with mock.patch.object(supervise_workers, 'read_terminal', return_value=quiet_screen), \
                    mock.patch.object(supervise_workers.time, 'time', return_value=start_seconds + elapsed_minutes * 60):
                problem = supervise_workers.supervise_worker(
                    WORKER, '/repository', screen_history, {}, 8, self.worker_states
                )
            problems.append(problem)
        self.assertIsNone(problems[0])
        self.assertIsNone(problems[1])
        self.assertIn('minutos con la pantalla quieta', problems[2])


class SupervisorIncidentLoggingTests(unittest.TestCase):
    def setUp(self):
        self.incidents = mock.patch.object(supervise_workers, 'append_incident')
        self.append_incident = self.incidents.start()
        self.addCleanup(self.incidents.stop)

    def test_logs_unsent_assignment_as_environment_incident(self):
        worker = {
            'dispatchId': 'dispatch-1',
            'agentTerminalHandle': 'terminal-1',
            'resource': {'worktreeId': '/work/ADP-27'},
        }
        terminal = {'draft': 'encargo'}
        with mock.patch.object(supervise_workers, 'read_terminal', return_value=terminal), \
                mock.patch.object(supervise_workers, 'send_to_terminal'):
            supervise_workers.supervise_worker(worker, '/repository', {}, {}, 8, {})
        self.append_incident.assert_called_once()
        self.assertEqual(self.append_incident.call_args.kwargs['type'], 'environment')
        self.assertEqual(self.append_incident.call_args.kwargs['task'], 'ADP-27')

    def test_logs_idle_worker_with_elapsed_minutes(self):
        worker = {'dispatchId': 'dispatch-1', 'agentTerminalHandle': 'terminal-1'}
        terminal = {'tail': 'quiet terminal'}
        fingerprint = supervise_workers.hashlib.sha256(b'quiet terminal').hexdigest()
        screen_history = {'dispatch-1': (fingerprint, 1000.0)}
        with mock.patch.object(supervise_workers, 'read_terminal', return_value=terminal), \
                mock.patch.object(supervise_workers, 'time') as mocked_time:
            mocked_time.time.return_value = 1540.0
            supervise_workers.supervise_worker(worker, '/repository', screen_history, {}, 8, {})
        self.append_incident.assert_called_once()
        self.assertEqual(self.append_incident.call_args.kwargs['type'], 'stuck-agent')
        self.assertEqual(self.append_incident.call_args.kwargs['minutes'], 9)

    def test_incident_write_failure_does_not_interrupt_supervision(self):
        with mock.patch.object(supervise_workers, 'append_incident', side_effect=OSError('disk full')), \
                mock.patch('builtins.print') as mocked_print:
            supervise_workers.append_supervisor_incident(
                'tool', 1, 'test', '', {'dispatchId': 'dispatch-1'}
            )
        self.assertTrue(mocked_print.called)

    def test_logs_quota_wait_with_elapsed_minutes_after_resume(self):
        worker = {'dispatchId': 'dispatch-1', 'agentTerminalHandle': 'terminal-1'}
        worker_state = {
            'quota_retry_time': datetime.datetime(2026, 10, 7, 18, 55),
            'quota_started_at': datetime.datetime(2026, 10, 7, 16, 0),
        }
        current_time = datetime.datetime(2026, 10, 7, 18, 56)
        with mock.patch.object(supervise_workers, 'send_to_terminal'):
            outcome = supervise_workers.handle_quota_wait(worker, worker_state, current_time)
        self.assertEqual(outcome.status, supervise_workers.CodexStatus.ACTED)
        self.append_incident.assert_called_once()
        self.assertEqual(self.append_incident.call_args.kwargs['type'], 'quota')
        self.assertEqual(self.append_incident.call_args.kwargs['minutes'], 176)


if __name__ == '__main__':
    unittest.main()
