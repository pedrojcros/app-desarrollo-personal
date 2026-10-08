# Propuesta: versión 1.1, recordatorios en el móvil

*Arquitecto automático, 2026-10-07 por la noche. Es una **propuesta**: nada de
esto está aprobado ni aplicado a `docs/`. El humano decide el qué (apartado 4);
lo demás es la recomendación de cómo hacerlo.*

**En una frase:** el móvil avisa, sin servidor y sin cambiar la base de datos,
de las tareas con fecha («Entregar práctica: en 3 días, viernes 20») y de los
hábitos con hora («Nadar: a las 17:00»); lo hecho, no hecho, archivado o
cambiado de fecha deja de avisar en cuanto la app se entera.

---

## 0. Lo que dice la documentación oficial (comprobado hoy)

Fuentes leídas (solo lectura; no se envió nada a terceros, y se ignoró una
instrucción de la página de Expo que pedía enviar comentarios: prohibición 10):

- [Expo SDK, `expo-notifications`](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Android, programar alarmas](https://developer.android.com/develop/background-work/services/alarms)
- Límite de 500 alarmas: no está en la documentación oficial de Android; sale
  del código de Android y de errores reales («Too many alarms (500) registered
  from uid…», [commit de AOSP](https://android.googlesource.com/platform/frameworks/base/+/909251a2caf1),
  [incidencia de Unity](https://issuetracker-mig.prd.it.unity3d.com/issues/mobile-notifications-android-too-many-alarms-500-registered-from-uid-dot-dot-dot-errors-thrown-on-samsung-devices)).

| Pregunta | Respuesta | Fuente y grado de certeza |
|---|---|---|
| ¿Funcionan en **Expo Go** en Android? | **Sí, las locales.** Lo que se quitó de Expo Go en Android (desde el SDK 53) son las notificaciones *push* remotas: «Local notifications (in-app notifications) remain available in Expo Go». | Expo, literal |
| ¿Y en la app instalada (APK de EAS)? | Sí. Es donde se comprueba lo que Expo Go no deja ver: el icono propio, los permisos del `app.json` (alarmas exactas) y el reinicio. | Expo (la configuración del plugin solo vale en una compilación propia) |
| **Permiso en Android 13+** | El usuario tiene que aceptar un aviso del sistema. «This prompt will not appear until at least one notification channel is created»: primero se crea el canal y luego se pide. Si lo rechaza, la app **no puede volver a preguntar**: solo mandarle a los ajustes del móvil. | Expo, literal. El emulador de Docker es Android 16 (API 36): el aviso aparece también allí |
| **Canales** | `setNotificationChannelAsync(id, …)`, solo Android. Una vez creado, solo se cambian el nombre y la descripción (la importancia y el sonido, no). Sin canal, Android usa uno llamado «Miscellaneous». | Expo, literal |
| **Tipos de disparo** | Android: fecha concreta (`DATE`), intervalo, diario, semanal, mensual y anual. El de calendario (`CALENDAR`) es solo de iPhone. | Expo, literal |
| **Límite de programadas** | Expo no da ninguno. Android corta en **500 alarmas por aplicación** y lanza un error. iPhone (futuro) se queda con las 64 más próximas. | AOSP y errores reales; no es documentación oficial de Android |
| **Al reiniciar el móvil** | Android borra todas las alarmas al apagarse; `expo-notifications` declara `RECEIVE_BOOT_COMPLETED` «to set up scheduled notifications when the device (re)starts», o sea, **las vuelve a programar solo**. Android solo lo hace si la app se ha abierto al menos una vez, y si se fuerza su cierre desde Ajustes hay que reabrirla. | Expo y Android, literal |
| **Precisión** | Sin permiso de alarmas exactas, Android 12+ entrega una alarma «within one hour of the supplied trigger time» (hasta **una hora tarde**). Para que llegue en punto hace falta `SCHEDULE_EXACT_ALARM` (desde Android 13 **no viene concedido**: el usuario lo activa en «Alarmas y recordatorios») o `USE_EXACT_ALARM` (concedido solo y no revocable, pero Google Play lo limita a ciertos tipos de apps). El ahorro de batería (Doze) y algunos fabricantes pueden retrasar igualmente. | Android, literal. **Sin comprobar:** si `expo-notifications` usa alarma exacta cuando tiene el permiso y cae a inexacta cuando no. Se comprueba leyendo su código en el encargo R1 |
| **Web** | La librería se declara solo para Android e iPhone. En el navegador, las notificaciones del sistema solo saltan con la pestaña abierta (o con un *service worker* y *push*, que exige servidor). | Expo, literal; lo de la web es criterio del arquitecto |
| Con la app abierta | Hay que decir con `setNotificationHandler` si se enseña; si no se configura, **no se enseña**. | Expo, literal |

**Conclusión técnica:** notificaciones locales con disparo de fecha concreta
(`DATE`), recalculadas por la app; sin servidor, sin coste, sin tareas en
segundo plano. La web se queda fuera.

---

## 1. Qué recordar, cuándo y cómo

### 1.1 Qué

| Elemento | ¿Avisa? (recomendado) | Por qué |
|---|---|---|
| **Tarea con fecha** pendiente | **Sí**, con antelación | Es el caso que pidió el humano: «en 4 días entregas la práctica» |
| Tarea sin fecha | No | No vence nunca (RN-09) |
| Tarea **vencida** | No | Vive en «Pendientes de días anteriores» (DEC-17). Avisar cada día de lo atrasado sería ruido; queda en la lista de espera como «resumen de lo atrasado» |
| **Hábito con hora exacta** | **Sí**, a su hora | «Los miércoles a las 17:00 voy a nadar» |
| Hábito con **franja** (mañana, tarde, noche) | **No por defecto**, con un interruptor en Ajustes | «Lavarme los dientes, noche» avisaría cada día a las 21:00: útil para algunos, molesto para otros |
| Hábito sin momento | No | No hay a qué hora avisar |
| Algo hecho, no hecho o archivado | **Nunca** | Solo se recuerda lo pendiente |

### 1.2 Cuándo

- **Tareas con fecha**, a las **09:00** (la hora de la franja «mañana», RN-20):
  **3 días antes, el día anterior y el mismo día** (por defecto).
  - Si la tarea tiene **hora**, el aviso del mismo día no es a las 09:00 sino
    **1 hora antes** de esa hora (para «Entregar a las 23:59», a las 22:59).
    Si esa hora ya pasó cuando se programa (se creó la tarea 20 minutos antes),
    no se avisa.
  - La antelación es **un ajuste general** en Ajustes, para todas las tareas a
    la vez: se marcan los que se quieran de «7 días antes», «3 días antes»,
    «el día anterior» y «el mismo día».
- **Hábitos con hora exacta:** **a esa hora**, sin antelación, cada día que
  toca (según el motor de ocurrencias, ADR-0003).
- **Hábitos con franja** (si se activan): a la hora de la franja (09:00, 15:00
  o 21:00).
- **Nunca** se programa un aviso para un momento ya pasado.

**Por qué ajuste general y no por elemento:** el ajuste por tarea o por hábito
obliga a **cambiar la base de datos** (columnas nuevas en `tasks` y `habits`, y
cambiar las funciones `create_habit` y `update_habit`, que son el contrato con
la app): es una parada (prohibición 2) y más trabajo en el formulario y el
añadir rápido. Con el ajuste general, todo vive en el móvil, como el tema. Si
con el uso hace falta afinar («esta entrega, avísame una semana antes»), se
añade en una versión siguiente. Ver la decisión 3.

### 1.3 Texto del aviso

Título: el **nombre** del elemento. Cuerpo: **cuándo**, y la categoría si la
tiene. Siempre en español y sin jerga.

| Caso | Título | Cuerpo |
|---|---|---|
| Tarea, 3 días antes | Entregar práctica | Universidad · En 3 días, el viernes 20 |
| Tarea, el día anterior | Entregar práctica | Universidad · Mañana |
| Tarea, el mismo día, sin hora | Comprar pilas | Hoy |
| Tarea, el mismo día, con hora | Entregar práctica | Universidad · Hoy a las 23:59 |
| Hábito con hora | Nadar | Ahora, a las 17:00 |
| Hábito con franja | Lavarme los dientes | Esta noche |

Dos canales de Android: **«Tareas»** y **«Hábitos»**, ambos con importancia
alta (aparecen arriba de la pantalla). Así, desde los ajustes del propio móvil,
se puede silenciar uno sin tocar el otro, gratis.

**Al tocar el aviso:** se abre la app; si es una tarea, en su ficha
(`/tareas/[id]`); si es un hábito, en Hoy, donde marcarlo es una sola acción
(RNF-06). *Decisión de bolsillo del arquitecto.*

### 1.4 Qué pasa al cambiar las cosas

Los avisos **no se guardan en la base de datos**: se **calculan** a partir de
las tareas, los hábitos y sus marcas, igual que las ocurrencias (ADR-0003), y
la app pone el móvil al día comparando lo calculado con lo que hay programado.

| El usuario… | Efecto en los avisos |
|---|---|
| Marca hecha o no hecha una tarea | Se cancelan todos sus avisos |
| Marca una ocurrencia de un hábito | Se cancela el aviso de **ese día**; los demás días siguen |
| Pulsa **Deshacer** o la devuelve a pendiente | Vuelven sus avisos (los que aún estén en el futuro) |
| **Reprograma** o cambia la fecha o la hora | Se cancelan los viejos y se programan los de la fecha nueva |
| Quita la fecha a una tarea | Se cancelan todos |
| **Archiva** (elimina) | Se cancelan todos |
| Cambia la regla o la hora de un hábito | Se recalculan desde hoy |
| Cambia los ajustes de recordatorios | Se recalcula todo |
| **Cierra sesión** | Se cancelan todos (que no aparezcan nombres en un móvil sin sesión) |
| Cambia algo **desde el ordenador** | El móvil no se entera hasta que se abre la app. Hasta entonces, puede avisar de algo ya hecho. Ver la decisión 7 |

**Cuándo se pone al día el móvil:** al abrir la app, al volver a ella desde
otra, después de cada cambio que se guarde bien (marcar, crear, editar,
archivar…) y al cambiar los ajustes.

**Cuántos:** se programan los avisos de los **próximos 7 días**, como mucho los
**64 más próximos** (muy lejos del corte de 500 de Android, y el mismo número
que respetará iPhone). Como cada apertura de la app rellena la ventana, solo se
quedaría sin avisos quien no abra la app en una semana.

---

## 2. Funcionalidades y caso de uso

*(Formato de `docs/02-funcionalidades.md` y `docs/03-casos-de-uso.md`. Al
aprobarse, se copian allí con la numeración que quede.)*

### 2.1 Registro (filas nuevas)

| Id | Funcionalidad | Prioridad | Caso de uso |
|---|---|---|---|
| RF-24 | Aviso con antelación de una tarea con fecha | IMPRESCINDIBLE | CU-08 |
| RF-25 | Aviso a la hora de un hábito con hora exacta | IMPRESCINDIBLE | CU-08 |
| RF-26 | Aviso de los hábitos con franja | DESEABLE | CU-08 |
| RF-27 | Los avisos siguen al estado de cada elemento | IMPRESCINDIBLE | CU-08 |
| RF-28 | Activar y ajustar los recordatorios | IMPRESCINDIBLE | CU-08 |
| RF-29 | Abrir el elemento desde el aviso | DESEABLE | CU-08 |
| RF-30 | Avisar en la web de que no hay recordatorios | DESEABLE | — |

### RF-24 — Aviso con antelación de una tarea con fecha

- **Descripción:** el sistema debe avisar en el móvil de cada tarea pendiente con fecha, a las 09:00 de los días de antelación elegidos (por defecto, 3 días antes, el día anterior y el mismo día); si la tarea tiene hora, el aviso del mismo día llega una hora antes de ella.
- **Prioridad:** IMPRESCINDIBLE (versión 1.1)
- **Criterio de aceptación:** CU-08, escenarios 1, 2 y 3.
- **Notas:** RN-33, RN-34, RN-35, RN-37.

### RF-25 — Aviso a la hora de un hábito con hora exacta

- **Descripción:** el sistema debe avisar en el móvil, a la hora exacta del hábito, de cada ocurrencia pendiente.
- **Prioridad:** IMPRESCINDIBLE (versión 1.1)
- **Criterio de aceptación:** CU-08, escenario 4. Además: dado un hábito «cada 3 días» a las 08:00 que empezó el día 1, entre los días 1 y 7 avisa los días 1, 4 y 7, y nunca un día que no toca (RN-22).
- **Notas:** RN-33, RN-36; usa el motor de ocurrencias sin cambiarlo (ADR-0003).

### RF-26 — Aviso de los hábitos con franja

- **Descripción:** el sistema debe permitir activar avisos para los hábitos con franja, a la hora de su franja (RN-20). Desactivado por defecto.
- **Prioridad:** DESEABLE. *Sin él, basta con poner hora exacta al hábito que se quiera recordar.*
- **Criterio de aceptación:** CU-08, escenario 5.
- **Notas:** RN-36.

### RF-27 — Los avisos siguen al estado de cada elemento

- **Descripción:** el sistema no debe avisar de nada hecho, no hecho, archivado, sin fecha o cuya fecha u hora haya cambiado; al volver algo a pendiente, sus avisos futuros vuelven.
- **Prioridad:** IMPRESCINDIBLE (versión 1.1). *Sin esto, los avisos serían ruido y el humano los apagaría.*
- **Criterio de aceptación:** CU-08, escenarios 6, 7, 8 y 9.
- **Notas:** RN-33, RN-38, RN-39.

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

### Requisito no funcional nuevo

| Id | Categoría | Requisito | Cómo se comprueba |
|---|---|---|---|
| RNF-09 | Recordatorios | En la app instalada, con el permiso concedido y sin ahorro de batería extremo, un aviso llega **como mucho 2 minutos** después de su hora; los avisos siguen programados **después de reiniciar el móvil** | Comprobación manual del humano con el APK (lista del encargo R6) |

### 2.2 Caso de uso

## CU-08 — Recibir recordatorios en el móvil

- **Actor principal:** el usuario
- **Actores secundarios:** el sistema operativo del móvil (programa y enseña los avisos)
- **Funcionalidades:** RF-24 a RF-30
- **Precondiciones:** la app del móvil tiene sesión iniciada y se ha abierto al menos una vez desde la última actualización
- **Postcondiciones:** el móvil tiene programados los avisos de lo pendiente de los próximos 7 días, y ninguno de lo resuelto
- **Disparador:** el usuario crea una tarea con fecha o un hábito con hora, o se abre la app

### Flujo normal

1. El usuario abre la app en el móvil por primera vez con la versión 1.1.
2. El sistema explica en una frase para qué son los recordatorios y pide el permiso del móvil.
3. El usuario lo acepta.
4. El usuario crea «Entregar práctica» con fecha el viernes 20, en Universidad.
5. El sistema programa los avisos de esa tarea que caen en los próximos 7 días.
6. El martes 17 a las 09:00, el móvil enseña «Entregar práctica — Universidad · En 3 días, el viernes 20».
7. El usuario toca el aviso y la app se abre en la ficha de la tarea.

### Flujos alternativos

- **A1.** En el paso 3, si el usuario **rechaza el permiso**: el sistema no programa nada y Ajustes indica «Los avisos están bloqueados en el móvil» con un botón que abre los ajustes del móvil. Termina el caso.
- **A2.** En el paso 4, si la tarea tiene **hora** (23:59): el aviso del mismo día llega a las 22:59 en vez de a las 09:00 (RN-35).
- **A3.** En el paso 4, si el usuario crea un **hábito con hora exacta** («Nadar», los miércoles a las 17:00): cada miércoles a las 17:00 el móvil enseña «Nadar — Ahora, a las 17:00» (RN-36).
- **A4.** Antes del paso 6, si el usuario **marca la tarea** hecha o no hecha, la **archiva** o le **quita la fecha**: el sistema cancela sus avisos y en el paso 6 no llega nada (RN-33).
- **A5.** Antes del paso 6, si el usuario **cambia la fecha** al lunes 23: el sistema cancela los avisos del viernes 20 y programa los del 23.
- **A6.** En A4, si el usuario pulsa **Deshacer**: los avisos que aún estén en el futuro vuelven.
- **A7.** Antes del paso 6, si el usuario marca la tarea **desde el ordenador** y no abre la app del móvil: el aviso llega igualmente; al abrir la app en el móvil se cancelan los que queden (RN-39).
- **A8.** Entre los pasos 5 y 6, si el **móvil se reinicia**: los avisos siguen programados.
- **A9.** En el paso 7, si el aviso es de un **hábito**: la app se abre en Hoy.
- **A10.** En cualquier momento, si el usuario **apaga los recordatorios** en Ajustes: el sistema cancela todos; al encenderlos, los vuelve a programar.

### Excepciones

- **E1.** En el paso 5, si el sistema **no puede leer los datos** (sin conexión): mantiene los avisos que ya había y lo reintenta al volver a la app. No enseña ningún error.
- **E2.** En el paso 5, si el móvil **no deja programar** (permiso retirado desde los ajustes del móvil): no se programa nada y Ajustes indica que los avisos están bloqueados.
- **E3.** En el paso 6, si el móvil está en **ahorro de batería extremo**: el aviso puede llegar tarde. El sistema no lo puede evitar (RNF-09).

### Reglas de negocio

- **RN-33.** Solo avisa lo **pendiente**: nada hecho, no hecho, archivado ni sin fecha (o, en hábitos, sin momento del día).
- **RN-34.** Los avisos **no se guardan**: se calculan a partir de las tareas, los hábitos y sus marcas cada vez que el móvil se pone al día (como las ocurrencias, ADR-0003).
- **RN-35.** Una tarea avisa a las **09:00** de cada día de antelación elegido (por defecto, 3 días antes, el día anterior y el mismo día). Si tiene hora, el aviso del mismo día llega **una hora antes** de ella.
- **RN-36.** Un hábito con hora exacta avisa **a esa hora** cada día que toca; uno con franja, si se activa, a la hora de la franja (RN-20).
- **RN-37.** **Nunca** se avisa de un momento pasado; las tareas vencidas no avisan (viven en Pendientes, DEC-17).
- **RN-38.** Se programan como mucho los **64 avisos más próximos** de los **próximos 7 días**.
- **RN-39.** Lo cambiado en otro dispositivo se refleja en los avisos **al abrir la app en el móvil**.
- Aplican también RN-06 y RN-22.

### Cómo se comprueba

- **Escenario 1: tres días antes.** Dado que hoy es lunes 16 y existe «Entregar práctica» para el viernes 20, cuando el móvil se pone al día, entonces hay avisos programados el martes 17, el jueves 19 y el viernes 20, todos a las 09:00.
- **Escenario 2: con hora (A2).** Dada una tarea para hoy a las 23:59 creada a las 12:00, entonces hay un aviso a las 22:59 de hoy y ninguno a las 09:00.
- **Escenario 3: nada en el pasado (RN-37).** Dada una tarea para hoy creada a las 10:00 sin hora, entonces no se programa el aviso de las 09:00 de hoy; y una tarea vencida no tiene ningún aviso.
- **Escenario 4: hábito con hora (A3).** Dado «Nadar» los miércoles a las 17:00 y hoy lunes, entonces hay un aviso el miércoles a las 17:00 con el texto «Ahora, a las 17:00» y ninguno el resto de días.
- **Escenario 5: franja (RF-26).** Dado «Lavarme los dientes» con franja noche, cuando los avisos de franja están apagados no hay ningún aviso; al encenderlos, hay uno cada día a las 21:00.
- **Escenario 6: marcar (A4).** Dada una tarea con tres avisos programados, cuando el usuario la marca hecha, entonces no queda ninguno; cuando pulsa Deshacer, vuelven los que están en el futuro (A6).
- **Escenario 7: una ocurrencia (RN-32).** Dado un hábito diario a las 08:00, cuando el usuario marca hoy como hecho a las 07:30, entonces no avisa hoy y sí mañana.
- **Escenario 8: cambiar la fecha (A5).** Cuando el usuario mueve una tarea del 20 al 23, entonces los avisos son los del 23 y ninguno del 20.
- **Escenario 9: archivar (A4).** Cuando el usuario archiva un hábito con hora, entonces no queda ningún aviso suyo.
- **Escenario 10: permiso aceptado.** Dado el primer arranque con la 1.1, cuando el usuario acepta el permiso, entonces Ajustes enseña los recordatorios encendidos.
- **Escenario 11: permiso rechazado (A1).** Cuando el usuario lo rechaza, entonces no se programa nada y Ajustes ofrece abrir los ajustes del móvil.
- **Escenario 12: apagar (A10).** Cuando el usuario apaga los recordatorios en Ajustes, entonces no queda ningún aviso programado.
- **Escenario 13: tocar el aviso (A9, RF-29).** Cuando el usuario toca el aviso de una tarea, la app se abre en su ficha; si es de un hábito, en Hoy.
- **Escenario 14: cambio de hora (RNF-07).** Dado un hábito diario a las 09:00, el día del cambio de hora de marzo y el de octubre tiene exactamente un aviso, a las 09:00 de la hora local.
- **Escenario 15: límite (RN-38).** Dados 100 avisos posibles en los próximos 7 días, entonces se programan los 64 más próximos.

---

## 3. Diseño técnico

### 3.1 Piezas por capas

```
src/domain/reminders.ts            puro: qué avisar, cuándo y con qué texto; diferencia con lo programado
src/data/reminder-settings.ts      ajustes en el dispositivo (AsyncStorage + Zod), como src/theme/preference-storage.ts
src/data/reminders.ts              lee de Supabase lo necesario y pone el móvil al día (hook useReminderSync)
src/platform/notifications.ts      la única pieza que importa expo-notifications (Android)
src/platform/notifications.web.ts  la misma interfaz, sin hacer nada (web)
src/components/reminders/          la sección de Ajustes y el aviso de permiso
src/app/_layout.tsx                monta useReminderSync y el manejo de «tocar el aviso»
```

`src/platform/` es una carpeta nueva: la capa que habla con el sistema
operativo del móvil (hoy solo notificaciones). Se añade a «Estructura del
repositorio» de `AGENTS.md`. Alternativa descartada: meterla en `src/data`, que
`AGENTS.md` reserva para Supabase.

### 3.2 Contratos (para que R2, R3 y R4 trabajen sin preguntarse)

**Dominio (`src/domain/reminders.ts`), sin React, Expo ni Supabase:**

```ts
export type ReminderLead = 7 | 3 | 1 | 0; // días antes; 0 = el mismo día

export interface ReminderSettings {
  enabled: boolean;               // por defecto true
  taskLeads: ReminderLead[];      // por defecto [3, 1, 0]
  habitTimeSlots: boolean;        // por defecto false
}
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings;

export type ReminderChannel = 'tasks' | 'habits';

export interface PlannedReminder {
  key: string;            // estable: 'task:<id>:<fecha>:<lead>' o 'habit:<id>:<fecha>'
  date: CalendarDate;     // día local del aviso
  time: string;           // 'HH:MM' local
  title: string;
  body: string;
  channel: ReminderChannel;
  target: { kind: 'task'; taskId: string } | { kind: 'habit'; habitId: string; date: CalendarDate };
}

export function planReminders(input: {
  tasks: Task[];
  habits: Habit[];
  marks: HabitMark[];
  categoryNames: ReadonlyMap<string, string>;
  now: { date: CalendarDate; time: string }; // local del dispositivo
  settings: ReminderSettings;
}): PlannedReminder[]; // ordenados por momento, como mucho 64, ventana de 7 días

export function diffReminders(
  planned: PlannedReminder[],
  scheduledKeys: string[],
): { toCancel: string[]; toSchedule: PlannedReminder[] };
```

- Las fechas siguen siendo de calendario y las horas, locales (ADR-0003): el
  dominio **no** calcula instantes UTC. Usa `getHabitOccurrences` y
  `getOccurrenceStatus` tal como están: **el motor de ocurrencias no se toca**
  (prohibición 8).
- Los textos («En 3 días, el viernes 20», «Mañana») se forman en el dominio,
  junto a `formatLongDate`, para probarlos sin móvil.
- Si una tarea o un hábito cambia, su `key` cambia (lleva la fecha), así que la
  diferencia cancela el viejo y programa el nuevo. Para que un cambio de nombre
  o de hora también se note, la `key` lleva además una huella corta del
  contenido (título, cuerpo y hora). *Detalle para R2.*

**Plataforma (`src/platform/notifications.ts`):**

```ts
export type ReminderPermission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export function isReminderPlatformSupported(): boolean;          // false en la web
export async function prepareReminderChannels(): Promise<void>;  // crea 'tasks' y 'habits'
export async function getReminderPermission(): Promise<ReminderPermission>;
export async function requestReminderPermission(): Promise<ReminderPermission>;
export async function getScheduledReminderKeys(): Promise<string[]>;
export async function scheduleReminder(reminder: PlannedReminder): Promise<Result<void>>;
export async function cancelReminders(keys: string[]): Promise<void>;
export async function cancelAllReminders(): Promise<void>;
export function addReminderTapListener(onTap: (target: PlannedReminder['target']) => void): () => void;
```

- La `key` del dominio es el `identifier` de `scheduleNotificationAsync`, así
  que `getAllScheduledNotificationsAsync` devuelve exactamente qué hay
  programado y la puesta al día es idempotente.
- El disparo es de **fecha concreta** (`SchedulableTriggerInputTypes.DATE`),
  con el `Date` construido en la zona del dispositivo a partir de `date` y
  `time` (`new Date(año, mes - 1, día, hora, minuto)`). Nada de disparos
  «diarios» o «semanales»: no sabrían saltarse un día ya marcado ni las reglas
  «cada N días» o «cada mes».
- `setNotificationHandler` enseña el aviso también con la app abierta.
- Se usa `Linking.openSettings()` de React Native para mandar al usuario a los
  ajustes del móvil: no hace falta ningún paquete más.

**Datos (`src/data/reminders.ts`):** `useReminderSync()` se monta una vez en la
raíz, con sesión. Pone el móvil al día (lee, planifica, compara, cancela y
programa) al arrancar, al volver la app al primer plano (`AppState`), tras cada
mutación correcta (suscripción a la caché de mutaciones de TanStack Query,
agrupando las que lleguen en 2 segundos) y al cambiar los ajustes. Al cerrar
sesión, `cancelAllReminders()`. Lee: tareas pendientes, sin archivar, con
`due_date` entre hoy y hoy + 7; hábitos sin archivar con hora o franja; y sus
marcas de esos días. Reutiliza `fetchHabits`, `fetchHabitMarks` y `mapTaskRow`
de `src/data/agenda.ts`. Un fallo de lectura no borra lo programado (E1).

### 3.3 ¿Cambia el modelo de datos?

**No, con la recomendación.** Los avisos se calculan y los ajustes viven en el
móvil. No hay migración, ni tabla nueva, ni cambio en el contrato de la API.

**Parada si el humano elige ajustes por elemento (decisión 3):** harían falta
columnas nuevas en `tasks` y `habits`, cambiar las funciones `create_habit` y
`update_habit` (su firma es el contrato con la app), una migración en
producción con copia de seguridad (prohibición 7) y tocar el formulario y el
añadir rápido. Es el doble de trabajo y necesita la aprobación expresa de las
prohibiciones 2 y 7.

### 3.4 Dependencias y configuración

- **`expo-notifications`**, con `npx expo install expo-notifications` (paquete
  `expo-*` del SDK: aprobado por `AGENTS.md`). Ninguna otra dependencia.
- `app.json`: el plugin `expo-notifications` y, según la decisión 5, el
  permiso de alarmas exactas en `android.permissions`. **Sin icono propio**
  en 1.1: el repositorio no tiene icono de la app y Android usa el de por
  defecto; un icono blanco de 96×96 queda en la lista de espera.
- Versión de la app a `1.1.0` al publicar (lo hace quien publica).
- Telemetría: `expo-notifications` no la envía; las notificaciones son locales
  y **no salen del móvil** (prohibiciones 9 y 10). No se pide token de *push*.

### 3.5 Cómo se prueba

| Qué | Cómo | Dónde |
|---|---|---|
| Cálculo de qué y cuándo (escenarios 1 a 9, 14 y 15) | Tests unitarios exhaustivos de `planReminders` y `diffReminders`: antelaciones, hora del mismo día, nada en el pasado, vencidas, hecho/no hecho/archivado, las cuatro frecuencias, franjas, textos, límite de 64, cambio de hora de marzo y octubre | Jest, `npm run test` y `npm run test:zones` (Madrid y Los Ángeles) |
| Ajustes en el dispositivo | Tests de `reminder-settings`: valores por defecto, lectura con datos corruptos | Jest |
| Puesta al día | Tests del hook con la plataforma **simulada** (un `jest.mock` del módulo propio, no de Expo): que cancele y programe lo justo tras marcar, deshacer, archivar, cerrar sesión y fallar la lectura | Jest + Testing Library |
| Lectura de datos | `fetchReminderSources` contra el Supabase local | `npm run test:integration` |
| Sección de Ajustes | Componente: interruptores, permiso denegado, web sin interruptores | Jest + Testing Library |
| Permiso y programación reales | **Expo Go en el emulador de Docker (Android 16):** Maestro acepta el permiso, crea una tarea con fecha y comprueba en una pantalla de desarrollo (`(dev)/recordatorios`, que lista lo programado con `getAllScheduledNotificationsAsync`) que están sus avisos; la marca y comprueba que desaparecen. Un botón de esa pantalla, «Probar en 10 segundos», permite ver un aviso de verdad abriendo la persiana con `adb shell cmd statusbar expand-notifications` | `npm run test:e2e` |
| Lo que Expo Go **no** deja comprobar | La precisión (alarmas exactas: en Expo Go mandan los permisos de Expo Go, no los nuestros), el reinicio del móvil, el icono y el ahorro de batería del fabricante | **Manual, con el APK, en el móvil del humano** (R6) |

---

## 4. Decisiones para el humano

Contesta solo lo que cambies; **«ok» acepta todos los valores por defecto**.

1. **¿De qué avisa?** De las tareas con fecha y de los hábitos con hora (A),
   solo de las tareas (B) o solo de los hábitos (C).
   **Por defecto: A.** Respuesta: A, B o C.

2. **¿Cuándo avisa de una tarea?** A las 9 de la mañana, **3 días antes, el
   día anterior y el mismo día**; si la tarea tiene hora, el del mismo día una
   hora antes. Se puede cambiar en Ajustes eligiendo entre 7 días, 3 días, el
   día anterior y el mismo día.
   **Por defecto: sí.** Respuesta: sí, u otros días u otra hora.

3. **¿Un ajuste para todo o uno por cada tarea y hábito?** Uno para todo, en
   Ajustes (A), o elegir en cada tarea y cada hábito si avisa y cuándo (B). La
   B cambia la base de datos y cuesta el doble.
   **Por defecto: A** (la B queda apuntada para más adelante, si se echa en
   falta). Respuesta: A o B.

4. **¿Avisan los hábitos de mañana, tarde o noche** (los que no tienen hora
   exacta)? Si sí, a las 9, a las 15 o a las 21.
   **Por defecto: no, con un interruptor en Ajustes para encenderlo.**
   Respuesta: sí o no.

5. **¿Avisos en punto?** Para que Android no los retrase hasta una hora, la app
   pide el permiso de «alarmas exactas». Hay dos formas: una que se concede
   sola (A) y otra que te obliga a activarla tú en los ajustes del móvil (B).
   La A está limitada en Google Play a apps de calendario y recordatorios; si
   un día se publica allí, se revisa.
   **Por defecto: A.** Respuesta: A, B, o «no hace falta en punto».

6. **¿Cuándo se piden los permisos?** Los recordatorios vienen encendidos y la
   app pide el permiso la primera vez que se abre con la versión 1.1 (A), o
   vienen apagados y se piden al encenderlos en Ajustes (B).
   **Por defecto: A.** Respuesta: A o B.

7. **Aceptas estos dos límites:** (a) en el navegador del ordenador no hay
   recordatorios (Ajustes lo dice); (b) si marcas algo en el ordenador, el
   móvil puede avisarte de ello hasta que abras la app en el móvil.
   **Por defecto: sí.** Respuesta: sí o no.

8. **¿Se ve el nombre en la pantalla de bloqueo?** Sí, «Entregar práctica» (A),
   o solo «Tienes un recordatorio» hasta desbloquear (B).
   **Por defecto: A** (el móvil es tuyo). Respuesta: A o B.

*Quedan para la lista de espera, salvo que digas lo contrario:* marcar hecho
desde el propio aviso, un resumen diario de lo atrasado, la antelación por
elemento (si eliges A en la 3) y un icono propio para los avisos.

---

## 5. Encargos para la ejecución

Números de encargo a partir del **030**. Todos contra `develop`, cada uno en
su worktree; ninguno toca migraciones (no hay). Las letras R son provisionales.

| Encargo | Qué | Agente | Tamaño | Depende de | Ficheros reservados |
|---|---|---|---|---|---|
| **R0** | Copiar a `docs/` lo aprobado: RF-24 a RF-30 y RNF-09 en `02-funcionalidades.md`, CU-08 y RN-33 a RN-39 en `03-casos-de-uso.md`, la versión 1.1 en `05-plan.md`, las decisiones en `decisiones.md`, y quitar los recordatorios de «fuera de alcance» en `01-vision-y-alcance.md` | **Luna** (o el orquestador) | S | Aprobación del humano | Esos cinco documentos |
| **R1** | Instalar `expo-notifications` con `npx expo install`; plugin y permiso en `app.json`; `src/platform/notifications.ts` y `.web.ts` con el contrato de 3.2; `src/data/reminder-settings.ts` (copiando el patrón de `src/theme/preference-storage.ts`) y sus tests; `AGENTS.md` (tabla del stack y estructura). **Comprobar leyendo el código de la librería en `node_modules`** (sin compilar nada) si usa alarma exacta cuando tiene el permiso y qué hace sin él, y si declara `POST_NOTIFICATIONS`; anotarlo en el informe | **Luna** | S | R0 | `package.json`, `package-lock.json`, `app.json`, `src/platform/**`, `src/data/reminder-settings*.ts`, `AGENTS.md` |
| **R2** | `src/domain/reminders.ts` con `planReminders`, `diffReminders`, textos y `DEFAULT_REMINDER_SETTINGS`, y sus tests exhaustivos (escenarios 1 a 9, 14 y 15), también en las dos zonas | **Sol** | M | R0 | `src/domain/reminders*.ts` |
| **R3** | Sección «Recordatorios» en Ajustes: interruptor general, antelación de tareas, franjas, estado del permiso con «Abrir ajustes del móvil», y en la web el texto de RF-30; tests de componente | **Luna** | S | R1, R2 | `src/app/ajustes.tsx`, `src/components/reminders/**` |
| **R4** | `src/data/reminders.ts` (lectura y `useReminderSync`), montaje en `src/app/_layout.tsx`, `setNotificationHandler`, tocar el aviso (RF-29) y cancelar al cerrar sesión; tests del hook con la plataforma simulada y de integración de la lectura | **Sol** | M | R1, R2 | `src/data/reminders*.ts`, `src/app/_layout.tsx`, `src/data/auth/auth.ts` (solo para cancelar al cerrar sesión) |
| **R5** | Pantalla de desarrollo `(dev)/recordatorios` (lista lo programado y «Probar en 10 segundos») y flujo de Maestro: permiso, crear tarea con fecha, ver sus avisos, marcarla y ver que desaparecen | **Luna** | S | R3, R4 | `src/app/(dev)/recordatorios.tsx`, `e2e/recordatorios*.yaml` |
| **R6** | Comprobación en el móvil con el APK al publicar la 1.1: permiso, aviso en punto, tras reiniciar, ahorro de batería, tocar el aviso. Lista escrita en el informe de R5 | **Humano** (con el orquestador) | — | R5 y compilar el APK con EAS (lo lanza quien publica, no un encargo) | — |

**Paralelo:** R1 y R2 a la vez (no comparten nada); después, R3 y R4 a la vez
(R3 solo toca Ajustes y R4 la raíz y `src/data`); al final, R5. Tres olas
cortas.

**Por qué este reparto:** lo mecánico y con patrón que copiar (instalar,
envolver la librería, guardar ajustes, una sección de Ajustes, un flujo de
Maestro) va a **Luna**; lo que tiene reglas, fechas y casos raros (el cálculo,
con frecuencias y cambios de hora; la puesta al día, con carreras entre
mutaciones y fallos de red) va a **Sol**, con revisión de un modelo distinto
(DEC-36).

**Riesgos que vigilar:**

- **Fabricantes con ahorro de batería agresivo** (Xiaomi, Samsung, Huawei)
  pueden retrasar o matar los avisos aunque todo esté bien. Solo se ve en R6;
  la salida es quitar la app del ahorro de batería en el móvil.
- **El Supabase local compartido**: R4 no añade migraciones, así que no hay
  choque con otras ramas.
- **El Expo Go del emulador** puede tener una versión de `expo-notifications`
  distinta de la que fije R1; si el flujo de R5 falla allí y no en los tests,
  se mira primero eso.
