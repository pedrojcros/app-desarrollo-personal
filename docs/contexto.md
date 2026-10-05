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

*Actualizado: 2026-10-06.*

- **Fase: planificación, a punto de aprobar.** Escritas las sesiones 1 a 7: visión, casos de uso, funcionalidades (14 imprescindibles en la versión 1), riesgos, arquitectura (Next.js + Supabase + Vercel, ADR-0001 a 0004), defaults y plan (13 tareas en 6 olas). Todo está en la rama `docs/planificacion`.
- Estado del plan: `EN BORRADOR` (ver [05-plan](05-plan.md)). Falta el «ok» del humano a DEC-21 y la aprobación (sesión 8).

## Lo siguiente

1. El humano contesta DEC-21 (nueve propuestas: «ok» o cambios).
2. Sesión 8, revisión final: el humano lee el plan y lo aprueba con sus palabras; el arquitecto lo marca `APROBADO` y abre el PR de `docs/planificacion` a `develop`.
3. H01 (que `git push` funcione) y, cuando lo pida T12, H02 (cuentas de Vercel y Supabase). Después, `/ejecutar-plan`.

## Pendiente del humano

- Contestar DEC-21 y aprobar el plan.
- H01: que `git push` funcione desde las sesiones de los agentes (o «ok» al punto 7 de DEC-21 y lo hace el arquitecto).
- H02: crear las cuentas de Vercel y Supabase antes de la ola 4.
- **Arreglar Codex (P01)**: arranca, pero Orca no le entrega el encargo (falla en `agent_readiness`). Se puede hacer ya, sin esperar al plan. Copilot está sin probar. Cierra DEC-04.
- Limpiar lo que dejó la prueba de agentes del 2026-10-05: los worktrees `prueba-arranque-claude` y `prueba-arranque-codex` y la terminal de Codex que quedó viva (run de Orca `run_95865c545e0d`). Conviene mirarla antes, porque sirve para investigar P01.
- El ticket `ADP-1` es de prueba y se puede borrar a mano.

## Cómo se trabaja aquí

- **Todo por rama y PR contra `develop`.** A `main` solo pasa el humano, con versiones estables y completas. Ver «Flujo de git» en `AGENTS.md`.
- **Las decisiones van a [decisiones](decisiones.md)**, nunca se quedan en el
  chat. Siguiente número libre: **DEC-22**.
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

### 2026-10-06 — Tanda de las sesiones 3 a 7 del arquitecto

En modo tandas (DEC-14) se escribieron de golpe las funcionalidades (22, de
las que 14 forman la versión 1, DEC-19), los riesgos, la arquitectura con
cuatro ADR (stack Next.js + Supabase + Vercel elegido por el humano, DEC-16),
el recorrido de la lista de defaults (DEC-20), el diseño del orquestador
autónomo con el [buzón](buzon.md) y las puertas de aprobación, y el plan:
13 tareas en 6 olas más P01 y las tareas del humano. Nueve propuestas esperan
su «ok» en DEC-21. Se detectó que `git push` falla por SSH en las sesiones de
los agentes (H01).

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
