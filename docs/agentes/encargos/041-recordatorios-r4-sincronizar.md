# Encargo 041 — Recordatorios R4: poner los avisos al día en el móvil

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1, recordatorios, encargo R4 de la propuesta (DEC-43): RF-27 y RF-29 |
| Ticket | `ADP-25` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6.1-sol` (carreras, fallos de red, ciclo de vida; DEC-41) |
| Skills a usar | `test-driven-development`, `codigo-legible`, `expo-data-fetching` (en `.agents/skills/`) |
| Rama y worktree | `ADP-25-recordatorios-sincronizar`, desde `origin/develop`, tu propio worktree |
| Reservado para este encargo | `src/data/reminders*.ts` (y sus tests), `src/app/_layout.tsx` (solo montar el hook y el manejador), `src/data/auth/auth.ts` (solo cancelar al cerrar sesión) |

## Antes de empezar

- **`AGENTS.md`:** capas, regla de legibilidad y **todo en Docker**.
- **Funcionalidades y caso de uso:** RF-27 y RF-29 en `docs/02-funcionalidades.md`; CU-08 en `docs/03-casos-de-uso.md` (A4 a A10, E1, E2; escenarios 6 a 9, 12 y 13; RN-34 a RN-40).
- **Propuesta:** de `docs/propuestas/recordatorios.md`, **solo** el apartado 3.2 (la parte «Datos» y la de «Plataforma»).
- **Ya en `develop`:**
  - `src/domain/reminders.ts` (`planReminders` y `diffReminders`);
  - `src/platform/notifications.ts` (`scheduleReminder` devuelve el código de error `SCHEDULE_FAILED`);
  - `src/data/reminder-settings.ts` (`loadReminderSettings`);
  - `src/data/agenda.ts` (`fetchHabits`, `fetchHabitMarks` y `mapTaskRow`).
- **En paralelo:** el encargo R3 (PR aún abierto) añade a `reminder-settings.ts` el hook `useReminderSettings()` y `export const reminderSettingsQueryKey = ['reminder-settings'] as const`, y guarda los ajustes en la caché con esa clave.
  - Si al terminar no está en `develop`, usa en tu fichero una constante con **el mismo valor** y apúntalo.
  - Si ya está, impórtala (`git rebase origin/develop` antes del PR).
- **No toques `src/components/ui/button.tsx` ni el botón +:** otro encargo los está arreglando.
- **El emulador no es tuyo.** Lo pesado, con `flock /tmp/adp-pesado.lock ./docker/app/run ...`. Base de datos: no hagas `db reset`, `stop` ni `start`.

## Qué hacer

1. **`src/data/reminders.ts`:**
   - **la lectura:** tareas pendientes, sin archivar, con `due_date` entre hoy y hoy + 6; hábitos sin archivar con hora o franja; sus marcas de esos días; y los nombres de las categorías;
   - **`syncReminders()`:** lee, planifica, compara con `getScheduledReminderKeys()`, cancela lo que sobra y programa lo nuevo. Es idempotente. **Si la lectura falla, no toca lo programado** (E1). Si no hay permiso o la plataforma no lo admite, no hace nada (E2). Con los ajustes apagados, cancela todo (A10);
   - **`useReminderSync()`:** pone al día al arrancar con sesión, al volver la app al primer plano (`AppState`), tras cada mutación correcta (suscripción a la caché de mutaciones de TanStack Query, agrupando las de 2 segundos), al cambiar los ajustes (suscripción a la clave `['reminder-settings']`) y al cambiar el día. **Nunca dos puestas al día a la vez**: si llega otra mientras corre una, se hace otra al terminar;
   - prepara los canales y fija `setNotificationHandler` para que el aviso se vea también con la app abierta.
2. **Montaje** en `src/app/_layout.tsx`, dentro de los proveedores y con sesión. **Tocar el aviso** (RF-29) abre `/tareas/<id>`, o `/hoy` si es un hábito, con el listener de la plataforma.
3. **Cerrar sesión** llama a `cancelAllReminders()`.
4. **Tests (TDD):**
   - `syncReminders` con la plataforma y la lectura simuladas: los escenarios 6 a 9 y 12 de CU-08, que la lectura falle (E1), sin permiso (E2) y que no se programe dos veces;
   - el hook: que agrupe las mutaciones y que no solape dos puestas al día;
   - integración de la lectura contra el Supabase local (RLS con otro usuario: no ve lo ajeno);
   - el de tocar el aviso, escenario 13.

## Fuera de alcance

Ajustes (R3), el cálculo (R2, no se cambia), la plataforma (R1, no se cambia salvo que encuentres un fallo: si es así, para y pregunta), `package.json`, Jira, `docs/contexto.md` y otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan los escenarios 6 a 9, 12 y 13 de CU-08, E1 y E2, y el resto de tests.
- [ ] Lint, tipos, `npm run test`, integración y `npx expo export --platform web` en verde dentro de Docker; CI del PR en verde.
- [ ] RF-27 y RF-29 marcados como hechos en `docs/02-funcionalidades.md`.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-25` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
