#!/usr/bin/env python3
"""Añade una incidencia al registro local."""

import argparse
import sys
from datetime import datetime

from incident_log import INCIDENT_TYPES, append_incident


def parse_arguments():
    parser = argparse.ArgumentParser(description='Registra una incidencia del proyecto.')
    parser.add_argument('--type', required=True, type=parse_incident_type, dest='incident_type')
    parser.add_argument('--minutes', required=True, type=parse_minutes, help='minutos perdidos')
    parser.add_argument('--cause', required=True, help='causa del problema')
    parser.add_argument('--fix', default='', help='arreglo aplicado')
    parser.add_argument('--task', default='', help='clave de la tarea, por ejemplo ADP-27')
    parser.add_argument('--source', choices=('orchestrator', 'supervisor'), default='orchestrator')
    return parser.parse_args()


def parse_incident_type(value):
    if value not in INCIDENT_TYPES:
        raise argparse.ArgumentTypeError('el tipo de incidencia no es válido')
    return value


def parse_minutes(value):
    try:
        minutes = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError('los minutos deben ser un entero mayor o igual que cero') from error
    if minutes < 0:
        raise argparse.ArgumentTypeError('los minutos deben ser un entero mayor o igual que cero')
    return minutes


def main():
    arguments = parse_arguments()
    incident_date = datetime.now().astimezone().isoformat(timespec='seconds')
    try:
        append_incident(
            date=incident_date,
            type=arguments.incident_type,
            task=arguments.task,
            minutes=arguments.minutes,
            cause=arguments.cause,
            fix=arguments.fix,
            source=arguments.source,
        )
    except (OSError, ValueError) as error:
        print(f'No se pudo registrar la incidencia: {error}', file=sys.stderr)
        return 1
    print('Incidencia registrada.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
