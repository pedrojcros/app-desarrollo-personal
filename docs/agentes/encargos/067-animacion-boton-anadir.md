# Encargo 067 — Animación del botón de añadir

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1.1, DEC-51 punto 7 (fila 3 del pulido) |
| Ticket | `ADP-39` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills | `expo-animation`, `codigo-legible` y `test-driven-development` |
| Rama | `ADP-39-animacion-anadir`, desde `origin/develop` |
| Depende de | 066 (añadir rápido compacto) y 071 (pestaña Listas), ya fusionados |
| Reservado | `src/components/quick-add/quick-add-button.tsx`, `src/components/quick-add/quick-add-provider.tsx`, y un fichero nuevo de animación dentro de `src/components/quick-add/` si hace falta, más sus tests |

Lee la regla de legibilidad de `AGENTS.md`. No uses Supabase. El emulador no es obligatorio (Maestro va en el 073). Si el worktree no tiene `node_modules`, `./docker/app/run npm ci`.

**Sin dependencias nuevas:** `react-native-reanimated` (4.3.1) ya está instalado. Si una skill te propone otro paquete (por ejemplo `@expo/ui`), no lo uses: manda `AGENTS.md`.

## Objetivo

Al pulsar «+», el botón se desplaza al centro y se expande hasta convertirse en el menú de añadir; al cerrar, hace el camino al revés (fila 3 del apartado 2 de `docs/propuestas/pulido-visual.md`).

## Qué hacer

Lee el apartado «067 — Animación del botón de añadir» de `docs/propuestas/pulido-visual.md`. En resumen:

1. Con `react-native-reanimated`, en el hilo de la interfaz; unos 250 ms, sin rebotes exagerados. El teclado puede subir mientras tanto: la animación no debe dar saltos cuando llegue.
2. **Reducir movimiento:** si el sistema lo pide (`useReducedMotion`), el menú aparece sin animación, como ahora.
3. En la web debe funcionar igual o, si no se puede, sin animación; nunca roto. Compruébalo con el MCP `chrome-devtools`: **redimensiona siempre la ventana a 360×800 antes de mirar**, con la web en el puerto 8093 (`./docker/app/run npx expo start --web --port 8093`; el Supabase local ya está arrancado, no lo reinicies; usuario `seed@example.com` sembrado como dice `scripts/seed/README.md`, «Uso local», con una contraseña local que generes sin imprimirla). Para ese servidor al terminar.
4. **No cambies** la lógica del 066: cierre con el teclado, borrador, autorrelleno y tamaños. Sus tests (`quick-add.test.tsx` y los demás de `src/components/quick-add/`) siguen pasando sin tocarlos.
5. Tests: con reducir movimiento no hay animación; el menú se abre y se cierra igual que antes.

## Fuera de alcance

- `quick-add-bar.tsx` y el resto de `src/components/quick-add/**` salvo lo reservado; `category-select`, `date-field` y las pantallas. Si hace falta tocar otro fichero, pregunta.
- `docs/`.

## Criterio de hecho

- [ ] La animación se ve al abrir y al cerrar, sin saltos al subir el teclado; con reducir movimiento no hay animación.
- [ ] `./docker/app/run npm run lint`, `./docker/app/run npm run typecheck` y `./docker/app/run npm run test` en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR **contra `develop`** con `ADP-39` en el título. **No hagas merge**.

## Cómo informar al terminar

En la descripción del PR, en formato corto (DEC-45): **Hecho**, **Ficheros**, **Decisiones**, **Dudas**, **Tests** (comando y resultado en una línea) y **PR**, más qué comprobaste en la web a 360 px. Si algo no está claro, pregunta con `orca orchestration ask`. Al final, `worker_done` con un resumen de tres frases y `--outcome succeeded|failed`.
