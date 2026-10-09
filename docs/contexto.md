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

*Actualizado: 2026-10-09, sesión de arquitecto (noche).*

- **La versión 1 está publicada** (2026-10-09, PR #67, etiqueta [`v1.0.0`](https://github.com/pedrojcros/app-desarrollo-personal/releases/tag/v1.0.0)), con la 1.x y los recordatorios (1.1, R1 a R5), que solo funcionan en la app instalada. Falta el APK y, con él, R6: la comprobación del humano en su móvil (lista en el buzón).
- **DEC-45 aplicada** (encargos A a D; el E, el orquestador por eventos, queda para diseñarlo con el arquitecto):
  - **registro de incidencias** que rellenan solos el supervisor y el candado (PR #70);
  - **medida** de tokens y tiempos por encargo y por sesión (PR #72);
  - **`docker/android/reset`** y el candado con tiempo máximo **`scripts/with-heavy-lock`** (PR #71); desde ese PR el emulador es uno solo para todos los worktrees;
  - [`orquestador.md`](agentes/orquestador.md) con sesiones cortas, revisor aparte, regla para dividir, Maestro solo al cerrar y un PR de documentación por sesión;
  - las trampas, en [agentes/trampas](agentes/trampas.md).
- **`ADP-27` hecho** (PR #73 y #74): el título «Hoy» ya no sale dos veces y sigue siendo un encabezado accesible; la fecha del añadir rápido sale con formato. El «doble engranaje» no era de la app: es la burbuja «Tools» de Expo Go, que solo existe en desarrollo.
- **El repositorio es público** desde el 2026-10-09 (DEC-44): se podrá volver a privado cuando el ritmo de cambios baje.
- **La versión 1.2, «Progreso», está planificada** (DEC-46): porcentaje, rachas y mapa de cada hábito, y un resumen por periodo en Historial, sin migraciones ni dependencias. Diseño y encargos 055 a 059 en [propuestas/progreso](propuestas/progreso.md). Google Calendar, con RF-04, pasa a la versión 2.


## Lo siguiente

Para retomar en una sesión nueva:

1. **Pulido visual (1.1.1) antes de la 1.2** (DEC-48): el encargo **060** (datos de demostración en la web de pruebas, DEC-49) puede ir ya; el humano revisa allí la app y cuenta lo que no le gusta; el arquitecto lo apunta y clasifica en [propuestas/pulido-visual](propuestas/pulido-visual.md) y escribe los encargos.
2. **Después, ejecutar la 1.2 con `/ejecutar-plan`** cuando el humano lo diga. Lo primero, la épica y todas sus tarjetas en «Por hacer» (DEC-47). Olas 055 a 057, 058 y 059 ([propuesta](propuestas/progreso.md#3-encargos-para-la-ejecución)). Al cerrar, Maestro una sola vez y la primera retrospectiva (DEC-45).
3. **Después de esa retrospectiva, con el arquitecto:** el diseño del orquestador por eventos (DEC-45, encargo E) y la versión 2 (Google Calendar).


## Pendiente del humano

- **APK de la versión 1:** `eas build --profile preview` cuando quieras instalarla en el móvil (gasta una de las 15 compilaciones gratis del mes). Conviene antes de ejecutar la 1.2: Progreso tiene sentido con unos días de uso real.
- **Recordatorios (R6):** al instalar el APK de la 1.1, la lista de comprobación del informe de R5 (permiso, aviso en punto, tras reiniciar, ahorro de batería, tocar el aviso).
- Revisar el [buzón](buzon.md): lo que decidió el orquestador por su cuenta.
- Revisar T01 en el móvil con Expo Go (H05) y los avisos de `npm audit` (antes de publicar y el 2026-10-14).
- Cuando T15 esté en uso, el Chromium del sistema sobra (`sudo pacman -Rns chromium`, si no lo usa para otra cosa).
- El ticket `ADP-1` es de prueba y se puede borrar a mano.


## Cómo se trabaja aquí

- **Todo por rama y PR contra `develop`.** A `main` solo pasa el humano, con versiones estables y completas. Ver «Flujo de git» en `AGENTS.md`.
- **Las decisiones van a [decisiones](decisiones.md)**, nunca se quedan en el
  chat. Siguiente número libre: **DEC-50**.
- **Cada cambio actualiza su documentación, y este documento, en el mismo
  commit.**

## Trampas ya encontradas

Las cinco que más se repiten. **Todas, con su arreglo, en [agentes/trampas](agentes/trampas.md)** (DEC-45): léelo al empezar una sesión de ejecución y cuando algo se tuerza. Lo que cueste tiempo se anota en el registro de incidencias (`scripts/incidents/record_incident.py`).

- **Un trabajador puede quedarse parado sin que nadie lo vea** (encargo sin enviar, un permiso, cuota): con trabajadores en marcha, siempre el supervisor (`scripts/orca/supervise_workers.py`) en segundo plano.
- **Lanza los trabajadores desde `origin/develop`** (`--base-branch origin/develop` tras `git fetch`): el `develop` local no avanza al fusionar en GitHub.
- **Orca puede reiniciarse y borra el worktree** de un trabajador al liberarlo o al fusionar su PR: antes de liberar, `git status` en su worktree; una corrección va en un worktree nuevo.
- **El Supabase local y el emulador son compartidos**: nadie hace `db reset`, `stop` ni `start` de Supabase sin el orquestador; el emulador, por turnos, con `docker/android/reset` antes de Maestro y lo pesado con `scripts/with-heavy-lock`.
- **El portátil se suspende si nadie lo toca**: con `/ejecutar-plan`, modo cafeína al empezar (DEC-42).

## Lo que no viaja con el repositorio

| Qué | Dónde vive | En un ordenador nuevo |
|---|---|---|
| Memoria de Claude | `~/.claude/` de cada máquina | Nada: este documento la sustituye |
| Sesiones de los agentes y de `gh` | Configuración de cada máquina | Iniciar sesión otra vez |
| Configuración de Orca y del MCP de Jira | Cada máquina | Repetir [la comprobación](agentes/jira.md#comprobación-en-un-equipo-nuevo) |
| Herramientas (lenguajes, Docker, Orca) | El sistema | Instalar las versiones de `AGENTS.md` |
| Tokens de Vercel, Supabase y Expo (DEC-33) | `~/.config/app-desarrollo-personal/secretos.env` | Copiarlos o crear unos nuevos en cada servicio |
| Registro de incidencias (DEC-45) | `logs/incidents.jsonl` en la carpeta principal del repositorio (no se sube a git) | Empieza vacío; lo que importa de cada versión queda en `docs/retrospectivas/` |
| Imágenes de Docker y `~/Android/Sdk` (`adb` y el emulador, para el panel de Orca) | El sistema | Reconstruir las imágenes con los Dockerfiles del repositorio (T01 y T15) e instalar esas dos herramientas (DEC-26) |
| Permisos de Claude Code del orquestador: fusionar en `develop` (`"Bash(gh pr merge *)"`) y las órdenes de vigilancia y de Orca que funcionan aunque se caiga el comprobador del modo automático (`permissions.allow`) | `.claude/settings.local.json` de la carpeta principal del proyecto. **A propósito no va en `.claude/settings.json`** (se sube a git y llegaría a los worktrees) **ni en `~/.claude/settings.json`** (vale para todas las sesiones de Claude del equipo): así los trabajadores no pueden fusionar | Añadirlo a mano en ese fichero, con el formato `Bash(...)` (sin él, Claude Code avisa al arrancar) |

---

## Bitácora

Está en [bitacora](bitacora.md), aparte, para que este documento sea corto: se carga en cada sesión de Claude (DEC-39).
