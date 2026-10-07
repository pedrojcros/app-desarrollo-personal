# Encargo 004 — Sistema visual (T14)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

| Campo | Valor |
|---|---|
| Tarea del plan | `T14` en `docs/05-plan.md` |
| Ticket | `ADP-5` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills a usar | `expo-design-system`, `expo-native-ui`, `frontend-ui-engineering`, `codigo-legible`, `flujo-git` (en `.agents/skills/`); a demanda, por su ruta, las de `.agents/skills-a-demanda/` que existan entre `better-colors`, `better-typography`, `better-layout`, `emil-design-eng`, `impeccable` |
| Rama y worktree | `ADP-5-sistema-visual`, desde `develop`, tu propio worktree |
| Depende de | T01 (fusionada) y P02 (el estilo aprobado, en `docs/diseno.md`) |
| Reservado para este encargo | `src/theme/` (incluido `provider.tsx`), la sección de tokens de `tailwind.config.js` y de `src/theme/global.css`, el estilo de `src/components/ui/`, la ruta de catálogo `src/app/(dev)/`, `src/app/ajustes.tsx`, **`src/app/(tabs)/_layout.tsx` solo para la barra de pestañas** (pastilla, colores, botón de Ajustes en la cabecera), y la sección «Cómo usar los tokens» de `docs/diseno.md` |

## Antes de empezar

Lee `AGENTS.md` entero (regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español; comandos: **todo se ejecuta en Docker** con `./docker/app/run ...`) y, sobre todo, **`docs/diseno.md`**: es el estilo aprobado por el humano (DEC-32) con los tres temas, los colores exactos, las tipografías y las reglas de interfaz. **No inventes estilo**: lo que no esté en `docs/diseno.md` o en los prototipos, se pregunta. Los prototipos de referencia son `docs/diseno/rondas/ronda-4/index.html` (Hoy, crear, categorías) y `docs/diseno/rondas/ronda-2/index.html` (Historial); léelos como HTML/CSS para sacar medidas, radios, sombras y espaciados. La puerta de esta tarea es `requiere-revisión` del humano: **tu PR no se fusionará esta noche**; déjalo listo para que el humano lo compare con su prototipo.

## Objetivo

Llevar a la app el estilo aprobado: tokens semánticos, tres temas con selector en Ajustes, componentes con el estilo correcto y un catálogo para verlo todo.

## Qué hacer

1. **Tokens semánticos** (color, tipografía, espaciado, radios, sombras, movimiento) en `src/theme/` y en la configuración de Tailwind/NativeWind, con **los tres temas** de la tabla de `docs/diseno.md` (Blanco, Negro y Tercer estilo), usando variables CSS de NativeWind para que cambiar de tema cambie todos los componentes sin tocarlos. Nombres de tokens por función (`background`, `surface`, `border`, `foreground`, `accent`, `not-done`...), no por color.
2. **Tema por defecto = el modo del móvil** (claro → Blanco; oscuro → Negro) y **Ajustes** (`src/app/ajustes.tsx`) con un selector sencillo de los tres temas (+ «Automático»); la **elección se guarda en el dispositivo** (`@react-native-async-storage/async-storage`, ya instalado; en la web, localStorage) y se mantiene al cerrar y abrir la app. Todo esto vive en `src/theme/provider.tsx` (el `ThemeProvider` que T01 dejó vacío y que ya envuelve la app: **no toques `src/app/_layout.tsx`**, lo toca T02). Un hook `useTheme` expone el tema activo y cómo cambiarlo.
3. **Tipografías** del diseño (Fraunces e Inter para Blanco, DM Sans para Negro, Archivo para el tercer estilo): cárgalas con `expo-font` (paquete `expo-*`, se instala con `npx expo install`, aprobado) usando **ficheros de fuente locales** en `assets/fonts/` con su licencia (todas son OFL). Si no puedes obtener los ficheros, o necesitas un paquete `@expo-google-fonts/*` (que NO está aprobado), **no lo instales**: usa la fuente del sistema como respaldo, deja el cargador de fuentes preparado y dilo en el informe. Mientras cargan, no parpadea ni falla.
4. **Componentes** de `src/components/ui/` con el estilo aprobado: los que ya hay (Button, Text) más los que pida el catálogo (al menos: fila de lista con ✓/✗, cuadritos de progreso, pastilla de pestaña activa, aviso con «Deshacer» **solo visual** —su lógica es de T07—, campo de texto, selector de tema). Copia de React Native Reusables los que falten **solo si no necesitas dependencias nuevas** (la lista aprobada está en `AGENTS.md`); si necesitas otra, pregunta.
5. **Barra de pestañas** (`(tabs)/_layout.tsx`): la activa con **pastilla** detrás del icono, iconos de `lucide-react-native`, contador en «Pendientes» como parámetro (el dato real lo da T11), y un acceso a Ajustes en la cabecera.
6. **Catálogo** en `src/app/(dev)/` (solo en desarrollo: que no aparezca en la web exportada de producción, por ejemplo con una comprobación de `__DEV__` o la exclusión que permita Expo Router; **comprueba que `expo export --platform web` no la publica** o explica cómo se excluye) con cada componente y sus estados (normal, pulsado, deshabilitado, error) **en los tres temas a la vez** (una cuadrícula o un selector).
7. **Contraste AA** (RNF-03): todos los pares de texto/fondo de los tres temas cumplen 4.5:1 (3:1 para texto grande); añade un **test** que calcule el contraste de los pares de tokens y falle si alguno no cumple. Si un color del diseño no cumple AA, **no lo cambies tú**: déjalo anotado en el informe con la medición (lo decide el humano). Zonas de toque de al menos 44 pt.
8. **Documentación**: en `docs/diseno.md`, añade una sección «Cómo usar los tokens» (qué clases usar, cómo cambiar de tema, cómo añadir un componente). Es lo único de `docs/` que tocas.
9. **Tests**: que el tema por defecto sigue al modo del móvil, que fijar uno lo guarda y lo recupera, que el catálogo se renderiza en los tres temas, y el de contraste.

## Fuera de alcance

- Pantallas de la app (Hoy, Bandeja…) más allá de la barra de pestañas y Ajustes; el añadir rápido (T16); el login (T02); `src/app/_layout.tsx`.
- Nuevas dependencias (salvo `expo-font`), `package.json` fuera de lo que instale `npx expo install` (anótalo), `docs/contexto.md`, `docs/05-plan.md`, Jira, otros encargos. Nada de morados con degradado ni neón. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador y, después, el humano)

- [ ] El catálogo enseña cada componente en los tres temas y se parece al prototipo aprobado (adjunta **capturas** del catálogo en cada tema: usa el MCP de Chrome sobre la versión web servida desde Docker, o una exportación; súbelas al PR en `docs/diseno/` si pesan poco, o descríbelas).
- [ ] Con el móvil en oscuro sale el Negro; en Ajustes se fija otro y se mantiene al cerrar la app.
- [ ] Contraste AA de todos los textos (test) o incumplimientos anotados con su medición.
- [ ] Lint, tipos, tests y exportación web pasan dentro de Docker; la CI del PR está en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-5` en el título; la descripción explica cómo verlo en el móvil (Expo Go) y en la web. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas, incluidos los colores que no cumplen AA; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
