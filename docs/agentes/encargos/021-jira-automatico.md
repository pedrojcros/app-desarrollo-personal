# Encargo 021 — Jira al día sin esfuerzo: script y flujo de GitHub

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Ticket | ninguno (herramienta del orquestador; DEC-40) |
| Agente | copilot (encargo pequeño y mecánico, DEC-39) |
| Skills | `codigo-legible`, `flujo-git` (en `.agents/skills/`) |
| Rama | `chore/jira-automatico`, desde `develop` |
| Reservado | `scripts/jira/` y `.github/workflows/jira.yml` (ficheros nuevos). Nada más |

## Antes de empezar

Lee de `AGENTS.md` solo las secciones «Prohibiciones», «Legibilidad: regla obligatoria» y «Flujo de git». Nada de secretos en el repositorio ni en registros.

## Objetivo

Que el tablero de Jira del proyecto `ADP` se mueva solo con lo que pasa en GitHub, y que el orquestador pueda moverlo con una orden corta.

## Datos fijos

- API: `https://api.atlassian.com/ex/jira/<JIRA_CLOUD_ID>/rest/api/3/...` (el token es de los que tienen permisos limitados; **la dirección `*.atlassian.net` no funciona con él**). Autenticación básica con `JIRA_EMAIL` y `JIRA_API_TOKEN`.
- Transiciones (`POST /issue/{clave}/transitions` con `{"transition": {"id": "..."}}`): **Por hacer = `11`**, **En curso = `21`**, **En revisión = `2`**, **Listo = `31`**.
- Etiquetas de agente: `codex`, `claude`, `copilot` (una sola a la vez).
- Las claves de ticket tienen la forma `ADP-123` y van en el nombre de la rama y en el título del PR.

## Qué hacer

1. **`scripts/jira/jira.py`**: Python 3, **solo la biblioteca estándar** (sin dependencias). Órdenes:
   - `python3 scripts/jira/jira.py move ADP-12 en-curso|en-revision|listo|por-hacer`
   - `python3 scripts/jira/jira.py agent ADP-12 codex|claude|copilot`: pone esa etiqueta y quita las otras dos de agente (sin tocar el resto de etiquetas).
   - `python3 scripts/jira/jira.py comment ADP-12 "texto"`
   - `python3 scripts/jira/jira.py status ADP-12`: imprime el estado actual.
   Lee `JIRA_EMAIL`, `JIRA_API_TOKEN` y `JIRA_CLOUD_ID` del entorno y, si faltan, de `~/.config/app-desarrollo-personal/secretos.env` (líneas `CLAVE=valor`; si allí no está el email, usa `pedrojcros@gmail.com`; si no está el cloud id, `490863fe-a6c1-4134-913e-c2470cb7c508`). Imprime **una sola línea corta** por orden (por ejemplo `ADP-12 → En curso`). **Nunca imprime el token** ni las cabeceras. Errores HTTP con un mensaje claro y código de salida distinto de 0. Mover a la columna en la que ya está no es un error.
2. **`.github/workflows/jira.yml`** (permisos mínimos: `contents: read`; los secretos `JIRA_API_TOKEN` y `JIRA_EMAIL` y la variable `JIRA_CLOUD_ID` ya existen en el repositorio):
   - `push` a ramas que contengan `ADP-` → **En curso**, solo si el ticket está en «Por hacer».
   - `pull_request` contra `develop`, `opened`, `reopened` o `ready_for_review` → **En revisión** y un comentario «PR #N abierto: <enlace>».
   - `pull_request` `closed` con `merged == true` → **Listo** y un comentario «PR #N fusionado en develop».
   - La clave se saca de la rama (y si no, del título del PR); si no hay clave, el flujo termina sin hacer nada. Si Jira falla, el paso falla con un mensaje claro, pero **nunca bloquea la CI** (es un flujo aparte).
3. **Prueba** (no tienes el token): escribe tests del script con la biblioteca estándar (`unittest`), simulando las llamadas HTTP: la extracción de la clave, la orden `agent` que quita las otras etiquetas, «ya está en esa columna», y que el token no aparece en ninguna salida. Ejecútalos con `python3 -m unittest discover scripts/jira`. Y comprueba el flujo con `actionlint` en Docker (`docker run --rm --pull missing -v "$PWD:/repo" -w /repo rhysd/actionlint:1.7.12`).
4. Una sección corta en `scripts/jira/README.md`: qué hace y cómo se usa.

## Fuera de alcance

Cualquier otro fichero, Jira de verdad (no tienes el token: el orquestador lo probará), `package.json`. **No hagas merge.**

## Cómo informar al terminar

Tres frases con qué hiciste, el resultado de los tests y el enlace al PR, y `worker_done` con `--outcome succeeded|failed`.
