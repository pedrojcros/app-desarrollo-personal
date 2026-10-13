#!/usr/bin/env python3
"""Informa de worktrees de Orca que se pueden limpiar de forma segura.

Uso: python3 scripts/orca/clean_worktrees.py [--apply]
Solo borra worktrees ya incluidos en origin/develop y sin cambios sin guardar.
"""

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


class CommandFailure(Exception):
    """Indica que una orden externa no pudo completarse."""


@dataclass
class Classification:
    worktree: dict
    group: str
    reason: str


@dataclass
class Snapshot:
    worktrees: list
    workers: list
    terminals: list
    root: Path
    activity_unknown: bool = False


@dataclass
class Activity:
    workers: list
    terminals: list
    unknown: bool


def run_command(command, cwd=None):
    completed = subprocess.run(command, cwd=cwd, capture_output=True, text=True)
    if completed.returncode != 0:
        raise CommandFailure(completed.stderr.strip() or 'falló una orden externa')
    return completed.stdout


def run_orca(*arguments):
    command = ['orca', *arguments, '--json']
    output = run_command(command)
    try:
        return json.loads(output)
    except json.JSONDecodeError as error:
        raise CommandFailure('Orca devolvió JSON no válido') from error


def git_output(path, *arguments):
    command = ['git', *arguments]
    return run_command(command, cwd=path)


def get_result(response):
    if not isinstance(response, dict):
        raise CommandFailure('Orca response must be a dictionary')
    if response.get('ok') is False:
        raise CommandFailure('Orca indicó que la orden falló')
    result = response.get('result')
    if not isinstance(result, dict):
        raise CommandFailure('Orca devolvió una respuesta inesperada')
    return result


def require_complete_list(result):
    host_scope = result.get('hostScope') or {}
    if result.get('truncated') or host_scope.get('omittedHostIds'):
        raise CommandFailure('Orca list is incomplete')


def load_worktrees():
    response = run_orca('worktree', 'list')
    result = get_result(response)
    require_complete_list(result)
    worktrees = result.get('worktrees')
    if not isinstance(worktrees, list):
        raise CommandFailure('Orca no devolvió la lista de worktrees')
    return worktrees


def load_workers():
    workers = []
    cursor = None
    while True:
        arguments = ['orchestration', 'worker-list', '--include-remote']
        if cursor:
            arguments.extend(['--cursor', cursor])
        result = get_result(run_orca(*arguments))
        page_workers = result.get('workers')
        if not isinstance(page_workers, list):
            raise CommandFailure('Orca no devolvió la lista de trabajadores')
        workers.extend(page_workers)
        page = result.get('page') or {}
        if not page.get('hasMore'):
            return workers
        cursor = page.get('nextCursor')
        if not cursor:
            raise CommandFailure('Orca indicó otra página sin cursor')


def load_terminals():
    result = get_result(run_orca('terminal', 'list'))
    require_complete_list(result)
    terminals = result.get('terminals')
    if not isinstance(terminals, list):
        raise CommandFailure('Orca no devolvió la lista de terminales')
    return terminals


def load_activity():
    try:
        load_worktrees()
        workers = load_workers()
    except (CommandFailure, OSError):
        return Activity([], [], True)
    try:
        terminals = load_terminals()
    except (CommandFailure, OSError):
        return Activity(workers, [], True)
    return Activity(workers, terminals, False)


def find_repository_root():
    output = run_command(['git', 'rev-parse', '--show-toplevel'])
    return Path(output.strip())


def path_is_within(candidate, parent):
    try:
        candidate.resolve().relative_to(parent.resolve())
        return True
    except OSError:
        return True
    except ValueError:
        return False


def worker_path(worker):
    worktree_id = (worker.get('resource') or {}).get('worktreeId') or ''
    if '::' in worktree_id:
        return Path(worktree_id.split('::', 1)[1])
    workspace = (worker.get('projection') or {}).get('workspace') or {}
    workspace_id = workspace.get('id') or ''
    if '::' in workspace_id:
        return Path(workspace_id.split('::', 1)[1])
    return None


def worker_is_active(worker):
    projection = worker.get('projection') or {}
    liveness = projection.get('liveness') or {}
    return liveness.get('verdict') != 'exited'


def worker_uses_path(worker, worktree_path):
    candidate_path = worker_path(worker)
    if candidate_path is None:
        return worker_is_active(worker)
    return worker_is_active(worker) and path_is_within(candidate_path, worktree_path)


def terminal_path(terminal):
    path = terminal.get('worktreePath') or terminal.get('cwd')
    if not path:
        return None
    return Path(path)


def terminal_uses_path(terminal, worktree_path):
    candidate_path = terminal_path(terminal)
    if candidate_path is None:
        return True
    return path_is_within(candidate_path, worktree_path)


def find_activity_reason(worktree_path, activity):
    if activity.unknown:
        return 'CLI de actividad no disponible; se trata como en uso'
    for worker in activity.workers:
        if worker_uses_path(worker, worktree_path):
            return 'tiene un trabajador activo o no verificable'
    for terminal in activity.terminals:
        if terminal_uses_path(terminal, worktree_path):
            return 'tiene una terminal abierta'
    return None


def describe_changed_files(status_output):
    paths = []
    for line in status_output.splitlines():
        if len(line) > 3:
            paths.append(line[3:].strip())
    visible_paths = paths[:5]
    suffix = ''
    remaining_count = len(paths) - len(visible_paths)
    if remaining_count > 0:
        suffix = f' y {remaining_count} más'
    if not visible_paths:
        return ''
    return ', '.join(visible_paths) + suffix


def is_ancestor(head, base, repository_path):
    command = ['git', 'merge-base', '--is-ancestor', head, base]
    completed = subprocess.run(command, cwd=repository_path, capture_output=True, text=True)
    if completed.returncode == 0:
        return True
    if completed.returncode == 1:
        return False
    raise CommandFailure(completed.stderr.strip() or 'git merge-base falló')


def missing_commit_count(head, base, repository_path):
    output = git_output(repository_path, 'rev-list', '--count', f'{base}..{head}')
    return int(output.strip())


def find_main_worktree(repository_path):
    output = git_output(repository_path, 'worktree', 'list', '--porcelain')
    first_line = output.splitlines()[0] if output.splitlines() else ''
    if not first_line.startswith('worktree '):
        raise CommandFailure('Git did not identify the main worktree')
    return Path(first_line[len('worktree '):])


def classify_worktree(worktree, workers, terminals, repository_path, activity_unknown=False):
    worktree_path = Path(worktree['path'])
    main_path = find_main_worktree(repository_path)
    if worktree.get('isMainWorktree') or path_is_within(main_path, worktree_path):
        return Classification(worktree, 'principal', 'worktree principal')
    worktree_path = Path(worktree['path'])
    activity = Activity(workers, terminals, activity_unknown)
    activity_reason = find_activity_reason(worktree_path, activity)
    if activity_reason:
        return Classification(worktree, 'en uso', activity_reason)
    if not worktree_path.exists():
        return Classification(worktree, 'no existe', 'la ruta no está en el disco')
    status_output = git_output(worktree_path, 'status', '--porcelain')
    if status_output:
        return Classification(
            worktree,
            'con cosas sin guardar',
            f'ficheros: {describe_changed_files(status_output)}',
        )
    head = git_output(worktree_path, 'rev-parse', 'HEAD').strip()
    if not head:
        return Classification(worktree, 'sin fusionar', 'no se pudo identificar HEAD')
    base = 'origin/develop'
    if not is_ancestor(head, base, repository_path):
        commit_count = missing_commit_count(head, base, repository_path)
        return Classification(
            worktree,
            'sin fusionar',
            f'{commit_count} commits no están en origin/develop',
        )
    return Classification(worktree, 'se puede borrar', 'limpio y contenido en origin/develop')


def find_loose_directories(worktrees):
    registered_paths = set()
    for worktree in worktrees:
        registered_paths.add(Path(worktree['path']).resolve())
    parent_paths = {path.parent for path in registered_paths}
    loose_paths = []
    for parent_path in parent_paths:
        if not parent_path.is_dir():
            continue
        for child_path in parent_path.iterdir():
            if child_path.name.startswith('.'):
                continue
            if child_path.is_dir() and child_path.resolve() not in registered_paths:
                loose_paths.append(child_path)
    return sorted(set(loose_paths))


def collect_snapshot():
    run_command(['git', 'fetch', 'origin'])
    worktrees = load_worktrees()
    activity = load_activity()
    repository_root = find_repository_root()
    return Snapshot(worktrees, activity.workers, activity.terminals, repository_root, activity.unknown)


def worktree_label(worktree):
    path = Path(worktree['path'])
    name = f'{path.name} ({path})'
    display_name = worktree.get('displayName')
    if display_name and display_name != path.name:
        name += f' [{display_name}]'
    return name


def print_classification(classification):
    worktree = classification.worktree
    name = worktree_label(worktree)
    print(f"{name}: {classification.group} — {classification.reason}")


def remove_worktree(worktree_path):
    response = get_result(run_orca('worktree', 'rm', '--worktree', f'path:{worktree_path}'))
    print(f'{worktree_path}: resultado de borrado: {json.dumps(response, ensure_ascii=False)}')


def apply_removals(classifications, repository_path):
    failed = False
    for classification in classifications:
        if classification.group != 'se puede borrar':
            continue
        worktree = classification.worktree
        label = worktree_label(worktree)
        try:
            activity = load_activity()
            current = classify_worktree(
                worktree, activity.workers, activity.terminals,
                repository_path, activity.unknown,
            )
            if current.group != 'se puede borrar':
                print(f'{label}: omitido; {current.group} — {current.reason}')
                continue
            remove_worktree(Path(worktree['path']))
        except (CommandFailure, OSError) as error:
            print(f'{label}: fallo al comprobar o borrar: {error}')
            failed = True
    return 1 if failed else 0


def parse_arguments(arguments):
    parser = argparse.ArgumentParser(description='Informa de worktrees de Orca que se pueden limpiar.')
    parser.add_argument('--apply', action='store_true', help='borra los worktrees que se pueden borrar')
    return parser.parse_args(arguments)


def main(arguments=None):
    options = parse_arguments(arguments)
    try:
        snapshot = collect_snapshot()
    except (CommandFailure, OSError) as error:
        print(f'No se pudo clasificar: {error}', file=sys.stderr)
        return 1
    classifications = []
    failed = False
    for worktree in snapshot.worktrees:
        try:
            classification = classify_worktree(
                worktree, snapshot.workers, snapshot.terminals,
                snapshot.root, snapshot.activity_unknown,
            )
        except (CommandFailure, OSError) as error:
            classification = Classification(worktree, 'error al clasificar', str(error))
            failed = True
        if classification.group == 'principal':
            continue
        classifications.append(classification)
        print_classification(classification)
    try:
        loose_directories = find_loose_directories(snapshot.worktrees)
        for loose_directory in loose_directories:
            print(f'{loose_directory}: carpeta suelta, no es un worktree')
    except OSError as error:
        print(f'No se pudieron listar las carpetas sueltas: {error}')
        failed = True
    deletable_count = 0
    for classification in classifications:
        if classification.group == 'se puede borrar':
            deletable_count += 1
    decision_count = len(classifications) - deletable_count
    print(f'{deletable_count} se pueden borrar, {decision_count} necesitan que decidas')
    if options.apply:
        removal_code = apply_removals(classifications, snapshot.root)
        if failed:
            return 1
        return removal_code
    print('Para borrar los worktrees elegibles: python3 scripts/orca/clean_worktrees.py --apply')
    return 1 if failed else 0


if __name__ == '__main__':
    raise SystemExit(main())
