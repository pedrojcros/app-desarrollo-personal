# Encargo 046 — En Android, el teclado tapa la barra del añadir rápido

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Ticket | `ADP-16` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6.1-sol` (corrección con investigación; DEC-41) |
| Skills | `systematic-debugging`, `android-emulator-qa`, `codigo-legible` (en `.agents/skills/`); `source-driven-development` para la documentación de React Native y Expo |
| Rama | `ADP-16-teclado-android`, desde `origin/develop` |
| Reservado | `src/components/quick-add/quick-add-provider.tsx`, `src/components/quick-add/use-web-viewport.ts` y sus tests; `app.json` solo si la causa lo pide (dilo en el informe); un flujo de Maestro nuevo `e2e/quick-add-keyboard.yaml` y su línea en `e2e/critical-paths.yaml` |

## Qué pasa

T16 exigía que **el teclado no tapara la barra del añadir rápido, ni en Android ni en la web** (`docs/05-plan.md`, T16; `docs/diseno.md`, «Añadir rápido»). En el emulador de Android (SDK 56, Expo Go), al abrir el + y escribir, **el teclado cubre la barra entera**. La captura está en `docs/diseno/capturas/anadir-rapido/teclado-android.png` (la añade el PR del encargo 045).

La barra vive en un `Modal` transparente con `statusBarTranslucent` y `navigationBarTranslucent`, dentro de un `KeyboardAvoidingView` con `behavior` `height` en Android (`src/components/quick-add/quick-add-provider.tsx`). En la web va bien gracias a `useWebViewport`.

## Qué hacer

1. **Demuestra la causa en el emulador** y con la documentación oficial (React Native 0.8x y Expo SDK 56: `Modal`, edge-to-edge en Android, `KeyboardAvoidingView` y `softwareKeyboardLayoutMode`). El emulador es tuyo en exclusiva: Expo en el puerto 8090 con `EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321`, y todo lo pesado con `flock /tmp/adp-pesado.lock`. Si sale «Running multiple emulators with the same AVD», haz `docker compose rm -sf android-emulator`.
2. **Arréglalo con lo que ya trae React Native y Expo**, sin dependencias nuevas. La barra queda **justo encima del teclado** en Android a tamaño normal y a 360 dp, y en la web sigue igual. Los desplegables siguen abriéndose hacia arriba.
3. **Flujo de Maestro `e2e/quick-add-keyboard.yaml`:** abre el +, escribe, comprueba que «Enviar» y los atajos de fecha **se ven y se pueden pulsar** con el teclado abierto, y envía. Añádelo a `e2e/critical-paths.yaml` y pasa la ejecución completa a tamaño normal y a 360 dp.
4. Lint, tipos y `npm run test` en verde. Captura de después en `docs/diseno/capturas/anadir-rapido/teclado-android-arreglado.png`. Al terminar, para el emulador y Expo.
5. Commits en español, push y PR contra `develop` con `ADP-16` en el título; en la descripción, la causa demostrada, el arreglo y la salida de Maestro.

Si algo no está claro, pregunta con `orca orchestration ask`. Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`).
