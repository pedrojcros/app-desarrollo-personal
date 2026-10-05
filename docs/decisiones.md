# Decisiones

Todo lo que está esperando una decisión del humano, y lo ya cerrado, en un solo sitio. Existe porque el contexto de las conversaciones con los agentes se borra y las decisiones no pueden vivir en un chat.

## Cómo se usa

Cada decisión tiene opciones y una **recomendación**. El humano marca la casilla que elija (`[x]`) o escribe en **Respuesta**. Si una decisión no está madura, se deja en blanco.

Cuando una decisión se cierra:

1. Se aplica al documento donde vive de verdad.
2. Se mueve a la tabla de cerradas.
3. Si es costosa de cambiar, se escribe una [ADR](adr/README.md).

**Este documento nunca es la fuente de la verdad**, solo el sitio donde se recogen las respuestas. Los identificadores `DEC-nn` no se reutilizan.

**Decisiones de bolsillo** (reversibles y baratas) las toma el arquitecto o el orquestador y se anotan directamente en la tabla de cerradas, con la etiqueta *de bolsillo*.

---

## Abiertas

### DEC-04 — Agentes habilitados y para qué

**Respuesta parcial (2026-10-05):** se usarán Claude Code, Codex y Copilot CLI. **Falta confirmar** que los tres arrancan desde Orca y que el orquestador se comunica con ellos de forma limpia y sencilla (prueba de arranque de [agentes-disponibles](agentes/agentes-disponibles.md)). Comprobado el 2026-10-05: los tres están instalados y Orca tiene id para los tres (`claude`, `codex`, `copilot`). Prueba real: **`claude` funciona** (y ve Jira desde Orca); **`codex` falla** en `agent_readiness` y no recibe el encargo; `copilot` sin probar. Falta lanzarlos de verdad (ver [agentes-disponibles](agentes/agentes-disponibles.md)). Se está investigando además qué IA gratuita o local podría ayudar con archivos locales; el humano decide después si se añade alguna.

*Dónde acaba:* `agentes/agentes-disponibles.md`.

### DEC-07 — Fecha límite de la versión 1

Sin fecha no hay freno natural al alcance. Aunque sea inventada, se pone una. Se cierra cuando esté definida la visión.

- Fecha objetivo →
- Qué se recorta primero si no llega →

**Respuesta:**

*Dónde acaba:* `01-vision-y-alcance.md` y `06-riesgos.md`.

---

## Cerradas

| # | Decisión | Resultado | Dónde quedó |
|---|---|---|---|
| DEC-01 | Flujo de git y política de merge | Todo por rama y PR contra `develop`. El **orquestador fusiona a `develop`** si pasan los tests y la revisión; los trabajadores nunca fusionan. **El paso de `develop` a `main` lo hace solo el humano.** A `main` solo llegan versiones estables y completas, publicadas cada cierto tiempo. Un worktree por encargo y PR sin apilar. | `AGENTS.md` (Flujo de git), `agentes/orquestador.md` (Política de merge, pendiente de revisar) |
| DEC-02 | Seguimiento de tareas | **Jira activo**, proyecto `ADP` (team-managed, Kanban, acceso restringido). Estados: Por hacer, En curso, En revisión, Listo. El conector se configura antes del primer `/ejecutar-plan`. | `agentes/jira.md` |
| DEC-03 | Tope de trabajadores en paralelo | 3 | `agentes/orquestador.md` (método, punto 6) |
| DEC-08 | Alcance de la versión 1 | Tareas con y sin fecha, **hábitos recurrentes**, estado hecho/no hecho y vista del historial. **Fuera:** estadísticas interactivas y recordatorios (se dejan para después, diseñando los datos para poder añadirlos), otros usuarios e integración con Todoist. | `01-vision-y-alcance.md` |
| DEC-09 | Plataforma y versión siguiente | Versión 1 **solo en ordenador**. La versión siguiente trae **móvil y conexión con Google Calendar, juntos**; la arquitectura de la 1 no debe impedirlos. | `01-vision-y-alcance.md`; a tener en cuenta en la sesión 5 (arquitectura) |
| DEC-05 | Regla de legibilidad | Se mantiene. Los agentes escriben los nombres del código **siempre en inglés** y legible para humanos. | `AGENTS.md` (Legibilidad) |
| DEC-06 | Idioma | **Nombres de código y mensajes de error en inglés. Comentarios, commits y documentación en español.** | `AGENTS.md` (Convenciones de código) |
