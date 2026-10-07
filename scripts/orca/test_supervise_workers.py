import datetime
import unittest

from scripts.orca.supervise_workers import (
    detect_model_capacity,
    detect_usage_limit,
    is_worker_waiting_for_quota,
    parse_retry_time,
    should_retry_capacity,
)


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


if __name__ == '__main__':
    unittest.main()
