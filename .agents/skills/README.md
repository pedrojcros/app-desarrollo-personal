# Skills del proyecto

Skills (carpetas con un `SKILL.md`) que usan todos los agentes de este repositorio.

| Carpeta | Qué hay | Quién la ve |
|---|---|---|
| `.agents/skills/` (esta) | Las **automáticas**: los agentes las descubren y las usan solos | Codex y Copilot aquí; Claude, por el enlace `.claude/skills` |
| [`.agents/skills-a-demanda/`](../skills-a-demanda/README.md) | Las que solo se usan **cuando el encargo las pide por su ruta** | Nadie las descubre solo |
| [`.agents/LICENSES/`](../LICENSES/) | Licencias de las skills de terceros | — |

## Reglas

- **Mandan `AGENTS.md` y el encargo.** Si una skill dice otra cosa (ramas, idioma de los commits, dependencias), se sigue `AGENTS.md`.
- **«Your human partner», «the user» o «ask the user» significan el orquestador** para un trabajador: pregúntale con `orca orchestration ask` (lo explica tu preámbulo de Orca). No te quedes esperando a una persona.
- **Nunca se envía nada a terceros** desde una skill: ni comentarios a sus autores ni telemetría (prohibición 10 de `AGENTS.md`).
- Añadir o actualizar una skill necesita aprobación, igual que una dependencia. Al actualizar, se vuelven a copiar del origen, se revisan los cambios y se anota aquí el commit nuevo.

## Automáticas: cuándo se usa cada una

El orquestador dice en cada encargo cuáles usar (campo «Skills a usar» de la [plantilla](../../docs/agentes/plantilla-encargo.md)).

| Skill | Origen | Cuándo |
|---|---|---|
| `codigo-legible` | Propia | Siempre que se escriba o revise código |
| `flujo-git` | Propia | Commits, ramas, PR y conflictos |
| `test-driven-development` | obra/superpowers | Al implementar lógica o corregir un fallo: primero el test (los escenarios de los casos de uso) |
| `systematic-debugging` | obra/superpowers | Cuando falla un test o algo no se comporta como se espera |
| `verification-before-completion` | obra/superpowers | Antes de decir «hecho»: ejecutar las comprobaciones y enseñar su salida |
| `incremental-implementation` | addyosmani | Encargos que tocan más de un fichero: pasos pequeños y comprobables |
| `api-and-interface-design` | addyosmani | Contratos entre piezas: tipos del dominio, firmas, esquema de datos |
| `source-driven-development` | addyosmani | Antes de usar una API de Expo, React Native o Supabase: comprobarla en la documentación oficial de la versión fijada |
| `security-and-hardening` | addyosmani | Inicio de sesión, RLS, validación de entradas y secretos |
| `code-review-and-quality` | addyosmani | Revisar un cambio (orquestador y revisores) |
| `code-simplification` | addyosmani | Código que funciona pero cuesta leer |
| `frontend-ui-engineering` | addyosmani | Pantallas y componentes: accesibilidad, estados de carga y error (sobre todo en la versión web) |
| `supabase-postgres-best-practices` | supabase/agent-skills | Tablas, tipos de columna, migraciones, índices y políticas RLS |
| `vercel-react-native-skills` | vercel-labs/agent-skills | Buenas prácticas y rendimiento de React Native y Expo |
| `expo-overview` | expo/skills | Punto de entrada: elige la skill de Expo adecuada |
| `expo-project-structure` | expo/skills | Estructura de carpetas al crear el proyecto |
| `expo-router` | expo/skills | Navegación y rutas |
| `expo-native-ui` | expo/skills | Pantallas con aspecto y controles nativos |
| `expo-design-system` | expo/skills | Tokens de diseño y componentes reutilizables (sistema visual) |
| `expo-data-fetching` | expo/skills | Peticiones de datos y estados de carga, error y vacío |
| `expo-animation` | expo/skills | Animaciones nativas |
| `android-emulator-qa` | openai/plugins | Probar flujos en el emulador Android. El dispositivo se controla con la skill de Orca `orca-emulator-android` |

## Origen, licencias y cambios

| Origen | Commit | Licencia | Cambios hechos en nuestra copia |
|---|---|---|---|
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | `1401c8b` (2026-10-03) | MIT | Ninguno |
| [expo/skills](https://github.com/expo/skills) | `d4f4840` (2026-10-05) | MIT | **Quitada la sección final «Submitting Feedback»**, que pedía al agente enviar comentarios a Expo con `npx submit-expo-feedback`, y la mención a `expo-skill-feedback` en `expo-overview` |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (`react-native-skills`, aquí `vercel-react-native-skills`) | `063bee9` (2026-08-28) | MIT, según su `SKILL.md` (el repositorio no trae fichero de licencia) | Ninguno, salvo el nombre de la carpeta, que coincide con su `name` |
| [supabase/agent-skills](https://github.com/supabase/agent-skills) | `c9be0e9` (2026-10-02) | MIT | Ninguno |
| [obra/superpowers](https://github.com/obra/superpowers) | `8ca22db` (2026-09-25) | MIT | Ninguno |
| [openai/plugins](https://github.com/openai/plugins) (`android-emulator-qa`) | `5fd93af` (2026-09-28) | Apache-2.0 (`LICENSE.txt` en su carpeta) | Ninguno. Sus dos scripts solo leen el árbol de la interfaz (XML) |
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
| `eas-*`, `expo-skill-feedback`, `expo-module`, `expo-app-clip`, `expo-brownfield`, `expo-dom`, `expo-web-to-native` | De pago, para más adelante, con envío de datos a Expo, o no aplican |
| `react-native-best-practices` (Callstack) | Ocupa 6,4 MB y la cubre `vercel-react-native-skills` |
| `react-navigation` (Callstack) | Expo Router ya no depende de React Navigation |
| `agent-device`, `dogfood` (Callstack) | Otra herramienta de control de dispositivos: aquí se usa Orca |
| `android-performance`, `deploy-to-vercel`, `vercel-cli-with-tokens` | Sin licencia, o manejan claves de Vercel |
