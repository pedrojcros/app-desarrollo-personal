# Encargo 042 — Limpieza de deuda pequeña (recordatorios y aviso de Deshacer)

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Agente | codex, `--model gpt-6-luna` (mecánico, con los cambios fijados aquí; DEC-41) |
| Skills | `codigo-legible` (en `.agents/skills/`) |
| Rama | `chore/limpieza-deuda`, desde `origin/develop` |
| Reservado | `src/data/reminders.ts`, `src/platform/notifications.ts` y `.web.ts`, `src/components/undo-toast/`, `src/components/past-pending/past-pending-screen.test.tsx`, y los tests de esos ficheros |

Lee la regla de legibilidad de `AGENTS.md`. Todo en Docker con `./docker/app/run ...`. Lo pesado (la suite completa y la exportación), con `flock /tmp/adp-pesado.lock`. **El comportamiento no cambia**: es una limpieza.

## Qué hacer

1. **Códigos de error en minúsculas**, como el resto de `src/data` (`network_error`, `not_found`…):
   - `SCHEDULE_FAILED` pasa a `schedule_failed` en `src/platform/notifications.ts`;
   - `DAY_CHANGED` y `REMINDER_SYNC_FAILED` pasan a `day_changed` y `reminder_sync_failed` en `src/data/reminders.ts`.
   
   Ajusta los tests que los mencionen.
2. **`setNotificationHandler`, a la plataforma:**
   - la llamada directa a `expo-notifications` que hace `configureReminderPresentation` en `src/data/reminders.ts` se convierte en `configureReminderPresentation()` dentro de `src/platform/notifications.ts`, con su versión vacía en `.web.ts`;
   - `src/data/reminders.ts` deja de importar `expo-notifications`.
3. **Duración del aviso de Deshacer, configurable:**
   - `UndoToastProvider` acepta una prop opcional `noticeDurationMilliseconds`, por defecto `NOTICE_DURATION_MILLISECONDS`;
   - en `src/components/past-pending/past-pending-screen.test.tsx`, quita el truco que intercepta `global.setTimeout` según su duración (`keepNoticeVisible`) y pasa al proveedor una duración larga en esos tests;
   - mantén el resto de comprobaciones.
4. Comprueba:
   - el fichero de Pendientes pasa 5 veces seguidas;
   - lint, tipos, `npm run test` y `npx expo export --platform web` en verde;
   - la CI del PR en verde.
5. Commits en español, push y PR contra `develop` con un título que empiece por «Limpieza».

No toques nada más. Si algo no está claro, pregunta con `orca orchestration ask`. Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`).
