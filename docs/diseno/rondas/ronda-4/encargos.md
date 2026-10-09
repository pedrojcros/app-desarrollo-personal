# Ronda 4: encargos

Ronda de convergencia: **una sola estructura** para los tres estilos; solo cambia el tema (colores y letra). Cada estilo tiene cuatro pantallas. Todo sigue el [brief común](../../brief.md) y las [ideas del humano](../../ideas.md), salvo donde esto lo cambie.

## Estructura (la misma en los tres)

- **Listas** como B de la ronda 3: filas sueltas separadas por una línea fina; ✓ con el color de la categoría y ✗.
- **Cabecera de Hoy:** la fecha pequeña arriba («Martes, 6 de octubre de 2026»), «Hoy» en grande y, a la derecha, «2 de 8» con **8 cuadritos de progreso** (uno hecho, uno no hecho y seis vacíos), como el C de la ronda 3.
- **Añadir rápido como el de B de la ronda 3:** el nombre arriba en grande con el botón de enviar; debajo, Tarea/Hábito con «Más», los atajos de fecha («Sin fecha · Hoy · Mañana · Lunes · 📅») y la categoría.
- **Desplegables hacia arriba:** todo lo que se elige (la categoría y la sección, la frecuencia, cuándo…) se abre **hacia arriba**, encima de la barra, porque abajo está el teclado.
- **Categorías con secciones** (DEC-31): la **categoría** es el contenedor, con **icono** y **color**, y puede tener **secciones** dentro. Una tarea va en la categoría o en una de sus secciones. En la pantalla de Categorías, cada categoría **se despliega y se recoge**.
- **Iconos y colores de las categorías:** Lista de la compra (una cesta), Universidad (un birrete o un libro), Salud (un corazón), Personal (una persona) y Casa (una casa); la Bandeja, su bandeja en gris. Universidad, Salud, Personal y Casa usan los cuatro colores de categoría de tu paleta; para Lista de la compra, elige un quinto color coherente con ella y distinto de los otros (nada de morados).
- La navegación con la pastilla, el + abajo a la derecha y el aviso sin el punto, como hasta ahora.

## Pantallas y contenido (`x` es la letra de tu estilo)

1. **Hoy** (`x-hoy.html`): el contenido del brief.
2. **Añadir rápido con el desplegable abierto** (`x-anadir.html`): desde Hoy, «Comprar pilas» escrito, en modo Tarea y con «Hoy» marcado; el selector de categoría **abierto hacia arriba**, con la Bandeja y las categorías con su icono y su color, y «Lista de la compra» desplegada con sus secciones.
3. **Categorías** (`x-categorias.html`): arriba, la Bandeja (1). Debajo, las categorías con su icono y su color: «Lista de la compra» desplegada (Mercadona 3, Lidl 1 y 1 sin sección), «Universidad» desplegada (Redes 1 y Bases de datos 1) y, recogidas, «Salud» (2), «Personal» (3) y «Casa» (1). Botón «Nueva categoría». La pestaña activa es Categorías.
4. **Lista de la compra con añadir rápido** (`x-lista.html`): la categoría con su icono y sus tareas agrupadas por secciones: Mercadona (Leche de avena, Huevos y Pan integral), Lidl (Papel de cocina) y Sin sección (Pilas). Encima del teclado, la barra abierta desde Mercadona: «Plátanos» escrito, «Sin fecha» y «Lista de la compra › Mercadona».

## Interacción (JavaScript pequeño)

En Hoy, ✓ y ✗ como siempre. En la barra: Tarea / Hábito cambia los atajos, los atajos de fecha se marcan, los desplegables se abren hacia arriba al tocarlos y enviar añade lo escrito a la lista. En Categorías, cada categoría se despliega y se recoge al tocarla.

## Estilos

A (paleta T1, con Fraunces e Inter), B (paleta T2, con DM Sans) y C (paleta T3 pulida: bordes de 1,5 px, sombra desplazada de 2 px, con Archivo). Los colores exactos están en los [encargos de la ronda 2](../ronda-2/encargos.md#estilos-uno-por-prototipo). Mira tus pantallas de la ronda 3 (`../ronda-3/x-*.png`) y las de B (`../ronda-3/b-*.png`), cuya estructura es la que manda ahora.
