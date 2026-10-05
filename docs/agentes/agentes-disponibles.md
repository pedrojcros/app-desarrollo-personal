# Agentes disponibles

**Lo mantiene el humano**, sincronizado con Orca (Settings → Agents) en **cada equipo**. El CLI de Orca no puede leer esa configuración, así que la verdad está aquí. Si el orquestador intenta lanzar un agente deshabilitado, fallará (`agent_unconfigured`).

Actualizado: 2026-10-05 · Equipo: portátil de Pedro (Linux CachyOS), Orca 1.4.217

| Agente | Id en Orca (`--agent`) | Estado | Úsalo para | Límites y notas |
|---|---|---|---|---|
| Claude Code (trabajador) | `claude` | **Probado 2026-10-05: funciona** | Encargos transversales, con razonamiento sobre el dominio, o que otro agente ya ha hecho mal | Trabajadores con Sonnet 5.5 (`--model claude-sonnet-5-5`). Opus 5.5 solo para el orquestador y las consultas de diseño (DEC-12) |
| Codex | `codex` | **Deshabilitado** hasta aplicar el ajuste de P01 (DEC-21, punto 10): con él, funciona (ver abajo) | Encargos acotados y mecánicos; segunda opinión en revisiones | Cuenta gratuita = límite bajo |
| GitHub Copilot CLI | `copilot` | **Deshabilitado** hasta aplicar los ajustes de P01 (DEC-21, punto 10): funciona, pero pide confirmaciones (ver abajo) | Encargos acotados con instrucciones muy claras: CRUD, DTO, componentes, tests a partir de casos dados | El id `copilot` está en la lista interna de agentes de Orca 1.4.217 (aunque la ayuda de `worker-start` no lo nombre). **Falta confirmarlo lanzando uno** en la prueba de arranque |
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
| `claude` | 2026-10-05 | Bien. Arrancó en un worktree `new-child` desde `develop`, recibió el encargo por `--spec`, creó el fichero, terminó con `worker_done` (`succeeded`) en menos de un minuto y **vio el conector de Jira** (listó `ADP` y `SCRUM`). Liberado con `worker-release` |
| `codex` | 2026-10-05 | **Falla en `agent_readiness`** (timeout de 60 s y, en un reintento con la terminal reutilizada, de 180 s). Codex 0.160.0 arranca y muestra su prompt, pero Orca no lo da por listo y **no le entrega el encargo**. Pendiente de investigar; no se repite a ciegas. Queda un worktree y una terminal viva de la prueba |
| `codex` | 2026-10-06 (P01) | **Causa encontrada y verificada.** Las animaciones de Codex repintan la terminal sin parar y Orca nunca ve los 3 segundos de calma que exige para darlo por listo (incidencia abierta [stablyai/orca#25007](https://github.com/stablyai/orca/issues/25007), también en Orca 1.4.220). Con `tui.animations=false`, listo al instante y el trabajador entrega `worker_done`. Segundo problema: el **sandbox** de Codex bloquea el CLI de Orca (habla por un socket en `~/.config/orca/`), así que Codex pide permiso para cada `orca orchestration ...` y, sin nadie que apruebe, se queda parado. Detalle sin consecuencias: en cada arranque aparece el texto `>|xterm.js(6.0.0)` en el cuadro de entrada; con las animaciones apagadas no bloquea |
| `copilot` | 2026-10-06 (P01) | **Arranca y recibe el encargo a la primera.** Dos obstáculos para trabajar sin supervisión: pregunta «¿confías en esta carpeta?» en cada worktree nuevo (`--yolo` no lo evita) y está en modo de aprobación manual (pide permiso para cada comando). Intenta conectar con el servidor MCP de Jira del proyecto aunque no lo usa (solo lo retrasa) |

Los nombres de rama los crea Orca con tu usuario por delante: `pedrojcros/<nombre>`.
