# Contexto del proyecto

El hilo del proyecto: **dónde estamos, qué viene y cómo se ha llegado hasta
aquí.** Sirve para situarse después de semanas sin entrar, desde cualquier
ordenador y con cualquier sesión nueva de Claude, sin depender de
conversaciones anteriores (su contexto se borra) ni de la memoria local de
Claude (vive en cada máquina y no viaja con el repositorio).

Es la **única fuente del estado actual**.

## Cómo se usa

**Para situarse:** leer *Ahora mismo* y *Lo siguiente*. Si hace falta saber por
qué algo es como es, buscarlo en la *Bitácora*.

**Para mantenerlo**, quien cierre algo relevante (una sesión de planificación,
una tarea, una decisión, un cambio de rumbo, un problema que costó tiempo):

1. Añade una entrada al **principio** de la bitácora, con fecha. Las anteriores
   no se borran ni se reescriben: son la traza.
2. Actualiza *Ahora mismo*, *Lo siguiente* y *Pendiente del humano* si han
   cambiado.
3. Lo hace en el mismo commit que el cambio que lo provoca.

Cada entrada dice **qué** pasó y **por qué**, y enlaza al PR, la decisión o el
documento donde está el detalle. No copia ese detalle: lo enlaza.

## Para Claude, al empezar una sesión

Claude Code carga este documento solo: `CLAUDE.md` lo importa. El resto de
agentes lo abre porque se lo pide `AGENTS.md`. Nadie tiene que pedírselo.

1. Lee `AGENTS.md` entero. Mandan sus prohibiciones y su regla de legibilidad.
2. Sitúa al humano: en qué punto estamos y qué toca ahora, según este documento
   hasta el final de *Pendiente del humano*.
3. Mira [decisiones](decisiones.md) por si hay respuestas nuevas.
4. **Tu papel lo decide el humano con un comando, no este documento.** Lo leen
   también los trabajadores, y ninguno debe creerse orquestador o arquitecto por
   leerlo. Ver `CLAUDE.md`.

---

## Ahora mismo

*Actualizado: 2026-10-05.*

- **Fase: planificación.** El proyecto está recién creado desde el kit. No hay
  código ni plan aprobado.
- Estado del plan: ver la cabecera de [05-plan](05-plan.md).

## Lo siguiente

1. Abrir `/arquitecto` y empezar por la sesión 1 de su agenda: visión y alcance.
2. Cerrar las decisiones que quedan abiertas en [decisiones](decisiones.md) (DEC-04 y DEC-07).
3. Cuando el plan esté aprobado: `/ejecutar-plan`.

## Pendiente del humano

- Cerrar DEC-04 (prueba de arranque real de `claude`, `codex` y `copilot` con Orca) y DEC-07 (fecha límite). DEC-01, 02, 03, 05 y 06 ya están cerradas.
- Añadir la columna/estado **«En revisión»** al tablero de `ADP` (comprobado el 2026-10-05: no existe). El conector de Jira ya está configurado y probado (ver [agentes/jira](agentes/jira.md)); el ticket `ADP-1` es de prueba y se puede borrar a mano.
- Configurar en GitHub la protección de `develop` y `main`, si el plan del repositorio lo permite.
- Comprobar en el equipo de trabajo: Orca, los agentes, y el MCP de Jira
  (ver [agentes/jira](agentes/jira.md)).

## Cómo se trabaja aquí

- **Todo por rama y PR contra `develop`.** A `main` solo pasa el humano, con versiones estables y completas. Ver «Flujo de git» en `AGENTS.md`.
- **Las decisiones van a [decisiones](decisiones.md)**, nunca se quedan en el
  chat. Siguiente número libre: **DEC-08**.
- **Cada cambio actualiza su documentación, y este documento, en el mismo
  commit.**

## Trampas ya encontradas

*(Cosas que costaron tiempo y no deben costarlo dos veces. Vacío por ahora.)*

## Lo que no viaja con el repositorio

| Qué | Dónde vive | En un ordenador nuevo |
|---|---|---|
| Memoria de Claude | `~/.claude/` de cada máquina | Nada: este documento la sustituye |
| Sesiones de los agentes y de `gh` | Configuración de cada máquina | Iniciar sesión otra vez |
| Configuración de Orca y del MCP de Jira | Cada máquina | Repetir [la comprobación](agentes/jira.md#comprobación-en-un-equipo-nuevo) |
| Herramientas (lenguajes, Docker, Orca) | El sistema | Instalar las versiones de `AGENTS.md` |

---

## Bitácora

Lo más reciente, arriba.

### 2026-10-05 — Revisión de la documentación del kit y primeras decisiones

Se revisó documento por documento el kit y se adaptó al proyecto. Se cerraron
DEC-01, 02, 03, 05 y 06 (ver [decisiones](decisiones.md)): PR contra `develop`,
el orquestador fusiona a `develop` y solo el humano publica en `main`; Jira
activo con proyecto `ADP`; tope de 3 trabajadores; nombres en inglés y
comentarios, commits y documentación en español. Se comprobó en este equipo que
Claude Code, Codex y Copilot CLI están instalados y que Orca los lanza con los
ids `claude`, `codex` y `copilot`. La estructura se aplanó: la plantilla pasó a
la raíz del repositorio. Quedan abiertas DEC-04 (probar los agentes) y DEC-07
(fecha límite).

### 2026-10-05 — Nace el proyecto

Creado a partir del kit de proyecto orquestado: documentación base, comandos
`/arquitecto`, `/orquestador` y `/ejecutar-plan`, y guía de Orca y Jira. Empieza
la planificación.
