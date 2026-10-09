# Trampas ya encontradas

Cosas que costaron tiempo y no deben costarlo dos veces. Salieron de [contexto](../contexto.md) el 2026-10-09 (DEC-45): ese fichero se carga en cada sesión de Claude, también en la de cada trabajador, y este solo se lee cuando hace falta. En `contexto.md` quedan las cinco que más se repiten.

**Cuándo leerlo:** el orquestador, al empezar una sesión de ejecución y cuando algo se tuerce; un trabajador, solo si su encargo lo enlaza. Las trampas de Orca con su arreglo detallado están además en [orca](orca.md#trampas-conocidas).

**Cuándo escribir aquí:** cuando un problema cuesta tiempo, se anota primero en el registro de incidencias (`scripts/incidents/record_incident.py`) y, si se puede repetir, aquí, en su apartado. La retrospectiva de cada versión dice cuáles se repiten.

## Orca y los trabajadores

- **Un trabajador puede quedarse parado sin que nadie lo vea** (encargo sin enviar, un permiso): con trabajadores en marcha, siempre el supervisor en segundo plano. Ver [orca](orca.md#vigilar-a-los-trabajadores).
- **Un trabajador de Claude puede quedarse con el encargo sin enviar** (`turn_start_unobserved`): hay que mirar su pantalla y darle un Enter (el supervisor también lo hace).
- **A Copilot, y a veces a Claude, se les puede quedar el encargo aparcado**; **Codex y Copilot necesitan ajustes para trabajar solos** (sandbox, permisos, carpeta de confianza): todo, con su arreglo, en [orca](orca.md#trampas-conocidas).
- **Codex lanzado por Orca no recibía encargos**: sus animaciones impiden que Orca lo vea «listo». Arreglo: `tui.animations = false`. Ver [orca](orca.md#trampas-conocidas).
- **Orca puede reiniciarse y cerrar a los trabajadores**: reabre sus sesiones en terminales nuevas pero marca sus tareas como fallidas. Se reenganchan con una tarea nueva en la misma terminal (`worker-start --spec ... --terminal <nueva>`) o con un trabajador nuevo en la misma carpeta; el trabajo sin commitear sigue ahí.
- **Orca borra el worktree de un trabajador al liquidarlo o fusionar su PR** (pasó con T05 y T09): no cuentes con reutilizar su carpeta ni su terminal para una corrección; lánzala en un worktree nuevo desde `develop`.
- **Un trabajador puede commitear después de mandar `worker_done`**: antes de liberar su terminal, mirar `git status` en su worktree. Liberar un trabajador puede borrar su worktree.
- **`worker-release` puede dejar `release_unknown`** («no se pudo confirmar que el proceso se detuvo») aunque el trabajador haya terminado bien: no hay nada pendiente, el terminal está cerrado.
- **Un trabajador puede quedarse colgado esperando procesos en segundo plano** («Working» congelado y sin admitir mensajes): se para con `worker-stop` (no borra su carpeta) y se lanza otro en la misma carpeta.
- **Una pregunta de un trabajador (`ask`) solo llega si el orquestador está esperando con `check --wait`**: si se queda revisando un rato largo, el trabajador espera parado (T16 esperó 30 minutos). Entre revisión y revisión, vuelve a `check`.
- **`worker-start --base-branch develop` usa el `develop` local**, que no avanza al fusionar en GitHub: el trabajador arranca sin lo último (pasó con 028 y 029). Lanza con `--base-branch origin/develop` tras un `git fetch origin`.
- **Un encargo con rutas fuera del worktree del trabajador deja parados a Copilot y a Claude** pidiendo permiso; Codex no pregunta. Rutas relativas a su worktree. Ver [orca](orca.md#trampas-conocidas).
- **Un trabajador de Claude con Haiku pide permiso para cada orden** (no tiene el modo automático): no usar Haiku para trabajadores.
- **El comprobador del modo automático de Claude Code puede caerse**: entonces solo funcionan las órdenes cubiertas por las reglas de `.claude/settings.local.json` (vigilancia y acciones de Orca).

## Cuotas de los agentes

- **«Selected model is at capacity»** (Codex): el modelo está saturado, no es la cuota del humano. El turno se corta y el trabajador queda parado; el supervisor le escribe «continúa» solo (hasta tres veces) y avisa si no basta.
- **Codex sin cuota**: el trabajador se para con «You've hit your usage limit… try again at HH:MM» y un menú que ofrece cambiar a un modelo más barato. El supervisor contesta «2» (mantener el modelo: el modelo se elige al lanzar, DEC-39) y, a la hora indicada, le escribe «continúa». Tres Codex a la vez agotan su cuota en unas tres horas.
- **Codex escribe la hora de la cuota con fecha** («try again at Oct 8th, 2026 2:09 AM») **y con apóstrofo tipográfico** («You’ve»): el supervisor ya lo entiende (PR #39 y #41).

## Entorno de pruebas: Supabase, emulador y Docker

- **El Supabase local es compartido entre worktrees** (mismo `project_id`): se arranca una vez y lo usan todos. Una migración de una rama aún sin fusionar se aplica con `supabase migration up --include-all` y queda aplicada para todos, así que un test de otra rama puede fallar en local aunque pase en la CI (base limpia). Nadie hace `db reset`, `stop` ni `start` sin el orquestador.
- **Un servidor de Expo por trabajador necesita su puerto**: con la red del anfitrión, el 8081 solo puede usarlo uno. Los demás, otro (por ejemplo 8090).
- **Lo pesado va con el candado `/tmp/adp-pesado.lock`**, y un `jest` que no termina (operaciones asíncronas abiertas) lo retiene y para a todos. Los tests unitarios enfocados van sin candado; lo pesado, con `scripts/with-heavy-lock <orden>`, que espera el candado como mucho 30 minutos, corta la orden a los 45 y anota la incidencia si vence (ver el README).
- **El emulador se prepara con una orden**, `./docker/android/reset` (PR #71), que resuelve estas tres:
  - **Tras un apagado brusco, el emulador no arranca** («Running multiple emulators with the same AVD»): el AVD vive dentro del contenedor y conserva sus `.lock`.
  - **ADB pierde el emulador** a mitad de Maestro, sobre todo en la pasada a 360 dp.
  - Para que Maestro no pierda el dispositivo, todos los flujos van en una sola ejecución (`e2e/critical-paths.yaml`).
- **El emulador es uno solo para todos los worktrees** desde el PR #71: `compose.yaml` fija `name: app-desarrollo-personal`. Un worktree creado antes de ese cambio no tiene el nombre fijado y tiene que usar `docker compose -p app-desarrollo-personal ...`.
- **El emulador monta la carpeta `e2e/` del worktree que ejecutó `docker/android/reset`**: para probar los flujos de otro worktree, ejecuta `reset` desde ese worktree.
- **`.gitignore` ignora cualquier carpeta `android/`**, también `docker/android/`: un fichero nuevo ahí se añade con `git add -f` (los que ya están se siguen sin problema).
- **El servidor `adb` del puerto 5037 es el del contenedor del emulador** (usa la red del anfitrión), no de Orca: no pararlo.
- **La app del emulador apunta a `127.0.0.1`**, que dentro de Android no es el ordenador: para Maestro, Expo con `EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321`.
- **`expo-notifications` rompe la app en Expo Go** (SDK 53 o posterior): no se importa fuera de `src/platform/notifications.ts`, que lo carga solo en la app instalada (PR #59).
- **`docker run` con una imagen propia que no existe la busca en Docker Hub**, donde podría haber otra con el mismo nombre: siempre `--pull never`.
- **SDK de Android**: `sdkmanager` (cmdline-tools 23) escribe los paquetes con `/`, pero `avdmanager` todavía los pide con `;`.

## Sistema, git y terminal

- **El portátil se suspende si nadie lo toca**, y con él los trabajadores y el supervisor (pasó la noche del 7 al 8). Con `/ejecutar-plan` se activa siempre al empezar (DEC-42): `systemd-inhibit --what=sleep:idle:handle-lid-switch --who=orquestador --why="trabajo" sleep infinity` en segundo plano.
- **`git push` por SSH falla** en las sesiones de los agentes (no pueden pedir la frase de la clave). Resuelto: el remoto va por HTTPS con `gh` (H01).
- **`sudo` no funciona con `!` en Claude Code**: no hay terminal para pedir la contraseña. Los comandos con `sudo`, en una terminal normal de Orca.
- **`pgrep -f`/`pkill -f` con el nombre del supervisor coinciden con la propia orden y la matan** (salida 144): buscar el proceso con `ps -eo pid,args` y `awk`.
- **En zsh, `status` es una variable de solo lectura**; para esperar a la CI, `gh pr checks N --watch`.
