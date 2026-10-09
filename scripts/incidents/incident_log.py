"""Validación y acceso al registro local de incidencias."""

import json
import os
import subprocess
from datetime import datetime
from pathlib import Path

INCIDENT_TYPES = {
    'environment',
    'quota',
    'stuck-agent',
    'flaky-test',
    'app-bug',
    'waiting-human',
    'tool',
}
INCIDENT_SOURCES = {'supervisor', 'orchestrator'}
INCIDENT_KEYS = {'date', 'type', 'task', 'minutes', 'cause', 'fix', 'source'}


def incidents_file_path():
    override_path = os.environ.get('ADP_INCIDENTS_FILE')
    if override_path:
        return Path(override_path)
    completed = subprocess.run(
        ['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'],
        capture_output=True,
        check=True,
        text=True,
    )
    common_directory = Path(completed.stdout.strip())
    repository_root = common_directory.parent
    return repository_root / 'logs' / 'incidents.jsonl'


def validate_incident(incident):
    if set(incident) != INCIDENT_KEYS:
        raise ValueError('La incidencia debe incluir todas las claves obligatorias y ninguna adicional')
    if not isinstance(incident['date'], str):
        raise ValueError('La fecha debe ser texto ISO 8601 con zona horaria')
    try:
        parsed_date = datetime.fromisoformat(incident['date'])
    except ValueError as error:
        raise ValueError('La fecha debe ser texto ISO 8601 con zona horaria') from error
    if parsed_date.tzinfo is None:
        raise ValueError('La fecha debe incluir zona horaria')
    if not isinstance(incident['type'], str) or incident['type'] not in INCIDENT_TYPES:
        raise ValueError('El tipo de incidencia no es válido')
    if not isinstance(incident['task'], str):
        raise ValueError('La tarea debe ser texto')
    minutes = incident['minutes']
    if isinstance(minutes, bool) or not isinstance(minutes, int) or minutes < 0:
        raise ValueError('Los minutos deben ser un entero mayor o igual que cero')
    if not isinstance(incident['cause'], str) or not isinstance(incident['fix'], str):
        raise ValueError('La causa y el arreglo deben ser texto')
    if not isinstance(incident['source'], str) or incident['source'] not in INCIDENT_SOURCES:
        raise ValueError('El origen de la incidencia no es válido')
    return incident


def append_incident(
    date,
    type,
    task,
    minutes,
    cause,
    fix,
    source,
    path=None,
):
    incident = {
        'date': date,
        'type': type,
        'task': task,
        'minutes': minutes,
        'cause': cause,
        'fix': fix,
        'source': source,
    }
    validate_incident(incident)
    incidents_path = Path(path) if path is not None else incidents_file_path()
    incidents_path.parent.mkdir(parents=True, exist_ok=True)
    serialized_incident = json.dumps(incident, ensure_ascii=False)
    with incidents_path.open('a', encoding='utf-8') as incidents_file:
        incidents_file.write(serialized_incident + '\n')
    return incident


def read_incidents(path=None):
    incidents_path = Path(path) if path is not None else incidents_file_path()
    if not incidents_path.exists():
        return [], 0
    incidents = []
    invalid_count = 0
    with incidents_path.open(encoding='utf-8') as incidents_file:
        for line in incidents_file:
            try:
                incident = json.loads(line)
                validate_incident(incident)
            except (json.JSONDecodeError, TypeError, ValueError):
                invalid_count += 1
                continue
            incidents.append(incident)
    return incidents, invalid_count
