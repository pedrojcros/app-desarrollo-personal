# Skills del proyecto

Skills (carpetas con un `SKILL.md`) que usan todos los agentes de este repositorio. Codex y Copilot las leen aquí, en `.agents/skills/`; Claude Code, a través del enlace `.claude/skills` → `.agents/skills`. Hay una sola copia.

**Mandan `AGENTS.md` y el encargo.** Si una skill dice algo distinto (ramas, idioma de los commits, dependencias, pedir cosas al humano), se sigue `AGENTS.md`.

## Origen

| Skills | De dónde salen | Licencia |
|---|---|---|
| Las 12 de la tabla siguiente | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills), commit `1401c8b` (2026-10-03) | MIT ([LICENSE-addyosmani-agent-skills](LICENSE-addyosmani-agent-skills)) |

Se copian **sin modificar**. Para actualizarlas: volver a copiarlas del repositorio de origen, revisar qué ha cambiado y anotar aquí el commit nuevo. Añadir una skill nueva necesita aprobación, igual que una dependencia.

## Incluidas: cuándo usar cada una

El orquestador dice en cada encargo qué skills usar (campo «Skills a usar» de la [plantilla](../../docs/agentes/plantilla-encargo.md)).

| Skill | Cuándo |
|---|---|
| `test-driven-development` | Siempre que se implemente lógica o se corrija un fallo: primero el test (los escenarios de los casos de uso) |
| `incremental-implementation` | Encargos que tocan más de un fichero: avanzar en pasos pequeños y comprobables |
| `api-and-interface-design` | Al definir contratos entre piezas: tipos del dominio, firmas de acciones, esquema de datos |
| `frontend-ui-engineering` | Pantallas y componentes: accesibilidad, diseño adaptable, estados de carga y error |
| `source-driven-development` | Antes de usar una API de Next.js, React o Supabase: comprobarla en la documentación oficial de la versión fijada |
| `security-and-hardening` | Inicio de sesión, RLS, validación de entradas y secretos |
| `debugging-and-error-recovery` | Cuando falla un test o algo no se comporta como se espera |
| `code-review-and-quality` | Revisar un cambio antes de fusionarlo (orquestador y revisores) |
| `code-simplification` | Código que funciona pero cuesta leer (regla de legibilidad) |
| `performance-optimization` | Cuando hay un requisito de rendimiento (RNF-01) |
| `ci-cd-and-automation` | Integración continua y despliegue |
| `shipping-and-launch` | Preparar la publicación de una versión en `main` (el orquestador, antes de proponerla) |

## No incluidas, y por qué

| Skill | Motivo |
|---|---|
| `git-workflow-and-versioning` | Propone trabajar sobre `main` y commits en inglés: choca con ADR-0002 y DEC-06 |
| `interview-me`, `idea-refine`, `constraint-driven-development`, `spec-driven-development`, `planning-and-task-breakdown` | Son para planificar con el humano: es trabajo del arquitecto, y un trabajador no puede entrevistar al humano |
| `browser-testing-with-devtools` | Necesita instalar el MCP de Chrome DevTools; aquí se prueba con Playwright |
| `doubt-driven-development` | Lanza revisores adicionales en cada decisión: más coste; el orquestador ya revisa |
| `using-agent-skills` | Reparte el trabajo hacia skills que no están aquí |
| `context-engineering` | Sirve para montar ficheros de reglas; aquí ya existen (`AGENTS.md`) |
| `documentation-and-adrs` | El proyecto tiene su propio formato de documentación y de ADR |
| `observability-and-instrumentation` | Métricas y trazas quedan fuera de la versión 1 |
| `deprecation-and-migration` | No hay nada que retirar todavía |
