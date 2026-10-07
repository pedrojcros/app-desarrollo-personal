# Encargo 028 — Flujos de Maestro de los caminos críticos (T13, segunda parte)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | `T13` en `docs/05-plan.md` (segunda parte: Maestro, RNF-06 y RNF-08; los datos sintéticos y RNF-01 ya están en `develop`; la accesibilidad va en el encargo 029, en paralelo) |
| Ticket | `ADP-17` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6-luna` |
| Skills a usar | `android-emulator-qa`, `verification-before-completion` (en `.agents/skills/`) |
| Rama y worktree | `ADP-17-caminos-criticos`, desde `develop`, tu propio worktree |
| Reservado para este encargo | `e2e/` (sin romper `smoke.yaml`), `scripts/e2e/`, `docker/android/test` (para lanzar todos los flujos). **No toques pantallas ni componentes**: el encargo 029 los está tocando a la vez. Localiza los elementos por su texto visible o su etiqueta de accesibilidad; si alguno no se puede localizar, anótalo en el informe |

## Antes de empezar

- **`AGENTS.md`:** regla de legibilidad; **todo en Docker**; **sin dependencias nuevas**; nada de secretos en el repositorio.
- **Documentación:** RNF-03, RNF-06 y RNF-08 en `docs/02-funcionalidades.md`; «Emulador y navegador» en `README.md`; `e2e/smoke.yaml` y `docker/android/test`.
- **Base de datos:** el Supabase local es compartido. No hagas `db reset`, `stop` ni `start`.
- **Lo pesado, de uno en uno:** el emulador, Expo, Maestro y `test:integration` van con `flock /tmp/adp-pesado.lock ...`. Sirve Expo en el puerto **8090**, porque el 8081 puede estar ocupado. Al terminar, para el emulador (`docker compose stop android-emulator`) y Expo.

## Qué hacer

1. **Usuario de pruebas e2e** creado al vuelo en el Supabase local, con `scripts/e2e/`. Sigue el patrón de `scripts/create-development-user.mjs`:
   - correo fijo de pruebas y contraseña aleatoria en cada ejecución, que se pasa a Maestro con `-e` y **nunca se escribe** en un fichero;
   - antes de cada ejecución, borra los datos de ese usuario;
   - **se niega a funcionar** si la API no es local.
2. **Flujos de Maestro** en `e2e/`, uno por camino crítico, y `npm run test:e2e` los lanza todos:
   - iniciar sesión;
   - **crear una tarea desde Hoy con el +**: escribir el nombre e Intro, y la tarea sale en Hoy. Son exactamente pulsar +, escribir y confirmar: el flujo lo comprueba (**RNF-06**);
   - **marcar desde Hoy con un toque** (RNF-06), ver el aviso y **Deshacer**;
   - crear un hábito «días de la semana» y verlo en Hoy si toca hoy;
   - crear una categoría con una sección y una tarea en esa sección con su «+»;
   - marcar algo en **Pendientes**;
   - ver el **Historial**.
3. **RNF-08:** todos los flujos pasan con la pantalla del emulador a **360 dp de ancho** (con `adb shell wm size` y `wm density`, restaurándolo al terminar) y con su tamaño normal.

## Fuera de alcance

Cambiar el comportamiento o el diseño de las pantallas, `src/domain`, `src/data`, `package.json` (salvo, si hace falta, el script `test:e2e`), la CI (el emulador no corre en ella), Jira, `docs/contexto.md` y otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] `npm run test:e2e` (con el emulador y Expo preparados como dice el README) pasa todos los flujos, a tamaño normal y a 360 dp. Pon en el informe la salida de Maestro.
- [ ] Lint, tipos y tests unitarios en verde dentro de Docker; CI del PR en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`. El repositorio no contiene ninguna contraseña.
- [ ] PR abierto **contra `develop`** con `ADP-17` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
