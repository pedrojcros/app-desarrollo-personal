# Encargo 012 — Gestión de categorías y secciones (T04)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

| Campo | Valor |
|---|---|
| Tarea del plan | `T04` en `docs/05-plan.md` |
| Ticket | `ADP-7` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills a usar | `expo-router`, `expo-data-fetching`, `supabase-postgres-best-practices`, `test-driven-development`, `frontend-ui-engineering`, `codigo-legible`, `flujo-git` (en `.agents/skills/`) |
| Rama y worktree | `ADP-7-categorias-y-secciones`, desde `develop`, tu propio worktree |
| Depende de | T02, T14 y la base común de vistas (encargo 010), fusionadas en `develop` |
| Reservado para este encargo | la migración `supabase/migrations/20261007120000_delete_category_function.sql`; `src/data/database.types.ts` (regenerado); `src/data/categories.ts`, `src/data/sections.ts` y sus tests; `src/components/category-icon/`, `src/components/category-select/`, `src/components/confirm-dialog/`; la pantalla `src/app/(tabs)/categorias.tsx` |

## Antes de empezar

Lee `AGENTS.md` entero (capas, convenciones de errores y validación con Zod, regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español; **todo en Docker** con `./docker/app/run ...`). Lee CU-07 y RN-24 a RN-28 en `docs/03-casos-de-uso.md`, RF-20 y RF-21 en `docs/02-funcionalidades.md`, `docs/diseno.md` (reglas de interfaz: categorías con icono y color, se despliegan y se recogen; desplegables hacia arriba), la decisión **DEC-37** (punto 8: los 5 colores, guardados por nombre) en `docs/decisiones.md`, y lo que ya existe: `src/data/result.ts`, `src/data/query-keys.ts`, `src/domain/items.ts`, `src/theme/category-colors.ts` y los componentes de `src/components/ui/`.

## Objetivo

Crear y eliminar categorías (con icono y color) y sus secciones; lo que contiene una categoría eliminada pasa a la Bandeja; la lista de categorías se despliega y se recoge; y un selector de categoría y sección reutilizable para los formularios (T05, T06) y el añadir rápido (T16).

## Qué hacer

1. **Migración** `supabase/migrations/20261007120000_delete_category_function.sql`: una función `public.delete_category(target_category_id uuid) returns void`, `language plpgsql`, **`security invoker`** (así la protege RLS) y `set search_path = ''`, que en una sola transacción: pasa a la Bandeja los hábitos y las tareas de esa categoría (`category_id = null, section_id = null`, archivados incluidos), borra la categoría (sus secciones caen en cascada) y, si no borró nada, lanza `raise exception 'category_not_found' using errcode = 'P0002'`. `revoke execute ... from public, anon` y `grant execute ... to authenticated`. Comentarios en español con el porqué. **El Supabase local es compartido**: aplica tu migración con `./docker/app/run npx supabase migration up` (añade sin borrar; **no** hagas `db reset`, `stop` ni `start`) y regenera los tipos con `supabase gen types typescript --local`.
2. **Iconos** en `src/components/category-icon/`: una lista cerrada `CATEGORY_ICON_NAMES` (en este orden: `star`, `shopping-cart`, `graduation-cap`, `book-open`, `heart-pulse`, `dumbbell`, `house`, `briefcase`, `wallet`, `utensils`, `plane`, `music`, `palette`, `code`, `leaf`, `paw-print`, `car`, `users`, `gamepad-2`, `sparkles`), su tipo `CategoryIconName`, y un componente `CategoryIcon({ name, size?, colorToken? })` que pinta el icono de `lucide-react-native`. Comprueba que todos existen en la versión instalada; si alguno no, sustitúyelo por el más parecido y dilo. La Bandeja usa `inbox`.
3. **Datos** en `src/data/categories.ts` y `src/data/sections.ts` (devuelven `DataResult`, validan con Zod **antes de cada escritura**, errores con código y mensaje en inglés). Contrato (lo usarán T05, T06, T10 y T16):

   ```ts
   export interface Section { id: string; categoryId: string; name: string }
   export interface Category { id: string; name: string; icon: CategoryIconName; color: CategoryColor; sections: Section[] }

   // categories.ts
   export function fetchCategories(): Promise<DataResult<Category[]>>; // por nombre (localeCompare 'es', sin mayúsculas); secciones también por nombre
   export function createCategory(input: { name: string; icon: CategoryIconName; color: CategoryColor }): Promise<DataResult<Category>>;
   export function countCategoryContents(categoryId: string): Promise<DataResult<{ habits: number; tasks: number }>>; // no archivados
   export function deleteCategory(categoryId: string): Promise<DataResult<null>>; // llama a la función delete_category
   export function useCategories(): UseQueryResult<Category[], DataResultError>; // clave queryKeys.categories()
   export function useCreateCategory(): UseMutationResult<...>;  // invalida ['categories']
   export function useDeleteCategory(): UseMutationResult<...>;  // invalida ['categories'] y ['views']

   // sections.ts
   export function createSection(input: { categoryId: string; name: string }): Promise<DataResult<Section>>;
   export function countSectionContents(sectionId: string): Promise<DataResult<{ habits: number; tasks: number }>>;
   export function deleteSection(sectionId: string): Promise<DataResult<null>>; // lo que contiene se queda en la categoría, sin sección (la base de datos ya lo hace)
   export function useCreateSection(): UseMutationResult<...>;   // invalida ['categories']
   export function useDeleteSection(): UseMutationResult<...>;   // invalida ['categories'] y ['views']
   ```

   Códigos de error: `invalid_input`, `duplicate_name` (nombre repetido sin distinguir mayúsculas: violación única `23505`), `not_found`, `network_error`, `unknown_error`. Nombre: recortado, de 1 a 60 caracteres. Al leer, un `icon` o `color` desconocido en la base de datos se convierte en `star` y `teal` (no rompe la lista).
4. **Diálogo de confirmación** en `src/components/confirm-dialog/`: `ConfirmDialog({ visible, title, message, confirmLabel, cancelLabel = 'Cancelar', destructive?, onConfirm, onCancel })`, que funcione **igual en Android y en la web** (`Alert.alert` no funciona en la web), accesible (foco, Escape cierra en la web, etiquetas). Lo reutilizarán T05 y T06 para archivar.
5. **Selector** en `src/components/category-select/`. Contrato:

   ```ts
   export interface CategorySelection { categoryId: string | null; sectionId: string | null } // categoryId null = Bandeja
   export function CategorySelect(props: {
     value: CategorySelection;
     onChange: (value: CategorySelection) => void;
     /** 'up' abre la lista hacia arriba (sobre el teclado, en el añadir rápido); 'down', hacia abajo. */
     openDirection?: 'up' | 'down';
   }): JSX.Element;
   ```

   Muestra la elección como una pastilla (icono, color y nombre, y «› Sección» si hay); al pulsarla abre una lista con la Bandeja primero y después cada categoría con sus secciones; elegir una sección elige también su categoría. Usa `useCategories`. Teclado y lector de pantalla en la web; zonas de toque de 44 pt.
6. **Pantalla** `src/app/(tabs)/categorias.tsx` (**no la conviertas en carpeta**: cambiaría el nombre de la pestaña en `src/app/(tabs)/_layout.tsx`, que no es tuyo): la lista de categorías con su icono y color, **desplegable y plegable** con sus secciones dentro (plegadas por defecto); «Nueva categoría» (nombre, rejilla de iconos y los 5 colores con su nombre en español de `getCategoryColorLabel`); «Nueva sección» dentro de cada categoría; eliminar categoría (con `ConfirmDialog`: «Se moverán a la Bandeja N hábitos y M tareas.», con las cuentas de `countCategoryContents`) y eliminar sección («Lo que contiene seguirá en "X", sin sección.»). La Bandeja **no** aparece como categoría eliminable. Estado vacío («Aún no tienes categorías»), de carga y de error en español, nunca el error técnico. Pantalla fina: compone componentes y llama a hooks. **No enlaces aún a la vista de una categoría** (la hace T10).
7. **Tests** (TDD): los **escenarios 1, 2, 3, 5, 6 y 7 de CU-07** (con la base de datos real los que tocan datos; el 5 como test de la pantalla: la Bandeja no se puede eliminar); integración de la función `delete_category` (mueve a la Bandeja, borra secciones, es atómica, otro usuario no puede borrar la tuya: `category_not_found`, y `anon` no puede ejecutarla); validación (nombre vacío, repetido con otra capitalización, icono o color no válidos); componentes (`CategorySelect`, `ConfirmDialog`, la pantalla con datos simulados).

## Fuera de alcance

Renombrar categorías (RF-22 es deseable: no entra), la vista de una categoría (T10), formularios de hábitos y tareas (T05, T06), el añadir rápido (T16), `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, `package.json`, Jira, `docs/contexto.md`, otros encargos. **No hagas merge.** Otro trabajador puede usar los puertos 8081 u 8090: elige uno libre (`ss -ltn`).

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan los escenarios 1, 2, 3, 5, 6 y 7 de CU-07 y los demás tests descritos.
- [ ] La migración se aplica sobre la base de `develop` sin errores; tipos regenerados.
- [ ] Lint, tipos, tests unitarios, integración y exportación web en verde dentro de Docker; CI del PR en verde.
- [ ] Funciona en la web (compruébalo con el MCP de Chrome: crear, desplegar, eliminar con confirmación) y la interfaz usa solo tokens de `src/theme`.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-7` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
