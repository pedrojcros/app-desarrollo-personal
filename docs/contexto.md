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

- **Fase: ejecución, a punto de empezar.** El plan está **aprobado** (2026-10-06): 13 tareas en 6 olas para la versión 1, con Next.js, Supabase y Vercel (ADR-0001 a 0004). La planificación entra en `develop` con un PR.
- Estado del plan: `APROBADO` (ver [05-plan](05-plan.md)).
- Agentes: Claude, Codex y Copilot habilitados y probados con Orca (DEC-04).

## Lo siguiente

1. Abrir una sesión **nueva** de Claude Code en el proyecto, con Opus 5.5 y el esfuerzo más alto, y lanzar `/ejecutar-plan`. Empieza por la ola 0: T01, el esqueleto.
2. Antes de la ola 4 (T12), H02: el humano crea las cuentas de Vercel y Supabase con la guía del orquestador.

## Pendiente del humano

- Lanzar `/ejecutar-plan` cuando quiera.
- Revisar T01 y T02 cuando el orquestador lo pida (puertas `requiere-revisión`).
- H02: crear las cuentas de Vercel y Supabase antes de la ola 4.
- El ticket `ADP-1` es de prueba y se puede borrar a mano.

## Cómo se trabaja aquí

- **Todo por rama y PR contra `develop`.** A `main` solo pasa el humano, con versiones estables y completas. Ver «Flujo de git» en `AGENTS.md`.
- **Las decisiones van a [decisiones](decisiones.md)**, nunca se quedan en el
  chat. Siguiente número libre: **DEC-24**.
- **Cada cambio actualiza su documentación, y este documento, en el mismo
  commit.**

## Trampas ya encontradas

*(Cosas que costaron tiempo y no deben costarlo dos veces.)*

- **Codex lanzado por Orca no recibía encargos**: sus animaciones impiden que Orca lo vea «listo». Arreglo: `tui.animations = false`. Ver [agentes/orca](agentes/orca.md#trampas-conocidas).
- **Codex y Copilot necesitan ajustes para trabajar solos** (sandbox, permisos, carpeta de confianza), y **a Copilot se le puede quedar el encargo aparcado**: todo, con su arreglo, en [agentes/orca](agentes/orca.md#trampas-conocidas).
- **`git push` por SSH falla** en las sesiones de los agentes (no pueden pedir la frase de la clave). Resuelto: el remoto va por HTTPS con `gh` (H01).

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

### 2026-10-06 — Skills móviles, navegador y herramientas (DEC-23)

Tras elegir la opción B (app con Expo, ver la replanificación), se revisaron
unas cuarenta skills propuestas por el humano y se quedaron 22 automáticas y
16 a demanda; el resto, fuera con su motivo (ver [la ficha](../.agents/skills/README.md)).
Se escribieron dos skills propias (`flujo-git` y `codigo-legible`). A las de
Expo se les quitó la sección que enviaba comentarios a Expo, y se prohibió en
`AGENTS.md` enviar nada a terceros. `/idea` ahora puede aclarar una idea con el
humano antes de apuntarla. Se configuró el MCP de Chrome, aislado y sin enviar
datos a Google.

### 2026-10-06 — Skills del proyecto y modelos según el tamaño (DEC-22)

Se añaden las primeras skills, 12 de `addyosmani/agent-skills` (MIT),
revisadas y elegidas porque encajan con el proyecto; otras 13 quedan fuera
con su motivo (ver [la ficha](../.agents/skills/README.md)). Viven en
`.agents/skills/`, donde las leen Codex y Copilot, y Claude por un enlace.
Opus decide y elige skills; los trabajadores programan con el modelo
adecuado a su tamaño. Los comandos de papel ya no los puede activar un agente
por su cuenta.

### 2026-10-06 — Plan aprobado (sesión 8)

El humano aprobó el plan con las palabras «apruebo el plan». Termina la
planificación: visión, casos de uso, funcionalidades, riesgos, arquitectura,
defaults y plan quedan en `docs/`, y la rama `docs/planificacion` se fusiona en
`develop` con un PR. Lo siguiente es `/ejecutar-plan` en una sesión nueva.

### 2026-10-06 — Agentes listos: DEC-21 aceptada y P01 cerrada

El humano aceptó las diez propuestas de DEC-21. Se aplicaron los ajustes de
Codex (sin animaciones, sin sandbox) y de Copilot (carpeta de confianza, sin
permisos por comando, sin el MCP de Jira) y se repitió la prueba: Codex
funciona solo; a Copilot hay que darle un Enter si el encargo se le queda
aparcado (fallo conocido de Orca), y el orquestador ya sabe hacerlo (ver
[agentes/orca](agentes/orca.md#trampas-conocidas)). `git push` funciona por
HTTPS con `gh`. Se borraron los worktrees de prueba. Queda aprobar el plan.

### 2026-10-06 — P01: por qué Codex no recibía encargos (de noche, con permiso del humano)

Codex sí arrancaba, pero sus animaciones repintan la terminal sin parar y
Orca nunca le daba por listo (incidencia conocida de Orca, #25007). Se
comprobó en este equipo: con las animaciones apagadas, listo al instante y
el trabajador termina. Además, el sandbox de Codex le obliga a pedir permiso
para hablar con Orca. Copilot funciona a la primera, pero pregunta por la
confianza de cada carpeta y pide permiso por comando. Las dos pruebas
terminaron con éxito aprobando a mano solo comandos de Orca. No se cambió
ninguna configuración: los ajustes esperan el «ok» del humano (DEC-21,
punto 10). Detalle en [agentes-disponibles](agentes/agentes-disponibles.md).

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
