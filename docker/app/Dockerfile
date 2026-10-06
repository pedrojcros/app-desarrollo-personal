FROM docker:29.8.2-cli AS docker-cli
FROM node:24.14.0-bookworm

ARG APP_UID=1000
ARG APP_GID=1000

COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker

RUN groupmod --gid "${APP_GID}" node \
    && usermod --uid "${APP_UID}" node \
    && chown -R "${APP_UID}:${APP_GID}" /home/node

ENV EXPO_NO_TELEMETRY=1 \
    SUPABASE_TELEMETRY_DISABLED=1 \
    DO_NOT_TRACK=1 \
    npm_config_update_notifier=false

USER node
CMD ["npm", "run", "start"]
