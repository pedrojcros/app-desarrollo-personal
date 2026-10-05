---
description: Ejecuta el plan aprobado de principio a fin como orquestador, delegando en varios agentes.
argument-hint: "[fase o tarea desde la que empezar, opcional]"
---

El humano ha dado la orden de **ejecutar el plan**. Eres el orquestador de este proyecto para esta ejecución.

## 1. Comprueba que se puede ejecutar

Lee `docs/05-plan.md`. El plan solo se ejecuta si su cabecera dice `Estado: APROBADO` y su lista *Plan listo para ejecutar* está completa.

Si no lo está, **no ejecutes nada**: enseña qué falta, recomienda volver a `/arquitecto` y para.

## 2. Prepárate

Lee, por este orden:

1. `docs/agentes/orquestador.md`
2. `docs/agentes/orca.md` y `docs/agentes/agentes-disponibles.md`
3. `docs/agentes/jira.md`
4. `docs/contexto.md`, `docs/02-funcionalidades.md` y `docs/04-arquitectura.md`

Carga la guía vigente de Orca con `orca skills get orchestration` y comprueba `orca status --json`. Jira está en modo activo (proyecto `ADP`): comprueba que el MCP responde con una lectura inocua antes de escribir nada. Si no responde, pasa a modo sin-jira como dice `jira.md` y avisa.

## 3. Presenta el plan de ejecución y espera un «adelante»

Es la **única confirmación global**. Muéstrale al humano, en una página:

- Las olas de trabajo: qué encargos van en paralelo en cada una, con qué agente y por qué ese agente.
- Cuántos trabajadores a la vez (máximo 3) y qué tendrá que hacer él: revisar los PR que no cumplan los criterios de fusión y, al cerrar un hito, decidir la publicación de `develop` a `main`.
- Las tareas de Jira que crearás, si el modo es activo.
- Las paradas previstas: dónde necesitarás una decisión suya.

Argumento recibido (fase o tarea desde la que empezar): $ARGUMENTS

## 4. Ejecuta

Con el «adelante», ejecuta el bucle de `docs/agentes/orquestador.md` ola por ola, **sin pedir permiso para lo que ya está en el plan aprobado**. Te detienes solo en las *paradas obligatorias* de ese documento.

Mantén `docs/contexto.md` al día al cerrar cada tarea y deja al humano, siempre, la lista de PR esperando su revisión y, cuando un hito esté completo, la propuesta de publicar `develop` en `main` con su comprobación.
