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
| Skills a usar | Las cinco automáticas se cargan solas. Aquí, las **a demanda** del perfil del encargo, por su ruta (`.agents/skills-a-demanda/<skill>/SKILL.md`; ver «Perfiles de skills» al final de la plantilla). Si necesitas otra de esa carpeta, léela y dilo en tu informe |
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

- `docs/contexto.md`, la bitácora y `docs/decisiones.md` los actualiza el orquestador al cerrar: no los toques ni lo preguntes.

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

En la descripción del PR, con estos seis puntos y **en formato corto** (DEC-45: el orquestador lo lee entero, y cada línea le cuesta). Sin repetir el encargo ni pegar salidas largas:

1. **Hecho:** qué has hecho, en tres líneas como mucho.
2. **Ficheros:** la lista, sin explicar cada uno.
3. **Decisiones:** las que has tomado tú, una línea cada una con su porqué, y las skills a demanda que hayas leído sin que el encargo las pidiera. «Ninguna» si no hay.
4. **Dudas:** lo que no estaba especificado, una línea cada una. «Ninguna» si no hay.
5. **Tests:** el comando y el resultado en una línea (`npm run test: 640 pasan`). Si algo falla, el nombre del test y el error, nada más.
6. **PR:** el enlace.

Y al final, `worker_done` con un resumen de tres frases.

---

## Perfiles de skills (DEC-54)

**Para quien escribe el encargo; esta sección no se copia en él.** Desde el encargo 074 solo hay cinco skills automáticas: `codigo-legible`, `flujo-git`, `test-driven-development`, `systematic-debugging` y `verification-before-completion`. El resto está en `.agents/skills-a-demanda/`. Pide las del perfil, sin pasar de dos o tres (DEC-39). Un encargo puede juntar dos perfiles.

| Perfil | Skills a demanda |
|---|---|
| Dominio (`src/domain`) | `api-and-interface-design`, solo si cambia un contrato |
| Datos y Supabase | `supabase-postgres-best-practices`; `security-and-hardening` si toca RLS, sesión o validación; `source-driven-development` si usa una API nueva |
| Pantalla | `expo-native-ui`, `expo-design-system`, `vercel-react-native-skills`; `expo-router` si toca rutas; `expo-data-fetching` si toca estados de carga, error o vacío |
| Diseño | `better-layout`, `better-colors`, `better-typography`, `better-writing`; `emil-design-eng` y `expo-animation` si hay movimiento |
| Revisión | `code-review-and-quality`; `interface-review` y `better-accessibility` si es de interfaz; `code-simplification` si cuesta leer |
| Scripts y CI | `ci-cd-and-automation`, `incremental-implementation` |
| Emulador | `android-emulator-qa` |
| Solo web | `frontend-ui-engineering`, `browser-testing-with-devtools`, `performance-optimization` |

El trabajador puede leer por su cuenta cualquier otra skill de esa carpeta, y lo dice en el informe (punto 3). Si varios encargos del mismo tipo leen la misma skill que no se pidió, se añade a su perfil.
