#!/bin/sh
set +x
set -eu

# Siembra el perfil elegido en local o en pruebas; producción nunca se permite.
#
# `docker/app/run` no pasa al contenedor las variables del anfitrión, así que
# este envoltorio lo hace por su cuenta. Si no se indica contraseña, genera una
# al azar solo en local, sin mostrarla. En pruebas la contraseña es obligatoria.
#
# Uso:   ./scripts/seed/seed-synthetic-year.sh
# O bien: SEED_USER_EMAIL=otro@example.com SEED_USER_PASSWORD=... ./scripts/seed/seed-synthetic-year.sh

project_directory=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$project_directory"
export PWD="$project_directory"
export APP_UID=$(id -u)
export APP_GID=$(id -g)
export DOCKER_GID=$(stat -c '%g' /var/run/docker.sock)

if [ -z "${SEED_USER_PASSWORD:-}" ]; then
  if [ "${SEED_TARGET:-local}" != local ]; then
    echo 'SEED_USER_PASSWORD is required for a remote target' >&2
    exit 1
  fi
  SEED_USER_PASSWORD=$(head -c 18 /dev/urandom | od -An -tx1 | tr -d ' \n')
fi

export SEED_USER_PASSWORD

if [ -z "${SEED_TODAY:-}" ]; then
  if [ "${SEED_TARGET:-local}" = pruebas ]; then
    SEED_TODAY=$(TZ=Europe/Madrid date +%F)
  else
    SEED_TODAY=$(date +%F)
  fi
fi
export SEED_TODAY

# `-e NOMBRE` sin valor copia la variable del anfitrión; `-T` evita exigir terminal.
exec docker compose run --rm -T \
  -e SEED_USER_PASSWORD -e SEED_USER_EMAIL -e SEED_TODAY -e SEED_API_URL \
  -e SEED_PROFILE -e SEED_TARGET -e SUPABASE_ACCESS_TOKEN -e GITHUB_ACTIONS \
  app node scripts/seed/seed-synthetic-year.mjs
