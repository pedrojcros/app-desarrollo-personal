# Encargo 009 — T14: colores accesibles, paleta de categorías y «Cerrar sesión»

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado. Trabajas **en el worktree y la rama que ya existen** de T14 (`pedrojcros/ADP-5-sistema-visual`, PR #11). El trabajador anterior terminó. **No abras otro PR**: commits pequeños sobre esta rama y `git push`; el PR #11 se actualiza solo.

| Campo | Valor |
|---|---|
| Tarea del plan | `T14` (cierre) |
| Ticket | `ADP-5` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills a usar | `expo-design-system`, `frontend-ui-engineering`, `test-driven-development`, `codigo-legible`, `flujo-git` |
| Reservado | lo de T14 (`src/theme/`, `tailwind.config.js`, `src/components/ui/`, `src/app/(dev)/`, `src/app/ajustes.tsx`, `src/app/(tabs)/_layout.tsx`, la tabla de colores y la sección de uso de `docs/diseno.md`); en la fase 2, además, `jest.config.js` (conflicto) y **solo para proteger Ajustes y el catálogo**, `src/app/_layout.tsx` |

## Antes de empezar

Lee `AGENTS.md` entero (regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español; **todo se ejecuta en Docker** con `./docker/app/run ...`), `docs/diseno.md` y la decisión **DEC-37** de `docs/decisiones.md` (está en `develop` o, si aún no, en `git show origin/docs/orquestador-ola-2:docs/decisiones.md`). Otro trabajador puede usar los puertos 8081 u 8090: elige uno libre (`ss -ltn`).

## Fase 1 (empieza ya)

1. **Colores del tema Blanco (DEC-37, punto 1).** El humano decidió oscurecerlos un poco, con el mismo tono: `muted-foreground` `#75695A` → `#6F6355`; `accent` **y** `accent-text` `#C2410C` → `#B43C0B`; `not-done` `#9C8F7E` → `#8C8071`. Cámbialos en `src/theme/tokens.ts` (y donde se repitan) y en la tabla de `docs/diseno.md` (las tres celdas de la columna Blanco, con «(DEC-37)» al lado). Revisa si `accent-soft` u otro token derivado del acento necesita ajustarse para seguir viéndose coherente; si lo cambias, dilo.
2. **El test de contraste ya no admite excepciones**: elimina `knownFailuresPendingDecision` y que el test exija **cero** incumplimientos en los tres temas. Si con los colores nuevos aparece algún otro incumplimiento, **no lo tapes**: avísame con `orca orchestration ask` con la medición.
3. **Paleta de categorías por nombre de color (DEC-37, punto 8).** Hoy los tokens se llaman por la categoría de ejemplo (`category-shopping`, `category-university`…). Renómbralos por su color: `category-teal` (antes shopping), `category-blue` (university), `category-green` (health), `category-amber` (personal) y `category-garnet` (home), en los tres temas, en Tailwind y donde se usen. Exporta desde `src/theme` (por ejemplo `src/theme/category-colors.ts`, reexportado en `src/theme/index.ts`) **este contrato**, que usará T04:

   ```ts
   export const CATEGORY_COLORS = ['teal', 'blue', 'green', 'amber', 'garnet'] as const;
   export type CategoryColor = (typeof CATEGORY_COLORS)[number];
   /** Etiqueta en español para el selector: «Verde azulado», «Azul», «Verde», «Ámbar», «Granate». */
   export function getCategoryColorLabel(color: CategoryColor): string;
   /** Valor del color en el tema activo, para lo que no pueda usar una clase de NativeWind. */
   export function useCategoryColorValue(color: CategoryColor): string;
   ```

   con su test (las cinco etiquetas; el valor cambia con el tema). La base de datos guardará el **nombre** (`'teal'`…), no el valor.
4. Actualiza las capturas del catálogo del tema Blanco si es barato (`docs/diseno/`), y la sección «Cómo usar los tokens» de `docs/diseno.md` con la paleta de categorías.
5. Pasa lint, tipos, tests y exportación web dentro de Docker, haz commit y push.
6. Cuando termines la fase 1, **pregunta al coordinador** con `orca orchestration ask`: «Fase 1 de T14 hecha; ¿está T02 fusionada en develop?». Espera la respuesta (si el `ask` caduca, retómalo con el mismo mensaje, como dice tu preámbulo). No sigas a la fase 2 sin ella.

## Fase 2 (solo cuando el coordinador te diga que T02 está en `develop`)

7. `git fetch origin && git merge origin/develop` (sin `rebase` ni `push --force`). Resuelve el conflicto de `jest.config.js` **conservando los dos `moduleNameMapper`** (el alias `@/` de T02 y los de lucide y AsyncStorage de T14) y cualquier otro conflicto conservando lo de las dos partes.
8. **Proteger Ajustes y el catálogo.** En `src/app/_layout.tsx`, T02 protege con `Stack.Protected` solo `index` y `(tabs)`; `ajustes` y `(dev)` quedarían visibles sin sesión. Añádelos al grupo protegido por la sesión (sin cambiar nada más del layout) y un test que lo compruebe (sin sesión, `ajustes` lleva al login).
9. **Botón «Cerrar sesión» en Ajustes (DEC-37, punto 3).** Usa `signOut` de `src/data/auth` (devuelve `{ ok: true, value }` o `{ ok: false, error: { code, message } }`). Al salir bien, la protección de T02 lleva sola al login; si falla, un mensaje en español («No se ha podido cerrar la sesión. Inténtalo de nuevo»), nunca el error técnico. Estilo con los componentes de `src/components/ui` y los tokens. Tests con `signOut` simulado: llama a `signOut` y muestra el mensaje si falla. Etiqueta de accesibilidad y zona de toque de 44 pt.
10. Lint, tipos, tests, integración (necesita Supabase local: si hay otro levantado con el mismo `project_id`, **no lo pares**; pregunta) y exportación web en Docker; push; CI del PR #11 en verde.
11. Actualiza la descripción del PR #11: qué cambió en este cierre (colores DEC-37, paleta por nombre, protección de Ajustes, «Cerrar sesión») y quita lo que ya no aplique.

## Fuera de alcance

Pantallas de la app (Hoy, Bandeja…), la lógica del aviso «Deshacer» (T07), el selector de categoría (T04), `package.json`, `docs/` salvo `docs/diseno.md`, Jira, otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Colores de DEC-37 aplicados; test de contraste sin excepciones y en verde.
- [ ] Paleta de categorías por nombre con el contrato de arriba y su test.
- [ ] Rama al día con `develop`, conflicto resuelto; Ajustes y catálogo protegidos (test); «Cerrar sesión» con sus tests.
- [ ] Lint, tipos, tests, integración y exportación web en verde; CI del PR #11 en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
