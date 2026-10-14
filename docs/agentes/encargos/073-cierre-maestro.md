# Encargo 073 — Cierre de la 1.1.1: Maestro una vez y RF-41 hecha

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1.1, cierre de la ronda (DEC-45: Maestro solo al cerrar) |
| Ticket | `ADP-45` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6-luna` |
| Skills | `flujo-git`, `systematic-debugging` y, a demanda, `.agents/skills-a-demanda/android-emulator-qa/SKILL.md` |
| Rama | `ADP-45-cierre-maestro`, desde `origin/develop` (con todos los encargos de la ronda fusionados) |
| Reservado | `e2e/**` y, en `docs/02-funcionalidades.md`, solo el estado de RF-41. Si un flujo falla por la app y no por el flujo, **no** toques `src/`: para y pregunta |

Lee `AGENTS.md` y el apartado «Entorno de pruebas: Supabase, emulador y Docker» de `docs/agentes/trampas.md`. El Supabase local **ya está arrancado y es compartido**: no hagas `db reset`, `stop` ni `start`. **Eres el único que usa el emulador** en este momento. Si el worktree no tiene `node_modules`, `./docker/app/run npm ci`; si no tiene `.env`, `cp .env.example .env`.

## Objetivo

Comprobar en el emulador, con **una sola** ejecución de todos los flujos de Maestro, que la versión 1.1.1 funciona, y dejar escrito el flujo nuevo de Próximo.

Lo que ha cambiado en esta ronda (para entender por qué puede fallar un flujo):

- Hoy no tiene título visible, ni fecha, ni flechas (065).
- El añadir rápido es más pequeño y se cierra con el atrás del sistema. El borrador conserva lo escrito (066/076; `e2e/quick-add-keyboard.yaml` ya está adaptado) y tiene una animación al abrir (067).
- Historial se desplaza (068).
- El selector de categoría de los formularios ya no flota (069).
- La pestaña Categorías es ahora **Listas**, con la Bandeja dentro (071), y hay una pestaña nueva, **Próximo** (072). La barra queda: Hoy · Próximo · Listas · Pendientes · Historial.

## Qué hacer

1. **Flujo nuevo `e2e/upcoming.yaml`**, como los demás, y añadido a `e2e/critical-paths.yaml`: crea una tarea con fecha **de la semana siguiente** (por el formulario completo o el añadir rápido, como te resulte más estable), abre la pestaña Próximo, comprueba que la tarea sale bajo el título de su semana, ábrela y comprueba que se abre su ficha. Y que en Próximo no hay botones de marcar.
2. **Emulador limpio:** `./docker/android/reset` (README, «Pruebas en el emulador»).
3. **Expo para el emulador** en el puerto 8090, con la URL de Supabase que ve Android: `./docker/app/run env EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321 npm run start -- --port 8090` (en segundo plano).
4. **Una sola ejecución de todos los flujos**, a tamaño normal y a 360 dp, como hace el lanzador: `scripts/with-heavy-lock ./docker/app/run env EXPO_PORT=8090 npm run test:e2e`.
5. Si un flujo falla **por un texto o un paso que esta ronda ha cambiado** (por ejemplo «Categorías» por «Listas», o el «Hoy» que ya no sale en grande), corrige el flujo y repite solo lo necesario. Al final, una ejecución completa en verde. Si falla **por un fallo de la app**, no lo arregles: guarda la captura y el registro de Maestro, para y pregunta con `orca orchestration ask`. Mira en especial que, en `quick-add-keyboard.yaml`, tras «Enviar» el menú siga abierto con el teclado: si se cierra solo, es un fallo de la app.
6. En `docs/02-funcionalidades.md`, RF-41 con su estado «hecho» (como las demás RF hechas, con el ticket `ADP-44` y la versión 1.1.1).
7. Al terminar: para el servidor de Expo que arrancaste. El emulador se queda encendido.

## Fuera de alcance

- `src/` y cualquier otro fichero de `docs/`.
- Ejecutar Maestro más veces de las necesarias: cada ejecución completa tarda y bloquea el emulador.

## Criterio de hecho

- [ ] Todos los flujos, incluido `upcoming.yaml`, pasan en el emulador a tamaño normal y a 360 dp, en una ejecución completa.
- [ ] RF-41 marcada como hecha.
- [ ] PR **contra `develop`** con `ADP-45` en el título. **No hagas merge**.

## Cómo informar al terminar

En la descripción del PR, en formato corto (DEC-45): **Hecho**, **Ficheros**, **Decisiones**, **Dudas** y **Tests** (la orden de Maestro y el resultado: cuántos flujos y en qué tamaños; qué flujos tuviste que ajustar y por qué) y **PR**. Si algo no está claro, pregunta con `orca orchestration ask`. Al final, `worker_done` con un resumen de tres frases y `--outcome succeeded|failed`.
