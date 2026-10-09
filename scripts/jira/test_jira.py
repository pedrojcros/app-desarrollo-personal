import contextlib
import io
import json
import os
import unittest
import urllib.error
from unittest import mock

import jira


class JiraScriptTests(unittest.TestCase):
    def test_extracts_issue_key_from_branch_before_title(self):
        issue_key = jira.extract_issue_key(
            "feature/ADP-123-description",
            "ADP-456 another ticket",
        )

        self.assertEqual(issue_key, "ADP-123")

    def test_extracts_issue_key_from_title_when_branch_has_none(self):
        issue_key = jira.extract_issue_key(
            "feature/no-ticket",
            "Add support for ADP-456",
        )

        self.assertEqual(issue_key, "ADP-456")

    def test_agent_command_removes_other_agent_labels(self):
        current_issue = {"fields": {"labels": ["urgent", "claude", "release"]}}
        responses = [
            io.BytesIO(json.dumps(current_issue).encode()),
            io.BytesIO(b""),
        ]
        with mock.patch.object(jira.urllib.request, "urlopen", side_effect=responses) as urlopen:
            with mock.patch.dict(
                os.environ,
                {
                    "JIRA_EMAIL": "worker@example.com",
                    "JIRA_API_TOKEN": "sensitive-token",
                    "JIRA_CLOUD_ID": "cloud-id",
                },
            ):
                with contextlib.redirect_stdout(io.StringIO()) as output:
                    result = jira.main(["agent", "ADP-12", "codex"])

        self.assertEqual(result, 0)
        self.assertEqual(output.getvalue().strip(), "ADP-12 → codex")
        update_request = urlopen.call_args_list[1].args[0]
        updated_fields = json.loads(update_request.data)["fields"]
        self.assertEqual(
            updated_fields["labels"],
            ["urgent", "release", "codex"],
        )

    def test_move_succeeds_when_issue_is_already_in_target_status(self):
        issue = {"fields": {"status": {"name": "En curso"}}}
        response = io.BytesIO(json.dumps(issue).encode())
        with mock.patch.object(jira.urllib.request, "urlopen", return_value=response) as urlopen:
            with mock.patch.dict(
                os.environ,
                {
                    "JIRA_EMAIL": "worker@example.com",
                    "JIRA_API_TOKEN": "sensitive-token",
                    "JIRA_CLOUD_ID": "cloud-id",
                },
            ):
                with contextlib.redirect_stdout(io.StringIO()) as output:
                    result = jira.main(["move", "ADP-12", "en-curso"])

        self.assertEqual(result, 0)
        self.assertEqual(output.getvalue().strip(), "ADP-12 → En curso")
        self.assertEqual(urlopen.call_count, 1)

    def test_http_error_does_not_print_api_token(self):
        api_token = "sensitive-token"
        http_error = urllib.error.HTTPError(
            "https://api.atlassian.com/jira",
            401,
            "Unauthorized",
            {},
            io.BytesIO(b'{"errorMessages":["Authentication failed"]}'),
        )
        with mock.patch.object(
            jira.urllib.request,
            "urlopen",
            side_effect=http_error,
        ):
            with mock.patch.dict(
                os.environ,
                {
                    "JIRA_EMAIL": "worker@example.com",
                    "JIRA_API_TOKEN": api_token,
                    "JIRA_CLOUD_ID": "cloud-id",
                },
            ):
                with contextlib.redirect_stdout(io.StringIO()) as output:
                    with contextlib.redirect_stderr(io.StringIO()) as errors:
                        result = jira.main(["status", "ADP-12"])

        self.assertNotEqual(result, 0)
        self.assertNotIn(api_token, output.getvalue())
        self.assertNotIn(api_token, errors.getvalue())

    def test_missing_email_reports_configuration_error(self):
        with mock.patch.dict(os.environ, {"JIRA_API_TOKEN": "sensitive-token"}, clear=True):
            with mock.patch.object(jira, "read_secret_file", return_value={}):
                with contextlib.redirect_stderr(io.StringIO()) as errors:
                    result = jira.main(["status", "ADP-12"])

        self.assertNotEqual(result, 0)
        self.assertIn("JIRA_EMAIL is required", errors.getvalue())


if __name__ == "__main__":
    unittest.main()
