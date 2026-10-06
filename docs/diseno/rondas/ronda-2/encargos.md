# Ronda 2: encargos

Ronda de convergencia. La **estructura ya está elegida**: sale de lo que le gustó al humano en la ronda 1 (ver [ideas](../../ideas.md)). Lo que cambia entre prototipos es el **estilo**: paleta, letra y forma de los componentes. Cada estilo tiene **tres pantallas**: Hoy, Historial y Crear. Todo sigue el [brief común](../../brief.md), salvo donde esto lo cambie.

## Estructura común (no la cambies)

- **Hoy es simple: su única función es marcar.** **Ningún anillo de progreso** en la lista. Cada fila: el nombre; debajo, la hora (si tiene) y la categoría con un punto de su color; a la derecha, ✓ (con el color de la categoría) y ✗. Lo marcado sale de la lista.
- **Cabecera de Hoy** (como el P4 de la ronda 1): un título grande «Hoy, martes» con la letra de títulos del estilo, la fecha debajo («6 de octubre de 2026») y, a la derecha, «2 de 8» en pequeño con el color de acento. Sin menú lateral ni tira de la semana.
- **Navegación:** barra de pestañas abajo con los 5 destinos (icono y texto). La pestaña activa se resalta con una **pastilla detrás del icono** (como el P1 de la ronda 1). Pendientes, con su contador (2).
- **Botón +:** redondo, abajo a la derecha, por encima de la barra (como el P4 de la ronda 1).
- **Aviso** (como el del P5 de la ronda 1, pero **sin el punto**): «Marcada como hecha» a la izquierda y **Deshacer** a la derecha. Al cargar, se ve el de «Meditar 10 min».
- **Interacción:** en Hoy, ✓ y ✗ funcionan como en la ronda 1 (sale la fila, aparece el aviso y Deshacer la devuelve). En Crear, el selector Tarea / Hábito cambia los campos.

## Contenido de las pantallas

**Hoy:** el contenido del brief común (sin hora, mañana, tarde y noche).

**Historial** (RF-15, CU-05): los últimos 7 días, del miércoles 30 de septiembre al martes 6 de octubre, como la captura de hábitos que le gustó al humano: una fila por hábito o tarea y una columna por día, con hoy destacado. En cada celda: ✓ con el color de la categoría, ✗, o «sin marcar» (un punto o una raya tenue). Los días en que un hábito no toca, la celda va vacía, distinta de «sin marcar». Arriba, un selector de rango: «7 días», «30 días» y «Personalizado». **Aquí sí va el progreso**: el porcentaje de cada día bajo su columna, o un anillo por día.

- Hábitos: Meditar 10 min (a diario, Salud), Beber 2 L de agua (a diario, Salud), Ir al gimnasio (lunes, miércoles y viernes, Salud), Repasar apuntes de Redes (de lunes a viernes, Universidad) y Leer 20 minutos (a diario, Personal).
- Tareas, que solo tienen marca en su día: Pagar la matrícula (jueves 1, hecha), Llamar al dentista y Entregar práctica de Redes (hoy, pendientes).
- Inventa estados coherentes: casi todo hecho, algunos no hechos y algunos sin marcar. Hoy, solo «Meditar 10 min» hecho y «Repasar apuntes de Redes» no hecho.

**Crear** (CU-01, CU-02): una hoja que sube desde abajo sobre Hoy (o pantalla completa, lo que quede mejor), con el selector **Tarea / Hábito** arriba.

- Tarea: nombre, notas, fecha y hora (opcionales; sin fecha va a la Bandeja) y categoría («Sin categoría · Bandeja», por defecto).
- Hábito: nombre; frecuencia (A diario, Días de la semana con L M X J V S D para elegir, Cada N días o Cada mes); cuándo (franja Mañana, Tarde o Noche, o una hora); categoría; y fecha de inicio (hoy, por defecto).
- Se enseña en modo Hábito, rellena con «Ir al gimnasio», Días de la semana (L, X y V marcados), a las 18:30 y en Salud. Los campos de fecha y hora parecen campos que abren el selector nativo del móvil. Botón «Crear» al final.

## Estilos, uno por prototipo

| Estilo | Fondo | Superficie | Superficie 2 | Borde | Texto | Texto suave | Acento | No hecho | Universidad | Salud | Personal | Casa | Letra |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **A · Blanco** (el T1, papel y tinta) | `#F2ECE1` | `#FAF6EF` | `#EAE2D4` | `#D9CDB9` | `#1F1B16` | `#75695A` | `#C2410C` | `#9C8F7E` | `#3B5B7A` | `#4F7A45` | `#B7791F` | `#9B3A4C` | Fraunces (títulos) e Inter |
| **B · Negro** (el T2, bosque nocturno) | `#0E1813` | `#15221B` | `#1C2C23` | `#27392F` | `#E9F1EB` | `#93A89A` | `#E8C468` | `#D9776A` | `#8DB8F2` | `#7AD39A` | `#EFA66A` | `#F2A7A0` | DM Sans |
| **C · Neobrutalismo pulido** (el T3, más fino y profesional que el P6: bordes de 1,5 px, sombra desplazada de 2 px y más aire) | `#FFFBEF` | `#FFFFFF` | `#F4EFDF` | `#111111` | `#111111` | `#4A4A4A` | `#FFE14D` | `#111111` | `#8AB4FF` | `#6EE7A8` | `#FFB86B` | `#FF8FB1` | Archivo |
| **D · Cobalto** (nuevo; botones blancos con texto cobalto) | `#1636C4` | `#1F42D6` | `#2A4EE2` | `#4565EE` | `#FFFFFF` | `#C7D2FF` | `#FFFFFF` | `#FF9C8A` | `#9BE3FF` | `#8BF0BC` | `#FFD866` | `#FFB5CB` | Plus Jakarta Sans |
| **E · Mostaza** (nuevo; tarjetas crema y botones negros) | `#F2C14E` | `#FFF1C9` | `#F7D477` | `#1C1A14` | `#1C1A14` | `#5C4A1F` | `#1C1A14` | `#B42318` | `#1D4ED8` | `#047857` | `#C2410C` | `#9D174D` | Bricolage Grotesque |

A y B son el blanco y el negro que ya eligió el humano: tienen que quedar **pulidos y profesionales**, como el P4 y el P5 de la ronda 1. C, D y E son candidatos al tercer estilo.
