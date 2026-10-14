# Encargo 071 — Pestaña Listas

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1.1, DEC-51 punto 5 (fila 10 del pulido) |
| Ticket | `ADP-43` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills | `codigo-legible`, `test-driven-development` y `expo-router` |
| Rama | `ADP-43-pestana-listas`, desde `origin/develop` |
| Reservado | `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/{bandeja,categorias,listas}.tsx`, `src/app/bandeja.tsx` (nuevo), `src/components/category-list/**`, `src/components/ui/page-metadata.tsx` y su test, `src/tests/tabs-layout.test.tsx`, `src/tests/categories-screen.test.tsx`, `e2e/category-section-task.yaml` |

Lee la regla de legibilidad de `AGENTS.md`. No uses el emulador ni Supabase (Maestro se ejecuta al cerrar la versión, en el 073). Si el worktree no tiene `node_modules`, `./docker/app/run npm ci`.

## Objetivo

Que la barra de abajo tenga una pestaña **Listas** que junte la Bandeja y las categorías, en lugar de las pestañas Bandeja y Categorías por separado.

## Qué hacer

Lee **solo** el apartado «071 — Pestaña Listas» de `docs/propuestas/pulido-visual.md`: es el encargo completo. En resumen:

1. La pestaña **Categorías** pasa a llamarse **Listas** (icono `LayoutGrid` o `List` de `lucide-react-native`), con la ruta `(tabs)/listas.tsx`: arriba, una fila **Bandeja de entrada** con su contador de pendientes; debajo, las categorías como ahora; al final, «Nueva categoría».
2. La pestaña **Bandeja** desaparece. La vista de la Bandeja se abre al tocar su fila, en una ruta fuera de las pestañas (`src/app/bandeja.tsx`), con la misma cabecera y vuelta atrás que una categoría. Cualquier enlace que fuera a `/bandeja` sigue funcionando. Las fichas de categoría siguen en `/categorias/[id]`.
3. El añadir rápido sigue proponiendo la Bandeja como destino por defecto fuera de Hoy (no toques `src/components/quick-add/**`; si para eso hiciera falta, pregunta).
4. Hasta que el 072 añada Próximo, la barra tiene cuatro pestañas: Hoy, Listas, Pendientes e Historial.
5. Los títulos de página (`page-metadata.tsx`) quedan bien para `/listas` y `/bandeja`.
6. Tests: la fila de la Bandeja abre su vista; las categorías y «Nueva categoría» siguen como antes; la barra tiene las cuatro pestañas. `e2e/category-section-task.yaml` pasa de «Categorías» a «Listas» (no lo ejecutes).

## Fuera de alcance

- `src/app/(tabs)/hoy.tsx` y `src/components/today/**` (los toca el 065 a la vez que tú), `src/components/quick-add/**` y `src/components/category-select/**`.
- `docs/contexto.md`, la bitácora y `docs/decisiones.md`: los actualiza el orquestador. Si `docs/04-arquitectura.md` o `docs/diseno.md` nombran las pestañas Bandeja o Categorías, dilo en el informe y no lo toques.

## Criterio de hecho

- [ ] La barra muestra Hoy, Listas, Pendientes e Historial; desde Listas se llega a la Bandeja y a cada categoría.
- [ ] `./docker/app/run npm run lint`, `./docker/app/run npm run typecheck` y `./docker/app/run npm run test` en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR **contra `develop`** con `ADP-43` en el título. **No hagas merge**.

## Cómo informar al terminar

En la descripción del PR, en formato corto (DEC-45): **Hecho**, **Ficheros**, **Decisiones**, **Dudas**, **Tests** (comando y resultado en una línea) y **PR**. Si algo no está claro, pregunta con `orca orchestration ask`. Al final, `worker_done` con un resumen de tres frases y `--outcome succeeded|failed`.
