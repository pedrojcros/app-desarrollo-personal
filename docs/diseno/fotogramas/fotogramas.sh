#!/bin/sh
# Uso: fotogramas <video> <hoja.png> [fotogramas]
# Saca fotogramas repartidos por todo el vídeo y los pone en una cuadrícula de 6 columnas.
set -eu

video_file="$1"
sheet_file="$2"
frame_count="${3:-24}"
columns=6
rows=$(( (frame_count + columns - 1) / columns ))

duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "/work/${video_file}")
frames_per_second=$(awk -v duration="$duration" -v count="$frame_count" 'BEGIN { printf "%.4f", count / duration }')

ffmpeg -v error -y -i "/work/${video_file}" \
  -vf "fps=${frames_per_second},scale=220:-2,tile=${columns}x${rows}:padding=4:color=white" \
  -frames:v 1 "/work/${sheet_file}"

echo "Hoja de ${frame_count} fotogramas de ${duration} s en ${sheet_file}"
