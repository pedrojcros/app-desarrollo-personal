# ADR-0003: Ocurrencias calculadas y fechas de calendario

- **Estado:** Aceptada (DEC-21)
- **Fecha:** 2026-10-06
- **Decisores:** el humano, a propuesta del arquitecto

## Contexto

Los hábitos tienen cuatro frecuencias (RN-10). Cambiar una frecuencia no debe reescribir el pasado (RN-19); «sin marcar» no es «no hecha» (RN-17); los cambios de hora no pueden duplicar ni perder días (RNF-07); el historial no tiene límite hacia atrás (RN-14); y no hay dinero para tareas programadas.

## Opciones consideradas

- **A: guardar cada ocurrencia**, generándolas por adelantado con una tarea programada. Consultas SQL simples, pero hace falta un proceso periódico, puede haber huecos o duplicados, y cambiar una frecuencia obliga a regenerar.
- **B: calcularlas** con una función pura a partir de la regla y **guardar solo las marcas** (hecha o no hecha), con **versiones de la regla**.

## Decisión

**B**, con estas reglas:

- Las fechas de ocurrencias y vencimientos son **fechas de calendario** (`YYYY-MM-DD`) en Europe/Madrid, sin hora UTC; las horas son hora local. Los instantes («cuándo se marcó») se guardan en UTC.
- Cada hábito tiene **versiones de su regla**, cada una con su fecha de inicio de validez. Para un día se usa la versión vigente ese día. «Cada N días» y «cada mes» cuentan desde el inicio de esa versión.
- Una ocurrencia sin marca es pendiente; en un día pasado, «sin marcar». Volver a pendiente es borrar la marca.

## Consecuencias

- **Más fácil:** no hay procesos periódicos ni duplicados; un cambio de hora no puede repetir un día; si la lógica tenía un fallo, al corregirla se recalcula todo sin migrar datos; es una función pura, muy fácil de probar.
- **Más difícil:** cada consulta calcula (barato: decenas de miles de ocurrencias al año); las ocurrencias no existen como filas, así que no se consultan directamente con SQL; un cambio involuntario en la lógica cambiaría el historial (lo evitan los tests de regresión).
- **Revisar:** si no se cumple RNF-01, o si la versión 2 necesita guardar qué evento de Calendar corresponde a cada ocurrencia (se añadiría una tabla de enlaces).
