# Captura de pantallas de los prototipos con Chromium, sin usar el navegador del sistema (DEC-26).
FROM debian:trixie-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium fonts-noto-core fonts-noto-color-emoji fonts-dejavu-core ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Chromium necesita un HOME escribible al correr con el usuario del anfitrión.
ENV HOME=/tmp
COPY capturar.sh /usr/local/bin/capturar
WORKDIR /work
ENTRYPOINT ["capturar"]
