# Encargo 007 — T02: inicio de sesión real y tests activados

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado. Trabajas **en el worktree y la rama que ya existen** de T02 (`pedrojcros/ADP-3-base-de-datos-y-acceso`, PR #10). Los trabajadores anteriores terminaron. **No abras otro PR**: commits pequeños sobre esta rama y `git push`; el PR #10 se actualiza solo.

| Campo | Valor |
|---|---|
| Tarea del plan | `T02` (cierre) |
| Ticket | `ADP-3` (solo informativo: no lo toques) |
| Agente | codex (esfuerzo alto: es seguridad) |
| Skills a usar | `security-and-hardening`, `supabase-postgres-best-practices`, `test-driven-development`, `verification-before-completion`, `codigo-legible`, `flujo-git` |
| Reservado | lo de T02 (`supabase/`, `src/data/supabase/`, `src/data/auth/`, `src/data/database.types.ts`, `src/app/login.tsx`, `src/app/_layout.tsx`, sus tests, `scripts/create-development-user.*`) y `README.md` para resolver conflictos |

## Antes de empezar

Lee `AGENTS.md` entero (regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español; **todo se ejecuta en Docker** con `./docker/app/run ...`). Lee la descripción del PR #10 (`gh pr view 10`), sobre todo los apartados «Bloqueo» y «Correcciones tras la revisión».

## Lo que ha decidido el humano

El humano **aprueba** el cambio propuesto en el PR: en `supabase/config.toml`, poner **`[auth.email] enable_signup = true`** y **mantener `[auth] enable_signup = false`**. Motivo: en la Supabase CLI 2.120.0, `[auth.email] enable_signup` se traduce a `GOTRUE_EXTERNAL_EMAIL_ENABLED` (sin él no se puede ni iniciar sesión con email), mientras que `[auth] enable_signup = false` se traduce a `GOTRUE_DISABLE_SIGNUP=true`, que es lo que cierra el alta pública. Fuentes: [gotrue.service.ts de la CLI v2.120.0, líneas 333 y 340](https://github.com/supabase/cli/blob/v2.120.0/apps/cli/src/commands/start/services/gotrue.service.ts#L333), [signup.go de GoTrue](https://github.com/supabase/auth/blob/master/internal/api/signup.go#L107) y [token.go de GoTrue](https://github.com/supabase/auth/blob/master/internal/api/token.go#L85).

## Qué hacer

1. **Pon la rama al día con `develop`** (`git fetch origin && git merge origin/develop`): desde que se creó, en `develop` entraron T03 (motor de fechas) y T15 (emulador y navegador en Docker). Resuelve los conflictos (probablemente `README.md`) conservando lo de las dos partes. No uses `rebase` ni `push --force`.
2. **Cambia esa única línea** de `supabase/config.toml` con un comentario en español que explique el porqué (el de arriba, en dos líneas). Nada más de `config.toml`.
3. **Activa los tests que estaban omitidos** por el bloqueo (`describe.skip` en `src/data/supabase/session-persistence.integration.test.ts` y los que haya relacionados) y haz que pasen **con el inicio de sesión real**: usuarios creados con la API de administración (clave de servicio leída en ejecución, como ya hace la suite) y `signInWithPassword`. Deben cubrir: inicio de sesión correcto; contraseña incorrecta (error en español en la interfaz, código técnico en `src/data`); la sesión con **tokens reales** sobrevive a recrear el cliente con el mismo almacenamiento; la **renovación** del token funciona; `signUp` público **falla** con `signup_disabled`; `/auth/v1/settings` sigue diciendo `disable_signup: true`. **Ningún test queda omitido** al terminar.
4. **Quita los JWT fabricados** de `src/data/supabase/local-supabase.ts` (y donde se usen) si ya no hacen falta con el inicio de sesión real; si alguno sigue haciendo falta, explica por qué en el PR.
5. **Estabilidad**: el trabajador anterior vio que la primera ejecución de integración **justo después de `supabase db reset`** fallaba en bloque y pasaba al repetir (probable caché de esquema de PostgREST). Reprodúcelo (`db reset` y luego `npm run test:integration` una sola vez) y arréglalo de forma robusta en la preparación de los tests (por ejemplo, esperar con un límite de tiempo a que PostgREST conozca las tablas, o `notify pgrst, 'reload schema'` antes de empezar), **sin reintentos de tests**. Criterio: tres ciclos seguidos de `db reset` + una sola ejecución de la integración, los tres en verde.
6. **Prueba real en la web** (la parte que ve el humano): arranca Supabase local, crea el usuario de desarrollo con el script documentado (`scripts/create-development-user.sh`, credenciales sintéticas que no se guardan en ningún fichero), sirve la web (`./docker/app/run npm run web`; si el 8081 está ocupado, otro puerto) y, con el MCP de Chrome (perfil temporal y sin ventana), comprueba: sin sesión, cualquier ruta lleva al login; con email y contraseña correctos se entra a Hoy; al recargar la página se sigue dentro; con contraseña incorrecta sale el mensaje en español. Pega lo que veas (texto de la pantalla y URL) en el informe. Si el MCP de Chrome no está disponible en tu sesión, usa el contenedor de T15 (`docker compose run --rm --pull never -T -i chrome-mcp`, ya en `develop` tras el paso 1) o explica qué te lo impidió.
7. Actualiza la descripción del PR #10: quita «Bloqueo», añade «Inicio de sesión real» (qué se cambió y cómo se probó) y deja el resto.

## Fuera de alcance

Cualquier cosa fuera de T02; `package.json` (salvo que la fusión con `develop` lo traiga ya resuelto); `docs/` (salvo `README.md`); Jira; otros encargos. **No hagas merge del PR.** Otro trabajador puede usar el puerto 8081 o el 8090: usa uno libre (`ss -ltn`). Para tu Supabase local, si hay otro ya levantado con el mismo `project_id`, **no lo pares**: pregunta con `orca orchestration ask`.

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] `config.toml` cambiado solo en esa línea, con su comentario; el alta pública sigue cerrada (test).
- [ ] Cero tests omitidos; la integración pasa a la primera tras `db reset`, tres veces seguidas.
- [ ] Lint, tipos, tests unitarios, integración y exportación web en verde dentro de Docker; CI del PR #10 en verde (gitleaks incluido).
- [ ] La prueba en la web descrita en el punto 6, con evidencia.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
