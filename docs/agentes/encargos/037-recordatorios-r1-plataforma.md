# Encargo 037 — Recordatorios R1: `expo-notifications`, plataforma y ajustes guardados

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1, recordatorios, encargo R1 de la propuesta (DEC-43) |
| Ticket | `ADP-22` (solo informativo: no lo toques) |
| Agente | copilot (mecánico, con patrón que copiar; DEC-41) |
| Rama | `ADP-22-recordatorios-plataforma`, desde `origin/develop` |
| Reservado | `package.json`, `package-lock.json`, `app.json`, `src/platform/**`, `src/domain/reminder-types.ts`, `src/data/reminder-settings*.ts`, `AGENTS.md` (solo la tabla del stack y la estructura) |

## Antes de empezar

- **`AGENTS.md`:** dependencias aprobadas, regla de legibilidad y **todo en Docker** con `./docker/app/run ...`.
- **Propuesta:** de `docs/propuestas/recordatorios.md`, **solo** los apartados 0 (lo que dice la documentación de Expo), 3.2 (contratos) y 3.4 (dependencias).
- **Patrón que copiar:** `src/theme/preference-storage.ts`.
- **Base de datos:** el Supabase local es compartido. No hagas `db reset`, `stop` ni `start`.

## Qué hacer

1. **Instala** con `./docker/app/run npx expo install expo-notifications`. Es la única dependencia nueva, y `npx expo install` elige la versión del SDK 56. Añade el plugin a `app.json` y el permiso de alarmas exactas que se concede solo, `android.permission.USE_EXACT_ALARM`, en `android.permissions` (decisión 5 de DEC-43). Sin icono propio.
2. **Tipos** en `src/domain/reminder-types.ts`, tal cual el contrato del apartado 3.2: `ReminderLead`, `ReminderSettings`, `DEFAULT_REMINDER_SETTINGS` (`{ enabled: true, taskLeads: [3, 1, 0], habitTimeSlots: false }`), `ReminderChannel` y `PlannedReminder`. Solo tipos y esa constante: sin lógica, sin React y sin Expo. Otro encargo (R2) escribirá el cálculo y los reutilizará.
3. **Plataforma:**
   - `src/platform/notifications.ts` con el contrato de plataforma del apartado 3.2, sobre `expo-notifications`:
     - canales `tasks` y `habits`;
     - disparo de **fecha concreta** con el `Date` local construido a partir de `date` y `time`;
     - el `identifier` es la `key`;
     - devuelve `{ ok, value }` o `{ ok: false, error }`, como `src/data`;
   - `src/platform/notifications.web.ts`: lo mismo, sin hacer nada; `isReminderPlatformSupported()` devuelve `false` y el permiso, `'unsupported'`.
4. **Ajustes guardados** en `src/data/reminder-settings.ts`: leer y guardar `ReminderSettings` en el dispositivo, copiando el patrón de `preference-storage.ts`. Valida con Zod al guardar y, si lo guardado no es válido, vuelve a los valores por defecto.
5. **Tests:**
   - los ajustes: por defecto, guardar y leer, valor corrupto;
   - la plataforma, con `expo-notifications` simulado: qué `identifier`, qué disparo con qué `Date`, qué canal; que la versión web no hace nada.
6. **`AGENTS.md`:** añade `expo-notifications` a la tabla del stack, con la versión que instale `npx expo install`, y `src/platform/` a la estructura.
7. **Comprueba, leyendo el código de la librería en `node_modules`** y sin compilar nada:
   - si usa alarma exacta cuando tiene el permiso, y qué hace sin él;
   - si declara `POST_NOTIFICATIONS`.
   
   Anótalo en el informe.
8. Commits en español, push y PR contra `develop` con `ADP-22` en el título.

## Criterio de hecho

- [ ] Lint, tipos y `npm run test` en verde dentro de Docker; CI del PR en verde.
- [ ] Ninguna dependencia nueva más que `expo-notifications` (y lo que instale ella por su cuenta).
- [ ] PR abierto contra `develop`. **No hagas merge.**

Si algo no está claro, pregunta con `orca orchestration ask`. Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`).
