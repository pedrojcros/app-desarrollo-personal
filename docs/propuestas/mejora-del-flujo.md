# Propuesta: mejorar el flujo de trabajo antes de la siguiente versión

> **Aprobada el 2026-10-09 con los valores por defecto (DEC-45) y aplicada el mismo día** (encargos A a D: PR #70, #71, #72 y la documentación de la sesión). Queda el E, el diseño del orquestador por eventos, con el arquitecto.

*Claude (Opus 5.5), sin papel de orquestador, 2026-10-09 por la tarde, a
petición del humano. Es una **propuesta**: nada de esto está aprobado ni
aplicado. El humano decide en el apartado 5; lo demás es la recomendación.*

**En una frase:** en la versión 1 lo que más tiempo y tokens costó no fue
programar, sino **el propio orquestador** (sesiones de días que releen cientos
de miles de tokens en cada paso), **el entorno de pruebas del móvil** y **las
esperas**; se propone medirlo todo de forma automática, revisarlo al cerrar
cada versión y atacar esas tres causas.

---

## 0. De dónde salen los datos

- La [bitácora](../bitacora.md), las «trampas» de [contexto](../contexto.md) y
  los 68 PR fusionados (`gh pr list`).
- Los registros que **Codex y Claude Code ya guardan en este ordenador**
  (`~/.codex/sessions` y `~/.claude/projects`): cuántos tokens gastó cada
  sesión. Solo se sumaron cifras; no se leyó el contenido de las
  conversaciones ni se envió nada a nadie.

**Cómo leer los tokens.** Cada vez que un agente da un paso, el modelo vuelve a
leer toda la conversación hasta ese momento. Lo que ya había leído sale de una
caché y cuesta mucho menos que lo nuevo (en la API de Anthropic, una décima
parte), pero no es gratis y cuenta para la cuota. «Nuevo» es lo que entra por
primera vez; «caché», lo releído. Las cuotas de Claude y de Codex son
distintas.

---

## 1. Qué pasó en la versión 1

### 1.1 El calendario

| Etapa | Cuándo | Duración aproximada |
|---|---|---|
| Planificación (arquitecto: visión, casos de uso, stack, plan, cambio a Expo, prueba de agentes, 4 rondas de estilo) | 5 oct. 16:40 → 6 oct. 22:00 | 1 día y medio |
| Ejecución (16 tareas, la 1.x, recordatorios R1 a R5, arreglos) | 6 oct. 22:00 → 9 oct. 17:30 | 2 días y medio de calendario |
| Publicación | 9 oct. 18:50 | — |

De los 2 días y medio de ejecución se perdieron, como poco: **7 h y media**
con el portátil suspendido (noche del 7 al 8), **3 h y media** sin cuota de
Codex (7 oct.), la tarde y la noche del 8 con el portátil apagado, y tiempos
sueltos de trabajadores parados sin que nadie los viera.

### 1.2 Los tokens

| Quién | Pasos | Nuevos | Releídos de caché | Escritos |
|---|---|---|---|---|
| Arquitecto (planificación, 5 y 6 oct.) | 1.512 | 8,8 M | 670 M | 3,2 M |
| **Orquestador** (dos sesiones, 6 al 9 oct.) | **2.330** | **14,5 M** | **1.104 M** | 2,2 M |
| 27 trabajadores de Claude (Sonnet, y Opus en revisiones) | — | 7,1 M | 196 M | 2,0 M |
| 49 sesiones de Codex (Sol y Luna) | — | 8,3 M | 389 M | 1,2 M |

### 1.3 Lo que dicen estos números

1. **El mayor gasto de Claude es el orquestador, no los trabajadores.**
   - Gastó el doble de tokens nuevos que los 27 trabajadores de Claude juntos y
     releyó **5,6 veces más**, y además es Opus, más caro que Sonnet.
   - Cada paso suyo relee de media **400.000 a 550.000 tokens**, porque las
     sesiones duran días.
   - DEC-39 ya pedía «una sesión nueva al cerrar cada ola», pero **no se
     cumplió**: la última sesión duró dos días y medio.
   - Por cada PR de código fusionado, el orquestador gastó más o menos lo mismo
     en tokens nuevos que el trabajador que lo escribió, y el doble en
     releídos.
2. **El entorno de pruebas del móvil es lo más caro en tiempo y en Codex.**
   - Solo los caminos críticos de Maestro (T13b) necesitaron 4 sesiones de
     Codex: 1,6 M nuevos y 104 M releídos, **una cuarta parte de todo Codex**.
   - Su PR estuvo abierto 27 h, y el de R5 26 h, casi todo por el emulador:
     `.lock` tras un apagado, ADB que perdía el dispositivo, un `jest` colgado
     reteniendo el candado.
3. **Relanzar cuesta.**
   - Por los reinicios de Orca y los cortes de cuota, T05 (`ADP-8`) y T09
     (`ADP-12`) se lanzaron 5 veces cada una.
   - Varias de esas sesiones solo releyeron, sin producir nada: entre 60.000 y
     85.000 tokens nuevos cada una para escribir apenas mil tokens.
4. **Abrir un trabajador tiene un precio fijo.**
   - Un trabajador que solo arranca y lee las reglas, el contexto y su encargo
     gasta **entre 20.000 y 60.000 tokens nuevos**.
   - Una tarea mediana gasta entre 100.000 y 450.000.
   - A eso se suma lo que le cuesta al orquestador: escribir el encargo,
     lanzarlo, vigilarlo, revisarlo y fusionarlo, decenas de pasos de
     400.000 tokens releídos cada uno.
5. **Revisar no fue el cuello de botella.** La mayoría de los PR de código se
   fusionó menos de 20 minutos después de abrirse.
6. **Los problemas se repiten.**
   - `contexto.md` acumula unas **30 trampas**: cada una costó tiempo al menos
     una vez.
   - Todas se cargan en cada sesión de Claude, también en la de cada trabajador.
7. **La gestión pesa:**
   - 19 de los 65 PR de la ejecución fueron solo de documentación del
     orquestador.
   - Algunas puertas del humano pararon trabajo mientras no estaba (T02, el PR
     #8 bloqueado).

**Conclusión:** para ir más rápido y gastar menos no hacen falta más agentes;
hay que **aligerar al orquestador, estabilizar el entorno de pruebas y no
esperar**. Además, hoy nada de esto se mide solo: estos datos se han sacado a
mano. De ahí la primera propuesta.

---

## 2. Propuestas

### P1. Registro de incidencias y retrospectiva (el bucle de retroalimentación)

- **Un registro de incidencias:** un fichero `registro/incidencias.jsonl`, con
  una línea por problema:
  - fecha;
  - tipo: entorno, cuota, agente parado, test frágil, fallo de la app,
    esperando al humano o herramienta;
  - tarea;
  - minutos perdidos;
  - causa y arreglo.
- **Quién escribe en él:**
  - el **supervisor**, solo y sin gastar tokens, con lo que ya detecta: encargo
    sin enviar, permiso, cuota, modelo saturado, trabajador parado;
  - el **orquestador**, con una orden corta (`scripts/registro/anotar.py`),
    para lo demás.
- **Informe:** `scripts/registro/informe.py` resume una versión: minutos
  perdidos por tipo, problemas repetidos y tareas más caras.
- **Retrospectiva al cerrar cada versión,** de unos 10 minutos con el humano:
  - las **3 causas que más costaron** se convierten en encargos de mejora;
  - queda escrita en `docs/retrospectivas/vN.md`.
- **Las trampas salen de `contexto.md`** a `docs/agentes/trampas.md`, que se lee
  solo cuando hace falta. En `contexto.md` quedan las 5 que más se repiten. Así
  ese fichero, que se carga en cada sesión, adelgaza.

### P2. Medir cada encargo de forma automática

- **Un script, `scripts/registro/medir.py`, cruza tres fuentes:**
  - las sesiones de Codex y Claude que ya están en el ordenador, por la carpeta
    del worktree, que lleva la clave `ADP-NN`;
  - los PR de GitHub;
  - el registro de incidencias.
- **Por cada encargo saca:** agente y modelo, tokens nuevos y releídos,
  sesiones (cuántas veces se relanzó), tiempo hasta el PR, tiempo hasta la
  fusión y correcciones.
- **Lo mismo para el orquestador**, por sesión.
- **Al fusionar**, el orquestador pega el resumen en la tarjeta de Jira, que ya
  lleva quién, modelo y esfuerzo.
- **Privacidad:** solo biblioteca estándar y datos locales; nada sale a
  terceros.

Con esto, en la siguiente versión las preguntas como «¿compensa dividir?» se
contestan con números (P4).

### P3. Un orquestador más ligero (el mayor ahorro)

**Fase 1, desde la siguiente versión (barata):**

1. **Sesiones cortas de verdad.**
   - Al cerrar cada ola, el orquestador guarda el estado en `contexto.md`.
   - Si el humano está, le pide abrir una sesión nueva.
   - Si no está, lo deja anotado y **no lanza una ola nueva en la misma sesión
     pasadas unas 6 horas**: espera a que el humano abra otra.
   - Objetivo: que cada paso relea menos de 150.000 tokens en lugar de 450.000.
2. **Despertar menos.**
   - El supervisor y los scripts de espera ya bloquean sin gastar tokens.
   - El orquestador solo se despierta por algo que necesita decisión: PR listo,
     pregunta, fallo. Nunca para «ver cómo va».
3. **Revisiones fuera del orquestador.**
   - La revisión de cada PR, que es la parte más larga (diff, tests, lista de
     revisión), la hace un **revisor aparte**: un trabajador de Codex Luna o un
     subagente de Sonnet, con la lista de revisión.
   - El orquestador solo lee el veredicto y los hallazgos.
   - Lo delicado (seguridad, SQL, lógica central) lo sigue revisando otro modelo
     más fuerte, como dice ya `orquestador.md`.
4. **El orquestador no lee ficheros grandes enteros.** Diffs con `--stat` y
   luego solo lo que importa.

**Fase 2, como experimento en una ola: orquestador por eventos.**

- Hoy el orquestador es una conversación larga que espera.
- La alternativa: un **script vigila** (PR abiertos, CI, trabajadores) y, cuando
  hace falta decidir, **abre una sesión corta de Claude** (`claude -p`) con
  solo lo necesario: el encargo, el informe y el diff. Esa sesión decide,
  escribe y se cierra.
- Lo mecánico (mover Jira, fusionar si todo está en verde y revisado, relanzar)
  lo hace el script sin modelo.
- Es un cambio de arquitectura del sistema de agentes: **se diseña antes en su
  propia propuesta** y se prueba en una ola, comparando con P2.

### P4. Cuándo dividir una tarea (respuesta a «¿es rentable?»)

Dividir **cuesta** el arranque de cada trabajador nuevo (20.000 a 60.000
tokens nuevos) y, sobre todo, otra ronda de trabajo del orquestador. **Ahorra
tiempo** solo si las partes van a la vez. Regla provisional:

- **Se divide** si se cumplen las tres:
  - las partes tocan **ficheros distintos**;
  - pueden ir **a la vez**, sin esperar una a otra;
  - cada parte es de **más de una hora** (más de unos 150.000 tokens nuevos).
- **No se divide:**
  - una cadena de pasos que dependen unos de otros;
  - una corrección pequeña;
  - lo que comparte el entorno de pruebas del móvil: solo hay un emulador.
- **Lo pequeño de la misma zona se junta** en un solo encargo. Por ejemplo, los
  tres detalles visuales de `ADP-27`, uno solo.
- **Más trabajadores a la vez no sirve.** El tope de puestos de DEC-39 se queda
  como está: el portátil llegó a carga 67, y el Supabase local y el emulador
  son compartidos.

Tras la siguiente versión, con P2, se compara el coste real de las tareas
divididas y las enteras y se ajusta la regla.

### P5. Un entorno de pruebas del móvil que no se coma días

1. **Maestro sale de las tareas normales.**
   - Cada tarea pasa sus tests unitarios y de integración.
   - Los caminos críticos de Maestro se ejecutan **una vez al cerrar la versión
     o una ola**, en un encargo de «verificación» con todos los flujos.
   - Si falla, se abre una corrección.
2. **`docker/android/reset`:** un script que borra los `.lock`, recrea el
   contenedor del emulador, espera al arranque y comprueba ADB. Siempre antes
   de Maestro. Convierte cuatro trampas en una orden.
3. **Ningún proceso retiene el candado de lo pesado para siempre.**
   - Todo lo que va con `flock` lleva también un tiempo máximo (`timeout`).
   - Al vencer, se registra la incidencia y se libera.

### P6. Que no se pierdan horas esperando

1. **Tanda de dudas antes de que el humano se vaya:** ya es costumbre; se
   escribe en `orquestador.md` como paso obligatorio.
2. **Decisiones con plazo.**
   - Las de bajo riesgo (orden, textos, detalles de interfaz) llevan un valor
     por defecto que se aplica solo si el humano no contesta en 8 horas.
   - Queda anotado en el buzón para que lo revise.
   - Nunca: seguridad, producción, dinero, alcance, ADR o datos.
3. **La cafeína ya está resuelta** (DEC-42). Falta registrar en P1 cuándo se
   corta el trabajo por apagar el portátil, para saber cuánto cuesta.

### P7. Menos gestión

- **Un solo PR de documentación por sesión del orquestador.**
  - El estado, la bitácora y los encargos van a una rama `docs/sesion-<fecha>`
    que se fusiona al cerrar, en vez de un PR por cada cambio de estado.
  - Los encargos que un trabajador necesita ya van enteros en su `--spec`, así
    que no hace falta fusionarlos antes.
- **Los informes de los trabajadores, en formato fijo y corto**, para que el
  orquestador los lea con menos tokens.

---

## 3. Lo que no se propone

- **Más trabajadores a la vez:** ver P4.
- **Servicios de pago** (Maestro Cloud, más minutos de Actions, iOS): el
  proyecto es de coste cero.
- **Maestro en GitHub Actions:** con el repositorio público sería gratis, pero
  dejaría de serlo al volver a privado (DEC-44). Se puede reconsiderar si P5 no
  basta.

---

## 4. Cómo se aplicaría (si se aprueba)

| Encargo | Qué | Agente (DEC-41) |
|---|---|---|
| A | Registro de incidencias: `anotar.py`, el supervisor escribiendo en él e `informe.py` (P1) | Codex Luna: mecánico, con pasos fijados |
| B | Medida por encargo y por sesión: `medir.py` y su línea en Jira (P2) | Codex Luna |
| C | `docker/android/reset` y tiempo máximo en el candado (P5) | Codex Sol: entorno delicado |
| D | Documentación: `orquestador.md` (P3 fase 1, P4, P6, P7), `trampas.md` y `contexto.md` más corto (P1) | Claude, sin trabajador: solo documentación |
| E | Diseño del orquestador por eventos (P3 fase 2): solo la propuesta, sin código | Arquitecto con el humano, más adelante |

A, B y C tocan ficheros distintos y pueden ir a la vez. D, después. E no
bloquea la siguiente versión.

**Cómo sabremos si funciona** (al cerrar la siguiente versión, con P2):

- **Releídos del orquestador por PR de código:** hoy unos 24 M; objetivo,
  menos de la mitad.
- **Relanzamientos por tarea:** hoy hasta 5; objetivo, como mucho 1.
- **Horas perdidas por el entorno de pruebas:** hoy más de un día; objetivo,
  menos de 2 horas por versión.
- **La retrospectiva encuentra causas nuevas, no las mismas.**

---

## 5. Decisiones para el humano

Cada una con su valor por defecto. **«ok» las acepta todas.**

| # | Pregunta | Por defecto |
|---|---|---|
| 1 | ¿Se crea el registro de incidencias y se hace una retrospectiva corta al cerrar cada versión? (P1) | **Sí** |
| 2 | ¿Se mide de forma automática cuánto tarda y cuántos tokens gasta cada encargo, con los datos que ya están en el ordenador y sin enviarlos a nadie? (P2) | **Sí** |
| 3 | ¿El orquestador pasa a sesiones cortas (nunca una ola nueva pasadas unas 6 h) y deja las revisiones de PR a un revisor aparte? (P3, fase 1) | **Sí** |
| 4 | ¿Se diseña el orquestador por eventos para probarlo en una ola? (P3, fase 2) | **Sí, pero después**: primero A a D, y el diseño cuando el humano tenga un rato con el arquitecto |
| 5 | ¿Se adopta la regla para dividir tareas y se revisa con datos tras la siguiente versión? (P4) | **Sí** |
| 6 | ¿Maestro solo al cerrar la versión o una ola, y no dentro de cada tarea? (P5) | **Sí** |
| 7 | ¿Las decisiones de bajo riesgo se toman solas si no contestas en 8 horas, anotándolas en el buzón? (P6) | **Sí**, y nunca en seguridad, producción, dinero, alcance, ADR ni datos |
| 8 | ¿Un solo PR de documentación por sesión del orquestador? (P7) | **Sí** |

Con tu respuesta, lo aprobado pasa a [decisiones](../decisiones.md) como
DEC-45 y se lanzan los encargos A a D antes de planificar la siguiente versión.
