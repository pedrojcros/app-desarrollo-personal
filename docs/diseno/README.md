# Diseño (P02)

El aspecto de la app se decide **antes de programarlo**, en un bucle con el humano (DEC-25):

1. **Ideas.** El humano trae lo que le gusta y lo que no: capturas, apps o webs, palabras («minimalista», «oscuro»…). Se apunta en [ideas](ideas.md).
2. **Ronda.** El arquitecto prepara varios prototipos de la pantalla Hoy, muy distintos en estructura (dónde va la navegación, cómo es la cabecera, cómo se marca) y en estilo. Los generan subagentes con Sonnet a partir del [brief común](brief.md) y de un encargo por prototipo; el arquitecto los revisa.
3. **Opinión.** El humano los mira en la galería de la ronda y dice qué le gusta y qué no, de cada uno o mezclando («la navegación del 2 con los colores del 4»). Se apunta en [ideas](ideas.md).
4. **Otra ronda** con esos cambios, hasta que el humano diga «este».

El elegido pasa a `docs/diseno.md`, con sus decisiones (colores, tipografía, espaciado, componentes y movimiento), y T14 lo lleva a la app.

## Cómo ver una ronda

Abre `rondas/ronda-N/index.html` en el navegador: enseña todos los prototipos en marcos de móvil, uno al lado del otro. Cada uno se abre a pantalla completa desde su título.

## Qué hay en cada ronda

`rondas/ronda-N/`: `index.html` (la galería), `pN.html` y `pN.png` (cada prototipo y su captura) y `encargos.md` (qué se pidió a cada prototipo).

## Capturas

Se hacen con Chromium dentro de Docker (DEC-26), con la imagen de [captura/](captura/):

```
docker build -t adp-captura docs/diseno/captura
docker run --rm --pull never --user "$(id -u):$(id -g)" -v "$PWD":/work adp-captura p1.html p1.png 360 800
```

Los vídeos de referencia se miran como una hoja de fotogramas, con la imagen de [fotogramas/](fotogramas/):

```
docker build -t adp-fotogramas docs/diseno/fotogramas
docker run --rm --pull never --user "$(id -u):$(id -g)" -v "$PWD":/work adp-fotogramas video.mp4 hoja.png 24
```
