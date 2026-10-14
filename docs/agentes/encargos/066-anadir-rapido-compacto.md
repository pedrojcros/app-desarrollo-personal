# Encargo 066 — Añadir rápido compacto

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1.1, DEC-51 (filas 4, 5 y 6 del pulido) |
| Ticket | `ADP-38` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6.1-sol` |
| Skills | `codigo-legible` y `test-driven-development` (en `.agents/skills/`) |
| Rama | `ADP-38-anadir-rapido-compacto`, desde `origin/develop` |
| Reservado | `src/components/quick-add/**`; además `e2e/quick-add-keyboard.yaml` solo si cambia algún texto que use |

Lee la regla de legibilidad de `AGENTS.md`. No uses Supabase. El emulador **no** es necesario (Maestro se ejecuta al cerrar la versión, en el 073). Si el worktree no tiene `node_modules`, `./docker/app/run npm ci`.

## Objetivo

Que el menú de añadir rápido sea una barra pequeña encima del teclado, que no enseñe la barra de autorrelleno y que se cierre con el atrás del sistema.

## Qué hacer

Lee **solo** el apartado «066 — Añadir rápido compacto» de `docs/propuestas/pulido-visual.md` y las filas 4, 5 y 6 de la tabla del apartado 2: son el encargo completo. En resumen:

1. **Tamaño:** el campo del título con el tamaño `body` del tema (15 px), no `title`; menos relleno vertical. Los atajos de fecha y la categoría siguen con 44 puntos de zona de toque. Solo tokens de `src/theme`, nada de tamaños sueltos.
2. **Sin autorrelleno:** todos los campos de texto del añadir rápido con `autoComplete="off"` y `importantForAutofill="no"`. Si en la web Chrome sigue enseñando su barra, se anota en el informe; no se busca un truco.
3. **El atrás cierra el menú:** si el teclado se cierra **por el sistema** (atrás o gesto de Android, o el teclado que se oculta en la web del móvil, con el `visualViewport` que ya usa `use-web-viewport.ts`) y **no** hay un selector abierto (fecha, hora, categoría u opciones del hábito), el menú se cierra también. Abrir un selector que oculta el teclado **no** cierra el menú. El borrador (`use-quick-add-draft.ts`) se sigue guardando: al volver a abrir, está lo escrito.
4. **Tests:** tamaño de letra del título, propiedades de autorrelleno, cierre al ocultarse el teclado, no cierre con un selector abierto y borrador conservado. Los tests que ya hay (`quick-add.test.tsx`, `upward-choice.test.tsx`, `use-web-viewport.test.ts`, `form-defaults.test.tsx`) siguen pasando.

## Fuera de alcance

- `src/components/category-select/**` (es del encargo 069) y cualquier animación (encargo 067).
- `src/components/ui/**`, `src/theme/**` y las pantallas.
- `docs/contexto.md`, la bitácora y `docs/decisiones.md`: los actualiza el orquestador.

## Criterio de hecho

- [ ] Los cuatro puntos hechos, con sus tests.
- [ ] `./docker/app/run npm run lint`, `./docker/app/run npm run typecheck` y `./docker/app/run npm run test` en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR **contra `develop`** con `ADP-38` en el título. **No hagas merge**.

## Cómo informar al terminar

En la descripción del PR, en formato corto (DEC-45): **Hecho**, **Ficheros**, **Decisiones**, **Dudas**, **Tests** (comando y resultado en una línea) y **PR**. Di cómo detectas que el teclado lo cerró el sistema y no un selector. Si algo no está claro, pregunta con `orca orchestration ask`. Al final, `worker_done` con un resumen de tres frases y `--outcome succeeded|failed`.
