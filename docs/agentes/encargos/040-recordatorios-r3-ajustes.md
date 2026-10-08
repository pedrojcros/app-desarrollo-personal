# Encargo 040 — Recordatorios R3: sección «Recordatorios» en Ajustes

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1, recordatorios, encargo R3 de la propuesta (DEC-43): RF-28 y RF-30 |
| Ticket | `ADP-24` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills a usar | `test-driven-development`, `codigo-legible` (en `.agents/skills/`) |
| Rama y worktree | `ADP-24-recordatorios-ajustes`, desde `origin/develop`, tu propio worktree |
| Reservado para este encargo | `src/app/ajustes.tsx`, `src/components/reminders/**`, y en `src/data/reminder-settings.ts` **solo añadir** el hook de abajo, con sus tests |

## Antes de empezar

- **`AGENTS.md`:** capas, regla de legibilidad y **todo en Docker**.
- **Funcionalidades y caso de uso:** RF-28 y RF-30 en `docs/02-funcionalidades.md`; de CU-08 en `docs/03-casos-de-uso.md`, A1, A10, E2 y los escenarios 10, 11 y 12.
- **Código:** lo que ya existe y usarás tal cual:
  - `src/data/reminder-settings.ts` (`loadReminderSettings` y `saveReminderSettings`);
  - `src/platform/notifications.ts` (`isReminderPlatformSupported`, `getReminderPermission` y `requestReminderPermission`);
  - `src/domain/reminder-types.ts` (`ReminderSettings`, `ReminderLead` y `DEFAULT_REMINDER_SETTINGS`);
  - la pantalla `src/app/ajustes.tsx` y su selector de tema, como ejemplo de sección.
- **El emulador no es tuyo** (lo usa otro encargo): verifica con tests y, si quieres, en la web con el MCP de Chrome. Lo pesado, con `flock /tmp/adp-pesado.lock ./docker/app/run ...`; Expo, en el puerto 8095.

## Qué hacer

1. **Hook** en `src/data/reminder-settings.ts` (contrato, lo usará R4 para ponerse al día cuando cambien):

   ```ts
   export const reminderSettingsQueryKey = ['reminder-settings'] as const;
   export function useReminderSettings(): {
     settings: ReminderSettings;           // DEFAULT_REMINDER_SETTINGS mientras carga
     saveSettings: (next: ReminderSettings) => Promise<void>; // guarda y actualiza la caché de esa clave
   };
   ```
2. **Sección «Recordatorios»** en Ajustes (`src/components/reminders/`):
   - interruptor general;
   - antelación de las tareas, con varias opciones a la vez: «7 días antes», «3 días antes», «El día anterior» y «El mismo día»; al menos una, o el interruptor general se apaga;
   - interruptor «Avisar también de los hábitos de mañana, tarde y noche», apagado por defecto;
   - **estado del permiso:**
     - concedido: no dice nada;
     - sin decidir: botón «Permitir avisos», con `requestReminderPermission`;
     - denegado: «Los avisos están bloqueados en el móvil» y el botón «Abrir ajustes del móvil», con `Linking.openSettings()`.
   - **En la web**, en vez de los interruptores, el texto «Los recordatorios solo funcionan en la app del móvil» (RF-30).
   - Accesible: etiquetas, 44 pt y roles de interruptor. Usa solo tokens.
3. **Tests (TDD):**
   - el hook: carga, guarda y la caché se actualiza;
   - los componentes: los escenarios 10, 11 y 12 de CU-08 con la plataforma simulada, la versión web, y que no se queda ninguna antelación marcada si se quitan todas.
4. Marca RF-28 y RF-30 como hechos en `docs/02-funcionalidades.md`.

## Fuera de alcance

Programar o cancelar avisos (lo hace R4: aquí solo se guardan los ajustes), `src/app/_layout.tsx`, `src/platform/` (no se toca), `package.json`, Jira, `docs/contexto.md` y otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan los escenarios 10, 11 y 12 de CU-08 (con la plataforma simulada), el de RF-30 y el resto de tests.
- [ ] Lint, tipos, `npm run test` y `npx expo export --platform web` en verde dentro de Docker; CI del PR en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-24` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
