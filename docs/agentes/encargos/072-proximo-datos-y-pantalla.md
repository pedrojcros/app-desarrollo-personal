# Encargo 072 — Próximo, datos y pantalla

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1.1, RF-41 (DEC-51, fila 7 del pulido) |
| Ticket | `ADP-44` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6.1-sol` |
| Skills | `codigo-legible`, `test-driven-development` y `expo-router` |
| Rama | `ADP-44-proximo-pantalla`, desde `origin/develop` |
| Depende de | 070 y 075 (dominio de Próximo) y 071 (pestaña Listas), ya fusionados |
| Reservado | `src/data/upcoming*.ts`, `src/data/query-keys.ts` y su test, `src/components/upcoming/**`, `src/app/(tabs)/proximo.tsx`, `src/app/(tabs)/_layout.tsx`, `src/tests/tabs-layout.test.tsx`, `src/components/catalog/**`, y en `docs/04-arquitectura.md` solo la línea que enumera las pantallas de `src/app/` |

Lee la regla de legibilidad de `AGENTS.md`. El Supabase local **ya está arrancado y es compartido**: úsalo, pero no hagas `db reset`, `stop` ni `start`. El emulador no hace falta (Maestro va en el 073). Si el worktree no tiene `node_modules`, `./docker/app/run npm ci`; si no tiene `.env`, `cp .env.example .env`.

## Objetivo

La vista **Próximo** (RF-41 en `docs/02-funcionalidades.md`, RN-46 y escenario 11 de CU-03 en `docs/03-casos-de-uso.md`): una pestaña nueva que enseña lo que toca desde mañana hasta el domingo de la cuarta semana siguiente, agrupado por semana y por día, solo para consultar.

## Contexto que necesitas

- El apartado «072 — Próximo, datos y pantalla» de `docs/propuestas/pulido-visual.md`.
- El dominio ya hecho, en `src/domain/views/upcoming.ts`: `getUpcomingRange`, `getUpcomingItems`, `groupUpcomingItems`, `getUpcomingWeeks`, `formatWeekTitle` y los tipos `UpcomingWeek` y `UpcomingDay`. **No lo cambies.**
- Como modelo de capa de datos, `src/data/today.ts` (lectura en paralelo, `DataResult`, hook con TanStack Query) y `src/data/history.ts` (lectura de un rango de fechas); como modelo de pantalla, `src/app/(tabs)/pendientes.tsx` o `hoy.tsx` y sus componentes.

## Contrato de la caché (importante)

Todo lo que cuelga de `['views', ...]` guarda un `ViewData` (`{ items: ViewItem[] }`, en `src/domain/items.ts`): al marcar algo en otra vista, `useMarkItem` parchea **todas** esas cachés como listas planas. Por eso:

- `fetchUpcomingView(today, timeZone?)` devuelve `DataResult<ViewData>` con la **lista plana** de `getUpcomingItems` (hábitos con sus reglas, marcas del rango y tareas con fecha en el rango de `getUpcomingRange`, leyendo por páginas como `today.ts`).
- La clave es `queryKeys.upcoming(today)` = `['views', 'upcoming', today]`, para que crear, cambiar o archivar algo la refresque como al resto de vistas.
- `useUpcomingView(today)` agrupa al leer, con `select` de TanStack Query y `groupUpcomingItems(data.items, today)`, y devuelve las semanas. Nunca guardes semanas en la caché.

## Qué hacer

1. **Datos:** `src/data/upcoming.ts` con `fetchUpcomingView` y `useUpcomingView` según el contrato; la clave en `query-keys.ts` con su test.
2. **Pantalla** `(tabs)/proximo.tsx`, fina, y sus piezas en `src/components/upcoming/`: una lista que se desplaza, con el título de cada semana (`formatWeekTitle`), el de cada día («Miércoles 21») y las filas con nombre, hora o franja y categoría, reutilizando las piezas de fila que ya usa Hoy **sin** botones de marcar. Una semana vacía dice «Semana libre». Tocar una fila abre su ficha (`/tareas/[id]` o `/habitos/[id]`).
3. **Pestaña** «Próximo» (icono `CalendarDays` de `lucide-react-native`), la segunda: Hoy · Próximo · Listas · Pendientes · Historial. Actualiza `src/tests/tabs-layout.test.tsx` a cinco pestañas.
4. Estados de carga, error con «Reintentar» y vacío, como las demás vistas. RNF-03: 44 puntos de toque, etiquetas accesibles (la fila dice su nombre, día y que abre la ficha), títulos de semana y de día como encabezados.
5. **Catálogo** (`src/app/(dev)/catalog.tsx` usa `src/components/catalog/**`): las piezas nuevas entran en él, y la maqueta de la barra de pestañas de `theme-panel.tsx` pasa a Hoy · Próximo · Listas · Pendientes · Historial.
6. **Tests:** pantalla con datos, semana libre, error con «Reintentar», que la fila abre la ficha y que no hay forma de marcar; que la caché guarda un `ViewData` plano; integración contra el Supabase local de `fetchUpcomingView` con el rango correcto (`src/data/upcoming.integration.test.ts`, como `history.integration.test.ts`).
7. `docs/04-arquitectura.md`: la línea de `src/app/` que enumera las pantallas («hoy, bandeja, categorías, pendientes, historial, login») pasa a las de ahora (hoy, próximo, listas, bandeja, pendientes, historial, login).
8. **Comprobación en la web, en formato móvil:** siembra el Supabase local con datos realistas (`scripts/seed/README.md`, «Uso local»: `SEED_PROFILE=realistic`, usuario `seed@example.com` y una contraseña local que generes sin imprimirla), arranca la web en el puerto **8092** (`./docker/app/run npx expo start --web --port 8092`) y, con el MCP `chrome-devtools`, **redimensiona siempre la ventana a 360×800 antes de mirar**. En Próximo debe salir «Nadar» los miércoles, tareas de las próximas semanas y ningún hábito diario. Al terminar, para ese servidor de Expo.

## Fuera de alcance

- `src/domain/**` (si el dominio no te sirve, pregunta), `src/components/quick-add/**`, `src/components/category-select/**`, `src/components/today/**` y las demás pantallas.
- `docs/` salvo la línea de `04-arquitectura.md` del punto 7. `docs/contexto.md`, la bitácora y las decisiones las actualiza el orquestador.

## Criterio de hecho

- [ ] Con los datos sembrados, Próximo enseña «Nadar» los miércoles y las tareas de las próximas semanas, sin los hábitos diarios, a 360 px de ancho.
- [ ] `./docker/app/run npm run lint`, `./docker/app/run npm run typecheck`, `./docker/app/run npm run test` y `./docker/app/run npm run test:integration` en verde (la batería completa, con `scripts/with-heavy-lock`).
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR **contra `develop`** con `ADP-44` en el título. **No hagas merge**.

## Cómo informar al terminar

En la descripción del PR, en formato corto (DEC-45): **Hecho**, **Ficheros**, **Decisiones**, **Dudas**, **Tests** (comandos y resultado en una línea cada uno) y **PR**, más la ruta de una captura de Próximo a 360 px guardada en `~/capturas-adp/` (fuera del repositorio). Si algo no está claro, pregunta con `orca orchestration ask`. Al final, `worker_done` con un resumen de tres frases y `--outcome succeeded|failed`.
