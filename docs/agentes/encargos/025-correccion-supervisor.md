# Encargo 025 — Corrección del supervisor autónomo (PR #32)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` a la rama del PR #32 (`pedrojcros/chore-supervisor-autonomo`). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Ninguna: corrección del encargo 023 (DEC-39, punto 7) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills a usar | `test-driven-development`, `codigo-legible` (en `.agents/skills/`) |
| Rama y worktree | la del PR #32: `git fetch origin && git switch -c fix-supervisor origin/pedrojcros/chore-supervisor-autonomo`, y al terminar `git push origin HEAD:pedrojcros/chore-supervisor-autonomo` |
| Reservado para este encargo | `scripts/orca/supervise_workers.py`, `scripts/orca/test_supervise_workers.py`, la sección «Vigilar a los trabajadores» de `docs/agentes/orca.md` |

## Antes de empezar

Lee `docs/agentes/encargos/023-supervisor-autonomo.md` (lo que se pidió), la regla de legibilidad de `AGENTS.md` (vale también para Python) y el diff del PR: `git diff origin/develop...HEAD`. Solo biblioteca estándar de Python.

## Qué está mal (revisión del orquestador)

1. **Pantalla vieja.** El supervisor decide por el texto de la pantalla, que incluye el historial. Tras escribir «continúa», el aviso `Selected model is at capacity` sigue visible mientras Codex trabaja. A los 5 minutos vuelve a escribir «continúa» a un trabajador que **no** está parado, y al tercero da una falsa alarma.
2. **Cuota «resuelta» para siempre.** Con `quota_resumed`, mientras el aviso viejo de cuota siga en pantalla, `handle_codex_wait` devuelve `'handled'`. Eso salta la comprobación de inactividad y la de una cuota nueva: si el trabajador se vuelve a parar, nadie lo ve.
3. **Legibilidad.** `handle_codex_wait` mezcla en el mismo valor de vuelta un estado (`'waiting'`, `'handled'`) y un mensaje de aviso; tiene casi 50 líneas y tres niveles de anidamiento. Sepáralo en funciones cortas, sal pronto y que el tipo de vuelta diga lo que es (por ejemplo, un `enum` o constantes con nombre para el estado y el aviso aparte).

## Qué hacer

- Una situación solo cuenta si es **actual**: el aviso está entre las **últimas líneas no vacías** de la pantalla (por ejemplo, las 15 últimas) **y** la pantalla no ha cambiado desde la vuelta anterior (el agente está quieto, no trabajando). Con eso:
  - tras un «continúa» que funciona, no se repite nada;
  - una cuota nueva, más tarde, se detecta otra vez;
  - un trabajador que se para por otra cosa vuelve a contar como inactivo.
- Al reanudar tras la cuota, el estado de ese trabajador se limpia por completo. No queda ningún camino que lo deje «resuelto» para siempre.
- Mientras espera la hora de la cuota, el trabajador no cuenta como inactivo (eso ya estaba bien: consérvalo).
- **Tests** (TDD) en `scripts/orca/test_supervise_workers.py`, que fallen con el código actual:
  - el aviso viejo en el historial con la pantalla cambiando no provoca otro «continúa»;
  - tras reanudar la cuota, una cuota nueva se detecta;
  - tras reanudar, un trabajador quieto acaba avisando por inactividad;
  - el aviso en las últimas líneas con la pantalla quieta sí actúa.

## Fuera de alcance

Lo que ya hace con el Enter y con los permisos de Copilot, el código de la app, `docs/contexto.md`, Jira y otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] `python3 -m unittest scripts/orca/test_supervise_workers.py` pasa, con los cuatro casos nuevos.
- [ ] `python3 scripts/orca/supervise_workers.py --help` funciona.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] Commits subidos a la rama del PR #32 y un comentario en el PR que resuma la corrección. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
