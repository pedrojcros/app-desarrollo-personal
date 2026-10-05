# Decisiones de arquitectura (ADR)

Una ADR (*Architecture Decision Record*) es un documento corto que registra **qué** se decidió y sobre todo **por qué**. Sirve para que nadie deshaga una decisión sin entender qué problema resolvía, incluido uno mismo dentro de un año.

## Cuándo se escribe una

Cuando la decisión es **cara de cambiar** o va a ser cuestionada: lenguaje y framework, base de datos, forma de autenticar, estilo de la API, estructura del código, qué va en el camino crítico. Lo reversible y barato va a [decisiones](../decisiones.md) como decisión de bolsillo.

## Reglas

- **Una por fichero:** `NNNN-titulo-corto.md`, con numeración correlativa. Los números no se reutilizan.
- **Una página como máximo.** Si necesita más, la decisión no está clara.
- **No se editan ni se borran.** Si una decisión cambia, se escribe una ADR nueva que la sustituye, y la antigua pasa a estado «Sustituida por ADR-NNNN». El historial es el valor.
- **Las consecuencias negativas son obligatorias.** Toda decisión tiene coste; una ADR sin contras está mal escrita.
- **Las aprueba el humano.** Los agentes las proponen.
- Estados: Propuesta, Aceptada, Rechazada, Sustituida por ADR-NNNN.

## Índice

| ADR | Decisión | Estado |
|---|---|---|
| [0001](0001-stack.md) | Stack: Next.js, Supabase y Vercel | Aceptada |
| [0002](0002-ramas-y-fusion.md) | Modelo de ramas y de fusión | Aceptada |
| [0003](0003-ocurrencias-calculadas.md) | Ocurrencias calculadas y fechas de calendario | Propuesta |
| [0004](0004-acceso-un-usuario.md) | Acceso de un solo usuario | Propuesta |

### Tomadas, pendientes de registrar

*(Decisiones ya tomadas de palabra que aún no tienen ADR.)*

- *(Ninguna: el modelo de ramas ya es la ADR-0002.)*

## Plantilla

```markdown
# ADR-NNNN: Título

- **Estado:** Propuesta | Aceptada | Rechazada | Sustituida por ADR-NNNN
- **Fecha:** AAAA-MM-DD
- **Decisores:** quién lo aprueba

## Contexto

Qué situación obliga a decidir. Hechos y restricciones, sin opinión.

## Opciones consideradas

### Opción A: nombre

| Dimensión | Valoración |
|---|---|
| Complejidad | Baja / Media / Alta |
| Coste | |
| Familiaridad | |
| Encaje con las restricciones | |

**A favor:** ...
**En contra:** ...

### Opción B: nombre

(mismo formato)

## Decisión

Qué se elige y por qué, comparado con las alternativas.

## Consecuencias

- Qué se vuelve más fácil
- Qué se vuelve más difícil
- Qué habrá que revisar y cuándo
```
