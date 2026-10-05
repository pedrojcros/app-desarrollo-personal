# Plan

Lo que `/ejecutar-plan` ejecuta. Lo escribe el arquitecto con el humano (sesión 7) y no se retoca a mano durante la ejecución: si cambia, se vuelve a `/arquitecto`.

## Estado del plan

| Campo | Valor |
|---|---|
| Estado | `EN BORRADOR` |
| Aprobado el | — |
| Aprobado por | — |
| Palabras del humano al aprobar | — |
| Modo de seguimiento de tareas | Jira (`ADP`), decidido en DEC-02 |

Estados posibles: `EN BORRADOR` → `APROBADO` → `EN EJECUCIÓN` → `CERRADO`. Solo el arquitecto, con la aprobación expresa del humano, pasa de borrador a aprobado.

## Plan listo para ejecutar

Todas las casillas marcadas, o el orquestador se niega a ejecutar.

- [ ] La visión y el **fuera de alcance** están escritos y el humano los suscribe
- [ ] Cada funcionalidad IMPRESCINDIBLE tiene criterio de aceptación y, si lo necesita, caso de uso
- [ ] Cada funcionalidad IMPRESCINDIBLE está cubierta por al menos una tarea (trazabilidad abajo)
- [ ] Las ADR de las decisiones de arquitectura caras de cambiar están escritas
- [ ] `AGENTS.md` tiene stack, prohibiciones, comandos y convenciones rellenados (ninguna casilla `RELLENAR`)
- [ ] Las decisiones del humano que bloquean tareas están cerradas en [decisiones](decisiones.md)
- [ ] La [lista de defaults](agentes/checklist-defaults.md) está recorrida: cada punto aceptado, ajustado o descartado con motivo
- [ ] Los riesgos principales tienen mitigación **y** contingencia
- [ ] La primera tarea es el esqueleto, a cargo de un solo agente
- [ ] Cada tarea tiene objetivo, criterio de hecho, dependencias, contrato (si lo necesita) y sugerencia de agente
- [ ] Los recursos compartidos o numerados (migraciones, ficheros comunes) están reservados por tarea
- [ ] Lo que nunca se delega está escrito en [agentes/orquestador](agentes/orquestador.md)
- [ ] [Agentes disponibles](agentes/agentes-disponibles.md) está al día y cada agente probado
- [ ] Jira comprobado en el equipo de ejecución (o modo sin-jira decidido)
- [ ] Política de merge y tope de paralelismo decididos
- [ ] La entrada final está en la bitácora de [contexto](contexto.md)

## Cómo se lee este plan

- Una **tarea** es una unidad de valor que se puede probar entera. El orquestador la parte en uno o varios **encargos** para los agentes.
- Los **identificadores `Tnn`** no se reutilizan.
- Tamaño: **S** (menos de media jornada de agente), **M** (una jornada), **L** (se parte antes de ejecutar).
- *Agente sugerido*: `barato` (acotado y mecánico), `claude` (transversal o de razonamiento), `humano` (no se delega), más `+revisión` si necesita segunda opinión de un agente distinto.
- Una tarea solo puede lanzarse cuando todas sus dependencias están **fusionadas**, no solo hechas.

## Olas previstas

Agrupación orientativa de qué puede ir en paralelo. El orquestador la recalcula con el estado real.

| Ola | Tareas | Paralelismo | Condición para pasar a la siguiente |
|---|---|---|---|
| 0 | T01 | 1 (esqueleto, un solo agente, revisión entera del humano) | T01 fusionada |
| 1 | | | |

**Hitos de versión** (qué olas dejan `develop` listo para pasar a `main`, decide el humano): RELLENAR

## Tareas

### T01 — Esqueleto del proyecto

- **Objetivo:** el proyecto vacío pero arrancable: estructura de carpetas, un comando que lo levanta, tests y linter funcionando, CI en verde, y un caso trivial de extremo a extremo.
- **Funcionalidades:** —
- **Depende de:** nada
- **Tamaño:** M · **Agente sugerido:** `claude` (+ revisión del humano línea a línea)
- **Contrato:** —
- **Reserva:** —
- **Hecho cuando:** con un comando se levanta todo en local, `tests` y `lint` pasan, y CI pasa en el PR.
- **Estado:** RELLENAR (solo en modo sin-jira; con Jira, vive allí) · **Ticket:** ADP-

### T02 — Nombre

- **Objetivo:**
- **Funcionalidades:** RF-
- **Depende de:** T01
- **Tamaño:** · **Agente sugerido:**
- **Contrato:**
- **Reserva:**
- **Hecho cuando:**
- **Estado:** · **Ticket:**

## Trazabilidad

Cada funcionalidad imprescindible, cubierta.

| Funcionalidad | Tareas |
|---|---|
| RF-01 | T02 |

## Tareas que no se delegan

Escritas aquí y en [agentes/orquestador](agentes/orquestador.md#lo-que-nunca-se-delega).

| Tarea | Por qué la hace el humano | Qué prepara antes el orquestador |
|---|---|---|
| | | |
