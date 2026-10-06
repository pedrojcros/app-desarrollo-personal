#!/bin/sh
# Uso: capturar <fichero.html> <captura.png> [ancho] [alto]
set -eu

html_file="$1"
png_file="$2"
width="${3:-360}"
height="${4:-800}"

# Sin sandbox porque ya corre dentro de un contenedor.
chromium --headless --no-sandbox --disable-gpu --hide-scrollbars \
  --window-size="${width},${height}" \
  --screenshot="/work/${png_file}" "file:///work/${html_file}" > /dev/null 2>&1

if [ ! -s "/work/${png_file}" ]; then
  echo "No se pudo capturar ${html_file}" >&2
  exit 1
fi
echo "Captura en ${png_file} (${width}x${height})"
