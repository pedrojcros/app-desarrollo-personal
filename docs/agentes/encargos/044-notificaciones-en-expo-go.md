# Encargo 044 — La app no carga en Expo Go desde los recordatorios

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Ticket | `ADP-22` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6.1-sol` (corrección; DEC-41) |
| Skills | `systematic-debugging`, `codigo-legible` (en `.agents/skills/`); `source-driven-development` para la documentación de Expo |
| Rama y worktree | `ADP-22-notificaciones-expo-go`, desde `origin/develop`, tu propio worktree |
| Reservado | `src/platform/notifications.ts` y `.web.ts`, sus tests; lo mínimo más que haga falta (dilo en el informe) |

## Qué pasa

En el emulador, con **Expo Go** (SDK 56), la app ya no carga desde que entró `expo-notifications` (recordatorios R1, PR #48). El `logcat` repite:

- «expo-notifications: Android Push notifications (remote notifications) functionality ... was removed from Expo Go with SDK 53. Use a development build instead»;
- después, «Route ./login.tsx is missing the required default export».

La pantalla de inicio de sesión no aparece. Sospecha: al importarse `expo-notifications` en Expo Go algo falla, y eso rompe la carga de los módulos de las rutas. **Bloquea los flujos de Maestro de la versión 1 (T13b)**, que corren en Expo Go. En el APK (compilación de EAS) los recordatorios tienen que seguir funcionando.

`expo-notifications` **solo se importa en `src/platform/notifications.ts`**, y todo pasa por sus funciones: `isReminderPlatformSupported`, `getReminderPermission`, `scheduleReminder`, `configureReminderPresentation`, `addReminderTapListener`, etc.

## Qué hacer

1. **Demuestra la causa:** lee la documentación oficial de Expo SDK 56 sobre `expo-notifications` en Expo Go (solo lectura) y, si hace falta, el código de la librería en `node_modules`. Escríbela en el informe.
2. **Arréglalo de forma mínima:** en Expo Go (`Constants.executionEnvironment === ExecutionEnvironment.StoreClient`, de `expo-constants`, que ya es dependencia), los recordatorios se tratan como **no disponibles**:
   - `isReminderPlatformSupported()` devuelve `false`;
   - el permiso, `'unsupported'`;
   - el resto, nada;
   - y **`expo-notifications` no llega a cargarse** (por ejemplo, con un `require` perezoso dentro de las funciones, solo fuera de Expo Go).
   
   Fuera de Expo Go, el comportamiento no cambia. Si la documentación dice que las notificaciones **locales** sí funcionan en Expo Go y hay una forma segura de usarlas sin el fallo, propónla en el informe, pero aplica el arreglo seguro.
3. **Tests:**
   - con Expo Go simulado: no se importa `expo-notifications`, el permiso es `'unsupported'` y programar no hace nada;
   - fuera de Expo Go: lo de siempre.
   
   Los tests que ya hay siguen pasando.
4. **Ajustes:** con «no disponible», la sección de Ajustes ya enseña su texto de «no funcionan aquí»; si dice «en la web», ajústalo para que valga también en Expo Go («Los recordatorios solo funcionan en la app instalada»). Eso es `src/components/reminders/`: puedes tocarlo solo para ese texto.
5. **Comprueba:** lint, tipos, `npm run test` y `npx expo export --platform web`, dentro de Docker. Lo pesado, con `flock /tmp/adp-pesado.lock`. **No uses el emulador**: es de T13b, que comprobará el arreglo con sus flujos en cuanto se fusione.
6. Commits en español, push y PR contra `develop` con `ADP-22` en el título; en la descripción, la causa y el arreglo.

Si algo no está claro, pregunta con `orca orchestration ask`. Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`).
