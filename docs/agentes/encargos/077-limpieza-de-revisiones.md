# Encargo 077 — Detalles menores de las revisiones de la 1.1.1

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1.1, hallazgos menores de las revisiones de 064, 071 y 072 |
| Ticket | `ADP-48` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6-luna` |
| Skills | `codigo-legible` y `test-driven-development` (en `.agents/skills/`) |
| Rama | `ADP-48-limpieza-revisiones`, desde `origin/develop` |
| Reservado | `src/data/upcoming.ts`, `src/components/upcoming/**`, `src/components/ui/list-row.tsx` y su test, `src/components/category-list/inbox-row.tsx` y su test, `src/tests/inbox-route.test.tsx`, `scripts/orca/clean_worktrees.py` y `scripts/orca/test_clean_worktrees.py` |

Lee la regla de legibilidad de `AGENTS.md`. No uses el emulador ni el navegador; el Supabase local está arrancado y es compartido (no hagas `db reset`, `stop` ni `start`). Si el worktree no tiene `node_modules`, `./docker/app/run npm ci`. **Nunca ejecutes `scripts/orca/clean_worktrees.py --apply`** ni `orca worktree rm`.

## Objetivo

Seis arreglos pequeños e independientes, cada uno con su test y su commit. Ninguno cambia lo que ve el usuario, salvo lo que lee el lector de pantalla.

## Qué hacer

1. **`src/data/upcoming.ts`, `useUpcomingView`:** el `select` es una función en línea, y TanStack Query v5 solo guarda su resultado si la referencia es estable. Hazla estable con `useCallback`, dependiente de `today`. Test: con el mismo `today`, dos renders no vuelven a llamar a la agrupación (por ejemplo, con un espía sobre `groupUpcomingItems`).
2. **`src/components/upcoming/upcoming-list.tsx`:**
   - La etiqueta accesible de cada fila (hoy «Nadar, Miércoles 21, abre la ficha») tapa la hora o franja y la categoría. Inclúyelas: «Nadar, Miércoles 21, 17:00, Salud, abre la ficha», sin las partes que falten.
   - El bloque de los días de una semana es largo: extráelo a un componente `UpcomingDaySection` en la misma carpeta.
   - Ajusta los tests de la lista.
3. **`src/components/ui/list-row.tsx`:** en la variante `readOnly`, prohíbe `secondaryAction` en los tipos (`secondaryAction?: never`). Test de tipos o de render que lo deje claro, y los usos actuales sin cambios.
4. **`src/components/category-list/inbox-row.tsx`:** la etiqueta «Abrir Bandeja de entrada» oculta el contador al lector de pantalla. Que diga, por ejemplo, «Abrir Bandeja de entrada, 3 pendientes», y nada más que el nombre si no hay contador (cargando, error o cero). Ajusta su test.
5. **`src/tests/inbox-route.test.tsx`:** hoy `QuickAddButton` está simulado como `null`, así que nada comprueba que en `/bandeja` el añadir rápido propone la Bandeja. Captura sus props en el mock y comprueba que `defaults.categoryId` es `null`.
6. **`scripts/orca/clean_worktrees.py`:** `find_loose_directories` llama a `find_main_worktree`, que puede lanzar `CommandFailure`, pero el bloque `try` de `main` que la rodea solo captura `OSError`. Captura los dos, imprime el aviso como ya hace y termina con código distinto de 0. Test con `find_main_worktree` fallando. `python3 -m unittest scripts.orca.test_clean_worktrees` en verde.

## Fuera de alcance

- Cualquier fichero fuera de los reservados, `src/domain/**` y `docs/`.
- Cambiar el comportamiento de lo que ya funciona.

## Criterio de hecho

- [ ] Los seis puntos, cada uno con su test.
- [ ] `./docker/app/run npm run lint`, `./docker/app/run npm run typecheck` y `scripts/with-heavy-lock ./docker/app/run npm run test` en verde, y `python3 -m unittest scripts.orca.test_clean_worktrees`.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR **contra `develop`** con `ADP-48` en el título. **No hagas merge**.

## Cómo informar al terminar

En la descripción del PR, en formato corto (DEC-45): **Hecho**, **Ficheros**, **Decisiones**, **Dudas**, **Tests** (comandos y resultado en una línea) y **PR**. Si algo no está claro, pregunta con `orca orchestration ask`. Al final, `worker_done` con un resumen de tres frases y `--outcome succeeded|failed`.
