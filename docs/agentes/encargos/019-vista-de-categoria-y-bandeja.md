# Encargo 019 — Vista de categoría y Bandeja de entrada (T10)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | `T10` en `docs/05-plan.md` |
| Ticket | `ADP-13` (solo informativo: no lo toques) |
| Agente | codex (esfuerzo medio) |
| Skills a usar | `expo-router`, `expo-native-ui`, `test-driven-development`, `frontend-ui-engineering`, `codigo-legible`, `flujo-git` (en `.agents/skills/`) |
| Rama y worktree | `ADP-13-vista-de-categoria`, desde `develop`, tu propio worktree |
| Depende de | T04, T07 y la base común de vistas, fusionadas en `develop` |
| Reservado para este encargo | `src/domain/views/category.ts` y sus tests; `src/data/category-view.ts` y sus tests; `src/components/category-view/`; `src/app/categorias/` (`[id].tsx` y su `_layout.tsx`); la pantalla `src/app/(tabs)/bandeja.tsx`; en `src/components/category-list/` **solo** abrir la categoría al pulsar su nombre |

## Antes de empezar

Lee `AGENTS.md` entero (capas: `src/domain` sin React, Expo ni Supabase; regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español; **todo en Docker** con `./docker/app/run ...`). Lee CU-03 (A5, escenarios 5 y 6) y CU-07 (escenario 6) y RN-25 a RN-30 en `docs/03-casos-de-uso.md`, RF-11 en `docs/02-funcionalidades.md`, `docs/diseno.md` (al abrir una categoría, sus tareas agrupadas por sección y al final las que no tienen sección; listas sin cajitas) y lo que ya está en `develop`: la base común (`src/domain/items.ts`, `src/domain/habit-occurrences.ts`, `src/data/agenda.ts`, `src/data/query-keys.ts`, `src/data/use-today.ts`), `useMarkItem` (T07), `useCategories` y `CategoryIcon` (T04), `ListRow` (con `category` y `onPress` opcionales; si `onPress` aún no existe porque T09 no se ha fusionado, añádela tú del mismo modo: prop opcional para pulsar el título, sin cambiar su aspecto). **El Supabase local es compartido**: úsalo tal cual; **no** hagas `db reset`, `stop` ni `start`. Otro trabajador puede usar los puertos 8081 u 8090: elige uno libre.

## Reglas (decididas por el orquestador)

- La vista de una categoría (o de la Bandeja, `categoryId = null`) muestra **lo pendiente que contiene, con y sin fecha** (RF-11): las **tareas pendientes no archivadas** de esa categoría (también las vencidas y las futuras) y, de los **hábitos no archivados** de esa categoría, **la ocurrencia de hoy si toca y está pendiente**.
- Orden: primero lo que tiene fecha (de la más antigua a la más reciente, y dentro de un día con `compareViewItemsForDay`), después lo que no tiene fecha (por nombre).
- En una categoría con secciones: **agrupado por sección** (por nombre), y al final lo que no tiene sección (DEC-31). La Bandeja no tiene secciones.
- Marcar con ✓ o ✗ con `useMarkItem`: lo marcado **desaparece** de la lista (RN-30) y sale el aviso con «Deshacer» (lo hace T07).
- Pulsar el título abre la ficha: `/habitos/[id]` o `/tareas/[id]` (las hacen T05 y T06; enlaza igual).
- Vacío: «No hay nada pendiente aquí.». Error: en español, con «Reintentar».

## Qué hacer

1. **Dominio** en `src/domain/views/category.ts` (puro, tests exhaustivos): `getCategoryViewItems({ habits, marks, tasks, categoryId, today }): ViewItem[]` y `groupBySection(items, sections): { sectionId: string | null; items: ViewItem[] }[]`.
2. **Datos** en `src/data/category-view.ts`: `useCategoryView(categoryId, today)` con la clave `[...queryKeys.categoryView(categoryId), today]` (sigue bajo `['views']`, así T07 la parchea), que guarda un `ViewData`: `fetchHabits({ includeArchived: false, timeZone })`, `fetchHabitMarks({ fromDate: today, toDate: today })` y las tareas pendientes no archivadas de esa categoría (o con `category_id` nulo para la Bandeja), con `mapTaskRow`.
3. **Pantallas**: `src/app/categorias/[id].tsx` (cabecera con icono, color y nombre de la categoría; grupos por sección) con su `src/app/categorias/_layout.tsx` (un `Stack` con **guardián de sesión**: sin sesión, `Redirect` a `/login`; no toques `src/app/_layout.tsx`), y la pestaña `src/app/(tabs)/bandeja.tsx` (**no la conviertas en carpeta**). En la lista de categorías (`src/components/category-list/`), pulsar el nombre abre `/categorias/[id]` (sin cambiar lo demás: desplegar y plegar siguen igual). Pantallas finas, piezas en `src/components/category-view/`.
4. **Tests**: escenarios **5 y 6 de CU-03** en la vista de categoría, **6 de CU-07** (agrupado por sección y lo que no tiene sección aparte), Bandeja con y sin fecha, hábito con ocurrencia hoy y sin ella, tarea vencida y futura; componentes con datos simulados (marcar hace desaparecer, vacío, error y reintento). Comprueba en la web con el MCP de Chrome que **recargar `/categorias/<id>` funciona** (ruta dinámica en la web estática de Vercel).

## Fuera de alcance

Renombrar categorías (RF-22), el añadir rápido (T16), Hoy (T09), pendientes (T11), los formularios (T05, T06), `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, `package.json`, Jira, `docs/contexto.md`, otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan los escenarios 5 y 6 de CU-03 en la vista de categoría y el 6 de CU-07, y el resto de tests; cobertura de líneas de `src/domain/views/category.ts` ≥ 90 %.
- [ ] Lint, tipos, tests unitarios, `test:zones`, integración y exportación web en verde dentro de Docker; CI del PR en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-13` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales y `worker_done` con `--outcome succeeded|failed`.
