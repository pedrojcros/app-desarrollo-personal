# Encargo 070 — Próximo, dominio

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1.1, RF-41 y RN-46 (DEC-51, fila 7 del pulido) |
| Ticket | `ADP-42` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6-luna` |
| Skills | `test-driven-development` y `codigo-legible` (en `.agents/skills/`) |
| Rama | `ADP-42-proximo-dominio`, desde `origin/develop` |
| Reservado | `src/domain/views/upcoming.ts` y `src/domain/views/upcoming.test.ts`. Nada más |

Lee la regla de legibilidad de `AGENTS.md` y el apartado «Fechas» de sus convenciones. No uses el emulador ni Supabase. Si el worktree no tiene `node_modules`, `./docker/app/run npm ci`.

## Objetivo

Una función pura que calcula lo que enseñará la vista nueva **Próximo**: lo que toca desde mañana hasta el domingo de la cuarta semana siguiente, agrupado por semana y por día, sin los hábitos que tocan todos los días. La pantalla la hace otro encargo (072) contra este mismo contrato.

## Contexto que necesitas

- **RN-46** y el **escenario 11 de CU-03** en `docs/03-casos-de-uso.md` (busca «RN-46» y «Escenario 11: Próximo»).
- El apartado «070 — Próximo, dominio» de `docs/propuestas/pulido-visual.md`: es el encargo completo, con los casos de prueba.
- Para inspirarte en la forma, `src/domain/views/today.ts` y `src/domain/views/category.ts`. Las piezas que usas: `getHabitOccurrences` (`src/domain/habit-occurrences.ts`), `ViewItem` y `compareViewItemsForDay` (`src/domain/items.ts`), `HabitMark` y las entidades (`src/domain/entities.ts`), `CalendarDate` (`src/domain/types.ts`) y las utilidades de fechas que ya hay en `src/domain`.

## Contrato (lo usa el 072: no lo cambies)

```ts
export interface UpcomingDay { date: CalendarDate; items: ViewItem[] }
export interface UpcomingWeek {
  /** Lunes de la semana. */
  weekStart: CalendarDate;
  /** true para la semana de hoy («Esta semana»). */
  isCurrentWeek: boolean;
  /** Solo los días con algo, en orden. */
  days: UpcomingDay[];
}
export function getUpcomingRange(today: CalendarDate): { from: CalendarDate; to: CalendarDate };
export function getUpcomingWeeks(input: {
  habits: Habit[]; marks: HabitMark[]; tasks: Task[]; today: CalendarDate;
}): UpcomingWeek[];
export function formatWeekTitle(week: UpcomingWeek): string; // «Esta semana» o «Semana del 19 al 25 de octubre»
```

Usa los tipos `Habit` y `Task` que ya usa `today.ts` (con sus reglas de frecuencia). Si el contrato no encaja con esos tipos, no lo cambies por tu cuenta: pregunta con `orca orchestration ask`.

## Qué hacer

1. **Rango** (RN-46): `from` = mañana; `to` = el domingo de la cuarta semana siguiente a la actual (semanas de lunes a domingo). Si hoy es domingo, no hay «Esta semana».
2. **Qué entra:** tareas no archivadas, pendientes, con fecha dentro del rango; ocurrencias de hábitos no archivados dentro del rango, **salvo** las de un hábito que en esa fecha toca todos los días según su regla vigente («todos los días», «cada 1 día» o los siete días de la semana). Usa el motor de ocurrencias sin cambiarlo (ADR-0003).
3. **Orden:** semanas y días en orden; dentro del día, `compareViewItemsForDay`. Salen siempre todas las semanas del rango, aunque estén vacías (`days: []`).
4. **Tests**, que pasen con `npm run test:zones`: el escenario 11 de CU-03; hoy domingo; hoy lunes; un cambio de hora dentro del rango; un hábito que pasa de diario a días de la semana a mitad del rango; un hábito con los siete días de la semana; tareas hechas o archivadas que no salen; el título de una semana que cruza de mes («Semana del 26 de octubre al 1 de noviembre»).

## Fuera de alcance

- Cualquier fichero fuera de los dos reservados (ni `today.ts`, ni `items.ts`, ni el motor de ocurrencias). Si crees que hace falta tocar otro, pregunta.
- `docs/`.

## Criterio de hecho

- [ ] El contrato exacto de arriba, exportado desde `src/domain/views/upcoming.ts`.
- [ ] `./docker/app/run npm run test:zones` y `./docker/app/run npm run test` en verde, con cobertura completa de `upcoming.ts` (dila en el informe).
- [ ] `./docker/app/run npm run lint` y `./docker/app/run npm run typecheck` en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR **contra `develop`** con `ADP-42` en el título. **No hagas merge**.

## Cómo informar al terminar

En la descripción del PR, en formato corto (DEC-45): **Hecho**, **Ficheros**, **Decisiones**, **Dudas**, **Tests** (comando y resultado en una línea, y cobertura) y **PR**. Si algo no está claro, pregunta con `orca orchestration ask`. Al final, `worker_done` con un resumen de tres frases y `--outcome succeeded|failed`.
