# Encargo 005 — Emulador y navegador en Docker (T15)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

| Campo | Valor |
|---|---|
| Tarea del plan | `T15` en `docs/05-plan.md` |
| Ticket | `ADP-6` (solo informativo: no lo toques) |
| Agente | codex (esfuerzo medio) |
| Skills a usar | `android-emulator-qa`, `source-driven-development`, `verification-before-completion`, `codigo-legible`, `flujo-git` (en `.agents/skills/`); a demanda `.agents/skills-a-demanda/browser-testing-with-devtools/SKILL.md` si existe |
| Rama y worktree | `ADP-6-emulador-y-navegador-docker`, desde `develop`, tu propio worktree |
| Depende de | T01 (fusionada) |
| Reservado para este encargo | `docker/android/`, `docker/chrome-mcp/`, sus servicios en `compose.yaml`, `.mcp.json`, el flujo trivial de `e2e/`, el script `test:e2e` (ver «Excepción»), y la sección correspondiente de `README.md` |

## Antes de empezar

Lee `AGENTS.md` entero (prohibiciones, regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español; comandos: **todo se ejecuta en Docker** con `./docker/app/run ...`), la tarea T15 de `docs/05-plan.md`, **`docs/agentes/prueba-emulador-docker.md`** (la prueba de concepto del arquitecto: tu punto de partida, con su Dockerfile y lo que se comprobó), DEC-26 en `docs/decisiones.md` y `docs/agentes/orca.md` (sección «Navegador para los agentes»).

## Objetivo

Que los agentes prueben la app sin instalar nada del proyecto en el sistema: un emulador de Android (con KVM) con Maestro, y un Chromium con el MCP de Chrome, los dos en contenedores, con un flujo trivial de Maestro que abre la app en el emulador.

## Qué hacer

1. **Imagen del emulador** en `docker/android/`: parte del Dockerfile de la prueba, pero con **versiones fijadas** (la imagen base, las cmdline-tools, la imagen de sistema de Android, **Maestro con versión concreta**, no `latest`) y la telemetría de Maestro apagada (`MAESTRO_CLI_NO_ANALYTICS=1`; compruébalo en su documentación). Sin ventana (`-no-window`), con `/dev/kvm` y red del anfitrión (`network_mode: host`) para que el `adb` del ordenador y Orca vean el emulador (`emulator-5554`). Servicio `android-emulator` en `compose.yaml`. **Usa siempre `--pull never` / `pull_policy: never` para las imágenes propias** (Docker buscaría en Docker Hub una imagen con el mismo nombre si no existe).
2. **Expo Go dentro del emulador**: instálalo en el emulador (APK de Expo Go compatible con el SDK 56; **descárgalo de la fuente oficial de Expo** y fija la versión y su suma de control; si no hay forma oficial reproducible de obtenerlo, **para y pregunta**).
3. **Flujo trivial de Maestro** en `e2e/` (por ejemplo `e2e/smoke.yaml`): abre la app servida por el contenedor de T01 (`./docker/app/run npm run start`) en el Expo Go del emulador y comprueba que se ve la pestaña «Hoy». Un script `npm run test:e2e` que lo lance (este script y su fila en `AGENTS.md` son la **excepción** a «solo T01 toca `package.json`»: añade **solo ese script**, sin dependencias, y actualiza la línea de `test:e2e` en `AGENTS.md` y en el README).
4. **Imagen del navegador** en `docker/chrome-mcp/`: Chromium sobre una imagen oficial con versión fijada y el **MCP de Chrome** (`chrome-devtools-mcp`, versión fijada como en `docs/agentes/orca.md`: 1.10.1) con `--isolated --headless --no-usage-statistics --no-performance-crux`. Servicio en `compose.yaml`. **`.mcp.json`**: sustituye la entrada `chrome-devtools` (que usa `/usr/bin/chromium` del sistema) por una que lance el MCP **desde su contenedor** (por ejemplo, `docker compose run --rm -i chrome-mcp` por stdio, con `--pull never`; mantén la entrada `atlassian` tal cual). El navegador debe poder abrir `http://localhost:8081` (la web de Expo del contenedor de T01, en la red del anfitrión).
5. **Vista en Orca**: en el `README.md`, una sección corta «Emulador y navegador» con cómo arrancarlos con un comando, cómo comprobar que `adb devices` y `orca emulator devices` ven `emulator-5554` (opción B de DEC-26: en el ordenador solo `adb` y el programa del emulador de `~/Android/Sdk`, que **ya están instalados**; no instales nada en el sistema) y cómo lanzar el flujo.
6. **Pruebas reales**: arranca el emulador, **comprueba de verdad** que arranca (`sys.boot_completed`), que `adb` lo ve, que Maestro corre el flujo contra la app y pasa, y que el MCP de Chrome abre la web. **Pega las salidas** en el informe.

## Fuera de alcance

- Los flujos de caminos críticos (T13), datos sintéticos, el sistema visual, la base de datos.
- Instalar nada en el sistema fuera de Docker; cambiar `docker/app/` salvo que sea imprescindible (si lo es, dilo).
- No añadas dependencias de `package.json`. No toques `docs/contexto.md`, `docs/05-plan.md`, Jira ni otros encargos. **No hagas merge.**

## Paradas (usa `orca orchestration ask` o dilo en el informe)

- Si **algo no puede ir en Docker** (el plan lo dice: parada, se le pregunta al humano), o si no hay forma oficial reproducible de obtener Expo Go para el emulador, o si necesitas una descarga que no sea de una fuente oficial.
- Si el emulador no arranca con KVM (`/dev/kvm` existe y es accesible en este equipo) o la imagen supera lo razonable (la de la prueba pesaba unos 10 GB; el disco tiene sitio, pero no la dupliques sin motivo).
- Cualquier cosa que pida secretos o dinero.

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Con un comando arranca el emulador en Docker y `adb devices` lo ve.
- [ ] El flujo trivial de Maestro pasa contra la app que sirve el contenedor de T01.
- [ ] El MCP de Chrome abre la versión web desde su contenedor.
- [ ] Las imágenes parten de imágenes oficiales con versiones fijadas; nada instalado en el sistema.
- [ ] Lint, tipos, tests y exportación web siguen pasando dentro de Docker; la CI del PR está en verde (gitleaks incluido). Si la CI no puede ejecutar el emulador, no lo añadas a la CI y dilo.
- [ ] Cumple la regla de legibilidad de `AGENTS.md` (también en scripts y Dockerfiles: comentarios en español que explican el porqué).
- [ ] PR abierto **contra `develop`** con `ADP-6` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué, con las versiones fijadas; dudas; resultado de las pruebas con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
