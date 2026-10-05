# Funcionalidades

Registro de funcionalidades (`RF`) y requisitos no funcionales (`RNF`). Es el contrato de **qué hace** el sistema; el plan en [05-plan](05-plan.md) dice cómo y cuándo se construye.

*Estado: sin rellenar. Lo rellena el arquitecto con el humano (sesión 3).*

## Cómo se escribe una funcionalidad

- **Dice QUÉ, nunca CÓMO.** «El sistema permite X», no «usar una tabla Y». Si cambiar de tecnología obliga a reescribirla, estaba mal escrita.
- **Es comprobable.** Si no se puede escribir cómo verificarla, no es una funcionalidad.
- **Es atómica.** Si lleva un «y», probablemente son dos.
- **Prioridad:** IMPRESCINDIBLE / DESEABLE / OPCIONAL (MoSCoW: must, should, could). La versión 1 son los imprescindibles.
- **Identificadores** `RF-nn` y `RNF-nn`. Nunca se reutilizan.

## Registro

Resumen de todas, para verlas de un vistazo. El detalle va debajo.

| Id | Funcionalidad | Prioridad | Caso de uso | Tarea del plan | Epic en Jira |
|---|---|---|---|---|---|
| RF-01 | RELLENAR | IMPRESCINDIBLE | CU-01 | Tnn | |

El estado de construcción **no** se apunta aquí: vive en las tareas (ver [agentes/jira](agentes/jira.md)).

## Funcionalidades

### RF-01 — Nombre

- **Descripción:** el sistema debe permitir que ... 
- **Prioridad:** IMPRESCINDIBLE
- **Criterio de aceptación:** dado ..., cuando ..., entonces .... Incluye al menos un caso de error.
- **Notas:** decisiones relacionadas (`DEC-nn`, `ADR-nnnn`), datos personales implicados.

## Requisitos no funcionales

Cómo de bien tiene que hacerlo. Cada uno con **un número**, no con adjetivos: «responde en menos de 500 ms el 95 % de las veces», no «rápido».

| Id | Categoría | Requisito | Cómo se comprueba |
|---|---|---|---|
| RNF-01 | Rendimiento | RELLENAR | |
| RNF-02 | Seguridad | RELLENAR | |
| RNF-03 | Accesibilidad | RELLENAR | |
| RNF-04 | Disponibilidad | RELLENAR | |
| RNF-05 | Privacidad | RELLENAR | |

Si un requisito no funcional no tiene número, todavía es una intención.
