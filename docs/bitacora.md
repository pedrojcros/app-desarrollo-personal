# Bitácora

La traza del proyecto: qué pasó y por qué, **lo más reciente arriba**. El estado actual está en [contexto](contexto.md). Las entradas no se borran ni se reescriben; cada una dice qué pasó y por qué y enlaza al PR, la decisión o el documento con el detalle.

Vive aparte de `contexto.md` desde DEC-39: `contexto.md` se carga en cada sesión de Claude y tiene que ser corto.

### 2026-10-07 — Noche (2): T16 y la corrección de T05 en `develop`; empieza T13

Se fusionaron la corrección de las reglas de hábito (una sola función SQL que no reescribe el pasado ni crea versiones repetidas), los datos sintéticos de un año con la medida de RNF-01 (muy por debajo de los límites), un arreglo de `.pyc` subidos por error (Copilot) y T16, el añadir rápido. El humano avisó de que se gastaba demasiado `gpt-6.1-sol` y, después, de que pasar todo a Luna tampoco era la idea: pidió partir más las tareas, con lo mecánico para Luna y lo denso para Sol. T13b y T13c ya salen así.

### 2026-10-07 — Noche: T05, T06, T09 y T11 fusionadas; supervisor autónomo

Con la cuota de Codex de vuelta, el humano pidió dos Codex y un Claude. T05 y T09 se retomaron con una orden corta en sus carpetas (DEC-39, punto 8) y T06 y T11 las hizo Claude Sonnet; las cuatro se fusionaron tras pasar el orquestador sus tests. T05 pasó además una revisión de Opus (sin críticos, cuatro importantes en el cambio de regla de un hábito), que se corrige aparte (encargo 024) para no bloquear T16. El supervisor ya reanuda solo a Codex cuando el modelo se satura o se acaba la cuota (encargos 023 y 025; la primera versión se rechazó porque leía avisos viejos del historial de la pantalla). Con tres trabajadores compilando a la vez el portátil llegó a carga 67, así que lo pesado va ahora con un candado compartido (`flock /tmp/adp-pesado.lock`). T13 se parte en dos: datos sintéticos y RNF-01 ya (026), Maestro y el resto tras T16.

### 2026-10-07 — Jira en tiempo real (DEC-40) y más cierres inesperados

El humano pidió ver en el tablero qué hace cada agente sin esfuerzo extra. Creó un token de Atlassian con permisos limitados, Copilot escribió `scripts/jira/jira.py` y el flujo `jira.yml` (PR #26), y desde ahora las tarjetas se mueven solas al abrir y fusionar PR, con una etiqueta por agente. Fusionadas T10 y DEC-39. La sesión del orquestador se cerró sola varias veces por falta de CPU y memoria, y cada cierre se llevó a los trabajadores, que al relanzarse releían todo: eso agotó la cuota de Codex. Se añadió a DEC-39 el relanzamiento con orden corta y se pausaron T05 y T09 hasta que vuelva la cuota.

### 2026-10-07 — Tarde: cuotas, reinicios y ahorro de tokens (DEC-39)

Codex se quedó sin cuota de 10:20 a 13:54 con tres trabajadores a medias y el humano eligió esperar; a la vuelta, los trabajadores siguieron donde lo dejaron. Se fusionaron T12 (despliegue; se corrigió la contraseña de producción, que estaba vacía), T07, T08 y el arreglo `--include-all` de las migraciones, y el despliegue a pruebas desde `develop` ya funciona. Orca se reinició y cerró a los trabajadores, el comprobador del modo automático estuvo caído unos minutos y el modelo de Codex se saturó: varios trabajadores se pararon sin que nadie lo viera. El humano dio permisos permanentes de solo vigilancia (en `.claude/settings.local.json`) y aprobó siete medidas para gastar menos (DEC-39): esfuerzo alto, una sesión nueva por ola, esta bitácora aparte, encargos cortos, puestos fijos de trabajadores (dos de Codex, uno de Claude y uno de Copilot solo para lo pequeño, porque en «Auto» usa un modelo del nivel de Luna con su propia cuota), el modelo de Codex según el encargo y un supervisor que resuelve solo lo sencillo.

### 2026-10-07 — Mañana: T02, T14, T03 corregida y base común en `develop`; DEC-38

Con DEC-36 y DEC-37, el orquestador cerró y fusionó T02 (inicio de sesión real, cambio de `config.toml` aprobado por el humano) y T14 (colores AA, paleta por nombre, «Cerrar sesión»), encargó una revisión de T03 a Opus (el plan pedía `+revisión`: algoritmo correcto, tres hallazgos importantes, corregidos y fusionados) y repartió la ola 2 tras una base común de vistas y marcas, para que T07 a T11 compartan tipos y caché. T12 creó los proyectos de Supabase y Vercel. A media mañana el humano avisó de que la cuota de Claude iba al 79 % y de que se estaban lanzando más Claude que Codex: DEC-38 (tres de Codex por cada uno de Claude) y T07 pasó a Codex.

### 2026-10-07 — Tanda de decisiones para trabajar solo (DEC-37)

Con el orquestador ya en Opus 5.5 y esfuerzo máximo, el humano contestó de una vez lo que quedaba suyo para las olas 2 a 5: oscurecer un poco tres colores del tema Blanco para cumplir AA, dejar «Marcadas hoy» para después, añadir «Cerrar sesión» en Ajustes, crear él su usuario de producción, aviso de «Deshacer» de 4 segundos, porcentaje del historial sobre todo lo que tocaba, copia semanal cifrada en GitHub y los 5 colores de categoría del diseño. Además aprobó el cambio de `config.toml` de T02 y se fusionó el PR #8.

### 2026-10-07 — Control total del orquestador sobre `develop` (DEC-36)

Al volver de la noche, el humano aclaró lo que quiere: dejar al orquestador **a esfuerzo máximo, trabajando solo**, y encontrar **la versión acordada en `develop`**, usándolo a él solo para lo que el orquestador no debe suponer. Queda en DEC-36: el orquestador fusiona a `develop` también las tareas con puerta de revisión (T02, T14), tras su propia revisión; `main`, los secretos, el dinero, las ADR y el alcance siguen siendo del humano. Además se vio que la noche anterior se trabajó con **Sonnet 5.5 a esfuerzo medio** en vez de Opus 5.5 al máximo: el orquestador no puede cambiárselo él mismo, lo cambia el humano al abrir la sesión.

### 2026-10-07 — Ola 0 y casi toda la ola 1 (noche de ejecución)

T01 (esqueleto Expo en Docker, Codex) y T03 (motor de ocurrencias, Codex; 77 tests y 100 % de cobertura de líneas) y T15 (emulador y navegador en Docker, Codex) se fusionaron tras revisarlas el orquestador ejecutando él las comprobaciones. T02 (Claude) y T14 (Claude) quedan abiertas por su puerta de revisión; T02 pasó antes una revisión independiente de Codex (sin críticos, cuatro importantes) y se corrigió. El orquestador no pudo autorizar el cambio de `config.toml` ni fusionar el PR #8: el permiso automático los bloqueó, y quedan para el humano. Dos aclaraciones tomadas en el camino y anotadas en el buzón: los paquetes auxiliares de NativeWind, Reusables y lucide (leídos como «las que ellas instalen por su cuenta») y una línea para el plugin de Compose en la imagen de la app. DEC-35: Claude y Codex por igual.

### 2026-10-07 — Empieza la ejecución nocturna (DEC-35)

El humano lanzó `/ejecutar-plan` y se fue a dormir: trabajar solo toda la noche, con el supervisor siempre en marcha, fusionando T01 sin su revisión si todo pasa (la revisará por la mañana) y respetando las puertas de T02 y T14. Se crearon los 16 tickets de Jira (ADP-2 a ADP-17) y se lanzó T01 con Codex (encargo [001](agentes/encargos/001-esqueleto-expo.md)). Durante la ejecución el humano pidió repartir **Claude y Codex por igual**, sin Copilot, porque tiene tokens de sobra: queda en DEC-35, que sustituye al ciclo de DEC-27.

### 2026-10-06 — Tokens comprobados y plugins de los servicios (DEC-34)

El humano creó las cuentas de Supabase (una organización vacía para los
agentes), Vercel y Expo (un token de robot) y guardó sus tokens fuera del
repositorio; los tres funcionan. De los plugins oficiales que recomendó Expo,
solo se instala el de Supabase: los de Expo y Vercel envían telemetría desde
sus hooks. Sus seis skills útiles se copian a demanda, sin hooks.

### 2026-10-06 — Plan replanificado aprobado y acceso de los agentes (DEC-33)

El humano aprobó el plan con las palabras «APRUEBO EL PLAN». Además pidió dar a
los agentes acceso total a Vercel, Supabase y Expo, también a producción, para
que lo hagan todo: él crea las cuentas y los tokens, y la prohibición 7 pasa a
exigir una copia de seguridad antes de tocar producción (DEC-33). Lo siguiente
es fusionar los PR #4 y #5 y lanzar `/ejecutar-plan` en una sesión nueva.

### 2026-10-06 — P02 cerrada: estilo y temas (DEC-32)

Cuatro rondas de prototipos con el humano (ver `docs/diseno/ideas.md`):
listas sin cajitas, Hoy con la fecha pequeña y 8 cuadritos de progreso, el
añadir rápido sobre el teclado, desplegables hacia arriba y categorías con
secciones. Tres temas, blanco, negro y tercer estilo, que siguen al móvil y se
pueden fijar en Ajustes (RF-23, nueva, en T14). El humano: «Es una buena
estructura inicial, ya la iremos puliendo con el uso».

### 2026-10-06 — Categoría > sección (DEC-31)

Viendo la ronda 3 de estilo, el humano propuso invertir los nombres: la
categoría es el contenedor («Lista de la compra») y la sección, una parte
(«Mercadona»), como en Todoist. Las tareas van en la categoría o en una
sección, y las categorías ganan icono y color (el color por categoría ya se
usaba en el diseño, pero no estaba en el modelo de datos).

### 2026-10-06 — Secciones (DEC-29) y crear deprisa (DEC-30)

En la ronda 2 de estilo, el humano pidió carpetas para las categorías
(«Lista de la compra» > Mercadona) y crear sin cambiar de pantalla: una barra
rápida sobre el teclado que toma la categoría y la fecha de donde estás. Las
secciones entran en la versión 1 (T04 crece) y la barra es una tarea nueva,
T16, después de T05 y T06. Tercer estilo elegido: el neobrutalismo pulido.

### 2026-10-06 — Supervisor de trabajadores

En la ronda 2 de estilo, el trabajador E (Claude) pasó unos diez minutos con
el encargo escrito sin enviar, y Copilot, parado en un permiso, mientras el
arquitecto creía que trabajaban. El humano pidió que no vuelva a pasar, porque
quiere poder dejar horas trabajando a los agentes. Se añade
`scripts/orca/supervise_workers.py`, que se deja corriendo siempre que haya
trabajadores, y la regla en el método del orquestador.

### 2026-10-06 — Tope solo en código (DEC-28)

El humano pidió lanzar a la vez lo que no depende de nada: el tope de tres
trabajadores queda solo para el código, que hay que integrar. En la ronda 2 de
estilo, el arquitecto volvió a saltarse el turno de Claude: se paró E en Codex
y se relanzó con Claude, y DEC-27 aclara que un turno saltado se devuelve.

### 2026-10-06 — Ciclo de cuotas de los agentes (DEC-27, revisada) y ronda 1 de estilo

Los siete subagentes de Claude de la ronda 1 se cortaron al agotarse la
sesión del humano; dejaron cuatro prototipos y la hoja de paletas, y Codex
hizo los otros dos. Al humano le gustaron más los de Codex, «más pulidos y
profesionales». DEC-27 pasa a ser un ciclo: dos de Codex, uno de Claude y uno
de Copilot, con excepción para tareas que necesiten un modelo concreto.

### 2026-10-06 — Primero Codex (DEC-27)

Para no agotar su cuota de Claude, el humano pidió lanzar siempre primero
agentes de Codex y, como mucho, uno de Claude por cada tres de Codex. Queda
escrito en el orquestador, el arquitecto y el plan (las tareas pasan a
`codex`). La primera ronda de prototipos de P02, con siete subagentes de
Claude, ya estaba lanzada y se dejó terminar.

### 2026-10-06 — DEC-26 cerrada: Docker, con el panel de Orca (opción B)

De vuelta del gimnasio, el humano eligió la opción B: todo lo del proyecto en
Docker y, en el ordenador, solo `adb` y el programa del emulador, para que Orca
lo enseñe en su panel. Empieza P02, el bucle de estilo: el humano trae ideas,
subagentes con Sonnet generan los prototipos y el arquitecto los revisa (rama
`docs/estilo-p02`).

### 2026-10-06 — Replanificación para el móvil (DEC-24 y DEC-25) y Docker (DEC-26, abierta)

Con la opción B (DEC-24), el arquitecto rehízo la arquitectura
([ADR-0005](adr/0005-stack-expo.md)), los requisitos, los riesgos y el
[plan](05-plan.md), que vuelve a `EN BORRADOR`: 15 tareas, con dos nuevas
(T14, el sistema visual, y T15, el emulador y el navegador en Docker), y P02,
el bucle de estilo con el humano. Antes de irse al gimnasio, el humano aprobó
dos dependencias y decidió que la versión 1 necesita internet y que el estilo
se busca con prototipos antes de programarlo (DEC-25). Después pidió Docker
«en el 100 % de lo que se pueda» (DEC-26): se paró la instalación local del
SDK de Android y se probó el emulador dentro de Docker. Funciona, y Orca lo ve
si en el ordenador quedan `adb` y el programa del emulador (lo único que queda
de la instalación local: 884 MB en `~/Android`).

### 2026-10-06 — Skills móviles, navegador y herramientas (DEC-23)

Tras elegir la opción B (app con Expo, ver la replanificación), se revisaron
unas cuarenta skills propuestas por el humano y se quedaron 22 automáticas y
16 a demanda; el resto, fuera con su motivo (ver [la ficha](../.agents/skills/README.md)).
Se escribieron dos skills propias (`flujo-git` y `codigo-legible`). A las de
Expo se les quitó la sección que enviaba comentarios a Expo, y se prohibió en
`AGENTS.md` enviar nada a terceros. `/idea` ahora puede aclarar una idea con el
humano antes de apuntarla. Se configuró el MCP de Chrome, aislado y sin enviar
datos a Google.

### 2026-10-06 — Skills del proyecto y modelos según el tamaño (DEC-22)

Se añaden las primeras skills, 12 de `addyosmani/agent-skills` (MIT),
revisadas y elegidas porque encajan con el proyecto; otras 13 quedan fuera
con su motivo (ver [la ficha](../.agents/skills/README.md)). Viven en
`.agents/skills/`, donde las leen Codex y Copilot, y Claude por un enlace.
Opus decide y elige skills; los trabajadores programan con el modelo
adecuado a su tamaño. Los comandos de papel ya no los puede activar un agente
por su cuenta.

### 2026-10-06 — Plan aprobado (sesión 8)

El humano aprobó el plan con las palabras «apruebo el plan». Termina la
planificación: visión, casos de uso, funcionalidades, riesgos, arquitectura,
defaults y plan quedan en `docs/`, y la rama `docs/planificacion` se fusiona en
`develop` con un PR. Lo siguiente es `/ejecutar-plan` en una sesión nueva.

### 2026-10-06 — Agentes listos: DEC-21 aceptada y P01 cerrada

El humano aceptó las diez propuestas de DEC-21. Se aplicaron los ajustes de
Codex (sin animaciones, sin sandbox) y de Copilot (carpeta de confianza, sin
permisos por comando, sin el MCP de Jira) y se repitió la prueba: Codex
funciona solo; a Copilot hay que darle un Enter si el encargo se le queda
aparcado (fallo conocido de Orca), y el orquestador ya sabe hacerlo (ver
[agentes/orca](agentes/orca.md#trampas-conocidas)). `git push` funciona por
HTTPS con `gh`. Se borraron los worktrees de prueba. Queda aprobar el plan.

### 2026-10-06 — P01: por qué Codex no recibía encargos (de noche, con permiso del humano)

Codex sí arrancaba, pero sus animaciones repintan la terminal sin parar y
Orca nunca le daba por listo (incidencia conocida de Orca, #25007). Se
comprobó en este equipo: con las animaciones apagadas, listo al instante y
el trabajador termina. Además, el sandbox de Codex le obliga a pedir permiso
para hablar con Orca. Copilot funciona a la primera, pero pregunta por la
confianza de cada carpeta y pide permiso por comando. Las dos pruebas
terminaron con éxito aprobando a mano solo comandos de Orca. No se cambió
ninguna configuración: los ajustes esperan el «ok» del humano (DEC-21,
punto 10). Detalle en [agentes-disponibles](agentes/agentes-disponibles.md).

### 2026-10-06 — Tanda de las sesiones 3 a 7 del arquitecto

En modo tandas (DEC-14) se escribieron de golpe las funcionalidades (22, de
las que 14 forman la versión 1, DEC-19), los riesgos, la arquitectura con
cuatro ADR (stack Next.js + Supabase + Vercel elegido por el humano, DEC-16),
el recorrido de la lista de defaults (DEC-20), el diseño del orquestador
autónomo con el [buzón](buzon.md) y las puertas de aprobación, y el plan:
13 tareas en 6 olas más P01 y las tareas del humano. Nueve propuestas esperan
su «ok» en DEC-21. Se detectó que `git push` falla por SSH en las sesiones de
los agentes (H01).

### 2026-10-06 — Sesión 2 del arquitecto: casos de uso

Se escribieron y revisaron siete casos de uso con una
[plantilla estándar](plantilla-caso-de-uso.md): crear hábitos (cuatro
frecuencias, franja u hora, duración), crear tareas, la vista Hoy, la
Bandeja de entrada, resolver lo pendiente, el historial, modificar o
archivar, y categorías (DEC-10, 11, 13 y 15). Se decidió no tener fecha
límite (DEC-07), un orquestador autónomo por niveles con puertas de
aprobación (DEC-12) y planificar en tandas (DEC-14). El stack queda para
la sesión 5 con el humano (DEC-16): Google Play cuesta 25 USD y exige una
prueba con 12 personas.

### 2026-10-05 — Sesión 1 del arquitecto: visión y alcance

Se definió qué se construye: una aplicación **personal** de tareas y hábitos
donde todo se marca como hecho o no hecho y queda un historial, porque Todoist
no lo permite. Versión 1: solo ordenador, tareas, hábitos recurrentes e
historial (DEC-08, DEC-09). Móvil y conexión con Google Calendar quedan
confirmados para la versión siguiente, juntos; estadísticas y recordatorios,
para después. Además se probaron los agentes con Orca: Claude funciona y ve
Jira, Codex falla en la fase de readiness, Copilot sin probar (ver
[agentes-disponibles](agentes/agentes-disponibles.md)).

### 2026-10-05 — Revisión de la documentación del kit y primeras decisiones

Se revisó documento por documento el kit y se adaptó al proyecto. Se cerraron
DEC-01, 02, 03, 05 y 06 (ver [decisiones](decisiones.md)): PR contra `develop`,
el orquestador fusiona a `develop` y solo el humano publica en `main`; Jira
activo con proyecto `ADP`; tope de 3 trabajadores; nombres en inglés y
comentarios, commits y documentación en español. Se comprobó en este equipo que
Claude Code, Codex y Copilot CLI están instalados y que Orca los lanza con los
ids `claude`, `codex` y `copilot`. La estructura se aplanó: la plantilla pasó a
la raíz del repositorio. Quedan abiertas DEC-04 (probar los agentes) y DEC-07
(fecha límite).

### 2026-10-05 — Nace el proyecto

Creado a partir del kit de proyecto orquestado: documentación base, comandos
`/arquitecto`, `/orquestador` y `/ejecutar-plan`, y guía de Orca y Jira. Empieza
la planificación.
