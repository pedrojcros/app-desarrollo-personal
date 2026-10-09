# Encargo 049 — Registro de incidencias (DEC-45, encargo A)

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Ticket | `ADP-28` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6-luna` (mecánico, con pasos fijados; DEC-41) |
| Skills | `test-driven-development`, `codigo-legible` (en `.agents/skills/`) |
| Rama | `ADP-28-registro-incidencias`, desde `origin/develop` |
| Reservado | `scripts/incidents/` entero (nuevo), `scripts/orca/supervise_workers.py` y su test, una línea en `.gitignore` |

Lee la regla de legibilidad de `AGENTS.md` y, de la [propuesta](../../propuestas/mejora-del-flujo.md), solo el apartado **P1**. No uses el emulador, ni Supabase, ni Docker: estos scripts son herramientas del orquestador y corren en el ordenador con `python3` (**solo biblioteca estándar**), igual que `scripts/orca/supervise_workers.py` y `scripts/jira/jira.py`.

## Objetivo

Que quede escrito, sin gastar tokens, cada problema que hace perder tiempo (cuota, trabajador parado, emulador...), para hacer una retrospectiva con números al cerrar cada versión.

## Contrato (lo usan también los encargos 050 y 052, que van a la vez)

**Fichero:** `logs/incidents.jsonl` en la **carpeta principal** del repositorio, también si se ejecuta desde un worktree: la raíz es el padre de `git rev-parse --path-format=absolute --git-common-dir`. La variable `ADP_INCIDENTS_FILE` la sustituye (para los tests). `logs/` va a `.gitignore`: el registro no se sube; lo que viaja es el resumen de la retrospectiva.

**Una línea por incidencia**, un objeto JSON con estas claves (todas obligatorias):

| Clave | Tipo | Valor |
|---|---|---|
| `date` | texto | Instante ISO 8601 con zona (`2026-10-09T20:31:00+02:00`) |
| `type` | texto | Uno de `environment`, `quota`, `stuck-agent`, `flaky-test`, `app-bug`, `waiting-human`, `tool` |
| `task` | texto | Clave del ticket (`ADP-27`) o `""` si no hay |
| `minutes` | entero ≥ 0 | Minutos perdidos (estimados) |
| `cause` | texto | Qué pasó |
| `fix` | texto | Qué se hizo, o `""` |
| `source` | texto | `supervisor` u `orchestrator` |

**Módulo `scripts/incidents/incident_log.py`:** `incidents_file_path()`, `append_incident(...)` (valida y añade una línea; nunca reescribe el fichero) y `read_incidents(path)` (ignora y cuenta las líneas inválidas, sin romper). El encargo 052 lo importará.

**Orden `scripts/incidents/record_incident.py`** (la usan el orquestador y el encargo 050):

```sh
python3 scripts/incidents/record_incident.py --type environment --minutes 20 \
  --cause "ADB perdió el emulador" [--fix "docker/android/reset"] [--task ADP-27] [--source orchestrator]
```

`--source` vale `orchestrator` por defecto. Imprime una línea de confirmación; con un tipo o unos minutos inválidos, sale con código 2 y un mensaje claro.

## Qué hacer

1. `incident_log.py` y `record_incident.py` según el contrato, con tests (`unittest`, ficheros temporales).
2. **El supervisor escribe en el registro** (`source: supervisor`, la tarea sacada del nombre de rama del trabajador si lleva `ADP-NN`) cada vez que actúa o avisa: encargo sin enviar (Enter), permiso de Copilot concedido, modelo saturado, espera de cuota (al reanudar, con los minutos reales de la espera) y trabajador parado (con los minutos de inactividad). Si escribir falla, el supervisor sigue funcionando e imprime un aviso. Tests en `scripts/orca/test_supervise_workers.py`.
3. `scripts/incidents/report.py --since YYYY-MM-DD [--until YYYY-MM-DD]`: texto corto en español con minutos perdidos por tipo (de más a menos), las causas que se repiten (misma `cause`, normalizada en minúsculas y sin espacios sobrantes) y las tareas con más minutos. Con tests.
4. `scripts/incidents/README.md`: para qué sirve, el contrato y las tres órdenes. Añade una línea en `scripts/orca/` o en la documentación del supervisor solo si ya existe un README allí.
5. `python3 -m unittest discover scripts/incidents` y `python3 -m unittest discover scripts/orca` en verde. Commits pequeños en español, push y PR contra `develop` con `ADP-28` en el título.

## Fuera de alcance

- `docs/` (lo actualiza el orquestador en el encargo D), `docker/`, la app y `scripts/jira/`.
- Medir tokens o tiempos de encargos: es el encargo 052.

Si algo no está claro, pregunta con `orca orchestration ask`. Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`); el informe de seis puntos de la plantilla, en la descripción del PR.
