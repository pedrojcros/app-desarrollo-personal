# Encargo 064 — Tres detalles del script de limpieza de worktrees

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | DEC-50, detalles menores de la revisión del encargo 063 (PR #81) |
| Ticket | `ADP-36` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6-luna` |
| Skills | `test-driven-development` y `codigo-legible` (en `.agents/skills/`) |
| Rama | `ADP-36-detalles-limpieza`, desde `origin/develop` |
| Reservado | `scripts/orca/clean_worktrees.py` y `scripts/orca/test_clean_worktrees.py`. Nada más |

Lee la regla de legibilidad de `AGENTS.md`. No uses el emulador, Supabase ni Docker: el script es Python con la biblioteca estándar.

**Nunca ejecutes el script con `--apply`**, ni `orca worktree rm`, ni borres ningún worktree, carpeta o rama. Sí puedes ejecutarlo sin `--apply`.

## Objetivo

`scripts/orca/clean_worktrees.py` enseña los worktrees de Orca que sobran y, con `--apply`, borra solo los que ya están fusionados y limpios. Ya es seguro (PR #81). Quedan tres detalles menores; arréglalos con su test.

## Qué hacer

1. **Carpetas sueltas junto a la principal.** `find_loose_directories` mira la carpeta madre de **todos** los worktrees que da Orca, también la de la carpeta principal del repositorio (aquí, `~/orca/projects/`). Así, cualquier otro proyecto que haya junto a la principal saldría como «carpeta suelta, no es un worktree». Debe buscar carpetas sueltas solo en las carpetas madre de los worktrees que **no** son la principal (usa la principal que ya calcula el script con git, `find_main_worktree`, no el dato `isMainWorktree` de Orca). Test: con la principal en `/x/projects/app` y un hermano `/x/projects/otro`, el hermano no sale; una carpeta no registrada junto a un worktree de `/x/workspaces/app/` sí sale.
2. **Datos raros de Orca sin capturar.** Si un elemento de las listas de Orca no tiene la forma esperada (un worktree que no es un diccionario o no tiene `path`; un trabajador o una terminal que no es un diccionario), hoy el script puede terminar con un `KeyError`, `TypeError` o `AttributeError` sin capturar. Debe tratarse como los demás fallos:
   - un worktree con forma rara se clasifica como «error al clasificar» (nunca borrable), se sigue con los demás y el script termina con código distinto de 0;
   - un trabajador o una terminal con forma rara cuenta como actividad no verificable, que deja todo «en uso» (el lado seguro, como ya pasa cuando Orca falla);
   - en `find_loose_directories`, un worktree sin `path` no rompe el listado.
   Tests de los tres casos.
3. **Tests que faltan.** La revisión del 063 encontró 5 mutaciones que los tests no detectan, todas de cobertura. Busca las ramas del script que ningún test recorre (lee el script función por función, o usa `python3 -m trace --count`, de la biblioteca estándar) y escribe un test para cada una que proteja algo: como mínimo, `path_is_within` con una `OSError` (debe devolver `True`), `worker_path` y `terminal_path` cuando falta la ruta, y `apply_removals` cuando `orca worktree rm` falla (no corta los demás borrados y el código de salida es distinto de 0). Comprueba a mano que cada test nuevo falla al romper lo que protege y deshaz la mutación.

## Fuera de alcance

- `docs/` entero y cualquier fichero que no sean los dos reservados.
- Dependencias nuevas.
- Cambiar el comportamiento de lo que ya funciona: solo estos tres detalles.

## Criterio de hecho

- [ ] Los tres puntos arreglados, cada uno con sus tests.
- [ ] `python3 -m unittest scripts.orca.test_clean_worktrees` pasa.
- [ ] Ejecución real **sin `--apply`**, con su salida pegada en el PR: no sale ninguna carpeta de `~/orca/projects/`.
- [ ] Cumple la regla de legibilidad de `AGENTS.md` (nombres en inglés; comentarios y commits en español).
- [ ] PR **contra `develop`** con `ADP-36` en el título. **No hagas merge**.

## Cómo informar al terminar

En la descripción del PR, en formato corto (DEC-45): **Hecho**, **Ficheros**, **Decisiones**, **Dudas**, **Tests** (comando y resultado, mutaciones comprobadas a mano y la salida sin `--apply`) y **PR**. Si algo no está claro, pregunta con `orca orchestration ask`. Al final, `worker_done` con un resumen de tres frases y `--outcome succeeded|failed`.
