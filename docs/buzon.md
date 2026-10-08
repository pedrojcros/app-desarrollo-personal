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

## Procesadas

| Fecha | Idea | Qué se hizo |
|---|---|---|
| | | |
