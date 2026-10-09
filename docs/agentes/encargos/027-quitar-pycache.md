# Encargo 027 — Quitar los `.pyc` del repositorio

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Agente | copilot (pequeño y mecánico, DEC-39) |
| Rama | `chore/quitar-pycache`, desde `develop` |
| Reservado | `.gitignore` y `scripts/orca/__pycache__/` |

## Qué hacer

El PR #32 subió por error `scripts/orca/__pycache__/supervise_workers.cpython-314.pyc` y `scripts/orca/__pycache__/test_supervise_workers.cpython-314.pyc` (ficheros generados por Python).

1. `git rm -r --cached scripts/orca/__pycache__`.
2. Añade al final de `.gitignore`, con un comentario en español, las líneas `__pycache__/` y `*.pyc`.
3. Un commit en español («Deja de versionar los .pyc de Python»), push y PR contra `develop` con un título que empiece por «Chore».

No toques nada más. No ejecutes tests de la app (no hacen falta).

## Criterio de hecho

- [ ] `git ls-files | grep -c __pycache__` da 0 en tu rama y `.gitignore` tiene las dos líneas.
- [ ] PR abierto contra `develop`. **No hagas merge.**

Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`).
