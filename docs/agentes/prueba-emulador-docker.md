# Prueba: el emulador de Android dentro de Docker (DEC-26)

Prueba de concepto del arquitecto, el 2026-10-06, para decidir DEC-26. Es el punto de partida de T15, que la convierte en algo definitivo con versiones fijadas (aquí Maestro va con `latest`).

## Resultado

- La imagen pesa unos 10 GB (Debian, Java 21, el emulador, Android 16 con Google APIs y una AVD) y el emulador arranca en unos **50 segundos** sin ventana.
- Con `--network host`, el `adb` del ordenador ve el emulador como `emulator-5554`, y Orca también (`orca emulator devices` y `orca emulator attach`), si en `~/Android/Sdk` están `platform-tools` y `emulator` (unos 900 MB). Solo con `platform-tools`, Orca responde «Android SDK not found».
- No se ha probado todavía: ver el panel de Orca en pantalla, Maestro contra Expo Go, ni ver el emulador en una ventana.

## Cómo se construyó y se arrancó

```
docker build -t adp-android-poc .
docker run -d --pull never --name adp-android --device /dev/kvm --network host adp-android-poc
docker exec adp-android adb shell getprop sys.boot_completed   # 1 cuando ha arrancado
```

`--pull never` evita que Docker busque en Docker Hub una imagen con el mismo nombre si la propia no existe.

## Dockerfile

```dockerfile
# Prueba de concepto (DEC-26): emulador de Android y Maestro dentro de Docker, sin nada en el anfitrión.
FROM debian:trixie-slim

ARG CMDLINE_TOOLS_URL=https://dl.google.com/android/repository/commandlinetools-linux-16111833_latest.zip
ARG SYSTEM_IMAGE=system-images/android-36/google_apis/x86_64

ENV ANDROID_HOME=/opt/android-sdk \
    MAESTRO_CLI_NO_ANALYTICS=1 \
    DEBIAN_FRONTEND=noninteractive
ENV PATH=/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools:/opt/android-sdk/emulator:/opt/maestro/bin:$PATH

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      openjdk-21-jre-headless curl unzip ca-certificates \
      libpulse0 libnss3 libxcomposite1 libxcursor1 libxi6 libxtst6 libxdamage1 libxrandr2 \
      libgl1 libegl1 libdrm2 libgbm1 libx11-xcb1 libxkbfile1 libdbus-1-3 libfontconfig1 libbsd0 \
 && rm -rf /var/lib/apt/lists/*

RUN mkdir -p "$ANDROID_HOME/cmdline-tools" \
 && curl -fsSL "$CMDLINE_TOOLS_URL" -o /tmp/cmdline-tools.zip \
 && unzip -q /tmp/cmdline-tools.zip -d /tmp \
 && mv /tmp/cmdline-tools "$ANDROID_HOME/cmdline-tools/latest" \
 && rm /tmp/cmdline-tools.zip

# Acepta solo las licencias de los paquetes que instala (autorizado por el humano el 2026-10-06).
RUN yes | sdkmanager --install platform-tools emulator "$SYSTEM_IMAGE" > /tmp/sdk-install.log 2>&1 \
 || (tail -20 /tmp/sdk-install.log; exit 1)

# avdmanager todavía quiere la ruta con «;», aunque sdkmanager ya la escribe con «/».
RUN echo no | avdmanager create avd --name adp-pixel --package "$(echo "$SYSTEM_IMAGE" | tr / ';')" --device pixel_7

RUN curl -fsSL -o /tmp/maestro.zip https://github.com/mobile-dev-inc/maestro/releases/latest/download/maestro.zip \
 && unzip -q /tmp/maestro.zip -d /opt \
 && rm /tmp/maestro.zip

CMD ["emulator", "-avd", "adp-pixel", "-no-window", "-no-audio", "-no-boot-anim", "-no-snapshot-save", "-gpu", "swiftshader_indirect"]
```
