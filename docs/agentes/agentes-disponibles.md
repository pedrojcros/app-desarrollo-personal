# Agentes disponibles

**Lo mantiene el humano**, sincronizado con Orca (Settings → Agents) en **cada equipo**. El CLI de Orca no puede leer esa configuración, así que la verdad está aquí. Si el orquestador intenta lanzar un agente deshabilitado, fallará (`agent_unconfigured`).

Actualizado: 2026-10-05 · Equipo: portátil de Pedro (Linux CachyOS), Orca 1.4.217

| Agente | Id en Orca (`--agent`) | Estado | Úsalo para | Límites y notas |
|---|---|---|---|---|
| Claude Code (trabajador) | `claude` | Instalado (2.1.289), sin probar | Encargos transversales, con razonamiento sobre el dominio, o que otro agente ya ha hecho mal | Modelo por defecto del equipo. Opus solo si el humano lo aprueba |
| Codex | `codex` | Instalado (0.160.0), sin probar | Encargos acotados y mecánicos; segunda opinión en revisiones | Cuenta gratuita = límite bajo |
| GitHub Copilot CLI | `copilot` | Instalado (1.0.91), sin probar | Encargos acotados con instrucciones muy claras: CRUD, DTO, componentes, tests a partir de casos dados | El id `copilot` está en la lista interna de agentes de Orca 1.4.217 (aunque la ayuda de `worker-start` no lo nombre). **Falta confirmarlo lanzando uno** en la prueba de arranque |
| opencode | `opencode` | No instalado | Lo que el humano decida | Usa el modelo de su propia configuración; no admite `--model` |

Ids de agente que Orca 1.4.217 trae en su código: `claude`, `openclaude`, `codex`, `copilot`, `cursor`, `gemini`, `antigravity`, `opencode`, `opencode2`, `mimo`, `openclaw`, `aider`, `grok`, `devin`, `zcode`. La ayuda de `worker-start` solo nombra algunos como ejemplo: no es la lista completa. Un agente solo se lanza si además está instalado y habilitado en Settings → Agents.

## Reglas de uso

- Estados posibles: **Habilitado**, **Deshabilitado**, **Solo revisión**.
- Un agente no listado aquí o en estado Deshabilitado **no se usa**, aunque Orca lo tenga.
- Si el plan reparte trabajo a un agente y se queda sin cuota, el orquestador reasigna el encargo al siguiente de la tabla en vez de reintentar.

## Prueba de arranque (una vez por agente y equipo)

Antes de repartir trabajo real, lanza con cada agente habilitado un encargo trivial («crea un fichero `prueba.txt` con la palabra `hola` y responde `hecho`»), comprueba que arranca, que tiene sesión y con qué nombre se lanza, y anota aquí el resultado.

| Agente | Probado el | Resultado |
|---|---|---|
| | | |
