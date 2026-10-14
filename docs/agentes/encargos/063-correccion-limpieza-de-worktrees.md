# Encargo 063 — Corrección del script de limpieza de worktrees

| Campo | Valor |
|---|---|
| Tarea del plan | DEC-50, corrección del encargo 062 (PR #80) |
| Ticket | `ADP-35` (solo informativo: no lo toques) |
| Agente | codex |
| Modelo y esfuerzo | `gpt-6.1-sol`, esfuerzo por defecto (corrección de un script que borra) |
| Skills a usar | `test-driven-development`, `codigo-legible`, `flujo-git` |
| Rama y worktree | Tu worktree parte de la rama del PR #80 (`pedrojcros/ADP-35-limpieza-de-worktrees`), con sus commits ya dentro. Trabaja en tu rama y abre un PR **nuevo** contra `develop` con `ADP-35` en el título; el #80 lo cierra el orquestador |
| Depende de | 062 (sus commits ya están en tu rama) |
| Reservado para este encargo | `scripts/orca/clean_worktrees.py` y `scripts/orca/test_clean_worktrees.py` |

## Antes de empezar

Lee `AGENTS.md` entero. Es obligatorio aunque tu herramienta lo cargue sola.

## Cómo trabajar (DEC-39)

- **Commits pequeños a menudo**, uno por hallazgo arreglado, con su test.
- **Nunca ejecutes el script con `--apply`** ni `orca worktree rm`, ni borres ningún worktree, carpeta o rama. Sí puedes ejecutarlo sin `--apply`.
- El encargo original, con el comportamiento que debe tener el script, está en `docs/agentes/encargos/062-limpieza-de-worktrees.md` en `develop` o, si aún no está, aquí resumido: clasifica cada worktree de Orca en principal / en uso / no existe / con cosas sin guardar / sin fusionar / se puede borrar (el primero que cumpla manda), informa de carpetas sueltas, y con `--apply` borra solo los borrables con `orca worktree rm --worktree path:<ruta> --json` sin `--force`.

## Objetivo

Que el script **nunca pueda borrar algo que no debe** y que sus tests lo demuestren. Una revisión encontró estos fallos en `scripts/orca/clean_worktrees.py`; arréglalos todos.

## Qué hacer

**Seguridad (lo importante):**

1. **Carpeta principal sin depender de Orca.** Hoy solo se mira `isMainWorktree`; si falta o viene falso, la principal limpia sale «se puede borrar». Obtén la carpeta principal por tu cuenta con git (`git worktree list --porcelain`, primera entrada, o `git rev-parse --path-format=absolute --git-common-dir` y su carpeta madre) y clasifica como «principal» (no se toca ni se lista) cualquier worktree cuyo `path` sea la principal **o la contenga**. Repite esa comprobación en `apply_removals` antes de cada borrado.
2. **Volver a comprobar todo antes de cada borrado** con `--apply`, no solo `git status`: el `HEAD` real de la carpeta (`git -C <ruta> rev-parse HEAD`) y que esté contenido en `origin/develop`, y la actividad (trabajadores y terminales) recargada en ese momento. Clasifica también con el `HEAD` real de la carpeta, no con el `head` que da Orca al listar.
3. **Un fallo al clasificar un worktree no corta el script**: captura `CommandFailure` y `OSError` por worktree y clasifícalo como «error al clasificar» (nunca borrable), sigue con los demás, imprime el resumen y termina con código distinto de 0. `get_result` comprueba que la respuesta es un diccionario.
4. **Listas truncadas = en uso**: si `orca terminal list` o `orca worktree list` devuelven `truncated: true` o `hostScope.omittedHostIds` no vacío, trátalo como fallo (`CommandFailure`), que en la actividad lleva a «en uso» para todos.
5. **`path_is_within`**: si la comparación de rutas falla (`OSError`), devuelve `True` (el lado seguro: «en uso»).

**Salida y limpieza de código:**

6. **Identificar cada worktree por su ruta**, nunca solo por `displayName`: hoy el worktree `.../revision-orquestador` sale como «app-desarrollo-personal: se puede borrar», que parece la carpeta principal. Formato, por ejemplo: `revision-orquestador (/ruta/completa): se puede borrar — motivo`, con el `displayName` solo como dato extra si difiere del nombre de la carpeta. Lo mismo en los mensajes de `--apply`.
7. **Carpetas sueltas**: ignora las que empiezan por punto (por ejemplo `.orca-worktree-trash`, la papelera interna de Orca).
8. **Código muerto**: quita los parámetros que no se usan (`repository_root` en `find_loose_directories`, `snapshot` en `apply_removals`) o úsalos si hacen falta para lo anterior.
9. **Legibilidad** (`AGENTS.md`): define `Activity` antes de usarla; renombra `list_saved_files`, que devuelve una cadena; cuenta los grupos sin `sum()` sobre booleanos; parte las líneas de más de 100 caracteres.

## Tests que faltan (y que deben fallar si se rompe la protección)

Los tests actuales siguen en verde con mutaciones peligrosas. Escribe tests que fallen con cada una de estas mutaciones (compruébalo haciendo la mutación a mano y deshaciéndola; cuéntalo en el informe):

- trabajador con vida `unknown` o ausente que deja de contar como «en uso» (y uno `exited` que sí deja la carpeta libre);
- trabajador en `/a/foo-bar` que marca `/a/foo` (y al revés sí cuenta); usa ids de trabajador con el formato real (`<repoId>::<ruta>`), no sin `::`;
- `merge-base` con código distinto de 0 y 1 tratado como «contenido» o como «no contenido» en vez de error;
- `git status` con `--ignored`;
- `apply_removals` que borra algo que no sea del grupo «se puede borrar» (prueba con varios worktrees de grupos distintos, sin mockear la clasificación);
- sin `--apply`, con worktrees borrables presentes, que no se llama nunca a `orca worktree rm`;
- `isMainWorktree` ausente, `False` o `0` en la carpeta principal, y un worktree cuya ruta contiene la principal;
- commit nuevo sin fusionar o trabajador nuevo entre clasificar y borrar;
- paginación de `worker-list` (dos páginas, el vivo en la segunda);
- `orca` que falla, comprobado hasta la clasificación «en uso»; lista truncada;
- fallo de `git status` en un worktree que no impide clasificar los demás;
- la salida contiene la ruta completa.

Los tests de los argumentos de `git` y de sus códigos de salida deben mockear `subprocess.run`, no las funciones del propio script.

## Fuera de alcance

- `docs/` entero y cualquier fichero que no sean los dos reservados.
- Nada de dependencias nuevas.

## Criterio de hecho

- [ ] Todos los hallazgos 1 a 9 arreglados, cada uno con su test.
- [ ] Los tests fallan con cada mutación de la lista (comprobado a mano y dicho en el informe).
- [ ] `python3 -m unittest scripts.orca.test_clean_worktrees` pasa.
- [ ] Ejecución real **sin `--apply`**: pega su salida en el PR. Tu propio worktree debe salir «en uso» y `.orca-worktree-trash` no debe salir.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR nuevo **contra `develop`**, con `ADP-35` en el título. **No hagas merge**.

## Cómo informar al terminar

En la descripción del PR, en formato corto (DEC-45): **Hecho**, **Ficheros**, **Decisiones**, **Dudas**, **Tests** (comando y resultado, mutaciones comprobadas y la salida sin `--apply`) y **PR**. Al final, `worker_done` con un resumen de tres frases.
