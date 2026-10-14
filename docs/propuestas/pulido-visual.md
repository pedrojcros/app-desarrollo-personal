# Pulido visual (1.1.1)

> **Lista cerrada y aprobada** el 2026-10-14 (DEC-51): encargos 065 a 073 en el
> apartado 3, listos para `/ejecutar-plan`. Abierta desde el 2026-10-09
> (DEC-48). Lo que el humano vea mal a partir de ahora va al buzón y se revisa al
> empezar la siguiente versión.

**Objetivo que marca el humano:** «quiero que la pantalla de Hoy sea **la más
cómoda de todas**». Y lo precisa el 2026-10-14: «la idea principal de Hoy es que
el usuario vea las tareas pendientes de hoy y las marque cómodamente, sin
distracciones, con una interfaz limpia». Es el criterio para decidir cualquier
duda sobre Hoy: si algo de Hoy no sirve para ver o marcar lo de hoy, sobra.

## 1. Cómo se revisa

- **Con qué versión:** la de `develop`, no la de producción. Producción es
  `v1.0.0` y no tiene lo fusionado después, como ADP-27.
- **Con qué datos y dónde:** en la **web de pruebas**
  (`https://app-desarrollo-personal-pruebas.vercel.app`, que publica `develop`
  contra el Supabase de pruebas), con el usuario de demostración y un perfil de
  datos realista (encargo 060, DEC-49). Hasta que 060 esté fusionado: el Supabase
  local con `scripts/seed/seed-synthetic-year.sh` y la web en
  `http://localhost:8081`. Los datos reales del dueño, en producción, nunca se
  mezclan con los de prueba.
- **Capturas:** en `~/capturas-adp/`, **fuera del repositorio**, porque el
  repositorio es público (DEC-44). Solo las capturas con datos sintéticos que
  haga falta pasar a un encargo se copian a `docs/diseno/capturas/pulido/`.

## 2. Lo que ve el humano

Clasificación: **S** = sistema visual (va antes de la 1.2) · **P** = una
pantalla que la 1.2 no toca (puede ir con la primera ola de la 1.2) · **R** =
rediseño grande (propuesta aparte) · **Hecho** = ya está en `develop`.

| # | Fecha | Lo que dice el humano | Pantalla | Clase | Nota del arquitecto |
|---|---|---|---|---|---|
| 1 | 2026-10-09 | «En Hoy la palabra Hoy aparece dos veces» | Hoy | **Hecho** | Arreglado en `develop` (ADP-27, PR #73); no está aún en producción. Comprobarlo con la versión de `develop` |
| 2 | 2026-10-14 | «En el apartado HOY aparece “Hoy” dos veces y también sale la fecha, que es redundante: si pulso Hoy es porque sé en qué día estoy. Este apartado tiene que mostrar las tareas de la forma más cómoda y limpia posible, para evitar distracciones, porque será donde los usuarios entren únicamente a marcar tareas» | Hoy | **P** | Nota del orquestador: en `develop` la cabecera ya va vacía, pero la pantalla pinta su propio «Hoy» en grande (36 px) con la fecha, y la pestaña de abajo también dice «Hoy». En esa fecha están además las flechas para ver otros días (1.x). **Decidido (DEC-51):** ni título, ni fecha, ni flechas: solo una línea fina con el progreso del día; lo futuro pasa a Próximo. El «Hoy» sigue como encabezado invisible para el lector de pantalla. Encargo 065 |
| 3 | 2026-10-14 | «Cuando pulso el botón de añadir tarea quiero una animación del botón desplazándose al centro y expandiéndose para mostrar el menú nuevo de crear tarea» | Añadir rápido | **P** | Va después de la fila 5: se anima el menú ya reducido. `react-native-reanimated` ya está instalado (lo trae NativeWind), así que no hace falta ninguna dependencia. Con «reducir movimiento» del sistema, sin animación. Encargo 067 |
| 4 | 2026-10-14 | «Cuando echo para atrás en el móvil (deslizando desde un lateral) se quita el teclado, como en todas las aplicaciones, pero el menú de añadir tarea sigue abierto» | Añadir rápido | **P** (fallo) | Es un `Modal` que se cierra con el atrás del sistema, pero con el teclado abierto Android gasta el primer atrás en cerrar el teclado. **Propuesta:** como en Todoist, si el teclado se cierra por el sistema y no hay un selector abierto, se cierra también el menú. El borrador ya se guarda (`use-quick-add-draft`), así que no se pierde lo escrito. Decidido en DEC-51; encargo 066 |
| 5 | 2026-10-14 | «El menú de añadir tarea es demasiado grande, ocupa mucha parte de la pantalla. Reduce la letra como mínimo, sobre todo la del título de la tarea: el mismo tamaño que un texto de WhatsApp» | Añadir rápido | **P** | El campo del título usa `text-title`, que es 36 px, el mismo tamaño que el título de una pantalla. **Propuesta:** el tamaño `body` (15 px, como un mensaje de WhatsApp) y menos relleno, para que el menú sea una barra encima del teclado y no media pantalla. Encargo 066 |
| 6 | 2026-10-14 | «Me sale un menú de mi Redmi con una llave de gestor de contraseñas, wallet y ubicación; en Todoist no sale. A lo mejor hay algo para sacar el teclado simple» | Añadir rápido | **P** | La llave, la cartera y la ubicación son la barra de autorrelleno de Chrome para Android (contraseñas, tarjetas y direcciones), que sale encima del teclado en la web; Todoist es una app instalada y no la tiene. **Propuesta:** marcar los campos como no autorrellenables (`autoComplete="off"` en la web e `importantForAutofill="no"` en Android). En la web Chrome puede seguir mostrándola a veces; en el APK desaparece. Encargo 066. El humano no ha dicho aún si lo vio en Chrome o en Expo Go: el arreglo es el mismo, y en Chrome puede no desaparecer del todo |
| 7 | 2026-10-14 | «Hay que hacer un apartado llamado **Próximo** para ver de hoy en adelante lo que queda, o esa misma semana (intuyo que es Pendientes), pero creo que prefiero un menú que muestre por semana llamado Próximo» | Nueva vista | **P** (alcance nuevo) | Es una **vista nueva** (RF-41): cambia el alcance. Pendientes muestra lo atrasado, no lo que viene. Propuesta en DEC-51, puntos 3 a 6: de mañana a cuatro semanas, agrupada por semana y día, sin hábitos diarios, en una pestaña nueva. Encargos 070 y 072 |
| 8 | 2026-10-14 | «La pantalla de Historial entiendo que no está hecha completamente todavía, porque solo me deja elegir cosas y no ver nada» | Historial | **P** (fallo) | Confirmado en el código: `historial.tsx` es una `View` sin `ScrollView`; las dos fechas y los filtros llenan la pantalla y la rejilla queda debajo, sin forma de llegar. Arreglo: que la pantalla se desplace (DEC-51, punto 9). Encargo 068 |
| 9 | 2026-10-14 | «Hay un error en crear tarea o hábito: al elegir la categoría, el menú desplegado se mete por debajo del texto» | Formularios de tarea y hábito | **P** (fallo) | El desplegable de `category-select` es una capa absoluta con `z-20`, pero en la web el `z-index` solo ordena dentro de su contenedor, y los campos de después lo tapan. Arreglo: en los formularios, lista dentro del formulario (DEC-51, punto 8). Encargo 069 |
| 10 | 2026-10-14 | «¿Dónde se crean categorías? El apartado Categorías de la barra de navegación inferior me parece que sobra» | Navegación | **P** | Hoy las categorías se crean en esa pestaña. Propuesta: pestaña «Listas» con la Bandeja, las categorías y «Nueva categoría», para que Próximo entre sin pasar de cinco pestañas (DEC-51, punto 5). Encargo 071 |

## 3. Encargos

### 060 — Datos de demostración en la web de pruebas (**hecho** el 2026-10-10: `ADP-33`, PR #77, y su corrección 061)

Para que el humano revise la app en `https://app-desarrollo-personal-pruebas.vercel.app` con datos parecidos a su uso real.

1. **Perfil `realistic`** en el script de siembra (`SEED_PROFILE=realistic`; el perfil actual, `year`, sigue siendo el de por defecto, porque lo usa el test de rendimiento, que no cambia). Determinista, con nombres en español de la vida de un estudiante:
   - 4 categorías con alguna sección (por ejemplo Universidad, Salud, Casa, Compra) y algo en la Bandeja;
   - **10 hábitos**: 5 diarios (unos con hora exacta y otros con franja), 2 por días de la semana (uno, «Nadar», los miércoles a las 17:00), 1 cada N días, 1 mensual y 1 archivado;
   - **30 tareas**: unas 5 vencidas pendientes, 3 para hoy (una con hora), 8 en las próximas tres semanas, 6 sin fecha (por ejemplo, la lista de la compra) y 8 ya resueltas en el pasado (hechas, no hechas y 2 hechas tarde);
   - **90 días de historial**, con alrededor de un 75 % hechas, un 10 % no hechas y un 15 % sin marcar, y al menos un hábito con una racha en curso de más de una semana.
2. **Destino de pruebas.** La protección de `local-guard.mjs` se amplía: además de local, acepta el Supabase de **pruebas** solo si se pide de forma expresa (`SEED_TARGET=pruebas`) y la URL es la de ese proyecto. Rechaza siempre el de **producción** y cualquier otra URL. Tests de la protección para los cuatro casos.
3. **Usuario de demostración** en pruebas: `demo@example.com`, creado con la API de administración. La clave `service_role` se pide en el momento con `SUPABASE_ACCESS_TOKEN` y no se guarda. La contraseña la elige el humano y vive en `secretos.env` (`PRUEBAS_DEMO_PASSWORD`) y en el secreto del entorno `pruebas` de GitHub; nunca en el repositorio, en un registro ni en el chat.
4. **Volver a sembrar con un botón.** Los datos se generan respecto a «hoy» y envejecen; un flujo manual `seed-pruebas.yml` (*Run workflow* en Actions, entorno `pruebas`) borra y vuelve a sembrar **solo** los datos del usuario de demostración. No se ejecuta solo, para no borrar lo que el humano marque mientras revisa.
5. **README:** cómo entrar en la web de pruebas, cómo volver a sembrar y que la web de pruebas puede pedir la sesión de Vercel (está protegida).

- **Agente:** Codex Sol (toca una protección de seguridad y la CI) · **Tamaño:** M · **Depende de:** nada.
- **Ficheros reservados:** `scripts/seed/**`, `.github/workflows/seed-pruebas.yml`, `README.md` (sección de datos sintéticos y de despliegue).
- **Hecho cuando:** los tests de la protección pasan; el perfil `realistic` tiene tests de sus recuentos; la ejecución manual del flujo deja el usuario de demostración con los datos del perfil, y el humano entra en la web de pruebas y los ve.

**Estado (2026-10-10):** fusionado en `develop` (PR #77). La primera siembra en pruebas la hizo el orquestador desde su ordenador, porque GitHub solo ofrece «Run workflow» para los flujos que están en la rama por defecto (`main`): el botón de `seed-pruebas.yml` funcionará cuando `develop` pase a `main`. Mientras, se siembra con el envoltorio local (`scripts/seed/README.md`, «Pruebas remotas»).

### 061 — Corrección de los datos de demostración (**hecho** el 2026-10-10: `ADP-34`, PR #78)

Hallazgos menores de la revisión del 060: cada tarea en su categoría (antes todas en Universidad), «hoy» con la zona de `Europe/Madrid` al sembrar pruebas sin `SEED_TODAY` (el contenedor está en UTC), un cálculo muerto en las vencidas y el mensaje de producción con punto final. Encargo en [061](../agentes/encargos/061-correccion-datos-de-demostracion.md). Pruebas se volvió a sembrar al fusionar.

### 065 a 073 — La ronda de DEC-51

Todos contra `develop`, cada uno en su worktree. **Ninguno** toca migraciones
ni `package.json`: `react-native-reanimated` (4.3.1) y `@rn-primitives/portal`
ya están instalados. Todos siguen la regla de legibilidad, usan los tokens de
`src/theme` y cumplen RNF-03 (44 puntos, etiquetas, AA y teclado en la web).
Maestro **no** se ejecuta en cada encargo: solo en el 073 (DEC-45).

| Encargo | Qué (filas del apartado 2) | Agente | Tamaño | Depende de | Ficheros reservados |
|---|---|---|---|---|---|
| **065** | Hoy limpio (fila 2) | **Claude Sonnet** | S | — | `src/app/(tabs)/hoy.tsx`, `src/components/today/**`, `src/domain/views/today*.ts` |
| **066** | Añadir rápido compacto, sin autorrelleno y que se cierra con el atrás (filas 4, 5 y 6) | **Codex Sol** | M | — | `src/components/quick-add/**` |
| **067** | Animación del botón de añadir (fila 3) | **Claude Sonnet** | S | 066 fusionado | `src/components/quick-add/{quick-add-button,quick-add-provider}*.tsx` |
| **068** | Historial que se desplaza (fila 8) | **Copilot** | S | — | `src/app/(tabs)/historial.tsx`, `src/components/history-grid/history-screen.test.tsx` |
| **069** | Selector de categoría dentro de los formularios (fila 9) | **Codex Luna** | S | — | `src/components/category-select/**` |
| **070** | Próximo, dominio (fila 7) | **Codex Luna** | S | — | `src/domain/views/upcoming*.ts` |
| **071** | Pestaña Listas: Bandeja y Categorías juntas (fila 10) | **Claude Sonnet** | M | — | `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/{bandeja,categorias,listas}.tsx`, `src/app/bandeja.tsx`, `src/components/category-list/**`, `e2e/category-section-task.yaml` |
| **072** | Próximo, datos y pantalla (fila 7) | **Codex Sol** | M | 070 y 071 fusionados | `src/data/upcoming*.ts`, `src/data/query-keys.ts`, `src/components/upcoming/**`, `src/app/(tabs)/proximo.tsx`, `src/app/(tabs)/_layout.tsx`, `src/components/catalog/**` |
| **073** | Cierre: Maestro una vez y RF-41 hecha | **Codex Luna** | S | todos | `e2e/**`, `docs/02-funcionalidades.md` (estado de RF-41) |

**Olas** (con los puestos fijos de DEC-39: dos de Codex, uno de Claude y uno de
Copilot):

1. **066** (Codex Sol), **070** (Codex Luna), **065** (Claude) y **068**
   (Copilot), a la vez: no comparten ningún fichero.
2. **069** (Codex Luna) y **071** (Claude) al quedar libres sus puestos; **067**
   (Claude) cuando estén fusionados 066 y 071.
3. **072** (Codex Sol), con 070 y 071 fusionados.
4. **073** y, si el humano quiere, el paso a `main` con la etiqueta `v1.1.1`.

#### 065 — Hoy limpio

Hoy sirve para ver lo pendiente de hoy y marcarlo, sin nada más (DEC-51,
puntos 1 y 2).

1. **Quitar el navegador de días**: `day-navigator.tsx` y su uso en
   `hoy.tsx` desaparecen, junto con el estado de la fecha elegida. Hoy muestra
   siempre hoy. Lo que quede sin uso (por ejemplo `getDayTitle`, o la rama
   «Ese día…» de los mensajes) se borra con sus tests; `canMarkDay` y el
   apartado «Marcadas hoy» se quedan.
2. **Sin título ni fecha**: arriba de la lista, solo una línea fina con el
   progreso del día (`DayProgress`, el que ya hay), con poco relleno.
3. **Encabezado invisible**: la pantalla conserva un encabezado «Hoy» que lee el
   lector de pantalla pero no se ve (en la web, oculto a la vista y no al lector;
   en Android, una etiqueta de cabecera). El test que comprueba que «Hoy» es un
   encabezado accesible sigue pasando.
4. **Tests**: Hoy sin selector de días, sin título visible, con el encabezado
   accesible y con la línea de progreso. Los de `today-screen` y `today-header`
   que hablaban de otros días se quitan, porque esa función pasa a Próximo
   (RF-41).

- **Hecho cuando:** en la web de pruebas, Hoy empieza directamente con la línea
  de progreso y la lista; los tests pasan; `04-arquitectura.md` no nombra el
  navegador de días (si lo nombra, se corrige en el mismo PR).

#### 066 — Añadir rápido compacto

1. **Tamaño** (fila 5): el campo del título usa el tamaño `body` (15 px), no
   `title`; menos relleno vertical en la barra, para que quede como una barra
   encima del teclado. Los atajos de fecha y la categoría siguen teniendo 44
   puntos de zona de toque.
2. **Sin autorrelleno** (fila 6): todos los campos de texto del añadir rápido
   con `autoComplete="off"` y, en Android, `importantForAutofill="no"`. En la web
   puede que Chrome siga enseñando su barra: se deja anotado en el informe, no
   se busca un truco.
3. **El atrás cierra el menú** (fila 4): si el teclado se cierra **por el
   sistema** (el gesto o el botón de atrás de Android, o el teclado que se
   oculta en la web del móvil) y **no** hay abierto un selector (fecha, hora,
   categoría, opciones del hábito), el menú se cierra también. El borrador ya se
   guarda (`use-quick-add-draft`) y debe seguir guardándose. Abrir un selector
   que oculta el teclado **no** cierra el menú. En la web se detecta con el
   `visualViewport` que ya usa `use-web-viewport`.
4. **Tests**: tamaño de letra del título, propiedades de autorrelleno, cierre al
   ocultarse el teclado, no cierre con un selector abierto y borrador conservado.

- **No toca** `category-select` (es del 069) ni la animación (067).
- **Hecho cuando:** los tests pasan y, en el emulador, con el teclado abierto,
  un atrás cierra teclado y menú a la vez, y al volver a abrirlo está lo escrito.
  El flujo `e2e/quick-add-keyboard.yaml` se ajusta si cambia algún texto (se
  ejecuta en el 073).

#### 067 — Animación del botón de añadir

Fila 3: al pulsar «+», el botón se desplaza al centro y se expande hasta ser el
menú de añadir; al cerrar, hace el camino al revés. Usa la skill
`expo-animation`.

1. Con `react-native-reanimated` (ya instalado), en el hilo de la interfaz;
   unos 250 ms, sin rebotes exagerados. El teclado puede subir mientras tanto:
   la animación no debe dar saltos cuando llegue.
2. **Reducir movimiento**: si el sistema lo pide (`useReducedMotion`), el menú
   aparece sin animación, como ahora.
3. En la web debe funcionar igual o, si no se puede, sin animación; nunca roto.
4. Tests: con reducir movimiento no hay animación, y el menú se abre y se cierra
   igual que antes (los tests del 066 siguen pasando).

- **Hecho cuando:** en el emulador se ve la animación al abrir y al cerrar, sin
  saltos al subir el teclado; los tests pasan.

#### 068 — Historial que se desplaza

Fila 8: la pantalla es una `View` sin desplazamiento y la rejilla queda fuera.

1. La pantalla entera se desplaza en vertical (título, fechas, filtros y
   rejilla). La rejilla mantiene su desplazamiento horizontal.
2. Nada más: ni textos ni diseño (Historial cambia con la 1.2, encargo 057).
3. Test: con muchas filas, la rejilla está dentro de un contenedor que se
   desplaza.

- **Hecho cuando:** en la web de pruebas, a 360 px de ancho, se llega a la
  rejilla bajando; el flujo `e2e/history.yaml` no cambia.

#### 069 — Selector de categoría dentro de los formularios

Fila 9: la lista flota con `z-20`, pero en la web los campos de después la tapan.

1. Con `openDirection="down"` (formularios de tarea y de hábito), la lista se
   pinta **dentro del flujo**, debajo del botón, y empuja lo de debajo. Ya no es
   una capa absoluta.
2. Con `openDirection="up"` (añadir rápido) sigue flotando como ahora.
3. Tests de las dos formas; los de `upward-choice` siguen pasando.

- **Hecho cuando:** en la web de pruebas, en «Nueva tarea», la lista de
  categorías se ve entera y se puede elegir; los tests pasan.

#### 070 — Próximo, dominio

Una función pura en `src/domain/views/upcoming.ts`, sin React ni Supabase:

```ts
export interface UpcomingDay { date: CalendarDate; items: ViewItem[] }
export interface UpcomingWeek {
  /** Lunes de la semana. */
  weekStart: CalendarDate;
  /** true para la semana de hoy («Esta semana»). */
  isCurrentWeek: boolean;
  /** Solo los días con algo, en orden. */
  days: UpcomingDay[];
}
export function getUpcomingRange(today: CalendarDate): { from: CalendarDate; to: CalendarDate };
export function getUpcomingWeeks(input: {
  habits: Habit[]; marks: HabitMark[]; tasks: Task[]; today: CalendarDate;
}): UpcomingWeek[];
export function formatWeekTitle(week: UpcomingWeek): string; // «Esta semana» o «Semana del 19 al 25 de octubre»
```

1. **Rango** (RN-46): de mañana al domingo de la cuarta semana siguiente a la
   actual. Si hoy es domingo, no hay «Esta semana».
2. **Qué entra**: tareas no archivadas, pendientes, con fecha dentro del rango;
   ocurrencias de hábitos no archivados dentro del rango, **salvo** las de un
   hábito que en esa fecha toca todos los días (regla vigente «todos los días»,
   «cada 1 día» o los siete días de la semana). Se usa el motor de ocurrencias
   (`getHabitOccurrences`), sin cambiarlo (ADR-0003).
3. **Orden**: semanas y días en orden; dentro del día, `compareViewItemsForDay`.
   Siempre salen las semanas del rango, aunque estén vacías (`days: []`), para
   que la pantalla diga «Semana libre».
4. **Tests**, con `npm run test:zones`: el escenario 11 de CU-03; hoy domingo;
   hoy lunes; un cambio de hora dentro del rango; un hábito que pasa de diario a
   días de la semana a mitad del rango; los siete días de la semana; tareas
   hechas o archivadas que no salen; el título de una semana que cruza de mes
   («Semana del 26 de octubre al 1 de noviembre»).

- **Hecho cuando:** los tests pasan en las dos zonas con cobertura completa de
  `upcoming.ts`.

#### 071 — Pestaña Listas

Fila 10 y DEC-51, punto 5: «Listas» junta la Bandeja y las categorías.

1. La pestaña **Categorías** pasa a llamarse **Listas** (icono `LayoutGrid` o
   `List`), con la ruta `(tabs)/listas.tsx`: arriba, una fila **Bandeja de
   entrada** con su contador de pendientes; debajo, las categorías como ahora;
   al final, «Nueva categoría».
2. La pestaña **Bandeja** desaparece. La vista de la Bandeja se abre al tocar su
   fila, en una ruta fuera de las pestañas (`src/app/bandeja.tsx`, con la misma
   cabecera y vuelta atrás que una categoría). Cualquier enlace que fuera a
   `/bandeja` sigue funcionando.
3. El añadir rápido sigue proponiendo la Bandeja como destino por defecto fuera
   de Hoy.
4. Hasta que el 072 añada Próximo, la barra tiene cuatro pestañas: Hoy, Listas,
   Pendientes e Historial.
5. Tests: la fila de la Bandeja abre su vista; las categorías y «Nueva categoría»
   siguen como antes. `e2e/category-section-task.yaml` pasa de «Categorías» a
   «Listas».

- **Hecho cuando:** en la web de pruebas la barra muestra Listas y desde ahí se
  llega a la Bandeja y a cada categoría; los tests pasan.

#### 072 — Próximo, datos y pantalla

1. **Datos**: `src/data/upcoming.ts` con `fetchUpcomingView(today)` y
   `useUpcomingView(today)`, como `today.ts`: hábitos con sus reglas, marcas y
   tareas del rango de `getUpcomingRange`, en páginas. Su clave de caché cuelga
   de `['views', ...]` en `query-keys.ts`, para que crear, cambiar o archivar
   algo la refresque como al resto de vistas.
2. **Pantalla** `(tabs)/proximo.tsx`, fina, y sus piezas en
   `src/components/upcoming/`: una lista que se desplaza, con el título de cada
   semana, el de cada día («Miércoles 21») y las filas con nombre, hora o franja
   y categoría (las mismas piezas de fila que Hoy, **sin** botones de marcar).
   Una semana vacía dice «Semana libre». Tocar una fila abre su ficha
   (`/tareas/[id]` o `/habitos/[id]`).
3. **Pestaña** «Próximo» (icono `CalendarDays`), la segunda: Hoy · Próximo ·
   Listas · Pendientes · Historial.
4. Estados de carga, error con «Reintentar» y vacío, como las demás vistas.
5. Las piezas nuevas entran en el catálogo (`(dev)/catalog.tsx`).
6. Tests: pantalla con datos, semana libre, error, la fila abre la ficha y no hay
   forma de marcar; integración contra el Supabase local de `fetchUpcomingView`
   con el rango correcto.

- **Hecho cuando:** con los datos de demostración, Próximo enseña «Nadar» los
  miércoles y las tareas de las próximas semanas, sin los hábitos diarios; los
  tests pasan.

#### 073 — Cierre de la ronda

1. Un flujo de Maestro nuevo, `e2e/upcoming.yaml`: abrir Próximo, ver una tarea
   de la semana siguiente y abrir su ficha.
2. `docker/android/reset` y **una sola** ejecución de todos los flujos, con
   `scripts/with-heavy-lock`. Los que fallen por textos cambiados en esta ronda
   se corrigen aquí.
3. En `docs/02-funcionalidades.md`, RF-41 con su estado «hecho».

- **Hecho cuando:** todos los flujos pasan en el emulador.

**Riesgos que vigilar:**

- **El atrás del 066 en Xiaomi**: algunas capas de Android avisan distinto del
  teclado. Si en el emulador va y en el móvil del humano no, se anota en el
  buzón y se mira con el APK; no se bloquea la ronda.
- **071 y 072 tocan `(tabs)/_layout.tsx`**: van en olas distintas, y 072 empieza
  desde `develop` con 071 fusionado.
- **Quitar «ver otros días» (065)** borra funciones que la 1.2 no usa; si un
  test de otra parte las importa, el trabajador lo dice en su informe, no las
  conserva por su cuenta.
