# Skills y MCP: revisión del 2026-10-14

Sesión de arquitecto. El humano pidió dos cosas: valorar si conviene añadir el MCP de memoria de datamcp (<https://datamcp.app/mcp-memory-server>) y revisar las skills instaladas, por si hay algunas que hacen lo mismo o se estorban. **Cerrada el mismo día** con DEC-52 a DEC-55 (ver [decisiones](../decisiones.md#cerradas)): no al MCP; las skills de Expo se quedan, sin `@expo/ui`, y pasan a demanda; solo cinco automáticas y perfiles por encargo; las de Emil Kowalski y Jakub Krehel, definitivas para diseño; `find-skills`, global. Lo aplica el [encargo 074](../agentes/encargos/074-skills-por-perfil.md).

## 1. El MCP de memoria de datamcp

**Qué es** (según su página, leída el 2026-10-14): un servidor MCP **alojado** por DataMCP LLC (Wyoming, EE. UU.). No es un proyecto de código abierto que se pueda instalar en local. Guarda un registro de trabajo en sus servidores, con búsqueda de texto en PostgreSQL, y ofrece herramientas como `append_memory`, `search_memory`, `create_handoff_context` y `summarize_memory`. El plan gratis da una conexión y un enlace, con 20 escrituras por minuto y 60 por hora. Las entradas **no se pueden editar ni borrar**. No escribe nada por su cuenta: hay que decirle al agente que llame a `append_memory`. La página no dice qué licencia tiene, dónde se guardan los datos, cuánto tiempo, ni si van cifrados.

**Recomendación: no añadirlo.**

1. **Choca con dos prohibiciones de `AGENTS.md`.** La 9 y la 10 no dejan enviar datos del proyecto a servicios que no estén en la ADR-0005. Saltárselas exige una excepción nueva, y esta no se defiende.
2. **No resuelve un problema que tengamos.** La memoria que viaja entre ordenadores y entre agentes ya existe: [`contexto.md`](../contexto.md), la [bitácora](../bitacora.md) y las [decisiones](../decisiones.md). Son ficheros del repositorio, que se revisan en cada PR, tienen historial y los leen también Codex y Copilot.
3. **Sería una segunda fuente de verdad.** Dos memorias acaban diciendo cosas distintas. Esta, además, no se puede corregir, porque es de solo añadir.
4. **Cuesta tokens y disciplina.** Cada agente tendría que acordarse de escribir en ella, y esa es justo la regla que más se olvida. La que ya tenemos («actualiza `contexto.md` en el mismo commit») la comprueba la revisión del PR.
5. **El proveedor es desconocido**: no hay licencia, ni política de datos, ni precio claro de los planes de pago. Si cambia o cierra, perdemos lo que haya dentro.

**Qué me haría cambiar de opinión:** que el problema real sea otro. Por ejemplo, que un trabajador necesite saber a mitad de un encargo lo que hizo otro en ese momento. Eso hoy lo resuelve Orca (`orca orchestration send/ask`). Si no basta, la solución sería un fichero en el repositorio o una mejora de Orca, no un servicio de terceros.

## 2. Las skills instaladas

### De dónde salen

Cada sesión de Claude en este ordenador, **también la de cada trabajador**, ve cuatro grupos de skills:

| Grupo | Dónde está | Cuántas | Lo ven también Codex y Copilot |
|---|---|---|---|
| Del proyecto (automáticas) | `.agents/skills/`, con el enlace `.claude/skills` | 23 | Sí |
| Del plugin de Supabase (DEC-34) | `~/.claude/plugins/cache/…/supabase` | 2 | No |
| Globales del ordenador | `~/.claude/skills/` y `~/.agents/skills/`: `find-skills`, `orca-cli`, `orchestration` | 3 | Sí (`~/.agents/skills`) |
| **Sincronizadas desde la cuenta de claude.ai** | `~/.claude/skills/synced/` y `~/.claude/plugins/synced/`: plugins de Cowork (`design`, `engineering`, `legal`, `marketing`, `data`, `productivity`, `cowork-plugin-management`, `pdf-viewer`) y las de Anthropic (`docs`, `docx`, `pptx`, `xlsx`, `pdf`, `morning`, `learn`, `import-memory`, `google-workspace`, `mcp-builder`, `skill-creator`, `web-artifacts-builder`) | unas 70 | No |

El último grupo **no está en la ficha** de [`.agents/skills/README.md`](../../.agents/skills/README.md): nadie lo revisó, porque llega solo desde la cuenta. Se suman los conectores de claude.ai (Notion, Google Drive, Google Calendar, Cloudflare, Claude Docs y las entradas de autenticación de Figma, Slack, Linear y otros), y uno, `definite`, que falla al conectar.

### Conflictos de verdad

| # | Qué choca | Por qué importa | Propuesta |
|---|---|---|---|
| 1 | `expo-overview`, `expo-native-ui` (y su `references/controls.md`) y `expo-design-system` mandan usar **`@expo/ui`** («check `expo-ui` first») para selectores, menús, interruptores y hojas | `@expo/ui` es una **dependencia no aprobada**: la ficha descarta `expo-ui` porque choca con React Native Reusables. El encargo **069 (selector de categoría)** es justo un desplegable: un trabajador que cargue `expo-overview` (que dice cargarse «antes de escribir código» en cualquier proyecto Expo) acabará proponiendo `@expo/ui` o parando a preguntar | Quitar esas órdenes de nuestras copias, como ya se quitó el envío de comentarios a Expo, y anotarlo en la ficha. **Antes del 069** |
| 2 | **Skills sincronizadas de claude.ai** que hacen lo mismo que las nuestras, con otras reglas: `engineering:code-review` contra `code-review-and-quality`; `engineering:debug` contra `systematic-debugging`; `engineering:testing-strategy` contra `test-driven-development`; `engineering:architecture` (su propio formato de ADR) contra [`docs/adr`](../adr/README.md); `engineering:deploy-checklist` contra `shipping-and-launch`; `design:accessibility-review` y `design:design-system` contra `better-accessibility` y `expo-design-system` | Ante la misma petición, Claude elige una al azar. Las de `engineering` y `design` no conocen `AGENTS.md` | Desactivarlas para Claude Code (punto 4) |
| 3 | `productivity:task-management` (lleva las tareas en un `TASKS.md`), `productivity:memory-management`, `anthropic-skills:docs` («the default for any document»: crea documentos en Claude Docs) y las instrucciones del conector de **Notion** (su «Notion Memory» y crear páginas) | Empujan a llevar estado, tareas y documentos **fuera del repositorio**, cuando la regla es `docs/`, Jira y `contexto.md`. Con un trabajador sin el humano delante, una de estas puede crear un `TASKS.md` o una página fuera | Desactivarlas para Claude Code (punto 4) |
| 4 | Las unas 70 sincronizadas, en general | Su descripción entra en las instrucciones de **cada** sesión de Claude, también la de cada trabajador y cada revisor. Es contexto gastado en cada encargo (DEC-39), para skills de legal, marketing u hojas de cálculo que aquí nunca se usan | Apagarlas en Claude Code si se puede hacer **por proyecto**. Si no, en la cuenta de claude.ai, sabiendo que también desaparecen de claude.ai. Hay que comprobar primero qué permite Claude Code (*spike* corto) |
| 5 | `find-skills` (global) enseña a instalar skills con `npx skills add` | Choca con «No añadas skills sin aprobación» de `AGENTS.md`. `AGENTS.md` manda, pero la skill invita a hacerlo | **Se queda global**: el humano la usa en otros proyectos. Basta con la regla de `AGENTS.md` |
| 6 | `frontend-ui-engineering`, automática, enseña con HTML y Tailwind de web (`<div>`, `<button>`, `<input>`) | Para pantallas de React Native ya hay tres automáticas mejores (`expo-native-ui`, `expo-design-system` y `vercel-react-native-skills`). Esta añade ejemplos que no sirven en la app nativa | Pasarla **a demanda**, para lo que sea solo de la web |

### Solapes que no molestan (se dejan como están)

- **`supabase-postgres-best-practices`** aparece dos veces: nuestra copia y la del plugin son **idénticas** (comprobado con `diff`). Se queda la nuestra porque Codex y Copilot no ven el plugin. Al actualizar el plugin se compara otra vez.
- **`code-review-and-quality` y `code-simplification`** frente a `/code-review`, `/simplify` y `/security-review` de Claude Code: estas son órdenes que solo lanza el humano; no se activan solas.
- **`orca-cli` y `orchestration`** dicen en su propia descripción cuándo va cada una.
- **`android-emulator-qa`** frente a la skill de emulador de Orca: la ficha ya dice cuál controla el dispositivo.
- **`expo-data-fetching`** habla de SWR y de los *loaders* de Expo Router, además de TanStack Query. No choca: las reglas de capas de `AGENTS.md` mandan y nadie ha intentado usarlos.
- **`test-driven-development` y `verification-before-completion`** (superpowers) frente a `incremental-implementation` (addyosmani): se complementan, no se pisan.

## 3. Cómo se aplicaría

El [encargo 074](../agentes/encargos/074-skills-por-perfil.md), para un trabajador barato: quita `@expo/ui` de las copias de Expo, deja cinco automáticas, mueve las otras 17 a demanda y actualiza las dos fichas y `AGENTS.md`. Va **en la primera ola de la 1.1.1, antes del 069**.

Los puntos 4 y 5 no son del repositorio: son de la configuración de este ordenador y de la cuenta. Los hace el humano, o el orquestador con su permiso, siguiendo lo que diga el *spike*.

## 4. `design:*` y `engineering:*` frente a las nuestras

| Suyas (Anthropic, plugins de Cowork) | Lo que tenemos | Mejor |
|---|---|---|
| `design:accessibility-review` (637 palabras) | `better-accessibility` (1.668, más 6 ficheros de referencia) | La nuestra |
| `design:design-system` (824) | `expo-design-system` (2.685, de React Native) y `better-colors` (1.261, más 6) | Las nuestras |
| `design:ux-copy` (552) | `better-writing` (1.556, con patrones) | La nuestra |
| `design:design-critique` (595) | `interface-review` (1.661) e `impeccable` | Las nuestras. De la suya solo vale el formato de la respuesta |
| `design:design-handoff`, `user-research`, `research-synthesis` | — | No aplican: no hay Figma, ni equipo de diseño, ni más usuarios que el dueño |
| `engineering:code-review`, `debug`, `testing-strategy` | `code-review-and-quality` (3.334), `systematic-debugging` (1.440), `test-driven-development` (1.475) | Las nuestras |
| `engineering:architecture`, `system-design`, `documentation` | El método del [arquitecto](../agentes/arquitecto.md) y las [ADR](../adr/README.md) | Lo nuestro |
| `engineering:incident-response`, `standup`, `tech-debt`, `deploy-checklist` | El registro de incidencias, las retrospectivas y `shipping-and-launch` | Lo nuestro |

Las de Emil Kowalski y Jakub Krehel **no se solapan con estas**: no son listas de proceso, sino criterio de oficio con reglas concretas. Una salvedad: `emil-design-eng` está escrita para la web (CSS y transiciones del navegador). En la app vale su criterio (qué animar, cuánto y cuándo no), pero el código lo pone `expo-animation`.

## 5. Cuánto gastan y cómo gastar menos

Medido el 2026-10-14: la cabecera es el nombre y la descripción, que entran en cada sesión, y se cuentan unos 4 caracteres por token.

| Grupo | Skills | Tokens de cabecera por sesión |
|---|---|---|
| Sincronizadas de claude.ai (plugins de Cowork) | 51 | ~4.700 |
| Sincronizadas de claude.ai (Anthropic) | 12 | ~2.100 |
| Del proyecto, automáticas | 22 | ~2.400 |
| Plugin de Supabase | 2 | ~600 |
| Globales (`find-skills`, `orca-cli`, `orchestration`) | 3 | ~400 |

Gasta más **el cuerpo**, que entra entero cuando una skill se activa sola: entre 400 y 3.300 palabras, de 500 a 4.300 tokens. Las más grandes son `code-review-and-quality`, `expo-animation`, `expo-design-system`, `security-and-hardening` y `api-and-interface-design`. En un encargo de pantalla pueden activarse cinco a la vez, unos 10.000 tokens antes de escribir una línea.

No es cosa de la CPU ni de la memoria del ordenador: son ficheros de texto. Lo que se gasta es **cuota de tokens y contexto** de cada trabajador. La caché de Claude abarata las cabeceras en cada turno, pero no el cuerpo de una skill la primera vez que se lee.

**Perfiles propuestos (DEC-54).** Las cinco automáticas van siempre. El resto se pide por su ruta en `.agents/skills-a-demanda/`:

| Perfil | Skills a demanda |
|---|---|
| Dominio (`src/domain`) | `api-and-interface-design`, solo si cambia un contrato |
| Datos y Supabase | `supabase-postgres-best-practices`, `security-and-hardening` (RLS, sesión), `source-driven-development` |
| Pantalla | `expo-native-ui`, `expo-design-system`, `vercel-react-native-skills`; `expo-router` si toca rutas; `expo-data-fetching` si toca estados de carga |
| Diseño | `better-layout`, `better-colors`, `better-typography`, `better-writing`; `emil-design-eng` y `expo-animation` si hay movimiento |
| Revisión | `code-review-and-quality`; `interface-review` y `better-accessibility` si es de interfaz; `code-simplification` si cuesta leer |
| Scripts y CI | `ci-cd-and-automation`, `incremental-implementation` |
| Emulador | `android-emulator-qa` |
| Solo web | `frontend-ui-engineering`, `browser-testing-with-devtools`, `performance-optimization` |

`expo-overview` y `expo-project-structure` no entran en ningún perfil. La primera solo reparte hacia las otras de Expo, y los perfiles ya hacen ese trabajo. La segunda es para crear un proyecto nuevo, y el nuestro ya existe.

## 6. Candidatas que trae el humano

Revisadas en GitHub el 2026-10-14 (DEC-56).

| Candidata | Qué es | Veredicto |
|---|---|---|
| [Appllama/appllama-skills](https://github.com/Appllama/appllama-skills) (MIT, ~2.800 estrellas) | `appllama-usage`, que usa su MCP alojado de pantallas de apps famosas, y `appllama-app-design-skill` (20 KB más 5 referencias), con HIG de Apple, controles nativos, movimiento y un bucle de grabación en el simulador de iOS | **No.** Su plugin da de alta el MCP `mcp.appllama.io` (prohibición 10). La de diseño repite `expo-native-ui`, `expo-animation` y las de Emil y Jakub, y piensa en iOS |
| Vercel Agent Skills | `react-native-skills` | **Ya instalada** como `vercel-react-native-skills` |
| Callstack Agent Skills | `react-native-best-practices`, `agent-device` y otras | **Sigue fuera** (ver «No incluidas» en la ficha) |
| [steve228uk/metro-mcp](https://github.com/steve228uk/metro-mcp) (MIT, 84 estrellas) | MCP local que se conecta a Metro por el protocolo de Chrome DevTools: consola, errores, red, componentes, estado de navegación, almacenamiento, control del dispositivo, perfilado y grabación de tests de Maestro, unas 90 herramientas | **Ahora no; *spike* aplazado.** Es útil para depurar en el emulador, pero gasta mucho contexto en Codex, va sin versión fija y repite Orca y Maestro |

**«Expo Skills y la tuya propia».** Lo primero ya está. Lo segundo lo tenemos para el código, y falta para las pantallas: `pantallas-app` (DEC-56.4).
