FROM node:24.14.0-bookworm

# Chromium viene del repositorio oficial de Debian; si retiran esta versión, se actualiza explícitamente.
RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium=154.0.8037.92-1~deb12u1 \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS=1 \
    CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS=1 \
    DO_NOT_TRACK=1 \
    npm_config_update_notifier=false
RUN npm install --global chrome-devtools-mcp@1.10.1

# Docker aísla el navegador: el sandbox interno necesita permisos de namespaces que no se conceden.
# No se montan ni el repositorio ni el socket Docker en este servicio.
USER node
ENTRYPOINT ["chrome-devtools-mcp", "--isolated", "--headless", "--executablePath", "/usr/bin/chromium", "--chromeArg=--no-sandbox", "--no-usage-statistics", "--no-performance-crux"]
