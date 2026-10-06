# Casos de uso

Un requisito dice qué hace el sistema. Un caso de uso describe **cómo transcurre la interacción**, paso a paso, incluido lo que sale mal. El formato es el de la [plantilla estándar](plantilla-caso-de-uso.md).

*Estado: **confirmados por el humano el 2026-10-06** (sesión 2; DEC-10, DEC-11, DEC-13 y DEC-15).*

## Para qué sirven

El valor está en los **flujos alternativos y las excepciones**: ahí se descubren los agujeros del diseño antes de programar. Un caso de uso con solo flujo normal está mal escrito.

No hace falta un caso de uso para cada funcionalidad: solo para las que tienen interacción, estados o reglas no triviales.

## Vocabulario

| Término | Significa |
|---|---|
| **Hábito** | Algo que se repite según una regla: «todos los días», «los miércoles a las 17:00» |
| **Ocurrencia** | Un hábito en una fecha concreta. Es lo que se marca. El hábito de nadar tiene una ocurrencia cada miércoles |
| **Franja** | Momento del día sin hora exacta: mañana, tarde o noche. Cada una tiene una hora asociada (RN-20) |
| **Tarea** | Algo que se hace una sola vez. Puede tener fecha (con hora o sin ella) o no tenerla |
| **Categoría** | Agrupación opcional con nombre («Compra», «Universidad»). Cada hábito o tarea tiene como máximo una (DEC-13) |
| **Vista del día** («Hoy» si es el día actual) | Lo pendiente de una fecha: ocurrencias de hábitos y tareas con esa fecha. **Nunca** tareas sin fecha ni vencidas |
| **Bandeja de entrada** | Todo lo que no tiene categoría, con fecha o sin ella. Funciona como una categoría implícita |
| **Vista de categoría** | Lo pendiente de una categoría (o de la Bandeja de entrada), con y sin fecha |
| **Estado** | De una ocurrencia o de una tarea: **pendiente**, **hecha** o **no hecha** |
| **Sin marcar** | Una ocurrencia de un hábito, de un día ya pasado, que sigue pendiente. No es un estado nuevo: es «pendiente» de una fecha pasada |
| **Vencida** | Una tarea con fecha anterior a hoy que sigue pendiente |
| **Historial** | El registro de todo lo que se hizo, no se hizo o quedó sin marcar |

## Índice

| Caso | Nombre | Funcionalidades |
|---|---|---|
| CU-01 | Crear un hábito recurrente | *(sesión 3)* |
| CU-02 | Crear una tarea | *(sesión 3)* |
| CU-03 | Ver el día y marcar lo hecho o no hecho | *(sesión 3)* |
| CU-04 | Resolver lo que quedó pendiente de días anteriores | *(sesión 3)* |
| CU-05 | Consultar el historial | *(sesión 3)* |
| CU-06 | Modificar o eliminar un hábito o una tarea | *(sesión 3)* |
| CU-07 | Gestionar categorías | *(sesión 3)* |

## Reglas de negocio compartidas

Se definen aquí una sola vez y los casos las enlazan.

- **RN-01.** Toda ocurrencia o tarea tiene exactamente un estado: pendiente, hecha o no hecha. Al crearse, es pendiente.
- **RN-02.** Marcar «no hecha» es una acción explícita del usuario, igual de directa que marcar «hecha». Nunca se asigna sola.
- **RN-03.** El estado de una ocurrencia o tarea puede cambiarse tantas veces como se quiera (hecha, no hecha o de vuelta a pendiente).
- **RN-04.** Cada vez que se marca, el sistema guarda **cuándo** se marcó, además de la fecha a la que corresponde la ocurrencia.
- **RN-05.** Una ocurrencia de **un día posterior a hoy** no se puede marcar como hecha ni como no hecha.
- **RN-06.** Las fechas y horas se interpretan en la **zona horaria local** del usuario.
- **RN-07.** Las ocurrencias de un hábito **no se acumulan**: las de un día pasado que siguen pendientes no aparecen en la vista de hoy; solo se ven en CU-04 y en el historial.
- **RN-08.** Una **tarea vencida** sale de la vista de hoy y queda en «pendientes de días anteriores» (CU-04) hasta que el usuario la marca hecha, no hecha o la reprograma. *(Cambiada el 2026-10-06, DEC-17.)*
- **RN-09.** Una tarea sin fecha no vence nunca.
- **RN-24.** El nombre de una categoría es obligatorio y **único**, sin distinguir mayúsculas de minúsculas.
- **RN-25.** Un hábito o una tarea tiene **como máximo una** categoría, y es opcional.
- **RN-26.** Eliminar una categoría **no elimina** lo que contiene: esos hábitos y tareas pasan a la Bandeja de entrada.
- **RN-27.** *(Retirada el 2026-10-06: la vista del día ya no muestra tareas sin fecha, así que el ajuste de categoría «mostrar en la vista del día» no hace falta. Ver DEC-15.)*
- **RN-28.** Lo que no tiene categoría está en la **Bandeja de entrada**, una categoría implícita que no se puede renombrar ni eliminar.
- **RN-29.** La vista del día muestra **solo lo pendiente de ese día** y **nunca tareas sin fecha**. Lo que se marca sale de la lista y pasa a un apartado plegado, **«Marcadas hoy»**, cerrado por defecto.
- **RN-30.** En la vista de una categoría y en la Bandeja de entrada, lo que se marca (hecho o no hecho) **desaparece** de la lista; sigue en el historial.
- **RN-31.** Cada vez que se marca algo, aparece un **aviso breve y poco invasivo** dentro de la aplicación («Marcada como hecha» o «Marcada como no hecha») con la acción **Deshacer**, que devuelve el elemento a su estado y a su lista anteriores.
- **RN-32.** Cada ocurrencia de un hábito es **independiente**: lo que pasó con la de un día (hecha, no hecha o sin marcar) no impide ni cambia marcar la de otro día.

---

## CU-01 — Crear un hábito recurrente

- **Actor principal:** el usuario
- **Actores secundarios:** ninguno
- **Funcionalidades:** *(se asignan en la sesión 3)*
- **Precondiciones:** ninguna
- **Postcondiciones:** el hábito existe con su regla de repetición y aparece, como ocurrencia pendiente, en cada día que le toca desde su fecha de inicio
- **Disparador:** el usuario quiere que algo se repita («todas las noches me lavo los dientes»)

### Flujo normal

1. El usuario indica que quiere crear un hábito.
2. El sistema pide el nombre y la frecuencia.
3. El usuario escribe el nombre, elige la frecuencia «todos los días» y confirma.
4. El sistema valida los datos y guarda el hábito con fecha de inicio hoy.
5. El sistema muestra el hábito creado y su ocurrencia de hoy como pendiente.

### Flujos alternativos

- **A1.** En el paso 3, si el usuario elige **días concretos de la semana** (por ejemplo, los martes): el hábito solo genera ocurrencia esos días. Continúa en el paso 4.
- **A2.** En el paso 3, si el usuario elige **cada N días** (por ejemplo, cada 3 días): el hábito genera una ocurrencia cada N días contando desde la fecha de inicio (RN-22). Continúa en el paso 4.
- **A3.** En el paso 3, si el usuario elige **cada mes**: el hábito genera una ocurrencia el mismo día del mes que la fecha de inicio (RN-23). Continúa en el paso 4.
- **A4.** En el paso 3, si el usuario indica una **hora exacta** (por ejemplo, las 17:00): cada ocurrencia lleva esa hora y se ordena por ella en el día. Continúa en el paso 4.
- **A5.** En el paso 3, si el usuario indica una **franja del día** (mañana, tarde o noche): cada ocurrencia lleva esa franja y se ordena por la hora asociada a ella (RN-20). Elegir franja sustituye a una hora exacta, y al revés. Continúa en el paso 4.
- **A6.** En el paso 3, si el usuario indica una **duración** (por ejemplo, 1 hora y media): el hábito la guarda para cuando se conecte con el calendario (RN-21). Continúa en el paso 4.
- **A7.** En el paso 3, si el usuario elige una **fecha de inicio futura**: el hábito genera ocurrencias solo desde esa fecha. Continúa en el paso 4.
- **A8.** En el paso 3, si el usuario elige una **categoría** existente (RN-25): el hábito queda en esa categoría. Continúa en el paso 4.

### Excepciones

- **E1.** En el paso 4, si el **nombre está vacío**: el sistema no guarda nada e indica que el nombre es obligatorio. Queda: el formulario con lo escrito.
- **E2.** En el paso 4, si se eligió «días concretos» **sin ningún día**: el sistema no guarda nada e indica que hay que elegir al menos un día. Queda: el formulario con lo escrito.
- **E3.** En el paso 4, si se eligió «cada N días» y **N no es un número entero mayor que cero**: el sistema no guarda nada e indica que N debe ser un entero de 1 o más. Queda: el formulario con lo escrito.
- **E4.** En el paso 4, si el **guardado falla**: el sistema avisa del error y no crea el hábito. Queda: el formulario con lo escrito, para reintentar.

### Reglas de negocio

- **RN-10.** Un hábito tiene una sola regla de repetición: todos los días, un conjunto de días de la semana, cada N días o cada mes.
- **RN-11.** El momento del día de un hábito es opcional y es **una hora exacta o una franja, nunca las dos**.
- **RN-12.** Las ocurrencias se generan **desde la fecha de inicio hacia delante**, nunca hacia atrás.
- **RN-20.** Las franjas tienen una hora asociada, fija en la versión 1: **mañana 09:00, tarde 15:00, noche 21:00**. El hábito guarda la franja, no la hora; esa hora sirve para ordenar y para el calendario.
- **RN-21.** La duración de un hábito es opcional. Si no se indica, al conectar con Google Calendar se usa **1 hora** por defecto.
- **RN-22.** «Cada N días» cuenta desde la fecha de inicio, **no desde la última vez que se marcó**: una ocurrencia sin marcar no desplaza a las siguientes.
- **RN-23.** «Cada mes» usa el día del mes de la fecha de inicio. Si un mes no tiene ese día (por ejemplo, el 31 en febrero), la ocurrencia cae en el **último día de ese mes**.
- Aplican también RN-01 y RN-06.

### Cómo se comprueba

- **Escenario 1: hábito diario.** Dado que no existe ningún hábito, cuando el usuario crea «Lavarme los dientes» todos los días en la franja noche, entonces el hábito existe y hoy tiene una ocurrencia pendiente a la hora de la noche (21:00).
- **Escenario 2: semanal con hora.** Dado que hoy es lunes, cuando el usuario crea «Nadar» los martes a las 17:00 con duración de 1 hora y media, entonces hoy no tiene ocurrencia y el martes siguiente tiene una a las 17:00.
- **Escenario 3: cada N días.** Dado un hábito «cada 3 días» con inicio el día 1, cuando se consultan los días 1 al 10, entonces tiene ocurrencias los días 1, 4, 7 y 10, aunque las del 1 y el 4 no se hayan marcado.
- **Escenario 4: mensual a fin de mes.** Dado un hábito «cada mes» con inicio el 31 de enero, cuando se consulta febrero, entonces tiene su ocurrencia el último día de febrero.
- **Escenario 5: nombre vacío (E1).** Cuando el usuario intenta guardar un hábito sin nombre, entonces no se crea ningún hábito y se indica que el nombre es obligatorio.
- **Escenario 6: N no válido (E3).** Cuando el usuario pone «cada 0 días», entonces no se crea el hábito y se indica que N debe ser 1 o más.

---

## CU-02 — Crear una tarea

- **Actor principal:** el usuario
- **Actores secundarios:** ninguno
- **Funcionalidades:** *(se asignan en la sesión 3)*
- **Precondiciones:** ninguna
- **Postcondiciones:** la tarea existe en estado pendiente, con su fecha si la tiene, en su categoría o, si no tiene, en la Bandeja de entrada (RN-28)
- **Disparador:** el usuario quiere apuntar algo que hacer una sola vez («entregar la práctica el día 20», «comprar leche»)

### Flujo normal

1. El usuario indica que quiere crear una tarea.
2. El sistema pide el nombre y, opcionalmente, una fecha.
3. El usuario escribe el nombre, elige una fecha y confirma.
4. El sistema valida los datos y guarda la tarea como pendiente.
5. El sistema muestra la tarea creada.

### Flujos alternativos

- **A1.** En el paso 3, si el usuario **no elige fecha**: la tarea se guarda sin fecha (ver RN-09). Continúa en el paso 4.
- **A2.** En el paso 3, si el usuario añade una **hora** a la fecha: la tarea la guarda y se ordena por ella dentro del día. Continúa en el paso 4.
- **A3.** En el paso 3, si el usuario añade **notas**: se guardan con la tarea. Continúa en el paso 4.
- **A4.** En el paso 3, si la fecha elegida es **anterior a hoy**: el sistema avisa de que la tarea nacerá vencida y pide confirmación. Si el usuario confirma, continúa en el paso 4; si no, vuelve al paso 3.
- **A5.** En el paso 3, si el usuario elige una **categoría** existente (por ejemplo, «Compra»): la tarea queda en esa categoría (RN-25). Continúa en el paso 4.
- **A6.** En el paso 3, si el usuario necesita una categoría que **no existe**: la crea desde el propio formulario como en CU-07 y la asigna. Continúa en el paso 4.

### Excepciones

- **E1.** En el paso 4, si el **nombre está vacío**: el sistema no guarda nada e indica que el nombre es obligatorio. Queda: el formulario con lo escrito.
- **E2.** En el paso 4, si el **guardado falla**: el sistema avisa y no crea la tarea. Queda: el formulario con lo escrito, para reintentar.

### Reglas de negocio

- **RN-13.** El nombre de una tarea es obligatorio; las notas, la fecha, la hora y la categoría son opcionales.
- Aplican también RN-01, RN-06, RN-08, RN-09 y RN-25.

### Cómo se comprueba

- **Escenario 1: tarea sin fecha.** Cuando el usuario crea «Comprar leche» sin fecha ni categoría, entonces la tarea existe, está pendiente, no vence nunca y está en la Bandeja de entrada.
- **Escenario 2: tarea con fecha.** Cuando el usuario crea «Entregar práctica» para el día 20, entonces la tarea existe pendiente con esa fecha.
- **Escenario 3: fecha pasada (A4).** Cuando el usuario elige una fecha anterior a hoy y confirma el aviso, entonces la tarea se crea ya vencida.
- **Escenario 4: nombre vacío (E1).** Cuando el usuario intenta guardar sin nombre, entonces no se crea la tarea y se indica que el nombre es obligatorio.
- **Escenario 5: tarea en categoría (A5).** Dado que existe la categoría «Compra», cuando el usuario crea «Leche» sin fecha en esa categoría, entonces la tarea existe, pendiente y dentro de «Compra».
- **Escenario 6: crear desde una sección (DEC-30).** Dado que el usuario está en la sección «Mercadona» de «Lista de la compra», cuando pulsa +, escribe «Plátanos» y confirma, entonces la tarea queda en «Lista de la compra», sección «Mercadona», sin fecha.
- **Escenario 7: crear desde Hoy (DEC-30).** Cuando el usuario, desde Hoy, pulsa +, escribe «Comprar pilas» y confirma, entonces la tarea queda con la fecha de hoy y sale en Hoy.

---

## CU-03 — Ver el día y marcar lo hecho o no hecho

- **Actor principal:** el usuario
- **Actores secundarios:** ninguno
- **Funcionalidades:** *(se asignan en la sesión 3)*
- **Precondiciones:** existe al menos un hábito o una tarea
- **Postcondiciones:** el estado de lo marcado queda guardado, con el momento en que se marcó
- **Disparador:** el usuario abre la aplicación para ver o cerrar su día

### Flujo normal

1. El usuario abre la vista del día (hoy por defecto).
2. El sistema muestra lo **pendiente** de ese día: las ocurrencias de hábitos y las tareas con fecha de ese día. No muestra tareas sin fecha (RN-29) ni vencidas (RN-08). Lo que tiene hora o franja va ordenado por ella.
3. El usuario marca un elemento como **hecho**.
4. El sistema guarda el estado y el momento en que se marcó (RN-04).
5. El sistema quita el elemento de la lista de pendientes, lo cuenta en «Marcadas hoy» (RN-29) y muestra el aviso con **Deshacer** (RN-31).

### Flujos alternativos

- **A1.** En el paso 3, si el usuario marca el elemento como **no hecho**: el sistema hace lo mismo con el estado «no hecha» (RN-02). Continúa en el paso 4.
- **A2.** En el paso 3, si el usuario abre **«Marcadas hoy»** y **cambia un elemento** (de hecho a no hecho, o al revés) o lo **devuelve a pendiente**: el sistema guarda el cambio y el momento (RN-03, RN-04). Si vuelve a pendiente, reaparece en la lista. Termina el caso.
- **A3.** En el paso 1, si el usuario elige **otro día**: el sistema muestra ese día. Si es **posterior a hoy**, se ve pero no se puede marcar nada (RN-05). Continúa en el paso 2.
- **A4.** En el paso 2, si **no hay nada pendiente** para ese día: el sistema muestra un mensaje de día libre. Termina el caso.
- **A5.** En el paso 1, si el usuario abre una **categoría** o la **Bandeja de entrada** en lugar del día: el sistema muestra todo lo pendiente que contiene, con y sin fecha. El usuario marca desde ahí como en el paso 3; el sistema guarda como en el paso 4, quita el elemento de esa lista (RN-30) y muestra el aviso con Deshacer (RN-31). Termina el caso.
- **A6.** En el paso 5, si el usuario pulsa **Deshacer** en el aviso: el sistema devuelve el elemento a su estado anterior y a su lista (RN-31). Termina el caso.

### Excepciones

- **E1.** En el paso 4, si el **guardado falla**: el sistema avisa del error y **mantiene el estado anterior** del elemento. Queda: el elemento como estaba.
- **E2.** En el paso 3, si el usuario intenta marcar una ocurrencia **de un día posterior a hoy**: el sistema lo impide e indica que aún no se puede marcar. Queda: sin cambios.

### Reglas de negocio

- Aplican RN-01 a RN-09 y RN-28 a RN-32. En concreto: RN-07 y RN-08 explican por qué ni los hábitos de días pasados sin marcar ni las tareas vencidas salen aquí, y RN-32 por qué la ocurrencia de hoy se marca sin depender de la de ayer.

### Cómo se comprueba

- **Escenario 1: marcar hecho.** Dado que hoy hay una ocurrencia pendiente de «Lavarme los dientes», cuando el usuario la marca como hecha, entonces sale de la lista de pendientes, aparece en «Marcadas hoy», se muestra el aviso «Marcada como hecha · Deshacer» y se guarda cuándo se marcó.
- **Escenario 2: marcar no hecho.** Dado el mismo caso, cuando el usuario la marca como no hecha, entonces queda no hecha y deja de aparecer como pendiente.
- **Escenario 3: hábito sin marcar de ayer.** Dado que ayer una ocurrencia quedó pendiente, cuando el usuario abre hoy, entonces esa ocurrencia no aparece en la vista de hoy.
- **Escenario 4: tarea vencida.** Dado que una tarea con fecha de ayer sigue pendiente, cuando el usuario abre Hoy, entonces la tarea no aparece; está en «pendientes de días anteriores».
- **Escenario 5: Hoy sin tareas sin fecha.** Dado que existen «Leche» (sin fecha, en «Compra») y «Llamar al banco» (sin fecha ni categoría), cuando el usuario abre Hoy, entonces no ve ninguna de las dos; «Llamar al banco» está en la Bandeja de entrada.
- **Escenario 6: marcar en una categoría (A5).** Dado «Leche» pendiente en «Compra», cuando el usuario la marca como hecha desde «Compra», entonces desaparece de la lista y aparece el aviso «Marcada como hecha · Deshacer».
- **Escenario 7: corregir un error (A2).** Dado que el usuario marcó algo como no hecho por error, cuando abre «Marcadas hoy» y lo pasa a hecho, entonces queda hecho.
- **Escenario 8: día futuro (E2).** Cuando el usuario intenta marcar una ocurrencia de mañana, entonces no se permite y el estado no cambia.
- **Escenario 9: Deshacer (A6).** Dado que el usuario acaba de marcar «Leche» como hecha, cuando pulsa Deshacer, entonces «Leche» vuelve a estar pendiente en su lista.
- **Escenario 10: ocurrencias independientes.** Dado que ayer «Lavarme los dientes» quedó sin marcar, cuando hoy el usuario marca la de hoy como hecha, entonces la de hoy queda hecha y la de ayer sigue sin marcar en «pendientes de días anteriores».

---

## CU-04 — Resolver lo que quedó pendiente de días anteriores

- **Actor principal:** el usuario
- **Actores secundarios:** ninguno
- **Funcionalidades:** *(se asignan en la sesión 3)*
- **Precondiciones:** hay ocurrencias de hábitos de días pasados pendientes o tareas vencidas (si no, ver A3)
- **Postcondiciones:** lo que el usuario resuelve queda hecho, no hecho o reprogramado, y desaparece de la lista de pendientes
- **Disparador:** el usuario quiere poner al día lo que se le quedó atrás

### Flujo normal

1. El usuario abre la lista de pendientes de días anteriores.
2. El sistema muestra las ocurrencias de hábitos sin marcar y las tareas vencidas, agrupadas por día y de la más reciente a la más antigua.
3. El usuario elige un elemento y lo marca como **hecho**.
4. El sistema guarda el estado y el momento real en que se marcó (RN-04), conservando la fecha original del elemento.
5. El sistema quita el elemento de la lista.

### Flujos alternativos

- **A1.** En el paso 3, si el usuario lo marca como **no hecho**: el sistema hace lo mismo con el estado «no hecha». Continúa en el paso 4.
- **A2.** En el paso 3, si el elemento es una **tarea vencida** y el usuario la **reprograma** a una nueva fecha: la tarea sigue pendiente con la nueva fecha y sale de esta lista. Continúa en el paso 5.
- **A3.** En el paso 2, si **no hay nada pendiente**: el sistema muestra un mensaje de «todo al día». Termina el caso.
- **A4.** En el paso 3, si el usuario marca **todo un día** como no hecho de una vez: el sistema guarda «no hecha» en todos los elementos de ese día. Continúa en el paso 5.

### Excepciones

- **E1.** En el paso 3, si el usuario reprograma una tarea a una **fecha anterior a hoy**: el sistema no lo permite e indica que la nueva fecha debe ser hoy o posterior. Queda: la tarea sin cambios.
- **E2.** En el paso 4, si el **guardado falla**: el sistema avisa y **mantiene el estado anterior**. Queda: el elemento sigue en la lista.

### Reglas de negocio

- **RN-14.** No hay límite hacia atrás: se puede resolver una ocurrencia de cualquier día pasado.
- **RN-15.** Reprogramar solo existe para **tareas**, no para ocurrencias de hábitos (cada ocurrencia pertenece a su día).
- Aplican también RN-02, RN-04, RN-07, RN-08 y RN-32.

### Cómo se comprueba

- **Escenario 1: resolver un hábito.** Dado que hace tres días una ocurrencia quedó sin marcar, cuando el usuario la marca como no hecha desde la lista, entonces queda no hecha, conserva su fecha de hace tres días y sale de la lista.
- **Escenario 2: reprogramar una tarea.** Dado que una tarea venció ayer, cuando el usuario la reprograma a mañana, entonces sigue pendiente con la fecha de mañana y ya no está vencida.
- **Escenario 3: reprogramar al pasado (E1).** Cuando el usuario intenta reprogramar una tarea a una fecha anterior a hoy, entonces no se permite y la tarea no cambia.
- **Escenario 4: todo un día como no hecho (A4).** Dado que un día tiene cuatro ocurrencias sin marcar, cuando el usuario marca el día entero como no hecho, entonces las cuatro quedan no hechas.

---

## CU-05 — Consultar el historial

- **Actor principal:** el usuario
- **Actores secundarios:** ninguno
- **Funcionalidades:** *(se asignan en la sesión 3)*
- **Precondiciones:** ninguna (sin datos, ver A4)
- **Postcondiciones:** ninguna, salvo que el usuario corrija algo (A3)
- **Disparador:** el usuario quiere ver qué hizo y qué no hizo

### Flujo normal

1. El usuario abre el historial.
2. El sistema muestra, por defecto, los **últimos 7 días**, de más reciente a más antiguo.
3. Para cada día, el sistema muestra cada hábito y tarea con su estado final: hecha, no hecha o pendiente (las ocurrencias pasadas pendientes se muestran como «sin marcar»).
4. El usuario elige otro **rango de fechas**.
5. El sistema muestra el historial de ese rango.

### Flujos alternativos

- **A1.** En el paso 4, si el usuario **filtra por un hábito o una tarea concretos**: el sistema muestra solo ese elemento a lo largo del rango. Continúa en el paso 5.
- **A2.** En el paso 4, si el usuario **filtra por estado** (por ejemplo, solo las no hechas): el sistema muestra solo los elementos con ese estado. Continúa en el paso 5.
- **A3.** En el paso 3, si el usuario **elige un elemento pasado** desde el historial (sin marcar o ya marcado): el sistema le permite marcarlo o corregirlo como en CU-04 (RN-03). Continúa en el paso 5.
- **A4.** En el paso 2 o 5, si **no hay datos** en el rango: el sistema muestra un mensaje de historial vacío. Termina el caso.
- **A5.** En el paso 4, si el usuario **filtra por una categoría**: el sistema muestra solo los elementos de esa categoría en el rango. Continúa en el paso 5.

### Excepciones

- **E1.** En el paso 4, si el rango tiene la **fecha final anterior a la inicial**: el sistema no lo aplica e indica que el rango no es válido. Queda: el rango anterior.
- **E2.** En el paso 2 o 5, si **no se puede leer el historial**: el sistema avisa del error y no muestra datos parciales como si fueran completos. Queda: sin cambios.

### Reglas de negocio

- **RN-16.** El historial incluye todo lo que se marcó, también de hábitos y tareas que luego se eliminaron (archivados, RN-18).
- **RN-17.** Una ocurrencia pasada pendiente se muestra como «sin marcar», no como «no hecha» (RN-02).
- **RN-33.** El historial sitúa cada tarea en su fecha; si no tiene fecha, en el día en que se marcó.

### Cómo se comprueba

- **Escenario 1: historial por defecto.** Dado que en los últimos días hubo hechas, no hechas y sin marcar, cuando el usuario abre el historial, entonces ve los últimos 7 días con cada estado en su sitio.
- **Escenario 2: filtrar por no hechas (A2).** Cuando el usuario filtra por «no hecha», entonces solo ve los elementos no hechos del rango.
- **Escenario 3: rango inválido (E1).** Cuando el usuario pone una fecha final anterior a la inicial, entonces no se aplica y se indica el error.
- **Escenario 4: sin datos (A4).** Dado un rango sin actividad, cuando el usuario lo consulta, entonces ve un mensaje de historial vacío.
- **Escenario 5: tarea sin fecha.** Dado que «Leche», sin fecha, se marcó como hecha el martes, cuando el usuario abre el historial, entonces aparece en el martes.

---

## CU-06 — Modificar o eliminar un hábito o una tarea

- **Actor principal:** el usuario
- **Actores secundarios:** ninguno
- **Funcionalidades:** *(se asignan en la sesión 3)*
- **Precondiciones:** existe el hábito o la tarea
- **Postcondiciones:** el cambio queda guardado; el historial no pierde datos (RN-18)
- **Disparador:** el usuario quiere corregir un nombre, cambiar una repetición o dejar de usar algo

### Flujo normal

1. El usuario elige un hábito o una tarea y pide modificarlo.
2. El sistema muestra sus datos actuales.
3. El usuario cambia lo que quiere y confirma.
4. El sistema valida los datos y guarda los cambios.
5. El sistema muestra el elemento actualizado.

### Flujos alternativos

- **A1.** En el paso 3, si el usuario **cambia la regla de repetición de un hábito**: el cambio afecta **solo a las ocurrencias futuras**; las pasadas conservan su estado (RN-19). Continúa en el paso 4.
- **A2.** En el paso 1, si el usuario pide **eliminar** en lugar de modificar: el sistema pide confirmación; si el usuario confirma, **archiva** el elemento: deja de aparecer en el día y de generar ocurrencias, pero **su historial se conserva** (RN-18). Termina el caso. Si no confirma, no cambia nada.

### Excepciones

- **E1.** En el paso 4, si el **nombre queda vacío**: el sistema no guarda e indica que es obligatorio. Queda: el elemento sin cambios.
- **E2.** En el paso 4, si el **guardado falla**: el sistema avisa y **mantiene los datos anteriores**.

### Reglas de negocio

- **RN-18.** Eliminar es **archivar**: el historial de lo ya marcado se conserva. En la versión 1 no hay borrado definitivo.
- **RN-19.** Modificar un hábito nunca reescribe el pasado: las ocurrencias ya existentes en fechas pasadas no cambian.
- Aplican también RN-10, RN-11 y RN-13.

### Cómo se comprueba

- **Escenario 1: renombrar.** Cuando el usuario cambia el nombre de un hábito, entonces el nuevo nombre aparece en adelante y el historial sigue ahí.
- **Escenario 2: cambiar la repetición (A1).** Dado un hábito diario con diez ocurrencias pasadas, cuando el usuario lo pasa a «solo los miércoles», entonces las diez pasadas no cambian y las futuras solo caen en miércoles.
- **Escenario 3: eliminar (A2).** Cuando el usuario elimina un hábito y confirma, entonces deja de aparecer en el día y su historial pasado se sigue viendo en el historial.
- **Escenario 4: nombre vacío (E1).** Cuando el usuario guarda con el nombre vacío, entonces no se guarda y el elemento queda como estaba.

---

## CU-07 — Gestionar categorías

- **Actor principal:** el usuario
- **Actores secundarios:** ninguno
- **Funcionalidades:** *(se asignan en la sesión 3)*
- **Precondiciones:** ninguna
- **Postcondiciones:** la categoría queda creada, renombrada o eliminada, y lo que contiene se mantiene (RN-26)
- **Disparador:** el usuario quiere agrupar sus hábitos y tareas («Compra», «Universidad»)

### Flujo normal

1. El usuario indica que quiere crear una categoría.
2. El sistema pide el nombre.
3. El usuario escribe el nombre y confirma.
4. El sistema valida el nombre y guarda la categoría.
5. El sistema muestra la categoría en la lista de categorías, disponible para asignarla.

### Flujos alternativos

- **A1.** En el paso 1, si el usuario elige **renombrar** una categoría: el sistema pide el nuevo nombre, lo valida y lo guarda; todo lo que contiene pasa a mostrarlo. Termina el caso.
- **A2.** En el paso 1, si el usuario elige **eliminar** una categoría: el sistema avisa de cuántos hábitos y tareas se quedarán sin categoría y pide confirmación. Si el usuario confirma, elimina la categoría y esos elementos pasan a la Bandeja de entrada (RN-26). Si no confirma, no cambia nada. Termina el caso.

### Excepciones

- **E1.** En el paso 4, si el **nombre está vacío**: el sistema no guarda e indica que el nombre es obligatorio. Queda: sin cambios.
- **E2.** En el paso 4, si **ya existe** una categoría con ese nombre, sin distinguir mayúsculas (RN-24): el sistema no guarda e indica que ya existe. Queda: sin cambios.
- **E3.** En el paso 4, si el **guardado falla**: el sistema avisa y mantiene el estado anterior.
- **E4.** En el paso 1, si el usuario intenta renombrar o eliminar la **Bandeja de entrada**: el sistema no lo permite (RN-28). Queda: sin cambios.

### Reglas de negocio

- Aplican RN-24 a RN-26 y RN-28.

### Cómo se comprueba

- **Escenario 1: crear.** Cuando el usuario crea la categoría «Compra», entonces existe y se puede asignar a tareas y hábitos.
- **Escenario 2: nombre repetido (E2).** Dado que existe «Compra», cuando el usuario intenta crear «compra», entonces no se crea y se indica que ya existe.
- **Escenario 3: eliminar con contenido (A2).** Dado que «Compra» tiene tres tareas, cuando el usuario la elimina y confirma, entonces las tres tareas siguen existiendo, ahora en la Bandeja de entrada.
- **Escenario 4: renombrar (A1).** Cuando el usuario cambia «Compra» por «Supermercado», entonces sus tareas aparecen bajo «Supermercado».
- **Escenario 5: la Bandeja de entrada no se elimina (E4).** Cuando el usuario intenta eliminar la Bandeja de entrada, entonces no se permite y no cambia nada.
- **Escenario 6: secciones (DEC-31).** Dada la categoría «Lista de la compra», cuando el usuario crea en ella las secciones «Mercadona» y «Lidl» y pone «Leche» en «Mercadona», entonces al abrir «Lista de la compra» ve «Leche» bajo «Mercadona», y lo que no tiene sección, aparte.
- **Escenario 7: eliminar una sección (DEC-31).** Dada la sección «Mercadona», con dos tareas, dentro de «Lista de la compra», cuando el usuario la elimina y confirma, entonces las dos tareas siguen en «Lista de la compra», sin sección.
