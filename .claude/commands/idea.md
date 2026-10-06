---
disable-model-invocation: true
description: Apunta una idea en el buzón (docs/buzon.md) para que la procese el orquestador.
argument-hint: "<idea> [requiere-plan] [requiere-revisión]"
---

Apunta esta idea en `docs/buzon.md`, al final de la sección «Ideas nuevas», como una sola línea con la fecha de hoy delante («AAAA-MM-DD — idea»):

$ARGUMENTS

Reglas:

- Si no hay idea en el mensaje, pregunta cuál es y no escribas nada.
- Copia la idea con las palabras del humano. Si lleva `[requiere-plan]` o `[requiere-revisión]`, consérvalo tal cual.
- **No hagas nada más**: ni la analices, ni la conviertas en tareas, ni toques otros ficheros, ni hagas commit. La procesa el orquestador (ver «Autonomía por niveles» en `docs/agentes/orquestador.md`).
- Contesta en una línea: «Apuntada en el buzón».
