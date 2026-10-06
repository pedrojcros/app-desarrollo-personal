# Skills a demanda

Ningún agente descubre estas skills por su cuenta. Se usan **solo cuando el encargo las pide por su ruta** (campo «Skills a usar» de la [plantilla de encargo](../../docs/agentes/plantilla-encargo.md)), o cuando el orquestador las usa él mismo para revisar. Así no se activan donde no toca ni gastan contexto en cada encargo.

Mismas reglas que las automáticas: mandan `AGENTS.md` y el encargo, y nunca se envía nada a terceros (ver [la ficha de las automáticas](../skills/README.md#reglas)).

## Cuándo pedir cada una

| Skill | Origen | Cuándo |
|---|---|---|
| `brainstorming` | obra/superpowers | **Solo desde `/idea`, con el humano delante**, para aclarar una idea vaga. Sin escribir specs, planes ni commits, y sin su «compañero visual» (no se copió) |
| `emil-design-eng` | emilkowalski/skills | Revisar y pulir la interacción y el movimiento de una pantalla. Pídela con una pregunta concreta: si se activa sin pregunta, solo saluda |
| `better-colors`, `better-typography`, `better-layout` | jakubkrehel/skills | Tarea «Sistema visual»: paleta y tokens de color, escala tipográfica y estructura |
| `better-writing` | jakubkrehel/skills | Textos de la interfaz: etiquetas, errores, estados vacíos, confirmaciones |
| `better-accessibility`, `interface-review` | jakubkrehel/skills | Revisar una pantalla o un PR de interfaz |
| `impeccable` | pbakaus/impeccable | Crítica y pulido de diseño. **Solo su guía escrita** (`SKILL.md` y `reference/`): no tiene sus scripts, así que se ignoran los pasos que llamen a `impeccable …` o a `scripts/` |
| `browser-testing-with-devtools` | addyosmani/agent-skills | Probar la versión web con el MCP de Chrome. Su sección de instalación no aplica: el MCP ya está configurado (ver `docs/agentes/orca.md`) |
| `performance-optimization` | addyosmani/agent-skills | Requisito de rendimiento (RNF-01) en la versión web |
| `ci-cd-and-automation` | addyosmani/agent-skills | Integración continua y despliegue |
| `shipping-and-launch` | addyosmani/agent-skills | Preparar la publicación de una versión |
| `expo-dev-client`, `expo-upgrade`, `expo-examples` | expo/skills | Builds de desarrollo, actualizar el SDK de Expo, ejemplos oficiales |
| `eas-app-stores` | expo/skills | Compilar el APK con EAS (T12 y H04). La parte de subir a Google Play, solo cuando el humano lo decida |
| `eas-update` | expo/skills | Actualizar la app instalada por internet, sin reinstalar el APK. Para la versión 1.1, si el humano lo aprueba |
| `vercel-cli`, `deployments-cicd`, `env-vars` | vercel/vercel-plugin | Desplegar la web en Vercel desde la integración continua, volver atrás y gestionar sus variables (T12), con la telemetría de `vercel` apagada (`VERCEL_TELEMETRY_DISABLED=1`) |
| `access-protected-vercel-deployment` | vercel/vercel-plugin | Probar las webs de prueba de los PR, que van protegidas (T13) |

## Origen, licencias y cambios

| Origen | Commit | Licencia | Cambios hechos en nuestra copia |
|---|---|---|---|
| [obra/superpowers](https://github.com/obra/superpowers) (`brainstorming`) | `8ca22db` (2026-09-25) | MIT | Solo su `SKILL.md`, sin el servidor de bocetos (`scripts/`, `visual-companion.md`) |
| [emilkowalski/skills](https://github.com/emilkowalski/skills) | `e8a175d` (2026-10-02) | MIT | Ninguno |
| [jakubkrehel/skills](https://github.com/jakubkrehel/skills) | `d574cc8` (2026-10-05) | MIT | Ninguno |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | `4e8504f` (2026-10-06) | Apache-2.0 | Solo `SKILL.md` y `reference/`; sin `scripts/` ni `agents/` |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | `1401c8b` (2026-10-03) | MIT | Ninguno |
| [expo/skills](https://github.com/expo/skills) | `d4f4840` (2026-10-05) | MIT | Quitada la sección final de envío de comentarios a Expo |
| [expo/skills](https://github.com/expo/skills) (`eas-app-stores` y `eas-update`, la versión que fija el plugin oficial) | `cd75214` (2026-09-22) | MIT | Quitada la sección «Submitting Feedback» (`npx submit-expo-feedback`) |
| [vercel/vercel-plugin](https://github.com/vercel/vercel-plugin) | `882e66c` (2026-09-21) | Apache-2.0 | Solo cuatro skills, sin los hooks del plugin (telemetría, perfil del proyecto y texto en las instrucciones); de `vercel-cli`, sin su copia `upstream/` |

Los textos de las licencias están en [`.agents/LICENSES/`](../LICENSES/).
