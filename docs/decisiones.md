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

### DEC-16 — Stack y plataformas (se decide en la sesión 5, con el humano)

**Lo que ha dicho el humano (2026-10-06):** no decidir el stack todavía. Quiere una **web para el ordenador** y una **app móvil publicada en Google Play**, y que **le salga gratis**. Su idea: Vercel y Supabase con sus planes gratuitos, aunque no sea tan bueno como un servidor de pago.

**Datos comprobados para decidir (2026-10-06):**

- **Google Play no es gratis:** la cuenta de desarrollador cuesta **25 USD, un solo pago**. Además, una cuenta personal nueva tiene que pasar una **prueba cerrada con al menos 12 personas durante 14 días seguidos** antes de poder publicar.
- **Supabase gratis:** 2 proyectos y 500 MB de base de datos; **se pausa tras 7 días sin uso** (conserva los datos, pero hay que reactivarlo a mano).
- **Vercel gratis (Hobby):** solo para uso **personal y no comercial**.

**Falta saber:** qué lenguajes conoce o quiere aprender el humano, y dónde funciona la versión 1 (en local o ya en internet).

**Respuesta:**

*Dónde acaba:* `04-arquitectura.md`, ADR, `AGENTS.md` (Stack) y `06-riesgos.md`.

---

## Cerradas

| # | Decisión | Resultado | Dónde quedó |
|---|---|---|---|
| DEC-01 | Flujo de git y política de merge | Todo por rama y PR contra `develop`. El **orquestador fusiona a `develop`** si pasan los tests y la revisión; los trabajadores nunca fusionan. **El paso de `develop` a `main` lo hace solo el humano.** A `main` solo llegan versiones estables y completas, publicadas cada cierto tiempo. Un worktree por encargo y PR sin apilar. | `AGENTS.md` (Flujo de git), `agentes/orquestador.md` (Política de merge, pendiente de revisar) |
| DEC-02 | Seguimiento de tareas | **Jira activo**, proyecto `ADP` (team-managed, Kanban, acceso restringido). Estados: Por hacer, En curso, En revisión, Listo. El conector se configura antes del primer `/ejecutar-plan`. | `agentes/jira.md` |
| DEC-03 | Tope de trabajadores en paralelo | 3 | `agentes/orquestador.md` (método, punto 6) |
| DEC-08 | Alcance de la versión 1 | Tareas con y sin fecha, **hábitos recurrentes**, estado hecho/no hecho y vista del historial. **Fuera:** estadísticas interactivas y recordatorios (se dejan para después, diseñando los datos para poder añadirlos), otros usuarios e integración con Todoist. | `01-vision-y-alcance.md` |
| DEC-09 | Plataforma y versión siguiente | Versión 1 **solo en ordenador**. La versión siguiente trae **móvil y conexión con Google Calendar, juntos**; la arquitectura de la 1 no debe impedirlos. | `01-vision-y-alcance.md`; a tener en cuenta en la sesión 5 (arquitectura) |
| DEC-10 | Estados y tratamiento de lo no marcado | Tres estados: pendiente, hecha y **no hecha** (marcarla es una acción explícita). Las ocurrencias de **hábitos** no se acumulan: las de días pasados sin marcar salen de la vista de hoy y quedan como «sin marcar» en el historial, resolubles después. Las **tareas vencidas** siguen visibles hasta decidir (hecha, no hecha o reprogramada). Las tareas sin fecha no vencen. | `03-casos-de-uso.md` (RN-01 a RN-09) |
| DEC-11 | Detalle de los hábitos (CU-01) | Frecuencias de la versión 1: todos los días, días de la semana, **cada N días** (desde la fecha de inicio) y **cada mes** (mismo día del mes; si no existe, el último). Momento del día: hora exacta **o** franja (mañana 09:00, tarde 15:00, noche 21:00; el hábito guarda la franja). **Duración opcional**; sin ella, Google Calendar usará 1 hora. | `03-casos-de-uso.md` (CU-01, RN-10 a RN-12 y RN-20 a RN-23) |
| DEC-13 | Categorías en la versión 1 | **Sí, en su forma mínima**: nombre único, como máximo una por hábito o tarea, opcional; sin colores, jerarquías ni etiquetas múltiples. | `01-vision-y-alcance.md`, `03-casos-de-uso.md` (CU-07, RN-24 a RN-26) |
| DEC-14 | Dinámica de planificación | **Modo tandas**: el arquitecto redacta varias sesiones de golpe con sus recomendaciones aplicadas y entrega una sola lista numerada de decisiones con valor por defecto; el humano contesta solo lo que cambia. Lectura completa en la revisión final. Los documentos de planificación van en la rama `docs/planificacion`, con un único PR a `develop` que se fusiona al aprobar el plan. | `agentes/arquitecto.md` (Modo tandas) |
| DEC-07 | Fecha límite de la versión 1 | **Sin fecha límite.** El humano es estudiante y avanzará según su tiempo libre. No se ponen fechas salvo que él las pida expresamente. El freno al alcance es la lista de fuera de alcance y la lista de espera. | `01-vision-y-alcance.md` (Restricciones), `agentes/checklist-defaults.md` |
| DEC-12 | Orquestador autónomo | **Autonomía por niveles**: el orquestador decide el cómo; consulta a un arquitecto automático de máximo razonamiento para el diseño; el humano decide el qué, el dinero y `main`. Con **puertas de aprobación** `requiere-plan` y `requiere-revisión`, un buzón de ideas, y el orquestador como **único interlocutor** del humano. El diseño concreto, en la sesión 6. | `agentes/orquestador.md` y `agentes/arquitecto.md` (sesión 6) |
| DEC-15 | Vistas y marcado | Vista **Hoy** solo con lo de hoy y **nunca tareas sin fecha** (se retira el ajuste de categoría «mostrar en el día»). **Bandeja de entrada** para todo lo que no tiene categoría. Al marcar algo, sale de la lista con un **aviso poco invasivo y Deshacer**; en Hoy queda además en «Marcadas hoy», plegado. Se mantienen: marcar un día entero como no hecho, corregir desde el historial y eliminar = archivar, sin borrado definitivo en la versión 1. | `03-casos-de-uso.md` (RN-27 a RN-31, CU-02, CU-03, CU-05 a CU-07) |
| DEC-05 | Regla de legibilidad | Se mantiene. Los agentes escriben los nombres del código **siempre en inglés** y legible para humanos. | `AGENTS.md` (Legibilidad) |
| DEC-06 | Idioma | **Nombres de código y mensajes de error en inglés. Comentarios, commits y documentación en español.** | `AGENTS.md` (Convenciones de código) |
