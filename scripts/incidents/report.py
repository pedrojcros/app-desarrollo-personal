#!/usr/bin/env python3
"""Resume las incidencias de un periodo."""

import argparse
from collections import Counter
from datetime import date

from incident_log import read_incidents


def parse_arguments():
    parser = argparse.ArgumentParser(description='Resume las incidencias registradas.')
    parser.add_argument('--since', required=True, type=parse_date, help='fecha inicial YYYY-MM-DD')
    parser.add_argument('--until', type=parse_date, help='fecha final YYYY-MM-DD')
    return parser.parse_args()


def parse_date(value):
    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError('la fecha debe usar YYYY-MM-DD') from error


def incidents_in_range(incidents, since_date, until_date):
    selected_incidents = []
    for incident in incidents:
        incident_date = date.fromisoformat(incident['date'][:10])
        if incident_date < since_date:
            continue
        if until_date is not None and incident_date > until_date:
            continue
        selected_incidents.append(incident)
    return selected_incidents


def normalized_cause(cause):
    return ' '.join(cause.lower().split())


def summarize(incidents):
    minutes_by_type = Counter()
    minutes_by_cause = Counter()
    incident_count_by_cause = Counter()
    minutes_by_task = Counter()
    original_causes = {}
    for incident in incidents:
        minutes_by_type[incident['type']] += incident['minutes']
        cause_key = normalized_cause(incident['cause'])
        minutes_by_cause[cause_key] += incident['minutes']
        incident_count_by_cause[cause_key] += 1
        original_causes.setdefault(cause_key, incident['cause'].strip())
        if incident['task']:
            minutes_by_task[incident['task']] += incident['minutes']
    return (
        minutes_by_type,
        minutes_by_cause,
        incident_count_by_cause,
        minutes_by_task,
        original_causes,
    )


def format_report(incidents, since_date, until_date, invalid_count):
    selected_incidents = incidents_in_range(incidents, since_date, until_date)
    (
        minutes_by_type,
        minutes_by_cause,
        incident_count_by_cause,
        minutes_by_task,
        original_causes,
    ) = summarize(selected_incidents)
    lines = [f'Incidencias del {since_date} al {until_date or "hoy"}:']
    lines.append('Minutos por tipo:')
    if not minutes_by_type:
        lines.append('- Sin incidencias.')
    for incident_type, minutes in minutes_by_type.most_common():
        lines.append(f'- {incident_type}: {minutes} minutos')
    repeated_causes = []
    for cause, minutes in minutes_by_cause.items():
        if incident_count_by_cause[cause] > 1:
            repeated_causes.append((cause, minutes))
    lines.append('Causas repetidas:')
    if not repeated_causes:
        lines.append('- Ninguna.')
    repeated_causes_by_minutes = sorted(
        repeated_causes,
        key=lambda cause_summary: cause_summary[1],
        reverse=True,
    )
    for cause, minutes in repeated_causes_by_minutes:
        lines.append(f'- {original_causes[cause]}: {minutes} minutos')
    lines.append('Tareas con más minutos:')
    if not minutes_by_task:
        lines.append('- Ninguna.')
    for task, minutes in minutes_by_task.most_common():
        lines.append(f'- {task}: {minutes} minutos')
    if invalid_count:
        lines.append(f'Líneas inválidas ignoradas: {invalid_count}.')
    return '\n'.join(lines)


def main():
    arguments = parse_arguments()
    if arguments.until is not None and arguments.until < arguments.since:
        raise SystemExit('--until debe ser igual o posterior a --since')
    incidents, invalid_count = read_incidents()
    print(format_report(incidents, arguments.since, arguments.until, invalid_count))


if __name__ == '__main__':
    main()
