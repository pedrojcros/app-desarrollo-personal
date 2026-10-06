# Hoja de fotogramas de un vídeo de referencia, para ver una animación paso a paso (DEC-26).
FROM debian:trixie-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*

COPY fotogramas.sh /usr/local/bin/fotogramas
WORKDIR /work
ENTRYPOINT ["fotogramas"]
