# El digest mantiene la base oficial de la prueba aunque cambie la etiqueta.
FROM debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f

ENV ANDROID_HOME=/opt/android-sdk \
    MAESTRO_CLI_NO_ANALYTICS=1 \
    MAESTRO_DISABLE_UPDATE_CHECK=true \
    MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true \
    DEBIAN_FRONTEND=noninteractive \
    DO_NOT_TRACK=1
ENV PATH=/opt/android-sdk/cmdline-tools/23.0/bin:/opt/android-sdk/platform-tools:/opt/android-sdk/emulator:/opt/maestro/bin:$PATH

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       openjdk-21-jre-headless curl unzip ca-certificates \
       libpulse0 libnss3 libxcomposite1 libxcursor1 libxi6 libxtst6 libxdamage1 libxrandr2 \
       libgl1 libegl1 libdrm2 libgbm1 libx11-xcb1 libxkbfile1 libdbus-1-3 libfontconfig1 libbsd0 \
    && rm -rf /var/lib/apt/lists/*

COPY docker/android/install /usr/local/bin/install-android
RUN install-android

# El ZIP oficial no incluye package.xml; avdmanager necesita el registro generado por el instalador de Google.
COPY docker/android/emulator-package.xml /opt/android-sdk/emulator/package.xml
RUN echo no | avdmanager create avd --name adp-pixel \
    --package 'system-images;android-36;google_apis;x86_64' --device pixel_7

COPY docker/android/start /usr/local/bin/start-android
# Maestro 2.11.0 no aplica NO_ANALYTICS al informe de errores; su API se dirige a un puerto local cerrado.
# Fuente: https://github.com/mobile-dev-inc/Maestro/blob/cli-2.11.0/maestro-cli/src/main/java/maestro/cli/util/EnvUtils.kt
ENV MAESTRO_API_URL=http://127.0.0.1:9
ENTRYPOINT ["start-android"]
