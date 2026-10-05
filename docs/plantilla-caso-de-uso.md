# Plantilla de caso de uso

Formato **estándar** de todos los casos de uso del proyecto. Se copia el bloque de la sección «Plantilla» a [03-casos-de-uso](03-casos-de-uso.md) y se rellena sin cambiar el orden ni los títulos, para que todos se lean igual. Quien implementa un caso (persona o agente) sabe siempre dónde está cada cosa.

## Convenciones

**Identificadores.** `CU-nn` para el caso, `A<n>` para cada flujo alternativo, `E<n>` para cada excepción y `RN-nn` para cada regla de negocio. Los números **no se reutilizan** aunque se borre el caso. Las reglas de negocio llevan numeración **global** (`RN-01`, `RN-02`...) porque varios casos las comparten; cada una se define una sola vez y se enlaza desde los demás.

**Nombre.** En infinitivo y con el objeto: «Crear un hábito recurrente», no «Gestión de hábitos».

**Cómo se escriben los pasos del flujo normal.**

1. Un paso, una acción. Si lleva «y», probablemente son dos.
2. Frases cortas en presente, con sujeto explícito: «El usuario...» o «El sistema...». Los pasos alternan quién actúa.
3. Dicen **qué** pasa, nunca **cómo** (ni botones, ni tablas, ni tecnología). Si cambiar de tecnología obliga a reescribir el paso, estaba mal escrito.
4. Cada paso en que el sistema decide algo (validar, guardar, calcular) lo dice con un verbo claro: «valida», «guarda», «calcula».

**Flujos alternativos (`A<n>`).** Caminos válidos distintos del normal. Cada uno empieza con el paso donde se desvía: «A1. En el paso 3, si ...». Terminan diciendo si **vuelven** al flujo normal («Continúa en el paso 4») o **acaban** el caso.

**Excepciones (`E<n>`).** Lo que sale mal. Cada una dice el paso, qué falla, **qué hace el sistema** y en qué estado queda todo («no se guarda nada», «se conserva el estado anterior»). Una excepción sin estado final está incompleta.

**Reglas de negocio.** Una frase comprobable, sin adjetivos. Solo las que afectan a este caso; si ya existe, se enlaza.

**Cómo se comprueba.** Entre dos y cuatro escenarios con «Dado / Cuando / Entonces». Cubren el flujo normal y al menos **una excepción**. De aquí salen los criterios de aceptación de las funcionalidades y los tests, así que se escriben con datos concretos.

**Vocabulario.** Los términos del dominio se usan siempre con el mismo significado (ver el glosario de [03-casos-de-uso](03-casos-de-uso.md#vocabulario)). No se inventan sinónimos.

**Qué no lleva un caso de uso:** diseño de pantallas, nombres de tablas o campos, tecnología ni endpoints. Eso va en [04-arquitectura](04-arquitectura.md).

## Plantilla

```markdown
## CU-nn — Nombre en infinitivo

- **Actor principal:** quién lo inicia
- **Actores secundarios:** otros implicados, sistemas externos incluidos («ninguno» si no hay)
- **Funcionalidades:** RF-nn (se asignan en la sesión 3)
- **Precondiciones:** qué debe ser cierto antes de empezar
- **Postcondiciones:** qué es cierto al terminar bien
- **Disparador:** qué hace que empiece

### Flujo normal

1. El usuario ...
2. El sistema ...

### Flujos alternativos

- **A1.** En el paso n, si ocurre X: ... Continúa en el paso m. *(o: Termina el caso.)*

### Excepciones

- **E1.** En el paso n, si falla Y: el sistema ... Queda: ...

### Reglas de negocio

- **RN-nn.** ...

### Cómo se comprueba

- **Escenario 1: nombre.** Dado ..., cuando ..., entonces ...
- **Escenario 2: nombre de la excepción.** Dado ..., cuando ..., entonces ...
```
