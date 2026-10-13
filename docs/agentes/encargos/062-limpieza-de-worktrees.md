# Encargo 062 — Script de limpieza de worktrees

| Campo | Valor |
|---|---|
| Tarea del plan | DEC-50 (limpieza al cerrar cada sesión) |
| Ticket | `ADP-35` (solo informativo: no lo toques) |
| Agente | codex |
| Modelo y esfuerzo | `gpt-6-luna`, esfuerzo por defecto (pasos fijados, herramienta interna) |
| Skills a usar | `test-driven-development`, `codigo-legible`, `flujo-git` |
| Rama y worktree | Rama `ADP-35-limpieza-de-worktrees`, creada desde `develop`. Un worktree solo para este encargo |
| Depende de | Nada |
| Reservado para este encargo | `scripts/orca/clean_worktrees.py` y `scripts/orca/test_clean_worktrees.py` (nuevos) |

## Antes de empezar

Lee `AGENTS.md` entero. Es obligatorio aunque tu herramienta lo cargue sola.

## Cómo trabajar (DEC-39)

- **Commits pequeños a menudo**, uno por paso terminado.
- Lee de la documentación solo lo que este encargo te señala.
- **Nunca ejecutes el script con `--apply`** ni borres ningún worktree, carpeta o rama: lo hará el orquestador después de fusionar. Sí puedes (y debes) ejecutarlo sin `--apply`, que solo lee.

## Objetivo

Un script que enseñe qué worktrees de Orca sobran y, solo si se le pide con `--apply`, borre los que se pueden borrar sin perder nada: los que ya están contenidos en `origin/develop` y no tienen nada sin guardar. Lo usa el orquestador al cerrar cada sesión (DEC-50). Tiene que ser genérico: sin nada propio de esta app, para que pase tal cual a la plantilla de otros proyectos.

## Contexto que necesitas

- `scripts/orca/supervise_workers.py` y `scripts/orca/test_supervise_workers.py`: cópiales el estilo (Python 3 con solo la biblioteca estándar, `subprocess` para llamar a `orca` y `git`, `unittest` con `mock`, mensajes al humano en español). Como el supervisor, este script corre **en el anfitrión**, no en Docker, porque necesita el CLI de Orca y su socket (excepción ya aceptada para los scripts de `scripts/orca/`).
- Los tests de `scripts/orca/` se ejecutan con `python3 -m unittest scripts.orca.test_supervise_workers` desde la raíz; el tuyo, igual.
- CLI de Orca (comprueba la salida real en tu máquina antes de escribir el código; si algo difiere de lo que dice aquí, manda lo real y anótalo en Dudas):
  - `orca worktree list --json` → `result.worktrees[]`, con al menos `path`, `isMainWorktree`, `head`, `branch` (por ejemplo `refs/heads/develop`, o vacío si está desacoplado) y `displayName`.
  - `orca worktree rm --worktree path:<ruta> --json` borra el worktree de Orca y de git, e intenta borrar su rama local solo si Orca puede demostrar que está fusionada. **No uses `--force`.**
  - `orca terminal list --json` → terminales abiertas, cada una con su carpeta (`worktreePath` o `cwd`).
  - `orca orchestration worker-list --include-remote --json` → trabajadores; cada fila trae `projection.liveness`. Pagina con `page.hasMore` y `--cursor`.

## Qué hacer

1. `git fetch origin` (sin `--prune` ni nada que borre) y lee `orca worktree list --json`.
2. Clasifica cada worktree en uno de estos grupos, en este orden (el primero que cumpla manda):
   1. **Principal** (`isMainWorktree`): no se toca y no se lista.
   2. **En uso**: tiene un trabajador cuya vida no sea con certeza `exited`, o una terminal de Orca abierta, en esa carpeta o dentro de ella. No se toca. Si no se puede saber (el CLI falla o no se entiende su salida), se trata como en uso.
   3. **No existe**: la ruta ya no está en el disco. Solo se informa.
   4. **Con cosas sin guardar**: `git status --porcelain` no sale vacío (cambios o ficheros sin seguimiento; los ignorados por `.gitignore`, como `node_modules`, no cuentan). Se informa con la lista de esos ficheros (como mucho cinco y «y N más»).
   5. **Sin fusionar**: su `HEAD` no está contenido en `origin/develop` (`git merge-base --is-ancestor`). Se informa con cuántos commits faltan.
   6. **Se puede borrar**: el resto.
3. Además, informa de las carpetas que hay junto a los worktrees no principales (en su misma carpeta madre) y que **no** son worktrees registrados en Orca: «carpeta suelta, no es un worktree». No se tocan nunca, ni con `--apply`.
4. **Sin `--apply`** (por defecto): imprime cada worktree con su grupo y su motivo en una línea, y al final un resumen («N se pueden borrar, M necesitan que decidas») y la orden para borrar. No cambia nada.
5. **Con `--apply`**: borra solo los del grupo «se puede borrar», uno a uno, con `orca worktree rm --worktree path:<ruta> --json`, e imprime el resultado de cada uno. Si uno falla, lo dice y sigue con el siguiente. Antes de borrar cada uno, vuelve a comprobar que sigue sin cosas sin guardar.
6. Código de salida: 0 si todo fue bien (aunque queden cosas por decidir); distinto de 0 si falló una orden de `orca` o de `git` que impidió clasificar, o si falló algún borrado.

## Fuera de alcance

- `docs/` entero (lo actualiza el orquestador: ya ha añadido el paso a `docs/agentes/orquestador.md`), `scripts/orca/supervise_workers.py` y cualquier otro fichero.
- Borrar ramas remotas, carpetas sueltas o worktrees de otros grupos.
- Nada de dependencias nuevas (solo biblioteca estándar).

## Criterio de hecho

- [ ] Tests con `unittest` y `mock` (sin llamar al `orca` ni al `git` reales) para cada grupo: principal, en uso por trabajador vivo, en uso por terminal abierta, CLI de trabajadores que falla (se trata como en uso), ruta inexistente, con cambios, con ficheros sin seguimiento, sin fusionar y se puede borrar; carpeta suelta; que sin `--apply` no se llama nunca a `orca worktree rm`; que con `--apply` se llama solo para los borrables, sin `--force`; que un borrado que falla no corta los demás y da código de salida distinto de 0; que no se borra si entre la clasificación y el borrado aparece un cambio.
- [ ] `python3 -m unittest scripts.orca.test_clean_worktrees` pasa.
- [ ] Ejecución real **sin `--apply`** en tu máquina: pega su salida en el informe del PR. Tu propio worktree debe salir «en uso».
- [ ] Cumple la regla de legibilidad de `AGENTS.md` (nombres en inglés sin abreviaturas; comentarios y commits en español).
- [ ] PR abierto **contra `develop`**, con `ADP-35` en el título. **No hagas merge**: lo decide el orquestador

## Documentación a actualizar

- Ninguna fuera del propio script: un comentario al principio que diga para qué sirve, cómo se usa y que solo borra lo que ya está en `origin/develop` sin nada sin guardar.

## Cómo informar al terminar

En la descripción del PR, con estos seis puntos y **en formato corto** (DEC-45):

1. **Hecho:** qué has hecho, en tres líneas como mucho.
2. **Ficheros:** la lista, sin explicar cada uno.
3. **Decisiones:** las que has tomado tú, una línea cada una con su porqué. «Ninguna» si no hay.
4. **Dudas:** lo que no estaba especificado o lo que el CLI hace distinto de lo que dice este encargo, una línea cada una. «Ninguna» si no hay.
5. **Tests:** el comando y el resultado en una línea, y la salida de la ejecución real sin `--apply`.
6. **PR:** el enlace.

Y al final, `worker_done` con un resumen de tres frases.
