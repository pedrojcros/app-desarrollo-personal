# Encargo 045 — Las opciones del selector del añadir rápido, accesibles y pulsables en Android

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Ticket | `ADP-16` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6.1-sol` (hay que investigar la causa; DEC-41) |
| Skills | `systematic-debugging`, `android-emulator-qa`, `codigo-legible` (en `.agents/skills/`) |
| Rama | `ADP-16-selector-accesible`, desde `origin/develop` |
| Reservado | `src/components/quick-add/upward-choice.tsx` y sus tests; `e2e/create-habit.yaml` y `docker/android/test` (solo para quitar el toque por coordenadas) |

## Qué pasa

En el emulador de Android, el flujo de Maestro `e2e/create-habit.yaml` no puede tocar la opción «Días de la semana» del selector «Frecuencia» del añadir rápido por su texto. Lo hace por coordenadas (`point: '26%,${FREQUENCY_OPTION_Y}'`, que `docker/android/test` ajusta según el tamaño de pantalla), con el comentario «El selector no expone la opción con etiqueta y cambia de posición según el ancho».

El selector es `src/components/quick-add/upward-choice.tsx`: un `View` con `position: absolute` y `bottom-full` que se abre **por encima** de su botón. **Hipótesis por comprobar:** en Android, lo que se dibuja fuera de los límites del contenedor padre no recibe toques ni sale en el árbol de accesibilidad. Es una barrera de accesibilidad (RNF-03) y puede afectar también al dedo en móviles reales.

## Qué hacer

1. **Reproduce y demuestra la causa** en el emulador:
   - el árbol de accesibilidad con `maestro hierarchy` o `adb shell uiautomator dump`;
   - si la opción recibe toques al pulsarla con el dedo.
   
   El emulador es tuyo en exclusiva: Expo en el puerto 8090 con `EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321`, y todo lo pesado con `flock /tmp/adp-pesado.lock`. Si al arrancar sale «Running multiple emulators with the same AVD», haz `docker compose rm -sf android-emulator` y vuelve a levantarlo.
2. **Arréglalo sin cambiar el diseño**: el menú se sigue abriendo hacia arriba (`docs/diseno.md`, «Desplegables hacia arriba»). Por ejemplo, reservando el espacio dentro del contenedor o pintando el menú en un portal (`@rn-primitives/portal` ya está en el proyecto). Cada opción tiene su etiqueta accesible, su rol `radio` y su estado.
3. **Cambia `e2e/create-habit.yaml`** para tocar «Días de la semana» **por texto**, y quita de `docker/android/test` la variable `FREQUENCY_OPTION_Y`.
4. **Comprueba:**
   - el flujo completo `npm run test:e2e` (`e2e/critical-paths.yaml`) a tamaño normal y a 360 dp;
   - lint, tipos y `npm run test`;
   - un test de componente que compruebe la etiqueta, el rol y el estado de las opciones.
   
   Al terminar, para el emulador y Expo.
5. Commits en español, push y PR contra `develop` con `ADP-16` en el título; en la descripción, la causa demostrada y la salida de Maestro.

Si algo no está claro, pregunta con `orca orchestration ask`. Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`).
