# Encargo 010 — Base común de vistas y marcas (preparación de T07 a T11)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

| Campo | Valor |
|---|---|
| Tarea del plan | Preparación compartida de `T07` (y de T08 a T11, que la usarán). La decide el orquestador: es cómo se reparte el trabajo, no un cambio de alcance |
| Ticket | `ADP-10` (T07; solo informativo: no lo toques) |
| Agente | codex (esfuerzo medio-alto) |
| Skills a usar | `api-and-interface-design`, `test-driven-development`, `expo-data-fetching`, `codigo-legible`, `flujo-git` (en `.agents/skills/`) |
| Rama y worktree | `ADP-10-base-comun-de-vistas`, desde `develop`, tu propio worktree |
| Depende de | T01, T02 y T03 (fusionadas en `develop`) |
| Reservado para este encargo | `src/domain/items.ts`, `src/domain/entities.ts`, `src/domain/habit-occurrences.ts`, `src/data/query-keys.ts`, `src/data/time-zone.ts`, `src/data/use-today.ts`, `src/data/agenda.ts`, añadir `unwrapResult` y `DataResultError` a `src/data/result.ts`, y sus tests |

## Antes de empezar

Lee `AGENTS.md` entero (capas: `src/domain` no importa React, Expo ni Supabase; regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español; **todo en Docker** con `./docker/app/run ...`). Lee [ADR-0003](../../adr/0003-ocurrencias-calculadas.md), el modelo de datos de `docs/04-arquitectura.md`, `src/domain/types.ts` y `src/domain/recurrence.ts` (T03), y `src/data/result.ts`, `src/data/supabase/client.ts` y `src/data/database.types.ts` (T02).

## Para qué sirve

Las vistas (Hoy, categoría y Bandeja, pendientes de días anteriores e historial) las construyen tareas distintas, algunas a la vez, y **marcar algo tiene que verse al instante en todas** (actualización optimista con TanStack Query, T07). Para eso todas comparten: qué es un elemento de una vista, cómo se identifica lo que se marca, cómo se leen hábitos y marcas, qué día es hoy y cómo se llaman las claves de la caché. Este encargo crea solo eso, con tests. **No crea pantallas.**

## Contrato (escrito por el orquestador; lo usarán T04 a T11 tal cual: no lo cambies sin preguntar con `orca orchestration ask`)

### `src/domain/items.ts` (puro)

```ts
import type { CalendarDate } from './types';

export type ItemStatus = 'pending' | 'done' | 'not_done';

/** Lo que se marca: una ocurrencia de un hábito en un día, o una tarea. */
export type MarkTarget =
  | { kind: 'occurrence'; habitId: string; date: CalendarDate }
  | { kind: 'task'; taskId: string };

/** Un elemento de cualquier vista. */
export interface ViewItem {
  target: MarkTarget;
  name: string;
  status: ItemStatus;
  /** Fecha de la ocurrencia o de vencimiento de la tarea; null si la tarea no tiene fecha. */
  date: CalendarDate | null;
  /** 'HH:MM' con el que se ordena dentro del día (hora exacta, o la de la franja: RN-20); null si no tiene. */
  sortTime: string | null;
  categoryId: string | null;
  sectionId: string | null;
  /** Instante UTC (ISO 8601) en que se marcó; null si está pendiente. */
  markedAt: string | null;
}

/** Lo que guarda la caché de TanStack Query de CADA vista (todas las claves bajo ['views', ...]). */
export interface ViewData {
  items: ViewItem[];
}

/** 'occurrence:<habitId>:<YYYY-MM-DD>' o 'task:<taskId>': clave estable para listas y comparaciones. */
export function getMarkTargetKey(target: MarkTarget): string;
export function isSameMarkTarget(first: MarkTarget, second: MarkTarget): boolean;
/** Copia de la lista con el estado y el instante cambiados en los elementos de ese objetivo (los demás, intactos). */
export function applyStatusToItems(items: ViewItem[], target: MarkTarget, status: ItemStatus, markedAt: string | null): ViewItem[];
/** Orden dentro de un día: con hora primero (ascendente), sin hora al final; a igual hora, por nombre (localeCompare 'es') y después por clave. */
export function compareViewItemsForDay(first: ViewItem, second: ViewItem): number;
```

### `src/domain/entities.ts` (puro)

```ts
import type { CalendarDate, HabitRuleVersion, HabitSchedule, TimeSlot } from './types';
import type { ItemStatus } from './items';

export interface Habit {
  id: string;
  name: string;
  categoryId: string | null;
  sectionId: string | null;
  startDate: CalendarDate;
  timeOfDay: string | null; // 'HH:MM'
  timeSlot: TimeSlot | null;
  durationMinutes: number | null;
  ruleVersions: HabitRuleVersion[];
  /** Fecha de calendario (zona del dispositivo) en que se archivó; null si está activo. */
  archivedOn: CalendarDate | null;
}

export interface HabitMark {
  habitId: string;
  date: CalendarDate;
  status: 'done' | 'not_done';
  markedAt: string; // instante UTC ISO
}

export interface Task {
  id: string;
  name: string;
  notes: string | null;
  categoryId: string | null;
  sectionId: string | null;
  dueDate: CalendarDate | null;
  dueTime: string | null; // 'HH:MM'
  status: ItemStatus;
  markedAt: string | null;
  archivedOn: CalendarDate | null;
}

export function toHabitSchedule(habit: Habit): HabitSchedule;
```

### `src/domain/habit-occurrences.ts` (puro)

```ts
/**
 * Ocurrencias de un hábito en el rango, respetando el archivado: un hábito archivado
 * solo genera ocurrencias en fechas ANTERIORES a archivedOn (el día en que se archivó ya no).
 * Las marcas existentes se muestran siempre en el historial aunque caigan después: eso lo decide cada vista.
 */
export function getHabitOccurrences(habit: Habit, fromDate: CalendarDate, toDate: CalendarDate): Occurrence[];
/** Estado de una ocurrencia a partir de las marcas (sin marca = 'pending'). */
export function getOccurrenceStatus(marks: HabitMark[], habitId: string, date: CalendarDate): { status: ItemStatus; markedAt: string | null };
/** ViewItem de una ocurrencia y de una tarea, para que todas las vistas los construyan igual. */
export function occurrenceToViewItem(habit: Habit, occurrence: Occurrence, marks: HabitMark[]): ViewItem;
export function taskToViewItem(task: Task): ViewItem;
```

`getOccurrenceStatus` debe ser eficiente con muchas marcas: las vistas lo llamarán miles de veces (RNF-01: 50 hábitos y 20.000 ocurrencias). Si lo necesitas, añade y exporta una función que indexe las marcas una vez (por ejemplo `indexMarks(marks): MarkIndex`) y úsala en las otras; documenta cuál deben usar las vistas.

### `src/data/time-zone.ts`, `src/data/use-today.ts` y `src/data/query-keys.ts`

```ts
/** Zona horaria del dispositivo (Intl); si no se puede saber, 'Europe/Madrid'. */
export function getDeviceTimeZone(): string;

/** Hoy en la zona del dispositivo. Se actualiza solo al pasar la medianoche y al volver la app a primer plano. */
export function useToday(): CalendarDate;

export const queryKeys = {
  categories: () => ['categories'] as const,
  views: () => ['views'] as const,
  today: (date: CalendarDate) => ['views', 'today', date] as const,
  categoryView: (categoryId: string | null) => ['views', 'category', categoryId ?? 'inbox'] as const,
  pastPending: (today: CalendarDate) => ['views', 'past-pending', today] as const,
  history: (fromDate: CalendarDate, toDate: CalendarDate) => ['views', 'history', fromDate, toDate] as const,
};
```

Regla para todos, escrita como comentario en `query-keys.ts`: **toda clave bajo `['views', ...]` guarda un `ViewData`**; marcar parchea todas a la vez; crear, modificar o archivar hábitos, tareas, categorías o secciones invalida `['views']` (y `['categories']` si toca).

### `src/data/result.ts` (añadir, sin cambiar lo que hay)

```ts
/** Error que lanzan las funciones de consulta de TanStack Query cuando un DataResult viene con error. */
export class DataResultError extends Error {
  readonly code: string;
}
/** Devuelve el valor o lanza DataResultError (solo para usar dentro de queryFn y mutationFn). */
export function unwrapResult<Value>(result: DataResult<Value>): Value;
```

### `src/data/agenda.ts` (lecturas compartidas; devuelven `DataResult`, nunca lanzan)

```ts
export function fetchHabits(options: { includeArchived: boolean; timeZone: string }): Promise<DataResult<Habit[]>>;
export function fetchHabitMarks(range: { fromDate: CalendarDate; toDate: CalendarDate }): Promise<DataResult<HabitMark[]>>;
/** Convierte una fila de `tasks` al tipo de dominio (las vistas hacen sus propias consultas de tareas con esto). */
export function mapTaskRow(row: Tables<'tasks'>, timeZone: string): Task;
```

`fetchHabits` trae los hábitos con sus versiones de regla (`habit_rules`, en una sola consulta con el `select` anidado de supabase-js), y convierte: `time` de Postgres `'HH:MM:SS'` → `'HH:MM'`; `weekdays` (días ISO 1 a 7) al tipo `IsoWeekday[]`; `archived_at` (instante) → `archivedOn` (fecha de calendario en `timeZone`, con `getCalendarDateInTimeZone` de T03). Códigos de error: `network_error`, `unknown_error` (mensajes en inglés).

## Tests

- **Unitarios** de todo `src/domain` nuevo (exhaustivos: es la base de cuatro vistas): claves, comparación y parcheo de `ViewItem`; `compareViewItemsForDay`; `getHabitOccurrences` con archivado (el mismo día, el anterior, un rango que lo cruza); estado con y sin marca; conversión de ocurrencias y tareas; rendimiento con 50 hábitos diarios durante un año y sus marcas (menos de 200 ms para construir todos los `ViewItem`).
- `useToday` con temporizadores falsos: cambia al pasar la medianoche de la zona y al volver a primer plano.
- **Integración** contra el Supabase local (crea el usuario de prueba como hacen los tests de T02): `fetchHabits` con versiones de regla, archivados incluidos o no, conversión de horas y de `archivedOn` alrededor de la medianoche de Madrid; `fetchHabitMarks` por rango; `mapTaskRow`.

## Fuera de alcance

Pantallas, componentes, mutaciones (marcar es T07), categorías (T04), historial (T08). `package.json`, migraciones, Jira, `docs/contexto.md`, otros encargos. **No hagas merge.** **El Supabase local ya está arrancado y es compartido** (todos los worktrees usan el mismo `project_id`, con las migraciones de `develop`): úsalo para la integración y **no hagas `supabase db reset`, `stop` ni `start`**. Si `supabase status` no responde, pregunta con `orca orchestration ask`. Otro trabajador puede estar usando los puertos 8081 u 8090.

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] El contrato de arriba existe tal cual (o con los cambios que el orquestador apruebe), documentado con comentarios en español.
- [ ] Lint, tipos, tests unitarios, integración y exportación web pasan dentro de Docker; CI del PR en verde.
- [ ] `src/domain` sigue sin importar React, Expo ni Supabase; cobertura de líneas de lo nuevo en `src/domain` ≥ 90 %.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-10` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
