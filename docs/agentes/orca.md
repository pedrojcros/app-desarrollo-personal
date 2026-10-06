# Orca: guía rápida para el orquestador

Orca es el IDE desde el que se lanzan los agentes. Su CLI cambia a menudo. **La referencia es siempre la ayuda del propio CLI y la skill de orquestación; este documento solo recoge lo que ya se ha comprobado y las trampas conocidas.** Si algo de aquí falla, fíate de la ayuda y avisa al humano para que corrija este fichero.

*Comandos comprobados contra la CLI de Orca 1.4.215 (octubre de 2026). En el equipo de Pedro (Linux) la versión es 1.4.217: ahí se ha verificado con `--help` que `worker-start` acepta `--worktree new-child`, `--base-branch` y `--spec`. Si tu versión es otra, verifica con `--help`.*

## Antes de nada

```bash
orca status --json                  # ¿responde Orca? runtime "ready"
orca agent-context                  # esquema de todos los comandos, pensado para agentes
orca skills get orchestration       # guía VIGENTE de orquestación: léela entera al empezar
orca skills get orca-cli            # worktrees, terminales, navegador de Orca
```

- **El ejecutable puede llamarse `orca` o `orca.exe`** (en WSL suele ser `orca.exe`; no está en el PATH con el otro nombre). En el portátil Linux de Pedro es `orca`. Usa el mismo durante toda la sesión.
- **Los comandos de reparto cuelgan de `orca orchestration`**: `worker-start`, `check`, `reply`, `worker-release`, `task-create`, etc. En el resto del documento aparecen abreviados.
- Skills de Orca para instalar de una vez: `orca skills install` (o, a mano, `npx skills add https://github.com/stablyai/orca --skill orca-cli`).

## Vocabulario

| Término | Qué es |
|---|---|
| **Run** | Espacio de nombres duradero y bandeja de entrada del coordinador. No programa ni coloca trabajadores |
| **Task** | Un trabajo |
| **Dispatch** | Un intento autoritativo de una Task. La autoridad del ciclo de vida viene del Dispatch activo, no del título de una terminal ni de un ID copiado |
| **Worker** | Un agente supervisado, con su terminal y normalmente su worktree |
| **Gate** | Puerta de decisión que bloquea una tarea hasta que alguien la resuelve |

## Vigilar a los trabajadores

**Ningún trabajador se queda esperando.** Nada más lanzar trabajadores, deja corriendo en segundo plano, desde la raíz del repositorio:

```bash
python3 scripts/orca/supervise_workers.py --idle-minutes 8
```

Cada 20 segundos repasa la terminal de cada trabajador vivo: envía el Enter si el encargo se quedó escrito sin enviar (el campo `draft` de `orca terminal read`, dentro de `result.terminal`), concede a Copilot los permisos **de sesión** para rutas del proyecto o de su worktree, y **termina avisando** si alguien pide otra cosa (un permiso de Claude, una ruta de fuera) o lleva ocho minutos con la pantalla quieta. Termina también cuando no queda ningún trabajador vivo. Cada vez que termine, actúa y vuelve a lanzarlo. Lo pidió el humano el 2026-10-06, después de que un trabajador pasara diez minutos sin arrancar sin que nadie lo viera.

## Ciclo mínimo

```bash
orca status --json
orca orchestration run-create --objective "<objetivo>" --json

# Un trabajador con su tarea; --spec crea la Task y el intento a la vez
orca orchestration worker-start \
  --spec "<texto íntegro del encargo>" \
  --task-title "<título corto>" \
  --worktree new-child --name "<rama>" --base-branch develop \
  --agent claude --json

# Esperar a que acaben, pregunten o escalen (un timeout vacío es un punto de control, no un fallo)
orca orchestration check --wait --types "worker_done,escalation,question" --timeout-ms 900000 --json

# Procesar cada mensaje, responder a preguntas, y liberar al trabajador ya liquidado
orca orchestration reply --id <message_id> --body "<respuesta>" --json
orca orchestration worker-release --dispatch <dispatch_id> --json
orca orchestration check --ack <delivery_id> --wait --types "worker_done,escalation,question" --timeout-ms 900000 --json
```

Para trabajo planificado con dependencias: `task-create --spec ... --deps '<json_array>'`, después `task-list --ready --brief --json` para ver qué está listo, y `worker-start --task <task_id> ...`.

`--worktree` acepta `current`, un selector, `new-child` o `new-top-level`. Orca recomienda por defecto el worktree actual y crear uno nuevo solo si hay riesgo de pisarse; **este kit exige un worktree por encargo** porque trabajan varios agentes a la vez. `new-child` cuelga el worktree del actual en la jerarquía de Orca; con `--base-branch develop` la rama parte de `develop` y su PR va contra `develop`, así que no se apilan PR. `--agent` acepta el identificador de un agente habilitado (`claude`, `codex`, `opencode`...; ver [agentes-disponibles](agentes-disponibles.md)). `--model` y `--effort` solo se pasan si el humano nombró un modelo; si no, el trabajador hereda el configurado.

**Primera vez en un equipo nuevo:** ejecuta `orca orchestration worker-start --help` y `orca skills get orchestration --reference references/placement-and-remote.md` antes de crear worktrees, y anota aquí lo que difiera.

## Otros comandos útiles

| Comando | Para qué |
|---|---|
| `worker-list --run <id> --json` | Estado de todos los trabajadores. Mira `projection.attention` y `projection.nextAction` |
| `worker-show --dispatch <id>` | Inspeccionar un trabajador |
| `worker-read --dispatch <id> --source auto` | Leer su salida sin abrir su terminal |
| `worker-list --run <id> --terminal-state reclaimable` | Terminales liquidadas que aún esperan tu decisión |
| `worker-retain` / `worker-release` | Conservar o liberar una terminal ya liquidada |
| `gate-create` / `gate-resolve` / `gate-list` | Puertas de decisión: preguntas al humano que bloquean solo una tarea |
| `send` / `ask` / `inbox` | Mensajes entre agentes |
| `task-list --ready --brief` | Qué tareas están listas para lanzar |

## Reglas

- **Lanza siempre con `worker-start`.** Nunca abras un agente con `orca terminal create --command`: se salta la configuración y las comprobaciones de Orca.
- **Lanza los trabajadores de uno en uno** y comprueba que cada uno ha arrancado antes del siguiente. Los arranques simultáneos pueden fallar.
- **Un worktree por encargo.** Nunca dos trabajadores en el mismo.
- **Si `worker-start` sale con error, no lo repitas a ciegas.** Lee `failedStage` y `residualResources` del recibo y la referencia `recovery-and-cleanup`.
- **El trabajador termina con `worker_done`**: resumen de tres frases y `--outcome succeeded|failed`. El informe completo del encargo (los seis puntos) va en el PR o en `--report-path`; léelo de ahí.
- **Un `worker_done` válido liquida la Task solo.** No lo sigas de `task-update --status completed`.
- **Un `send` correcto solo prueba que el mensaje se encoló**, no que el destinatario lo haya leído.
- **Una terminal viva no prueba un agente vivo.** `worker-show` da la vida de la terminal; `worker-list` da la del agente. Sin prueba positiva de que ha muerto, no hagas `stop`, `abandon`, reintento ni `release`: sigue esperando o inspecciona.
- **No sustituyas la orquestación de Orca por subagentes propios** de Claude Code cuando el humano ha pedido repartir con Orca.

## Navegador para los agentes (MCP `chrome-devtools`)

Permite a los agentes abrir páginas, leer el DOM y la consola, medir rendimiento y hacer capturas de la **versión web**. Configurado así (DEC-23):

| Agente | Dónde está configurado |
|---|---|
| Claude y Copilot | `.mcp.json` del proyecto (versionado) |
| Codex | `~/.codex/config.toml` (configuración de este equipo) |

Comando: `npx -y chrome-devtools-mcp@1.10.1 --isolated --headless --executablePath /usr/bin/chromium --no-usage-statistics --no-performance-crux`.

- `--isolated`: perfil **temporal** que se borra al cerrar; nunca el navegador ni las sesiones del humano, y varios agentes a la vez no se pisan el perfil.
- `--headless`: sin ventana, para no llenar la pantalla con tres agentes en paralelo.
- `--no-usage-statistics` y `--no-performance-crux`: no se envían estadísticas de uso ni URLs a Google.
- Necesita **Chromium** instalado en `/usr/bin/chromium` (`sudo pacman -S chromium`). La versión del paquete está fijada: para actualizarla, se cambia aquí y en las dos configuraciones.

## Trampas conocidas

- **En Windows, Smart App Control puede bloquear la CLI de Orca** tras una actualización. Síntoma: la CLI deja de responder o falla al arrancar. Se resolvió desactivándolo (decisión del humano).
- **Los agentes de pago o gratuitos tienen cuotas.** Una cuenta gratuita se queda sin límite pronto: ten un plan B por encargo.
- **El nombre con que Orca lanza cada agente hay que descubrirlo**, no adivinarlo. La ayuda de `orca orchestration worker-start --help` da ejemplos de ids (no la lista completa, y no sale en `orca agent-context`). La lista completa de la versión instalada está en [agentes-disponibles](agentes-disponibles.md); en Orca 1.4.217 Copilot es `copilot`.
- **Codex no pasa `agent_readiness` (P01, 2026-10-06).** Sus animaciones impiden que la terminal quede en calma. Arreglo: `[tui] animations = false` en la configuración de Codex que usa Orca (aplicado el 2026-10-06 en `~/.codex/config.toml` y en `~/.config/orca/codex-runtime-home/home/config.toml`). Incidencia [stablyai/orca#25007](https://github.com/stablyai/orca/issues/25007).
- **El sandbox de Codex bloquea el CLI de Orca**, que habla por un socket en `~/.config/orca/`. Sin aprobación previa, cada `orca orchestration ...` del trabajador pide permiso y el trabajador se queda parado. Arreglo aplicado: argumento por defecto `--dangerously-bypass-approvals-and-sandbox`.
- **Copilot pregunta si confía en cada carpeta nueva** (cada worktree lo es) y pide permiso para cada comando. Arreglo aplicado: `~/orca/workspaces` en `trustedFolders` de `~/.copilot/config.json` (Orca intenta hacerlo solo, pero falla si ese fichero lleva comentarios: [#25142](https://github.com/stablyai/orca/pull/25142)) y argumentos `--allow-all-tools --disable-mcp-server atlassian` (los trabajadores no usan Jira).
- **Copilot, y a veces Claude: el encargo puede quedarse aparcado** (`[Paste #1 - N lines]` en su cuadro de entrada) aunque `worker-start` responda `input_accepted`: Orca lo pega antes de que Copilot esté listo y el Enter se pierde ([#17741](https://github.com/stablyai/orca/issues/17741)). **Qué hacer:** unos 20 segundos después de lanzar un Copilot, lee su pantalla (`orca terminal read --terminal <handle> --screen --json`); si ves `[Paste #`, envía un solo Enter (`orca terminal send --terminal <handle> --enter --json`). El encargo ya está entero en el cuadro, con sus identificadores, así que el trabajador puede terminar con `worker_done` normalmente. Con Claude se ve como `turn_start_unobserved` en la respuesta de `worker-start` y con el encargo entero en el campo `draft` de `orca terminal read`; se arregla igual, con un Enter (visto el 2026-10-06).
- **Encargos con rutas fuera del worktree del trabajador:** Codex no pregunta (va sin sandbox), pero Copilot y Claude piden permiso por cada ruta y se quedan esperando a alguien. Escribe en el encargo rutas relativas a su propio worktree y, si el resultado no se integra por PR (prototipos, informes), cópialo tú al terminar. Si aun así preguntan, elige siempre la opción que vale **solo para esa sesión**: nunca la que cambia la configuración del humano (visto el 2026-10-06).
- Los argumentos por defecto de cada agente están en Orca, Settings → Agents. Se guardan en `~/.config/orca/profiles/local-default/profile-state.db` (`orca-data.json` es antiguo). En este equipo: Codex `--dangerously-bypass-approvals-and-sandbox`, Copilot `--allow-all-tools --disable-mcp-server atlassian`, Claude vacío.
- *(Añade aquí lo que cueste tiempo.)*
