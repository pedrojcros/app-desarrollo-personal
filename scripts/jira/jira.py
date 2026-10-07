#!/usr/bin/env python3
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path


DEFAULT_EMAIL = "pedrojcros@gmail.com"
DEFAULT_CLOUD_ID = "490863fe-a6c1-4134-913e-c2470cb7c508"
SECRETS_PATH = Path.home() / ".config/app-desarrollo-personal/secretos.env"
ISSUE_KEY_PATTERN = re.compile(r"(?<![A-Za-z0-9])ADP-\d+(?![A-Za-z0-9])")
TRANSITIONS = {
    "por-hacer": ("11", "Por hacer"),
    "en-curso": ("21", "En curso"),
    "en-revision": ("2", "En revisión"),
    "listo": ("31", "Listo"),
}
AGENT_LABELS = {"codex", "claude", "copilot"}


class JiraError(Exception):
    pass


def read_secret_file():
    secrets = {}
    try:
        lines = SECRETS_PATH.read_text(encoding="utf-8").splitlines()
    except FileNotFoundError:
        return secrets
    except OSError as error:
        raise JiraError("Could not read the Jira secrets file.") from error

    for line in lines:
        stripped_line = line.strip()
        if not stripped_line or stripped_line.startswith("#") or "=" not in stripped_line:
            continue

        name, value = stripped_line.split("=", 1)
        secrets[name.strip()] = remove_surrounding_quotes(value.strip())

    return secrets


def remove_surrounding_quotes(value):
    if len(value) < 2:
        return value
    if value[0] not in {"'", '"'}:
        return value
    if value[-1] != value[0]:
        return value
    return value[1:-1]


def load_configuration():
    file_secrets = read_secret_file()
    email = os.environ.get("JIRA_EMAIL")
    if not email:
        email = file_secrets.get("JIRA_EMAIL")
    if not email:
        email = DEFAULT_EMAIL

    api_token = os.environ.get("JIRA_API_TOKEN") or file_secrets.get("JIRA_API_TOKEN")
    cloud_id = os.environ.get("JIRA_CLOUD_ID") or file_secrets.get("JIRA_CLOUD_ID")
    if not cloud_id:
        cloud_id = DEFAULT_CLOUD_ID
    if not api_token:
        raise JiraError("JIRA_API_TOKEN is required in the environment or secrets file.")
    return email, api_token, cloud_id


class JiraClient:
    def __init__(self, email, api_token, cloud_id):
        self.base_url = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3"
        credentials = f"{email}:{api_token}".encode("utf-8")
        encoded_credentials = base64.b64encode(credentials).decode("ascii")
        self.authorization = f"Basic {encoded_credentials}"

    def request_json(self, method, endpoint, payload=None):
        request_headers = {
            "Accept": "application/json",
            "Authorization": self.authorization,
        }
        request_body = None
        if payload is not None:
            request_headers["Content-Type"] = "application/json"
            request_body = json.dumps(payload).encode("utf-8")

        request = urllib.request.Request(
            f"{self.base_url}{endpoint}",
            data=request_body,
            headers=request_headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                response_body = response.read()
        except urllib.error.HTTPError as error:
            raise JiraError(f"Jira returned HTTP {error.code}.") from None
        except urllib.error.URLError:
            raise JiraError("Could not connect to Jira.") from None

        if not response_body:
            return {}
        try:
            return json.loads(response_body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise JiraError("Jira returned an invalid JSON response.") from None


def validate_issue_key(issue_key):
    if not re.fullmatch(r"ADP-\d+", issue_key):
        raise JiraError("Issue key must use the format ADP-123.")


def extract_issue_key(branch, title=""):
    branch_match = ISSUE_KEY_PATTERN.search(branch)
    if branch_match:
        return branch_match.group(0)

    title_match = ISSUE_KEY_PATTERN.search(title)
    if title_match:
        return title_match.group(0)
    return ""


def get_issue(client, issue_key, fields):
    field_query = ",".join(fields)
    return client.request_json(
        "GET",
        f"/issue/{issue_key}?fields={field_query}",
    )


def get_issue_status(client, issue_key):
    issue = get_issue(client, issue_key, ["status"])
    return issue["fields"]["status"]["name"]


def move_issue(client, issue_key, transition_id, target_status):
    current_status = get_issue_status(client, issue_key)
    if current_status == target_status:
        return current_status

    client.request_json(
        "POST",
        f"/issue/{issue_key}/transitions",
        {"transition": {"id": transition_id}},
    )
    return target_status


def update_agent_label(client, issue_key, selected_agent):
    issue = get_issue(client, issue_key, ["labels"])
    labels = issue["fields"]["labels"]
    retained_labels = [label for label in labels if label not in AGENT_LABELS]
    if selected_agent not in retained_labels:
        retained_labels.append(selected_agent)

    client.request_json(
        "PUT",
        f"/issue/{issue_key}",
        {"fields": {"labels": retained_labels}},
    )


def add_comment(client, issue_key, text):
    comment_document = {
        "type": "doc",
        "version": 1,
        "content": [
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": text}],
            }
        ],
    }
    client.request_json(
        "POST",
        f"/issue/{issue_key}/comment",
        {"body": comment_document},
    )


def print_issue_result(issue_key, result):
    print(f"{issue_key} → {result}")


def run_command(arguments, client):
    command = arguments[0]
    if command == "extract":
        if len(arguments) not in {2, 3}:
            raise JiraError("Usage: jira.py extract BRANCH [TITLE].")
        title = ""
        if len(arguments) == 3:
            title = arguments[2]
        issue_key = extract_issue_key(arguments[1], title)
        if issue_key:
            print(issue_key)
        return

    if len(arguments) < 2:
        raise JiraError("An issue key is required.")
    issue_key = arguments[1]
    validate_issue_key(issue_key)

    if command == "status" and len(arguments) == 2:
        print_issue_result(issue_key, get_issue_status(client, issue_key))
        return

    if command == "move" and len(arguments) == 3:
        target = arguments[2]
        if target not in TRANSITIONS:
            raise JiraError(
                "Move target must be por-hacer, en-curso, en-revision, or listo."
            )
        transition_id, target_status = TRANSITIONS[target]
        updated_status = move_issue(client, issue_key, transition_id, target_status)
        print_issue_result(issue_key, updated_status)
        return

    if command == "agent" and len(arguments) == 3:
        selected_agent = arguments[2]
        if selected_agent not in AGENT_LABELS:
            raise JiraError("Agent must be codex, claude, or copilot.")
        update_agent_label(client, issue_key, selected_agent)
        print_issue_result(issue_key, selected_agent)
        return

    if command == "comment" and len(arguments) == 3:
        add_comment(client, issue_key, arguments[2])
        print_issue_result(issue_key, "comentario añadido")
        return

    raise JiraError(
        "Usage: jira.py move|agent|comment|status ISSUE_KEY [VALUE]."
    )


def main(arguments=None):
    if arguments is None:
        arguments = sys.argv[1:]
    if not arguments:
        print("A Jira command is required.", file=sys.stderr)
        return 2
    if arguments[0] == "extract":
        try:
            run_command(arguments, None)
        except JiraError as error:
            print(str(error), file=sys.stderr)
            return 2
        return 0

    try:
        email, api_token, cloud_id = load_configuration()
        client = JiraClient(email, api_token, cloud_id)
        run_command(arguments, client)
    except JiraError as error:
        print(str(error), file=sys.stderr)
        return 1
    except (KeyError, IndexError, TypeError):
        print("Jira returned an unexpected response.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
