# Diseño

El estilo visual de la app, aprobado en P02 el 2026-10-06 (DEC-32). Palabras del humano: «Es una buena estructura inicial, ya la iremos puliendo con el uso».

Las pantallas de referencia son las de la [ronda 4](diseno/rondas/ronda-4/index.html), y el Historial, el de la [ronda 2](diseno/rondas/ronda-2/index.html). Cómo se llegó hasta aquí: [el bucle](diseno/README.md) y [las ideas del humano](diseno/ideas.md). T14 lleva esto a la app sin inventar nada; lo que no esté aquí se pregunta.

## Temas

Tres temas con la misma estructura. **Por defecto, el tema sigue el modo del móvil**: claro, Blanco; oscuro, Negro. En Ajustes se puede fijar cualquiera de los tres, y la elección se guarda en el dispositivo (RF-23).

| Token | Blanco (papel y tinta) | Negro (bosque nocturno) | Tercer estilo (neobrutalismo pulido) |
|---|---|---|---|
| Fondo | `#F2ECE1` | `#0E1813` | `#FFFBEF` |
| Superficie | `#FAF6EF` | `#15221B` | `#FFFFFF` |
| Superficie 2 | `#EAE2D4` | `#1C2C23` | `#F4EFDF` |
| Borde | `#D9CDB9` | `#27392F` | `#111111` |
| Texto | `#1F1B16` | `#E9F1EB` | `#111111` |
| Texto suave | `#75695A` | `#93A89A` | `#4A4A4A` |
| Acento | `#C2410C` | `#E8C468` | `#FFE14D` |
| No hecho | `#9C8F7E` | `#D9776A` | `#111111` |
| Lista de la compra | `#1F7A80` | `#5CCFC4` | `#62D9CB` |
| Universidad | `#3B5B7A` | `#8DB8F2` | `#8AB4FF` |
| Salud | `#4F7A45` | `#7AD39A` | `#6EE7A8` |
| Personal | `#B7791F` | `#EFA66A` | `#FFB86B` |
| Casa | `#9B3A4C` | `#F2A7A0` | `#FF8FB1` |
| Letra | Fraunces (títulos) e Inter | DM Sans | Archivo |
| Forma | Sin bordes marcados, tintes suaves | Sin bordes marcados | Bordes negros de 1,5 px y sombra desplazada de 2 px |

Los colores de categoría son los de las categorías de ejemplo; al crear una categoría, se elige de una gama coherente con el tema. **Nada de morados con degradado ni neón**: es el aspecto «de IA» que el humano no quiere.

## Reglas de la interfaz

- **Listas sin cajitas:** filas separadas por una línea fina; a la derecha, ✓ con el color de la categoría y ✗ con el color de «no hecho». Lo marcado sale de la lista.
- **Hoy:** la fecha pequeña arriba («Martes, 6 de octubre de 2026»), «Hoy» en grande y, a la derecha, «2 de 8» con **8 cuadritos** (hecho, no hecho y vacío). **Sin anillos de progreso en las listas**: en Hoy solo se marca; el progreso vive en el Historial.
- **Navegación:** barra de pestañas abajo con los cinco destinos (Hoy, Bandeja, Categorías, Pendientes con su contador e Historial). La activa se resalta con una **pastilla** detrás del icono.
- **Botón +:** redondo, abajo a la derecha, encima de la barra.
- **Aviso:** «Marcada como hecha» a la izquierda y **Deshacer**, en negrita, a la derecha. Sin punto entre los dos.
- **Añadir rápido** (DEC-30): al pulsar +, una barra encima del teclado. Arriba, el nombre en grande con el botón de enviar; debajo, Tarea/Hábito y «Más»; luego los atajos de fecha (Sin fecha · Hoy · Mañana · Lunes · calendario); y la categoría, con su sección. Toma la fecha y la categoría de la pantalla donde se abre: desde Hoy, hoy; desde una sección, su categoría y su sección. En Hábito: la frecuencia, cuándo (franja u hora) y la fecha de inicio con los mismos atajos.
- **«Más»** abre el resto de opciones (notas, hora exacta). Nunca abre la categoría.
- **Desplegables hacia arriba:** todo lo que se elige se abre encima de la barra, porque abajo está el teclado.
- **Categorías** (DEC-31): con icono y color; en su lista se despliegan y se recogen, con sus secciones dentro. Al abrir una categoría, sus tareas van agrupadas por sección, y al final las que no tienen sección.
- **Historial:** una cuadrícula con una fila por hábito o tarea y una columna por día, con ✓, ✗ y «sin marcar»; la celda vacía es un día que no tocaba; debajo, el porcentaje de cada día.
- **Accesibilidad:** contraste AA y zonas de toque de 44 px (RNF-03).

## Pendiente de pulir con el uso

Las pantallas que no se han dibujado (Bandeja, Pendientes, Ajustes y el formulario completo de «Más») siguen estas mismas reglas. Se verán en la siguiente versión del diseño.
