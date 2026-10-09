# Documentación

Toda la documentación del proyecto vive aquí, versionada junto al código. Está escrita para que la lea una persona; los agentes de IA la leen igual.

**Si vuelves al proyecto después de un tiempo, desde donde sea, empieza por [contexto.md](contexto.md).**

## Índice

| Documento | Qué contiene |
|---|---|
| [contexto](contexto.md) | Estado actual, lo siguiente, lo pendiente y la bitácora con toda la traza del proyecto |
| [01-vision-y-alcance](01-vision-y-alcance.md) | Qué se construye, para quién, qué NO se construye, cómo se sabe que está terminado |
| [02-funcionalidades](02-funcionalidades.md) | Registro de funcionalidades y requisitos no funcionales, con prioridad y criterio de aceptación |
| [03-casos-de-uso](03-casos-de-uso.md) | Interacciones paso a paso, con flujos alternativos y excepciones |
| [plantilla-caso-de-uso](plantilla-caso-de-uso.md) | Formato estándar de los casos de uso: convenciones y plantilla |
| [04-arquitectura](04-arquitectura.md) | Forma del sistema, stack, convenciones transversales, estrategia de pruebas, glosario |
| [05-plan](05-plan.md) | Tareas, dependencias, reparto y estado del plan. Lo que ejecuta `/ejecutar-plan` |
| [06-riesgos](06-riesgos.md) | Riesgos con mitigación y contingencia |
| [decisiones](decisiones.md) | Registro de decisiones: lo que espera respuesta y lo ya cerrado |
| [buzon](buzon.md) | Ideas y tareas que deja el humano; el orquestador las procesa |
| [adr/](adr/README.md) | Decisiones de arquitectura, una por fichero, con sus consecuencias negativas |
| [agentes/](agentes/orquestador.md) | Cómo se organiza el trabajo con agentes: arquitecto, orquestador, Orca, Jira |

## Qué leer según la tarea

Para no cargar toda la documentación en cada tarea:

| Si la tarea es de... | Lee |
|---|---|
| Cualquier cosa | `AGENTS.md` y el encargo |
| Decidir qué hacer a continuación | contexto y 05-plan |
| Entender qué hay que construir | 01-vision-y-alcance y el caso de uso correspondiente de 03 |
| Una funcionalidad concreta | su entrada en 02-funcionalidades y su caso de uso |
| Estructura, convenciones o tecnología | 04-arquitectura y las ADR que cite |
| Algo que no está decidido | decisiones, antes de preguntar |
| Planificar o replanificar | agentes/arquitecto y agentes/checklist-defaults |
| Repartir trabajo | agentes/orquestador, agentes/orca, agentes/jira y, si algo se tuerce, agentes/trampas |

## Reglas de mantenimiento

1. **Enlaza, no copies.** Si algo ya está escrito en otro documento, se enlaza.
2. **Cada cambio de código actualiza su documento en el mismo commit.** Documentación obsoleta es peor que ninguna.
3. **Las ADR no se editan.** Si una decisión cambia, se escribe una nueva que sustituye a la anterior.
4. **Si un documento y el código se contradicen, es un fallo.** Se decide cuál está bien y se corrige el otro.
5. **Una sola fuente por dato.** El estado de las tareas vive en un único sitio (ver [agentes/jira](agentes/jira.md)); el estado general, solo en `contexto.md`.
6. **Los identificadores no se reutilizan** (`RF-nn`, `CU-nn`, `Tnn`, `DEC-nn`, `ADR-nnnn`, `R-nn`), aunque se borre lo que identificaban.
