# Buzón de ideas

Aquí deja el humano ideas, tareas o cambios **cuando quiera y sin formato especial**. El orquestador lo procesa al empezar cada sesión (ver «Autonomía por niveles» en [agentes/orquestador](agentes/orquestador.md#autonomía-por-niveles-dec-12)).

Para pedir control sobre una idea, añade al final:

- `[requiere-plan]`: quieres ver y aprobar cómo se hará antes de que empiece.
- `[requiere-revisión]`: quieres revisarla tú antes de que se dé por buena.

## Ideas nuevas

*(Una por línea, con fecha. Ejemplo: «2026-10-07 — Que el aviso de Deshacer dure 8 segundos [requiere-revisión]».)*

## Para el humano (lo deja el orquestador)

*(Decisiones tomadas o pendientes durante la ejecución, para revisar cuando vuelvas.)*

- 2026-10-07 — **Dependencias auxiliares de T01** (revísalo): el trabajador preguntó si podía añadir los paquetes que exigen NativeWind, React Native Reusables, Expo Router y lucide (`tailwindcss-animate`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@rn-primitives/portal`, `react-native-reanimated`, `react-native-worklets`, `react-native-safe-area-context`, `react-native-screens`, `react-dom`, `react-native-web`, `react-native-svg`). Lo autoricé leyendo `AGENTS.md` («las que ellas instalen por su cuenta»). Si no estás de acuerdo, dímelo y se quitan.
- 2026-10-07 — **Apagar el ordenador:** pediste apagarlo cuando acabe. Lo haré al terminar lo que pueda hacer esta noche, dejando todo guardado y subido.

- 2026-10-07 — **DECISIÓN TUYA, T02 (ADP-3): inicio de sesión con email.** En el Supabase local, `enable_signup = false` dentro de `[auth.email]` desactiva también el inicio de sesión con email («Email logins are disabled»). El trabajador propone poner solo `[auth.email] enable_signup = true` y dejar `[auth] enable_signup = false` (que es el que cierra el alta pública), comprobándolo con un test (`signUp` debe fallar con `signup_disabled`). Es un cambio de seguridad: **no lo autoricé** (mi permiso automático lo bloqueó, y la puerta de T02 es tuya). El PR queda con el resto hecho y un test pendiente. Si apruebas la propuesta, basta con cambiar esa línea y activar el test.
- 2026-10-07 — **PR #8 sin fusionar:** mi rama `docs/orquestador-ejecucion` (DEC-35, encargos 001 a 004, buzón y contexto) la bloqueó el permiso automático por ser una fusión sin revisión de otra persona. Está abierta; fusiónala cuando quieras.

- 2026-10-07 — **T14 (ADP-5, PR #11) para tu revisión:** compara el catálogo con tu prototipo (capturas en `docs/diseno/`: `catalogo-tres-temas.webp`, `tabs-negro.png`). El test de contraste encontró **4 pares de colores del diseño que no cumplen AA** (Blanco: texto suave sobre Superficie 2 = 4,16; acento como texto sobre fondo = 4,40; ✗ «No hecho» = 2,69 y 2,93). No se tocaron: decides tú si se oscurecen. Se añadió `expo-font` (paquete `expo-*`, aprobado) y fuentes locales OFL.
- 2026-10-07 — **T02 (ADP-3, PR #10) para tu revisión:** además de tu decisión sobre el inicio de sesión (arriba), Codex hizo una revisión independiente (sin fallos críticos; cuatro importantes) y un trabajador de Claude los está corrigiendo en la misma rama. Su informe está en `/tmp/revision-t02.md` (se pierde al apagar; el resumen va en el PR).
- 2026-10-07 — **Orden de fusión de #10 y #11:** chocan solo en `jest.config.js` (los dos añaden `moduleNameMapper`). Fusiona primero uno y, al fusionar el otro, une las dos listas del mapa. Si prefieres, dime y lo resuelvo yo.
- 2026-10-07 — **Trampa encontrada:** `project_id` en `supabase/config.toml` es el mismo en todos los worktrees (`ADP-2-esqueleto-expo`), así que dos worktrees no pueden tener Supabase local a la vez (mismos nombres de contenedor y puertos). Propongo ponerlo por entorno o parar el anterior antes de arrancar; no lo he tocado (es de T01/T02).

- 2026-10-07 — **Decidido por el orquestador (revísalo cuando quieras):** (1) T03: la primera versión de la regla de un hábito empieza siempre en su fecha de inicio y no puede haber dos versiones con la misma fecha (lo pedía la revisión de Opus). (2) T05: cambiar la frecuencia vale desde hoy (o desde el inicio si aún no empezó); dos cambios el mismo día no crean dos versiones; la fecha de inicio solo se cambia si el hábito no ha empezado (RN-19). (3) La web no permite `eval` (CSP): Zod va sin JIT en vez de abrir `unsafe-eval`. (4) Vercel publicó su primer despliegue como producción (cosa del servicio la primera vez): apunta a la base de pruebas y la de producción sigue vacía hasta que publiques. (5) Las capturas del catálogo de T14 tienen aún los colores antiguos.

- 2026-10-07 — **Más decisiones del orquestador (revísalas cuando quieras):** (1) En la vista de una categoría, de cada hábito sale la ocurrencia de hoy si toca y está pendiente (las tareas, todas las pendientes, con y sin fecha). (2) En «Pendientes» no salen los hábitos archivados. (3) Las migraciones se aplican con `--include-all` porque dos ramas en paralelo las fusionaron en otro orden que sus fechas (eso rompió el primer despliegue a pruebas; ya está encargado el arreglo).

- 2026-10-07 (noche) — **Decidido por el orquestador (revísalo cuando quieras):** (1) **Añadir rápido (T16):** tras enviar, la barra se vacía y sigue abierta para añadir otra; «Lunes» es el próximo lunes; «Más» lleva al formulario completo con lo escrito (también el nombre); desde la vista de una categoría, cada sección tiene su «+» pequeño para crear directamente en ella. (2) **Hábitos:** cambiar la frecuencia nunca toca el pasado ni crea una versión si la regla no cambia, y cambiar y deshacer el mismo día deja todo como estaba (lo pidió la revisión de Opus; se corrige en el encargo 024). (3) **T06:** «Añadir hora» propone las 09:00. (4) **T13** se parte en dos encargos para no esperar a T16.

- 2026-10-08 (madrugada) — **DECISIÓN TUYA, recordatorios (versión 1.1):** la propuesta está en [propuestas/recordatorios](propuestas/recordatorios.md). Contesta las **8 decisiones del apartado 4** (en lenguaje llano, cada una con su valor por defecto); **«ok» las acepta todas**. Con tu respuesta se lanzan sus 7 encargos. No se ha programado nada de recordatorios.
- 2026-10-08 (madrugada) — **Decidido por el orquestador (revísalo cuando quieras), versión 1.x:** (1) Reprogramar: en Pendientes, botón con calendario junto a ✓ y ✗ con atajos Hoy y Mañana; conserva la hora. (2) Día entero como no hecho: pide confirmación y un solo aviso con Deshacer para todo el día. (3) Ver otros días: flechas y fecha en la cabecera de Hoy; los días futuros se ven pero no se marcan; «Marcadas hoy» va plegado debajo. (4) Historial: filtros de estado, categoría y elemento combinables; al tocar una celda se corrige con un menú. (5) El añadir rápido desde Hoy sigue proponiendo hoy aunque estés viendo otro día.

- 2026-10-08 — **Para publicar la versión 1 (tú):** comprobación del orquestador. (1) Funcionalidades imprescindibles fusionadas y con sus criterios: sí, todas (T01 a T16). (2) Tests y CI de `develop` en verde: sí (483 unitarios y 202 de integración al cerrar T16; CI verde en cada fusión). (3) Tareas a medias que dependan de la versión: solo T13b, que añade los flujos de Maestro y no cambia la app. (4) Documentación y contexto al día: sí. (5) Qué cambia respecto a `main`: es la primera versión (inicio de sesión, hábitos con sus cuatro frecuencias, tareas, categorías con secciones, Hoy, Pendientes, Historial, marcar con Deshacer, añadir rápido y tres temas). (6) Migraciones: las de `supabase/migrations/` hasta `20261007200000_habit_rule_guard.sql`; la integración continua las aplica a producción desde `main`. Etiqueta propuesta: `v1.0.0`. Candidato: `6e9182c` (o `develop` tras fusionar T13b). Antes, crea tu usuario de producción (DEC-37).

- 2026-10-09 — **VERSIÓN 1 LISTA PARA PUBLICAR (tú).** **Hecho el mismo día:** publicada con el PR #67 y la etiqueta `v1.0.0`; queda solo el APK (paso d). Comprobación del orquestador:
  1. Funcionalidades imprescindibles fusionadas con sus criterios: **sí** (T01 a T16).
  2. Tests y CI de `develop` en verde: **sí** (commit `92411a4`: CI y despliegue a pruebas correctos; 627 tests unitarios e integración).
  3. Caminos críticos en el emulador: **sí**, los 8 flujos de Maestro a tamaño normal y a 360 dp (PR #50).
  4. Tareas a medias que dependan de la versión: **ninguna**.
  5. Qué cambia respecto a `main`: es la primera versión (inicio de sesión, hábitos con cuatro frecuencias, tareas, categorías con secciones, Hoy, Pendientes, Historial, marcar con Deshacer, añadir rápido, tres temas), **más** la 1.x (otros días, «Marcadas hoy», reprogramar, día entero como no hecho, filtrar y corregir el historial, renombrar categoría) y los recordatorios R1 a R4 (solo en la app instalada).
  6. Migraciones: las de `supabase/migrations/`; la integración continua hace la copia y las aplica a producción al hacer push a `main`. Etiqueta propuesta: `v1.0.0`.
  
  **Pasos:** (a) crea tu usuario de producción en Supabase (README, «Crear el usuario real de producción»); (b) pasa `develop` a `main` con un PR de `develop` contra `main` y fusiónalo tú; (c) crea la etiqueta `v1.0.0` sobre ese commit de `main`; (d) para el APK, `eas build --profile preview` cuando quieras instalarla (H04).
- 2026-10-09 — **Lista R6 corregida** (recordatorios en el APK). La pantalla «Recordatorios (prueba)» solo existe en desarrollo, así que en el APK: el paso 2 («Probar en 10 segundos») se cambia por **una tarea de hoy con hora dentro de 62 minutos** (el aviso de «una hora antes» llega en 2 minutos), y el paso 7 («Poner al día») por **marcar la tarea como hecha antes de su aviso y comprobar que no llega**. El resto de la lista del PR #57 vale tal cual.

- 2026-10-09 — **Hecho el mismo día (`ADP-27`, PR #73 y #74).** **Detalles visuales vistos en el emulador (decide tú si se arreglan):** (1) en Hoy, el título «Hoy» sale dos veces (en la cabecera de la pestaña y en grande debajo); (2) el botón de Ajustes de la cabecera se ve con dos engranajes superpuestos; (3) bajo los atajos de fecha del añadir rápido aparece la fecha en bruto («2026-10-09») en vez de con formato. Captura: `docs/diseno/capturas/anadir-rapido/teclado-android-arreglado.png`.

- 2026-10-09 (noche) — **Decidido por el orquestador al aplicar DEC-45 (revísalo cuando quieras):**
  1. Los scripts se llaman en inglés (`scripts/incidents/record_incident.py`, `report.py`, `measure.py`), no `anotar.py`, `informe.py` y `medir.py` como decía la propuesta, por la regla de legibilidad.
  2. El registro de incidencias vive en `logs/incidents.jsonl` de la carpeta principal y **no se sube a git**: si se subiera, cada línea del supervisor sería un cambio sin rama. Lo que viaja es la retrospectiva (`docs/retrospectivas/`).
  3. `compose.yaml` fija `name: app-desarrollo-personal`, para que el emulador sea uno solo para todos los worktrees.
  4. El «doble engranaje» no se arregla: es la burbuja «Tools» de Expo Go, que solo sale en desarrollo y se puede arrastrar. En el APK no aparece.
  5. Los PR pequeños los revisa un subagente de Sonnet, y el diminuto (#74) lo revisé yo directamente.

## Procesadas

| Fecha | Idea | Qué se hizo |
|---|---|---|
| | | |
