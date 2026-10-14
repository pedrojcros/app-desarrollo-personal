# Encargo 053 — Corrección de la medida (PR #72) y del aislamiento de los tests del supervisor

> **Permiso de publicación:** puedes hacer `git push` de tu rama. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Ticket | `ADP-29` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6.1-sol` (corrección; DEC-41) |
| Skills | `test-driven-development`, `codigo-legible` (en `.agents/skills/`) |
| Rama | La del PR #72, `pedrojcros/ADP-29-medida-por-encargo`, en este mismo worktree. Antes de nada, `git pull` y un rebase sobre `origin/develop` |
| Corrige | [Encargo 052](052-medida-por-encargo.md) (PR #72) y un fallo del PR #70 (encargo 049) |
| Reservado | `scripts/incidents/measure.py`, `scripts/incidents/test_measure.py`, `scripts/incidents/test_data/`, `scripts/incidents/README.md` y `scripts/orca/test_supervise_workers.py` |

Lee la regla de legibilidad de `AGENTS.md`, el encargo 052 y tu propio `git log`. Solo biblioteca estándar, sin Docker. **Cada fallo, primero un test que falle y después el arreglo.**

## Qué falla

Lo ha encontrado una revisión independiente del PR #72, con datos reales de este ordenador:

1. **Bloqueante: los pasos de Claude se cuentan dos veces** (`measure.py`, hacia las líneas 146-167).
   - Los `.jsonl` de Claude Code repiten el mismo `message.id` en varios registros `assistant`, con el mismo `usage`.
   - En una sesión real había 1263 registros `assistant` y solo 604 mensajes distintos: `sessions` daba 184 pasos y 28,4 M releídos cuando eran unos 90 y 14 M.
   - Arreglo: deduplicar por `message.id`. Los datos de ejemplo de `test_data/` tienen que incluir ids repetidos, y un test tiene que comprobarlo.
2. **Bloqueante: `--since` filtra por la fecha de inicio de la sesión** (hacia la línea 174), así que una sesión que empezó antes y siguió activa queda fuera.
   - Arreglo: cuenta las sesiones con actividad desde esa fecha y, de cada una, **solo la actividad desde esa fecha**. Dilo en el README.
   - Test con una sesión que cruza la fecha.
3. **Menor: se usa el último `cwd` de la sesión** (línea 152). Si el orquestador entra un momento en una subcarpeta, la sesión puede quedar fuera de `--folder`.
   - Arreglo: la sesión pertenece a una carpeta si **cualquiera** de sus `cwd` está dentro de ella.
4. **Menor: la línea `--jira` con varios PR o agentes es confusa** (líneas 341-361): usa solo `pull_requests[0]`, sin ordenar, y solo el primer agente.
   - Arreglo: con un PR, como ahora.
   - Con varios, «PR #37, #61, #65 (el primero abierto en …, el último fusionado en …)», ordenados.
   - Con varios agentes o modelos, todos, resumidos.
   - Sigue siendo una sola línea.
5. **Menor: legibilidad** (líneas 149-151, 289-298, 315-331, 364-372): condiciones compuestas y f-strings que hacen varios pasos. Pártelos con variables con nombre. La asignación `record_session_id` / `session_id` es redundante.
6. **Tests que faltan:** líneas JSON inválidas y una incidencia en la línea `--jira`, además de los de los puntos 1 a 4.
7. **Fallo del PR #70: los tests del supervisor escriben en el registro real.**
   - `scripts/orca/test_supervise_workers.py` solo simula `append_incident` en una de sus clases. Las demás (cuota, modelo saturado, parado) escriben en `logs/incidents.jsonl` de la carpeta principal, con datos inventados («dispatch-1»).
   - Arreglo: que **ningún** test del módulo escriba fuera de un temporal, por ejemplo con `ADP_INCIDENTS_FILE` apuntando a un fichero temporal en `setUpModule`, o simulándolo en todas las clases.
   - Compruébalo así: ejecuta la suite completa y comprueba que `logs/incidents.jsonl` de la carpeta principal no existe ni se crea. El orquestador lo ha vaciado.

## Qué hacer

1. `git pull`, `git rebase origin/develop` y, al final, `git push --force-with-lease` a la misma rama, para que se actualice el PR #72.
2. Los puntos 1 a 7, cada uno con su test y en commits pequeños en español.
3. Después ejecuta:
   - `python3 -m unittest discover scripts/incidents`
   - `python3 -m unittest discover scripts/orca`

   Prueba de verdad (pega solo cifras, nunca contenido de las conversaciones):
   - `measure.py task ADP-16 --jira`
   - `measure.py task ADP-28 --jira`
   - `measure.py sessions --since 2026-10-09`
4. Añade al final de la descripción del PR #72 (`gh pr edit 72 --body-file ...`) un apartado «Corrección (encargo 053)» con el informe corto de la plantilla y esas salidas.

## Fuera de alcance

- `docs/`, el resto de `scripts/` y el código del supervisor (`supervise_workers.py`): solo su test.

Si algo no está claro, pregunta con `orca orchestration ask`. Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`).
