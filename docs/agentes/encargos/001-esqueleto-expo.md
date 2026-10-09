# Encargo 001 — Esqueleto del proyecto (Expo), todo en Docker

> El trabajador que reciba esto **no ha visto nada** de lo que se ha hablado antes. Todo lo que necesita está aquí o enlazado.

| Campo | Valor |
|---|---|
| Tarea del plan | `T01` en `docs/05-plan.md` |
| Ticket | `ADP-2` (solo informativo: no lo toques) |
| Agente | codex (esfuerzo medio-alto: es la base de todo lo demás) |
| Skills a usar | `expo-overview`, `expo-project-structure`, `expo-router`, `source-driven-development`, `flujo-git`, `codigo-legible` (en `.agents/skills/`); a demanda `.agents/skills-a-demanda/ci-cd-and-automation/SKILL.md` si existe |
| Rama y worktree | `ADP-2-esqueleto-expo`, desde `develop`, en tu propio worktree |
| Depende de | Nada (H01 ya está hecha: `git push` funciona por HTTPS con `gh`) |
| Reservado para este encargo | Todo lo de T01: `package.json` y su lockfile, configuración de Expo, Babel, Metro, Tailwind y NativeWind, `.github/workflows/`, `supabase/config.toml`, `src/app/_layout.tsx` y el layout de pestañas, `src/components/ui/` inicial, `compose.yaml`, `docker/app/` |

## Antes de empezar

Lee `AGENTS.md` entero (reglas, prohibiciones y regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español) y `docs/04-arquitectura.md`, `docs/adr/0005-stack-expo.md` y la tarea T01 de `docs/05-plan.md`. Esta tarea es el esqueleto: **de ella dependen las otras 15**, así que hazla sobria y sin florituras.

## Objetivo

Una app Expo **vacía pero arrancable** en el móvil (Expo Go) y en la web, con **todo el entorno dentro de Docker** (DEC-26), tests, linter, tipos, Supabase local e integración continua funcionando.

## Qué hacer (resumen de T01; el texto completo de la tarea está en `docs/05-plan.md`)

1. **Docker de desarrollo.** `docker/app/Dockerfile` sobre la imagen oficial de Node 24 (versión fijada, no `latest`) y `compose.yaml` con el servicio de la app en `network_mode: host` (para que el Expo Go del móvil vea el servidor, **sin `--tunnel`**, que pasa por un tercero). Los contenedores corren con el uid/gid del usuario del anfitrión (para no dejar ficheros de root en el repositorio). Desde ahí también se maneja la Supabase CLI y la base de datos local (necesita el socket de Docker). **Nada del proyecto se instala en el sistema del humano.**
2. **Expo SDK 56** con TypeScript en modo `strict` y la estructura de `expo-project-structure` (rutas en `src/app`; carpetas `src/domain`, `src/data`, `src/components`, `src/theme` como describe `AGENTS.md`, con un fichero mínimo o `.gitkeep` donde haga falta).
3. **Expo Router** con pestañas vacías para Hoy, Bandeja, Categorías, Pendientes e Historial (rutas: `(tabs)/hoy`, `(tabs)/bandeja`, `(tabs)/categorias`, `(tabs)/pendientes`, `(tabs)/historial`). Textos visibles en español.
4. **`src/app/_layout.tsx`** envuelve la app con un `ThemeProvider` **vacío** de `src/theme/provider.tsx` (lo rellenará T14) y con el `QueryClientProvider` de TanStack Query. Deja el layout preparado para que T02 añada la protección de pantallas.
5. **NativeWind y React Native Reusables** inicializados (componentes en `src/components/ui`; mínimo, con un componente de muestra como `Button`), `lucide-react-native`. **Si NativeWind o React Native Reusables no son compatibles con el SDK 56, PARA**: no cambies de librería; informa (ver «Paradas»).
6. **Dependencias**: exactamente las de la tabla de Stack de `AGENTS.md` (TanStack Query, Zod, `@supabase/supabase-js`, `supabase` CLI como dependencia de desarrollo, `@react-native-community/datetimepicker`, lo que pida la guía oficial de Supabase para Expo para guardar la sesión, Jest con `jest-expo`, React Native Testing Library, ESLint, Prettier), más lo que ellas instalen por su cuenta y los `expo-*` que el SDK necesite (con `npx expo install`, dentro del contenedor). **Nada más.** Solo T01 toca `package.json`.
7. **Tests**: Jest y RNTL con un test trivial de un componente; y un test de integración mínimo (`npm run test:integration`) que se conecte al Supabase local y compruebe que responde (sin tablas: el modelo de datos lo crea T02).
8. **Supabase local**: `supabase/config.toml` con la configuración por defecto, **registro de usuarios desactivado** (`enable_signup = false` en auth), y una carpeta `supabase/migrations/` vacía (con `.gitkeep`). **No crees tablas ni migraciones**: son de T02.
9. **Variables**: `.env.example` con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (valores de ejemplo del Supabase local, que son públicos y conocidos; nada que parezca un secreto real) y `.nvmrc` con 24. Telemetría apagada: `EXPO_NO_TELEMETRY=1` (y la de la Supabase CLI, y la de cualquier herramienta nueva: **comprueba en su documentación cómo se apaga**), prohibición 10.
10. **Scripts de `package.json` y comandos de `AGENTS.md`**: `lint`, `typecheck`, `test`, `test:integration`, y los de arrancar la app y exportar la web (`npx expo export --platform web`). Todos tienen que poder lanzarse **dentro de Docker** con un comando corto (por ejemplo `docker compose run --rm app npm run lint`); añade un envoltorio sencillo si ayuda. `test:e2e` queda para T15: déjalo anotado como pendiente.
11. **Integración continua** (`.github/workflows/ci.yml`): lint, tipos, tests, integración con Supabase local, exportación de la web y **gitleaks** (como paso de CI, no como dependencia). Si usas acciones de terceros, que sean las oficiales/muy conocidas con versión fijada, y **sin secretos**.
12. **README.md** con «cómo arrancar» (todo en Docker) y cómo abrir la app con Expo Go en la misma red.
13. **`AGENTS.md`**: rellena en la tabla de Stack las versiones reales que hayas fijado (donde pone `T01`) y reescribe la sección «Comandos» con los comandos reales dentro de Docker. Solo eso de `AGENTS.md`.
14. **`.gitignore`**: añade lo propio del proyecto (dependencias, compilados, `.expo`...), sin quitar nada de lo que ya hay.

## Contrato

Los comandos y la estructura de `AGENTS.md`; las versiones reales quedan en su tabla de Stack al terminar.

## Fuera de alcance (no lo toques)

- Tablas, migraciones, login ni protección de pantallas (T02); motor de fechas (T03); estilo, temas, tokens (T14; `ThemeProvider` vacío); emulador, Maestro y MCP de Chrome en Docker (T15); despliegue, `eas.json` y Vercel (T12).
- `docs/contexto.md`, `docs/05-plan.md`, `docs/decisiones.md`, Jira, otros encargos. **No hagas merge.**
- No reformatees ficheros existentes que no necesites tocar. No añadas dependencias fuera de la lista. No publiques nada en servicios externos ni compiles con EAS.

## Paradas (para y dilo con `orca orchestration ask`, o en tu informe si no hay forma)

- NativeWind o React Native Reusables incompatibles con el SDK 56, o algo que **no pueda ir en Docker**.
- Necesitas una dependencia que no está en la lista, o instalar algo en el sistema.
- Cualquier cosa que parezca pedir secretos o dinero.

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] `docker compose` levanta el servidor de Expo y la web sirve la app (pestañas visibles); la salida del servidor muestra el QR/URL para Expo Go sin `--tunnel`.
- [ ] Dentro de Docker pasan: lint, typecheck, tests, integración con Supabase local y `expo export --platform web`. **Pega la salida de cada uno** en el informe.
- [ ] Nada del proyecto instalado en el sistema (solo contenedores); los ficheros del repositorio son del usuario, no de root.
- [ ] La CI está en verde en el PR (gitleaks incluido).
- [ ] `AGENTS.md` tiene los comandos y las versiones reales; README explica cómo arrancar.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-2` en el título. **No hagas merge.**

## Cómo informar al terminar

Responde con estos seis puntos y termina con `worker_done` (`--outcome succeeded|failed`):

1. Qué has hecho, en tres líneas.
2. Ficheros tocados.
3. Decisiones que has tomado tú y por qué (versiones fijadas incluidas).
4. Dudas o cosas que no estaban especificadas.
5. Resultado de los tests (comando y salida resumida).
6. Enlace al PR.
