# Encargo 073 (continuación) — Terminar el cierre de la 1.1.1 con Maestro

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1.1, cierre (encargo 073). Lo empezó un trabajador de Codex que se quedó sin cuota |
| Ticket | `ADP-45` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills | `flujo-git`, `systematic-debugging` y, a demanda, `.agents/skills-a-demanda/android-emulator-qa/SKILL.md` |
| Rama | Tu worktree ya está en la rama `pedrojcros/ADP-45-cierre-maestro`, con el trabajo anterior en el commit `2923269` (sin verificar). Sigue ahí |
| Reservado | `e2e/**` y, en `docs/02-funcionalidades.md`, solo el estado de RF-41. **No toques `src/`** |

Lee `AGENTS.md`, el encargo original (`docs/agentes/encargos/073-cierre-maestro.md` en `origin/docs/sesion-2026-10-14-pulido`: `git show origin/docs/sesion-2026-10-14-pulido:docs/agentes/encargos/073-cierre-maestro.md`) y el apartado «Entorno de pruebas: Supabase, emulador y Docker» de `docs/agentes/trampas.md`. El Supabase local **ya está arrancado y es compartido**: no hagas `db reset`, `stop` ni `start`. **Eres el único que usa el emulador.**

## Dónde se quedó

- El trabajo anterior está en `2923269`: `e2e/upcoming.yaml` y `e2e/upcoming-week-title.js` (flujo nuevo de Próximo, ya en `critical-paths.yaml`) y ajustes en `history.yaml`, `mark-today.yaml`, `quick-add-keyboard.yaml` y `quick-task.yaml`. **No se ha ejecutado nunca entero en verde.**
- Tres intentos de Maestro fallaron: (1) un aviso de System UI del emulador; (2) vuelta al lanzador tras Enter o Atrás en `quick-task.yaml`; (3) el menú de añadir se cerraba antes de «Enviar».
- El diagnóstico (encargo 078, PR #99, ya fusionado en `develop`) encontró dos causas. Una era **un fallo de la app**: un «teclado oculto» tardío cerraba el menú tras guardar, y está corregido. La otra es **una trampa de Maestro 2.11**: `inputText` con caracteres no ASCII (acentos, «ñ») cambia el método de entrada, oculta el teclado y cierra el menú. Por eso los textos de los flujos que escriben en el añadir rápido deben ser **ASCII** («E2E tarea rapida») y pulsar «Enviar», como ya hace `quick-task.yaml`.

## Qué hacer

1. `git fetch origin` y `git merge origin/develop` en tu rama, para traer el arreglo del #99 y lo demás de la ronda. Si hay conflictos en `e2e/`, resuélvelos conservando lo de tu rama y lo nuevo de `develop`. Lint en verde.
2. Revisa que ningún flujo escribe texto no ASCII con `inputText` en el añadir rápido (o en cualquier campo, si da igual el texto); si lo hay, cámbialo a ASCII.
3. Emulador limpio: `./docker/android/reset`.
4. Expo para el emulador en el 8090, en segundo plano: `./docker/app/run env EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321 npm run start -- --port 8090`.
5. **Una ejecución completa** de todos los flujos, a tamaño normal y a 360 dp: `scripts/with-heavy-lock ./docker/app/run env EXPO_PORT=8090 npm run test:e2e`.
6. Si un flujo falla por el flujo (texto cambiado, espera corta, un aviso del sistema que hay que cerrar), corrígelo y repite **solo ese flujo** para comprobar el arreglo (`maestro test e2e/<flujo>.yaml` como lo haga el lanzador; mira `package.json` y `e2e/`). Al final, **una ejecución completa más** en verde. Como mucho tres ejecuciones completas en total: si a la tercera no pasa, para y pregunta.
7. Si falla **por la app** (por ejemplo, el menú de añadir se cierra solo tras «Enviar», o la app se cierra), **no toques `src/`**. Guarda la captura y el registro de Maestro en `~/capturas-adp/073/`, para y pregunta con `orca orchestration ask`.
8. En `docs/02-funcionalidades.md`, el estado de RF-41: «hecho en ADP-44 (encargo 072), versión 1.1.1», con el mismo formato que las demás RF hechas.
9. Commits en español, push y PR contra `develop` con `ADP-45` en el título. Para el servidor de Expo que arrancaste; el emulador se queda encendido.

## Criterio de hecho

- [ ] Una ejecución completa de todos los flujos, incluido `upcoming.yaml`, en verde a tamaño normal y a 360 dp.
- [ ] RF-41 marcada como hecha.
- [ ] PR **contra `develop`** con `ADP-45` en el título. **No hagas merge**.

## Cómo informar al terminar

En la descripción del PR, en formato corto: **Hecho**, **Ficheros**, **Decisiones**, **Dudas** y **Tests** (la orden de Maestro y su resultado: cuántos flujos, en qué tamaños, cuántas ejecuciones completas hiciste y qué ajustaste) y **PR**. Al final, `worker_done` con un resumen de tres frases y `--outcome succeeded|failed`.
