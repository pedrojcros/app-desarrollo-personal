# Encargo 051 — Tres detalles visuales vistos en el emulador

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Ticket | `ADP-27` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` (hay que averiguar la causa de cada uno) |
| Skills | `systematic-debugging`, `codigo-legible`, `android-emulator-qa` (en `.agents/skills/`) |
| Rama | `ADP-27-detalles-visuales`, desde `origin/develop` |
| Reservado | `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/hoy.tsx`, `src/components/quick-add/` y `src/components/date-field/`, con sus tests; capturas nuevas en `docs/diseno/capturas/detalles-visuales/`. Otro fichero, solo si la causa lo pide (dilo en el PR) |

Lee la regla de legibilidad de `AGENTS.md`. De `docs/diseno.md`, solo lo que hable de la cabecera, de Hoy y del añadir rápido.

## Qué pasa

Vistos en el emulador de Android el 2026-10-09 (captura: `docs/diseno/capturas/anadir-rapido/teclado-android-arreglado.png`):

1. **Título «Hoy» duplicado:** en Hoy sale en la cabecera de la pestaña y otra vez en grande debajo.
2. **Botón de Ajustes con dos engranajes:** el botón de la cabecera (`SettingsButton` en `src/app/(tabs)/_layout.tsx`) se ve con dos iconos de engranaje superpuestos.
3. **Fecha en bruto en el añadir rápido:** bajo los atajos de fecha aparece «2026-10-09» en vez de la fecha con formato.

## Qué hacer

1. **Para cada uno, demuestra la causa antes de cambiar nada** (`systematic-debugging`). Si el 2 o el 1 solo pasan en Android o solo en la web, dilo.
2. **Arréglalo sin dependencias nuevas** y con los tokens y componentes que ya hay. Para la fecha:
   - usa el formato que ya usa la app en otros sitios (mira `src/components/date-field/format.ts` y `src/domain/calendar-date.ts`);
   - no inventes uno nuevo.
3. **Un test por detalle** (Jest y React Native Testing Library) que **falle antes** de tu arreglo y pase después:
   - el título de Hoy aparece una sola vez;
   - el botón de Ajustes tiene un solo icono;
   - el añadir rápido muestra la fecha con formato y no `YYYY-MM-DD`.
4. **Compruébalo en el emulador con capturas**, sin Maestro: Hoy, la cabecera y el añadir rápido abierto con una fecha elegida.
   - Primero a tamaño normal y después a 360 dp (`adb shell wm size` y `wm density`, como hace `docker/android/test`).
   - Al terminar, restaura el tamaño.
   - Guarda las capturas en `docs/diseno/capturas/detalles-visuales/`.
5. Lint, tipos y `npm run test` en verde (todo con `./docker/app/run ...`). Commits pequeños en español, push y PR contra `develop` con `ADP-27` en el título.

## El emulador es compartido

Otro trabajador (encargo 050) está haciendo un script que reinicia el emulador.

- **Antes de usarlo, pide turno** al orquestador con `orca orchestration ask` y espera su respuesta.
- **Al terminar, devuélvelo** con otro `ask`. Mientras tanto, avanza con las causas y los tests.

Cómo usarlo:

- Expo en el puerto **8090**, con `EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321` (dentro de Android, `127.0.0.1` no es el ordenador).
- El usuario de pruebas se prepara con `node scripts/e2e/prepare-user.mjs` (lee la sección de Maestro del `README.md`).
- Si el emulador no está en marcha: `docker compose up -d --pull never --wait android-emulator`.
- Si sale «Running multiple emulators with the same AVD»: `docker compose rm -sf android-emulator` y volver a levantarlo.
- **No pares ni reinicies el servidor `adb`** del puerto 5037.
- Al terminar, para tu Expo.

## Fuera de alcance

- `docs/contexto.md`, la bitácora y `docs/decisiones.md`: los actualiza el orquestador.
- Cualquier otro detalle visual que veas: anótalo en el PR, no lo arregles.
- El Supabase local es compartido: nunca `stop`, `start` ni `db reset`.

Si algo no está claro, pregunta con `orca orchestration ask`. Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`); el informe de seis puntos de la plantilla, en la descripción del PR.
