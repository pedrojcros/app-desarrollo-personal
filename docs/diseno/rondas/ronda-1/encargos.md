# Ronda 1: encargos

Ronda de exploración: **seis prototipos de Hoy muy distintos** y una **hoja de paletas**. Todos siguen el [brief común](../../brief.md) y parten de las [ideas del humano](../../ideas.md).

## Comunes a los seis

- **Lo que le gusta al humano**, presente en todos: anillos de progreso, el color de la categoría en las marcas y una interfaz con vida. La cabecera la decide cada encargo.
- **Nada de aspecto «IA»:** ni morados o violetas con degradado, ni neón, ni cristal translúcido sobre fondos de colores.
- **Interacción (JavaScript pequeño):** al pulsar hecho o no hecho, el elemento sale con una animación corta (200 a 300 ms) y aparece el aviso «Marcada como hecha · **Deshacer**» (o «como no hecha»). Deshacer lo devuelve a su sitio. El progreso del día se actualiza contando hacia arriba. Al cargar, ya se ve el aviso de «Meditar 10 min».
- **Una microanimación propia**, sutil (la que diga el encargo).
- **Anillos:** en los hábitos, el anillo es su cumplimiento de los últimos 30 días (Beber 2 L de agua 80 %, Ir al gimnasio 60 %, Leer 20 minutos 45 %). Las tareas no llevan anillo, sino otro indicador (un punto o un icono de tarea).
- Usa exactamente los colores de tu paleta. **Hecho** se pinta con el color de la categoría; **no hecho**, con su color de «no hecho».

## Paletas

Las diseña el arquitecto. Familias: **Negro** (N), **Blanco** (B) y candidatas a **tercer estilo** (T).

| Paleta | Fondo | Superficie | Superficie 2 | Borde | Texto | Texto suave | Acento | No hecho | Universidad | Salud | Personal | Casa | Letra |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **N1 · Carbón y lima** | `#0A0A0A` | `#151515` | `#1E1E1E` | `#2A2A2A` | `#F2F2F2` | `#8C8C8C` | `#CDFF3F` | `#FF6B57` | `#6CB4FF` | `#4FE3A3` | `#FFC453` | `#FF8FB8` | Space Grotesk (títulos y números) e Inter |
| **N2 · Negro cálido y ámbar** | `#0E0D0C` | `#1A1817` | `#24211F` | `#34302C` | `#F6F0E8` | `#A39888` | `#FF9F1C` | `#E5484D` | `#82B1FF` | `#7ED492` | `#FFCF66` | `#F497B6` | Manrope |
| **N3 · Negro monocromo** (el color, solo en las categorías; botones blancos) | `#000000` | `#121212` | `#1C1C1C` | `#262626` | `#FFFFFF` | `#8E8E8E` | `#FFFFFF` | `#6B6B6B` | `#6EA8FE` | `#63E6BE` | `#FFD43B` | `#FF8787` | Inter |
| **B1 · Blanco monocromo** (el color, solo en las categorías; botones negros) | `#FFFFFF` | `#F6F6F5` | `#EDEDEC` | `#E3E3E1` | `#0B0B0B` | `#6F6F6B` | `#0B0B0B` | `#A3A3A0` | `#2563EB` | `#059669` | `#D97706` | `#E11D48` | Inter |
| **T1 · Papel y tinta** | `#F2ECE1` | `#FAF6EF` | `#EAE2D4` | `#D9CDB9` | `#1F1B16` | `#75695A` | `#C2410C` | `#9C8F7E` | `#3B5B7A` | `#4F7A45` | `#B7791F` | `#9B3A4C` | Fraunces (títulos) e Inter |
| **T2 · Bosque nocturno** | `#0E1813` | `#15221B` | `#1C2C23` | `#27392F` | `#E9F1EB` | `#93A89A` | `#E8C468` | `#D9776A` | `#8DB8F2` | `#7AD39A` | `#EFA66A` | `#F2A7A0` | DM Sans |
| **T3 · Neobrutalismo** (bordes negros de 2 px y sombra desplazada de 3 px) | `#FFFBEF` | `#FFFFFF` | `#F4EFDF` | `#111111` | `#111111` | `#4A4A4A` | `#FFE14D` | `#111111` | `#8AB4FF` | `#6EE7A8` | `#FFB86B` | `#FF8FB1` | Archivo |

## P1 · Lista con anillos · paleta N3

- **Cabecera:** fecha pequeña y limpia arriba a la izquierda («mar 6»); a la derecha, «2 de 8».
- **Lista** por franjas. Cada fila: anillo a la izquierda (o el indicador de tarea), nombre y detalle (hora · categoría), y a la derecha dos botones: ✓ relleno con el color de la categoría y ✗.
- **Navegación:** barra de pestañas abajo con los 5 destinos (icono y texto) y un botón + flotante encima.
- **Microanimación:** los anillos se rellenan al cargar.

## P2 · Marcador en vivo · paleta N1

- **Cabecera:** tarjeta grande con el porcentaje del día (25 %) en números grandes que suben contando al marcar, una barra fina y «2 de 8».
- **Lista:** filas compactas; a la derecha, un círculo grande que se rellena al tocarlo (hecho) y un × pequeño al lado (no hecho).
- **Navegación:** barra flotante en forma de píldora abajo, con los 5 destinos en iconos, y un botón + redondo aparte.
- **Microanimación:** el porcentaje cuenta hacia arriba.

## P3 · Agenda · paleta B1

- **Cabecera:** fecha grande en dos líneas («Martes» y «6 de octubre»), sobria. Botón + a la derecha.
- **Navegación: arriba**, pestañas horizontales bajo la cabecera (Hoy · Bandeja · Pendientes ② · Historial · Categorías), desplazables si no caben.
- **Lista como agenda:** columna de horas a la izquierda, una línea de tiempo y bloques con un borde izquierdo del color de la categoría. Las franjas, como separadores; «Sin hora», arriba. Dos botones redondos pequeños en cada bloque.
- **Microanimación:** la marca de «ahora» en la línea de tiempo late suavemente.

## P4 · Semana y deslizar · paleta T1

- **Cabecera:** una tira con la semana (L a D), con un anillo de progreso por día y hoy destacado.
- **Lista:** tarjetas que se deslizan: a la derecha es hecho (debajo asoma el color de la categoría con ✓) y a la izquierda, no hecho (✗). Una tarjeta se ve a medio deslizar para enseñarlo. Para la web, además, dos botones discretos en cada tarjeta.
- **Navegación:** menú lateral que se abre con el botón de menú de arriba a la izquierda; se ve cerrado, con el aviso de Pendientes ②. Botón + flotante abajo a la derecha.
- **Microanimación:** los anillos de la semana se dibujan al cargar.

## P5 · Lo siguiente · paleta T2

- **Cabecera:** lo siguiente del día en una tarjeta grande («Siguiente · 10:00 · Llamar al dentista») con dos botones grandes: Hecho y No hecho.
- **Debajo:** el resto del día en una lista compacta por franjas, con anillos pequeños.
- **Navegación:** barra inferior con los 5 destinos y un + grande en el centro que sobresale.
- **Microanimación:** al marcar, la tarjeta de «Siguiente» se cambia por la siguiente con un deslizamiento.

## P6 · Bloques · paleta T3

- **Cabecera:** fecha enorme y gruesa («MAR 06») y una barra de progreso en 8 segmentos (uno hecho, uno no hecho y seis vacíos).
- **Lista:** bloques gruesos con borde negro y sombra desplazada, con el fondo del color de la categoría. Para marcar, dos botones cuadrados (✓ y ✗).
- **Navegación:** un carril vertical a la izquierda (56 px) con los 5 destinos en iconos y el + arriba.
- **Microanimación:** al pulsar, el bloque se hunde (la sombra desaparece).

## Hoja de paletas

`paletas.html`: las siete paletas en tarjetas, agrupadas por familia. En cada una: el nombre, las muestras con su código, los cuatro colores de categoría y una muestra pequeña con esa paleta (una fila con anillo, ✓ y ✗, un botón principal y el aviso con Deshacer). Pensada para verla en el ordenador; captura a 1280 px de ancho.
