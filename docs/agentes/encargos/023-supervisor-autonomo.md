# Encargo 023 — Supervisor que resuelve solo la cuota y el modelo saturado (DEC-39, punto 7)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Ninguna: mejora de las herramientas del orquestador (DEC-39, punto 7) |
| Ticket | Ninguno |
| Agente | codex, `--model gpt-6-luna` (pequeño y acotado, DEC-39) |
| Skills a usar | `test-driven-development`, `codigo-legible` (en `.agents/skills/`) |
| Rama y worktree | `chore/supervisor-autonomo`, desde `develop`, tu propio worktree |
| Reservado para este encargo | `scripts/orca/supervise_workers.py` y un fichero de tests nuevo junto a él |

## Antes de empezar

Lee la regla de legibilidad de `AGENTS.md` (vale también para Python: nombres en inglés sin abreviaturas, comentarios en español) y `scripts/orca/supervise_workers.py` entero: es corto. Lee también «Vigilar a los trabajadores» y «Trampas conocidas» en `docs/agentes/orca.md`, y la entrada de DEC-39 en `docs/decisiones.md`. **Solo biblioteca estándar de Python**: sin dependencias.

## Qué hace hoy

Cada 20 segundos lee la pantalla de cada trabajador vivo con `orca terminal read`. Envía el Enter a los encargos que se quedaron sin enviar, concede a Copilot los permisos de sesión dentro del proyecto y, **ante cualquier otra cosa, avisa y termina**, para que el orquestador actúe.

## Qué hacer

Que resuelva solo dos situaciones de Codex que hoy despiertan al orquestador y le gastan tokens:

1. **Modelo saturado.** Si la pantalla muestra `Selected model is at capacity`, el turno de Codex se ha cortado. El supervisor escribe `continúa` en su terminal y envía el Enter (`orca terminal send`, como ya hace con el Enter). Lo hace como mucho una vez cada 5 minutos por trabajador y, como mucho, 3 veces seguidas. A la cuarta, avisa y termina.
2. **Cuota agotada.** Si la pantalla muestra `You've hit your usage limit` con `try again at <hora>` y un menú que ofrece cambiar a un modelo más barato:
   - contesta `2` (mantener el modelo) y el Enter, **una sola vez**;
   - apunta la hora (acepta `18:55` y `6:55 PM`; si la hora ya ha pasado hoy, es la de mañana);
   - **no cuenta ese trabajador como parado** mientras espera;
   - un minuto después de esa hora, escribe `continúa` y el Enter, e imprime una línea informativa (no un aviso: no termina).
   Si no consigue leer la hora, avisa y termina, como hoy.
3. Cada acción automática imprime una línea con la hora, el trabajador y lo que ha hecho. Así el orquestador lo ve al leer la salida sin que le despierte.
4. Actualiza el docstring del fichero y la sección «Vigilar a los trabajadores» de `docs/agentes/orca.md` para que digan que ahora lo resuelve el supervisor. `docs/contexto.md` no lo toques: lo actualiza el orquestador.

**Tests** (TDD), con `unittest` de la biblioteca estándar, en `scripts/orca/test_supervise_workers.py`. Comprueban la lógica pura con textos de pantalla de ejemplo, sin hablar con Orca: detectar las dos situaciones, leer la hora en los dos formatos (incluido el paso a mañana), los límites de reintento y que un trabajador que espera la cuota no se da por parado. Sepárala en funciones que reciban el texto y la hora actual, para poder probarla.

## Fuera de alcance

El código de la app, `package.json`, otros scripts, `docs/contexto.md`, Jira y otros encargos. No cambies lo que ya hace con el Enter ni con los permisos de Copilot. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] `python3 -m unittest scripts/orca/test_supervise_workers.py` pasa (y dentro de Docker, `./docker/app/run python3 -m unittest ...`, si la imagen trae Python; si no, dilo).
- [ ] `python3 scripts/orca/supervise_workers.py --help` funciona y, sin trabajadores vivos, termina con su mensaje de siempre.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con un título que empiece por «Supervisor». **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
