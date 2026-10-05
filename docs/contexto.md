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

- **Fase: planificación.** Visión, alcance y casos de uso de la versión 1 confirmados (app personal de tareas y hábitos con hecho/no hecho, categorías e historial). Falta el stack. No hay código ni plan aprobado. La planificación se guarda en la rama `docs/planificacion`.
- Estado del plan: ver la cabecera de [05-plan](05-plan.md).

## Lo siguiente

1. `/arquitecto` en modo tandas (DEC-14): sesiones 3 a 7 (funcionalidades, riesgos, arquitectura y stack, defaults y plan). El stack se decide **con el humano** (DEC-16). Las sesiones 1 (visión) y 2 (casos de uso) están hechas.
2. Cerrar las decisiones que quedan abiertas en [decisiones](decisiones.md) (DEC-04 y DEC-16).
3. Cuando el plan esté aprobado: `/ejecutar-plan`.

## Pendiente del humano

- Cerrar DEC-04 (que `codex` y `copilot` funcionen con Orca) y DEC-16 (stack y plataformas: contar al arquitecto qué lenguajes conoce y qué quiere).
- El conector de Jira ya está configurado y probado, y el tablero de `ADP` tiene los cuatro estados (ver [agentes/jira](agentes/jira.md)). El ticket `ADP-1` es de prueba y se puede borrar a mano.
- Configurar en GitHub la protección de `develop` y `main`, si el plan del repositorio lo permite.
- Comprobar en el equipo de trabajo: Orca, los agentes, y el MCP de Jira
  (ver [agentes/jira](agentes/jira.md)).

## Cómo se trabaja aquí

- **Todo por rama y PR contra `develop`.** A `main` solo pasa el humano, con versiones estables y completas. Ver «Flujo de git» en `AGENTS.md`.
- **Las decisiones van a [decisiones](decisiones.md)**, nunca se quedan en el
  chat. Siguiente número libre: **DEC-17**.
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

### 2026-10-06 — Sesión 2 del arquitecto: casos de uso

Se escribieron y revisaron siete casos de uso con una
[plantilla estándar](plantilla-caso-de-uso.md): crear hábitos (cuatro
frecuencias, franja u hora, duración), crear tareas, la vista Hoy, la
Bandeja de entrada, resolver lo pendiente, el historial, modificar o
archivar, y categorías (DEC-10, 11, 13 y 15). Se decidió no tener fecha
límite (DEC-07), un orquestador autónomo por niveles con puertas de
aprobación (DEC-12) y planificar en tandas (DEC-14). El stack queda para
la sesión 5 con el humano (DEC-16): Google Play cuesta 25 USD y exige una
prueba con 12 personas.

### 2026-10-05 — Sesión 1 del arquitecto: visión y alcance

Se definió qué se construye: una aplicación **personal** de tareas y hábitos
donde todo se marca como hecho o no hecho y queda un historial, porque Todoist
no lo permite. Versión 1: solo ordenador, tareas, hábitos recurrentes e
historial (DEC-08, DEC-09). Móvil y conexión con Google Calendar quedan
confirmados para la versión siguiente, juntos; estadísticas y recordatorios,
para después. Además se probaron los agentes con Orca: Claude funciona y ve
Jira, Codex falla en la fase de readiness, Copilot sin probar (ver
[agentes-disponibles](agentes/agentes-disponibles.md)).

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
