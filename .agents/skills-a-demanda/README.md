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

## Origen, licencias y cambios

| Origen | Commit | Licencia | Cambios hechos en nuestra copia |
|---|---|---|---|
| [obra/superpowers](https://github.com/obra/superpowers) (`brainstorming`) | `8ca22db` (2026-09-25) | MIT | Solo su `SKILL.md`, sin el servidor de bocetos (`scripts/`, `visual-companion.md`) |
| [emilkowalski/skills](https://github.com/emilkowalski/skills) | `e8a175d` (2026-10-02) | MIT | Ninguno |
| [jakubkrehel/skills](https://github.com/jakubkrehel/skills) | `d574cc8` (2026-10-05) | MIT | Ninguno |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | `4e8504f` (2026-10-06) | Apache-2.0 | Solo `SKILL.md` y `reference/`; sin `scripts/` ni `agents/` |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | `1401c8b` (2026-10-03) | MIT | Ninguno |
| [expo/skills](https://github.com/expo/skills) | `d4f4840` (2026-10-05) | MIT | Quitada la sección final de envío de comentarios a Expo |

Los textos de las licencias están en [`.agents/LICENSES/`](../LICENSES/).
