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

## Trampas conocidas

- **En Windows, Smart App Control puede bloquear la CLI de Orca** tras una actualización. Síntoma: la CLI deja de responder o falla al arrancar. Se resolvió desactivándolo (decisión del humano).
- **Los agentes de pago o gratuitos tienen cuotas.** Una cuenta gratuita se queda sin límite pronto: ten un plan B por encargo.
- **El nombre con que Orca lanza cada agente hay que descubrirlo**, no adivinarlo. La ayuda de `orca orchestration worker-start --help` da ejemplos de ids (no la lista completa, y no sale en `orca agent-context`). La lista completa de la versión instalada está en [agentes-disponibles](agentes-disponibles.md); en Orca 1.4.217 Copilot es `copilot`.
- *(Añade aquí lo que cueste tiempo.)*
