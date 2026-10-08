# Encargo 043 — Recordatorios R5: pantalla de prueba, flujo de Maestro y lista para el móvil

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1, recordatorios, encargos R5 y R6 de la propuesta (DEC-43) |
| Ticket | `ADP-26` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills a usar | `android-emulator-qa`, `codigo-legible` (en `.agents/skills/`) |
| Rama y worktree | `ADP-26-recordatorios-prueba`, desde `origin/develop`, tu propio worktree |
| Reservado para este encargo | `src/app/(dev)/recordatorios.tsx`, `e2e/recordatorios*.yaml` y sus tests |

## Antes de empezar

- **`AGENTS.md`:** regla de legibilidad y **todo en Docker**.
- **Caso de uso:** CU-08 en `docs/03-casos-de-uso.md`.
- **Código que ya está en `develop`:**
  - `src/platform/notifications.ts` (`getScheduledReminderKeys`, `scheduleReminder`, permiso);
  - `src/data/reminders.ts` (`syncReminders`);
  - la sección «Recordatorios» de Ajustes;
  - las pantallas de `src/app/(dev)/`, como patrón;
  - los flujos de `e2e/` y `scripts/e2e/` (cuando el PR #50 esté fusionado; si no, mira su rama `origin/pedrojcros/ADP-17-caminos-criticos`).
- **El emulador lo usa ahora el encargo de T13b (PR #50).** Escribe primero la pantalla, sus tests y el flujo. Para ejecutarlo en el emulador, espera a que el orquestador te avise de que está libre (`orca orchestration check`). Todo lo pesado va con `flock /tmp/adp-pesado.lock`; Expo, en el puerto 8096.
- **Base de datos:** el Supabase local es compartido. No hagas `db reset`, `stop` ni `start`.

## Qué hacer

1. **Pantalla de desarrollo** `src/app/(dev)/recordatorios.tsx`, igual que las otras de `(dev)`:
   - el estado del permiso;
   - la lista de lo programado (clave, día, hora y título);
   - un botón «Poner al día» que llama a `syncReminders()`;
   - un botón «Probar en 10 segundos», que programa un aviso de prueba con la clave `test:<instante>` dentro de 10 segundos.
   
   En la web dice que no hay recordatorios. Escribe sus tests de componente con la plataforma simulada.
2. **Flujo de Maestro** `e2e/recordatorios.yaml`, siguiendo el patrón de los demás flujos (usuario e2e creado al vuelo):
   1. iniciar sesión y aceptar el permiso de avisos;
   2. crear una tarea con fecha de pasado mañana;
   3. abrir la pantalla de desarrollo y comprobar que aparecen sus avisos;
   4. marcar la tarea como hecha;
   5. «Poner al día» y comprobar que han desaparecido.
3. **Lista de comprobación en el móvil (R6)**, para el humano al instalar el APK de la 1.1. Va en el informe y en la descripción del PR, y cubre:
   - el permiso;
   - un aviso que llega en punto, con «Probar en 10 segundos» y con una tarea real;
   - que los avisos siguen tras reiniciar el móvil;
   - el ahorro de batería;
   - que tocar el aviso abre la ficha.

## Fuera de alcance

El código de los recordatorios (R1 a R4: si encuentras un fallo, para y cuéntalo con `orca orchestration ask`), `package.json`, Jira, `docs/contexto.md` y otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] El flujo `recordatorios.yaml` pasa en el emulador (con la salida de Maestro en el PR), o el informe explica por qué no se puede en Expo Go.
- [ ] Lint, tipos, `npm run test` y `npx expo export --platform web` en verde dentro de Docker; CI del PR en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-26` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y la lista R6, con `worker_done` y `--outcome succeeded|failed`.
