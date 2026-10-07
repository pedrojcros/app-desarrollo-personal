#!/bin/sh
set -eu

# Siembra un año de datos sintéticos en el Supabase LOCAL (con Supabase arrancado).
#
# `docker/app/run` no pasa al contenedor las variables del anfitrión, así que
# este envoltorio lo hace por su cuenta. Si no se indica contraseña, genera una
# al azar y la muestra: es la del usuario de siembra, que solo existe en local.
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
  SEED_USER_PASSWORD=$(head -c 18 /dev/urandom | od -An -tx1 | tr -d ' \n')
  echo "Contraseña generada para el usuario de siembra: $SEED_USER_PASSWORD"
fi

export SEED_USER_PASSWORD

# `-e NOMBRE` sin valor copia la variable del anfitrión; `-T` evita exigir terminal.
exec docker compose run --rm -T \
  -e SEED_USER_PASSWORD -e SEED_USER_EMAIL -e SEED_TODAY -e SEED_API_URL \
  app node scripts/seed/seed-synthetic-year.mjs
