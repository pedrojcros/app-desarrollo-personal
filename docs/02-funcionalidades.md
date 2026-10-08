# Funcionalidades

Registro de funcionalidades (`RF`) y requisitos no funcionales (`RNF`). Es el contrato de **qué hace** el sistema; el plan en [05-plan](05-plan.md) dice cómo y cuándo se construye.

*Estado: **confirmado** por el humano el 2026-10-06: la versión 1 son las imprescindibles (15 desde que DEC-32 añadió RF-23, el tema); las deseables van justo después (DEC-19).*

## Cómo se escribe una funcionalidad

- **Dice QUÉ, nunca CÓMO.** «El sistema permite X», no «usar una tabla Y». Si cambiar de tecnología obliga a reescribirla, estaba mal escrita.
- **Es comprobable.** Si no se puede escribir cómo verificarla, no es una funcionalidad.
- **Es atómica.** Si lleva un «y», probablemente son dos.
- **Prioridad:** IMPRESCINDIBLE / DESEABLE / OPCIONAL (MoSCoW: must, should, could). La versión 1 son los imprescindibles.
- **Identificadores** `RF-nn` y `RNF-nn`. Nunca se reutilizan.
- **El criterio de aceptación enlaza los escenarios** de [03-casos-de-uso](03-casos-de-uso.md) en vez de copiarlos; solo se escribe aquí lo que no está allí.

## Registro

| Id | Funcionalidad | Prioridad | Caso de uso | Tarea del plan | Epic en Jira |
|---|---|---|---|---|---|
| RF-01 | Crear un hábito | IMPRESCINDIBLE | CU-01 | | |
| RF-02 | Generar las ocurrencias de un hábito según su frecuencia | IMPRESCINDIBLE | CU-01 | | |
| RF-03 | Hora exacta o franja de un hábito | IMPRESCINDIBLE | CU-01 | | |
| RF-04 | Duración opcional de un hábito | DESEABLE | CU-01 | | |
| RF-05 | Crear una tarea | IMPRESCINDIBLE | CU-02 | | |
| RF-06 | Cambiar el estado: hecho, no hecho o pendiente | IMPRESCINDIBLE | CU-03, CU-04 | | |
| RF-07 | Aviso al marcar, con «Deshacer» | IMPRESCINDIBLE | CU-03 | | |
| RF-08 | Vista Hoy | IMPRESCINDIBLE | CU-03 | | |
| RF-09 | Apartado «Marcadas hoy» | DESEABLE | CU-03 | | |
| RF-10 | Ver otros días | DESEABLE | CU-03 | | |
| RF-11 | Vista de categoría y Bandeja de entrada | IMPRESCINDIBLE | CU-03, CU-07 | | |
| RF-12 | Pendientes de días anteriores | IMPRESCINDIBLE | CU-04 | | |
| RF-13 | Reprogramar una tarea vencida | DESEABLE | CU-04 | | |
| RF-14 | Marcar un día entero como no hecho | DESEABLE | CU-04 | | |
| RF-15 | Consultar el historial | IMPRESCINDIBLE | CU-05 | | |
| RF-16 | Filtrar el historial | DESEABLE | CU-05 | Hecho en ADP-20 (encargo 034) | |
| RF-17 | Corregir desde el historial | DESEABLE | CU-05 | Hecho en ADP-20 (encargo 034) | |
| RF-18 | Modificar un hábito o una tarea | IMPRESCINDIBLE | CU-06 | | |
| RF-19 | Archivar (eliminar) un hábito o una tarea | IMPRESCINDIBLE | CU-06 | | |
| RF-20 | Crear categorías con secciones y asignarlas | IMPRESCINDIBLE | CU-07, CU-01, CU-02 | | |
| RF-21 | Eliminar una categoría | IMPRESCINDIBLE | CU-07 | | |
| RF-22 | Renombrar una categoría | DESEABLE · **HECHO** | CU-07 | | |
| RF-23 | Elegir el tema | IMPRESCINDIBLE | — | | |
| RF-24 | Aviso con antelación de una tarea con fecha | IMPRESCINDIBLE | CU-08 | | |
| RF-25 | Aviso a la hora de un hábito con hora exacta | IMPRESCINDIBLE | CU-08 | | |
| RF-26 | Aviso de los hábitos con franja | DESEABLE | CU-08 | | |
| RF-27 | Los avisos siguen al estado de cada elemento | IMPRESCINDIBLE | CU-08 | Hecho en ADP-25 (encargo 041) | |
| RF-28 | Activar y ajustar los recordatorios | IMPRESCINDIBLE · **HECHO** | CU-08 | | |
| RF-29 | Abrir el elemento desde el aviso | DESEABLE | CU-08 | Hecho en ADP-25 (encargo 041) | |
| RF-30 | Avisar en la web de que no hay recordatorios | DESEABLE · **HECHO** | — | | |

El estado de construcción **no** se apunta aquí, salvo que un encargo pida expresamente marcar una funcionalidad como hecha.

## Funcionalidades

### RF-01 — Crear un hábito

- **Descripción:** el sistema debe permitir crear un hábito con nombre, frecuencia, fecha de inicio (hoy por defecto) y, opcionalmente, categoría.
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** CU-01, escenarios 1, 5 y 6.
- **Notas:** RN-10, RN-12, RN-25.

### RF-02 — Generar las ocurrencias de un hábito según su frecuencia

- **Descripción:** el sistema debe tener, para cada día que toque desde la fecha de inicio, una ocurrencia pendiente del hábito, con las cuatro frecuencias: todos los días, días de la semana, cada N días y cada mes.
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** CU-01, escenarios 2, 3 y 4. Además: dado un hábito diario, cuando llega un día de cambio de hora (último domingo de marzo o de octubre), entonces ese día tiene exactamente una ocurrencia (RNF-07).
- **Notas:** RN-10, RN-12, RN-22, RN-23 y RN-32. Es la lógica central del producto: va en un módulo propio con tests unitarios exhaustivos.

### RF-03 — Hora exacta o franja de un hábito

- **Descripción:** el sistema debe permitir indicar, de forma opcional, una hora exacta o una franja (mañana, tarde o noche), y ordenar las ocurrencias del día por ella.
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** CU-01, escenarios 1 y 2. Además: dado un hábito con hora a las 17:00, cuando el usuario elige la franja «noche», entonces el hábito queda solo con la franja.
- **Notas:** RN-11, RN-20.

### RF-04 — Duración opcional de un hábito

- **Descripción:** el sistema debe permitir indicar una duración opcional para un hábito.
- **Prioridad:** DESEABLE. *No se usa hasta la conexión con Google Calendar (versión 2): se puede posponer sin coste.*
- **Criterio de aceptación:** CU-01, escenario 2 (la duración de 1 hora y media queda guardada). Error: una duración de cero o negativa no se guarda.
- **Notas:** RN-21.

### RF-05 — Crear una tarea

- **Descripción:** el sistema debe permitir crear una tarea con nombre obligatorio y, opcionalmente, notas, fecha, hora y categoría. Sin categoría, va a la Bandeja de entrada. Con fecha pasada, avisa antes de crearla.
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** CU-02, escenarios 1 a 5.
- **Notas:** RN-09, RN-13, RN-25, RN-28.

### RF-06 — Cambiar el estado: hecho, no hecho o pendiente

- **Descripción:** el sistema debe permitir marcar una ocurrencia o una tarea como hecha o no hecha, cambiarla entre ambas y devolverla a pendiente, guardando cuándo se marcó.
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** CU-03, escenarios 1, 2, 7, 8 y 10; CU-04, escenario 1.
- **Notas:** RN-01 a RN-05 y RN-32.

### RF-07 — Aviso al marcar, con «Deshacer»

- **Descripción:** al marcar algo, el sistema debe mostrar un aviso breve y poco invasivo con la acción «Deshacer».
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** CU-03, escenarios 6 y 9.
- **Notas:** RN-31.

### RF-08 — Vista Hoy

- **Descripción:** el sistema debe mostrar lo pendiente de hoy: las ocurrencias de hábitos y las tareas con fecha de hoy, ordenadas por hora o franja; nunca tareas sin fecha ni vencidas.
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** CU-03, escenarios 3, 4 y 5. Además: dado un día sin nada pendiente, se muestra un mensaje de día libre.
- **Notas:** RN-07, RN-08, RN-29.

### RF-09 — Apartado «Marcadas hoy»

- **Descripción:** el sistema debe mostrar, plegado por defecto, lo marcado hoy, y permitir cambiarlo desde ahí.
- **Prioridad:** DESEABLE. *El aviso con «Deshacer» y el historial ya permiten corregir.*
- **Criterio de aceptación:** CU-03, escenario 7.
- **Notas:** RN-29.
- **Estado:** hecho en ADP-19 (encargo 033). Hoy muestra el apartado «Marcadas hoy», plegado por defecto, con las filas editables.

### RF-10 — Ver otros días

- **Descripción:** el sistema debe permitir abrir la vista de otra fecha; las fechas futuras solo se consultan.
- **Prioridad:** DESEABLE
- **Criterio de aceptación:** CU-03, escenario 8. Además: cuando el usuario abre el próximo miércoles, ve la ocurrencia de «Nadar» a las 17:00.
- **Notas:** RN-05.
- **Estado:** hecho en ADP-19 (encargo 033). Hoy tiene navegación entre días; las fechas futuras solo se consultan.

### RF-11 — Vista de categoría y Bandeja de entrada

- **Descripción:** el sistema debe mostrar lo pendiente de una categoría o de la Bandeja de entrada, con y sin fecha, y permitir marcarlo desde ahí; lo marcado desaparece de la lista.
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** CU-03, escenarios 5 y 6.
- **Notas:** RN-28, RN-30.

### RF-12 — Pendientes de días anteriores

- **Descripción:** el sistema debe listar las ocurrencias de días pasados sin marcar y las tareas vencidas, agrupadas por día, de la más reciente a la más antigua, y permitir marcarlas.
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** CU-04, escenario 1. Además: sin nada pendiente, se muestra «todo al día».
- **Notas:** RN-07, RN-08, RN-14.

### RF-13 — Reprogramar una tarea vencida

- **Descripción:** el sistema debe permitir dar una nueva fecha, de hoy en adelante, a una tarea vencida.
- **Prioridad:** DESEABLE. *También se puede cambiar la fecha modificando la tarea (RF-18).*
- **Criterio de aceptación:** CU-04, escenarios 2 y 3.
- **Notas:** RN-15.
- **Estado:** hecho en ADP-18 (encargo 031). Cada tarea vencida de Pendientes tiene «Reprogramar» (atajos Hoy y Mañana, selector de fecha); conserva la hora.

### RF-14 — Marcar un día entero como no hecho

- **Descripción:** el sistema debe permitir marcar como no hecho, de una vez, todo lo pendiente de un día pasado.
- **Prioridad:** DESEABLE (atajo).
- **Criterio de aceptación:** CU-04, escenario 4.
- **Estado:** hecho en ADP-18 (encargo 031). Cada cabecera de día de Pendientes tiene «Todo no hecho», con confirmación y un solo aviso con «Deshacer».

### RF-15 — Consultar el historial

- **Descripción:** el sistema debe mostrar, para un rango de fechas (por defecto, los últimos 7 días), cada hábito y tarea con su estado final, incluido «sin marcar».
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** CU-05, escenarios 1, 3 y 4.
- **Notas:** RN-16, RN-17.

### RF-16 — Filtrar el historial

- **Descripción:** el sistema debe permitir filtrar el historial por elemento, por estado o por categoría.
- **Prioridad:** DESEABLE
- **Criterio de aceptación:** CU-05, escenario 2.

### RF-17 — Corregir desde el historial

- **Descripción:** el sistema debe permitir cambiar el estado de un elemento pasado desde el historial.
- **Prioridad:** DESEABLE. *Lo que quedó sin marcar ya se resuelve en RF-12.*
- **Criterio de aceptación:** dado que hace dos semanas «Nadar» quedó como no hecho, cuando el usuario lo cambia a hecho desde el historial, entonces queda hecho y se guarda cuándo se corrigió.
- **Notas:** RN-03, RN-04.

### RF-18 — Modificar un hábito o una tarea

- **Descripción:** el sistema debe permitir cambiar los datos de un hábito o de una tarea; un cambio de frecuencia solo afecta al futuro.
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** CU-06, escenarios 1, 2 y 4.
- **Notas:** RN-19.

### RF-19 — Archivar (eliminar) un hábito o una tarea

- **Descripción:** eliminar es archivar: el elemento deja de aparecer y de generar ocurrencias, y su historial se conserva. Sin borrado definitivo en la versión 1.
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** CU-06, escenario 3.
- **Notas:** RN-16, RN-18.

### RF-20 — Crear categorías y asignarlas

- **Descripción:** el sistema debe permitir crear una categoría con nombre único y asignarla, como máximo una, a hábitos y tareas. Cada categoría tiene un icono y un color, y puede dividirse en **secciones** (por ejemplo, «Lista de la compra» en «Mercadona» y «Lidl»); una tarea o un hábito va en la categoría o en una de sus secciones. Las secciones se crean y se eliminan; al eliminar una, lo que contiene queda en la categoría, sin sección (DEC-29 y DEC-31).
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** CU-07, escenarios 1, 2, 6 y 7; CU-02, escenario 5.
- **Notas:** RN-24, RN-25.

### RF-21 — Eliminar una categoría

- **Descripción:** el sistema debe permitir eliminar una categoría; lo que contiene pasa a la Bandeja de entrada, que no se puede eliminar.
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** CU-07, escenarios 3 y 5.
- **Notas:** RN-26, RN-28.

### RF-22 — Renombrar una categoría

- **Descripción:** el sistema debe permitir cambiar el nombre de una categoría.
- **Prioridad:** DESEABLE
- **Criterio de aceptación:** CU-07, escenario 4.
- **Notas:** RN-24.

### RF-23 — Elegir el tema

- **Descripción:** el sistema debe tener tres temas: blanco, negro y el tercer estilo. Por defecto sigue el modo del móvil (claro, blanco; oscuro, negro); en Ajustes se puede fijar cualquiera de los tres, y la elección se guarda en el dispositivo.
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** con el móvil en modo oscuro y sin elegir nada, la app sale en negro; al fijar el tercer estilo en Ajustes, sale en ese estilo aunque el móvil cambie de modo, también al cerrar y abrir la app.
- **Notas:** DEC-32; el aspecto de cada tema está en `docs/diseno.md`.

*Versión 1.1, recordatorios (DEC-43; propuesta en [propuestas/recordatorios](propuestas/recordatorios.md)):*

### RF-24 — Aviso con antelación de una tarea con fecha

- **Descripción:** el sistema debe avisar en el móvil de cada tarea pendiente con fecha, a las 09:00 de los días de antelación elegidos (por defecto, 3 días antes, el día anterior y el mismo día); si la tarea tiene hora, el aviso del mismo día llega una hora antes de ella.
- **Prioridad:** IMPRESCINDIBLE (versión 1.1)
- **Criterio de aceptación:** CU-08, escenarios 1, 2 y 3.
- **Notas:** RN-34, RN-35, RN-36, RN-38.

### RF-25 — Aviso a la hora de un hábito con hora exacta

- **Descripción:** el sistema debe avisar en el móvil, a la hora exacta del hábito, de cada ocurrencia pendiente.
- **Prioridad:** IMPRESCINDIBLE (versión 1.1)
- **Criterio de aceptación:** CU-08, escenario 4. Además: dado un hábito «cada 3 días» a las 08:00 que empezó el día 1, entre los días 1 y 7 avisa los días 1, 4 y 7, y nunca un día que no toca (RN-22).
- **Notas:** RN-34, RN-37; usa el motor de ocurrencias sin cambiarlo (ADR-0003).

### RF-26 — Aviso de los hábitos con franja

- **Descripción:** el sistema debe permitir activar avisos para los hábitos con franja, a la hora de su franja (RN-20). Desactivado por defecto.
- **Prioridad:** DESEABLE. *Sin él, basta con poner hora exacta al hábito que se quiera recordar.*
- **Criterio de aceptación:** CU-08, escenario 5.
- **Notas:** RN-37.

### RF-27 — Los avisos siguen al estado de cada elemento

- **Descripción:** el sistema no debe avisar de nada hecho, no hecho, archivado, sin fecha o cuya fecha u hora haya cambiado; al volver algo a pendiente, sus avisos futuros vuelven.
- **Prioridad:** IMPRESCINDIBLE (versión 1.1). *Sin esto, los avisos serían ruido y el humano los apagaría.*
- **Criterio de aceptación:** CU-08, escenarios 6, 7, 8 y 9.
- **Notas:** RN-34, RN-39, RN-40.

### RF-28 — Activar y ajustar los recordatorios

- **Descripción:** el sistema debe permitir, desde Ajustes, encender y apagar los recordatorios, elegir la antelación de las tareas y activar los de hábitos con franja; debe pedir el permiso del móvil y, si está denegado, decirlo y ofrecer abrir los ajustes del móvil.
- **Prioridad:** IMPRESCINDIBLE (versión 1.1)
- **Criterio de aceptación:** CU-08, escenarios 10, 11 y 12.
- **Notas:** los ajustes se guardan en el dispositivo, como el tema (RF-23).

### RF-29 — Abrir el elemento desde el aviso

- **Descripción:** al tocar un aviso, la app se abre en la ficha de la tarea o, si es un hábito, en Hoy.
- **Prioridad:** DESEABLE. *Sin él, el aviso abre la app donde estuviera.*
- **Criterio de aceptación:** CU-08, escenario 13.

### RF-30 — Avisar en la web de que no hay recordatorios

- **Descripción:** en el navegador, la sección de recordatorios de Ajustes indica que solo funcionan en la app del móvil.
- **Prioridad:** DESEABLE
- **Criterio de aceptación:** dado que el usuario abre Ajustes en el navegador, entonces ve «Los recordatorios solo funcionan en la app del móvil» y ningún interruptor.

## Requisitos no funcionales

Cómo de bien tiene que hacerlo. Cada uno con **un número**, no con adjetivos.

| Id | Categoría | Requisito | Cómo se comprueba |
|---|---|---|---|
| RNF-01 | Rendimiento | Con un año de datos (50 hábitos, 2.000 tareas, 20.000 ocurrencias), la vista Hoy se muestra en menos de 1 segundo en un móvil Android de gama media, y marcar algo se refleja en pantalla en menos de 300 ms | Test con datos sintéticos generados por un script |
| RNF-02 | Seguridad | Sin iniciar sesión no se puede leer ni cambiar ningún dato: solo accede el dueño. Ningún secreto en el repositorio | Test de acceso sin sesión; escaneo de secretos en la integración continua |
| RNF-03 | Accesibilidad | Contraste AA, etiquetas de accesibilidad en todo lo que se pulsa, zonas de toque de al menos 44 puntos y, en la web, todo usable con teclado | Revisión con `better-accessibility`; en la web, auditoría automática sin errores graves |
| RNF-04 | Datos | Sin objetivo de disponibilidad (uso personal), pero **ningún dato se pierde**: copia exportable y una restauración probada | Exportar y restaurar una vez antes del uso diario |
| RNF-05 | Privacidad | Solo hay datos del dueño, y no salen a terceros salvo el proveedor de alojamiento y, en la versión 2, Google Calendar con su permiso | Revisión de servicios en la ADR del stack |
| RNF-06 | Rapidez de uso | Desde Hoy, marcar algo cuesta **una** acción; crear una tarea con solo el nombre, escribirlo y confirmar | Prueba de extremo a extremo que cuenta las acciones |
| RNF-07 | Fechas | Zona horaria del dispositivo (para el dueño, Europe/Madrid); los cambios de hora no duplican ni pierden ocurrencias, ni mueven sus horas | Tests en los días de cambio de hora |
| RNF-08 | Móvil | Funciona instalada en las versiones de Android que soporta el SDK de Expo fijado, en pantallas desde 360 dp de ancho; la misma app se usa en el navegador del ordenador sin romperse *(versión 1, DEC-24)* | Flujos de Maestro en el emulador; prueba de la web con el MCP de Chrome |
| RNF-09 | Recordatorios | En la app instalada, con el permiso concedido y sin ahorro de batería extremo, un aviso llega **como mucho 2 minutos** después de su hora; los avisos siguen programados **después de reiniciar el móvil** | Comprobación manual del humano con el APK (lista del encargo R6) |

Si un requisito no funcional no tiene número, todavía es una intención.
