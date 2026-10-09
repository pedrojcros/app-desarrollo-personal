# Encargo 018 — Vista Hoy (T09)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | `T09` en `docs/05-plan.md` |
| Ticket | `ADP-12` (solo informativo: no lo toques) |
| Agente | codex (esfuerzo medio-alto) |
| Skills a usar | `expo-native-ui`, `vercel-react-native-skills`, `test-driven-development`, `frontend-ui-engineering`, `codigo-legible`, `flujo-git` (en `.agents/skills/`) |
| Rama y worktree | `ADP-12-vista-hoy`, desde `develop`, tu propio worktree |
| Depende de | T03, T07 y T14 y la base común de vistas, fusionadas en `develop` |
| Reservado para este encargo | `src/domain/views/today.ts` y sus tests; `src/data/today.ts` y sus tests; `src/components/today/`; la pantalla `src/app/(tabs)/hoy.tsx`; en `src/components/ui/list-row.tsx` **solo** añadir una prop opcional `onPress` para pulsar el título |

## Antes de empezar

Lee `AGENTS.md` entero (capas: `src/domain` sin React, Expo ni Supabase; regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español; **todo en Docker** con `./docker/app/run ...`). Lee CU-03 (RN-01 a RN-09, RN-29 a RN-32) en `docs/03-casos-de-uso.md`, RF-08, RNF-01 y RNF-06 en `docs/02-funcionalidades.md`, la vista Hoy en `docs/diseno.md` (fecha pequeña arriba, «Hoy» en grande y «2 de 8» con **cuadritos de progreso**; listas sin cajitas; prototipo en `docs/diseno/rondas/ronda-4/index.html`) y la decisión **DEC-37** (punto 2: **«Marcadas hoy» no entra en la versión 1**). Y lo que ya existe en `develop`: la base común (`src/domain/items.ts` con `compareViewItemsForDay`, `src/domain/habit-occurrences.ts` con `indexMarks`, `occurrenceToViewItem` y `taskToViewItem`, `src/data/agenda.ts`, `src/data/query-keys.ts`, `src/data/use-today.ts`, `src/data/time-zone.ts`), `useMarkItem` de `src/data/marks.ts` (T07), `ListRow` y `DayProgress` de `src/components/ui/` y `useCategories` (T04). **El Supabase local es compartido**: úsalo tal cual; **no** hagas `db reset`, `stop` ni `start`. Otro trabajador puede usar los puertos 8081 u 8090: elige uno libre.

## Reglas

- Hoy muestra **lo pendiente de hoy**: las ocurrencias de hábitos no archivados que tocan hoy y las tareas no archivadas con fecha de hoy (RF-08). **Nunca** tareas sin fecha ni vencidas, ni ocurrencias sin marcar de días anteriores (RN-07, RN-08, RN-29).
- Orden: `compareViewItemsForDay` (hora exacta o la de la franja; sin hora, al final).
- Marcar con **un toque** (RNF-06): ✓ hecho y ✗ no hecho con `useMarkItem` (T07), que ya muestra el aviso con «Deshacer» y lo refleja al instante. Lo marcado **sale de la lista** (no hay «Marcadas hoy»).
- Arriba: la fecha pequeña en español («Martes, 6 de octubre de 2026»), «Hoy» en grande y, a la derecha, «N de M» con `DayProgress`: `M` = todo lo de hoy (pendiente y marcado), los cuadritos con lo marcado en el orden en que se marcó (`markedAt`), hecho o no hecho.
- **Sin nada pendiente**: si hoy no tocaba nada, «Hoy no tienes nada. Día libre.»; si todo está marcado, «Todo hecho por hoy.» (CU-03 A4).
- Pulsar el **título** de una fila abre su ficha: `/habitos/[id]` para una ocurrencia y `/tareas/[id]` para una tarea (las construyen T05 y T06 a la vez que tú; enlaza igual).
- El día cambia solo a medianoche (`useToday`).

## Qué hacer

1. **Dominio** en `src/domain/views/today.ts` (puro, tests exhaustivos): `getTodayItems({ habits, marks, tasks, today }): ViewItem[]` (todo lo de hoy, pendiente y marcado, ordenado) y `summarizeDay(items): { total: number; marked: ViewItem[] }` (lo marcado en orden de `markedAt`).
2. **Datos** en `src/data/today.ts`: `useTodayView(today)` con la clave `queryKeys.today(today)`, que guarda un `ViewData` (así T07 lo parchea al marcar): `fetchHabits({ includeArchived: false, timeZone })`, `fetchHabitMarks({ fromDate: today, toDate: today })` y las tareas no archivadas con `due_date = today` (cualquier estado), convertidas con `mapTaskRow`.
3. **Pantalla** `src/app/(tabs)/hoy.tsx` (**no la conviertas en carpeta**: cambiaría el nombre de la pestaña en `src/app/(tabs)/_layout.tsx`, que no es tuyo) y sus piezas en `src/components/today/`: cabecera, lista de pendientes con `ListRow` (meta: «10:00 · Personal · Hábito»; sin categoría, sin color: `category` opcional), estados de carga, error (en español, con «Reintentar») y vacío. Pantalla fina. Para pulsar el título, añade a `ListRow` una prop opcional `onPress` (sin cambiar nada más de su aspecto).
4. **Tests**: los **escenarios 2 a 6 y 10 de CU-03**, y el **1** sin «Marcadas hoy» (DEC-37): al marcar, sale de la lista y el contador «N de M» sube. Dominio exhaustivo (hábito archivado, tarea vencida, tarea sin fecha, hábito que empieza mañana, regla que cambia hoy, orden con franjas y horas). Componentes de la pantalla con datos simulados (los dos mensajes de vacío, error y reintento, marcar con un toque). Rendimiento (RNF-01): con 50 hábitos y 2.000 tareas, `getTodayItems` en menos de 50 ms.

## Fuera de alcance

«Marcadas hoy» (RF-09) y ver otros días (RF-10): no entran. El añadir rápido (T16), la vista de categoría y Bandeja (T10), pendientes (T11), los formularios (T05, T06), `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, `package.json`, Jira, `docs/contexto.md`, otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan los escenarios 1 a 6 y 10 de CU-03 (el 1 adaptado a DEC-37) y el resto de tests; cobertura de líneas de `src/domain/views/today.ts` ≥ 90 %.
- [ ] Lint, tipos, tests unitarios, `test:zones`, integración y exportación web en verde dentro de Docker; CI del PR en verde.
- [ ] En la web (MCP de Chrome), con datos de prueba: se ve Hoy, se marca con un toque, sale el aviso con «Deshacer» y el contador sube.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-12` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
