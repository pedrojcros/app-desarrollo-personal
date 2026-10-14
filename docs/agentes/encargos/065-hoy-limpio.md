# Encargo 065 — Hoy limpio

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1.1, DEC-51 puntos 1 y 2 (fila 2 del pulido) |
| Ticket | `ADP-37` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills | `codigo-legible` y `test-driven-development` (en `.agents/skills/`) |
| Rama | `ADP-37-hoy-limpio`, desde `origin/develop` |
| Reservado | `src/app/(tabs)/hoy.tsx`, `src/components/today/**`, `src/domain/views/today*.ts`; además `docs/04-arquitectura.md` solo si nombra el navegador de días |

Lee la regla de legibilidad de `AGENTS.md`. No uses el emulador ni Supabase. Si el worktree no tiene `node_modules`, `./docker/app/run npm ci`.

## Objetivo

Que Hoy sirva solo para ver lo pendiente de hoy y marcarlo: sin título visible, sin fecha y sin flechas para ver otros días. Arriba de la lista, solo la línea fina de progreso del día.

## Qué hacer

Lee **solo** el apartado «065 — Hoy limpio» de `docs/propuestas/pulido-visual.md`: es el encargo completo. En resumen:

1. Quitar `src/components/today/day-navigator.tsx`, su uso en `today-header.tsx` y `hoy.tsx`, y el estado de la fecha elegida: Hoy muestra siempre hoy. Lo que quede sin uso (por ejemplo `getDayTitle` o `formatLongDate` en `src/domain/views/today.ts`, o la rama «Ese día…» de los mensajes) se borra con sus tests. `canMarkDay` y el apartado «Marcadas hoy» se quedan.
2. Sin título ni fecha: arriba de la lista, solo `DayProgress` (`src/components/ui/day-progress.tsx`, no lo cambies), con poco relleno.
3. Un encabezado «Hoy» **invisible** que sí lee el lector de pantalla (`accessibilityRole="header"`; en la web, oculto a la vista y no al lector). El test que comprueba que «Hoy» es un encabezado accesible sigue pasando.
4. Tests: Hoy sin selector de días, sin título visible, con el encabezado accesible y con la línea de progreso. Los tests de `today-screen` y `today-header` que hablaban de otros días se quitan.

Si un fichero **fuera** de los reservados importa algo que borras, no lo conserves por tu cuenta ni toques ese fichero: para y pregunta con `orca orchestration ask`.

## Fuera de alcance

- `src/components/ui/**`, el añadir rápido (`src/components/quick-add/**`), `(tabs)/_layout.tsx` y cualquier otra pantalla.
- `docs/contexto.md`, la bitácora y `docs/decisiones.md`: los actualiza el orquestador.

## Criterio de hecho

- [ ] Hoy empieza con la línea de progreso y la lista; no hay flechas, ni fecha, ni título visible.
- [ ] `./docker/app/run npm run lint`, `./docker/app/run npm run typecheck`, `./docker/app/run npm run test` y `./docker/app/run npm run test:zones` en verde.
- [ ] `docs/04-arquitectura.md` no nombra el navegador de días (si lo nombraba, corregido en el mismo PR).
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR **contra `develop`** con `ADP-37` en el título. **No hagas merge**.

## Cómo informar al terminar

En la descripción del PR, en formato corto (DEC-45): **Hecho**, **Ficheros**, **Decisiones**, **Dudas**, **Tests** (comando y resultado en una línea) y **PR**. Si algo no está claro, pregunta con `orca orchestration ask`. Al final, `worker_done` con un resumen de tres frases y `--outcome succeeded|failed`.
