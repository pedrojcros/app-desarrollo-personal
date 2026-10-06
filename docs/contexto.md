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

- **Fase: replanificación para el móvil.** El plan vuelve a `EN BORRADOR` (DEC-24): una app con Expo para Android y la web, 16 tareas en 6 olas y P02 (el estilo, con prototipos y con el humano). Está en la rama `docs/replanificacion-expo`, con su PR contra `develop` en borrador hasta que se apruebe el plan. El #3 (skills móviles, DEC-23) ya está fusionado.
- Estado del plan: `EN BORRADOR` (ver [05-plan](05-plan.md)). Le falta la aprobación del humano; P02, en marcha, solo bloquea T14.
- Agentes: Claude, Codex y Copilot habilitados y probados con Orca (DEC-04).


## Lo siguiente

1. P02, en marcha en la rama `docs/estilo-p02`: el humano trae ideas y se itera con prototipos hasta elegir uno.
2. El humano aprueba el plan, se fusiona el PR de la replanificación y lanza `/ejecutar-plan` en una sesión nueva. Puede empezar antes de cerrar P02: solo T14 la espera.


## Pendiente del humano

- P02: buscar ejemplos visuales de estilos que le gusten.
- Aprobar el plan replanificado.
- H05: instalar Expo Go en el móvil.
- H02: crear las cuentas de Vercel, Supabase y Expo antes de la ola 4.
- Cuando T15 esté fusionada, el Chromium del sistema sobra (`sudo pacman -Rns chromium`, si no lo usa para otra cosa).
- El ticket `ADP-1` es de prueba y se puede borrar a mano.


## Cómo se trabaja aquí

- **Todo por rama y PR contra `develop`.** A `main` solo pasa el humano, con versiones estables y completas. Ver «Flujo de git» en `AGENTS.md`.
- **Las decisiones van a [decisiones](decisiones.md)**, nunca se quedan en el
  chat. Siguiente número libre: **DEC-32**.
- **Cada cambio actualiza su documentación, y este documento, en el mismo
  commit.**

## Trampas ya encontradas

*(Cosas que costaron tiempo y no deben costarlo dos veces.)*

- **Codex lanzado por Orca no recibía encargos**: sus animaciones impiden que Orca lo vea «listo». Arreglo: `tui.animations = false`. Ver [agentes/orca](agentes/orca.md#trampas-conocidas).
- **Codex y Copilot necesitan ajustes para trabajar solos** (sandbox, permisos, carpeta de confianza), y **a Copilot, y a veces a Claude, se les puede quedar el encargo aparcado**: todo, con su arreglo, en [agentes/orca](agentes/orca.md#trampas-conocidas).
- **Un trabajador puede quedarse parado sin que nadie lo vea** (encargo sin enviar, un permiso): con trabajadores en marcha, siempre el supervisor en segundo plano. Ver [agentes/orca](agentes/orca.md#vigilar-a-los-trabajadores).
- **Un encargo con rutas fuera del worktree del trabajador deja parados a Copilot y a Claude** pidiendo permiso; Codex no pregunta. Rutas relativas a su worktree. Ver [agentes/orca](agentes/orca.md#trampas-conocidas).
- **`git push` por SSH falla** en las sesiones de los agentes (no pueden pedir la frase de la clave). Resuelto: el remoto va por HTTPS con `gh` (H01).
- **`sudo` no funciona con `!` en Claude Code**: no hay terminal para pedir la contraseña. Los comandos con `sudo`, en una terminal normal de Orca.
- **SDK de Android**: `sdkmanager` (cmdline-tools 23) escribe los paquetes con `/`, pero `avdmanager` todavía los pide con `;`.
- **`docker run` con una imagen propia que no existe la busca en Docker Hub**, donde podría haber otra con el mismo nombre: siempre `--pull never`.

## Lo que no viaja con el repositorio

| Qué | Dónde vive | En un ordenador nuevo |
|---|---|---|
| Memoria de Claude | `~/.claude/` de cada máquina | Nada: este documento la sustituye |
| Sesiones de los agentes y de `gh` | Configuración de cada máquina | Iniciar sesión otra vez |
| Configuración de Orca y del MCP de Jira | Cada máquina | Repetir [la comprobación](agentes/jira.md#comprobación-en-un-equipo-nuevo) |
| Herramientas (lenguajes, Docker, Orca) | El sistema | Instalar las versiones de `AGENTS.md` |
| Imágenes de Docker y `~/Android/Sdk` (`adb` y el emulador, para el panel de Orca) | El sistema | Reconstruir las imágenes con los Dockerfiles del repositorio (T01 y T15) e instalar esas dos herramientas (DEC-26) |

---

## Bitácora

Lo más reciente, arriba.

### 2026-10-06 — Categoría > sección (DEC-31)

Viendo la ronda 3 de estilo, el humano propuso invertir los nombres: la
categoría es el contenedor («Lista de la compra») y la sección, una parte
(«Mercadona»), como en Todoist. Las tareas van en la categoría o en una
sección, y las categorías ganan icono y color (el color por categoría ya se
usaba en el diseño, pero no estaba en el modelo de datos).

### 2026-10-06 — Secciones (DEC-29) y crear deprisa (DEC-30)

En la ronda 2 de estilo, el humano pidió carpetas para las categorías
(«Lista de la compra» > Mercadona) y crear sin cambiar de pantalla: una barra
rápida sobre el teclado que toma la categoría y la fecha de donde estás. Las
secciones entran en la versión 1 (T04 crece) y la barra es una tarea nueva,
T16, después de T05 y T06. Tercer estilo elegido: el neobrutalismo pulido.

### 2026-10-06 — Supervisor de trabajadores

En la ronda 2 de estilo, el trabajador E (Claude) pasó unos diez minutos con
el encargo escrito sin enviar, y Copilot, parado en un permiso, mientras el
arquitecto creía que trabajaban. El humano pidió que no vuelva a pasar, porque
quiere poder dejar horas trabajando a los agentes. Se añade
`scripts/orca/supervise_workers.py`, que se deja corriendo siempre que haya
trabajadores, y la regla en el método del orquestador.

### 2026-10-06 — Tope solo en código (DEC-28)

El humano pidió lanzar a la vez lo que no depende de nada: el tope de tres
trabajadores queda solo para el código, que hay que integrar. En la ronda 2 de
estilo, el arquitecto volvió a saltarse el turno de Claude: se paró E en Codex
y se relanzó con Claude, y DEC-27 aclara que un turno saltado se devuelve.

### 2026-10-06 — Ciclo de cuotas de los agentes (DEC-27, revisada) y ronda 1 de estilo

Los siete subagentes de Claude de la ronda 1 se cortaron al agotarse la
sesión del humano; dejaron cuatro prototipos y la hoja de paletas, y Codex
hizo los otros dos. Al humano le gustaron más los de Codex, «más pulidos y
profesionales». DEC-27 pasa a ser un ciclo: dos de Codex, uno de Claude y uno
de Copilot, con excepción para tareas que necesiten un modelo concreto.

### 2026-10-06 — Primero Codex (DEC-27)

Para no agotar su cuota de Claude, el humano pidió lanzar siempre primero
agentes de Codex y, como mucho, uno de Claude por cada tres de Codex. Queda
escrito en el orquestador, el arquitecto y el plan (las tareas pasan a
`codex`). La primera ronda de prototipos de P02, con siete subagentes de
Claude, ya estaba lanzada y se dejó terminar.

### 2026-10-06 — DEC-26 cerrada: Docker, con el panel de Orca (opción B)

De vuelta del gimnasio, el humano eligió la opción B: todo lo del proyecto en
Docker y, en el ordenador, solo `adb` y el programa del emulador, para que Orca
lo enseñe en su panel. Empieza P02, el bucle de estilo: el humano trae ideas,
subagentes con Sonnet generan los prototipos y el arquitecto los revisa (rama
`docs/estilo-p02`).

### 2026-10-06 — Replanificación para el móvil (DEC-24 y DEC-25) y Docker (DEC-26, abierta)

Con la opción B (DEC-24), el arquitecto rehízo la arquitectura
([ADR-0005](adr/0005-stack-expo.md)), los requisitos, los riesgos y el
[plan](05-plan.md), que vuelve a `EN BORRADOR`: 15 tareas, con dos nuevas
(T14, el sistema visual, y T15, el emulador y el navegador en Docker), y P02,
el bucle de estilo con el humano. Antes de irse al gimnasio, el humano aprobó
dos dependencias y decidió que la versión 1 necesita internet y que el estilo
se busca con prototipos antes de programarlo (DEC-25). Después pidió Docker
«en el 100 % de lo que se pueda» (DEC-26): se paró la instalación local del
SDK de Android y se probó el emulador dentro de Docker. Funciona, y Orca lo ve
si en el ordenador quedan `adb` y el programa del emulador (lo único que queda
de la instalación local: 884 MB en `~/Android`).

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
