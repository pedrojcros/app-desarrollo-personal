# Encargo 003 — Motor de fechas y ocurrencias (T03)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

| Campo | Valor |
|---|---|
| Tarea del plan | `T03` en `docs/05-plan.md` |
| Ticket | `ADP-4` (solo informativo: no lo toques) |
| Agente | codex (esfuerzo alto: lógica central; la revisará después un modelo distinto) |
| Skills a usar | `test-driven-development`, `api-and-interface-design`, `codigo-legible`, `flujo-git` (en `.agents/skills/`) |
| Rama y worktree | `ADP-4-motor-de-ocurrencias`, desde `develop`, tu propio worktree |
| Depende de | T01 (ya fusionada en `develop`) |
| Reservado para este encargo | `src/domain/types.ts`, `src/domain/calendar-date.ts`, `src/domain/recurrence.ts` y sus tests (`*.test.ts` al lado) |

## Antes de empezar

Lee `AGENTS.md` entero (regla de legibilidad: nombres en inglés **sin abreviaturas ni variables de una letra**, comentarios y commits en español; comandos: **todo se ejecuta en Docker** con `./docker/app/run ...`), [ADR-0003](../../adr/0003-ocurrencias-calculadas.md) y el caso de uso CU-01 (con sus reglas RN-10 a RN-12 y RN-20 a RN-23) en `docs/03-casos-de-uso.md`. **`src/domain` no importa nada de React, React Native, Expo ni Supabase.**

## Objetivo

Una función pura que, para un hábito con sus versiones de regla, devuelve sus ocurrencias en un rango de fechas, con las cuatro frecuencias, y el orden del día por hora o franja.

## Contrato (escrito por el orquestador; no lo cambies sin preguntar)

`src/domain/types.ts`:

```ts
/** Fecha de calendario 'YYYY-MM-DD', sin hora ni zona (ADR-0003). */
export type CalendarDate = string;

export type Frequency = 'daily' | 'weekdays' | 'every_n_days' | 'monthly';
export type TimeSlot = 'morning' | 'afternoon' | 'night';

/** Día ISO de la semana: 1 = lunes … 7 = domingo. T02 guarda `habit_rules.weekdays` así. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Una versión de la regla de repetición de un hábito, vigente desde `validFrom` (inclusive). */
export interface HabitRuleVersion {
  validFrom: CalendarDate;
  frequency: Frequency;
  weekdays: IsoWeekday[]; // solo con 'weekdays'
  intervalDays: number | null; // solo con 'every_n_days'; entero >= 1
}

export interface HabitSchedule {
  habitId: string;
  startDate: CalendarDate;
  timeOfDay: string | null; // 'HH:MM'; nunca junto a timeSlot
  timeSlot: TimeSlot | null;
  ruleVersions: HabitRuleVersion[]; // en cualquier orden
}

export interface Occurrence {
  habitId: string;
  date: CalendarDate;
  /** Hora 'HH:MM' con la que se ordena: la exacta, la de la franja o null si no tiene momento. */
  sortTime: string | null;
}
```

`src/domain/recurrence.ts` exporta:

- `SLOT_TIMES: Record<TimeSlot, string>` = `{ morning: '09:00', afternoon: '15:00', night: '21:00' }` (RN-20).
- `getOccurrencesInRange(schedule: HabitSchedule, fromDate: CalendarDate, toDate: CalendarDate): Occurrence[]` — ambos extremos inclusivos, resultado ordenado por fecha. Nunca devuelve fechas anteriores a `startDate` (RN-12).
- `compareOccurrencesForDay(first: Occurrence, second: Occurrence): number` — orden dentro de un día: primero las que tienen `sortTime` (ascendente), después las que no; a igual hora, por `habitId` para que sea estable.

`src/domain/calendar-date.ts` exporta (todas puras, **aritmética en UTC sobre el calendario, sin depender de la zona horaria del proceso** ni de `Date` local):

- `parseCalendarDate(value: string): CalendarDate` (lanza un `Error` con mensaje en inglés si no es una fecha real `YYYY-MM-DD`), `compareCalendarDates`, `addDays(date, amount)`, `daysBetween(from, to)`, `getIsoWeekday(date)`, `getLastDayOfMonth(date)` (año bisiesto incluido), `addMonthsClamped` si te hace falta.
- `getCalendarDateInTimeZone(instant: Date, timeZone: string): CalendarDate` — la fecha de calendario de un instante en una zona (por defecto la usará el resto de la app con `Europe/Madrid`), con `Intl.DateTimeFormat`.

## Reglas que debe cumplir (ADR-0003 y CU-01)

- Para un día se usa **la versión de regla vigente ese día**: la de mayor `validFrom` menor o igual a ese día. Un cambio de regla **no altera el pasado** (los días anteriores a su `validFrom` siguen con la versión anterior).
- `daily`: todos los días. `weekdays`: solo los días ISO listados. `every_n_days`: cada N días **contando desde el `validFrom` de la versión vigente** (RN-22: una ocurrencia sin marcar no desplaza a las siguientes). `monthly`: el día del mes del `validFrom` de la versión vigente; si el mes no lo tiene, **el último día de ese mes** (RN-23).
- `timeOfDay` y `timeSlot` a la vez, o `intervalDays` inválido (no entero o < 1) con `every_n_days`, o `weekdays` vacío con `weekdays`: lanza un `Error` con mensaje en inglés (son datos corruptos; la validación amable de formularios es de T05).
- Si `ruleVersions` está vacío: lanza un `Error`.
- Un rango con `fromDate > toDate` devuelve `[]`.

## Tests (exhaustivos: `src/domain` los exige)

Con Jest, sin base de datos ni framework, junto a cada fichero:

- Los **escenarios 2, 3 y 4 de CU-01** como tests (semanal con hora; cada 3 días del 1 al 10 → 1, 4, 7, 10; mensual desde el 31 de enero en febrero → último día de febrero, también en año bisiesto y no bisiesto).
- **Cambios de hora**: el último domingo de marzo y el último de octubre (2026: 29 de marzo y 25 de octubre) no duplican ni pierden un día. Ejecuta los tests de fechas bajo **varias zonas** (`TZ` distintas: `Europe/Madrid`, `UTC`, `America/Los_Angeles`, `Pacific/Auckland`) para demostrar que no dependen de la del proceso (por ejemplo, con un test que fije `process.env.TZ` antes de cargar el módulo o ejecutando la misma batería con distintos valores; elige lo más simple que funcione en Jest).
- **Fin de mes y año bisiesto**; **cada N días** a través de fin de mes y de año; **cambio de regla que no altera el pasado** (dos y tres versiones, con `validFrom` que cae en un día que la nueva regla toca y en uno que no); hábito que empieza en el futuro; rangos de un día, vacíos e invertidos; orden del día por hora exacta y franja mezcladas y sin momento.
- **Rendimiento básico**: un hábito diario durante 5 años se calcula en menos de 200 ms (RNF-01 mira lo mismo a escala).
- Cobertura de líneas de `src/domain` **de al menos el 90 %** (comprueba con `jest --coverage` dentro de Docker; si hace falta un umbral en la configuración de Jest, **no la toques tú** —es de T01—: informa del porcentaje en el PR).

## Fuera de alcance

- Vistas (Hoy, historial, pendientes...) y sus reglas: son de T08, T09, T11. Nada de Supabase, React ni Expo en `src/domain`.
- `package.json`, configuración, otros ficheros de `src/` y la documentación general. No añadas dependencias. No toques `docs/contexto.md`, `docs/05-plan.md`, Jira ni otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan los escenarios 2, 3 y 4 de CU-01 y todos los tests descritos; cobertura de `src/domain` ≥ 90 %.
- [ ] Los tests pasan con varias zonas horarias.
- [ ] Lint, tipos y tests pasan dentro de Docker (`./docker/app/run npm run lint|typecheck|test`); la CI del PR está en verde.
- [ ] `src/domain` no importa nada de React, React Native, Expo ni Supabase.
- [ ] Cumple la regla de legibilidad de `AGENTS.md` (funciones cortas con nombre de lo que hacen, sin ternarios anidados, sin abreviaturas).
- [ ] PR abierto **contra `develop`** con `ADP-4` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida, incluida la cobertura; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
