# Pulido visual (1.1.1)

> **En curso** desde el 2026-10-09 (DEC-48). Aquí se apunta lo que el humano ve
> mal, tal como lo dice, y cómo lo clasifica el arquitecto. Cuando la lista esté
> completa, el arquitecto la convierte en encargos (apartado 3) y el humano la
> aprueba.

**Objetivo que marca el humano:** «quiero que la pantalla de Hoy sea **la más
cómoda de todas**». Es el criterio para decidir cualquier duda sobre Hoy.

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
| 2 | 2026-10-14 | «En el apartado HOY aparece “Hoy” dos veces y también sale la fecha, que es redundante: si pulso Hoy es porque sé en qué día estoy. Este apartado tiene que mostrar las tareas de la forma más cómoda y limpia posible, para evitar distracciones, porque será donde los usuarios entren únicamente a marcar tareas» | Hoy | **P** | Nota del orquestador: en `develop` la cabecera ya va vacía, pero la pantalla pinta su propio «Hoy» en grande (36 px) con la fecha, y la pestaña de abajo también dice «Hoy». En esa fecha están además las flechas para ver otros días (1.x). **Propuesta del arquitecto** (pendiente del humano): viendo hoy, ni título ni fecha; arriba solo una línea fina con «‹», el progreso del día y «›». Viendo otro día, la fecha en letra normal y «Volver a hoy». El «Hoy» sigue como encabezado invisible para el lector de pantalla |
| 3 | 2026-10-14 | «Cuando pulso el botón de añadir tarea quiero una animación del botón desplazándose al centro y expandiéndose para mostrar el menú nuevo de crear tarea» | Añadir rápido | **P** | Va después de la fila 5: se anima el menú ya reducido. `react-native-reanimated` ya está instalado (lo trae NativeWind), así que no hace falta ninguna dependencia. Con «reducir movimiento» del sistema, sin animación |
| 4 | 2026-10-14 | «Cuando echo para atrás en el móvil (deslizando desde un lateral) se quita el teclado, como en todas las aplicaciones, pero el menú de añadir tarea sigue abierto» | Añadir rápido | **P** (fallo) | Es un `Modal` que se cierra con el atrás del sistema, pero con el teclado abierto Android gasta el primer atrás en cerrar el teclado. **Propuesta:** como en Todoist, si el teclado se cierra por el sistema y no hay un selector abierto, se cierra también el menú. El borrador ya se guarda (`use-quick-add-draft`), así que no se pierde lo escrito |
| 5 | 2026-10-14 | «El menú de añadir tarea es demasiado grande, ocupa mucha parte de la pantalla. Reduce la letra como mínimo, sobre todo la del título de la tarea: el mismo tamaño que un texto de WhatsApp» | Añadir rápido | **P** | El campo del título usa `text-title`, que es 36 px, el mismo tamaño que el título de una pantalla. **Propuesta:** el tamaño `body` (15 px, como un mensaje de WhatsApp) y menos relleno, para que el menú sea una barra encima del teclado y no media pantalla |
| 6 | 2026-10-14 | «Me sale un menú de mi Redmi con una llave de gestor de contraseñas, wallet y ubicación; en Todoist no sale. A lo mejor hay algo para sacar el teclado simple» | Añadir rápido | **P** | La llave, la cartera y la ubicación son la barra de autorrelleno de Chrome para Android (contraseñas, tarjetas y direcciones), que sale encima del teclado en la web; Todoist es una app instalada y no la tiene. **Propuesta:** marcar los campos como no autorrellenables (`autoComplete="off"` en la web e `importantForAutofill="no"` en Android). En la web Chrome puede seguir mostrándola a veces; en el APK desaparece. Falta que el humano confirme si lo vio en Chrome o en Expo Go |
| 7 | 2026-10-14 | «Hay que hacer un apartado llamado **Próximo** para ver de hoy en adelante lo que queda, o esa misma semana (intuyo que es Pendientes), pero creo que prefiero un menú que muestre por semana llamado Próximo» | Nueva vista | *Por clasificar* | Es una **vista nueva**, no un retoque: cambia el alcance (lo decide el humano y lo diseña el arquitecto). Pendientes hoy muestra lo atrasado, no lo que viene |
| 8 | 2026-10-14 | «La pantalla de Historial entiendo que no está hecha completamente todavía, porque solo me deja elegir cosas y no ver nada» | Historial | *Por clasificar* | Nota del orquestador: Historial sí pinta una rejilla bajo las fechas y los filtros, pero la pantalla no tiene desplazamiento; en el móvil la rejilla probablemente queda fuera de la pantalla. Parece un fallo |
| 9 | 2026-10-14 | «Hay un error en crear tarea o hábito: al elegir la categoría, el menú desplegado se mete por debajo del texto» | Formularios de tarea y hábito | *Por clasificar* | Fallo (el desplegable queda detrás del resto en la web) |
| 10 | 2026-10-14 | «¿Dónde se crean categorías? El apartado Categorías de la barra de navegación inferior me parece que sobra» | Navegación | *Por clasificar* | Hoy las categorías se crean en esa pestaña («Nueva categoría»): si se quita, hay que llevar ese botón a otro sitio (por ejemplo Ajustes o el propio selector de categoría) |

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

*(El resto de encargos se escriben cuando la lista del apartado 2 esté completa.)*
