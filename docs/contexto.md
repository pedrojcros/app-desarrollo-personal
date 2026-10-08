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

*Actualizado: 2026-10-08, 14:45.*

- **Versión 1:** todo en `develop` salvo los flujos de Maestro (T13b, PR #50, a medias). Las pruebas de Maestro encontraron un **fallo real en Android al iniciar sesión** (el efecto de pulsar los botones con clases `scale` de NativeWind), ya arreglado (PR #53).
- **Versión 1.x en `develop`:** RF-09 y RF-10 («Marcadas hoy» y otros días), RF-13 y RF-14 (reprogramar y día entero como no hecho), RF-16 y RF-17 (filtrar y corregir el historial) y RF-22 (renombrar categoría).
- **Versión 1.1, recordatorios (DEC-43):** R1 a R4 en `develop` (avisos locales de tareas y hábitos, sección en Ajustes, puesta al día en el móvil, abrir desde el aviso). Falta R5 (pantalla de prueba y flujo de Maestro, PR o rama `pedrojcros/ADP-26-recordatorios-prueba`) y R6, la comprobación del humano en el móvil con el APK.
- **Reparto (DEC-41) y cafeína con `/ejecutar-plan` (DEC-42)** en vigor.


## Lo siguiente

Para retomar en una sesión nueva (`/ejecutar-plan`, Opus 5.5 a esfuerzo alto; activa la cafeína al empezar):

1. Arrancar el Supabase local si hace falta y aplicar migraciones (`supabase migration up --include-all`).
2. Retomar con **orden corta** T13b (PR #50, rama `pedrojcros/ADP-17-caminos-criticos`) y R5 (rama `pedrojcros/ADP-26-recordatorios-prueba`): su último commit «WIP:» dice lo que falta. Los dos necesitan el emulador: **de uno en uno** (primero T13b).
3. Con T13b fusionada, proponer al humano publicar la versión 1 (y, si quiere, la 1.1 entera, con R6 hecho en su móvil).
4. Deuda menor: el estilo de `src/components/quick-add/` (sin separación entre bloques; `useQuickAddDraft` devuelve 20 valores) y `reminderSettingsQueryKey` duplicada en `src/data/reminders.ts` (importarla de `reminder-settings.ts`).


## Pendiente del humano

- **Publicar la versión 1:** cuando T13b esté fusionada, pasar `develop` a `main` (lleva ya la 1.x y los recordatorios R1 a R4), o el commit `6e9182c` si solo quieres la versión 1. Antes: crear tu usuario de producción (DEC-37). La comprobación, en el [buzón](buzon.md).
- **Recordatorios (R6):** al instalar el APK de la 1.1, la lista de comprobación del informe de R5 (permiso, aviso en punto, tras reiniciar, ahorro de batería, tocar el aviso).
- Revisar el [buzón](buzon.md): lo que decidió el orquestador por su cuenta.
- Revisar T01 en el móvil con Expo Go (H05) y los avisos de `npm audit` (antes de publicar y el 2026-10-14).
- Cuando T15 esté en uso, el Chromium del sistema sobra (`sudo pacman -Rns chromium`, si no lo usa para otra cosa).
- El ticket `ADP-1` es de prueba y se puede borrar a mano.


## Cómo se trabaja aquí

- **Todo por rama y PR contra `develop`.** A `main` solo pasa el humano, con versiones estables y completas. Ver «Flujo de git» en `AGENTS.md`.
- **Las decisiones van a [decisiones](decisiones.md)**, nunca se quedan en el
  chat. Siguiente número libre: **DEC-44**.
- **Cada cambio actualiza su documentación, y este documento, en el mismo
  commit.**

## Trampas ya encontradas

*(Cosas que costaron tiempo y no deben costarlo dos veces.)*

- **Orca puede reiniciarse y cerrar a los trabajadores**: reabre sus sesiones en terminales nuevas pero marca sus tareas como fallidas. Se reenganchan con una tarea nueva en la misma terminal (`worker-start --spec ... --terminal <nueva>`) o con un trabajador nuevo en la misma carpeta; el trabajo sin commitear sigue ahí.
- **«Selected model is at capacity»** (Codex): el modelo está saturado, no es la cuota del humano. El turno se corta y el trabajador queda parado; desde el 2026-10-07 el supervisor le escribe «continúa» solo (hasta tres veces) y avisa si no basta.
- **Un trabajador puede quedarse colgado esperando procesos en segundo plano** («Working» congelado y sin admitir mensajes): se para con `worker-stop` (no borra su carpeta) y se lanza otro en la misma carpeta.
- **El comprobador del modo automático de Claude Code puede caerse**: entonces solo funcionan las órdenes cubiertas por las reglas de `.claude/settings.local.json` (vigilancia y acciones de Orca).
- **Codex sin cuota**: el trabajador se para con «You've hit your usage limit… try again at HH:MM» y un menú que ofrece cambiar a un modelo más barato. El supervisor contesta «2» (mantener el modelo: el modelo se elige al lanzar, DEC-39) y, a la hora indicada, le escribe «continúa». Tres Codex a la vez agotan su cuota en unas tres horas.
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
- **Orca borra el worktree de un trabajador al liquidarlo o fusionar su PR** (pasó con T05 y T09): no cuentes con reutilizar su carpeta ni su terminal para una corrección; lánzala en un worktree nuevo desde `develop`.
- **Una pregunta de un trabajador (`ask`) solo llega si el orquestador está esperando con `check --wait`**: si se queda revisando un rato largo, el trabajador espera parado (T16 esperó 30 minutos). Entre revisión y revisión, vuelve a `check`.
- **`worker-start --base-branch develop` usa el `develop` local**, que no avanza al fusionar en GitHub: el trabajador arranca sin lo último (pasó con 028 y 029). Antes de lanzar, `git fetch origin && git branch -f develop origin/develop` (o `--base-branch origin/develop`).
- **El portátil se suspende si nadie lo toca**, y con él los trabajadores y el supervisor (pasó la noche del 7 al 8). Con `/ejecutar-plan` se activa siempre al empezar (DEC-42): `systemd-inhibit --what=sleep:idle:handle-lid-switch --who=orquestador --why="trabajo" sleep infinity` en segundo plano.
- **Codex escribe la hora de la cuota con fecha** («try again at Oct 8th, 2026 2:09 AM») **y con apóstrofo tipográfico** («You’ve»): el supervisor ya lo entiende (PR #39 y #41).
- **Un `jest` que no termina** (operaciones asíncronas abiertas) **retiene el candado `adp-pesado.lock`** y para a todos: los tests unitarios enfocados van sin candado, y si alguien lo retiene mucho, mirar con `ps` y parar su contenedor.
- **La app del emulador apunta a `127.0.0.1`**, que dentro de Android no es el ordenador: para Maestro, Expo con `EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321`.
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
