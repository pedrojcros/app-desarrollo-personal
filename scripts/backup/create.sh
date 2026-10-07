#!/bin/sh
set -eu
umask 077

: "${SUPABASE_PROJECT_REF:?SUPABASE_PROJECT_REF is required}"
: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN is required}"
: "${SUPABASE_DB_PASSWORD:?SUPABASE_DB_PASSWORD is required}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is required}"

output_file=${1:?An encrypted output file is required}
temporary_directory=$(mktemp -d)
# El directorio pertenece a esta ejecución; ningún SQL sin cifrar queda al salir.
trap 'rm -rf -- "$temporary_directory"' EXIT HUP INT TERM

export SUPABASE_TELEMETRY_DISABLED=1
export DO_NOT_TRACK=1
npx --no-install supabase link --project-ref "$SUPABASE_PROJECT_REF"

# https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
# Los usuarios de Auth y el historial de migraciones también son necesarios
# para recuperar las claves foráneas y continuar migrando después de restaurar.
npx --no-install supabase db dump --linked --file "$temporary_directory/schema.sql"
# Una base aislada no tiene las tablas internas: conservar su esquema permite
# probar la recuperación aunque el Auth remoto y el local tengan versiones distintas.
npx --no-install supabase db dump --linked --schema auth,storage --file "$temporary_directory/managed-schema.sql"
npx --no-install supabase db dump --linked --data-only --use-copy --file "$temporary_directory/data.sql"
script_directory=$(dirname -- "$0")
migration_history=$(node "$script_directory/has-migration-history.mjs")
if [ "$migration_history" = 'present' ]; then
  npx --no-install supabase db dump --linked --schema supabase_migrations --file "$temporary_directory/history-schema.sql"
  npx --no-install supabase db dump --linked --schema supabase_migrations --data-only --use-copy --file "$temporary_directory/history-data.sql"
elif [ "$migration_history" = 'absent' ]; then
  # Una producción aún sin migraciones también necesita una copia válida.
  printf '%s\n' '-- No migration history exists yet.' > "$temporary_directory/history-schema.sql"
  printf '%s\n' '-- No migration history exists yet.' > "$temporary_directory/history-data.sql"
else
  printf '%s\n' 'Invalid migration history inspection result' >&2
  exit 1
fi

tar -czf "$temporary_directory/backup.tar.gz" -C "$temporary_directory" schema.sql managed-schema.sql data.sql history-schema.sql history-data.sql
# La clave entra por stdin: no aparece en argumentos ni en el registro de Actions.
printf '%s' "$BACKUP_PASSPHRASE" | gpg --batch --yes --pinentry-mode loopback --passphrase-fd 0 --symmetric --cipher-algo AES256 --output "$output_file" "$temporary_directory/backup.tar.gz"
test -s "$output_file"
printf '%s\n' 'Encrypted database backup created.'
