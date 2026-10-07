#!/usr/bin/env python3
"""Supervisa a los trabajadores de Orca para que ninguno se quede parado.

Cada pocos segundos repasa la terminal de cada trabajador vivo:

- si el encargo se quedó escrito sin enviar (el borrador de Claude o el «[Paste #» de Copilot), envía el Enter;
- si Copilot pide permiso para rutas del proyecto o de su worktree, lo concede solo para esa sesión;
- si alguien pide otra cosa, o lleva demasiados minutos con la pantalla quieta, avisa y termina.

También termina cuando ya no queda ningún trabajador vivo. Está pensado para correr en
segundo plano: al terminar, quien orquesta se entera y actúa.

Uso: python3 scripts/orca/supervise_workers.py [--idle-minutes 8]
"""

import argparse
import hashlib
import json
import re
import subprocess
import time

CHECK_INTERVAL_SECONDS = 20
MAXIMUM_ENTER_ATTEMPTS = 3
COPILOT_PERMISSION_QUESTION = 'Do you want to allow this?'
COPILOT_PARKED_PASTE = '[Paste #'
CLAUDE_PERMISSION_MARKERS = (
    'Do you want to proceed',
    'Allow this read',
    'Do you want to make this edit',
    'Do you want to create',
)


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


def supervise_worker(worker, repository_root, screen_history, enter_attempts, idle_minutes):
    handle = worker.get('agentTerminalHandle')
    if not handle:
        return None
    terminal = read_terminal(handle)
    draft_problem = submit_pending_draft(worker, terminal, enter_attempts)
    if draft_problem or has_unsent_assignment(terminal):
        return draft_problem
    text = screen_text(terminal)
    allowed_roots = (repository_root, worktree_path(worker))
    permission_problem = answer_copilot_permission(worker, text, allowed_roots)
    if permission_problem:
        return permission_problem
    if any(marker in text for marker in CLAUDE_PERMISSION_MARKERS):
        return f'{worker_description(worker)} espera una respuesta que necesita a quien orquesta'
    return check_idle(worker, text, screen_history, idle_minutes)


def main():
    arguments = parse_arguments()
    repository_root = find_repository_root()
    screen_history = {}
    enter_attempts = {}
    while True:
        workers = list_live_workers()
        if not workers:
            print('No quedan trabajadores vivos: termino.', flush=True)
            return
        for worker in workers:
            problem = supervise_worker(worker, repository_root, screen_history, enter_attempts, arguments.idle_minutes)
            if problem:
                print(time.strftime('%H:%M:%S'), 'AVISO:', problem, flush=True)
                return
        time.sleep(CHECK_INTERVAL_SECONDS)


if __name__ == '__main__':
    main()
