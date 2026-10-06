# Brief común de los prototipos (P02)

Lo leen los subagentes que generan prototipos. Cada prototipo tiene además su propio encargo, con una **estructura** y un **estilo** concretos.

## La app

- Tareas y hábitos personales de un estudiante. Todo termina **hecho** o **no hecho**, y queda un historial. Android primero; también se usa en el navegador del ordenador.
- **Hábitos:** se repiten (a diario, ciertos días de la semana, cada N días o cada mes) y tienen una **franja** (mañana, tarde o noche) o una **hora**.
- **Tareas:** de una sola vez, con fecha y hora opcionales. Sin categoría van a la **Bandeja de entrada**.
- **Categorías:** Universidad, Salud, Personal y Casa.
- **Destinos de la navegación (5):** Hoy, Bandeja, Categorías, Pendientes (de días anteriores, con un contador) e Historial. Además, una forma clara de **crear** una tarea o un hábito.

## La pantalla: Hoy

Enseña solo lo **pendiente** de hoy, por franjas y, dentro de cada una, por hora. Marcar cuesta **una sola acción** y hay dos resultados, los dos a la vista: **hecho** y **no hecho**. Lo marcado sale de la lista y aparece un aviso «Marcada como hecha · **Deshacer**», con Deshacer en negrita.

Contenido exacto (no inventes otro):

- Fecha: martes 6 de octubre de 2026.
- Sin hora: «Comprar proteína» (tarea, Personal), en un grupo «Sin hora», donde encaje mejor.
- Mañana: «Llamar al dentista» (tarea, 10:00, Personal) y «Beber 2 L de agua» (hábito, Salud).
- Tarde: «Ir al gimnasio» (hábito, 18:30, Salud).
- Noche: «Entregar práctica de Redes» (tarea, 23:59, Universidad) y «Leer 20 minutos» (hábito, Personal).
- Ya marcadas hoy, que no salen en la lista: «Meditar 10 min» (hecho) y «Repasar apuntes de Redes» (no hecho). Si enseñas el progreso del día: 2 de 8 marcadas.
- Pendientes de días anteriores: 2.
- El aviso con Deshacer se ve en pantalla: acaba de marcarse «Meditar 10 min».
- No hay vista «Marcadas hoy»: es para después de la versión 1.

## Reglas del HTML

- Un solo fichero autocontenido: CSS en `<style>`, sin frameworks y sin JavaScript salvo para algo pequeño. Nada externo salvo, si quieres, Google Fonts (dos familias como mucho).
- El `body` es la pantalla del móvil; la galería pone el marco. Diseña para **360 × 800 px** (el ancho mínimo de Android, RNF-08) y comprueba que también queda bien a 412 × 915.
- Iconos en SVG en línea, al estilo de lucide (24 px, trazo 2 y extremos redondeados).
- Zonas de toque de al menos 44 px y contraste AA (RNF-03). Textos en español, con el contenido de arriba.
- Solo lo que se puede hacer en React Native con NativeWind: flexbox, bordes redondeados, sombras, degradados y desenfoques sencillos. Nada que dependa de pasar el ratón por encima.
- Cada prototipo tiene que ser **claramente distinto** de los demás de su ronda en lo que diga su encargo.

## Cómo comprobarlo

Con Docker, nunca con el navegador del sistema (DEC-26). Desde la carpeta de la ronda:

```
docker run --rm --pull never --user "$(id -u):$(id -g)" -v "$PWD":/work adp-captura pN.html pN.png 360 800
```

Mira la captura con la herramienta de leer ficheros, corrige lo que esté mal (textos cortados, elementos que se pisan, desbordes o poco contraste) y repite. Entrega `pN.html` y `pN.png`.
