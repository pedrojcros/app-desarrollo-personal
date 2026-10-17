# Encargo 080 — Plantilla: scripts de proceso y CI general

| Campo | Valor |
|---|---|
| Tarea del plan | Plantilla para proyectos de pago ([propuesta](../../propuestas/plantilla.md), DEC-60 y DEC-61) |
| Ticket | Sin ticket |
| Agente | Codex, carril 1 (DEC-57) |
| Modelo y esfuerzo | `gpt-6-luna`: es mecánico y con los pasos fijados aquí |
| Skills a usar | Perfil «Scripts y CI»: `ci-cd-and-automation`, `incremental-implementation` |
| Repositorio | `pedrojcros/template-multiagents-develop` |
| Rama y worktree | `chore/scripts-y-ci`, desde `main` |
| Depende de | El primer commit de `main` del 079 (no su PR: va en paralelo) |
| Reservado para este encargo | `scripts/` y `.github/` de la plantilla |

## Objetivo

Que la plantilla traiga los scripts que sostienen el proceso, **sin nada de esta app dentro** y con sus tests en verde en la CI.

## Qué hacer

1. Copia desde `develop` de la app: `scripts/orca/`, `scripts/incidents/`, `scripts/jira/` y `scripts/with-heavy-lock`, con sus tests y sus `README.md`.
2. **Todo lo que sea de esta app pasa a configuración:** la clave del proyecto de Jira (`ADP`), el nombre del repositorio, las rutas de `~/orca/...` y la carpeta de secretos. Va en un único `scripts/proyecto.env.example` que los scripts leen, con valores de ejemplo. Si un script no la encuentra, falla con un mensaje claro en inglés que diga qué variable falta.
3. `.github/workflows/`: `jira.yml` con la clave leída de una variable del repositorio, y un `ci.yml` general con gitleaks y los tests de Python de `scripts/` (`unittest`, sin instalar nada).
4. Los tests existentes siguen pasando; añade uno por cada variable nueva que compruebe el mensaje de error cuando falta.

## Contrato

- La configuración vive en `scripts/proyecto.env` (no se sube) y su ejemplo en `scripts/proyecto.env.example` (sí se sube). El 079 la menciona en `AGENTS.md` con ese nombre.

## Fuera de alcance

- Lo de Docker, Expo, Supabase, el emulador, la siembra, las copias de seguridad y el despliegue: es del perfil de stack (081).
- Cambiar lo que hacen los scripts.

## Criterio de hecho

- `python3 -m unittest discover` de cada carpeta de `scripts/` en verde (los tests usan `unittest`, sin dependencias) en local y en la CI de la plantilla.
- `grep -rniE 'ADP|app-desarrollo-personal|/home/'` sobre `scripts/` y `.github/` no da resultados fuera de `proyecto.env.example`.
- PR contra `main` de la plantilla.

## Cómo informar al terminar

Qué variables nuevas hay, qué tests se añadieron, la salida de los tests y el enlace al PR.
