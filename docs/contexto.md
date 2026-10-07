# Contexto del proyecto

El hilo del proyecto: **dónde estamos, qué viene y cómo se ha llegado hasta
aquí.** Sirve para situarse después de semanas sin entrar, desde cualquier
ordenador y con cualquier sesión nueva de Claude, sin depender de
conversaciones anteriores (su contexto se borra) ni de la memoria local de
Claude (vive en cada máquina y no viaja con el repositorio).

Es la **única fuente del estado actual**.

## Cómo se usa

**Para situarse:** leer *Ahora mismo* y *Lo siguiente*. Si hace falta saber por
qué algo es como es, buscarlo en la [bitácora](bitacora.md).

**Para mantenerlo**, quien cierre algo relevante (una sesión de planificación,
una tarea, una decisión, un cambio de rumbo, un problema que costó tiempo):

1. Añade una entrada al **principio** de la [bitácora](bitacora.md), con fecha. Las anteriores
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

*Actualizado: 2026-10-07, 16:00.*

- **Fase: ejecución, ola 3.** En `develop`: T01, T02, T03, T04, T07, T08, T12, T14, T15, la base común de vistas y el arreglo de migraciones. El despliegue a pruebas desde `develop` funciona. Jira al día.
- **Trabajando** (Run de Orca `run_fe8fef684013`, todos con Codex): T05, hábitos (`ctx_d2b28bea0feb`, encargo 016); T09, Hoy (`ctx_d749509ba726`, encargo 018); T10, categoría y Bandeja (`ctx_52d120b8400d`, encargo 019). Los tres se relanzaron tras los reinicios de la tarde, en sus mismas carpetas.
- **Escritos y sin lanzar:** 017 (T06, tareas) y 020 (T11, pendientes). Faltan T16 (añadir rápido) y T13 (caminos críticos).
- **Ahorro de tokens (DEC-39):** puestos fijos (dos de Codex, uno de Claude y uno de Copilot solo para lo pequeño), esfuerzo alto para el orquestador, sesión nueva por ola, encargos cortos y el modelo de Codex según el encargo. Ahora corren tres Codex, lanzados antes de la regla: el próximo hueco es para Claude o para Copilot.


## Lo siguiente

Para retomar en una sesión nueva (`/ejecutar-plan`, Opus 5.5 a esfuerzo alto), en este orden:

1. Con el supervisor en marcha, atender a T05, T09 y T10 (`orca orchestration check --run run_fe8fef684013`), revisar sus PR y fusionarlos (DEC-36). T09 se fusiona después de T05 porque enlaza con sus fichas de hábito y de tarea (y con las de T06).
2. Lanzar T06 y T11 (encargos 017 y 020) respetando los **puestos fijos** (dos Codex, un Claude y un Copilot solo para lo pequeño).
3. Escribir y lanzar T16 (añadir rápido) cuando estén T05 y T06, y después T13 (caminos críticos).
4. Encargar la mejora del supervisor (DEC-39, punto 7) a Codex.
5. Al cerrar la versión 1: proponer al humano publicar `develop` en `main` con la comprobación del orquestador (el humano crea su usuario de producción, DEC-37).


## Pendiente del humano

- Revisar el [buzón](buzon.md): lo que decidió el orquestador por su cuenta.
- Revisar T01 en el móvil con Expo Go (H05) y los avisos de `npm audit` (antes de publicar y el 2026-10-14).
- Cuando T15 esté en uso, el Chromium del sistema sobra (`sudo pacman -Rns chromium`, si no lo usa para otra cosa).
- El ticket `ADP-1` es de prueba y se puede borrar a mano.


## Cómo se trabaja aquí

- **Todo por rama y PR contra `develop`.** A `main` solo pasa el humano, con versiones estables y completas. Ver «Flujo de git» en `AGENTS.md`.
- **Las decisiones van a [decisiones](decisiones.md)**, nunca se quedan en el
  chat. Siguiente número libre: **DEC-40**.
- **Cada cambio actualiza su documentación, y este documento, en el mismo
  commit.**

## Trampas ya encontradas

*(Cosas que costaron tiempo y no deben costarlo dos veces.)*

- **Orca puede reiniciarse y cerrar a los trabajadores**: reabre sus sesiones en terminales nuevas pero marca sus tareas como fallidas. Se reenganchan con una tarea nueva en la misma terminal (`worker-start --spec ... --terminal <nueva>`) o con un trabajador nuevo en la misma carpeta; el trabajo sin commitear sigue ahí.
- **«Selected model is at capacity»** (Codex): el modelo está saturado, no es la cuota del humano. El turno se corta y el trabajador queda parado: hay que escribirle «continúa».
- **Un trabajador puede quedarse colgado esperando procesos en segundo plano** («Working» congelado y sin admitir mensajes): se para con `worker-stop` (no borra su carpeta) y se lanza otro en la misma carpeta.
- **El comprobador del modo automático de Claude Code puede caerse**: entonces solo funcionan las órdenes cubiertas por las reglas de `.claude/settings.local.json` (vigilancia y acciones de Orca).
- **Codex sin cuota**: el trabajador se para con «You've hit your usage limit… try again at HH:MM» y un menú que ofrece cambiar a un modelo más barato. Se contesta «2» (mantener el modelo: cambiarlo a mitad de encargo lo deja a medias; el modelo se elige al lanzar, DEC-39) y, a la hora indicada, se le escribe en su terminal que continúe. Tres Codex a la vez agotan su cuota en unas tres horas.
- **El Supabase local es compartido entre worktrees** (mismo `project_id`): se arranca una vez y lo usan todos. Una migración de una rama aún sin fusionar se aplica con `supabase migration up --include-all` y queda aplicada para todos, así que un test de otra rama puede fallar en local aunque pase en la CI (base limpia). Nadie hace `db reset`, `stop` ni `start` sin el orquestador.
- **Un trabajador de Claude con Haiku pide permiso para cada orden** (no tiene el modo automático): no usar Haiku para trabajadores.
- **Un trabajador puede commitear después de mandar `worker_done`**: antes de liberar su terminal, mirar `git status` en su worktree. Liberar un trabajador puede borrar su worktree.
- **`pgrep -f`/`pkill -f` con el nombre del supervisor coinciden con la propia orden y la matan** (salida 144): buscar el proceso con `ps -eo pid,args` y `awk`.
- **En zsh, `status` es una variable de solo lectura**; para esperar a la CI, `gh pr checks N --watch`.
- **Un servidor de Expo por trabajador necesita su puerto**: con la red del anfitrión, el 8081 solo puede usarlo uno. Los demás, otro (por ejemplo 8090).
- **Un trabajador de Claude puede quedarse con el encargo sin enviar** (`turn_start_unobserved`): hay que mirar su pantalla y darle un Enter (el supervisor también lo hace).
- **`worker-release` puede dejar `release_unknown`** ("no se pudo confirmar que el proceso se detuvo") aunque el trabajador haya terminado bien: no hay nada pendiente, el terminal está cerrado.
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
| Tokens de Vercel, Supabase y Expo (DEC-33) | `~/.config/app-desarrollo-personal/secretos.env` | Copiarlos o crear unos nuevos en cada servicio |
| Imágenes de Docker y `~/Android/Sdk` (`adb` y el emulador, para el panel de Orca) | El sistema | Reconstruir las imágenes con los Dockerfiles del repositorio (T01 y T15) e instalar esas dos herramientas (DEC-26) |
| Permisos de Claude Code del orquestador: fusionar en `develop` (`"Bash(gh pr merge *)"`) y las órdenes de vigilancia y de Orca que funcionan aunque se caiga el comprobador del modo automático (`permissions.allow`) | `.claude/settings.local.json` de la carpeta principal del proyecto. **A propósito no va en `.claude/settings.json`** (se sube a git y llegaría a los worktrees) **ni en `~/.claude/settings.json`** (vale para todas las sesiones de Claude del equipo): así los trabajadores no pueden fusionar | Añadirlo a mano en ese fichero, con el formato `Bash(...)` (sin él, Claude Code avisa al arrancar) |

---

## Bitácora

Está en [bitacora](bitacora.md), aparte, para que este documento sea corto: se carga en cada sesión de Claude (DEC-39).
