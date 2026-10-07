# Encargo 017 — Tareas: crear, modificar y archivar (T06)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | `T06` en `docs/05-plan.md` |
| Ticket | `ADP-9` (solo informativo: no lo toques) |
| Agente | codex (esfuerzo medio) |
| Skills a usar | `expo-native-ui`, `expo-data-fetching`, `test-driven-development`, `frontend-ui-engineering`, `codigo-legible`, `flujo-git` (en `.agents/skills/`) |
| Rama y worktree | `ADP-9-tareas`, desde `develop`, tu propio worktree |
| Depende de | T02, T04, T08 (el selector de fecha y hora) y T14, fusionadas en `develop` |
| Reservado para este encargo | `src/data/tasks.ts` y sus tests; `src/app/tareas/` (incluido su `_layout.tsx`); `src/components/task-form/` |

## Antes de empezar

Lee `AGENTS.md` entero (capas, Zod antes de cada escritura, errores `{ ok, value }`/`{ ok: false, error }`, regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español; **todo en Docker** con `./docker/app/run ...`). Lee CU-02 y CU-06 (RN-08, RN-09, RN-13, RN-18, RN-25, RN-28) en `docs/03-casos-de-uso.md`, RF-05, RF-18, RF-19 y RF-20 en `docs/02-funcionalidades.md`, `docs/diseno.md`, y lo que ya existe en `develop`: la base común (`src/domain/entities.ts`, `src/data/agenda.ts` con `mapTaskRow`, `src/data/query-keys.ts`, `src/data/use-today.ts`), `CategorySelect` y `ConfirmDialog` (T04), `DateField` y `TimeField` (T08) y `src/components/ui/`. **El Supabase local es compartido**: úsalo tal cual; **no** hagas `db reset`, `stop` ni `start`. Otro trabajador puede usar los puertos 8081 u 8090: elige uno libre (`ss -ltn`).

## Reglas

- Nombre obligatorio, recortado, de 1 a 120 caracteres (CU-02 E1, RN-13); notas, fecha, hora y categoría opcionales. **Hora solo si hay fecha.** Sin categoría, a la Bandeja (RN-28).
- **Fecha anterior a hoy** al crear: aviso con `ConfirmDialog` («Esta tarea nacerá vencida. ¿Crearla igualmente?»); si confirma, se crea (CU-02 A4). Al modificar, mismo aviso si se cambia la fecha a una anterior a hoy.
- **Archivar** (RN-18): `archived_at = now()` tras confirmar («Dejará de aparecer, pero su historial se conserva»). Sin borrado definitivo.
- Guardar mal (E2): mensaje en español y **sin perder lo escrito**.

## Qué hacer

1. **Datos** en `src/data/tasks.ts` (contrato; lo usará T16, el añadir rápido):

   ```ts
   export interface TaskInput {
     name: string;
     notes: string | null;
     dueDate: CalendarDate | null;
     dueTime: string | null; // 'HH:MM', solo con dueDate
     categoryId: string | null;
     sectionId: string | null;
   }
   export function createTask(input: TaskInput): Promise<DataResult<{ id: string }>>;
   export function fetchTask(taskId: string, timeZone: string): Promise<DataResult<Task>>;
   export function updateTask(taskId: string, input: TaskInput): Promise<DataResult<null>>;
   export function archiveTask(taskId: string): Promise<DataResult<null>>;
   export function useCreateTask(): UseMutationResult<...>;  // invalida ['views']
   export function useTask(taskId: string): UseQueryResult<Task, DataResultError>;
   export function useUpdateTask(), useArchiveTask();       // invalidan ['views']
   ```

   Códigos: `invalid_input`, `not_found`, `network_error`, `unknown_error`.
2. **Formulario** en `src/components/task-form/`: nombre, notas (varias líneas), fecha (`DateField`, opcional, con «Sin fecha»), hora (`TimeField`, solo si hay fecha), categoría y sección (`CategorySelect`). Errores junto a cada campo. Accesible (etiquetas, 44 pt, teclado en la web). Solo tokens de `src/theme`.
3. **Pantallas** en `src/app/tareas/`: `nueva.tsx` (crear; parámetros de ruta opcionales `categoryId`, `sectionId` y `dueDate` para precargar el formulario: los usará T16 desde «Más») y `[id].tsx` (modificar y archivar). Un `src/app/tareas/_layout.tsx` con un `Stack` y **guardián de sesión**: sin sesión (`useSession` de `src/data/auth`), `Redirect` a `/login` (no toques `src/app/_layout.tsx`). Al guardar, vuelve atrás.
4. **Tests** (TDD): **escenarios 1 a 5 de CU-02** y **1, 3 y 4 de CU-06** aplicados a tareas (con la base de datos real los que guardan datos); componentes del formulario con datos simulados (hora sin fecha, fecha pasada con aviso, error de guardado conservando lo escrito).

## Fuera de alcance

El añadir rápido (T16) y el botón +; las vistas (Hoy, categoría, Bandeja, pendientes, historial); hábitos (T05); reprogramar desde pendientes (RF-13, deseable); `src/app/_layout.tsx`; `src/app/(tabs)/`; `package.json`; Jira; `docs/contexto.md`; otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan los escenarios 1 a 5 de CU-02 y 1, 3 y 4 de CU-06 (tareas), y el resto de tests.
- [ ] Lint, tipos, tests unitarios, `test:zones`, integración y exportación web en verde dentro de Docker; CI del PR en verde.
- [ ] En la web (MCP de Chrome): crear una tarea sin fecha, con fecha y hora, con fecha pasada (aviso), modificarla y archivarla.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-9` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
