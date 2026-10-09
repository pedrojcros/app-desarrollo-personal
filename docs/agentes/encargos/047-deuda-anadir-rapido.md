# Encargo 047 — Deuda menor: estilo del añadir rápido y una constante duplicada

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Agente | copilot (pequeño y mecánico; DEC-41) |
| Rama | `chore/deuda-anadir-rapido`, desde `develop` |
| Reservado | `src/components/quick-add/use-quick-add-draft.ts`, `src/components/quick-add/quick-add-bar.tsx`, `src/domain/quick-add.ts`, `src/data/reminders.ts` (solo la constante) y sus tests. **No toques** `quick-add-provider.tsx` ni `upward-choice.tsx`: otros encargos los están cambiando |

Lee la regla de legibilidad de `AGENTS.md`. Todo en Docker con `./docker/app/run ...`; lo pesado (la suite completa), con `flock /tmp/adp-pesado.lock`. **El comportamiento no cambia**: es una limpieza. No uses el emulador.

## Qué hacer

1. **`src/domain/quick-add.ts` y `src/components/quick-add/quick-add-bar.tsx`:** separa con una línea en blanco los bloques (imports, tipos y cada función), como el resto del proyecto. Solo eso en esos dos ficheros.
2. **`useQuickAddDraft`** (en `use-quick-add-draft.ts`) devuelve 20 valores sueltos. Agrúpalos en tres objetos con nombre, `draft` (lo escrito y elegido), `actions` (`submit`, `openMore`, los `set…`) y `status` (`disabled`, `error`), y ajusta `quick-add-bar.tsx` para usarlos. Sin cambiar ningún comportamiento.
3. **`src/data/reminders.ts`** define su propia constante `reminderSettingsQueryKey`. Bórrala e impórtala de `src/data/reminder-settings.ts`, que ya la exporta.
4. **Comprueba:** lint, tipos y `npm run test` en verde dentro de Docker (los tests del añadir rápido tienen que seguir pasando sin cambiar lo que comprueban); y la CI del PR en verde.
5. Commits en español, push y PR contra `develop` con un título que empiece por «Limpieza».

Si algo no está claro, pregunta con `orca orchestration ask`. Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`).
