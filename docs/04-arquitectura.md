# Arquitectura

Forma del sistema, tecnología y convenciones. Las decisiones importantes tienen su propia ADR en [adr/](adr/README.md); aquí se enlazan, no se repiten.

*Estado: sin rellenar. Lo rellena el arquitecto con el humano (sesiones 5 y 6).*

## Restricciones

Lo que no se elige, viene dado. Se resume de [01-vision-y-alcance](01-vision-y-alcance.md#restricciones).

## Estrategia de solución

Las tres o cuatro ideas que definen el sistema, cada una con su ADR.

1. RELLENAR → [ADR-0001](adr/README.md)

## Stack

| Parte | Tecnología | Por qué |
|---|---|---|
| RELLENAR | | |

Las versiones exactas viven en `AGENTS.md`, que es lo que leen todos los agentes.

## Contexto del sistema

Quién lo usa y con qué sistemas externos habla.

```
RELLENAR: diagrama de texto (ASCII o Mermaid) con usuarios, el sistema y los sistemas externos.
```

## Estructura interna

Piezas principales y qué responsabilidad tiene cada una. Si se organiza por dominio o por capa, y por qué.

```
RELLENAR
```

## Modelo de datos

Entidades y relaciones principales. El detalle exacto (campos, tipos, restricciones) se puede llevar a un documento propio `docs/modelo-datos.md` cuando crezca. **Cambiarlo requiere aprobación** (ver `AGENTS.md`).

## Conceptos transversales

Lo que se decide una vez y se aplica en todas partes:

| Tema | Decisión |
|---|---|
| Autenticación y autorización | RELLENAR (ADR) |
| Gestión de errores | RELLENAR |
| Registros (*logs*) | RELLENAR |
| Configuración y secretos | Variables de entorno; `.env.example` versionado |
| Fechas y zonas horarias | UTC por defecto, instantes con tipo propio |
| Internacionalización | RELLENAR |
| Datos personales | RELLENAR: qué se guarda, quién lo ve, qué nunca sale en respuestas públicas |

## Estrategia de pruebas

| Nivel | Qué prueba | Herramienta | Cuándo corre |
|---|---|---|---|
| Unitarias | Lógica pura, sin framework | RELLENAR | Cada commit |
| Integración | Piezas reales (la base de datos real, no un sustituto en memoria) | RELLENAR | Cada PR |
| Extremo a extremo | Los caminos críticos | RELLENAR | Cada PR / nocturno |

Qué módulos exigen test sí o sí: RELLENAR.

## Despliegue

Cuando toque. Dónde corre, cómo se despliega, cómo se vuelve atrás, cómo se hacen y restauran las copias.

## Glosario

Los términos del dominio, para que personas y agentes hablen igual.

| Término | Significa |
|---|---|
| RELLENAR | |
