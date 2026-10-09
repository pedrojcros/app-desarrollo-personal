# Encargo 052 — Medir cada encargo y cada sesión (DEC-45, encargo B)

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Ticket | `ADP-29` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6-luna` (mecánico; DEC-41) |
| Skills | `test-driven-development`, `codigo-legible` (en `.agents/skills/`) |
| Rama | `ADP-29-medida-por-encargo`, desde `origin/develop` |
| Depende de | Encargo 049 (`ADP-28`), ya fusionado: usa `scripts/incidents/incident_log.py` |
| Reservado | `scripts/incidents/measure.py`, sus tests y datos de ejemplo (`scripts/incidents/test_data/`), y su apartado en `scripts/incidents/README.md` |

Lee la regla de legibilidad de `AGENTS.md`, de la [propuesta](../../propuestas/mejora-del-flujo.md) los apartados **0**, **1.2** y **P2**, y `scripts/incidents/README.md`. Es una herramienta del orquestador: corre en el ordenador con `python3`, **solo biblioteca estándar**, sin Docker.

## Objetivo

Saber, sin hacer cuentas a mano, cuánto tiempo y cuántos tokens cuesta cada encargo y cada sesión del orquestador, para decidir con números (por ejemplo, si compensa dividir una tarea).

## Fuentes (todas locales; nada sale del ordenador)

- **Sesiones de Codex:** `~/.codex/sessions/AAAA/MM/DD/*.jsonl`.
- **Sesiones de Claude Code:** `~/.claude/projects/<carpeta codificada>/*.jsonl`.
- En las dos, la carpeta de trabajo de un trabajador es su worktree, cuyo nombre lleva la clave `ADP-NN`. **Descubre tú el formato real** de esos ficheros, abriendo unos pocos:
  - dónde va la carpeta de trabajo;
  - el modelo;
  - las cifras de uso (tokens nuevos, releídos de caché y escritos);
  - las marcas de tiempo.

  **Lee solo esos campos**: no leas, copies ni guardes el texto de las conversaciones.
- **PR de GitHub:** `gh pr list --state all --search "ADP-NN" --json number,title,createdAt,mergedAt,headRefName`.
- **Incidencias:** `read_incidents()` de `incident_log.py`.

## Qué hacer

1. `python3 scripts/incidents/measure.py task ADP-NN` imprime, por agente y modelo:
   - sesiones (cuántas veces se lanzó);
   - tokens nuevos, releídos y escritos;
   - primera y última actividad;
   - tiempo hasta abrir el PR y hasta fusionarlo;
   - número de PR;
   - minutos perdidos según el registro de incidencias.
2. `python3 scripts/incidents/measure.py task ADP-NN --jira` imprime **una sola línea** corta en español, para pegarla en la tarjeta con `scripts/jira/jira.py comment`. Por ejemplo: «Medida: Codex gpt-6-luna · 2 sesiones · 310 k nuevos / 9,1 M releídos · PR #70 abierto en 48 min, fusionado en 1 h 05 · 0 min perdidos».
3. `python3 scripts/incidents/measure.py sessions --since YYYY-MM-DD [--folder RUTA]` lista las sesiones de Claude Code de una carpeta (por defecto, la carpeta principal del repositorio: la del orquestador), cada una con:
   - inicio y duración;
   - número de pasos;
   - tokens nuevos y releídos;
   - la media de releídos por paso.
4. Si una fuente no existe o un fichero no se entiende, sigue con las demás y dilo en una línea, sin romper.
5. **Tests con datos de ejemplo inventados** en `scripts/incidents/test_data/`: pocas líneas, con la misma forma que los reales y sin ningún contenido real. Las rutas de las fuentes se pueden sustituir con argumentos o variables, para que los tests no lean tu `~`.
6. Apartado en `scripts/incidents/README.md`. `python3 -m unittest discover scripts/incidents` en verde.
7. Pruébalo una vez de verdad con `ADP-16` (encargo ya cerrado) y pega la salida en el PR. Commits pequeños en español, push y PR contra `develop` con `ADP-29` en el título.

## Fuera de alcance

- `docs/`, `scripts/orca/`, `scripts/jira/` y el resto de `scripts/incidents/`, salvo su README.
- Escribir en Jira: lo hace el orquestador con la línea que imprimes.

Si algo no está claro, pregunta con `orca orchestration ask`. Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`); el informe de seis puntos de la plantilla, en la descripción del PR.
