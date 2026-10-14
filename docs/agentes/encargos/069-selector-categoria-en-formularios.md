# Encargo 069 — Selector de categoría dentro de los formularios

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1.1, DEC-51 punto 8 (fila 9 del pulido) |
| Ticket | `ADP-41` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6-luna` |
| Skills | `codigo-legible` y `test-driven-development` (en `.agents/skills/`) |
| Rama | `ADP-41-selector-categoria`, desde `origin/develop` (ya con el 066 fusionado) |
| Depende de | 066 (`ADP-38`), que añadió a `CategorySelect` la prop `onOpenChange` |
| Reservado | `src/components/category-select/**`. Nada más |

Lee la regla de legibilidad de `AGENTS.md`. No uses el emulador ni Supabase. Si el worktree no tiene `node_modules`, `./docker/app/run npm ci`.

## Qué pasa

En los formularios de tarea y de hábito, al abrir el selector de categoría, la lista desplegada se mete por debajo de los campos de después. Es una capa absoluta con `z-20`, pero en la web el `z-index` solo ordena dentro de su contenedor y los campos siguientes la tapan.

## Qué hacer

Lee el apartado «069 — Selector de categoría dentro de los formularios» de `docs/propuestas/pulido-visual.md`. En resumen:

1. Con `openDirection="down"` (formularios de tarea y de hábito), la lista se pinta **dentro del flujo**, debajo del botón, y empuja lo de debajo. Ya no es una capa absoluta.
2. Con `openDirection="up"` (añadir rápido) sigue flotando como ahora.
3. `onOpenChange` sigue funcionando igual en las dos formas.
4. Tests de las dos formas en `category-select.test.tsx`. Los de `src/components/quick-add/upward-choice.test.tsx` y `quick-add.test.tsx` siguen pasando sin tocarlos.

## Fuera de alcance

- Cualquier fichero fuera de `src/components/category-select/**`, incluidos los formularios y el añadir rápido. Si ves que hace falta tocar uno, pregunta.
- `docs/`.

## Criterio de hecho

- [ ] En «Nueva tarea» y en el formulario de hábito, la lista de categorías se ve entera y empuja los campos de debajo; en el añadir rápido, sigue flotando hacia arriba.
- [ ] `./docker/app/run npm run lint`, `./docker/app/run npm run typecheck` y `./docker/app/run npm run test` en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR **contra `develop`** con `ADP-41` en el título. **No hagas merge**.

## Cómo informar al terminar

En la descripción del PR, en formato corto (DEC-45): **Hecho**, **Ficheros**, **Decisiones**, **Dudas**, **Tests** (comando y resultado en una línea) y **PR**. Si algo no está claro, pregunta con `orca orchestration ask`. Al final, `worker_done` con un resumen de tres frases y `--outcome succeeded|failed`.
