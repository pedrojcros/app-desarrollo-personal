# Encargo 076 — Corrección del añadir rápido compacto

> **Permiso de publicación:** puedes hacer `git push` a tu rama. Nunca hagas merge ni `push --force`.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1.1, corrección del encargo 066 (PR #90, sin fusionar) |
| Ticket | `ADP-38` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills | `codigo-legible`, `test-driven-development` y `systematic-debugging` |
| Rama | Trabajas **sobre la rama del PR #90**, `pedrojcros/ADP-38-anadir-rapido-compacto`: tu worktree parte de ella. Commits nuevos y `git push` a esa misma rama (así se actualiza el PR #90). No abras otro PR |
| Reservado | `src/components/quick-add/**`, `src/components/date-field/**`, `src/components/category-select/**` (lo que ya tocó el 066) y `e2e/quick-add-keyboard.yaml` |

Lee la regla de legibilidad de `AGENTS.md`. No uses Supabase. El emulador **no** es obligatorio (Maestro se ejecuta en el 073). Si el worktree no tiene `node_modules`, `./docker/app/run npm ci`.

## Contexto

El encargo 066 (`git log` de tu rama y la descripción del PR #90; el encargo, en el apartado «066 — Añadir rápido compacto» de `docs/propuestas/pulido-visual.md`) hizo el añadir rápido más pequeño, sin autorrelleno y que se cierra cuando el sistema oculta el teclado (atrás de Android o teclado que se oculta en la web del móvil) si no hay un selector abierto, conservando el borrador. Una revisión encontró estos fallos. Arréglalos todos, cada uno con su test, **sin cambiar lo demás**.

## Qué hacer

1. **El borrador solo conserva lo escrito** (`use-quick-add-draft.ts`, `quick-add-provider.tsx`). Hoy el borrador restaurado pisa todos los `defaults` de la pantalla desde la que se abre: lugar (categoría, sección), `dueDate` y `startDate`. Decisión del orquestador: al reabrir se restauran **solo** el nombre, el tipo (tarea o hábito) y las opciones del hábito; el lugar y las fechas salen siempre de los `defaults` de la pantalla actual. El borrador se **borra** al enviar con éxito y al pasar a «Más opciones» (para que el nombre no salga duplicado al volver). Tests: reabrir desde otra pantalla con otros `defaults` usa los nuevos; tras enviar, reabrir sale vacío; tras «Más opciones», reabrir sale vacío.
2. **Que enviar no cierre el menú.** El campo usa `editable={!disabled}` mientras se guarda, y en Android desactivar el campo con foco puede ocultar el teclado un instante: eso dispararía el cierre por teclado oculto y rompería «tras enviar, la barra se vacía y sigue abierta para añadir otra». Mientras se guarda (o justo al enviar, hasta que el foco vuelve con `focusAfterSave`), un teclado oculto **no** cierra el menú. Test: con el guardado en curso, un `keyboardDidHide` no cierra el menú; terminado el guardado, el campo vuelve a tener foco y el menú sigue abierto.
3. **Web de escritorio** (`use-web-viewport.ts`): `fullHeight` es el máximo histórico y nunca baja, así que encoger la ventana y volver a agrandarla, acoplar las herramientas de desarrollo o girar el móvil cierran el menú por error. El cierre por teclado oculto en la web solo debe ocurrir si el viewport se contrajo **mientras el menú estaba abierto** y con un campo de texto con foco; la altura de referencia se toma al abrir el menú. Tests de esos casos y uno que fije el umbral de vuelta (hoy una mutación del `0.9` no la detecta ningún test).
4. **El listener solo con el menú abierto:** el de `visualViewport` (y el de `Keyboard` en nativo) no deben llamar a `close()` con el menú cerrado.
5. **Claves de los selectores:** las cadenas `'time'`, `'frequency'`, `'moment'`, `'date'` y `'category'` repartidas por `quick-add-bar.tsx`, `habit-options.tsx` y `date-shortcuts.tsx` pasan a un tipo unión (`QuickAddSelector`) definido en un solo sitio.
6. **`e2e/quick-add-keyboard.yaml`:** hoy termina con `pressKey: BACK` y luego busca «Cerrar añadir rápido» y el campo, que ya no existen porque el atrás cierra el menú. Adáptalo al comportamiento nuevo: tras `BACK`, el campo ya no se ve; se reabre con «+» y el nombre escrito sigue ahí. No lo ejecutes: se ejecuta en el 073.

## Fuera de alcance

- Cualquier otro fichero, las pantallas y `docs/`. Si hace falta tocar otro, pregunta con `orca orchestration ask`.
- Dependencias nuevas.

## Criterio de hecho

- [ ] Los seis puntos hechos, cada uno con su test (el 6, con el YAML adaptado).
- [ ] `./docker/app/run npm run lint`, `./docker/app/run npm run typecheck` y `scripts/with-heavy-lock ./docker/app/run npm run test` en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] Commits en español en la rama del PR #90 y `git push`. **No hagas merge**.

## Cómo informar al terminar

Añade al final de la descripción del PR #90 (`gh pr edit 90 --body-file ...`, conservando lo que ya hay) un apartado «Corrección (076)» en formato corto: **Hecho**, **Ficheros**, **Decisiones**, **Dudas** y **Tests** (comando y resultado en una línea). Si algo no está claro, pregunta con `orca orchestration ask`. Al final, `worker_done` con un resumen de tres frases y `--outcome succeeded|failed`.
