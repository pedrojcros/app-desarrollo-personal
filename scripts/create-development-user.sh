#!/bin/sh
set -eu

# Crea el usuario del dueño en el Supabase LOCAL (con Supabase arrancado).
#
# `docker/app/run` no pasa al contenedor las variables del anfitrión, así que
# este envoltorio lo hace por su cuenta. Si faltan, pide el email y la
# contraseña por teclado: la contraseña no se escribe en pantalla ni queda en
# el historial del intérprete de comandos.
#
# Uso:   ./scripts/create-development-user.sh
# O bien: DEV_USER_EMAIL=tu@email DEV_USER_PASSWORD=... ./scripts/create-development-user.sh

project_directory=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_directory"
export PWD="$project_directory"
export APP_UID=$(id -u)
export APP_GID=$(id -g)
export DOCKER_GID=$(stat -c '%g' /var/run/docker.sock)

if [ -z "${DEV_USER_EMAIL:-}" ]; then
  printf 'Email del usuario de desarrollo: '
  read -r DEV_USER_EMAIL
fi

if [ -z "${DEV_USER_PASSWORD:-}" ]; then
  printf 'Contraseña de desarrollo (no se muestra): '
  stty -echo
  read -r DEV_USER_PASSWORD
  stty echo
  printf '\n'
fi

export DEV_USER_EMAIL DEV_USER_PASSWORD

# `-e NOMBRE` sin valor copia la variable del anfitrión; `-T` evita exigir terminal.
exec docker compose run --rm -T -e DEV_USER_EMAIL -e DEV_USER_PASSWORD app \
  node scripts/create-development-user.mjs
