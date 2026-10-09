# Encargo 031 — Reprogramar una tarea vencida y marcar un día entero como no hecho (RF-13 y RF-14)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | «Después de la versión 1», puntos 2 y 5: RF-13 y RF-14 (DESEABLE), en la pantalla Pendientes |
| Ticket | `ADP-18` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills a usar | `test-driven-development`, `codigo-legible` (en `.agents/skills/`) |
| Rama y worktree | `ADP-18-reprogramar-y-dia-no-hecho`, desde `origin/develop`, tu propio worktree |
| Reservado para este encargo | `src/data/tasks.ts` (solo añadir), `src/data/marks.ts` (solo añadir `markItems`), `src/components/past-pending/`, `src/components/ui/list-row.tsx` (solo la acción secundaria opcional), sus tests |

## Antes de empezar

- **`AGENTS.md`:** capas, Zod antes de cada escritura, errores `{ ok, value }` o `{ ok: false, error }`, regla de legibilidad y **todo en Docker**.
- **Casos de uso:** de `docs/03-casos-de-uso.md`, CU-04 entero (A2, A4, E1, escenarios 2 a 4; RN-15).
- **Código:** solo lo que vas a tocar: `src/data/tasks.ts`, `src/data/marks.ts` (`useMarkItem` y su secuencia de guardado), `src/components/past-pending/`, `ListRow`, `DateField`, `ConfirmDialog` y `UndoToast`.
- **Base de datos:** el Supabase local es compartido. No hagas `db reset`, `stop` ni `start`.
- **Lo pesado, de uno en uno:** `test:integration`, `test:zones`, `expo export` y `expo start` van con `flock /tmp/adp-pesado.lock ./docker/app/run ...`. Expo, en el puerto 8092.

## Reglas que decide el orquestador

- **Reprogramar** solo existe para **tareas** (RN-15).
  - **Dónde:** en Pendientes, cada tarea vencida tiene, junto a ✓ y ✗, una acción con icono de calendario y etiqueta «Reprogramar».
  - **Cómo:** abre un diálogo con los atajos **Hoy** y **Mañana**, el `DateField` y «Guardar».
  - **Qué guarda:** la fecha nueva y la misma hora que tenía. Una fecha anterior a hoy no se acepta: «La nueva fecha debe ser hoy o posterior.» (E1).
  - **Después:** la tarea sigue pendiente y sale de la lista. Si cae hoy, aparece en Hoy.
- **Día entero como no hecho:**
  - **Dónde:** cada cabecera de día en Pendientes tiene la acción «Todo no hecho».
  - **Confirmación:** pide confirmar con `ConfirmDialog` («Se marcarán como no hechas las N cosas pendientes de ese día.»).
  - **Qué guarda:** «no hecha» en **todo** lo pendiente de ese día, ocurrencias y tareas vencidas (A4).
  - **Aviso:** sale **uno solo**, «N marcadas como no hechas», con **Deshacer**, que las devuelve **todas** a pendiente.
  - **Si falla una:** esa vuelve a la lista y se avisa (E2).
- **`ListRow`:** la acción secundaria es **opcional**. Sin ella, la fila se ve exactamente igual que ahora.

## Qué hacer

1. **Datos** (contrato):

   ```ts
   // src/data/tasks.ts
   export function rescheduleTask(taskId: string, newDueDate: CalendarDate, today: CalendarDate): Promise<DataResult<null>>; // códigos: invalid_input, past_date, not_found, network_error, unknown_error
   export function useRescheduleTask(): UseMutationResult<null, DataResultError, { taskId: string; newDueDate: CalendarDate }>; // invalida ['views']
   // src/data/marks.ts
   // dentro de lo que devuelve useMarkItem():
   markItems: (items: ViewItem[], status: ItemStatus) => void; // un solo aviso con Deshacer para todos
   ```

   `markItems` reutiliza la secuencia de guardado de `markItem` elemento a elemento, para no romper su orden ni sus parches de caché. No cambies el comportamiento de `markItem`.
2. **Interfaz** en `src/components/past-pending/`: el diálogo de reprogramar y la acción de la cabecera del día. Accesible: etiquetas, 44 pt y teclado en la web. Solo tokens.
3. **Tests** (TDD):
   - escenarios 2, 3 y 4 de CU-04, con la base de datos real los que guardan;
   - `markItems` con un fallo parcial y con Deshacer;
   - componentes del diálogo (fecha pasada rechazada, atajos) y de la cabecera (confirmar y cancelar).

## Fuera de alcance

Hoy, el historial, las fichas, `src/domain` (salvo lo mínimo que necesites, dicho en el informe), `package.json`, Jira, `docs/contexto.md` y otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan los escenarios 2, 3 y 4 de CU-04 y el resto de tests.
- [ ] Lint, tipos, tests unitarios, `test:zones` e integración en verde dentro de Docker; CI del PR en verde.
- [ ] Actualiza RF-13 y RF-14 en `docs/02-funcionalidades.md`, en la columna de estado si la hay, o con una nota «Hecho en …».
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`**, con `ADP-18` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
