#!/usr/bin/env python3
"""Supervisa a los trabajadores de Orca y resuelve esperas conocidas de Codex.

Cada pocos segundos repasa la terminal de cada trabajador vivo:

- si el encargo se quedó escrito sin enviar (el borrador de Claude o el «[Paste #» de Copilot), envía el Enter;
- si Copilot pide permiso para rutas del proyecto o de su worktree, lo concede solo para esa sesión;
- si Codex encuentra el modelo saturado o agota la cuota, lo reanuda cuando corresponde;
- si alguien pide otra cosa, o lleva demasiados minutos con la pantalla quieta, avisa y termina.

También termina cuando ya no queda ningún trabajador vivo. Está pensado para correr en
segundo plano: al terminar, quien orquesta se entera y actúa.

Uso: python3 scripts/orca/supervise_workers.py [--idle-minutes 8]
"""

import argparse
import datetime
import hashlib
import json
import re
import subprocess
import sys
import time
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

# El script también se ejecuta directamente desde scripts/orca.
REPOSITORY_DIRECTORY = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPOSITORY_DIRECTORY))

from scripts.incidents.incident_log import append_incident

CHECK_INTERVAL_SECONDS = 20
MAXIMUM_ENTER_ATTEMPTS = 3
CAPACITY_RETRY_LIMIT = 3
RECENT_LINE_COUNT = 15
CAPACITY_RETRY_INTERVAL = datetime.timedelta(minutes=5)
QUOTA_RESUME_DELAY = datetime.timedelta(minutes=1)
MODEL_CAPACITY_MESSAGE = 'Selected model is at capacity'
USAGE_LIMIT_MESSAGE = 'hit your usage limit'
ENGLISH_MONTH_NUMBERS = {
    'jan': 1,
    'january': 1,
    'feb': 2,
    'february': 2,
    'mar': 3,
    'march': 3,
    'apr': 4,
    'april': 4,
    'may': 5,
    'jun': 6,
    'june': 6,
    'jul': 7,
    'july': 7,
    'aug': 8,
    'august': 8,
    'sep': 9,
    'sept': 9,
    'september': 9,
    'oct': 10,
    'october': 10,
    'nov': 11,
    'november': 11,
    'dec': 12,
    'december': 12,
}
RETRY_TIME_PATTERN = re.compile(
    r'try again at\s+'
    r'(?:(January|Jan|February|Feb|March|Mar|April|Apr|May|June|Jun|'
    r'July|Jul|August|Aug|September|Sept|Sep|October|Oct|November|Nov|'
    r'December|Dec)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\s+)?'
    r'(\d{1,2}:\d{2}(?:\s*[AP]M)?)',
    re.IGNORECASE,
)
COPILOT_PERMISSION_QUESTION = 'Do you want to allow this?'
COPILOT_PARKED_PASTE = '[Paste #'
CLAUDE_PERMISSION_MARKERS = (
    'Do you want to proceed',
    'Allow this read',
    'Do you want to make this edit',
    'Do you want to create',
)


class CodexStatus(Enum):
    NOTHING = 'nothing'
    WAITING = 'waiting'
    ACTED = 'acted'
    ALERT = 'alert'


@dataclass
class CodexOutcome:
    status: CodexStatus
    alert: str = ''


def parse_arguments():
    parser = argparse.ArgumentParser(description='Supervisa a los trabajadores de Orca.')
    parser.add_argument('--idle-minutes', type=float, default=8, help='minutos con la pantalla quieta antes de avisar')
    return parser.parse_args()


def run_orca(*arguments):
    command = ['orca', *arguments, '--json']
    completed = subprocess.run(command, capture_output=True, text=True, timeout=120)
    return json.loads(completed.stdout)


def find_repository_root():
    completed = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True)
    return completed.stdout.strip()


def list_live_workers():
    response = run_orca('orchestration', 'worker-list')
    workers = response.get('result', {}).get('workers', [])
    live_workers = []
    for worker in workers:
        # Un trabajador relanzado en una terminal reutilizada (por ejemplo, tras
        # reiniciarse Orca) figura como «retained», pero sigue trabajando.
        terminal_state = worker.get('terminalState')
        is_active = terminal_state in ('active', 'retained')
        projection = worker.get('projection') or {}
        is_in_progress = projection.get('outcome') == 'in_progress'
        if is_active and is_in_progress:
            live_workers.append(worker)
    return live_workers


def worker_description(worker):
    # Orca deja vacío el proveedor de algunos trabajadores (visto con Copilot).
    projection = worker.get('projection') or {}
    provider = projection.get('provider') or {}
    agent = provider.get('id') or 'agente'
    return f"{worker.get('dispatchId')} ({agent})"


def worktree_path(worker):
    worktree_id = worker.get('resource', {}).get('worktreeId') or ''
    return worktree_id.split('::')[-1]


def read_terminal(handle):
    response = run_orca('terminal', 'read', '--terminal', handle, '--screen')
    return response.get('result', {}).get('terminal', {})


def screen_text(terminal):
    tail = terminal.get('tail') or []
    if isinstance(tail, str):
        return tail
    return '\n'.join(str(line) for line in tail)


def detect_model_capacity(text):
    return MODEL_CAPACITY_MESSAGE in text


def detect_usage_limit(text):
    has_usage_limit = USAGE_LIMIT_MESSAGE in text
    has_retry_time = RETRY_TIME_PATTERN.search(text)
    return has_usage_limit and has_retry_time is not None


def parse_retry_time(text, current_time):
    time_match = RETRY_TIME_PATTERN.search(text)
    if time_match is None:
        return None
    month_name, day_text, year_text, clock_text = time_match.groups()
    time_text = clock_text.upper().replace(' ', '')
    time_format = '%I:%M%p' if 'AM' in time_text or 'PM' in time_text else '%H:%M'
    try:
        retry_clock = datetime.datetime.strptime(time_text, time_format).time()
    except ValueError:
        return None
    retry_date = current_time.date()
    if month_name is not None:
        month_number = ENGLISH_MONTH_NUMBERS[month_name.lower()]
        try:
            retry_date = datetime.date(int(year_text), month_number, int(day_text))
        except ValueError:
            return None
    retry_time = datetime.datetime.combine(retry_date, retry_clock)
    if month_name is None and retry_time <= current_time:
        retry_time += datetime.timedelta(days=1)
    return retry_time


def should_retry_capacity(current_time, last_retry_time, retry_count):
    if retry_count >= CAPACITY_RETRY_LIMIT:
        return False
    if last_retry_time is None:
        return True
    return current_time - last_retry_time >= CAPACITY_RETRY_INTERVAL


def is_worker_waiting_for_quota(current_time, retry_time):
    return current_time < retry_time + QUOTA_RESUME_DELAY


def continue_worker(worker, action_description):
    handle = worker['agentTerminalHandle']
    send_to_terminal(handle, '--text', 'continúa')
    send_to_terminal(handle, '--enter')
    print_action(worker, action_description)


def recent_lines(text):
    non_empty_lines = [line for line in text.splitlines() if line.strip()]
    return '\n'.join(non_empty_lines[-RECENT_LINE_COUNT:])


def update_screen_stillness(worker_state, text):
    fingerprint = hashlib.sha256(text.encode('utf-8')).hexdigest()
    previous_fingerprint = worker_state.get('screen_fingerprint')
    worker_state['screen_fingerprint'] = fingerprint
    return fingerprint == previous_fingerprint


def print_action(worker, action_description):
    print(time.strftime('%H:%M:%S'), worker_description(worker), action_description, flush=True)


def handle_quota_wait(worker, worker_state, current_time):
    quota_retry_time = worker_state.get('quota_retry_time')
    if quota_retry_time is None:
        return None
    if is_worker_waiting_for_quota(current_time, quota_retry_time):
        return CodexOutcome(CodexStatus.WAITING)
    continue_worker(worker, f'cuota recuperada; continúa ({quota_retry_time:%H:%M})')
    quota_started_at = worker_state.get('quota_started_at', quota_retry_time)
    quota_minutes = max(0, round((current_time - quota_started_at).total_seconds() / 60))
    append_supervisor_incident(
        'quota', quota_minutes, 'Espera por límite de cuota', 'continúa', worker
    )
    # Se olvida todo lo anterior: si vuelve a pararse, se juzga como una situación nueva.
    worker_state.clear()
    return CodexOutcome(CodexStatus.ACTED)


def start_quota_wait(worker, worker_state, recent_text, current_time):
    retry_time = parse_retry_time(recent_text, current_time)
    if retry_time is None:
        alert = f'{worker_description(worker)} muestra el límite de cuota sin una hora legible'
        return CodexOutcome(CodexStatus.ALERT, alert)
    worker_state['quota_retry_time'] = retry_time
    worker_state['quota_started_at'] = current_time
    has_keep_model_option = re.search(
        r'^\s*2[.)]\s+.*model',
        recent_text,
        re.IGNORECASE | re.MULTILINE,
    )
    if has_keep_model_option is not None:
        handle = worker['agentTerminalHandle']
        send_to_terminal(handle, '--text', '2')
        send_to_terminal(handle, '--enter')
        action_description = f'mantiene el modelo y espera hasta {retry_time:%H:%M}'
    else:
        action_description = f'espera hasta {retry_time:%H:%M}'
    print_action(worker, action_description)
    return CodexOutcome(CodexStatus.ACTED)


def retry_model_capacity(worker, worker_state, current_time):
    retry_count = worker_state.get('capacity_retry_count', 0)
    last_retry_time = worker_state.get('capacity_last_retry_time')
    if should_retry_capacity(current_time, last_retry_time, retry_count):
        worker_state['capacity_retry_count'] = retry_count + 1
        worker_state['capacity_last_retry_time'] = current_time
        continue_worker(worker, f'modelo saturado; continúa (intento {retry_count + 1}/{CAPACITY_RETRY_LIMIT})')
        append_supervisor_incident(
            'tool', 0, 'El modelo está saturado', 'El supervisor envió continúa', worker
        )
        return CodexOutcome(CodexStatus.ACTED)
    is_cooling_down = retry_count < CAPACITY_RETRY_LIMIT or current_time - last_retry_time < CAPACITY_RETRY_INTERVAL
    if is_cooling_down:
        return CodexOutcome(CodexStatus.WAITING)
    alert = f'{worker_description(worker)} agotó {CAPACITY_RETRY_LIMIT} reintentos por saturación del modelo'
    return CodexOutcome(CodexStatus.ALERT, alert)


def handle_codex_wait(worker, text, worker_states, current_time):
    worker_state = worker_states.setdefault(worker['dispatchId'], {})
    screen_is_still = update_screen_stillness(worker_state, text)
    quota_outcome = handle_quota_wait(worker, worker_state, current_time)
    if quota_outcome is not None:
        return quota_outcome

    # Solo cuenta lo que está al final de la pantalla: más arriba es historial.
    recent_text = recent_lines(text)
    if not detect_model_capacity(recent_text):
        worker_state['capacity_retry_count'] = 0
        worker_state['capacity_last_retry_time'] = None
    if not screen_is_still:
        return CodexOutcome(CodexStatus.NOTHING)

    if detect_usage_limit(recent_text):
        return start_quota_wait(worker, worker_state, recent_text, current_time)
    if USAGE_LIMIT_MESSAGE in recent_text:
        alert = f'{worker_description(worker)} muestra el límite de cuota sin una hora o menú reconocible'
        return CodexOutcome(CodexStatus.ALERT, alert)
    if detect_model_capacity(recent_text):
        return retry_model_capacity(worker, worker_state, current_time)
    return CodexOutcome(CodexStatus.NOTHING)


def incident_task(worker):
    worker_resource = worker.get('resource') or {}
    worker_text = ' '.join(str(value) for value in worker_resource.values())
    task_match = re.search(r'ADP-\d+', worker_text)
    if task_match is not None:
        return task_match.group(0)
    worktree_directory = Path(worktree_path(worker))
    if not worktree_directory.is_dir():
        return ''
    try:
        branch_result = subprocess.run(
            ['git', '-C', str(worktree_directory), 'branch', '--show-current'],
            capture_output=True,
            check=True,
            text=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return ''
    branch_match = re.search(r'ADP-\d+', branch_result.stdout)
    if branch_match is None:
        return ''
    return branch_match.group(0)


def append_supervisor_incident(incident_type, minutes, cause, fix, worker):
    incident_date = datetime.datetime.now().astimezone().isoformat(timespec='seconds')
    try:
        append_incident(
            date=incident_date,
            type=incident_type,
            task=incident_task(worker),
            minutes=minutes,
            cause=cause,
            fix=fix,
            source='supervisor',
        )
    except (OSError, ValueError, subprocess.SubprocessError) as error:
        print(time.strftime('%H:%M:%S'), f'AVISO: no se pudo guardar la incidencia: {error}', flush=True)


def send_to_terminal(handle, *arguments):
    run_orca('terminal', 'send', '--terminal', handle, *arguments)


def is_inside(path, roots):
    for root in roots:
        if path == root or path.startswith(root.rstrip('/') + '/'):
            return True
    return False


def copilot_permission_request(text):
    question_position = text.rfind(COPILOT_PERMISSION_QUESTION)
    if question_position < 0:
        return None
    request_start = text.rfind('Allow', 0, question_position)
    request_text = text[request_start:question_position]
    menu_text = text[question_position:]
    # En el montaje de Docker la ruta llega como «/ruta:/work»: solo cuenta la parte del anfitrión.
    paths = [path.split(':')[0] for path in re.findall(r'(/\S+)', request_text)]
    options = re.findall(r'(\d)\. ([^\n"]+)', menu_text)
    return paths, options


def choose_session_option(options):
    session_options = [(number, label) for number, label in options if 'for this session' in label]
    for number, label in session_options:
        if 'directory' in label:
            return number
    if session_options:
        return session_options[0][0]
    return None


def answer_copilot_permission(worker, text, allowed_roots):
    request = copilot_permission_request(text)
    if request is None:
        return None
    paths, options = request
    all_paths_allowed = bool(paths) and all(is_inside(path, allowed_roots) for path in paths)
    option = choose_session_option(options)
    if not all_paths_allowed or option is None:
        return f'{worker_description(worker)} pide un permiso que no concedo solo: {paths}'
    send_to_terminal(worker['agentTerminalHandle'], '--text', option)
    append_supervisor_incident(
        'waiting-human', 0, 'Copilot solicitó permiso', 'Permiso concedido para esta sesión', worker
    )
    print(time.strftime('%H:%M:%S'), worker_description(worker), f'permiso de sesión ({option}) para {paths[0]}', flush=True)
    return None


def has_unsent_assignment(terminal):
    if terminal.get('draft'):
        return True
    return COPILOT_PARKED_PASTE in screen_text(terminal)


def submit_pending_draft(worker, terminal, enter_attempts):
    if not has_unsent_assignment(terminal):
        return None
    dispatch = worker['dispatchId']
    enter_attempts[dispatch] = enter_attempts.get(dispatch, 0) + 1
    if enter_attempts[dispatch] > MAXIMUM_ENTER_ATTEMPTS:
        return f'{worker_description(worker)} sigue con el encargo sin enviar tras {MAXIMUM_ENTER_ATTEMPTS} Enter'
    send_to_terminal(worker['agentTerminalHandle'], '--enter')
    append_supervisor_incident(
        'environment', 0, 'El encargo quedó sin enviar', 'El supervisor pulsó Enter', worker
    )
    print(time.strftime('%H:%M:%S'), worker_description(worker), 'tenía el encargo sin enviar: Enter', flush=True)
    return None


def check_idle(worker, text, screen_history, idle_minutes):
    dispatch = worker['dispatchId']
    fingerprint = hashlib.sha256(text.encode('utf-8')).hexdigest()
    previous_fingerprint, unchanged_since = screen_history.get(dispatch, (None, time.time()))
    if fingerprint != previous_fingerprint:
        screen_history[dispatch] = (fingerprint, time.time())
        return None
    idle_seconds = time.time() - unchanged_since
    if idle_seconds < idle_minutes * 60:
        return None
    return f'{worker_description(worker)} lleva {round(idle_seconds / 60)} minutos con la pantalla quieta'


def supervise_worker(worker, repository_root, screen_history, enter_attempts, idle_minutes, worker_states):
    handle = worker.get('agentTerminalHandle')
    if not handle:
        return None
    terminal = read_terminal(handle)
    draft_problem = submit_pending_draft(worker, terminal, enter_attempts)
    if draft_problem or has_unsent_assignment(terminal):
        return draft_problem
    text = screen_text(terminal)
    codex_outcome = handle_codex_wait(worker, text, worker_states, datetime.datetime.now())
    if codex_outcome.status == CodexStatus.ALERT:
        incident_type = 'quota'
        if 'cuota' not in codex_outcome.alert.lower():
            incident_type = 'tool'
        append_supervisor_incident(
            incident_type, 0, codex_outcome.alert, 'Se avisó a quien orquesta', worker
        )
        return codex_outcome.alert
    if codex_outcome.status != CodexStatus.NOTHING:
        screen_history.pop(worker['dispatchId'], None)
        return None
    allowed_roots = (repository_root, worktree_path(worker))
    permission_problem = answer_copilot_permission(worker, text, allowed_roots)
    if permission_problem:
        return permission_problem
    if any(marker in text for marker in CLAUDE_PERMISSION_MARKERS):
        alert = f'{worker_description(worker)} espera una respuesta que necesita a quien orquesta'
        append_supervisor_incident(
            'waiting-human', 0, alert, 'Se avisó a quien orquesta', worker
        )
        return alert
    idle_problem = check_idle(worker, text, screen_history, idle_minutes)
    if idle_problem:
        dispatch = worker['dispatchId']
        screen_state = screen_history.get(dispatch)
        unchanged_since = screen_state[1] if screen_state is not None else time.time()
        idle_seconds = max(0, time.time() - unchanged_since)
        idle_minutes_lost = round(idle_seconds / 60)
        append_supervisor_incident(
            'stuck-agent', idle_minutes_lost, idle_problem, 'Se avisó a quien orquesta', worker
        )
    return idle_problem


def main():
    arguments = parse_arguments()
    repository_root = find_repository_root()
    screen_history = {}
    enter_attempts = {}
    worker_states = {}
    while True:
        workers = list_live_workers()
        if not workers:
            print('No quedan trabajadores vivos: termino.', flush=True)
            return
        for worker in workers:
            problem = supervise_worker(worker, repository_root, screen_history, enter_attempts, arguments.idle_minutes, worker_states)
            if problem:
                print(time.strftime('%H:%M:%S'), 'AVISO:', problem, flush=True)
                return
        time.sleep(CHECK_INTERVAL_SECONDS)


if __name__ == '__main__':
    main()
