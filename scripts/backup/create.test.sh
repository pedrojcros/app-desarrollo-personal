#!/bin/sh
set -eu
umask 077

project_directory=$(pwd)
temporary_directory=$(mktemp -d)
trap 'rm -rf -- "$temporary_directory"' EXIT HUP INT TERM
mkdir "$temporary_directory/bin" "$temporary_directory/gnupg"
export GNUPGHOME="$temporary_directory/gnupg"
export PATH="$temporary_directory/bin:$PATH"
export SUPABASE_PROJECT_REF=synthetic
# Son valores aleatorios efímeros: ningún secreto de prueba queda en git.
export SUPABASE_ACCESS_TOKEN=$(openssl rand -hex 32)
export SUPABASE_DB_PASSWORD=$(openssl rand -hex 32)
export BACKUP_PASSPHRASE=$(openssl rand -hex 32)

cat > "$temporary_directory/bin/npx" <<'MOCK'
#!/bin/sh
set -eu
if [ "$3" = 'link' ]; then
  exit 0
fi
if [ "${FAIL_DUMP:-0}" = '1' ]; then
  exit 17
fi
previous_argument=''
for argument do
  if [ "$previous_argument" = '--file' ]; then
    printf '%s\n' 'SELECT 1;' > "$argument"
    exit 0
  fi
  previous_argument=$argument
done
exit 1
MOCK
chmod +x "$temporary_directory/bin/npx"

# Un error de volcado nunca puede producir una copia que parezca válida.
if FAIL_DUMP=1 sh "$project_directory/scripts/backup/create.sh" "$temporary_directory/failed.gpg"; then
  printf '%s\n' 'A failed dump unexpectedly succeeded' >&2
  exit 1
fi
test ! -e "$temporary_directory/failed.gpg"
if BACKUP_PASSPHRASE='' sh "$project_directory/scripts/backup/create.sh" "$temporary_directory/missing.gpg" 2>/dev/null; then
  printf '%s\n' 'A missing passphrase unexpectedly succeeded' >&2
  exit 1
fi
test ! -e "$temporary_directory/missing.gpg"

sh "$project_directory/scripts/backup/create.sh" "$temporary_directory/valid.gpg"
printf '%s' "$BACKUP_PASSPHRASE" | gpg --batch --pinentry-mode loopback --passphrase-fd 0 --decrypt --output "$temporary_directory/restored.tar.gz" "$temporary_directory/valid.gpg"
tar -tzf "$temporary_directory/restored.tar.gz" > "$temporary_directory/files.txt"
printf '%s\n' schema.sql managed-schema.sql data.sql history-schema.sql history-data.sql > "$temporary_directory/expected.txt"
cmp "$temporary_directory/files.txt" "$temporary_directory/expected.txt"
printf '%s\n' 'Backup checks passed: missing key, failed dump, AES256 round trip and archive contents.'
