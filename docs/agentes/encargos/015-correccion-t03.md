# Encargo 015 — Corrección de T03 tras la revisión independiente

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

| Campo | Valor |
|---|---|
| Tarea del plan | `T03` (corrección; T03 ya está en `develop`, PR #9) |
| Ticket | `ADP-4` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills a usar | `test-driven-development`, `codigo-legible`, `supabase-postgres-best-practices`, `flujo-git` (en `.agents/skills/`) |
| Rama y worktree | `ADP-4-correccion-motor`, desde `develop`, tu propio worktree |
| Reservado para este encargo | `src/domain/types.ts`, `src/domain/calendar-date.ts`, `src/domain/recurrence.ts` y sus tests; la migración `supabase/migrations/20261007130000_unique_habit_rule_valid_from.sql`; en `package.json` **solo** el script `test:zones`; en `.github/workflows/ci.yml` **solo** un paso nuevo tras «Tests de componentes» y `timeout-minutes` en el trabajo `quality`; y los tests de otros ficheros de `src/domain` que dejen de pasar por estas validaciones (solo sus datos de prueba) |

## Antes de empezar

Lee `AGENTS.md` entero (regla de legibilidad obligatoria, **todo en Docker** con `./docker/app/run ...`), [ADR-0003](../../adr/0003-ocurrencias-calculadas.md), CU-01 (RN-10 a RN-12, RN-20 a RN-23) y CU-06 (RN-19) en `docs/03-casos-de-uso.md`, y el código actual de `src/domain/`. Una revisión independiente (Claude Opus 5.5, esfuerzo máximo) concluyó que el algoritmo es **correcto** (oráculo independiente sin diferencias en 6000 casos, Madrid exacta cada 15 minutos de 2025 a 2027) y pidió estas correcciones. **No cambies el comportamiento correcto ni las firmas exportadas.**

## Qué corregir (decisiones del orquestador)

1. **I1 — Versiones con el mismo `validFrom`** (`recurrence.ts:91-94` y `:103-108`): hoy gana la que llegó la última, así que el resultado depende del orden. En la validación, `throw new Error('Rule versions must have distinct validFrom dates')`, con su test. Y una **migración** `20261007130000_unique_habit_rule_valid_from.sql` con `unique (habit_id, valid_from)` en `habit_rules` (comentario en español con el porqué), con un test de integración que lo compruebe. **El Supabase local es compartido**: aplícala con `./docker/app/run npx supabase migration up` (no hagas `db reset`, `stop` ni `start`).
2. **I2 — La primera versión empieza en `startDate`** (opción A de la revisión): escríbelo en el comentario de `HabitSchedule` en `types.ts` y valídalo: si el `validFrom` más antiguo no es igual a `startDate`, `throw new Error('The first rule version must start on the habit start date')`. Cambia los tests que fijaban lo contrario (`recurrence.test.ts:58-69` «clipping to startDate does not restart the rule interval» y `:260-268`) para que esperen ese error, y revisa los demás datos de prueba de `src/domain` (también los de la base común de vistas, `items`, `entities` y `habit-occurrences`, si ya están en `develop`) para que cumplan el invariante.
3. **I3 — Varias zonas horarias en la CI**: fijar `process.env.TZ` dentro de un test de Jest **no sirve** (Jest da al test una copia del entorno). Añade a `package.json` el script `test:zones`, que ejecute los tests de `src/domain` dos veces, con `TZ=Europe/Madrid` y con `TZ=America/Los_Angeles` (una zona positiva con horario de verano y una negativa), y un paso en `ci.yml` justo después de «Tests de componentes» que lo lance (`./docker/app/run npm run test:zones`). Pon `timeout-minutes: 30` en el trabajo `quality` (un bucle infinito no lo corta Jest). Escríbelo también en la sección de comandos de `AGENTS.md` (una línea).
4. **M1 — Datos corruptos** que hoy se aceptan: en la validación (con un test por caso y comprobando **el mensaje**, no solo `toThrow(Error)`): `timeOfDay` con `/^([01]\d|2[0-3]):[0-5]\d$/`; `timeSlot` dentro de `SLOT_TIMES`; `frequency` una de las cuatro (`default` que lance, con `never`); `weekdays` un array y cada valor un entero de 1 a 7 (con `weekdays: null` el error debe ser claro, no un `TypeError`).
5. **M2 — Tests de Madrid alrededor de la medianoche** (`calendar-date.test.ts:85-97`): añade estos casos de `getCalendarDateInTimeZone(instante, 'Europe/Madrid')`: `2026-01-15T22:59:59Z`→`2026-01-15`, `2026-01-15T23:00:00Z`→`2026-01-16`, `2026-03-29T21:59:59Z`→`2026-03-29`, `2026-03-29T22:00:00Z`→`2026-03-30`, `2026-07-15T21:59:59Z`→`2026-07-15`, `2026-07-15T22:00:00Z`→`2026-07-16`, `2026-10-25T22:59:59Z`→`2026-10-25`, `2026-10-25T23:00:00Z`→`2026-10-26`. Y que los tests de error miren el mensaje.
6. **M3 — Regla de legibilidad**: `calendar-date.ts:79` (una línea, una cosa); `recurrence.ts:71` y `:74` (`Number(x.slice(8, 10))` → una función `getDayOfMonth(date)` en `calendar-date.ts`); `calendar-date.ts:18` y `:39` (`toISOString().slice(0, 10)` repetido → `formatCalendarDate(instant)`); las aserciones `!` de `calendar-date.ts:76-78` (→ `getDatePart(parts, type)` que lance un `Error` claro) y `rule.intervalDays!` en `recurrence.ts:68`; el centinela `ruleIndex = -1` (`recurrence.ts:101` y `:109-110`) → `findRuleInForce(rules, date)`; `validateSchedule` con tres niveles → `validateRuleVersion(rule)` con salidas tempranas; partir `getOccurrencesInRange` (40 líneas) y `compareOccurrencesForDay`; y los **comentarios del porqué** que faltan (copiar para no mutar la entrada, la `Z` para no depender de la zona del proceso, `Date` desborda 2026-02-30 en vez de fallar, salir antes de `addDays` en 9999-12-31, RN-23 en «cada mes», Intl escribe los años menores de 1000 sin ceros).
7. **M4 — Rendimiento** (barato): guarda un `Intl.DateTimeFormat` por zona en vez de crear uno en cada llamada a `getCalendarDateInTimeZone`.

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Las correcciones 1 a 7, cada una con su test; las firmas exportadas no cambian.
- [ ] `./docker/app/run npm run test:zones` pasa en las dos zonas; lint, tipos, tests unitarios, integración y exportación web en verde dentro de Docker; CI del PR en verde (con el paso nuevo).
- [ ] Cobertura de líneas de `src/domain` ≥ 90 %.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-4` en el título. **No hagas merge.**

## Fuera de alcance

Cambiar el algoritmo (es correcto), las firmas o el modelo de datos más allá del `unique`; formularios de hábitos (T05); `src/data`; Jira; `docs/contexto.md`; otros encargos. Otro trabajador está tocando la parte de disparadores (`on:`) de `ci.yml`: **no la toques**. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
