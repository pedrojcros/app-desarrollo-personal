# Casos de uso

Un requisito dice qué hace el sistema. Un caso de uso describe **cómo transcurre la interacción**, paso a paso, incluido lo que sale mal.

*Estado: sin rellenar. Lo rellena el arquitecto con el humano (sesión 2).*

## Para qué sirven

El valor está en los **flujos alternativos y las excepciones**: ahí se descubren los agujeros del diseño antes de programar. Un caso de uso con solo flujo normal está mal escrito.

No hace falta un caso de uso para cada funcionalidad: solo para las que tienen interacción, estados o reglas no triviales.

## Plantilla

```
## CU-nn — Nombre en infinitivo

- Actor principal:      quién lo inicia
- Actores secundarios:  otros implicados (sistemas externos incluidos)
- Funcionalidades:      RF-nn
- Precondiciones:       qué debe ser cierto antes de empezar
- Postcondiciones:      qué es cierto al terminar bien
- Disparador:           qué hace que empiece

### Flujo normal
1. ...

### Flujos alternativos
- An. En el paso n, si ocurre X: ...

### Excepciones
- En. En el paso n, si falla Y: ...

### Reglas de negocio
- RN-n. ...
```

## Índice

| Caso | Nombre | Funcionalidades |
|---|---|---|
| CU-01 | RELLENAR | RF-01 |

---

## CU-01 — Nombre

- **Actor principal:**
- **Actores secundarios:**
- **Funcionalidades:** RF-01
- **Precondiciones:**
- **Postcondiciones:**
- **Disparador:**

### Flujo normal

1.

### Flujos alternativos

-

### Excepciones

-

### Reglas de negocio

-
