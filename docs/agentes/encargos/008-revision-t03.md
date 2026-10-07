# Encargo 008 — Revisión independiente de T03 (motor de fechas y ocurrencias)

> Revisión **de solo lectura**: no cambies ningún fichero del repositorio, no hagas commits, no abras PR ni comentes en GitHub. Tu resultado es un informe.

| Campo | Valor |
|---|---|
| Tarea del plan | `T03` (`codex +revisión`: el plan pide la segunda opinión de Claude Opus 5.5) |
| Ticket | `ADP-4` (solo informativo) |
| Agente | claude, `--model claude-opus-5-5`, esfuerzo máximo |
| Skills a usar | `code-review-and-quality`, `test-driven-development`, `codigo-legible`, `verification-before-completion` |

## Contexto

T03 ya está **fusionada en `develop`** (PR #9, commit `c3b2104`). La escribió Codex; el orquestador la revisó con un modelo y un esfuerzo menores de lo que pide el plan. Si encuentras fallos, el orquestador encargará la corrección. Lee `AGENTS.md` entero (prohibiciones y regla de legibilidad), [ADR-0003](../../adr/0003-ocurrencias-calculadas.md), el caso de uso CU-01 en `docs/03-casos-de-uso.md` (reglas RN-10 a RN-12 y RN-20 a RN-23) y el encargo original, `docs/agentes/encargos/003-motor-de-ocurrencias.md` (si aún no está en `develop`: `git show origin/docs/orquestador-ejecucion:docs/agentes/encargos/003-motor-de-ocurrencias.md`).

Tu worktree parte de `develop`. Todo se ejecuta en Docker (`./docker/app/run build` si la imagen no existe, `./docker/app/run npm ci`, y después `./docker/app/run npm run test` etc.). No necesitas Supabase.

## Qué revisar (con evidencia: fichero y línea)

Ficheros: `src/domain/types.ts`, `src/domain/calendar-date.ts`, `src/domain/recurrence.ts` y sus tests.

1. **Corrección frente a las reglas.** Versión de regla vigente por día (la de mayor `validFrom` ≤ día); «cada N días» desde el `validFrom` de la versión vigente; «cada mes» con el día del `validFrom` y caída al último día del mes; nada antes de `startDate`; rango inclusivo; rango invertido vacío; errores en datos corruptos. Busca casos límite que fallen: versiones con el mismo `validFrom`, `startDate` posterior a todas las versiones, primera versión posterior a `startDate`, cambio de regla el 29 de febrero, «cada mes» desde el 29, 30 y 31, rangos de varios años, `weekdays` con duplicados o valores fuera de 1 a 7, `timeOfDay` con formato raro.
2. **Independencia de la zona horaria del proceso.** `calendar-date.ts` debe hacer aritmética de calendario sin depender de la zona del proceso ni de `Date` local; `getCalendarDateInTimeZone` debe dar la fecha correcta en Europe/Madrid alrededor de medianoche y en los dos cambios de hora. Ejecuta tú los tests con `TZ` distintas (`UTC`, `Europe/Madrid`, `America/Los_Angeles`, `Pacific/Auckland`, `Pacific/Kiritimati`, `America/St_Johns`) y escribe un par de pruebas tuyas **temporales, fuera del repositorio o descartadas al terminar**, para comprobar lo que dudes.
3. **Calidad de los tests.** ¿Probarían un fallo real? Imagina mutaciones concretas (cambiar `<=` por `<`, contar «cada N días» desde `startDate` en vez de `validFrom`, no recortar al último día del mes, ordenar mal las franjas) y di si algún test fallaría. Si puedes, aplícalas en un directorio temporal y ejecútalos.
4. **Contrato.** Coincide con el del encargo 003 (tipos y firmas exportadas). Los días ISO son 1 = lunes … 7 = domingo, como guarda T02 en `habit_rules.weekdays`.
5. **Regla de legibilidad** de `AGENTS.md`, punto por punto (abreviaturas, una línea una cosa, cadenas, ternarios, aserciones no nulas `!` como atajo, funciones cortas con nombre, comentarios en español que explican el porqué).
6. **Rendimiento:** el cálculo de 5 años diarios y, como referencia, un año de 50 hábitos (RNF-01 lo medirá T13).

## Cómo informar al terminar

En tu mensaje `worker_done` (y entero con `--report-path` si es largo): hallazgos ordenados por gravedad (**crítico**, **importante**, **menor**), cada uno con fichero:línea, qué pasa, un ejemplo concreto que lo demuestre y cómo arreglarlo; y un veredicto: «correcto tal cual», «corregir X» o «rehacer». `--outcome succeeded` si completaste la revisión, aunque encuentres fallos.
