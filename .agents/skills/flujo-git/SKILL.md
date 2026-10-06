---
name: flujo-git
description: Cómo se trabaja con git en este proyecto, paso a paso — rama desde develop, commits pequeños en español, PR contra develop, nunca fusionar ni forzar ramas compartidas. Usar en cualquier encargo que haga commits, ramas o pull requests, y al resolver conflictos.
---

# Flujo de git del proyecto

Pasos prácticos de la sección «Flujo de git» de `AGENTS.md` y de la ADR-0002. Si algo de aquí choca con `AGENTS.md` o con tu encargo, mandan ellos.

## Antes de empezar

1. Mira dónde estás: `git status --short --branch`. Orca ya te ha creado una rama desde `develop` (se llama `pedrojcros/<nombre>`): trabaja en ella. No cambies de rama ni crees otras.
2. Trae lo último: `git fetch origin`. Tu rama debe partir de un `origin/develop` reciente.

## Mientras trabajas

- **Commits pequeños**, cada uno con un solo propósito y con los tests de la parte tocada pasando.
- **Mensaje en español, en imperativo**, con la primera línea de 72 caracteres como mucho. Si el porqué no es obvio, añade un cuerpo que lo explique. Ejemplo: «Calcula las ocurrencias mensuales con ajuste a fin de mes».
- **Antes de cada commit**, revisa `git diff --staged`: nada de secretos, ni ficheros ajenos al encargo, ni reformateos de ficheros que no tocas.
- **Añade los ficheros del encargo**, no todo a ciegas (`git add -A` solo si has revisado el estado).
- Un commit lleva el código y la documentación que ese código deja obsoleta.

## Si `develop` ha avanzado y hay conflictos

1. `git fetch origin` y `git rebase origin/develop` sobre **tu** rama (es tuya y todavía no está fusionada).
2. Resuelve cada conflicto entendiendo los dos lados; no te quedes con el tuyo por defecto.
3. Vuelve a pasar los tests.
4. Si el conflicto toca ficheros reservados para otro encargo, para y avisa al orquestador.

## Entregar

1. Sube la rama: `git push -u origin <tu-rama>`. Si tras un rebase hace falta, `git push --force-with-lease`, **solo en tu propia rama**.
2. Abre el PR contra `develop`: `gh pr create --base develop`, con la clave del ticket en el título (`ADP-123 …`) y la plantilla del proyecto rellena.
3. **No fusiones nunca**, ni siquiera tu propio PR: lo decide el orquestador.

## Nunca

- Commit directo en `develop` o en `main`.
- `git push --force` (sin `--with-lease`), ni ningún push forzado a una rama que no sea la tuya.
- `--no-verify` ni desactivar hooks o comprobaciones.
- Crear worktrees por tu cuenta: los crea y gestiona Orca.
- Reescribir commits que ya están en `develop`.
