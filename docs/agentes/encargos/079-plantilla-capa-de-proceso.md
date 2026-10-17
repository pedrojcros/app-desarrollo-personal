# Encargo 079 — Plantilla: esqueleto y capa de proceso

| Campo | Valor |
|---|---|
| Tarea del plan | Plantilla para proyectos de pago ([propuesta](../../propuestas/plantilla.md), DEC-60 y DEC-61) |
| Ticket | Sin ticket |
| Agente | **El orquestador** (DEC-57: es lo compartido de lo que dependen el 080, el 081 y el 082) |
| Modelo y esfuerzo | Opus 5.5, esfuerzo alto |
| Skills a usar | `cognitive-doc-design` |
| Repositorio | `pedrojcros/template-multiagents-develop` (privado, vacío). Flujo propio de la plantilla: rama `main`, un PR por encargo y etiquetas de versión |
| Rama y worktree | `docs/capa-de-proceso`, desde `main` |
| Depende de | PR #103 fusionado en `develop` de la app |
| Reservado para este encargo | `AGENTS.md`, `CLAUDE.md`, `README.md`, `.claude/`, `docs/` y `.agents/skills/` de la plantilla |

## Antes de empezar

1. Clona la plantilla y registra el repositorio en Orca.
2. Primer commit en `main`, directo y solo con un `README.md` de una línea, para que los demás encargos tengan de dónde partir. Es la única excepción a «todo por PR».
3. Lee la [propuesta](../../propuestas/plantilla.md) entera: sus secciones 2 y 3 dicen qué pasa y cómo.

## Objetivo

Que la plantilla tenga la **capa de proceso** completa y sin nada de esta app: un proyecto nuevo que la copie puede empezar `/arquitecto` el primer día.

## Qué hacer

1. **Copia** desde `develop` de la app lo que la sección 3 de la propuesta marca como «pasa tal cual o casi».
2. **`AGENTS.md`:** deja las prohibiciones, la regla de legibilidad, el flujo de git, las convenciones generales y las skills. Lo que dependa del stack (tabla de versiones, estructura de `src/`, comandos de Docker) se sustituye por una sección «Perfil de stack», con un enlace a `perfiles/` (lo rellena el 081).
3. **Documentos base de `docs/`:** esqueletos vacíos con sus encabezados y una línea de instrucciones en cada sección. `contexto.md` empieza en «Proyecto recién creado», `bitacora.md` y `buzon.md` vacíos, y `decisiones.md` con su «Cómo se usa» y sin decisiones.
4. **Las decisiones de proceso se escriben como reglas, sin su historia:** DEC-12, 36, 39, 45, 50, 54, 57 y 58 quedan como texto normativo en `orquestador.md`, `arquitecto.md` y `plantilla-encargo.md`. Se puede citar «DEC-57» solo si `docs/decisiones.md` de la plantilla la recoge en una tabla «Decisiones de proceso heredadas». Hazlo así: una fila por cada una, con una línea.
5. **DEC-57 y DEC-58 entran marcadas «a prueba»** hasta la retrospectiva de la 1.2 de la app (DEC-61, punto 3).
6. **`codigo-legible`:** la regla es general; los ejemplos de TypeScript se quedan como ejemplo, avisando de que el perfil de stack puede cambiarlos.
7. **`trampas.md`:** solo las generales (Orca, worktrees, supervisor, cuotas, Copilot, git). Las de Expo, Maestro y el emulador las mueve el 081.

## Fuera de alcance

- Los scripts y la CI (encargo 080), el perfil de stack (081) y los documentos de proyecto de pago (082).
- Mejorar el proceso: se copia lo aprobado, no se rediseña. Las dudas van al informe.

## Criterio de hecho

- `grep -rniE 'app-desarrollo-personal|ADP-[0-9]|expo|supabase|maestro|habit|hábito'` sobre la plantilla no da resultados fuera de `perfiles/` y de los ejemplos marcados como ejemplo.
- Ni rutas de `/home/`, ni correos, ni URLs de Vercel o Supabase del humano.
- `/arquitecto` se puede leer de principio a fin en la plantilla sin enlaces rotos (comprobado con una búsqueda de enlaces relativos).
- PR contra `main` de la plantilla, con la lista de qué pasó y qué se quitó.

## Cómo informar al terminar

Qué se copió, qué se generalizó, qué dudas quedan y el enlace al PR.
