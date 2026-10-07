import datetime
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

    def test_requires_menu_option_to_keep_current_model(self):
        screen_text = "You've hit your usage limit. Try again at 18:55"
        self.assertFalse(detect_usage_limit(screen_text))

    def test_reads_24_hour_retry_time(self):
        current_time = datetime.datetime(2026, 10, 7, 16, 0)
        retry_time = parse_retry_time("You've hit your usage limit. Try again at 18:55", current_time)
        self.assertEqual(retry_time, datetime.datetime(2026, 10, 7, 18, 55))

    def test_reads_12_hour_retry_time(self):
        current_time = datetime.datetime(2026, 10, 7, 16, 0)
        retry_time = parse_retry_time("You've hit your usage limit. Try again at 6:55 PM", current_time)
        self.assertEqual(retry_time, datetime.datetime(2026, 10, 7, 18, 55))

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


if __name__ == '__main__':
    unittest.main()
