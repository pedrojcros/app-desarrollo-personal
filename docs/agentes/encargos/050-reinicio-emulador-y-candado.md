# Encargo 050 — Reinicio del emulador y candado con tiempo máximo (DEC-45, encargo C)

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Ticket | `ADP-30` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6.1-sol` (entorno delicado; DEC-41) |
| Skills | `systematic-debugging`, `codigo-legible` (en `.agents/skills/`) |
| Rama | `ADP-30-reinicio-emulador`, desde `origin/develop` |
| Reservado | `docker/android/reset` (nuevo), `scripts/with-heavy-lock` (nuevo), la sección del emulador y de Maestro del `README.md`. `docker/android/test`, `docker/android/start` y `compose.yaml` **solo si es imprescindible**, y lo justificas en el PR |

Lee la regla de legibilidad de `AGENTS.md` (vale también para los scripts de shell) y, de la [propuesta](../../propuestas/mejora-del-flujo.md), solo el apartado **P5**. Mira cómo están hechos `docker/android/start`, `docker/android/test` y el servicio `android-emulator` de `compose.yaml`, y la sección de Maestro del `README.md`.

## Objetivo

Que preparar el emulador sea **una orden** que siempre deja lo mismo, y que **ningún proceso retenga para siempre** el candado `/tmp/adp-pesado.lock` que comparten todos los trabajadores.

## Qué pasaba (por qué existe este encargo)

En la versión 1 se perdió más de un día con el emulador:

- Tras un apagado brusco, el emulador no arrancaba («Running multiple emulators with the same AVD»): el AVD vive dentro del contenedor y conserva sus `.lock`. Se arreglaba con `docker compose rm -sf android-emulator` y levantándolo otra vez.
- ADB perdía el dispositivo a mitad de Maestro.
- **El servidor `adb` del puerto 5037 es el del contenedor del emulador** (usa la red del anfitrión) y lo usa también el panel de Orca: **no lo mates ni lo reinicies**.
- Un `jest` que no terminaba retuvo el candado y paró a todos.
- `docker run` con una imagen propia que no existe la busca en Docker Hub: siempre `--pull never`.

## Qué hacer

1. **`docker/android/reset`** (POSIX `sh`, ejecutable):
   - quita el contenedor del emulador y sus `.lock` (`docker compose rm -sf android-emulator` o lo que sea más limpio);
   - lo levanta con `docker compose up -d --pull never --wait android-emulator`;
   - comprueba que `emulator-5554` aparece en `adb devices` desde el anfitrión o el contenedor, y que `sys.boot_completed` vale 1;
   - con un tiempo máximo de espera y un mensaje claro si falla;
   - termina dejando el emulador listo para `npm run test:e2e`, sin pasos a mano.
2. **`scripts/with-heavy-lock`** (POSIX `sh`): `scripts/with-heavy-lock <orden> [argumentos...]`.
   - Toma `/tmp/adp-pesado.lock` con `flock`, esperando como mucho `HEAVY_LOCK_WAIT_MINUTES` (por defecto 30).
   - Ejecuta la orden con `timeout`, con un máximo de `HEAVY_LOCK_MAX_MINUTES` (por defecto 45) y una muerte forzada poco después.
   - **Si la orden era un `./docker/app/run ...`**, comprueba que al vencer no queda su contenedor vivo.
   - Al vencer (o al no conseguir el candado), imprime qué pasó y, si existe `scripts/incidents/record_incident.py` (lo crea otro encargo a la vez que tú), anota la incidencia:

     ```sh
     python3 scripts/incidents/record_incident.py --type environment --minutes <minutos> --cause "<qué orden venció el candado>" --source orchestrator
     ```

     Si el fichero no existe, no falla.
   - Devuelve el código de salida de la orden (o 124 si venció).
3. **Pruébalo de verdad** en este equipo:
   - el candado, con una orden corta que vence (`HEAVY_LOCK_MAX_MINUTES` pequeño o una variable de segundos solo para pruebas, documentada) y con dos órdenes a la vez;
   - el reinicio, al menos dos veces seguidas, una de ellas con el emulador ya en marcha.
4. **`README.md`:** en la sección de Maestro, `docker/android/reset` antes de los caminos críticos y `scripts/with-heavy-lock` en lugar de `flock` a pelo.
5. Commits pequeños en español, push y PR contra `develop` con `ADP-30` en el título. En la descripción, la salida de las pruebas del punto 3.

## El emulador es compartido

Otro trabajador (encargo 051) lo necesitará un rato a la vez que tú.

- **Antes de arrancar, reiniciar o parar el emulador**, pide turno al orquestador con `orca orchestration ask` y espera su respuesta.
- **Al terminar**, avisa con otro `ask` para devolver el turno.
- **No ejecutes Maestro**: no hace falta para este encargo.

## Fuera de alcance

- `docs/` (lo actualiza el orquestador), `scripts/incidents/`, `scripts/orca/` y la app.
- La imagen del emulador (`docker/android/Dockerfile`, `install`).
- El Supabase local: es compartido; nunca `stop`, `start` ni `db reset`.

Si algo no está claro, pregunta con `orca orchestration ask`. Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`); el informe de seis puntos de la plantilla, en la descripción del PR.
