# Encargo 034 — Filtrar el historial y corregir desde él (RF-16 y RF-17)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | «Después de la versión 1», puntos 3 y 6: RF-16 y RF-17 (DESEABLE), en el Historial |
| Ticket | `ADP-20` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6-luna` (mecánico: reglas y pasos fijados aquí) |
| Skills a usar | `test-driven-development`, `codigo-legible` (en `.agents/skills/`) |
| Rama y worktree | `ADP-20-filtrar-y-corregir-historial`, desde `origin/develop`, tu propio worktree |
| Reservado para este encargo | `src/app/(tabs)/historial.tsx`, `src/components/history-grid/`, `src/domain/views/history.ts` y sus tests |

## Antes de empezar

- **`AGENTS.md`:** capas, regla de legibilidad y **todo en Docker**.
- **Casos de uso:** en `docs/03-casos-de-uso.md`, CU-05 (A1, A2, A3 y A5; escenario 2; RN-03, RN-16 y RN-17).
- **Funcionalidades:** RF-16 y RF-17 en `docs/02-funcionalidades.md`.
- **Código:** `src/app/(tabs)/historial.tsx`, `src/components/history-grid/`, `src/domain/views/history.ts` (`buildHistoryGrid` y `HistoryCell`) y `useMarkItem` de `src/data/marks.ts`, que se usa tal cual y **no se toca**.
- **Base de datos:** el Supabase local es compartido. No hagas `db reset`, `stop` ni `start`.
- **Lo pesado, de uno en uno:** `test:integration`, `test:zones`, `expo export` y `expo start` van con `flock /tmp/adp-pesado.lock ./docker/app/run ...`. Expo, en el puerto 8094.

## Reglas que decide el orquestador

- **Filtros (RF-16)**, encima de la cuadrícula y combinables:
  - **Estado:** Todos · Hechas · No hechas · Sin marcar.
  - **Categoría:** Todas, la Bandeja y cada categoría, con el selector de categorías que ya existe.
  - **Elemento:** Todos o uno concreto, de la lista de filas del rango.
- **Cómo filtran:** con un estado elegido, una fila sale solo si tiene alguna celda con ese estado. Las celdas de otros estados se ven atenuadas, nunca vacías: la cuadrícula conserva su forma. El porcentaje de cada día se calcula sobre lo que queda visible.
- **Sin filas tras filtrar:** «Nada con estos filtros.».
- **Corregir (RF-17):**
  - al pulsar una celda de un día pasado o de hoy (hecha, no hecha o sin marcar), sale un menú con «Hecha», «No hecha» y «Sin marcar», con el estado actual indicado;
  - el cambio se guarda con `markItem`, que ya guarda cuándo y ofrece Deshacer (RN-03 y RN-04);
  - las celdas de días que no tocaban no se pulsan;
  - las celdas son accesibles: su etiqueta dice el elemento, el día y el estado.
- **Lógica pura:** filtrar y recalcular porcentajes son funciones puras en `src/domain/views/history.ts`, con tests y probadas con `test:zones`.

## Qué hacer

1. **Dominio:** `filterHistoryGrid(grid, filters)`, con sus tests. Antes de escribir el código, define el tipo `HistoryFilters`.
2. **Interfaz:**
   - la barra de filtros y el menú de la celda, accesibles: etiquetas, 44 pt y teclado en la web; solo tokens;
   - si el menú se abre cerca del borde inferior, se abre hacia arriba.
3. **Tests (TDD):**
   - el escenario 2 de CU-05;
   - el criterio de RF-17: «Nadar», no hecho hace dos semanas, pasa a hecho y queda guardado cuándo, contra la base de datos real;
   - combinar filtros;
   - porcentajes con filtros;
   - días que no tocaban, que no se pulsan.

## Fuera de alcance

Hoy, Pendientes, `src/data/marks.ts`, `src/data/history.ts` (salvo lo mínimo, dicho en el informe), `package.json`, Jira, `docs/contexto.md` y otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan el escenario 2 de CU-05, el criterio de RF-17 y el resto de tests.
- [ ] Lint, tipos, tests unitarios, `test:zones` e integración en verde dentro de Docker; CI del PR en verde.
- [ ] RF-16 y RF-17 marcados como hechos en `docs/02-funcionalidades.md`.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-20` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
