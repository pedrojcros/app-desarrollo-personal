# CLAUDE.md

@AGENTS.md

@docs/contexto.md

Las reglas de este proyecto están en `AGENTS.md` y son comunes a todos los agentes. No se duplican aquí.

`docs/contexto.md` se carga en cada sesión para que Claude sepa, sin que nadie se lo pida, dónde está el proyecto, qué viene y qué está pendiente. Al empezar, sitúa al humano con lo que dice: en qué punto estamos y qué toca ahora.

## Roles: los decide un comando, no este fichero

Este fichero lo lee cualquier Claude Code que trabaje en el repositorio, incluidos los que trabajan como trabajadores. Por eso los papeles especiales **no están descritos aquí**: solo existen cuando el humano los invoca expresamente.

| Comando | Papel | Lee |
|---|---|---|
| `/arquitecto` | Arquitecto de software senior: planifica con el humano durante días, no escribe código | `docs/agentes/arquitecto.md` |
| `/orquestador` | Divide el trabajo y lo reparte a otros agentes con Orca | `docs/agentes/orquestador.md` |
| `/ejecutar-plan` | Orquestador con el mandato de ejecutar el plan aprobado de principio a fin | `docs/agentes/orquestador.md` |
| *(ninguno)* | Trabajador o ayudante normal: haces lo que te piden, siguiendo `AGENTS.md` | — |

Si no has invocado ninguno de esos comandos, **no eres orquestador ni arquitecto**, aunque hayas leído este fichero.
