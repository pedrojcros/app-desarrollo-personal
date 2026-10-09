---
disable-model-invocation: true
description: Apunta una idea en el buzón (docs/buzon.md) para que la procese el orquestador; si está verde, primero la aclara con el humano.
argument-hint: "<idea> [requiere-plan] [requiere-revisión]  (o «ayúdame a aclararla»)"
---

Idea del humano:

$ARGUMENTS

## Qué hacer

1. **Si no hay idea en el mensaje**, pregunta cuál es y no escribas nada.
2. **Si la idea está clara**, apúntala tal cual (paso 4).
3. **Si es vaga, o el humano pide ayuda para aclararla** («ayúdame», «no sé bien qué quiero»…), aclárala con él **antes** de apuntarla, siguiendo el método de `.agents/skills-a-demanda/brainstorming/SKILL.md`:
   - Una pregunta cada vez, en lenguaje llano, hasta entender qué busca de verdad y para qué.
   - Si ayuda, ofrece dos o tres enfoques con tu recomendación.
   - **De esa skill no se aplica**: escribir specs o documentos de diseño, invocar `writing-plans`, hacer commits ni usar su «compañero visual». Aquí solo se aclara la idea; el orquestador la convierte en trabajo.
4. **Apúntala** en `docs/buzon.md`, al final de la sección «Ideas nuevas»: una línea con la fecha de hoy delante («AAAA-MM-DD — idea») y, si se ha aclarado, dos o tres líneas debajo con lo acordado. Conserva tal cual `[requiere-plan]` o `[requiere-revisión]`; si la idea parece grande, pregúntale si quiere marcarla con `[requiere-plan]`.

## Reglas

- Usa las palabras del humano; no añadas alcance que él no ha pedido.
- **No hagas nada más**: ni conviertas la idea en tareas, ni toques otros ficheros, ni hagas commit. La procesa el orquestador (ver «Autonomía por niveles» en `docs/agentes/orquestador.md`).
- Termina con una línea: «Apuntada en el buzón».
