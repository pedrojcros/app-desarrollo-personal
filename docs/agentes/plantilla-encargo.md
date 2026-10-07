# Encargo NNN — Título corto

> El trabajador que reciba esto **no ha visto nada** de lo que se ha hablado antes. Todo lo que necesite saber tiene que estar aquí o enlazado. Si no se entiende sin contexto, el encargo está mal escrito.
>
> El orquestador pasa **este texto entero** como tarea al lanzar el trabajador (`--spec`). Los enlaces a `docs/` funcionan porque el trabajador parte del mismo repositorio.

| Campo | Valor |
|---|---|
| Tarea del plan | `Tnn` en `docs/05-plan.md` |
| Ticket | `ADP-nnn` (solo informativo: no lo toques) |
| Agente | claude / codex / copilot |
| Modelo y esfuerzo | Según el tamaño del encargo (ver «Modelos» en el orquestador). Copilot usa el suyo |
| Skills a usar | Automáticas de `.agents/skills/` (por ejemplo `test-driven-development`, `codigo-legible`) y, si hacen falta, a demanda por su ruta (`.agents/skills-a-demanda/<skill>/SKILL.md`) |
| Rama y worktree | Rama `ADP-nnn-descripcion-corta`, creada desde `develop`. Un worktree solo para este encargo |
| Depende de | Encargos que tienen que estar integrados antes |
| Reservado para este encargo | Números de migración, ficheros compartidos... (ver método del orquestador, punto 3) |

## Antes de empezar

Lee `AGENTS.md` entero. Es obligatorio aunque tu herramienta lo cargue sola.

## Cómo trabajar (DEC-39)

- **Commits pequeños a menudo**, uno por paso terminado, con un mensaje que diga qué queda hecho: si tu sesión se corta, quien te sustituya sigue desde `git log` sin repetir nada.
- **En local, solo los tests de tu parte** (y lint y tipos); la batería completa la ejecuta la CI. El navegador, solo si este encargo lo pide. Al terminar, cierra los contenedores y servidores que hayas arrancado.
- Lee de la documentación solo las secciones que este encargo te señala.

## Objetivo

Una o dos frases: qué tiene que existir al terminar que ahora no existe.

## Contexto que necesitas

Solo lo imprescindible, enlazando a la sección concreta:

-

## Qué hacer

1.

## Contrato

Solo si hay API, esquema de datos o firma compartida con otro encargo. Para cada pieza: método, ruta, petición, respuesta y errores; o campos y tipos; o firma. Productor y consumidor trabajan contra esto mismo.

## Fuera de alcance

Lo que **no** debes tocar aunque parezca relacionado:

-

## Criterio de hecho

Comprobable, no subjetivo:

- [ ]
- [ ] Los tests de la parte tocada pasan
- [ ] Cumple la regla de legibilidad de `AGENTS.md` (nombres en inglés; comentarios y commits en español)
- [ ] PR abierto **contra `develop`**, con el ticket en el título. **No hagas merge**: lo decide el orquestador

## Documentación a actualizar

-

## Cómo informar al terminar

Responde con estos seis puntos:

1. Qué has hecho, en tres líneas.
2. Ficheros tocados.
3. Decisiones que has tomado tú y por qué.
4. Dudas o cosas que no estaban especificadas.
5. Resultado de los tests (comando y salida resumida).
6. Enlace al PR.
