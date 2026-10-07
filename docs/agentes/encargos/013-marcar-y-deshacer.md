# Encargo 013 — Cambiar el estado y aviso con «Deshacer» (T07)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

| Campo | Valor |
|---|---|
| Tarea del plan | `T07` en `docs/05-plan.md` |
| Ticket | `ADP-10` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills a usar | `expo-data-fetching`, `expo-animation`, `test-driven-development`, `frontend-ui-engineering`, `codigo-legible`, `flujo-git` (en `.agents/skills/`); a demanda `.agents/skills-a-demanda/emil-design-eng/SKILL.md` |
| Rama y worktree | `ADP-10-marcar-y-deshacer`, desde `develop`, tu propio worktree |
| Depende de | T02, T03, T14 y la base común de vistas (encargo 010), fusionadas en `develop` |
| Reservado para este encargo | `src/data/marks.ts` y sus tests; `src/components/undo-toast/`; en `src/components/ui/undo-notice.tsx` **solo** hacer opcional la acción; en `src/app/_layout.tsx` **solo** montar el proveedor del aviso |

## Antes de empezar

Lee `AGENTS.md` entero (capas, convención de errores, Zod antes de cada escritura, regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español; **todo en Docker** con `./docker/app/run ...`). Lee CU-03 (sobre todo los escenarios 1, 2, 8, 9 y 10 y la excepción E1) y RN-01 a RN-05, RN-31 y RN-32 en `docs/03-casos-de-uso.md`; RF-06, RF-07 y RNF-01 en `docs/02-funcionalidades.md`; la decisión **DEC-37** (punto 5: **el aviso dura 4 segundos**; punto 2: «Marcadas hoy» **no** entra en la versión 1); y la base común que ya está en `develop`: `src/domain/items.ts` (`MarkTarget`, `ViewItem`, `ViewData`, `applyStatusToItems`), `src/data/query-keys.ts` (y su regla: toda clave bajo `['views']` guarda un `ViewData`), `src/data/use-today.ts`, `src/data/result.ts` y `src/components/ui/undo-notice.tsx`.

## Objetivo

Marcar una ocurrencia o una tarea como hecha, no hecha o de vuelta a pendiente, **al instante** (optimista) en todas las vistas a la vez, guardando cuándo; deshacer desde un aviso de 4 segundos; y volver atrás si Supabase falla. Lo consumirán T09 (Hoy), T10 (categoría y Bandeja) y T11 (pendientes).

## Contrato (escrito por el orquestador; no lo cambies sin preguntar)

```ts
// src/data/marks.ts
/** Guarda el estado. 'pending' borra la marca (ocurrencia) o deja status = 'pending' y marked_at = null (tarea). */
export function setMarkStatus(
  target: MarkTarget,
  status: ItemStatus,
  today: CalendarDate,
): Promise<DataResult<{ markedAt: string | null }>>;

/** Lo que usan las vistas: marcar un elemento que tienen en pantalla. */
export function useMarkItem(): {
  markItem: (item: ViewItem, status: ItemStatus) => void;
  isMarking: boolean;
};

// src/components/undo-toast/
export interface NoticeOptions { message: string; actionLabel?: string; onAction?: () => void }
export function UndoToastProvider(props: { children: React.ReactNode }): JSX.Element;
export function useUndoToast(): { showNotice: (options: NoticeOptions) => void; hideNotice: () => void };
```

## Reglas de comportamiento

- **`setMarkStatus`**: ocurrencias en `habit_marks` (alta o cambio por la clave `habit_id, occurrence_date`; `pending` = borrar la fila) y tareas en `tasks` (`status` y `marked_at`). `marked_at` = el instante actual en UTC (ISO). Una **ocurrencia de un día posterior a `today` no se puede marcar** (RN-05): error `future_date`. Las tareas sí se pueden marcar aunque su fecha sea futura. Códigos: `invalid_input`, `future_date`, `not_found` (la tarea o el hábito no existen o no son del usuario), `network_error`, `unknown_error`.
- **`useMarkItem`** (TanStack Query, `useToday` para «hoy»):
  1. **Al instante**: cancela las consultas de `['views']` y parchea **todas** las cachés bajo `['views']` con `applyStatusToItems` (estado nuevo; `markedAt` = ahora, o `null` si es `pending`). La pantalla tiene que reflejarlo antes de que responda Supabase (RNF-01: menos de 300 ms).
  2. Muestra el aviso a la vez: «Marcada como hecha», «Marcada como no hecha» o «Devuelta a pendiente», con «Deshacer».
  3. **Deshacer** vuelve el elemento a su estado y su instante anteriores (los del `ViewItem` que recibió `markItem`), con la misma lógica optimista, **sin** mostrar otro aviso con «Deshacer».
  4. **Si Supabase falla**: deshace **solo** el parche de ese elemento (no restaures instantáneas completas de la caché: con varias marcas seguidas, borrarías las otras) y cambia el aviso por uno sin acción: «No se ha podido guardar. Inténtalo de nuevo.». Si el error es `future_date`: «Todavía no se puede marcar: ese día no ha llegado.».
  5. Al terminar (bien o mal), invalida `['views']`.
- **Aviso**: dura **4 segundos** (DEC-37); uno cada vez (uno nuevo sustituye al anterior y reinicia el tiempo); pulsar la acción lo cierra; abajo, por encima de la barra de pestañas y de la zona segura, sin tapar ni bloquear el resto de la pantalla (los toques pasan a través de lo que no es el aviso); el lector de pantalla lo anuncia sin robar el foco (región en vivo educada); con «Reducir movimiento» del sistema, sin animación. Usa el `UndoNotice` de T14: hazle **opcional** la acción (sin `onAction`, no se pinta «Deshacer»), sin cambiar nada más de su aspecto.
- **Proveedor**: móntalo en `src/app/_layout.tsx` dentro del `QueryClientProvider`, para que valga en todas las pantallas (también las que no son pestañas). Solo ese cambio.

## Tests (TDD)

- Como tests de un **componente de prueba** (sin la pantalla de Hoy, que es de T09) con una lista de `ViewItem` en una caché bajo `['views', ...]` y la capa de datos simulada: **escenarios 1, 2, 9 y 10 de CU-03**, el **8** (día futuro: no cambia y avisa) y la excepción **E1** (Supabase falla: el estado vuelve atrás y sale el aviso de error). Que el cambio se ve **antes** de que se resuelva la promesa de Supabase. Dos marcas seguidas y que falle solo la primera: la segunda se conserva.
- **Integración** de `setMarkStatus` contra el **Supabase local compartido** (ya arrancado con las migraciones de `develop`: **no** hagas `db reset`, `stop` ni `start`): alta, cambio, vuelta a pendiente (borra la fila), `marked_at` en UTC, tarea con fecha futura, ocurrencia futura rechazada, elemento de otro usuario → `not_found`.
- **Aviso** con temporizadores falsos: desaparece a los 4 s, uno nuevo sustituye y reinicia, la acción lo cierra, sin acción no hay botón.

## Fuera de alcance

Las vistas (Hoy, categoría, Bandeja, pendientes, historial), «Marcadas hoy» (fuera de la versión 1, DEC-37), marcar un día entero (RF-14, deseable), `package.json` (si el aviso necesitara una librería nueva, es una dependencia: **para y pregunta**), Jira, `docs/contexto.md`, otros encargos. **No hagas merge.** Otro trabajador puede usar los puertos 8081 u 8090: elige uno libre.

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan como tests los escenarios 1, 2, 8, 9 y 10 de CU-03 y E1, y el resto de tests descritos.
- [ ] Lint, tipos, tests unitarios, integración y exportación web en verde dentro de Docker; CI del PR en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-10` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
