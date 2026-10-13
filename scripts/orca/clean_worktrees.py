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
    if response.get('ok') is False:
        raise CommandFailure('Orca indicó que la orden falló')
    result = response.get('result')
    if not isinstance(result, dict):
        raise CommandFailure('Orca devolvió una respuesta inesperada')
    return result


def load_worktrees():
    response = run_orca('worktree', 'list')
    result = get_result(response)
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
    terminals = result.get('terminals')
    if not isinstance(terminals, list):
        raise CommandFailure('Orca no devolvió la lista de terminales')
    return terminals


def load_activity():
    try:
        workers = load_workers()
    except (CommandFailure, OSError):
        return Activity([], [], True)
    try:
        terminals = load_terminals()
    except (CommandFailure, OSError):
        return Activity(workers, [], True)
    return Activity(workers, terminals, False)


@dataclass
class Activity:
    workers: list
    terminals: list
    unknown: bool


def find_repository_root():
    output = run_command(['git', 'rev-parse', '--show-toplevel'])
    return Path(output.strip())


def path_is_within(candidate, parent):
    try:
        candidate.resolve().relative_to(parent.resolve())
        return True
    except (OSError, ValueError):
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


def list_saved_files(status_output):
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


def classify_worktree(worktree, workers, terminals, repository_path, activity_unknown=False):
    if worktree.get('isMainWorktree'):
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
            f'ficheros: {list_saved_files(status_output)}',
        )
    head = worktree.get('head')
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


def find_loose_directories(worktrees, repository_root):
    registered_paths = {Path(worktree['path']).resolve() for worktree in worktrees if not worktree.get('isMainWorktree')}
    parent_paths = {path.parent for path in registered_paths}
    loose_paths = []
    for parent_path in parent_paths:
        if not parent_path.is_dir():
            continue
        for child_path in parent_path.iterdir():
            if child_path.is_dir() and child_path.resolve() not in registered_paths:
                loose_paths.append(child_path)
    return sorted(set(loose_paths))


def collect_snapshot():
    run_command(['git', 'fetch', 'origin'])
    worktrees = load_worktrees()
    activity = load_activity()
    repository_root = find_repository_root()
    return Snapshot(worktrees, activity.workers, activity.terminals, repository_root, activity.unknown)


def print_classification(classification):
    worktree = classification.worktree
    name = worktree.get('displayName') or worktree.get('path')
    print(f"{name}: {classification.group} — {classification.reason}")


def remove_worktree(worktree_path):
    response = get_result(run_orca('worktree', 'rm', '--worktree', f'path:{worktree_path}'))
    print(f'{worktree_path}: resultado de borrado: {json.dumps(response, ensure_ascii=False)}')


def apply_removals(classifications, snapshot):
    failed = False
    for classification in classifications:
        if classification.group != 'se puede borrar':
            continue
        worktree_path = Path(classification.worktree['path'])
        if not worktree_path.exists():
            print(f'{worktree_path}: omitido; la ruta ya no existe')
            continue
        try:
            status_output = git_output(worktree_path, 'status', '--porcelain')
        except (CommandFailure, OSError) as error:
            print(f'{worktree_path}: fallo al comprobar cambios: {error}')
            failed = True
            continue
        if status_output:
            print(f'{worktree_path}: omitido; aparecieron cambios sin guardar')
            continue
        try:
            remove_worktree(worktree_path)
        except (CommandFailure, OSError) as error:
            print(f'{worktree_path}: fallo al borrar: {error}')
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
    for worktree in snapshot.worktrees:
        classification = classify_worktree(
            worktree,
            snapshot.workers,
            snapshot.terminals,
            snapshot.root,
            snapshot.activity_unknown,
        )
        if classification.group == 'principal':
            continue
        classifications.append(classification)
        print_classification(classification)
    loose_directories = find_loose_directories(snapshot.worktrees, snapshot.root)
    for loose_directory in loose_directories:
        print(f'{loose_directory}: carpeta suelta, no es un worktree')
    deletable_count = sum(item.group == 'se puede borrar' for item in classifications)
    decision_count = len(classifications) - deletable_count
    print(f'{deletable_count} se pueden borrar, {decision_count} necesitan que decidas')
    if options.apply:
        return apply_removals(classifications, snapshot)
    print('Para borrar los worktrees elegibles: python3 scripts/orca/clean_worktrees.py --apply')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
