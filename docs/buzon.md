# Buzón de ideas

Aquí deja el humano ideas, tareas o cambios **cuando quiera y sin formato especial**. El orquestador lo procesa al empezar cada sesión (ver «Autonomía por niveles» en [agentes/orquestador](agentes/orquestador.md#autonomía-por-niveles-dec-12)).

Para pedir control sobre una idea, añade al final:

- `[requiere-plan]`: quieres ver y aprobar cómo se hará antes de que empiece.
- `[requiere-revisión]`: quieres revisarla tú antes de que se dé por buena.

## Ideas nuevas

*(Una por línea, con fecha. Ejemplo: «2026-10-07 — Que el aviso de Deshacer dure 8 segundos [requiere-revisión]».)*

## Para el humano (lo deja el orquestador)

*(Decisiones tomadas o pendientes durante la ejecución, para revisar cuando vuelvas.)*

- 2026-10-07 — **Dependencias auxiliares de T01** (revísalo): el trabajador preguntó si podía añadir los paquetes que exigen NativeWind, React Native Reusables, Expo Router y lucide (`tailwindcss-animate`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@rn-primitives/portal`, `react-native-reanimated`, `react-native-worklets`, `react-native-safe-area-context`, `react-native-screens`, `react-dom`, `react-native-web`, `react-native-svg`). Lo autoricé leyendo `AGENTS.md` («las que ellas instalen por su cuenta»). Si no estás de acuerdo, dímelo y se quitan.
- 2026-10-07 — **Apagar el ordenador:** pediste apagarlo cuando acabe. Lo haré al terminar lo que pueda hacer esta noche, dejando todo guardado y subido.

- 2026-10-07 — **DECISIÓN TUYA, T02 (ADP-3): inicio de sesión con email.** En el Supabase local, `enable_signup = false` dentro de `[auth.email]` desactiva también el inicio de sesión con email («Email logins are disabled»). El trabajador propone poner solo `[auth.email] enable_signup = true` y dejar `[auth] enable_signup = false` (que es el que cierra el alta pública), comprobándolo con un test (`signUp` debe fallar con `signup_disabled`). Es un cambio de seguridad: **no lo autoricé** (mi permiso automático lo bloqueó, y la puerta de T02 es tuya). El PR queda con el resto hecho y un test pendiente. Si apruebas la propuesta, basta con cambiar esa línea y activar el test.
- 2026-10-07 — **PR #8 sin fusionar:** mi rama `docs/orquestador-ejecucion` (DEC-35, encargos 001 a 004, buzón y contexto) la bloqueó el permiso automático por ser una fusión sin revisión de otra persona. Está abierta; fusiónala cuando quieras.

## Procesadas

| Fecha | Idea | Qué se hizo |
|---|---|---|
| | | |
