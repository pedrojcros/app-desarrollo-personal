"""Mide el uso local de modelos y el ciclo de vida de los encargos."""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import date, datetime
from pathlib import Path

from incident_log import read_incidents


def parse_arguments():
    parser = argparse.ArgumentParser(description='Mide sesiones y encargos locales.')
    commands = parser.add_subparsers(dest='command', required=True)
    task_parser = commands.add_parser('task', help='Resume un encargo ADP-NN.')
    task_parser.add_argument('task_key', type=validate_task_key)
    task_parser.add_argument('--jira', action='store_true')
    sessions_parser = commands.add_parser('sessions', help='Lista sesiones de Claude.')
    sessions_parser.add_argument('--since', required=True, type=date.fromisoformat)
    sessions_parser.add_argument('--folder', type=Path, default=repository_root())
    return parser.parse_args()


def validate_task_key(task_key):
    if re.fullmatch(r'ADP-\d+', task_key) is None:
        raise argparse.ArgumentTypeError('La tarea debe tener formato ADP-NN.')
    return task_key


def repository_root():
    completed = subprocess.run(
        ['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'],
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        return Path.cwd()
    common_directory = Path(completed.stdout.strip())
    return common_directory.parent


def read_json_lines(path):
    try:
        with path.open(encoding='utf-8') as source_file:
            for line in source_file:
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    print(f'Aviso: se omitió una línea JSON no válida en {path}', file=sys.stderr)
                    continue
                if isinstance(record, dict):
                    yield record
    except OSError as error:
        print(f'Aviso: no se pudo leer {path}: {error}', file=sys.stderr)
        return


def find_session_files(environment_name, default_path):
    path = Path(os.environ.get(environment_name, default_path))
    if not path.exists():
        print(f'Aviso: no existe la fuente {path}', file=sys.stderr)
        return []
    if path.is_file():
        return [path]
    return sorted(path.glob('**/*.jsonl'))


def read_codex_sessions(task_key):
    sessions_path = Path(os.environ.get('ADP_CODEX_SESSIONS', Path.home() / '.codex/sessions'))
    session_files = find_session_files('ADP_CODEX_SESSIONS', sessions_path)
    sessions = []
    for session_file in session_files:
        session = read_codex_session(session_file, task_key)
        if session is not None:
            sessions.append(session)
    return sessions


def read_codex_session(session_file, task_key):
    working_directory = ''
    model = 'desconocido'
    started_at = None
    latest_usage = None
    latest_activity = None
    for record in read_json_lines(session_file):
        payload = record.get('payload', {})
        if not isinstance(payload, dict):
            continue
        event_type = record.get('type')
        if event_type == 'session_meta':
            working_directory = payload.get('cwd', '')
            started_at = parse_datetime(record.get('timestamp'))
        if event_type == 'turn_context':
            model = payload.get('model', model)
        if event_type == 'event_msg':
            event_info = payload.get('info', {})
            if not isinstance(event_info, dict):
                continue
            usage = event_info.get('total_token_usage')
            if isinstance(usage, dict):
                latest_usage = usage
                latest_activity = parse_datetime(record.get('timestamp'))
    if not path_contains_task(working_directory, task_key) or latest_usage is None:
        return None
    return {
        'agent': 'Codex',
        'model': model,
        'session': session_file.stem,
        'started_at': started_at,
        'last_activity': latest_activity,
        'new_tokens': max(
            0,
            latest_usage.get('input_tokens', 0)
            - latest_usage.get('cached_input_tokens', 0),
        ),
        'read_tokens': latest_usage.get('cached_input_tokens', 0),
        'written_tokens': latest_usage.get('cache_write_input_tokens', 0),
        'steps': 0,
    }


def read_claude_sessions(task_key=None, folder=None, since=None):
    sessions_path = Path(os.environ.get('ADP_CLAUDE_SESSIONS', Path.home() / '.claude/projects'))
    session_files = find_session_files('ADP_CLAUDE_SESSIONS', sessions_path)
    sessions = []
    for session_file in session_files:
        session = read_claude_session(session_file, task_key, folder, since)
        if session is not None:
            sessions.append(session)
    return sessions


def read_claude_session(session_file, task_key, folder, since):
    session_id = session_file.stem
    working_directory = ''
    model = 'desconocido'
    activity_times = []
    new_tokens = 0
    read_tokens = 0
    written_tokens = 0
    steps = 0
    seen_message_ids = set()
    for record in read_json_lines(session_file):
        if record.get('type') != 'assistant' or record.get('isSidechain'):
            continue
        record_session_id = record.get('sessionId', record.get('session_id', session_id))
        if record_session_id != session_id:
            session_id = record_session_id
        working_directory = record.get('cwd', working_directory)
        message = record.get('message', {})
        if not isinstance(message, dict):
            continue
        message_id = message.get('id')
        if message_id is not None:
            if message_id in seen_message_ids:
                continue
            seen_message_ids.add(message_id)
        usage = message.get('usage', {})
        if not isinstance(usage, dict) or not usage:
            continue
        timestamp = parse_datetime(record.get('timestamp'))
        if timestamp is None:
            continue
        if since is not None:
            if timestamp.date() < since:
                continue
        activity_times.append(timestamp)
        model = message.get('model', model)
        new_tokens += usage.get('input_tokens', 0)
        read_tokens += usage.get('cache_read_input_tokens', 0)
        written_tokens += usage.get('cache_creation_input_tokens', 0)
        steps += 1
    if not activity_times:
        return None
    if task_key is not None and not path_contains_task(working_directory, task_key):
        return None
    if folder is not None and not is_same_folder(working_directory, folder):
        return None
    return {
        'agent': 'Claude',
        'model': model,
        'session': session_id,
        'started_at': min(activity_times),
        'last_activity': max(activity_times),
        'new_tokens': new_tokens,
        'read_tokens': read_tokens,
        'written_tokens': written_tokens,
        'steps': steps,
    }


def is_same_folder(working_directory, folder):
    try:
        return Path(working_directory).resolve() == folder.resolve()
    except OSError:
        return False


def path_contains_task(working_directory, task_key):
    task_pattern = rf'(?<![A-Z0-9]){re.escape(task_key)}(?![A-Z0-9])'
    return re.search(task_pattern, working_directory, re.IGNORECASE) is not None


def parse_datetime(value):
    if not value:
        return None
    try:
        parsed_value = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except (AttributeError, ValueError):
        return None
    return parsed_value


def format_number(value):
    return f'{value:,}'.replace(',', '.')


def format_elapsed(started_at, ended_at):
    if started_at is None or ended_at is None:
        return 'sin datos'
    elapsed_seconds = int((ended_at - started_at).total_seconds())
    elapsed_minutes = max(0, elapsed_seconds // 60)
    if elapsed_minutes < 60:
        return f'{elapsed_minutes} min'
    hours, minutes = divmod(elapsed_minutes, 60)
    if minutes == 0:
        return f'{hours} h'
    return f'{hours} h {minutes:02d} min'


def get_pull_requests(task_key):
    pull_requests_file = os.environ.get('ADP_PULL_REQUESTS_FILE')
    if pull_requests_file:
        try:
            with open(pull_requests_file, encoding='utf-8') as source_file:
                return json.load(source_file)
        except (OSError, json.JSONDecodeError) as error:
            print(f'Aviso: no se pudieron leer los PR: {error}', file=sys.stderr)
            return []
    completed = subprocess.run(
        ['gh', 'pr', 'list', '--state', 'all', '--search', task_key,
         '--json', 'number,title,createdAt,mergedAt,headRefName'],
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        print(f'Aviso: no se pudieron consultar los PR: {completed.stderr.strip()}', file=sys.stderr)
        return []
    try:
        return json.loads(completed.stdout)
    except json.JSONDecodeError:
        print('Aviso: la respuesta de GitHub no es JSON válido', file=sys.stderr)
        return []


def relevant_pull_requests(task_key):
    pull_requests = get_pull_requests(task_key)
    return [
        pull_request
        for pull_request in pull_requests
        if path_contains_task(pull_request.get('title', ''), task_key)
        or path_contains_task(pull_request.get('headRefName', ''), task_key)
    ]


def get_task_incidents(task_key):
    incidents, invalid_count = read_incidents()
    if invalid_count:
        print(f'Aviso: se omitieron {invalid_count} incidencias inválidas', file=sys.stderr)
    return [incident for incident in incidents if incident.get('task') == task_key]


def summarize_sessions(sessions):
    summaries = {}
    for session in sessions:
        key = (session['agent'], session['model'])
        if key not in summaries:
            summaries[key] = {
                'sessions': 0,
                'new_tokens': 0,
                'read_tokens': 0,
                'written_tokens': 0,
                'first_activity': session['started_at'],
                'last_activity': session['last_activity'],
            }
        summary = summaries[key]
        summary['sessions'] += 1
        summary['new_tokens'] += session['new_tokens']
        summary['read_tokens'] += session['read_tokens']
        summary['written_tokens'] += session['written_tokens']
        if session['started_at'] and (
            summary['first_activity'] is None
            or session['started_at'] < summary['first_activity']
        ):
            summary['first_activity'] = session['started_at']
        if session['last_activity'] and (
            summary['last_activity'] is None
            or session['last_activity'] > summary['last_activity']
        ):
            summary['last_activity'] = session['last_activity']
    return summaries


def print_task_report(task_key, jira):
    sessions = read_codex_sessions(task_key)
    sessions.extend(read_claude_sessions(task_key=task_key))
    pull_requests = relevant_pull_requests(task_key)
    incidents = get_task_incidents(task_key)
    incident_minutes = sum(incident.get('minutes', 0) for incident in incidents)
    summaries = summarize_sessions(sessions)
    if jira:
        print(format_jira_line(summaries, pull_requests, incident_minutes))
        return
    print(f'Medida del encargo {task_key}')
    if not summaries:
        print('Sesiones: no encontradas')
    for (agent, model), summary in sorted(summaries.items()):
        print(f"{agent} {model}: {summary['sessions']} sesiones · "
              f"{format_number(summary['new_tokens'])} nuevos / "
              f"{format_number(summary['read_tokens'])} releídos / "
              f"{format_number(summary['written_tokens'])} escritos")
        print(f"  Actividad: {format_timestamp(summary['first_activity'])} → "
              f"{format_timestamp(summary['last_activity'])}")
    print(f'PR encontrados: {len(pull_requests)}')
    for pull_request in pull_requests:
        created_at = parse_datetime(pull_request.get('createdAt'))
        merged_at = parse_datetime(pull_request.get('mergedAt'))
        first_activity = min(
            (session['started_at'] for session in sessions if session['started_at']),
            default=None,
        )
        print(f"PR #{pull_request['number']}: apertura {format_elapsed(first_activity, created_at)} · "
              f"fusión {format_elapsed(first_activity, merged_at)}")
    print(f'Minutos perdidos: {incident_minutes}')


def format_timestamp(value):
    if value is None:
        return 'sin datos'
    return value.astimezone().strftime('%Y-%m-%d %H:%M %Z')


def format_jira_line(summaries, pull_requests, incident_minutes):
    if not summaries:
        return f'Medida: sin sesiones registradas · {incident_minutes} min perdidos'
    agent, model = sorted(summaries)[0]
    summary = summaries[(agent, model)]
    sessions_text = 'sesión' if summary['sessions'] == 1 else 'sesiones'
    line = (f"Medida: {agent} {model} · {summary['sessions']} {sessions_text} · "
            f"{format_number(summary['new_tokens'])} nuevos / "
            f"{format_number(summary['read_tokens'])} releídos")
    if pull_requests:
        pull_request = pull_requests[0]
        first_activity = summary['first_activity']
        created_at = parse_datetime(pull_request.get('createdAt'))
        merged_at = parse_datetime(pull_request.get('mergedAt'))
        pull_request_numbers = ', '.join(
            f"#{pull_request['number']}" for pull_request in pull_requests
        )
        line += f" · PR {pull_request_numbers}, abierto en {format_elapsed(first_activity, created_at)}"
        if merged_at:
            line += f", fusionado en {format_elapsed(first_activity, merged_at)}"
    return f'{line} · {incident_minutes} min perdidos'


def print_sessions_report(since, folder):
    sessions = read_claude_sessions(folder=folder, since=since)
    for session in sorted(sessions, key=lambda item: item['started_at']):
        duration = format_elapsed(session['started_at'], session['last_activity'])
        average_read_tokens = session['read_tokens'] // max(1, session['steps'])
        print(f"{format_timestamp(session['started_at'])} · {duration} · "
              f"{session['steps']} pasos · {format_number(session['new_tokens'])} nuevos / "
              f"{format_number(session['read_tokens'])} releídos · "
              f"media {format_number(average_read_tokens)} releídos por paso · {session['model']}")


def main():
    arguments = parse_arguments()
    if arguments.command == 'task':
        print_task_report(arguments.task_key, arguments.jira)
        return
    print_sessions_report(arguments.since, arguments.folder)


if __name__ == '__main__':
    main()
