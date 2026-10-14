# Encargo 068 — Historial que se desplaza

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1.1, DEC-51 punto 9 (fila 8 del pulido) |
| Ticket | `ADP-40` (solo informativo: no lo toques) |
| Agente | copilot |
| Skills | `codigo-legible` (en `.agents/skills/`) |
| Rama | `ADP-40-historial-desplaza`, desde `origin/develop` |
| Reservado | `src/app/(tabs)/historial.tsx` y `src/components/history-grid/history-screen.test.tsx`. Nada más |

Lee la regla de legibilidad de `AGENTS.md`. No uses el emulador ni Supabase. Si el worktree no tiene `node_modules`, `./docker/app/run npm ci`.

## Qué pasa

`src/app/(tabs)/historial.tsx` es una `View` sin desplazamiento vertical: el título, las dos fechas y los filtros llenan la pantalla del móvil y la rejilla del historial queda debajo, sin forma de llegar a ella.

## Qué hacer

1. Que la pantalla entera se desplace en vertical (título, fechas, filtros y rejilla), con un `ScrollView` de React Native. La rejilla mantiene su desplazamiento horizontal.
2. Nada más: ni textos, ni diseño, ni otros componentes.
3. Un test en `history-screen.test.tsx`: con muchas filas, la rejilla está dentro de un contenedor que se desplaza en vertical. El test tiene que fallar sin el cambio.
4. `./docker/app/run npm run lint`, `./docker/app/run npm run typecheck` y `./docker/app/run npm run test` en verde.
5. Un commit en español, push y PR contra `develop` con `ADP-40` en el título.

## Fuera de alcance

- Cualquier otro fichero: si ves algo, anótalo en el PR.
- `docs/` y `e2e/`.

## Cómo informar al terminar

En la descripción del PR, en formato corto: **Hecho**, **Ficheros**, **Decisiones**, **Dudas**, **Tests** (comando y resultado en una línea) y **PR**. Si algo no está claro, pregunta con `orca orchestration ask`. Al final, `worker_done` con un resumen de tres frases y `--outcome succeeded|failed`.
