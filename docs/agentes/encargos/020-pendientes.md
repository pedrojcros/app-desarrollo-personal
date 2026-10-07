# Encargo 020 — Pendientes de días anteriores (T11)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | `T11` en `docs/05-plan.md` |
| Ticket | `ADP-14` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6.1-sol` (DEC-39) |
| Skills a usar | `test-driven-development`, `vercel-react-native-skills`, `codigo-legible` (en `.agents/skills/`) |
| Rama y worktree | `ADP-14-pendientes`, desde `develop`, tu propio worktree |
| Depende de | T03, T07 y la base común de vistas, fusionadas en `develop` |
| Reservado para este encargo | `src/domain/views/past-pending.ts` y sus tests; `src/data/past-pending.ts` y sus tests; `src/components/past-pending/`; la pantalla `src/app/(tabs)/pendientes.tsx`; en `src/app/(tabs)/_layout.tsx` **solo** pasar el contador a la pestaña «Pendientes» |

## Antes de empezar

Lee `AGENTS.md` entero (capas: `src/domain` sin React, Expo ni Supabase; regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español; **todo en Docker** con `./docker/app/run ...`). Lee CU-04 (RN-07, RN-08, RN-14, RN-15) y RN-17 en `docs/03-casos-de-uso.md`, RF-12 y RNF-01 en `docs/02-funcionalidades.md`, `docs/diseno.md` (pestaña «Pendientes» con su contador; listas sin cajitas) y lo que ya está en `develop`: la base común (`src/domain/items.ts`, `src/domain/habit-occurrences.ts` con `indexMarks`, `src/data/agenda.ts`, `src/data/query-keys.ts`, `src/data/use-today.ts`), `useMarkItem` (T07) y `ListRow` y `TabIcon` de `src/components/ui/`. **El Supabase local es compartido**: úsalo tal cual; **no** hagas `db reset`, `stop` ni `start`. Otro trabajador puede usar los puertos 8081 u 8090: elige uno libre.

## Reglas (decididas por el orquestador)

- Se listan las **ocurrencias sin marcar de días anteriores a hoy** de los **hábitos no archivados** (los archivados no: el usuario los quitó) desde su fecha de inicio, **sin límite hacia atrás** (RN-14), y las **tareas vencidas**: pendientes, no archivadas y con fecha anterior a hoy (RN-08).
- **Agrupadas por día**, de la más reciente a la más antigua; dentro de cada día, `compareViewItemsForDay`. Cabeceras «Ayer», «Anteayer» y después «Lunes, 5 de octubre» (con el año si no es el actual).
- Marcar con ✓ o ✗ con `useMarkItem`: conserva la fecha original y guarda cuándo se marcó (lo hace T07); lo marcado **sale de la lista**.
- Sin nada pendiente: **«Todo al día.»**
- El **contador** de la pestaña «Pendientes» es el número de elementos de esta lista (`TabIcon` ya acepta `badgeCount`); con 0, sin contador.
- Reprogramar una tarea (RF-13) y marcar un día entero como no hecho (RF-14) son deseables: **no entran**.
- Pulsar el título abre `/habitos/[id]` o `/tareas/[id]` (las hacen T05 y T06; enlaza igual; si `ListRow` aún no tiene `onPress` porque T09 no se ha fusionado, añádela como prop opcional sin cambiar su aspecto).

## Qué hacer

1. **Dominio** en `src/domain/views/past-pending.ts` (puro, tests exhaustivos): `getPastPendingItems({ habits, marks, tasks, today }): ViewItem[]` y `groupByDay(items): { date: CalendarDate; items: ViewItem[] }[]`. Eficiente: usa `indexMarks`.
2. **Datos** en `src/data/past-pending.ts`: `usePastPending(today)` con la clave `queryKeys.pastPending(today)`, que guarda un `ViewData`: `fetchHabits({ includeArchived: false, timeZone })`, `fetchHabitMarks` desde la fecha de inicio más antigua hasta ayer (ya pagina), y las tareas pendientes no archivadas con `due_date < today` (con `mapTaskRow`). Y `usePastPendingCount(today)` que reutiliza la misma consulta.
3. **Pantalla** `src/app/(tabs)/pendientes.tsx` (**no la conviertas en carpeta**) con sus piezas en `src/components/past-pending/`: grupos por día, carga, error en español con «Reintentar» y «Todo al día.». En `src/app/(tabs)/_layout.tsx`, **solo** pasar `usePastPendingCount` al `badgeCount` de la pestaña «Pendientes».
4. **Tests**: **escenario 1 de CU-04**; «Todo al día.»; dominio exhaustivo (hábito con días sin marcar y otros marcados, «cada N días», regla cambiada en el pasado, hábito archivado excluido, tarea vencida, tarea de hoy y sin fecha excluidas, orden de grupos y dentro del día); rendimiento (RNF-01): 50 hábitos diarios durante un año con la mitad de las marcas, en menos de 300 ms; componentes con datos simulados (marcar hace desaparecer, contador).

## Fuera de alcance

RF-13 y RF-14, Hoy (T09), la vista de categoría (T10), los formularios (T05, T06), el añadir rápido (T16), `src/app/_layout.tsx`, `package.json`, Jira, `docs/contexto.md`, otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan el escenario 1 de CU-04, «Todo al día.» y el resto de tests; cobertura de líneas de `src/domain/views/past-pending.ts` ≥ 90 %.
- [ ] Lint, tipos, tests unitarios, `test:zones`, integración y exportación web en verde dentro de Docker; CI del PR en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-14` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales y `worker_done` con `--outcome succeeded|failed`.
