# Ronda 3: encargos

Los tres estilos ya están elegidos: **A** (blanco, papel y tinta), **B** (negro, bosque nocturno) y **C** (tercer estilo, neobrutalismo pulido). Esta ronda trata la **forma de crear** y las **secciones**. Cada estilo tiene **cuatro pantallas**: Hoy, Añadir rápido desde Hoy, Categorías, y Mercadona con Añadir rápido. Todo sigue el [brief común](../../brief.md) y las [ideas del humano](../../ideas.md), salvo donde esto lo cambie.

## Lo que cambia respecto a la ronda 2

- **Listas sin cajitas**, como el P5 de la ronda 1: filas sueltas separadas por una línea fina, cada una con su ✓ y su ✗. Nada de tarjetas alrededor de cada tarea ni de cada grupo.
- **Crear no es otra pantalla.** Al pulsar +, aparece encima de la pantalla actual una barra de **añadir rápido** con el cuadro del nombre ya activo (cursor parpadeando) y el **teclado del móvil abierto**. Dibuja un teclado de Android realista (QWERTY en español, con la ñ) que ocupe la parte de abajo, unos 290 px. La barra va justo encima del teclado, con los atajos a mano y un botón de enviar.
- **Atajos del añadir rápido**: Tarea o Hábito; la fecha con atajos («Hoy», «Mañana», el próximo lunes como «Lunes» y un icono de calendario para elegir otra) y, en las tareas, «Sin fecha»; y la categoría, que enseña su sección si la tiene («Lista de la compra › Mercadona»). En Hábito, en vez de la fecha: la frecuencia («A diario», «L X V»…), cuándo (franja u hora) y la fecha de inicio con los mismos atajos. Un «Más» abre el resto (notas, hora exacta). Busca la forma más usable: es lo que el humano hará cada día.
- **Contexto**: lo que se crea toma lo de la pantalla donde estás. Desde Hoy, la fecha es Hoy; desde una categoría, esa categoría y Sin fecha.
- **Secciones**: una sección agrupa categorías, como una carpeta. Puede haber categorías sin sección.

## Pantallas y contenido

1. **Hoy** (`x-hoy.html`): el contenido del brief, con las filas sin cajitas.
2. **Añadir rápido desde Hoy** (`x-anadir.html`): Hoy de fondo, la barra encima del teclado con «Comprar pilas» a medio escribir, en modo Tarea, con «Hoy» marcado y la categoría «Sin categoría · Bandeja».
3. **Categorías** (`x-categorias.html`): arriba, la Bandeja (1); la sección «Lista de la compra», con Mercadona (3 pendientes) y Lidl (1); y sin sección, Universidad (2), Salud (2), Personal (3) y Casa (1). Botones para crear una sección y una categoría. La pestaña activa de la barra es Categorías.
4. **Mercadona con añadir rápido** (`x-mercadona.html`): la categoría Mercadona («Lista de la compra › Mercadona») con «Leche de avena», «Huevos» y «Pan integral», sin fecha; encima del teclado, la barra con «Plátanos» escrito, Mercadona ya puesta y «Sin fecha».

(`x` es la letra de tu estilo: a, b o c.)

## Interacción (JavaScript pequeño)

En Hoy, ✓ y ✗ como en la ronda 2. En las pantallas con añadir rápido: el selector Tarea / Hábito cambia los atajos, los atajos de fecha se marcan al tocarlos, y el botón de enviar añade lo escrito a la lista de debajo y deja la barra lista para otra.

## Estilos

A (paleta T1, con Fraunces e Inter), B (paleta T2, con DM Sans) y C (paleta T3 pulida: bordes de 1,5 px, sombra desplazada de 2 px, con Archivo). Los colores exactos están en los [encargos de la ronda 2](../ronda-2/encargos.md#estilos-uno-por-prototipo). Toma como referencia de nivel las pantallas de tu estilo de la ronda 2 (`../ronda-2/a-*.png`, `b-*.png` o `c-*.png`), pero aplica los cambios de arriba.
