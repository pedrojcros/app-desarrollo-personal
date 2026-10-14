# Encargo 074 — Cinco skills automáticas y Expo sin `@expo/ui`

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1.1, DEC-53 y DEC-54. **Va antes del 069** (selector de categoría) |
| Ticket | Lo crea el orquestador (DEC-47); solo informativo: no lo toques |
| Agente | codex, `--model gpt-6-luna` (mecánico: mover carpetas y quitar frases indicadas) |
| Skills | `flujo-git` (en `.agents/skills/`) |
| Rama | `ADP-nnn-skills-por-perfil`, desde `origin/develop` |
| Reservado | `.agents/skills/**`, `.agents/skills-a-demanda/**` y la sección «Skills del proyecto» y la línea de `.agents/skills-a-demanda/` en «Estructura del repositorio» de `AGENTS.md` |

Lee `AGENTS.md` entero. No hay código de la app ni Supabase ni emulador. Si el worktree no tiene `node_modules`, `./docker/app/run npm ci`.

## Objetivo

Que solo cinco skills se activen solas, que el resto se pida por encargo, y que ninguna de nuestras copias de Expo mande usar `@expo/ui`, una dependencia no aprobada que choca con React Native Reusables.

## Qué hacer

1. **Mover a demanda** con `git mv`, de `.agents/skills/` a `.agents/skills-a-demanda/`, estas 17 carpetas: `android-emulator-qa`, `api-and-interface-design`, `code-review-and-quality`, `code-simplification`, `expo-animation`, `expo-data-fetching`, `expo-design-system`, `expo-native-ui`, `expo-overview`, `expo-project-structure`, `expo-router`, `frontend-ui-engineering`, `incremental-implementation`, `security-and-hardening`, `source-driven-development`, `supabase-postgres-best-practices` y `vercel-react-native-skills`. En `.agents/skills/` quedan solo `codigo-legible`, `flujo-git`, `test-driven-development`, `systematic-debugging` y `verification-before-completion`.
2. **Quitar `@expo/ui` de nuestras copias.** Con `grep -rn 'expo-ui\|@expo/ui'` en `expo-overview`, `expo-native-ui` (con `references/`) y `expo-design-system`, quita **toda frase que mande usar `@expo/ui` o cargar la skill `expo-ui`**. Son al menos estas:
   - en `expo-overview/SKILL.md`, la viñeta de `expo-ui` de la lista «Build the app», el bloque «Component selection rule» y, en «Make it look native», el trozo «grouped controls / settings forms = `expo-ui`;»;
   - en `expo-native-ui/SKILL.md`, el aviso inicial «Before picking any UI component, check `expo-ui` first» y la viñeta «For any sheet, picker, slider, toggle, menu, or grouped-form section: use `@expo/ui`…»;
   - en `expo-native-ui/references/controls.md`, el aviso «Prefer `@expo/ui` for these controls».

   Donde quitas un aviso, pon una sola línea en inglés: «In this project, UI components come from React Native Reusables (`src/components/ui`); `@expo/ui` is not an approved dependency.» No reescribas nada más ni reformatees.
3. **Fichas.** En `.agents/skills/README.md`, la tabla de automáticas queda con las cinco. Las 17 filas movidas pasan, con su texto de «Cuándo», a `.agents/skills-a-demanda/README.md`, y en las dos tablas de origen se mueven sus filas. Además:
   - En «Origen, licencias y cambios», para `expo/skills`: «quitadas las órdenes de usar `@expo/ui` (DEC-53)».
   - En las reglas de la ficha de demanda: **cualquier trabajador puede leer por su cuenta una skill de esta carpeta** si cree que le hace falta, y lo dice en su informe. Instalar una nueva sigue necesitando aprobación. Enlaza a los perfiles: `docs/agentes/plantilla-encargo.md#perfiles-de-skills-dec-54`.
   - En «Plugins»: **las skills y plugins sincronizados de la cuenta de claude.ai** (`design:*`, `engineering:*`, `productivity:*`, `legal:*`, `marketing:*`, `data:*`, `cowork-plugin-management:*`, `docs`, `docx`, `pptx`, `xlsx`, `pdf` y otros) **no son del proyecto y no se usan**: para lo mismo, mandan las de estas fichas (DEC-53).
4. **`AGENTS.md`, sección «Skills del proyecto»:** que diga lo mismo en pocas líneas. Son cinco automáticas; el resto, a demanda, las pide el encargo y el trabajador puede leer otra de esa carpeta y decirlo en el informe; las sincronizadas de claude.ai no se usan. Ajusta la línea de `.agents/skills-a-demanda/` en «Estructura del repositorio».
5. **Rutas viejas:** busca `.agents/skills/<carpeta movida>` en el repositorio (`grep -rn`). Corrígelas **fuera de `docs/agentes/encargos/`**. En los encargos solo las listas en tu informe, sin tocarlas.

## Fuera de alcance

- El código de la app, `docs/` (salvo las rutas del punto 5), el enlace `.claude/skills` y la configuración de Claude, Codex u Orca.
- Cambiar el contenido de las skills más allá del punto 2.
- `docs/contexto.md`, la bitácora y `docs/decisiones.md`: los actualiza el orquestador.

## Criterio de hecho

- [ ] `ls .agents/skills` enseña solo las cinco carpetas y el `README.md`.
- [ ] `grep -rn '@expo/ui\|expo-ui' .agents/` solo encuentra la línea nueva del punto 2 y lo que diga la ficha.
- [ ] Las dos fichas y `AGENTS.md` dicen lo de los puntos 3 y 4.
- [ ] `./docker/app/run npm run lint` en verde.
- [ ] PR **contra `develop`** con el ticket en el título. **No hagas merge**.

## Cómo informar al terminar

En la descripción del PR, en formato corto (DEC-45): **Hecho**, **Ficheros**, **Decisiones**, **Dudas**, **Tests** (comando y resultado en una línea) y **PR**. Añade la lista de rutas viejas que quedan en los encargos (punto 5). Si algo no está claro, pregunta con `orca orchestration ask`. Al final, `worker_done` con un resumen de tres frases y `--outcome succeeded|failed`.
