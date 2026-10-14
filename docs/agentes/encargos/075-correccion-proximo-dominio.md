# Encargo 075 — Corrección del dominio de Próximo

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1.1, corrección del encargo 070 (PR #87, ya fusionado) |
| Ticket | `ADP-46` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills | `codigo-legible` y `test-driven-development` (en `.agents/skills/`) |
| Rama | `ADP-46-correccion-proximo-dominio`, desde `origin/develop` |
| Reservado | `src/domain/views/upcoming.ts` y `src/domain/views/upcoming.test.ts`. Nada más |

Lee la regla de legibilidad de `AGENTS.md`. No uses el emulador ni Supabase. Si el worktree no tiene `node_modules`, `./docker/app/run npm ci`.

## Objetivo

`src/domain/views/upcoming.ts` calcula la vista Próximo (RN-46 en `docs/03-casos-de-uso.md`). Funciona y tiene cobertura completa, pero la revisión encontró cuatro detalles. Arréglalos **sin cambiar el contrato exportado** (`UpcomingDay`, `UpcomingWeek`, `getUpcomingRange`, `getUpcomingWeeks` y `formatWeekTitle`), que ya usa otro encargo.

## Qué hacer

1. **El test del cambio de hora no lo ejercita** (`upcoming.test.ts`, test «across the daylight saving change»): solo usa una tarea suelta. Añade un hábito semanal cuyas ocurrencias crucen el cambio de hora de Madrid (domingo 25 de octubre de 2026) y el de Los Ángeles (domingo 1 de noviembre de 2026), y comprueba los días exactos en que sale. Debe pasar con `npm run test:zones`.
2. **El cálculo del lunes está repetido tres veces** (`getUpcomingRange`, `getFirstWeekStart` e `isCurrentWeek`): extrae una función `getMondayOfWeek(date)` y úsala en los tres sitios, con una línea por paso. En `isCurrentWeek`, la comprobación del domingo (`!== 7`) es redundante: si sobra, quítala; si no, añade un test que falle sin ella.
3. **Tests que faltan:** el título de una semana que cruza de año («Semana del 28 de diciembre al 3 de enero»); un hábito con una marca ya puesta para un día del rango (comprueba que su elemento lleva el estado de la marca, como en `today.ts`); y «Esta semana» con elementos.
4. **Comentarios del porqué**, en español y breves: por qué se ordenan las reglas antes de `findRuleInForce`, qué cuenta como «diario» según RN-46 y de dónde salen los 34 días del rango.

## Fuera de alcance

- Cualquier fichero fuera de los dos reservados. Cambiar el contrato o el comportamiento: solo tests, estructura interna y comentarios.
- `docs/`.

## Criterio de hecho

- [ ] Los cuatro puntos hechos.
- [ ] `./docker/app/run npm run test:zones`, `./docker/app/run npm run lint` y `./docker/app/run npm run typecheck` en verde; cobertura de `upcoming.ts` al 100 % (`./docker/app/run npx jest src/domain/views/upcoming --coverage --collectCoverageFrom=src/domain/views/upcoming.ts`).
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR **contra `develop`** con `ADP-46` en el título. **No hagas merge**.

## Cómo informar al terminar

En la descripción del PR, en formato corto (DEC-45): **Hecho**, **Ficheros**, **Decisiones**, **Dudas**, **Tests** (comando y resultado en una línea) y **PR**. Si algo no está claro, pregunta con `orca orchestration ask`. Al final, `worker_done` con un resumen de tres frases y `--outcome succeeded|failed`.
