# Encargo 016 — Hábitos: crear, modificar y archivar (T05)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

| Campo | Valor |
|---|---|
| Tarea del plan | `T05` en `docs/05-plan.md` |
| Ticket | `ADP-8` (solo informativo: no lo toques) |
| Agente | codex (esfuerzo alto: reglas versionadas y atomicidad) |
| Skills a usar | `expo-native-ui`, `expo-data-fetching`, `supabase-postgres-best-practices`, `test-driven-development`, `frontend-ui-engineering`, `codigo-legible`, `flujo-git` (en `.agents/skills/`) |
| Rama y worktree | `ADP-8-habitos`, desde `develop`, tu propio worktree |
| Depende de | T02, T03 (con su corrección), T04, T08 (el selector de fecha y hora) y T14, fusionadas en `develop` |
| Reservado para este encargo | la migración `supabase/migrations/20261007140000_habit_functions.sql`; `src/data/database.types.ts` (regenerado); `src/data/habits.ts` y sus tests; `src/app/habitos/` (incluido su `_layout.tsx`); `src/components/habit-form/` |

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

## Antes de empezar

Lee `AGENTS.md` entero (capas, Zod antes de cada escritura, errores `{ ok, value }`/`{ ok: false, error }`, regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español; **todo en Docker** con `./docker/app/run ...`). Lee CU-01 y CU-06 (RN-10 a RN-12, RN-18 a RN-23) en `docs/03-casos-de-uso.md`, RF-01, RF-03, RF-18, RF-19 y RF-20 en `docs/02-funcionalidades.md`, [ADR-0003](../../adr/0003-ocurrencias-calculadas.md), `docs/diseno.md` y lo que ya existe en `develop`: el motor (`src/domain/recurrence.ts`: **la primera versión de la regla debe empezar en `startDate` y no puede haber dos con el mismo `validFrom`**; la base de datos tiene `unique (habit_id, valid_from)`), la base común (`src/domain/entities.ts`, `src/data/agenda.ts`, `src/data/query-keys.ts`, `src/data/use-today.ts`), `CategorySelect` y `ConfirmDialog` (T04), `DateField` y `TimeField` (T08) y los componentes de `src/components/ui/`.

## Reglas que decide el orquestador (no las cambies sin preguntar)

- **Crear es atómico**: el hábito y su primera versión de regla (`valid_from = start_date`) se crean en una sola transacción, con una función SQL. Un hábito sin regla rompería todas las vistas.
- **Cambiar la frecuencia** (CU-06 A1, RN-19) se aplica desde `max(hoy, start_date)`: si ya existe una versión con esa fecha, se **actualiza** (dos cambios el mismo día no crean dos versiones); si no, se **inserta** una nueva. El pasado no cambia nunca.
- **La fecha de inicio solo se puede cambiar mientras el hábito no ha empezado** (`start_date > hoy`), y la nueva tiene que ser hoy o posterior: se mueven a la vez `start_date` y el `valid_from` de su única versión. Si ya empezó, el formulario la muestra sin poder editarla, con una nota («Ya ha empezado: cambiarla reescribiría el pasado»).
- **Hora o franja, nunca las dos** (RN-11): «Sin hora», «Mañana», «Tarde», «Noche» o «Hora exacta» (con `TimeField`). Elegir una quita la otra.
- **Archivar** (RN-18): `archived_at = now()` tras confirmar con `ConfirmDialog` («Dejará de aparecer, pero su historial se conserva»). Sin borrado definitivo.
- La **duración** (RF-04) es deseable y **no entra** en este formulario.

## Qué hacer

1. **Migración** `20261007140000_habit_functions.sql` (comentarios en español con el porqué), con funciones `security invoker` (las protege RLS), `set search_path = ''`, `revoke ... from public, anon` y `grant ... to authenticated`:
   - `create_habit(...)` que inserta el hábito y su primera versión y devuelve el `id`.
   - `set_habit_rule(p_habit_id uuid, p_valid_from date, p_frequency, p_weekdays smallint[], p_interval_days int)` que hace el alta o el cambio de la versión de esa fecha (sobre el `unique` de `habit_id, valid_from`).
   - `move_habit_start_date(p_habit_id uuid, p_new_start_date date)` que mueve a la vez `start_date` y el `valid_from` de su única versión, y falla (`raise exception` con un código propio) si el hábito ya empezó, si tiene más de una versión o si la fecha nueva es anterior a hoy en la zona del dispositivo (pásale `p_today date` desde la app: la base de datos no conoce la zona del usuario).
   **El Supabase local es compartido**: aplica tu migración con `./docker/app/run npx supabase migration up --include-all` (añade sin borrar; **no** hagas `db reset`, `stop` ni `start`) y regenera los tipos con `supabase gen types typescript --local`.
2. **Datos** en `src/data/habits.ts` (Zod antes de cada escritura; códigos `invalid_input`, `not_found`, `already_started`, `network_error`, `unknown_error`). Contrato (lo usará T16, el añadir rápido):

   ```ts
   export interface HabitInput {
     name: string;
     categoryId: string | null;
     sectionId: string | null;
     startDate: CalendarDate;
     timeOfDay: string | null; // 'HH:MM'
     timeSlot: TimeSlot | null;
     frequency: Frequency;
     weekdays: IsoWeekday[];      // solo con 'weekdays'
     intervalDays: number | null; // solo con 'every_n_days'
   }
   export function createHabit(input: HabitInput): Promise<DataResult<{ id: string }>>;
   export function fetchHabit(habitId: string, timeZone: string): Promise<DataResult<Habit>>;
   export function updateHabit(habitId: string, changes: Omit<HabitInput, 'startDate' | 'frequency' | 'weekdays' | 'intervalDays'>): Promise<DataResult<null>>;
   export function changeHabitRule(habitId: string, rule: Pick<HabitInput, 'frequency' | 'weekdays' | 'intervalDays'>, today: CalendarDate): Promise<DataResult<null>>;
   export function moveHabitStartDate(habitId: string, newStartDate: CalendarDate, today: CalendarDate): Promise<DataResult<null>>;
   export function archiveHabit(habitId: string): Promise<DataResult<null>>;
   export function useCreateHabit(): UseMutationResult<...>; // invalida ['views']
   export function useHabit(habitId: string): UseQueryResult<Habit, DataResultError>;
   export function useUpdateHabit(), useChangeHabitRule(), useMoveHabitStartDate(), useArchiveHabit(); // invalidan ['views']
   ```

   Validación (mensajes que verá el usuario, en español, desde la pantalla): nombre obligatorio, recortado, de 1 a 80 caracteres (CU-01 E1); «días de la semana» con al menos un día (E2); «cada N días» con N entero de 1 a 365 (E3).
3. **Formulario** en `src/components/habit-form/`: `HabitForm({ initialValue, mode: 'create' | 'edit', onSubmit, ... })` con: nombre; frecuencia (Todos los días · Días de la semana con los siete días L M X J V S D · Cada N días con un número · Cada mes, que usa el día de la fecha de inicio); cuándo (Sin hora · Mañana · Tarde · Noche · Hora exacta); fecha de inicio (`DateField`, hoy por defecto, puede ser futura: CU-01 A7); categoría y sección (`CategorySelect`). Errores junto a cada campo (E1 a E3) y error general si falla el guardado, **sin perder lo escrito** (E4). Accesible: etiquetas, 44 pt, teclado en la web. Solo tokens de `src/theme`.
4. **Pantallas** en `src/app/habitos/`: `nuevo.tsx` (crear; acepta parámetros de ruta opcionales `categoryId`, `sectionId` y `startDate` para precargar el formulario: los usará T16 desde «Más») y `[id].tsx` (modificar y archivar). Un `src/app/habitos/_layout.tsx` con un `Stack` y **guardián de sesión**: sin sesión (`useSession` de `src/data/auth`), `Redirect` a `/login` (no toques `src/app/_layout.tsx`). Al guardar, vuelve atrás.
5. **Tests** (TDD): **escenarios 1, 5 y 6 de CU-01** y **1 a 4 de CU-06** aplicados a hábitos (el 2, cambio de repetición sin tocar el pasado, con datos reales: diez ocurrencias pasadas que no cambian y las futuras solo en miércoles); integración de las tres funciones SQL contra el Supabase local compartido (atomicidad, RLS con otro usuario, el `unique`, `already_started`); componentes del formulario con datos simulados (exclusión hora/franja, días vacíos, N no válido, error de guardado conservando lo escrito).

## Fuera de alcance

El añadir rápido (T16) y el botón +; las vistas (Hoy, categoría, Bandeja, pendientes, historial); tareas (T06); la duración (RF-04); `src/app/_layout.tsx`; `src/app/(tabs)/`; `package.json`; Jira; `docs/contexto.md`; otros encargos. **No hagas merge.** Otro trabajador puede usar los puertos 8081 u 8090: elige uno libre (`ss -ltn`).

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan los escenarios 1, 5 y 6 de CU-01 y 1 a 4 de CU-06 (hábitos), y el resto de tests.
- [ ] La migración se aplica sobre `develop` sin errores; tipos regenerados.
- [ ] Lint, tipos, tests unitarios, `test:zones`, integración y exportación web en verde dentro de Docker; CI del PR en verde.
- [ ] En la web (MCP de Chrome): crear un hábito de los cuatro tipos, modificarlo, cambiarle la frecuencia y archivarlo.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-8` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
