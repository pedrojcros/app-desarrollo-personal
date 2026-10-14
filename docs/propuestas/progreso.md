# Propuesta: versión 1.2, «Progreso»

> **Aprobada el 2026-10-09 con los valores por defecto (DEC-46).** Lo funcional
> ya está aplicado: RF-31 a RF-40 y RNF-10 en
> [02-funcionalidades](../02-funcionalidades.md), CU-09 y RN-41 a RN-45 en
> [03-casos-de-uso](../03-casos-de-uso.md), y el hito en
> [05-plan](../05-plan.md). Este documento guarda el **diseño técnico**
> (apartado 2) y el **reparto** (apartado 3), que es lo que lee el orquestador.

*Arquitecto, 2026-10-09.*

**En una frase:** la app enseña cómo vas, con los datos que ya guarda: el
porcentaje de lo cumplido, las rachas y un mapa de cada hábito, y un resumen de
hábitos y tareas por periodo, sin tocar la base de datos ni añadir
dependencias.

---

## 1. Qué se ve

### 1.1 En Historial: «Registro / Progreso»

Historial tiene arriba un selector con dos opciones. **Registro** es lo que hay
hoy, sin cambios, y es la opción que sale al abrir. **Progreso** enseña:

1. **Periodo:** 7 días, 30 días, 90 días o un año, siempre terminando hoy. Por
   defecto, 30 (RF-40).
2. **Cumplimiento del periodo** de todos los hábitos: el porcentaje en grande y,
   debajo, cuántas hechas, no hechas y sin marcar (RF-35). Si el periodo no es
   el año, también la diferencia con el periodo anterior de la misma longitud:
   «5 puntos más que los 30 días anteriores» (RF-36).
3. **Por categoría:** una barra con el porcentaje de cada categoría y de la
   Bandeja, de peor a mejor (RF-37).
4. **Hábitos:** la lista con el porcentaje de cada uno, **de peor a mejor**, para
   ver a la primera lo que más cuesta. Al tocar uno, se abre su pantalla
   (RF-38).
5. **Tareas por semana:** por cada semana (de lunes a domingo) del periodo, las
   hechas, las hechas tarde, las no hechas y las que siguen pendientes tras su
   fecha (RF-39).

### 1.2 En la pantalla de cada hábito

Encima del formulario, un bloque «Progreso»:

- el **porcentaje de los últimos 30 días** (RF-31);
- la **racha actual** y la **mejor racha** del último año (RF-32);
- el **mapa de las últimas 6 semanas**, como un calendario: siete columnas, de
  lunes a domingo, y una fila por semana, la más reciente abajo. Cada día enseña
  hecha, no hecha, sin marcar, pendiente (hoy), «no tocaba» o futuro (RF-33).
- al **tocar un día** con ocurrencia (pasado u hoy), se abre el mismo menú de
  corrección que en Historial (RF-34).

**Por qué 6 semanas y en columnas por día de la semana:** cada casilla tiene que
medir al menos 44 puntos (RNF-03). Siete columnas de 44 caben en 360 dp de
ancho; doce columnas de semanas, no. Y seis filas (264 puntos de alto) no
empujan demasiado el formulario hacia abajo.

### 1.3 Reglas (en `03-casos-de-uso.md`, CU-09)

- **RN-41.** Porcentaje = hechas / (hechas + no hechas + sin marcar), sobre las
  ocurrencias de hábitos del periodo. Lo de hoy que sigue pendiente no cuenta;
  lo de hoy ya marcado, sí. Sin ninguna ocurrencia que cuente, «sin datos», no
  0 %. Redondeado al entero.
- **RN-42.** La racha se cuenta en ocurrencias, no en días: los miércoles de
  natación seguidos hechos son una racha de cuatro aunque pasen cuatro semanas.
  La rompen un «no hecho» o un «sin marcar»; la de hoy pendiente no la rompe ni
  la suma. La mejor racha es la más larga del último año.
- **RN-43.** Los periodos terminan hoy. El periodo anterior es el de la misma
  longitud justo antes; el año no tiene comparación.
- **RN-44.** Una tarea cuenta en la semana de su fecha; sin fecha, en la del día
  en que se marcó (como RN-33). «Hecha tarde» es una tarea hecha y marcada un día
  posterior a su fecha. Las vencidas que siguen pendientes se cuentan aparte,
  como pendientes, nunca como no hechas (DEC-17).
- **RN-45.** Progreso cuenta lo mismo que el historial: también lo de hábitos y
  tareas archivados, y las marcas de días que la regla ya no incluye (RN-16).

---

## 2. Diseño técnico

### 2.1 La idea: reutilizar la rejilla del historial

El historial ya resuelve lo difícil: calcula las ocurrencias de un rango con el
motor (ADR-0003), junta las marcas (también las de días fuera de la regla y las
de hábitos archivados), sitúa cada tarea en su día y clasifica cada casilla como
`done`, `not_done`, `unmarked`, `pending` o `empty`
(`buildHistoryGrid` en `src/domain/views/history.ts`, con sus tests).

**Progreso no vuelve a calcular nada de eso: cuenta casillas de esa rejilla.**
Así hay una sola definición de «sin marcar» en toda la app, y lo que dice
Progreso cuadra siempre con lo que se ve en Registro.

Alternativa descartada: una consulta de agregados en SQL (una vista o una
función de Postgres). Sería más rápida con muchos años de datos, pero
duplicaría en SQL el motor de ocurrencias, que vive en TypeScript, y cambiaría
el modelo de datos. Con un año de datos, el cálculo en el móvil está muy por
debajo del límite (RNF-01 ya lo mide).

### 2.2 Piezas por capas (cada cosa en su sitio)

```
src/domain/progress/period.ts          periodos: rango del periodo, del anterior y lo que hay que cargar
src/domain/progress/completion.ts      recuentos y porcentaje de unas casillas (RN-41)
src/domain/progress/summary.ts         resumen: global, comparación, por categoría y hábitos de peor a mejor
src/domain/progress/task-weeks.ts      tareas por semana (RN-44)
src/domain/progress/streaks.ts         racha actual y mejor racha de un hábito (RN-42)
src/domain/progress/habit-calendar.ts  mapa de 6 semanas de un hábito
src/components/progress/               piezas de presentación, sin reglas ni datos (2.4)
src/components/history-grid/history-register.tsx   el contenido actual de Historial, movido sin cambios
src/app/(tabs)/historial.tsx           solo el selector «Registro / Progreso»
src/app/habitos/[id].tsx               el bloque de progreso encima del formulario
```

- **`src/domain/progress/`** es una carpeta nueva dentro del dominio: puro, sin
  React ni Supabase, un fichero por regla y cada uno con sus tests.
- **`src/data`** no gana ningún módulo: Progreso lee con `useHistory`, que ya
  existe. Su caché está bajo `['views', ...]`, así que **marcar o corregir algo
  actualiza Progreso al momento**, sin código nuevo.
- **Las pantallas** solo componen y llaman a hooks, como pide `AGENTS.md`.

### 2.3 Contratos del dominio

Nombres y firmas fijos, para que los encargos vayan a la vez sin preguntarse.
Todas las funciones son puras y reciben `today` como parámetro (nunca leen el
reloj).

```ts
// period.ts
export type ProgressPeriod = 7 | 30 | 90 | 365;
export const DEFAULT_PROGRESS_PERIOD: ProgressPeriod = 30;
export interface DateRange { fromDate: CalendarDate; toDate: CalendarDate }
/** El periodo termina hoy: [today - (period - 1), today]. */
export function getPeriodRange(period: ProgressPeriod, today: CalendarDate): DateRange;
/** El mismo número de días justo antes; null para 365 (RN-43). */
export function getPreviousPeriodRange(period: ProgressPeriod, today: CalendarDate): DateRange | null;
/** Lo que hay que pedir a useHistory: periodo y anterior juntos; para 365, el año. */
export function getLoadRange(period: ProgressPeriod, today: CalendarDate): DateRange;

// completion.ts
export interface CompletionCounts { done: number; notDone: number; unmarked: number }
export interface Completion { counts: CompletionCounts; percentage: number | null }
/** Cuenta done, not_done y unmarked; ignora pending y empty (RN-41). */
export function computeCompletion(cells: readonly HistoryCell[]): Completion;
/** Las casillas de una fila que caen dentro del rango (grid.days va de hoy hacia atrás). */
export function selectCellsInRange(row: HistoryRow, days: readonly CalendarDate[], range: DateRange): HistoryCell[];

// task-weeks.ts
export interface TaskWeek {
  weekStart: CalendarDate; // lunes
  done: number;           // todas las hechas, también las tarde
  doneLate: number;       // de las hechas, las marcadas un día posterior a su fecha
  notDone: number;
  overduePending: number; // con fecha ya pasada y aún pendientes
}
/** Semanas de lunes a domingo que tocan el rango, de la más antigua a la más reciente. */
export function buildTaskWeeks(items: readonly ViewItem[], range: DateRange, today: CalendarDate, timeZone: string): TaskWeek[];

// summary.ts
export interface HabitProgress { rowKey: string; habitId: string; name: string; categoryId: string | null; completion: Completion }
export interface CategoryProgress { categoryId: string | null; completion: Completion } // null = Bandeja
export interface ProgressSummary {
  period: ProgressPeriod;
  range: DateRange;
  overall: Completion;
  previousPercentage: number | null; // null si no hay comparación o no hay datos
  byCategory: CategoryProgress[];    // de peor a mejor; «sin datos» al final
  habits: HabitProgress[];           // de peor a mejor; «sin datos» al final; empate por nombre (es)
  taskWeeks: TaskWeek[];
}
export function buildProgressSummary(input: {
  grid: HistoryGrid;           // buildHistoryGrid sobre getLoadRange(period, today)
  items: readonly ViewItem[];  // los mismos items de useHistory, para las tareas
  period: ProgressPeriod;
  today: CalendarDate;
  timeZone: string;
}): ProgressSummary;

// streaks.ts
export interface Streaks { current: number; best: number }
/** Sobre la fila de un hábito con el último año (RN-42). */
export function computeStreaks(row: HistoryRow): Streaks;

// habit-calendar.ts
export type CalendarDayState = HistoryCell | 'future';
export interface CalendarDay { date: CalendarDate; state: CalendarDayState }
export const HABIT_CALENDAR_WEEKS = 6;
/** Seis semanas de lunes a domingo, la última con hoy; los días tras hoy, 'future'. */
export function buildHabitCalendar(row: HistoryRow, days: readonly CalendarDate[], today: CalendarDate): CalendarDay[][];
```

`HistoryCell`, `HistoryRow` y `HistoryGrid` son los de
`src/domain/views/history.ts`, que **no se cambia**. Solo se habla de hábitos
en el porcentaje (filas con `kind: 'habit'`); las tareas van aparte, en
`taskWeeks`.

### 2.4 Contratos de la interfaz

Piezas de presentación en `src/components/progress/`: reciben datos ya
calculados y no importan nada de `src/data`. Sus props usan tipos literales
propios, compatibles con los del dominio, para que puedan hacerse a la vez que
el dominio.

| Pieza | Props | Qué enseña |
|---|---|---|
| `PeriodSelector` | `value: 7 \| 30 \| 90 \| 365`, `onChange` | «7 días», «30 días», «90 días», «Un año» |
| `CompletionHeadline` | `percentage: number \| null`, `counts: { done; notDone; unmarked }`, `difference: number \| null`, `periodLabel: string` | El porcentaje en grande («—» y «Sin datos» si es `null`), los tres recuentos y la diferencia en puntos |
| `CompletionBar` | `label: string`, `percentage: number \| null`, `onPress?` | Nombre, barra y porcentaje; pulsable si hay `onPress` |
| `TaskWeeksChart` | `weeks: { weekStart; done; doneLate; notDone; overduePending }[]` | Una barra apilada por semana, con leyenda y etiqueta accesible por semana |
| `StreakTiles` | `current: number`, `best: number` | «Racha actual» y «Mejor racha», en ocurrencias |
| `HabitCalendarView` | `weeks: { date; state }[][]`, `onDayPress: (date) => void` | Siete columnas con la inicial del día y una fila por semana; cada casilla de 44 puntos con su símbolo (los de Historial: ✓, ✗, —, ○) y etiqueta accesible («martes 7 de octubre: hecha»); solo se pueden pulsar las que tienen ocurrencia |

Colores: los tokens de estado del tema (`done`, `not-done`…) y los de
categoría que ya existen; nada suelto. Cada pieza entra en el catálogo
(`(dev)/catalog`) con los tres temas.

### 2.5 Cómo se conecta

- **Historial › Progreso** (`src/components/progress/progress-summary.tsx`):
  guarda el periodo elegido en su estado, pide
  `useHistory(getLoadRange(period, today))` y `useCategories()`, construye la
  rejilla con `buildHistoryGrid`, el resumen con `buildProgressSummary` y
  compone las piezas. Cargando, error y vacío, igual que Registro.
- **Bloque del hábito** (`src/components/progress/habit-progress.tsx`): pide
  `useHistory` del último año (`getLoadRange(365, today)`, la misma caché que el
  periodo «Un año»), toma la fila `habit:<id>` y calcula el porcentaje de los
  últimos 30 días, las rachas y el mapa. Al tocar un día, busca su `ViewItem` y
  abre `HistoryStatusMenu` con `useMarkItem`, como hace Registro.
- Si el hábito no tiene fila (recién creado, sin ocurrencias), el bloque dice
  «Aún no hay datos».

### 2.6 ¿Cambia algo más?

- **Modelo de datos:** no. Ninguna migración.
- **Dependencias:** ninguna. Las barras y el mapa son `View` con NativeWind.
- **Permisos y servicios:** ninguno nuevo.
- **Rendimiento:** RNF-10, medido en el test de rendimiento que ya existe
  (`src/data/performance.integration.test.ts`) con los datos sintéticos de T13.

### 2.7 Cómo se prueba

- **Dominio:** tests exhaustivos de cada fichero, también con
  `npm run test:zones`. Casos obligatorios: hábito de los miércoles (racha en
  ocurrencias), cada N días, una marca en un día fuera de la regla, un hábito
  archivado a mitad de periodo, hoy pendiente y hoy marcado, periodo sin datos,
  semana del cambio de hora de octubre (el domingo 25 de octubre de 2026), tarea
  hecha tarde, tarea sin fecha y tarea vencida pendiente.
- **Componentes:** React Native Testing Library, con las etiquetas accesibles.
- **Extremo a extremo:** un flujo de Maestro al cerrar la versión (DEC-45):
  abrir Historial, pasar a Progreso, ver el porcentaje, tocar el peor hábito,
  ver su racha y corregir un día desde el mapa.

---

## 3. Encargos para la ejecución

Números de encargo a partir del **055**. Todos contra `develop`, cada uno en su
worktree; ninguno toca migraciones ni `package.json`. Reparto con la regla de
dividir de DEC-45 y el orden de DEC-38 (Codex, Codex, Codex, Claude), con lo
mecánico para Luna y lo denso para Sol (DEC-41).

| Encargo | Qué | Agente | Tamaño | Depende de | Ficheros reservados |
|---|---|---|---|---|---|
| **055** | Dominio, parte 1: `period.ts`, `completion.ts`, `task-weeks.ts` y `summary.ts` con el contrato de 2.3, y sus tests | **Codex Luna** | M | — | `src/domain/progress/{period,completion,task-weeks,summary}*.ts` |
| **056** | Dominio, parte 2: `streaks.ts` y `habit-calendar.ts` con el contrato de 2.3 y sus tests en las dos zonas | **Codex Sol** | M | — | `src/domain/progress/{streaks,habit-calendar}*.ts` |
| **057** | Interfaz: las seis piezas de 2.4 con sus tests y su sitio en el catálogo, y Historial con el selector «Registro / Progreso» (el contenido actual se mueve a `history-register.tsx` **sin cambiar nada**; Progreso, de momento, con un texto provisional) | **Claude Sonnet** | M | — | `src/components/progress/**` (salvo los dos ficheros de 058), `src/components/history-grid/history-register.tsx`, `src/app/(tabs)/historial.tsx`, `src/components/catalog/**` |
| **058** | Conexión: `progress-summary.tsx` y `habit-progress.tsx` (2.5), Progreso en Historial y el bloque en `habitos/[id].tsx`, corrección desde el mapa, RNF-10 en el test de rendimiento y la estructura de `04-arquitectura.md` | **Codex Sol** | M | 055, 056 y 057 fusionados | `src/components/progress/{progress-summary,habit-progress}*.tsx`, `src/app/habitos/[id].tsx`, `src/app/(tabs)/historial.tsx`, `src/data/performance.integration.test.ts`, `docs/04-arquitectura.md` |
| **059** | Cierre: flujo de Maestro de 2.7 (`e2e/progreso.yaml`), una sola ejecución de todos los flujos con `docker/android/reset`, y la retrospectiva con `report.py` y `measure.py` (DEC-45) | **Codex Luna** (el flujo); el orquestador, la retrospectiva | S | 058 | `e2e/progreso*.yaml`, `docs/retrospectivas/` |

**Olas:**

1. **055, 056 y 057 a la vez.** No comparten ningún fichero: el dominio se
   parte en dos ficheros distintos, y la interfaz no depende del dominio porque
   sus props son tipos propios.
2. **058**, cuando las tres estén fusionadas.
3. **059** y la publicación.

**Por qué este reparto:** contar casillas, periodos y semanas tiene reglas
claras y casos dados (Luna); las rachas y el mapa tienen semanas que empiezan
en lunes, cambios de hora, frecuencias raras y marcas fuera de regla (Sol); las
piezas de interfaz necesitan criterio visual y de accesibilidad con los tres
temas (Claude); la conexión toca cachés, el menú de corrección y la pantalla
del hábito (Sol), con revisión de un modelo distinto.

**Riesgos que vigilar:**

- **Mover el contenido de Historial (057)** puede romper el flujo de Maestro del
  historial si cambia un texto o una etiqueta. El encargo exige no cambiar
  ninguno; el revisor lo comprueba en el diff.
- **058 y 057 tocan los dos `historial.tsx`**, pero en olas distintas: 058
  empieza desde `develop` con 057 ya fusionado.
- **Una marca de un día fuera de la regla** cuenta en Progreso igual que en el
  historial (RN-45). Si al usarla parece raro, se decide entonces, no ahora.
