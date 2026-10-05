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

- [x] La visión y el **fuera de alcance** están escritos y el humano los suscribe (DEC-08, DEC-09, DEC-19)
- [x] Cada funcionalidad IMPRESCINDIBLE tiene criterio de aceptación y, si lo necesita, caso de uso
- [x] Cada funcionalidad IMPRESCINDIBLE está cubierta por al menos una tarea (trazabilidad abajo)
- [x] Las ADR de las decisiones de arquitectura caras de cambiar están escritas (0001 a 0004)
- [x] `AGENTS.md` tiene stack, prohibiciones, comandos y convenciones rellenados (ninguna casilla `RELLENAR`)
- [ ] Las decisiones del humano que bloquean tareas están cerradas en [decisiones](decisiones.md) *(falta el «ok» a DEC-21)*
- [x] La [lista de defaults](agentes/checklist-defaults.md) está recorrida: cada punto aceptado, ajustado o descartado con motivo
- [x] Los riesgos principales tienen mitigación **y** contingencia
- [x] La primera tarea es el esqueleto, a cargo de un solo agente
- [x] Cada tarea tiene objetivo, criterio de hecho, dependencias, contrato (si lo necesita) y sugerencia de agente
- [x] Los recursos compartidos o numerados (migraciones, ficheros comunes) están reservados por tarea
- [x] Lo que nunca se delega está escrito en [agentes/orquestador](agentes/orquestador.md)
- [x] [Agentes disponibles](agentes/agentes-disponibles.md) está al día y cada agente habilitado probado (solo Claude; Codex y Copilot, deshabilitados hasta P01)
- [x] Jira comprobado en el equipo de ejecución
- [x] Política de merge y tope de paralelismo decididos
- [x] La entrada final está en la bitácora de [contexto](contexto.md)

## Cómo se lee este plan

- Una **tarea** es una unidad de valor que se puede probar entera. El orquestador la parte en uno o varios **encargos** para los agentes.
- Los **identificadores `Tnn`** no se reutilizan. `Pnn` son tareas de preparación y `Hnn` tareas del humano.
- Tamaño: **S** (menos de media jornada de agente), **M** (una jornada), **L** (se parte antes de ejecutar).
- *Agente sugerido*: `claude` es un trabajador Claude con Sonnet 5.5; `+revisión` pide una segunda opinión de otro modelo (Opus 5.5, o Codex cuando funcione).
- *Puerta*: `requiere-plan` o `requiere-revisión` del humano (DEC-12); «—» si no tiene.
- Una tarea solo puede lanzarse cuando todas sus dependencias están **fusionadas**, no solo hechas.
- **Solo T01 toca `package.json`.** Si otra tarea necesita un script o una dependencia, para y lo dice.

## Olas previstas

Agrupación orientativa de qué puede ir en paralelo. El orquestador la recalcula con el estado real.

| Ola | Tareas | Paralelismo | Condición para pasar a la siguiente |
|---|---|---|---|
| 0 | T01 (y P01 aparte, sin bloquear) | 1 trabajador | T01 fusionada tras la revisión del humano |
| 1 | T02, T03 | 2 | T02 fusionada tras la revisión del humano, y T03 fusionada |
| 2 | T04, T07, T08 | 3 | Las tres fusionadas |
| 3 | T05, T06, T09 | 3 | Las tres fusionadas |
| 4 | T10, T11, T12 | 3 | Las tres fusionadas (T12 necesita H02) |
| 5 | T13 | 1 | Fusionada: la versión 1 está completa |

**Hitos de versión:**

- **Versión 1 (`v1.0.0`)**: olas 0 a 5 fusionadas en `develop` y la comprobación de «Preparar una versión para `main`» del [orquestador](agentes/orquestador.md#preparar-una-versión-para-main) superada. El humano pasa `develop` a `main` (H04).
- **Versiones 1.x**: cada funcionalidad deseable, o un grupo pequeño, cuando el humano quiera (ver «Después de la versión 1»).

## Tareas

### P01 — Arreglar Codex y probar Copilot en Orca

- **Objetivo:** que `codex` reciba el encargo al lanzarlo con Orca (hoy falla en `agent_readiness`) y que `copilot` pase la prueba de arranque. Si se consigue, se habilitan en [agentes disponibles](agentes/agentes-disponibles.md).
- **Funcionalidades:** — · **Depende de:** nada; no bloquea ninguna tarea
- **Tamaño:** S · **Agente sugerido:** el orquestador (investigación, no es código de producción); el humano si hay que tocar la configuración de Orca
- **Hecho cuando:** los dos agentes superan la prueba de arranque, o queda escrito por qué no y DEC-04 se cierra con «solo Claude».
- **Avance (2026-10-06):** causas encontradas y verificadas; los dos agentes funcionan con aprobaciones manuales. Falta aplicar los ajustes (DEC-21, punto 10) y repetir la prueba sin aprobar nada a mano.
- **Puerta:** — · **Ticket:** ADP-

### T01 — Esqueleto del proyecto

- **Objetivo:** el proyecto vacío pero arrancable: Next.js con TypeScript estricto y Tailwind; ESLint y Prettier; Vitest y Playwright; Supabase CLI con la base de datos local; `/api/health`; la navegación con enlaces a todas las vistas (páginas vacías: `/hoy`, `/bandeja`, `/categorias`, `/pendientes`, `/historial`); los scripts de los comandos de `AGENTS.md`; `.nvmrc`, `.env.example`, cabeceras de seguridad, README con «cómo arrancar», e integración continua (lint, tipos, unitarias, integración con Supabase local, extremo a extremo, build y gitleaks).
- **Funcionalidades:** — (base de todas) · **Depende de:** H01
- **Tamaño:** M · **Agente sugerido:** `claude`
- **Contrato:** los comandos y la estructura de `AGENTS.md`; la tabla de stack, con las versiones mayores que fije.
- **Reserva:** `package.json`, `.github/workflows/`, `supabase/config.toml`, `src/app/layout.tsx` y `src/components/navigation/`. Nadie más los toca sin reserva.
- **Hecho cuando:** con `npx supabase start` y `npm run dev` se levanta todo; los comandos de `AGENTS.md` funcionan; un test de extremo a extremo abre `/hoy` y `/api/health` responde; la integración continua pasa en el PR; `AGENTS.md` tiene las versiones reales.
- **Puerta:** `requiere-revisión` (el humano lo revisa entero) · **Ticket:** ADP-

### T02 — Base de datos y acceso de un solo usuario

- **Objetivo:** las tablas del [modelo de datos](04-arquitectura.md#modelo-de-datos) con sus restricciones y políticas RLS; inicio de sesión con email y contraseña ([ADR-0004](adr/0004-acceso-un-usuario.md)); todas las rutas protegidas salvo `/login` y `/api/health`; registro desactivado; tipos de TypeScript generados de la base de datos.
- **Funcionalidades:** base de todas; RNF-02 · **Depende de:** T01
- **Tamaño:** M · **Agente sugerido:** `claude` `+revisión`
- **Contrato:** el modelo de datos de [04-arquitectura](04-arquitectura.md#modelo-de-datos) es el contrato del resto de tareas.
- **Reserva:** **todas las migraciones de la versión 1** (`supabase/migrations/`); `src/data/supabase/`; `src/data/database.types.ts`; el middleware de rutas; `src/app/login/`.
- **Hecho cuando:** un test de integración con dos usuarios demuestra que uno no ve ni cambia los datos del otro; sin sesión no se accede a nada; la integración continua pasa.
- **Puerta:** `requiere-revisión` (seguridad) · **Ticket:** ADP-

### T03 — Motor de fechas y ocurrencias

- **Objetivo:** en `src/domain`, una función pura que, para un hábito con sus versiones de regla, devuelve sus ocurrencias en un rango de fechas, con las cuatro frecuencias, y el orden del día por hora o franja ([ADR-0003](adr/0003-ocurrencias-calculadas.md)).
- **Funcionalidades:** RF-02, RF-03 (orden) · **Depende de:** T01
- **Tamaño:** M · **Agente sugerido:** `claude` `+revisión`
- **Contrato:** los tipos de `src/domain/types.ts`, que escribe el orquestador en el encargo.
- **Reserva:** `src/domain/types.ts`, `src/domain/calendar-date.ts`, `src/domain/recurrence.ts`.
- **Hecho cuando:** pasan los escenarios 2, 3 y 4 de CU-01 como tests; hay tests de los cambios de hora (último domingo de marzo y de octubre), de fin de mes y año bisiesto, de «cada N días» y de un cambio de regla que no altera el pasado; cobertura de líneas de `src/domain` de al menos el 90 %.
- **Puerta:** — · **Ticket:** ADP-

### T04 — Gestión de categorías

- **Objetivo:** crear y eliminar categorías (lo que contienen pasa a la Bandeja de entrada); un selector de categoría reutilizable para los formularios.
- **Funcionalidades:** RF-20 (crear), RF-21 · **Depende de:** T02
- **Tamaño:** S · **Agente sugerido:** `claude`
- **Contrato:** el componente `CategorySelect` y las funciones de `src/data/categories.ts`, con las firmas que escribe el orquestador.
- **Reserva:** `src/data/categories.ts`, `src/components/category-select/`, `src/app/categorias/page.tsx`.
- **Hecho cuando:** pasan los escenarios 1, 2, 3 y 5 de CU-07.
- **Puerta:** — · **Ticket:** ADP-

### T05 — Hábitos: crear, modificar y archivar

- **Objetivo:** el formulario de hábito con las cuatro frecuencias, hora o franja y categoría; modificar (un cambio de frecuencia crea una versión nueva de la regla); archivar.
- **Funcionalidades:** RF-01, RF-03, RF-18 y RF-19 (hábitos), RF-20 (asignar) · **Depende de:** T02, T03, T04
- **Tamaño:** M · **Agente sugerido:** `claude`
- **Reserva:** `src/data/habits.ts`, `src/app/habitos/`.
- **Hecho cuando:** pasan los escenarios 1, 5 y 6 de CU-01 y los de CU-06 aplicados a hábitos.
- **Puerta:** — · **Ticket:** ADP-

### T06 — Tareas: crear, modificar y archivar

- **Objetivo:** el formulario de tarea (nombre, notas, fecha, hora y categoría; sin categoría, a la Bandeja); avisar si la fecha es pasada; modificar y archivar.
- **Funcionalidades:** RF-05, RF-18 y RF-19 (tareas), RF-20 (asignar) · **Depende de:** T02, T04
- **Tamaño:** S · **Agente sugerido:** `claude`
- **Reserva:** `src/data/tasks.ts`, `src/app/tareas/`.
- **Hecho cuando:** pasan los escenarios 1 a 5 de CU-02 y los de CU-06 aplicados a tareas.
- **Puerta:** — · **Ticket:** ADP-

### T07 — Cambiar el estado y aviso con «Deshacer»

- **Objetivo:** las acciones para marcar hecho, no hecho o volver a pendiente (ocurrencias y tareas, guardando cuándo) y el componente de aviso con «Deshacer» que usarán todas las vistas.
- **Funcionalidades:** RF-06, RF-07 · **Depende de:** T02, T03
- **Tamaño:** S · **Agente sugerido:** `claude`
- **Contrato:** las firmas de las acciones y del componente de aviso, que escribe el orquestador; las consumen T09, T10 y T11.
- **Reserva:** `src/data/marks.ts`, `src/components/toast/`.
- **Hecho cuando:** pasan como tests de integración los escenarios 1, 2, 9 y 10 de CU-03 (sin la pantalla de Hoy, con un componente de prueba).
- **Puerta:** — · **Ticket:** ADP-

### T08 — Historial

- **Objetivo:** la vista del historial por rango (7 días por defecto), con el estado final de cada hábito y tarea, incluido «sin marcar».
- **Funcionalidades:** RF-15 · **Depende de:** T02, T03
- **Tamaño:** M · **Agente sugerido:** `claude`
- **Reserva:** `src/domain/views/history.ts`, `src/data/history.ts`, `src/app/historial/`.
- **Hecho cuando:** pasan los escenarios 1, 3, 4 y 5 de CU-05.
- **Puerta:** — · **Ticket:** ADP-

### T09 — Vista Hoy

- **Objetivo:** lo pendiente de hoy (ocurrencias y tareas con fecha de hoy), ordenado por hora o franja, nunca sin fecha ni vencido; marcar con aviso y «Deshacer»; mensaje de día libre.
- **Funcionalidades:** RF-08 · **Depende de:** T03, T07
- **Tamaño:** M · **Agente sugerido:** `claude`
- **Reserva:** `src/domain/views/today.ts`, `src/app/hoy/`.
- **Hecho cuando:** pasan los escenarios 1 a 6 y 10 de CU-03.
- **Puerta:** — · **Ticket:** ADP-

### T10 — Vista de categoría y Bandeja de entrada

- **Objetivo:** lo pendiente de una categoría o de la Bandeja, con y sin fecha; marcar desde ahí (lo marcado desaparece) con aviso y «Deshacer».
- **Funcionalidades:** RF-11 · **Depende de:** T04, T07
- **Tamaño:** S · **Agente sugerido:** `claude`
- **Reserva:** `src/domain/views/category.ts`, `src/app/bandeja/`, `src/app/categorias/[id]/`.
- **Hecho cuando:** pasan los escenarios 5 y 6 de CU-03 en la vista de categoría.
- **Puerta:** — · **Ticket:** ADP-

### T11 — Pendientes de días anteriores

- **Objetivo:** la lista de ocurrencias sin marcar y tareas vencidas, agrupada por día, de la más reciente a la más antigua, para marcarlas.
- **Funcionalidades:** RF-12 · **Depende de:** T03, T07
- **Tamaño:** M · **Agente sugerido:** `claude`
- **Reserva:** `src/domain/views/past-pending.ts`, `src/app/pendientes/`.
- **Hecho cuando:** pasa el escenario 1 de CU-04 y, sin nada pendiente, se muestra «todo al día».
- **Puerta:** — · **Ticket:** ADP-

### T12 — Despliegue, migraciones y copia de seguridad

- **Objetivo:** Vercel desplegando `develop` y los PR contra Supabase `pruebas`, y `main` contra `produccion`; la integración continua aplica las migraciones a `pruebas` al fusionar en `develop`, y a `produccion` solo desde `main`; exportación semanal automática de los datos; el README explica cómo restaurar y cómo reactivar Supabase si se pausa.
- **Funcionalidades:** RNF-04 · **Depende de:** T02 y **H02**
- **Tamaño:** M · **Agente sugerido:** `claude`
- **Reserva:** `.github/workflows/deploy-*.yml` y `.github/workflows/backup.yml` (T01 reserva el resto de flujos), `scripts/backup/`.
- **Hecho cuando:** un PR obtiene su despliegue de prueba; una exportación se restaura en local con los mismos datos.
- **Puerta:** — · **Ticket:** ADP-

### T13 — Caminos críticos y calidad

- **Objetivo:** pruebas de extremo a extremo de los caminos críticos; el script de datos sintéticos de un año; las comprobaciones de RNF-01, RNF-03 y RNF-06.
- **Funcionalidades:** RNF-01, RNF-03, RNF-06 · **Depende de:** T05, T06, T09, T10, T11
- **Tamaño:** M · **Agente sugerido:** `claude`
- **Reserva:** `tests/e2e/` (salvo el test trivial de T01), `scripts/seed/`.
- **Hecho cuando:** las pruebas pasan en la integración continua y RNF-01, RNF-03 y RNF-06 se cumplen con sus números.
- **Puerta:** — · **Ticket:** ADP-

## Trazabilidad

| Funcionalidad | Tareas |
|---|---|
| RF-01 | T05 |
| RF-02 | T03 |
| RF-03 | T03, T05 |
| RF-05 | T06 |
| RF-06 | T07 |
| RF-07 | T07 |
| RF-08 | T09 |
| RF-11 | T10 |
| RF-12 | T11 |
| RF-15 | T08 |
| RF-18 | T05, T06 |
| RF-19 | T05, T06 |
| RF-20 | T04, T05, T06 |
| RF-21 | T04 |
| RNF-01, RNF-03, RNF-06 | T13 |
| RNF-02 | T02 |
| RNF-04 | T12 |
| RNF-05 | ADR-0001 |
| RNF-07 | T03 |
| RNF-08 | Versión 2 |

## Tareas que no se delegan

Escritas aquí y en [agentes/orquestador](agentes/orquestador.md#lo-que-nunca-se-delega).

| Tarea | Por qué la hace el humano | Qué prepara antes el orquestador |
|---|---|---|
| H01 — Que `git push` funcione desde las sesiones de los agentes | Es la configuración de su cuenta (lo puede hacer el arquitecto si el humano dice «ok» a DEC-21) | El comando exacto |
| H02 — Crear la cuenta de Vercel (conectada al repositorio) y los proyectos Supabase `pruebas` y `produccion`; poner las claves en Vercel y en GitHub; crear su usuario en producción | Son sus cuentas y sus secretos | Los pasos y los nombres exactos de las variables (T12) |
| H03 — Revisar T01 y T02 antes de fusionar | Puerta `requiere-revisión` | Un resumen y el diff |
| H04 — Publicar la versión 1: `develop` a `main`, etiqueta y migraciones a producción | Solo el humano toca `main` | La comprobación de «Preparar una versión para `main`» |

## Después de la versión 1

Las deseables, en este orden sugerido (cada una, una versión 1.x cuando el humano quiera):

| Orden | Funcionalidad | Por qué en este orden |
|---|---|---|
| 1 | RF-13 Reprogramar una tarea vencida | Es lo que más alivia los pendientes |
| 2 | RF-09 «Marcadas hoy» y RF-17 Corregir desde el historial | Correcciones |
| 3 | RF-10 Ver otros días | Ver lo que viene |
| 4 | RF-14 Marcar un día entero como no hecho | Atajo |
| 5 | RF-16 Filtrar el historial y RF-22 Renombrar categoría | Comodidad |
| 6 | RF-04 Duración | Solo sirve con Google Calendar (versión 2) |
