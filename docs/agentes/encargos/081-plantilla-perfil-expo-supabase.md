# Encargo 081 — Plantilla: perfil de stack Expo + Supabase

| Campo | Valor |
|---|---|
| Tarea del plan | Plantilla para proyectos de pago ([propuesta](../../propuestas/plantilla.md), DEC-60 y DEC-61) |
| Ticket | Sin ticket |
| Agente | Codex, carril 1, después del 080 (DEC-57: misma zona de CI y scripts, sin otro arranque) |
| Modelo y esfuerzo | `gpt-6.1-sol`: hay criterio repartido (qué es genérico y qué del stack) |
| Skills a usar | Perfil «Scripts y CI»: `ci-cd-and-automation`, `incremental-implementation` |
| Repositorio | `pedrojcros/template-multiagents-develop` |
| Rama y worktree | `feat/perfil-expo-supabase`, desde `main` con el 079 y el 080 fusionados |
| Depende de | 079 y 080 fusionados |
| Reservado para este encargo | `perfiles/expo-supabase/` de la plantilla |

## Objetivo

Que un proyecto nuevo con Expo + Supabase copie una carpeta y tenga Docker, CI, despliegue, copias de seguridad, siembra, Maestro y sus skills como los tiene la app.

## Qué hacer

1. Crea `perfiles/expo-supabase/` con la misma forma que la raíz de un proyecto: lo que contiene se copia encima del proyecto nuevo.
2. Copia desde `develop` de la app lo que la sección 3 de la propuesta marca como perfil de stack: `docker/`, los workflows de despliegue y copias de seguridad, `scripts/backup/`, `scripts/seed/`, `scripts/e2e/`, el usuario de desarrollo, `prueba-emulador-docker.md` y las skills a demanda de Expo, EAS, Supabase, Vercel y emulador, **con sus ficheros de licencia**.
3. `perfiles/expo-supabase/AGENTS-stack.md`: la tabla de versiones, la estructura de `src/`, los comandos de Docker y las convenciones de capas que el 079 quitó de `AGENTS.md`.
4. `perfiles/expo-supabase/trampas-stack.md`: las trampas de Expo, Maestro y el emulador.
5. `perfiles/expo-supabase/LEEME.md`: cómo se aplica el perfil, en cinco pasos como mucho.
6. Lo que sea de esta app (dominio, nombres de tablas, datos de ejemplo de hábitos y tareas, identificadores de Vercel y Supabase) se quita o pasa a variables con ejemplo.

## Fuera de alcance

- El código de la app (`src/`, migraciones) y otros stacks.

## Criterio de hecho

- `grep -rniE 'app-desarrollo-personal|ADP-[0-9]|/home/|habit|hábito'` sobre `perfiles/` no da resultados.
- Los workflows del perfil pasan `actionlint` (con Docker, sin instalar nada en el sistema).
- PR contra `main` de la plantilla.

## Cómo informar al terminar

Qué se copió, qué se quitó o parametrizó, dudas y el enlace al PR.
