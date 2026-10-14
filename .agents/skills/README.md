# Skills del proyecto

Skills (carpetas con un `SKILL.md`) que usan todos los agentes de este repositorio.

| Carpeta | Qué hay | Quién la ve |
|---|---|---|
| `.agents/skills/` (esta) | Las **automáticas**: los agentes las descubren y las usan solos | Codex y Copilot aquí; Claude, por el enlace `.claude/skills` |
| [`.agents/skills-a-demanda/`](../skills-a-demanda/README.md) | Las que se piden en el encargo; cualquier trabajador puede leer otra si le hace falta | No se activan solas |
| [`.agents/LICENSES/`](../LICENSES/) | Licencias de las skills de terceros | — |

## Reglas

- **Mandan `AGENTS.md` y el encargo.** Si una skill dice otra cosa (ramas, idioma de los commits, dependencias), se sigue `AGENTS.md`.
- **«Your human partner», «the user» o «ask the user» significan el orquestador** para un trabajador: pregúntale con `orca orchestration ask` (lo explica tu preámbulo de Orca). No te quedes esperando a una persona.
- **Nunca se envía nada a terceros** desde una skill: ni comentarios a sus autores ni telemetría (prohibición 10 de `AGENTS.md`).
- Añadir una skill nueva necesita aprobación, igual que una dependencia. Al actualizar, se vuelven a copiar del origen, se revisan los cambios y se anota aquí el commit nuevo.

## Automáticas: cuándo se usa cada una

El orquestador dice en cada encargo cuáles usar (campo «Skills a usar» de la [plantilla](../../docs/agentes/plantilla-encargo.md)).

| Skill | Origen | Cuándo |
|---|---|---|
| `codigo-legible` | Propia | Siempre que se escriba o revise código |
| `flujo-git` | Propia | Commits, ramas, PR y conflictos |
| `test-driven-development` | obra/superpowers | Al implementar lógica o corregir un fallo: primero el test (los escenarios de los casos de uso) |
| `systematic-debugging` | obra/superpowers | Cuando falla un test o algo no se comporta como se espera |
| `verification-before-completion` | obra/superpowers | Antes de decir «hecho»: ejecutar las comprobaciones y enseñar su salida |

## Plugins

Las skills y plugins sincronizados de la cuenta de claude.ai (`design:*`, `engineering:*`, `productivity:*`, `legal:*`, `marketing:*`, `data:*`, `cowork-plugin-management:*`, `docs`, `docx`, `pptx`, `xlsx`, `pdf` y otros) no son del proyecto y no se usan. Para lo mismo mandan las skills de estas fichas (DEC-53).

## Origen, licencias y cambios

| Origen | Commit | Licencia | Cambios hechos en nuestra copia |
|---|---|---|---|
| [obra/superpowers](https://github.com/obra/superpowers) | `8ca22db` (2026-09-25) | MIT | Ninguno |
| Propias (`codigo-legible`, `flujo-git`) | — | — | Resumen práctico de `AGENTS.md` |

Las de `.agents/skills-a-demanda/` tienen su propia ficha.

## No incluidas, y por qué

| Skill | Motivo |
|---|---|
| `git-workflow-and-versioning` (addyosmani) | Propone trabajar sobre `main` y commits en inglés: choca con ADR-0002 y DEC-06. La sustituye `flujo-git` |
| `debugging-and-error-recovery` y `test-driven-development` (addyosmani) | Sustituidas por las de superpowers, más cortas y estrictas |
| `interview-me`, `idea-refine`, `constraint-driven-development`, `spec-driven-development`, `planning-and-task-breakdown` (addyosmani) | Son para planificar con el humano: trabajo del arquitecto; un trabajador no puede entrevistar al humano |
| `doubt-driven-development`, `using-agent-skills`, `context-engineering`, `documentation-and-adrs`, `observability-and-instrumentation`, `deprecation-and-migration` (addyosmani) | Lanzan revisores extra, reparten hacia skills que no están, el proyecto ya tiene sus reglas y su formato de ADR, o quedan fuera de la versión 1 |
| `using-git-worktrees` (superpowers) | Las carpetas de trabajo las crea y gestiona Orca |
| `dispatching-parallel-agents`, `subagent-driven-development`, `executing-plans` (superpowers) | Reparten con subagentes de Claude, no con Orca; sus ideas útiles están en el método del [orquestador](../../docs/agentes/orquestador.md) |
| `shadcn` | Es para web; la app es React Native y usa React Native Reusables |
| `design-taste-frontend`, `build-awwwards-quality-sites` | Para webs de presentación, no para interfaces de producto (lo dicen ellas mismas) |
| `docx`, `mcp-builder`, `web-artifacts-builder`, `algorithmic-art`, `openai-docs`, `figma-implement-design`, `agents-sdk` (Cloudflare), SwiftUI | No aplican a esta app |
| `loki-mode` | Miles de scripts, licencia poco clara y compite con el orquestador |
| `impeccable` completo | Sus scripts están minificados y no se pueden revisar: solo su guía escrita, a demanda |
| `animate` (emilkowalski) | Es para web; en la app se usa `expo-animation` |
| `expo-ui` | Empuja los componentes nativos `@expo/ui`, que chocan con React Native Reusables |
| `eas-*` (salvo `eas-app-stores` y `eas-update`, que están a demanda), `expo-skill-feedback`, `expo-module`, `expo-app-clip`, `expo-brownfield`, `expo-dom`, `expo-web-to-native` | De pago, para más adelante, con envío de datos a Expo, o no aplican |
| Plugins de Expo y de Vercel para Claude (DEC-34) | Sus hooks envían telemetría en cada sesión, y el de Vercel analiza el proyecto y añade texto a las instrucciones (prohibición 10). Sus skills útiles están copiadas a demanda, sin hooks |
| `react-native-best-practices` (Callstack) | Ocupa 6,4 MB y la cubre `vercel-react-native-skills` |
| `react-navigation` (Callstack) | Expo Router ya no depende de React Navigation |
| `agent-device`, `dogfood` (Callstack) | Otra herramienta de control de dispositivos: aquí se usa Orca |
| `android-performance`, `deploy-to-vercel`, `vercel-cli-with-tokens` | Sin licencia, o manejan claves de Vercel |
