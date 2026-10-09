# Encargo 039 — Fallo en Android al iniciar sesión: «Couldn't find a navigation context»

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Ticket | `ADP-17` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6.1-sol`, esfuerzo alto (corrección densa; DEC-41) |
| Skills | `systematic-debugging`, `android-emulator-qa` (en `.agents/skills/`) |
| Rama y worktree | `ADP-17-fallo-navegacion`, desde `origin/develop`, tu propio worktree |
| Reservado | el código de producción que sea la causa, el mínimo; un test que lo habría detectado |

## Qué pasa

En el emulador de Android, con Expo Go, tras escribir el email y la contraseña y pulsar «Entrar», la app enseña un **Render Error**:

```
Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'?
```

El marco apunta a `NavigationStateContext.js:43` y a `src/components/ui/button.tsx:39`, y nunca llega a Hoy. Lo encontró el encargo 028 (flujos de Maestro, PR #50, rama `pedrojcros/ADP-17-caminos-criticos`). En su investigación descartó que `PageMetadata` (`src/app/_layout.tsx`, del PR #40) fuera la causa única, pero no aisló la causa.

En la web, la app funciona. En `develop` se han añadido hace poco cosas que se montan por encima del `Stack` raíz: `QuickAddProvider` (#37), `UndoToastProvider` y `PageMetadata` (#40). Además, el botón + y `usePathname` están en `src/app/(tabs)/_layout.tsx` (#37).

## Antes de empezar

- **`AGENTS.md`:** regla de legibilidad y **todo en Docker**.
- **Documentación:** «Emulador y navegador» en `README.md`.
- **Los flujos de Maestro** están en la rama del PR #50. Para reproducir, tráelos **sin commitearlos**: `git fetch origin && git checkout origin/pedrojcros/ADP-17-caminos-criticos -- e2e scripts/e2e docker/android/test`. Antes de tu commit, déjalos como estaban: `git checkout HEAD -- e2e docker/android/test && git clean -fd scripts/e2e`.
- **El emulador es tuyo en exclusiva.** Todo lo pesado, con `flock /tmp/adp-pesado.lock ...`; Expo, en el puerto 8090. Al terminar, para el emulador y Expo.
- **Base de datos:** el Supabase local es compartido. No hagas `db reset`, `stop` ni `start`.

## Qué hacer

1. **Reproduce el fallo** con el flujo `login` de Maestro o a mano con `adb`, y guarda la traza completa (logcat y la pantalla de error).
2. **Aísla la causa:**
   - quita y vuelve a poner, de uno en uno, los proveedores y los hooks de la raíz y del layout de pestañas;
   - mira qué componente con `Button` se pinta fuera del árbol de navegación (por ejemplo, el aviso de Deshacer, el `Modal` del añadir rápido o una cabecera);
   - mira si NativeWind o `@rn-primitives` usan algún hook de navegación.
   
   **Demuestra la causa** antes de cambiar nada.
3. **Arréglalo con el mínimo cambio**, sin cambiar el comportamiento en la web. Añade un test que lo habría detectado, si se puede con Jest; si no, dilo.
4. **Comprueba:**
   - el flujo `login` de Maestro llega a Hoy, y si da tiempo, el resto de flujos del PR #50;
   - lint, tipos, `npm run test` y `npx expo export --platform web` en verde.
   
   Los dos tests de `past-pending-screen.test.tsx` que fallan por tiempo se están arreglando en otro encargo: ignóralos.
5. Commits en español, push y PR contra `develop` con `ADP-17` en el título. En la descripción, **la causa demostrada**, el arreglo y la salida de Maestro.

## Fuera de alcance

Los flujos de Maestro (los commitea el PR #50), el diseño, `package.json` (si la causa pide cambiar una dependencia, para y pregunta), Jira, `docs/contexto.md` y otros encargos. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`. Si en una hora no has aislado la causa, para, cuéntalo con `orca orchestration ask` y espera.
