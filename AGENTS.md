# AGENTS.md

Reglas comunes para **cualquier agente de código** que trabaje en este repositorio: Claude Code, GitHub Copilot CLI, Codex u otro. Léelo entero antes de tocar nada.

**Al empezar cualquier sesión, lee también [docs/contexto.md](docs/contexto.md):** dice dónde está el proyecto, qué viene y qué está pendiente. Claude Code lo carga solo, a través de `CLAUDE.md`; el resto de agentes tiene que abrirlo.

> Este fichero lo completó el arquitecto con el humano durante la planificación. Las versiones exactas del stack las fija la tarea T01.

## Qué es este proyecto

Una aplicación web **personal** de tareas y hábitos en la que todo se marca como **hecho o no hecho** y queda un historial. Tiene un único usuario, su autor, que la usará a diario: es un proyecto real. Detalle en [docs/01-vision-y-alcance.md](docs/01-vision-y-alcance.md).

## Si eres un trabajador

Trabajas por **encargos**: ficheros en `docs/agentes/encargos/` cuyo contenido te llega entero en tu tarea y que definen exactamente qué hacer.

- **El encargo manda.** No amplíes el alcance ni "mejores" cosas que no te han pedido.
- **Toca solo los ficheros que tu encargo necesita.** Si tienes que tocar algo más, para y dilo.
- **Si algo no está especificado, no lo inventes.** Anótalo como duda en tu informe final.
- **Nunca hagas merge.** Tu trabajo termina en tu rama y en tu PR contra `develop`.
- **No toques Jira** ni ninguna herramienta de seguimiento: de eso se ocupa el orquestador.
- Al terminar, informa con el formato que indica tu encargo.

Los papeles de arquitecto y orquestador **no son tuyos**, aunque seas Claude Code. Solo los asume la sesión en la que el humano ha ejecutado `/arquitecto` o `/orquestador`.

## Prohibiciones

No son preferencias. Si una tarea parece pedir alguna de estas cosas, para y pregunta.

Valen por defecto, y el arquitecto las ajusta en la planificación:

1. **No añadir dependencias** (del gestor de paquetes que sea) sin aprobación.
2. **No cambiar el modelo de datos ni el contrato de la API** sin aprobación.
3. **Nada de secretos en el repositorio**: claves, tokens, contraseñas, ni siquiera "de prueba". Van en variables de entorno; `.env.example` documenta cuáles.
4. **No reformatear ficheros que no estás tocando.** Los diffs tienen que poder revisarse.
5. **No desactivar tests, linter ni comprobaciones** para hacer pasar un cambio.
6. **Nada que cueste dinero** (servicios, planes o APIs de pago) sin aprobación: el proyecto es de coste cero.
7. **Nunca tocar la base de datos de producción**: ni migraciones, ni datos, ni sus claves. El desarrollo y los tests van contra el Supabase local.
8. **No cambiar cómo se guardan las fechas ni el motor de ocurrencias** ([ADR-0003](docs/adr/0003-ocurrencias-calculadas.md)) sin aprobación.
9. **No guardar datos de otras personas** ni enviar los del dueño a servicios distintos de los de la [ADR-0001](docs/adr/0001-stack.md).

## Legibilidad: regla obligatoria

*(Valor por defecto del kit, heredado de un proyecto anterior. Si no la quieres así, cámbiala aquí y en los encargos.)*

El código lo tiene que poder leer y mantener **una persona**, no solo una IA. Un cambio que no la cumple no se fusiona, aunque funcione y pase los tests. Vale para todo el código: aplicación, tests, SQL y scripts.

1. **Idioma:** los **nombres** (variables, funciones, clases, ficheros) y los mensajes de error van en inglés. Los **comentarios y los commits** van en español, igual que la documentación de `docs/`.
2. **Nada de abreviaturas en los nombres.** `user`, no `u`; `response`, no `res`; `index`, no `idx`. Tampoco variables de una letra, ni siquiera en lambdas, bucles o tests. Solo se admiten las siglas que son el nombre propio de algo (`API`, `URL`, `id`...).
3. **Una línea, una cosa.** Si una línea hace más de un paso (calcular, filtrar, transformar, guardar, decidir), se parte en varias y los resultados intermedios se guardan en variables con nombre.
4. **Cadenas de llamadas, una por línea.** Y si la cadena pasa de tres o cuatro pasos, se corta con una variable intermedia que diga qué hay en ese punto.
5. **Nada de trucos compactos.** Prohibidos los ternarios anidados, las asignaciones dentro de condiciones, los efectos secundarios escondidos en una expresión y los atajos tipo `a && hacerAlgo()` como sustituto de un `if`.
6. **Salir pronto antes que anidar.** Mejor comprobar el caso raro y salir que meter la lógica principal tres niveles hacia dentro.
7. **Funciones cortas con nombre de lo que hacen.** Si un bloque necesita un comentario para explicar qué hace, casi siempre es una función con ese nombre. Los comentarios explican el **porqué**, no el qué.

Quedan fuera solo los ficheros generados por herramientas, que no se tocan a mano. Quien revisa un cambio comprueba esta regla igual que comprueba los tests.

## Stack

Decidido en [ADR-0001](docs/adr/0001-stack.md). Se fija la **versión mayor** (los parches se actualizan sin preguntar). Donde pone «T01», la tarea T01 escribe la versión mayor estable del momento y desde entonces no se cambia sin aprobación.

| Pieza | Versión |
|---|---|
| Node.js | 24 (LTS), fijada en `.nvmrc` |
| TypeScript (modo `strict`) | T01 |
| Next.js (App Router) | T01 |
| React | La que pida Next.js |
| Tailwind CSS | T01 |
| `@supabase/supabase-js` y `@supabase/ssr` | T01 |
| Supabase CLI (`supabase`, dependencia de desarrollo) | T01 |
| Zod | T01 |
| Vitest y Playwright | T01 |
| ESLint y Prettier | T01 |

**Dependencias aprobadas: exactamente las de esta tabla** (más las que ellas instalen por su cuenta). El escaneo de secretos (gitleaks) corre en la integración continua, no es una dependencia. Cualquier otra necesita aprobación.

## Estructura del repositorio

```
AGENTS.md      reglas comunes para agentes (este fichero)
CLAUDE.md      importa este fichero para Claude Code
README.md      para humanos: qué es y cómo arrancar
docs/          toda la documentación; índice en docs/README.md
.agents/skills/ skills de los agentes (Claude las lee por el enlace .claude/skills)
src/domain/    lógica pura: fechas, ocurrencias y reglas de cada vista; sin framework
src/data/      la única capa que habla con Supabase; acciones de servidor
src/app/       rutas y pantallas (Next.js App Router)
src/components/ componentes de interfaz compartidos
supabase/      configuración local y migraciones
tests/e2e/     pruebas de extremo a extremo
```

## Comandos

Los crea la tarea T01; si cambian, se actualizan aquí.

```
npm install                 instalar dependencias
npx supabase start          base de datos local (necesita Docker)
npm run dev                 la aplicación en local
npm run lint                linter
npm run typecheck           comprobación de tipos
npm run test                pruebas unitarias
npm run test:integration    pruebas contra la base de datos local
npm run test:e2e            pruebas de extremo a extremo
npm run build               compilación de producción
```

Antes de dar un encargo por terminado, los tests de la parte que has tocado tienen que pasar, y la integración continua lo repite en cada push y pull request.

## Flujo de git

*(Decidido en DEC-01 y [ADR-0002](docs/adr/0002-ramas-y-fusion.md).)*

- **Todo por rama y pull request contra `develop`.** Nadie hace commit directo en `develop` ni en `main`.
- **Solo el orquestador hace merge a `develop`**, y solo si los tests pasan y la revisión es favorable, borrando la rama al fusionar. Los trabajadores nunca fusionan. **El paso de `develop` a `main` lo hace solo el humano.** Ver "Política de merge" en [docs/agentes/orquestador.md](docs/agentes/orquestador.md).
- **No se apilan PR** sobre otras ramas: cada PR va contra `develop`. Si una tarea depende de otra, espera a que la primera esté fusionada.
- **Un worktree y una rama por encargo.** Nunca dos agentes en el mismo.
- **Nombre de rama:** `ADP-123-descripcion-corta` si hay ticket; `tipo/descripcion-corta` si no (`feat/`, `fix/`, `docs/`, `chore/`). Orca antepone el usuario: `pedrojcros/ADP-123-descripcion-corta`.
- **Commits pequeños y con sentido**, en imperativo y explicando el porqué cuando no es obvio. Un commit mezcla código y la documentación que ese código deja obsoleta.
- **La clave del ticket** va en el nombre de la rama, en el título del PR y en el informe del trabajador.

## Convenciones de código

- **Idioma** (DEC-06): nombres y mensajes de error técnicos en inglés; comentarios, commits y documentación en español. Los textos que ve el usuario, en español. Los nombres del dominio, según el glosario de [docs/04-arquitectura.md](docs/04-arquitectura.md#glosario) (`habit`, `occurrence`, `mark`, `task`, `category`, `inbox`...).
- **Capas:** `src/domain` no importa nada de Next.js ni de Supabase; solo `src/data` habla con Supabase; las pantallas usan `src/data`.
- **Next.js acotado:** componentes de servidor para leer, acciones de servidor para escribir, componentes de cliente solo donde hay interacción. Sin rutas de API salvo `/api/health`.
- **Errores:** las acciones devuelven `{ ok: true, value }` o `{ ok: false, error: { code, message } }`. La interfaz nunca muestra un error técnico.
- **Validación:** Zod en la entrada de cada acción de servidor.
- **Base de datos:** tablas y columnas en inglés, `snake_case`, tablas en plural. Toda tabla lleva `user_id` y políticas RLS. Migraciones numeradas en `supabase/migrations/`; una migración aplicada no se edita: se crea otra.
- **Fechas** ([ADR-0003](docs/adr/0003-ocurrencias-calculadas.md)): fechas de calendario `YYYY-MM-DD` en Europe/Madrid; instantes en UTC.

## Tests

- Toda funcionalidad nueva lleva tests; todo bug corregido lleva un test que lo habría detectado.
- La lógica de negocio pura se prueba con tests unitarios, sin framework ni base de datos.
- La integración se prueba contra las piezas reales (la base de datos real, no un sustituto en memoria). Cómo se levantan esas piezas se concreta al elegir el stack.
- Herramientas: Vitest (unitarias e integración) y Playwright (extremo a extremo). `src/domain` exige tests exhaustivos; las políticas RLS se prueban con dos usuarios. Detalle en [docs/04-arquitectura.md](docs/04-arquitectura.md#estrategia-de-pruebas).

## Skills del proyecto

Viven en `.agents/skills/` (Claude las lee por el enlace `.claude/skills`). Qué hay, de dónde salen y cuándo usar cada una: [.agents/skills/README.md](.agents/skills/README.md).

- **Mandan este fichero y el encargo.** Si una skill dice otra cosa (ramas, idioma de los commits, dependencias, preguntar al humano), se sigue `AGENTS.md`.
- **El encargo dice qué skills usar.** Úsalas; si crees que hace falta otra, dilo en tu informe.
- **No añadas skills** sin aprobación, igual que con las dependencias.
- Los comandos `/arquitecto`, `/orquestador`, `/ejecutar-plan` e `/idea` son solo para el humano: un agente nunca los activa por su cuenta.

## Documentación

- Si tu cambio hace que algo de `docs/` deje de ser cierto, **actualízalo en el mismo commit**. Solo los documentos que indique tu encargo; si hace falta tocar otro, dilo.
- **El estado y la traza del proyecto viven en [docs/contexto.md](docs/contexto.md).** Al cerrar algo relevante (una tarea, una decisión, un cambio de rumbo, un problema que costó tiempo) se añade una entrada al principio de su bitácora y se actualiza su estado, en el mismo commit.
- **Las decisiones viven en [docs/decisiones.md](docs/decisiones.md)**, nunca en el chat: el contexto de una conversación se borra.
- Qué leer según el tipo de tarea: [docs/README.md](docs/README.md).
