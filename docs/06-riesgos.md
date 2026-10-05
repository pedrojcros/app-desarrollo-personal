# Riesgos y deuda técnica

La parte que casi nadie rellena y la que más distingue a alguien con experiencia: reconocer por escrito lo que puede salir mal, antes de que salga.

*Estado: sin rellenar. Lo rellena el arquitecto con el humano (sesión 4).*

## Cómo se escribe un riesgo

Identificador, descripción, probabilidad, impacto, **mitigación** (qué se hace para que no pase) y **contingencia** (qué se hace si pasa igualmente).

Probabilidad e impacto: ALTA / MEDIA / BAJA. Lo importante no es acertar la etiqueta, sino haber pensado el plan B.

**Un riesgo sin contingencia es una preocupación, no un riesgo gestionado.**

## Riesgos que casi siempre aplican

Punto de partida; se borran los que no apliquen, con un motivo.

### R-01 — El alcance crece y el proyecto no se termina

- **Probabilidad:** ALTA · **Impacto:** ALTO
- **Mitigación:** fuera de alcance escrito y suscrito; todo lo nuevo, a la lista de espera de [01-vision-y-alcance](01-vision-y-alcance.md).
- **Contingencia:** recortar a lo imprescindible de [02-funcionalidades](02-funcionalidades.md).

### R-02 — Los agentes en paralelo se pisan o divergen

- **Probabilidad:** MEDIA · **Impacto:** MEDIO
- **Mitigación:** contratos escritos antes de repartir, recursos numerados reservados por tarea, un worktree por encargo, tope de paralelismo.
- **Contingencia:** fusionar de menos a más conflictivo y rebasar; si un encargo diverge del contrato, se descarta y se reescribe el encargo.

### R-03 — Un agente produce algo que parece bien y no lo está

- **Probabilidad:** ALTA · **Impacto:** MEDIO
- **Mitigación:** el orquestador ejecuta los tests él mismo, revisión cruzada con un agente distinto en lo delicado, criterio de hecho comprobable en cada encargo.
- **Contingencia:** encargo de corrección; tras dos fallos, se escala al humano.

### R-04 — Se agotan las cuotas o límites de los agentes

- **Probabilidad:** MEDIA · **Impacto:** BAJO
- **Mitigación:** más de un agente habilitado por tipo de encargo; lo mecánico al más barato.
- **Contingencia:** reasignar el encargo; el plan no depende de un único agente.

### R-05 — Un tercero (API, cuenta, aprobación) no llega a tiempo

- **Probabilidad:** MEDIA · **Impacto:** variable
- **Mitigación:** ningún tercero en el camino crítico si se puede evitar.
- **Contingencia:** versión funcional sin él.

### R-06 — Se pierde el hilo entre sesiones y agentes

- **Probabilidad:** MEDIA · **Impacto:** MEDIO
- **Mitigación:** `contexto.md`, `decisiones.md` y las ADR se actualizan en el mismo commit; nada importante vive solo en un chat.
- **Contingencia:** reconstruir el estado desde el historial de git y las decisiones.

## Riesgos propios de este proyecto

### R-07 — RELLENAR

- **Probabilidad:** · **Impacto:**
- **Mitigación:**
- **Contingencia:**

## Deuda técnica aceptada

Lo que se sabe mal y se deja a propósito, con motivo y condición para pagarla.

| Id | Qué | Por qué se acepta | Cuándo se paga |
|---|---|---|---|
| D-01 | | | |
