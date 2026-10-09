# Encargo 030 — El supervisor entiende la hora de la cuota con fecha delante

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Agente | copilot (pequeño y mecánico, DEC-39) |
| Rama | `fix/supervisor-hora-con-fecha`, desde `develop` |
| Reservado | `scripts/orca/supervise_workers.py` (solo `parse_retry_time`, `detect_usage_limit` y lo que necesiten) y `scripts/orca/test_supervise_workers.py` |

## Qué pasa

Codex escribe así la hora a la que vuelve la cuota, con la fecha delante (texto real del 2026-10-07):

```
■ You've hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/settings/
usage to purchase more credits or try again at Oct 8th, 2026 2:09 AM.
```

El supervisor solo reconoce `try again at 18:55` o `try again at 6:55 PM`, así que con este texto avisa de inactividad en vez de esperar. Además, el aviso puede venir **sin menú** (con Luna no ofrece cambiar de modelo): en ese caso no hay que contestar «2», solo esperar a la hora y escribir «continúa».

## Qué hacer

1. **Tests primero**, en `scripts/orca/test_supervise_workers.py`, con el texto de arriba, incluido el salto de línea en mitad de la URL:
   - `Oct 8th, 2026 2:09 AM` da 2026-10-08 02:09;
   - también `October 8, 2026 14:09` y los formatos que ya funcionaban;
   - el aviso **con** menú (`2. Keep current model`) contesta «2» y espera;
   - el aviso **sin** menú solo espera;
   - en los dos casos, a la hora más un minuto se escribe «continúa».
2. Ajusta `parse_retry_time` (con fecha, la hora no pasa a mañana: es esa fecha) y la detección para que lo anterior pase. Solo biblioteca estándar; los nombres de los meses en inglés, abreviados o completos, y los sufijos `st`, `nd`, `rd` y `th`.
3. Un commit en español, push y PR contra `develop` con un título que empiece por «Supervisor».

No toques nada más. Cumple la regla de legibilidad de `AGENTS.md` (nombres en inglés sin abreviaturas, comentarios en español, funciones cortas).

## Criterio de hecho

- [ ] `python3 -m unittest scripts/orca/test_supervise_workers.py` pasa, con los casos nuevos.
- [ ] PR abierto contra `develop`. **No hagas merge.**

Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`).
