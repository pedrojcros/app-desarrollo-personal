# Plan

Lo que `/ejecutar-plan` ejecuta. Lo escribe el arquitecto con el humano (sesión 7) y no se retoca a mano durante la ejecución: si cambia, se vuelve a `/arquitecto`.

## Estado del plan

| Campo | Valor |
|---|---|
| Estado | `EN BORRADOR` (replanificado el 2026-10-06 para móvil primero, DEC-24) |
| Aprobado el | — *(la versión anterior, para Next.js, se aprobó el 2026-10-06; ver la bitácora)* |
| Aprobado por | — |
| Palabras del humano al aprobar | — |
| Modo de seguimiento de tareas | Jira (`ADP`), decidido en DEC-02 |

Estados posibles: `EN BORRADOR` → `APROBADO` → `EN EJECUCIÓN` → `CERRADO`. Solo el arquitecto, con la aprobación expresa del humano, pasa de borrador a aprobado.

## Plan listo para ejecutar

Todas las casillas marcadas, o el orquestador se niega a ejecutar.

- [x] La visión y el **fuera de alcance** están escritos y el humano los suscribe (DEC-08, DEC-09, DEC-19, DEC-24)
- [x] Cada funcionalidad IMPRESCINDIBLE tiene criterio de aceptación y, si lo necesita, caso de uso
- [x] Cada funcionalidad IMPRESCINDIBLE está cubierta por al menos una tarea (trazabilidad abajo)
- [x] Las ADR de las decisiones de arquitectura caras de cambiar están escritas (0002 a 0005; la 0001, sustituida)
- [x] `AGENTS.md` tiene stack, prohibiciones, comandos y convenciones rellenados (ninguna casilla `RELLENAR`)
- [x] Las decisiones del humano que bloquean tareas están cerradas en [decisiones](decisiones.md) (DEC-21 y DEC-24 a DEC-26; el estilo visual se decide en P02 y solo bloquea T14)
- [x] La [lista de defaults](agentes/checklist-defaults.md) está recorrida: cada punto aceptado, ajustado o descartado con motivo
- [x] Los riesgos principales tienen mitigación **y** contingencia
- [x] La primera tarea es el esqueleto, a cargo de un solo agente
- [x] Cada tarea tiene objetivo, criterio de hecho, dependencias, contrato (si lo necesita) y sugerencia de agente
- [x] Los recursos compartidos o numerados (migraciones, ficheros comunes) están reservados por tarea
- [x] Lo que nunca se delega está escrito en [agentes/orquestador](agentes/orquestador.md)
- [x] [Agentes disponibles](agentes/agentes-disponibles.md) está al día y cada agente habilitado probado (Claude, Codex y Copilot, el 2026-10-06)
- [x] Jira comprobado en el equipo de ejecución
- [x] Política de merge y tope de paralelismo decididos
- [x] La entrada final está en la bitácora de [contexto](contexto.md)

## Cómo se lee este plan

- Una **tarea** es una unidad de valor que se puede probar entera. El orquestador la parte en uno o varios **encargos** para los agentes.
- Los **identificadores `Tnn`** no se reutilizan. `Pnn` son tareas de preparación y `Hnn` tareas del humano.
- Tamaño: **S** (menos de media jornada de agente), **M** (una jornada), **L** (se parte antes de ejecutar).
- *Agente sugerido*: **`codex` por defecto (DEC-27)**: el ciclo es dos de Codex, uno de Claude y uno de Copilot. `claude*` marca la tarea candidata al turno de Claude, con el modelo que toque por tamaño (DEC-22). `+revisión` pide una segunda opinión de otro modelo (Claude Opus 5.5, si escribió Codex), y cuenta como un turno de Claude. Ver [agentes disponibles](agentes/agentes-disponibles.md).
- *Skills*: las que el encargo debe pedir; las marcadas «a demanda» van por su ruta en `.agents/skills-a-demanda/`.
- *Puerta*: `requiere-plan` o `requiere-revisión` del humano (DEC-12); «—» si no tiene.
- Una tarea solo puede lanzarse cuando todas sus dependencias están **fusionadas**, no solo hechas.
- **Solo T01 toca `package.json` y los ficheros de configuración de Expo; `compose.yaml`, T01 y después T15.** Si otra tarea necesita un paquete, un script o un ajuste, para y lo dice. Los paquetes `expo-*` se instalan con `npx expo install`.

## Olas previstas

Agrupación orientativa de qué puede ir en paralelo. El orquestador la recalcula con el estado real.

| Ola | Tareas | Paralelismo | Condición para pasar a la siguiente |
|---|---|---|---|
| 0 | T01 (y, aparte, P02 con el humano) | 1 trabajador | T01 fusionada tras la revisión del humano |
| 1 | T02, T03, T15 y, cuando P02 esté cerrada, T14 | 3 a la vez | T02 y T14 fusionadas tras la revisión del humano, y T03 y T15 fusionadas |
| 2 | T04, T07, T08 | 3 | Las tres fusionadas |
| 3 | T05, T06, T09 | 3 | Las tres fusionadas |
| 4 | T10, T11, T12, T16 | 3 a la vez | Las cuatro fusionadas (T12 necesita H02) |
| 5 | T13 | 1 | Fusionada: la versión 1 está completa |

**Hitos de versión:**

- **Versión 1 (`v1.0.0`)**: olas 0 a 5 fusionadas en `develop` y la comprobación de «Preparar una versión para `main`» del [orquestador](agentes/orquestador.md#preparar-una-versión-para-main) superada. El humano pasa `develop` a `main` y se instala el APK (H04).
- **Versión 1.1**: recordatorios locales en el móvil (DEC-24).
- **Versiones 1.x siguientes**: cada funcionalidad deseable, o un grupo pequeño, cuando el humano quiera (ver «Después de la versión 1»).

## Tareas

### P01 — Arreglar Codex y probar Copilot en Orca

- **Objetivo:** que `codex` reciba el encargo al lanzarlo con Orca (hoy falla en `agent_readiness`) y que `copilot` pase la prueba de arranque. Si se consigue, se habilitan en [agentes disponibles](agentes/agentes-disponibles.md).
- **Funcionalidades:** — · **Depende de:** nada; no bloquea ninguna tarea
- **Tamaño:** S · **Agente sugerido:** el orquestador (investigación, no es código de producción); el humano si hay que tocar la configuración de Orca
- **Hecho cuando:** los dos agentes superan la prueba de arranque, o queda escrito por qué no y DEC-04 se cierra con «solo Claude».
- **Hecha (2026-10-06):** ajustes aplicados y prueba superada por los dos agentes; DEC-04 cerrada.
- **Puerta:** — · **Ticket:** ADP-

### P02 — Estilo visual: prototipos con el humano

- **Objetivo:** encontrar el aspecto de la app **antes de programarlo**, en un bucle con el humano: él trae ejemplos visuales y explica qué le gusta; el arquitecto hace prototipos en HTML de las pantallas clave (Hoy, crear una tarea, Historial) en varios estilos; el humano elige y pide cambios; y se repite hasta que diga «este» (DEC-25). Dentro entra si hay modo claro, oscuro o los dos.
- **Quién:** el humano con el arquitecto (`/arquitecto`). No es un encargo para un trabajador.
- **Depende de:** nada. Puede ir en paralelo con la ola 0.
- **Salida:** el prototipo elegido en `docs/diseno/` y sus decisiones (colores, tipografía, espaciado, forma de los componentes, movimiento) en `docs/diseno.md`.
- **Hecho cuando:** el humano aprueba un prototipo con sus palabras.
- **Puerta:** es del humano · **Ticket:** ADP-

### T01 — Esqueleto del proyecto (Expo)

- **Objetivo:** la app vacía pero arrancable en el móvil y en la web, **con todo el entorno dentro de Docker** (DEC-26): un `Dockerfile` de desarrollo sobre la imagen oficial de Node 24 y un `compose.yaml` con el servicio de la app en la red del anfitrión (para que el Expo Go del móvil lo vea), desde el que también se manejan la Supabase CLI y la base de datos local; Expo SDK 56 con TypeScript estricto y la estructura de `expo-project-structure` (rutas en `src/app`); Expo Router con pestañas vacías para Hoy, Bandeja, Categorías, Pendientes e Historial; NativeWind y React Native Reusables inicializados (componentes en `src/components/ui`); TanStack Query y Zod; las dependencias de DEC-25 (el selector de fecha y hora y lo que pida la guía oficial de Supabase para Expo para guardar la sesión), para que nadie más toque `package.json`; Jest (`jest-expo`) y React Native Testing Library con un test trivial; ESLint y Prettier; Supabase CLI con la base de datos local; `.nvmrc`, `.env.example` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`); README con «cómo arrancar» y cómo abrir la app con Expo Go en la misma red (sin `--tunnel`, que pasa por un servicio de terceros); la telemetría de Expo apagada (`EXPO_NO_TELEMETRY=1`, prohibición 10); los comandos de `AGENTS.md`, lanzados dentro de los contenedores; e integración continua (lint, tipos, tests, integración con Supabase local, exportación web y gitleaks).
- **Puntos de enganche para otras tareas:** `src/app/_layout.tsx` ya envuelve la app con un `ThemeProvider` vacío de `src/theme/provider.tsx`, que rellena T14 sin tocar el layout raíz. La protección de las pantallas la añade T02, la única tarea que puede tocar después `src/app/_layout.tsx`.
- **Funcionalidades:** — (base de todas); RNF-08 · **Depende de:** H01 (hecha)
- **Tamaño:** M · **Agente sugerido:** `codex`
- **Skills:** `expo-overview`, `expo-project-structure`, `expo-router`, `source-driven-development`, `flujo-git`, `codigo-legible`; a demanda `ci-cd-and-automation`.
- **Contrato:** los comandos y la estructura de `AGENTS.md`; la tabla de stack, con las versiones reales que fije.
- **Reserva:** `package.json` y su lockfile, `app.json` o `app.config.ts`, la configuración de Babel, Metro, Tailwind y NativeWind, `.github/workflows/`, `supabase/config.toml`, `src/app/_layout.tsx` y el layout de pestañas, el `src/components/ui/` inicial, `compose.yaml` y `docker/app/`.
- **Hecho cuando:** el servidor de Expo, arrancado en su contenedor, abre la app en el Expo Go del humano y en la web; los comandos de `AGENTS.md` funcionan dentro de Docker sin instalar nada del proyecto en el sistema; la integración continua pasa en el PR; `AGENTS.md` tiene los comandos y las versiones reales. Si React Native Reusables o NativeWind no son compatibles con el SDK 56, **parada**: no se cambia de librería sin aprobación.
- **Puerta:** `requiere-revisión` (el humano la abre en su móvil) · **Ticket:** ADP-

### T02 — Base de datos y acceso de un solo usuario

- **Objetivo:** las tablas del [modelo de datos](04-arquitectura.md#modelo-de-datos) con sus restricciones y políticas RLS; inicio de sesión con email y contraseña ([ADR-0004](adr/0004-acceso-un-usuario.md)) desde la app, con la sesión guardada en el dispositivo según la guía oficial de Supabase para Expo; todas las pantallas protegidas salvo el login; registro desactivado; tipos de TypeScript generados de la base de datos.
- **Funcionalidades:** base de todas; RNF-02 · **Depende de:** T01
- **Tamaño:** M · **Agente sugerido:** `codex` `+revisión`
- **Skills:** `supabase-postgres-best-practices`, `security-and-hardening`, `source-driven-development`, `test-driven-development`.
- **Contrato:** el modelo de datos de [04-arquitectura](04-arquitectura.md#modelo-de-datos) es el contrato del resto de tareas.
- **Reserva:** **todas las migraciones de la versión 1** (`supabase/migrations/`); `src/data/supabase/` (el cliente); `src/data/auth/`; `src/data/database.types.ts`; `src/app/login.tsx`; y, solo para proteger las pantallas, `src/app/_layout.tsx`.
- **Hecho cuando:** un test de integración con dos usuarios demuestra que uno no ve ni cambia los datos del otro; sin sesión no se ve ninguna pantalla salvo el login; la sesión sobrevive a cerrar y abrir la app; la integración continua pasa.
- **Puerta:** `requiere-revisión` (seguridad) · **Ticket:** ADP-

### T03 — Motor de fechas y ocurrencias

- **Objetivo:** en `src/domain`, una función pura que, para un hábito con sus versiones de regla, devuelve sus ocurrencias en un rango de fechas, con las cuatro frecuencias, y el orden del día por hora o franja ([ADR-0003](adr/0003-ocurrencias-calculadas.md)).
- **Funcionalidades:** RF-02, RF-03 (orden); RNF-07 · **Depende de:** T01
- **Tamaño:** M · **Agente sugerido:** `codex` `+revisión`
- **Skills:** `test-driven-development`, `api-and-interface-design`, `codigo-legible`.
- **Contrato:** los tipos de `src/domain/types.ts`, que escribe el orquestador en el encargo.
- **Reserva:** `src/domain/types.ts`, `src/domain/calendar-date.ts`, `src/domain/recurrence.ts`.
- **Hecho cuando:** pasan los escenarios 2, 3 y 4 de CU-01 como tests; hay tests de los cambios de hora (último domingo de marzo y de octubre), de fin de mes y año bisiesto, de «cada N días» y de un cambio de regla que no altera el pasado; cobertura de líneas de `src/domain` de al menos el 90 %.
- **Puerta:** — · **Ticket:** ADP-

### T14 — Sistema visual

- **Objetivo:** llevar a la app el estilo aprobado en P02, **sin inventarlo**: tokens semánticos de color, tipografía, espaciado, radios, sombras y movimiento; aplicarlos a los componentes de React Native Reusables; una pantalla de catálogo (solo en desarrollo) con todos los componentes y sus estados; y en `docs/diseno.md`, cómo usar los tokens.
- **Funcionalidades:** base visual de todas las pantallas; RNF-03 · **Depende de:** T01 y **P02**
- **Tamaño:** M · **Agente sugerido:** `claude*`
- **Skills:** `expo-design-system`, `expo-native-ui`, `frontend-ui-engineering`; a demanda `better-colors`, `better-typography`, `better-layout`, `emil-design-eng`, `impeccable`.
- **Reserva:** `src/theme/` (incluido `provider.tsx`), la sección de tokens de la configuración de Tailwind, el estilo de `src/components/ui/`, la ruta de catálogo `src/app/(dev)/`, y la sección de uso de `docs/diseno.md`.
- **Hecho cuando:** el catálogo enseña cada componente en cada tema que se haya elegido y se parece al prototipo aprobado; todos los textos cumplen contraste AA; **el humano lo da por bueno** en su móvil.
- **Puerta:** `requiere-revisión` (el humano compara con su prototipo) · **Ticket:** ADP-

### T15 — Emulador y navegador en Docker

- **Objetivo:** que los agentes prueben la app sin instalar nada en el sistema (DEC-26): una imagen propia con el emulador de Android (con KVM), una AVD y Maestro; otra con Chromium y el MCP de Chrome (versión fijada), y `.mcp.json` apuntando a ella; los dos servicios en `compose.yaml`; un flujo trivial de Maestro que abre la app en el Expo Go del emulador; y, en el README, cómo verlo en el panel de Orca, que usa `adb` y el programa del emulador de `~/Android/Sdk` (opción B de DEC-26).
- **Funcionalidades:** RNF-08 (cómo se comprueba) · **Depende de:** T01
- **Tamaño:** M · **Agente sugerido:** `codex`
- **Skills:** `android-emulator-qa`, `source-driven-development`, `verification-before-completion`; a demanda `browser-testing-with-devtools`.
- **Reserva:** `docker/android/`, `docker/chrome-mcp/`, sus servicios en `compose.yaml`, `.mcp.json` y el flujo trivial de `e2e/`.
- **Hecho cuando:** con un comando arranca el emulador en Docker y el flujo trivial de Maestro pasa contra la app que sirve el contenedor de T01; el MCP de Chrome abre la versión web desde su contenedor; las imágenes parten de imágenes oficiales con versiones fijadas. Si algo no puede ir en Docker, **parada**: se le pregunta al humano. Parte de [la prueba de DEC-26](agentes/prueba-emulador-docker.md).
- **Puerta:** — · **Ticket:** ADP-

### T04 — Gestión de categorías y secciones

- **Objetivo:** crear y eliminar categorías (lo que contienen pasa a la Bandeja de entrada) y las secciones que las agrupan (DEC-29); un selector de categoría reutilizable, que enseña la sección, para los formularios y el añadir rápido.
- **Funcionalidades:** RF-20 (crear y secciones), RF-21 · **Depende de:** T02, T14
- **Tamaño:** M · **Agente sugerido:** `codex`
- **Skills:** `expo-router`, `expo-data-fetching`, `codigo-legible`, `test-driven-development`.
- **Contrato:** el componente `CategorySelect` y las funciones y hooks de `src/data/categories.ts` y `src/data/sections.ts`, con las firmas que escribe el orquestador.
- **Reserva:** `src/data/categories.ts`, `src/data/sections.ts`, `src/components/category-select/`, la pantalla de gestión en `src/app/(tabs)/categorias/index.tsx`.
- **Hecho cuando:** pasan los escenarios 1, 2, 3, 5, 6 y 7 de CU-07.
- **Puerta:** — · **Ticket:** ADP-

### T05 — Hábitos: crear, modificar y archivar

- **Objetivo:** el formulario completo de hábito (el «Más» del añadir rápido) con las cuatro frecuencias, hora o franja y categoría; modificar (un cambio de frecuencia crea una versión nueva de la regla); archivar.
- **Funcionalidades:** RF-01, RF-03, RF-18 y RF-19 (hábitos), RF-20 (asignar) · **Depende de:** T02, T03, T04, T14
- **Tamaño:** M · **Agente sugerido:** `codex`
- **Skills:** `expo-native-ui`, `expo-data-fetching`, `codigo-legible`, `test-driven-development`. El selector de fecha y hora es el de DEC-25.
- **Reserva:** `src/data/habits.ts`, `src/app/habitos/`.
- **Hecho cuando:** pasan los escenarios 1, 5 y 6 de CU-01 y los de CU-06 aplicados a hábitos.
- **Puerta:** — · **Ticket:** ADP-

### T06 — Tareas: crear, modificar y archivar

- **Objetivo:** el formulario completo de tarea (el «Más» del añadir rápido: nombre, notas, fecha, hora y categoría; sin categoría, a la Bandeja); avisar si la fecha es pasada; modificar y archivar.
- **Funcionalidades:** RF-05, RF-18 y RF-19 (tareas), RF-20 (asignar) · **Depende de:** T02, T04, T14
- **Tamaño:** S · **Agente sugerido:** `codex`
- **Skills:** `expo-native-ui`, `expo-data-fetching`, `codigo-legible`, `test-driven-development`. El selector de fecha y hora es el de DEC-25.
- **Reserva:** `src/data/tasks.ts`, `src/app/tareas/`.
- **Hecho cuando:** pasan los escenarios 1 a 5 de CU-02 y los de CU-06 aplicados a tareas.
- **Puerta:** — · **Ticket:** ADP-

### T07 — Cambiar el estado y aviso con «Deshacer»

- **Objetivo:** las mutaciones para marcar hecho, no hecho o volver a pendiente (ocurrencias y tareas, guardando cuándo), **optimistas** con TanStack Query (se ven al instante y se revierten si Supabase falla), y el componente de aviso con «Deshacer» que usarán todas las vistas. Si el aviso necesita una librería, es una dependencia nueva: parada.
- **Funcionalidades:** RF-06, RF-07 · **Depende de:** T02, T03, T14
- **Tamaño:** S · **Agente sugerido:** `codex`
- **Skills:** `expo-data-fetching`, `expo-animation`, `test-driven-development`; a demanda `emil-design-eng`.
- **Contrato:** las firmas de los hooks de marcado y del componente de aviso, que escribe el orquestador; los consumen T09, T10 y T11.
- **Reserva:** `src/data/marks.ts`, `src/components/undo-toast/`.
- **Hecho cuando:** pasan como tests los escenarios 1, 2, 9 y 10 de CU-03 (con un componente de prueba, sin la pantalla de Hoy) y el de error E1 (si Supabase falla, el estado vuelve atrás).
- **Puerta:** — · **Ticket:** ADP-

### T08 — Historial

- **Objetivo:** la pantalla de historial por rango (7 días por defecto), con el estado final de cada hábito y tarea, incluido «sin marcar».
- **Funcionalidades:** RF-15 · **Depende de:** T02, T03, T14
- **Tamaño:** M · **Agente sugerido:** `codex`
- **Skills:** `expo-data-fetching`, `vercel-react-native-skills`, `test-driven-development`.
- **Reserva:** `src/domain/views/history.ts`, `src/data/history.ts`, `src/app/(tabs)/historial/`.
- **Hecho cuando:** pasan los escenarios 1, 3, 4 y 5 de CU-05.
- **Puerta:** — · **Ticket:** ADP-

### T09 — Vista Hoy

- **Objetivo:** lo pendiente de hoy (ocurrencias y tareas con fecha de hoy), ordenado por hora o franja, nunca sin fecha ni vencido; marcar con un toque, con aviso y «Deshacer»; mensaje de día libre.
- **Funcionalidades:** RF-08; RNF-06 · **Depende de:** T03, T07
- **Tamaño:** M · **Agente sugerido:** `codex`
- **Skills:** `expo-native-ui`, `vercel-react-native-skills`, `test-driven-development`.
- **Reserva:** `src/domain/views/today.ts`, `src/app/(tabs)/hoy/`.
- **Hecho cuando:** pasan los escenarios 1 a 6 y 10 de CU-03.
- **Puerta:** — · **Ticket:** ADP-

### T10 — Vista de categoría y Bandeja de entrada

- **Objetivo:** lo pendiente de una categoría o de la Bandeja, con y sin fecha; marcar desde ahí (lo marcado desaparece) con aviso y «Deshacer».
- **Funcionalidades:** RF-11 · **Depende de:** T04, T07
- **Tamaño:** S · **Agente sugerido:** `codex`
- **Skills:** `expo-router`, `expo-native-ui`, `test-driven-development`.
- **Reserva:** `src/domain/views/category.ts`, `src/app/(tabs)/bandeja/`, `src/app/categorias/[id].tsx`.
- **Hecho cuando:** pasan los escenarios 5 y 6 de CU-03 en la vista de categoría.
- **Puerta:** — · **Ticket:** ADP-

### T11 — Pendientes de días anteriores

- **Objetivo:** la lista de ocurrencias sin marcar y tareas vencidas, agrupada por día, de la más reciente a la más antigua, para marcarlas.
- **Funcionalidades:** RF-12 · **Depende de:** T03, T07
- **Tamaño:** M · **Agente sugerido:** `codex`
- **Skills:** `expo-native-ui`, `vercel-react-native-skills`, `test-driven-development`.
- **Reserva:** `src/domain/views/past-pending.ts`, `src/app/(tabs)/pendientes/`.
- **Hecho cuando:** pasa el escenario 1 de CU-04 y, sin nada pendiente, se muestra «todo al día».
- **Puerta:** — · **Ticket:** ADP-

### T12 — Despliegue, migraciones y copia de seguridad

- **Objetivo:** la web exportada en Vercel, con sus cabeceras de seguridad (`develop` y los PR contra Supabase `pruebas`; `main` contra `produccion`); `eas.json` con un perfil que genera el APK instalable (la primera compilación se hace al publicar, en H04); la integración continua aplica las migraciones a `pruebas` al fusionar en `develop`, y a `produccion` solo desde `main`; exportación semanal automática de los datos; el README explica cómo restaurar y cómo reactivar Supabase si se pausa.
- **Funcionalidades:** RNF-04 · **Depende de:** T02 y **H02**
- **Tamaño:** M · **Agente sugerido:** `codex`
- **Skills:** a demanda `ci-cd-and-automation`, `shipping-and-launch`; `source-driven-development` para `eas.json`.
- **Reserva:** `.github/workflows/deploy-*.yml` y `.github/workflows/backup.yml` (T01 reserva el resto de flujos), `eas.json`, la configuración de Vercel, `scripts/backup/`.
- **Hecho cuando:** un PR obtiene su web de prueba; una exportación se restaura en local con los mismos datos; `eas.json` sigue la documentación oficial de EAS (la primera compilación la lanza el humano en H04).
- **Puerta:** — · **Ticket:** ADP-

### T16 — Añadir rápido

- **Objetivo:** la barra de añadir rápido (DEC-30): al pulsar + en cualquier pantalla, aparece encima del teclado con el nombre listo para escribir y los atajos a mano (tarea o hábito, fecha con atajos, categoría con su sección y «Más» para el formulario completo). Toma la fecha y la categoría de la pantalla donde se abre. El diseño es el elegido en P02.
- **Funcionalidades:** RF-01 y RF-05 (crear deprisa); RNF-06 · **Depende de:** T05, T06
- **Tamaño:** M · **Agente sugerido:** `codex`
- **Skills:** `expo-native-ui`, `expo-animation`, `test-driven-development`, `codigo-legible`.
- **Contrato:** usa las funciones de crear de `src/data/tasks.ts` y `src/data/habits.ts` y el selector de categoría de T04.
- **Reserva:** `src/components/quick-add/` y el botón + flotante.
- **Hecho cuando:** crear una tarea con solo el nombre cuesta escribirlo y confirmar (RNF-06); pasan los escenarios 6 y 7 de CU-02; el teclado no tapa la barra, ni en Android ni en la web.
- **Puerta:** — · **Ticket:** ADP-

### T13 — Caminos críticos y calidad

- **Objetivo:** flujos de Maestro de los caminos críticos en el emulador de Docker (T15); el script de datos sintéticos de un año; las comprobaciones de RNF-01, RNF-03, RNF-06 y RNF-08 (incluida la web con el MCP de Chrome).
- **Funcionalidades:** RNF-01, RNF-03, RNF-06, RNF-08 · **Depende de:** T05, T06, T09, T10, T11, T15 y T16
- **Tamaño:** M · **Agente sugerido:** `codex`
- **Skills:** `android-emulator-qa`, `verification-before-completion`; a demanda `better-accessibility`, `browser-testing-with-devtools`, `performance-optimization`.
- **Reserva:** `e2e/` (salvo el flujo trivial de T01), `scripts/seed/`.
- **Hecho cuando:** los flujos pasan en el emulador y RNF-01, RNF-03, RNF-06 y RNF-08 se cumplen con sus números.
- **Puerta:** — · **Ticket:** ADP-

## Trazabilidad

| Funcionalidad | Tareas |
|---|---|
| RF-01 | T05, T16 |
| RF-02 | T03 |
| RF-03 | T03, T05 |
| RF-05 | T06, T16 |
| RF-06 | T07 |
| RF-07 | T07 |
| RF-08 | T09 |
| RF-11 | T10 |
| RF-12 | T11 |
| RF-15 | T08 |
| RF-18 | T05, T06 |
| RF-19 | T05, T06 |
| RF-20 | T04, T05, T06 |
| RF-21 | T04 |
| RNF-01, RNF-03, RNF-06 | T13 (RNF-03 también T14; RNF-06 también T16) |
| RNF-02 | T02 |
| RNF-04 | T12 |
| RNF-05 | ADR-0005 |
| RNF-07 | T03 |
| RNF-08 | T01, T15, T13 |

## Tareas que no se delegan

Escritas aquí y en [agentes/orquestador](agentes/orquestador.md#lo-que-nunca-se-delega).

| Tarea | Por qué la hace el humano | Qué prepara antes el orquestador |
|---|---|---|
| H01 — Que `git push` funcione desde las sesiones de los agentes *(hecho el 2026-10-06: remoto por HTTPS con `gh`)* | Es la configuración de su cuenta | — |
| H02 — Crear las cuentas de Vercel (conectada al repositorio), Supabase (proyectos `pruebas` y `produccion`) y **Expo** (para EAS Build); poner las claves en Vercel y en GitHub; crear su usuario en producción | Son sus cuentas y sus secretos | Los pasos y los nombres exactos de las variables (T12) |
| H03 — Revisar T01, T02 y T14 antes de fusionar (en T14, compararla con su prototipo) | Puerta `requiere-revisión` | Un resumen, el diff y cómo verlo en el móvil |
| H04 — Publicar la versión 1: `develop` a `main`, etiqueta, migraciones a producción, **compilar el APK con EAS e instalarlo en el móvil** | Solo el humano toca `main` | La comprobación de «Preparar una versión para `main`» |
| H05 — Instalar **Expo Go** en el móvil, para ver la app desde T01 (el emulador va en Docker, T15) | Es su móvil | — |

## Después de la versión 1

Primero la versión 1.1 y después las deseables, en este orden sugerido (cada una, una versión 1.x cuando el humano quiera):

| Orden | Qué | Por qué en este orden |
|---|---|---|
| 1 | **Versión 1.1: recordatorios** locales en el móvil («en 4 días entregas X») | Es lo que más pidió el humano y con Expo es barato (DEC-24) |
| 2 | RF-13 Reprogramar una tarea vencida | Es lo que más alivia los pendientes |
| 3 | RF-09 «Marcadas hoy» y RF-17 Corregir desde el historial | Correcciones |
| 4 | RF-10 Ver otros días | Ver lo que viene |
| 5 | RF-14 Marcar un día entero como no hecho | Atajo |
| 6 | RF-16 Filtrar el historial y RF-22 Renombrar categoría | Comodidad |
| 7 | RF-04 Duración | Solo sirve con Google Calendar |
| Versión 2 | Conexión con Google Calendar; Google Play cuando el humano decida | DEC-18, DEC-24 |
