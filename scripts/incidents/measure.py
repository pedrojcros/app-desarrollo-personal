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
    working_directories = set()
    model = 'desconocido'
    activity_times = []
    new_tokens = 0
    read_tokens = 0
    written_tokens = 0
    steps = 0
    seen_message_ids = set()
    for record in read_json_lines(session_file):
        if record.get('isSidechain'):
            continue
        working_directory = record.get('cwd')
        if working_directory:
            working_directories.add(working_directory)
        if record.get('type') != 'assistant':
            continue
        session_id = record.get('sessionId', record.get('session_id', session_id))
        message = record.get('message', {})
        if not isinstance(message, dict):
            continue
        message_id = message.get('id')
        if message_id is not None:
            if message_id in seen_message_ids:
                continue
            seen_message_ids.add(message_id)
        usage = message.get('usage', {})
        if not isinstance(usage, dict):
            continue
        if not usage:
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
    if task_key is not None:
        matches_task = any(
            path_contains_task(directory, task_key)
            for directory in working_directories
        )
        if not matches_task:
            return None
    if folder is not None:
        matches_folder = any(
            is_same_folder(directory, folder)
            for directory in working_directories
        )
        if not matches_folder:
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
        resolved_directory = Path(working_directory).resolve()
        resolved_folder = folder.resolve()
        return resolved_directory.is_relative_to(resolved_folder)
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
        started_at = session['started_at']
        first_activity = summary['first_activity']
        if started_at is not None:
            if first_activity is None or started_at < first_activity:
                summary['first_activity'] = started_at
        last_activity = session['last_activity']
        summary_last_activity = summary['last_activity']
        if last_activity is not None:
            if summary_last_activity is None or last_activity > summary_last_activity:
                summary['last_activity'] = last_activity
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
        new_tokens_text = format_number(summary['new_tokens'])
        read_tokens_text = format_number(summary['read_tokens'])
        written_tokens_text = format_number(summary['written_tokens'])
        first_activity_text = format_timestamp(summary['first_activity'])
        last_activity_text = format_timestamp(summary['last_activity'])
        print(f"{agent} {model}: {summary['sessions']} sesiones · "
              f"{new_tokens_text} nuevos / {read_tokens_text} releídos / "
              f"{written_tokens_text} escritos")
        print(f"  Actividad: {first_activity_text} → {last_activity_text}")
    print(f'PR encontrados: {len(pull_requests)}')
    for pull_request in pull_requests:
        created_at = parse_datetime(pull_request.get('createdAt'))
        merged_at = parse_datetime(pull_request.get('mergedAt'))
        first_activity = min(
            (session['started_at'] for session in sessions if session['started_at']),
            default=None,
        )
        opening_duration = format_elapsed(first_activity, created_at)
        merge_duration = format_elapsed(first_activity, merged_at)
        print(f"PR #{pull_request['number']}: apertura {opening_duration} · "
              f"fusión {merge_duration}")
    print(f'Minutos perdidos: {incident_minutes}')


def format_timestamp(value):
    if value is None:
        return 'sin datos'
    return value.astimezone().strftime('%Y-%m-%d %H:%M %Z')


def first_session_activity(summaries):
    activity_times = [
        summary['first_activity']
        for summary in summaries.values()
        if summary['first_activity'] is not None
    ]
    return min(activity_times, default=None)


def pull_request_times(pull_requests, field):
    activity_times = []
    for pull_request in pull_requests:
        timestamp = parse_datetime(pull_request.get(field))
        if timestamp is not None:
            activity_times.append(timestamp)
    return activity_times


def format_jira_pull_requests(pull_requests, first_activity):
    ordered_requests = sorted(pull_requests, key=lambda item: item['number'])
    numbers = ', '.join(f"#{item['number']}" for item in ordered_requests)
    opening_times = pull_request_times(ordered_requests, 'createdAt')
    merging_times = pull_request_times(ordered_requests, 'mergedAt')
    first_opening = min(opening_times, default=None)
    last_merge = max(merging_times, default=None)
    opening_duration = format_elapsed(first_activity, first_opening)
    merge_duration = format_elapsed(first_activity, last_merge)
    if len(ordered_requests) == 1:
        text = f'PR {numbers}, abierto en {opening_duration}'
        if last_merge is not None:
            text += f', fusionado en {merge_duration}'
        return text
    text = f'PR {numbers} (el primero abierto en {opening_duration}'
    if last_merge is not None:
        text += f', el último fusionado en {merge_duration}'
    return text + ')'


def format_jira_line(summaries, pull_requests, incident_minutes):
    if not summaries:
        return f'Medida: sin sesiones registradas · {incident_minutes} min perdidos'
    agents = ', '.join(f'{agent} {model}' for agent, model in sorted(summaries))
    session_count = sum(summary['sessions'] for summary in summaries.values())
    sessions_text = 'sesión' if session_count == 1 else 'sesiones'
    new_tokens = sum(summary['new_tokens'] for summary in summaries.values())
    read_tokens = sum(summary['read_tokens'] for summary in summaries.values())
    new_tokens_text = format_number(new_tokens)
    read_tokens_text = format_number(read_tokens)
    line = (f'Medida: {agents} · {session_count} {sessions_text} · '
            f'{new_tokens_text} nuevos / {read_tokens_text} releídos')
    if pull_requests:
        first_activity = first_session_activity(summaries)
        requests_text = format_jira_pull_requests(pull_requests, first_activity)
        line += f' · {requests_text}'
    return f'{line} · {incident_minutes} min perdidos'


def print_sessions_report(since, folder):
    sessions = read_claude_sessions(folder=folder, since=since)
    for session in sorted(sessions, key=lambda item: item['started_at']):
        duration = format_elapsed(session['started_at'], session['last_activity'])
        average_read_tokens = session['read_tokens'] // max(1, session['steps'])
        started_at_text = format_timestamp(session['started_at'])
        new_tokens_text = format_number(session['new_tokens'])
        read_tokens_text = format_number(session['read_tokens'])
        average_read_tokens_text = format_number(average_read_tokens)
        print(f"{started_at_text} · {duration} · {session['steps']} pasos · "
              f"{new_tokens_text} nuevos / {read_tokens_text} releídos · "
              f"media {average_read_tokens_text} releídos por paso · {session['model']}")


def main():
    arguments = parse_arguments()
    if arguments.command == 'task':
        print_task_report(arguments.task_key, arguments.jira)
        return
    print_sessions_report(arguments.since, arguments.folder)


if __name__ == '__main__':
    main()
