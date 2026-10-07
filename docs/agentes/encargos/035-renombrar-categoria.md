# Encargo 035 — Renombrar una categoría (RF-22)

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | «Después de la versión 1», punto 6: RF-22 (DESEABLE) |
| Ticket | `ADP-21` (solo informativo: no lo toques) |
| Agente | copilot (pequeño y mecánico, DEC-39) |
| Rama | `ADP-21-renombrar-categoria`, desde `develop` |
| Reservado | `src/data/categories.ts` (solo añadir), `src/components/category-list/` y sus tests |

## Antes de empezar

- **`AGENTS.md`:** Zod antes de cada escritura, errores `{ ok, value }` o `{ ok: false, error }`, regla de legibilidad y **todo en Docker** (`./docker/app/run ...`).
- **Casos de uso:** de `docs/03-casos-de-uso.md`, CU-07 (A1, E2, E4 y escenario 4; RN-24 y RN-28).
- **Código:** cómo se crea una categoría, en `src/data/categories.ts` (`createCategory`, `useCreateCategory`) y en `src/components/category-list/` (`NameForm`, `new-category-form.tsx`, `category-row.tsx`).
- **Base de datos:** el Supabase local es compartido. No hagas `db reset`, `stop` ni `start`.
- **Lo pesado, de uno en uno:** `test:integration` va con `flock /tmp/adp-pesado.lock ./docker/app/run npm run test:integration`.

## Qué hacer

1. **Datos:** `renameCategory(categoryId, name)` y `useRenameCategory()` en `src/data/categories.ts`, igual que crear:
   - mismas reglas del nombre;
   - código `duplicate_name` si ya existe otra con ese nombre sin distinguir mayúsculas (RN-24);
   - `not_found` si no existe;
   - invalida `['categories']` y `['views']`.
2. **Interfaz:**
   - en la fila de cada categoría, una acción «Renombrar» que abre `NameForm` con el nombre actual;
   - los errores, junto al campo;
   - la Bandeja no se puede renombrar (RN-28), porque no es una categoría guardada: no le pongas la acción.
3. **Tests:**
   - el escenario 4 de CU-07 contra la base de datos real («Compra» pasa a «Supermercado» y sus tareas siguen en ella);
   - nombre duplicado con otras mayúsculas;
   - el formulario: cancelar no cambia nada.
4. RF-22 marcado como hecho en `docs/02-funcionalidades.md`.
5. Commits en español, push y PR contra `develop` con `ADP-21` en el título.

No toques nada más. Si algo no está claro, pregunta con `orca orchestration ask`.

## Criterio de hecho

- [ ] Lint, tipos, tests unitarios e integración de tu parte en verde dentro de Docker.
- [ ] PR abierto contra `develop`. **No hagas merge.**

Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`).
