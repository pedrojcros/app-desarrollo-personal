# Encargo 014 — Historial (T08)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

| Campo | Valor |
|---|---|
| Tarea del plan | `T08` en `docs/05-plan.md` |
| Ticket | `ADP-11` (solo informativo: no lo toques) |
| Agente | codex (esfuerzo medio-alto) |
| Skills a usar | `expo-data-fetching`, `vercel-react-native-skills`, `test-driven-development`, `frontend-ui-engineering`, `codigo-legible`, `flujo-git` (en `.agents/skills/`) |
| Rama y worktree | `ADP-11-historial`, desde `develop`, tu propio worktree |
| Depende de | T02, T03, T14 y la base común de vistas (encargo 010), fusionadas en `develop` |
| Reservado para este encargo | `src/domain/views/history.ts` y sus tests; `src/data/history.ts` y sus tests; `src/components/history-grid/`; `src/components/date-field/` (la usarán T05, T06 y T16); la pantalla `src/app/(tabs)/historial.tsx` |

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

## Antes de empezar

Lee `AGENTS.md` entero (capas: `src/domain` sin React, Expo ni Supabase; regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español; **todo en Docker** con `./docker/app/run ...`). Lee CU-05 y RN-16, RN-17 y RN-33 en `docs/03-casos-de-uso.md`, RF-15 en `docs/02-funcionalidades.md`, el Historial en `docs/diseno.md` (cuadrícula: una fila por hábito o tarea, una columna por día, ✓, ✗ y «sin marcar», celda vacía si ese día no tocaba, y debajo el porcentaje de cada día; prototipo en `docs/diseno/rondas/ronda-2/index.html`), la decisión **DEC-37** (punto 6: **porcentaje = hechas sobre todo lo que tocaba ese día**), y la base común que ya está en `develop`: `src/domain/items.ts`, `src/domain/entities.ts`, `src/domain/habit-occurrences.ts`, `src/data/agenda.ts`, `src/data/query-keys.ts`, `src/data/use-today.ts`, `src/data/time-zone.ts` y `src/data/result.ts`.

## Objetivo

La pantalla de historial por rango (por defecto, los últimos 7 días), con el estado final de cada hábito y tarea, incluido «sin marcar», y el porcentaje de cada día.

## Reglas (lo que no está aquí, pregúntalo con `orca orchestration ask`)

- **Rango**: por defecto, de hoy − 6 a hoy (7 días). El usuario elige otra fecha de inicio y de fin. La fecha final **no puede ser posterior a hoy**; si es anterior a la inicial, no se aplica y se dice «La fecha final no puede ser anterior a la inicial» (E1); como mucho **366 días** («Elige como mucho un año»). Columnas de **la más reciente a la más antigua** (hoy a la izquierda).
- **Hábitos** (archivados incluidos, RN-16): sus ocurrencias en el rango con `getHabitOccurrences` (que ya respeta el archivado), con el estado de sus marcas; además, **toda marca** del rango aunque no caiga en una ocurrencia calculada (por ejemplo, de antes de un cambio de regla o de después de archivar) aparece en su día.
- **Tareas**: con fecha dentro del rango, en su fecha; **sin fecha y marcadas**, en el día (zona del dispositivo) en que se marcaron (RN-33); las **archivadas solo si están marcadas**.
- **Estado de cada celda**: `done`, `not_done`, `unmarked` (pendiente de un día anterior a hoy, RN-17: nunca se muestra como «no hecha»), `pending` (de hoy, sin marcar todavía) y vacía (ese día no tocaba).
- **Porcentaje de cada día** (DEC-37): hechas ÷ todo lo que tocaba ese día (hechas, no hechas, sin marcar y pendientes de hoy), redondeado a un entero; «—» si ese día no tocaba nada.
- **Orden de las filas**: primero los hábitos (por la hora de su día con `compareViewItemsForDay`; sin hora, al final; después por nombre), luego las tareas (por fecha, de la más reciente a la más antigua, y después por nombre).

## Qué hacer

1. **Dominio** en `src/domain/views/history.ts` (puro, tests exhaustivos):

   ```ts
   export type HistoryCell = 'done' | 'not_done' | 'unmarked' | 'pending' | 'empty';
   export interface HistoryRow { key: string; name: string; kind: 'habit' | 'task'; categoryId: string | null; cells: HistoryCell[] } // una celda por día, en el orden de `days`
   export interface HistoryGrid { days: CalendarDate[]; rows: HistoryRow[]; dayPercentages: (number | null)[] }
   export type HistoryRangeError = 'end_before_start' | 'end_after_today' | 'too_long';
   export function validateHistoryRange(fromDate: CalendarDate, toDate: CalendarDate, today: CalendarDate): HistoryRangeError | null;
   export function getHistoryItems(input: { habits: Habit[]; marks: HabitMark[]; tasks: Task[]; fromDate: CalendarDate; toDate: CalendarDate }): ViewItem[];
   export function buildHistoryGrid(items: ViewItem[], fromDate: CalendarDate, toDate: CalendarDate, today: CalendarDate, timeZone: string): HistoryGrid;
   ```

   Las vistas guardan en caché un `ViewData` (`{ items }`) y la cuadrícula se calcula al pintar (así, cuando T07 marca algo, el historial lo refleja al instante). Para colocar una tarea sin fecha usa el día de `markedAt` en `timeZone` (`getCalendarDateInTimeZone` de T03).
2. **Datos** en `src/data/history.ts`: `useHistory(fromDate, toDate)` con la clave `queryKeys.history(fromDate, toDate)`, que guarda un `ViewData`; lee con `fetchHabits({ includeArchived: true, timeZone })`, `fetchHabitMarks({ fromDate, toDate })` y una consulta de tareas convertida con `mapTaskRow` (para las tareas sin fecha marcadas, pide un margen de un día a cada lado en UTC y filtra en el dominio por el día local). Si cualquier lectura falla, error: **nunca datos parciales como si estuvieran completos** (E2).
3. **Selector de fecha** en `src/components/date-field/` (lo reutilizarán T05, T06 y T16): `DateField({ label, value, onChange, minimumDate?, maximumDate? })` y `TimeField({ label, value, onChange })` (valores `CalendarDate` y `'HH:MM'`). En Android, `@react-native-community/datetimepicker` (ya instalado, DEC-25); **en la web, el selector del navegador** (`<input type="date">` y `<input type="time">` en un fichero `.web.tsx`). Etiquetas accesibles y uso con teclado en la web. Fechas mostradas en español («martes, 6 de octubre de 2026»).
4. **Cuadrícula** en `src/components/history-grid/`: la primera columna con los nombres fija y los días con desplazamiento horizontal; ✓ con el color de la categoría (neutro si es de la Bandeja), ✗ con el color de «no hecho», «sin marcar» con una marca discreta distinta de las dos, pendiente de hoy distinto de «sin marcar», y celda vacía; cabeceras de día cortas («Mar 6»); fila de porcentajes debajo. Cada celda con etiqueta de accesibilidad en español («Nadar, martes 6 de octubre: hecha»). Solo tokens de `src/theme`. Con 366 columnas y 50 filas, que no se atasque (listas virtualizadas o lo que recomiende la skill de rendimiento).
5. **Pantalla** `src/app/(tabs)/historial.tsx` (**no la conviertas en carpeta**: cambiaría el nombre de la pestaña en `src/app/(tabs)/_layout.tsx`, que no es tuyo): el rango con los dos `DateField`, la cuadrícula, el estado vacío («No hay nada en estas fechas», A4), el de carga y el de error (E2, con «Reintentar»). Pantalla fina.
6. **Tests**: los **escenarios 1, 3, 4 y 5 de CU-05**; dominio exhaustivo (archivados antes y después, marcas fuera de la regla, cambio de regla dentro del rango, tareas sin fecha marcadas cerca de la medianoche de Madrid, porcentajes con y sin elementos, rangos límite: un día, 366, 367, fin después de hoy); integración de `useHistory`/lecturas contra el **Supabase local compartido** (ya arrancado con las migraciones de `develop`: **no** hagas `db reset`, `stop` ni `start`); componentes de la pantalla y del selector de fecha con datos simulados.

## Fuera de alcance

Filtrar el historial (RF-16) y corregir desde él (RF-17): son deseables y no entran (las celdas no se pulsan). Marcar (T07). `package.json`, `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, Jira, `docs/contexto.md`, otros encargos. **No hagas merge.** Otro trabajador puede usar los puertos 8081 u 8090: elige uno libre.

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan los escenarios 1, 3, 4 y 5 de CU-05 y el resto de tests; cobertura de líneas de `src/domain/views/history.ts` ≥ 90 %.
- [ ] Lint, tipos, tests unitarios, integración y exportación web en verde dentro de Docker; CI del PR en verde.
- [ ] En la web (MCP de Chrome) se ve la cuadrícula con el rango por defecto y se cambia el rango con el selector del navegador.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-11` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
