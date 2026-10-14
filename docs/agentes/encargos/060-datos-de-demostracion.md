# Encargo 060 — Datos de demostración en la web de pruebas

| Campo | Valor |
|---|---|
| Tarea del plan | Pulido visual 1.1.1, encargo 060 (`docs/propuestas/pulido-visual.md`, DEC-49) |
| Ticket | `ADP-33` (solo informativo: no lo toques) |
| Agente | codex |
| Modelo y esfuerzo | `gpt-6.1-sol`, esfuerzo por defecto (toca una protección de seguridad y la CI) |
| Skills a usar | `test-driven-development`, `codigo-legible`, `flujo-git` |
| Rama y worktree | Rama `ADP-33-datos-de-demostracion`, creada desde `develop`. Un worktree solo para este encargo |
| Depende de | Nada |
| Reservado para este encargo | `scripts/seed/**`, `.github/workflows/seed-pruebas.yml` (nuevo), `README.md` (solo las secciones de datos sintéticos y de despliegue), los tests nuevos de la siembra y, solo si hace falta para que Jest los recoja, `jest.config.js` |

## Antes de empezar

Lee `AGENTS.md` entero. Es obligatorio aunque tu herramienta lo cargue sola.

## Cómo trabajar (DEC-39)

- **Commits pequeños a menudo**, uno por paso terminado, con un mensaje que diga qué queda hecho: si tu sesión se corta, quien te sustituya sigue desde `git log` sin repetir nada.
- **En local, solo los tests de tu parte** (y lint y tipos); la batería completa la ejecuta la CI. Al terminar, cierra los contenedores y servidores que hayas arrancado.
- **El Supabase local es compartido** con otros worktrees: puedes usarlo si ya está arrancado (o arrancarlo si no lo está), pero **nunca** hagas `supabase db reset` ni `supabase stop`.
- Lee de la documentación solo lo que este encargo te señala.

## Objetivo

Que el humano pueda revisar la app en la web de pruebas (`https://app-desarrollo-personal-pruebas.vercel.app`, que publica `develop` contra el Supabase de **pruebas**) entrando con un usuario de demostración que tiene datos parecidos a su uso real, y que esos datos se puedan volver a sembrar con un botón. Producción nunca se toca.

## Contexto que necesitas

- `scripts/seed/README.md` y el código de `scripts/seed/` (siembra determinista de un año, solo en local; la protección está en `local-guard.mjs`).
- `src/data/performance.integration.test.ts`: usa el perfil actual y comprueba que el script rechaza una URL que no es local. **Ese test no cambia**: el perfil `year` sigue siendo el de por defecto.
- `README.md`, sección «Despliegue»: entornos de GitHub `pruebas` y `produccion`, y cómo se usan sus secretos y variables en `.github/workflows/deploy-web.yml` y `backup.yml` (cópiales el estilo: Docker, versiones fijadas y telemetría apagada).
- Proyectos de Supabase (los dos `ref` ya son públicos en el repositorio):
  - **pruebas:** `oxkjbousfzkpkcrxdhqj`, URL `https://oxkjbousfzkpkcrxdhqj.supabase.co`;
  - **producción:** `cidrlwpsqkygnuxiffsu`, URL `https://cidrlwpsqkygnuxiffsu.supabase.co`.
- El entorno `pruebas` de GitHub ya tiene: variable `SUPABASE_PROJECT_REF`, `EXPO_PUBLIC_SUPABASE_URL`, y secretos `SUPABASE_ACCESS_TOKEN` y `PRUEBAS_DEMO_PASSWORD` (la contraseña del usuario de demostración, que eligió el humano).

## Qué hacer

1. **Perfil `realistic`** en el script de siembra, elegido con `SEED_PROFILE=realistic` (sin la variable, o con `year`, se comporta exactamente igual que hoy). Determinista, respecto a «hoy» (`SEED_TODAY` o la fecha del dispositivo), con nombres en español de la vida de un estudiante:
   - 4 categorías con alguna sección (por ejemplo Universidad, Salud, Casa, Compra) y algo en la Bandeja;
   - **10 hábitos**: 5 diarios (unos con hora exacta y otros con franja), 2 por días de la semana (uno, «Nadar», los miércoles a las 17:00), 1 cada N días, 1 mensual y 1 archivado;
   - **30 tareas**: unas 5 vencidas pendientes, 3 para hoy (una con hora), 8 en las próximas tres semanas, 6 sin fecha (por ejemplo, la lista de la compra) y 8 ya resueltas en el pasado (hechas, no hechas y 2 hechas tarde);
   - **90 días de historial** de los hábitos, con alrededor de un 75 % hechas, un 10 % no hechas y un 15 % sin marcar, y al menos un hábito con una racha en curso de más de una semana (hechas consecutivas hasta ayer).

   Usa el mismo modelo de datos y las mismas inserciones que el perfil `year`; no cambies el esquema ni añadas migraciones.
2. **Destino de pruebas en la protección** (`local-guard.mjs`). Variable `SEED_TARGET`:
   - sin valor o `local`: solo se acepta un Supabase local (lo de hoy);
   - `pruebas`: solo se acepta exactamente el host `oxkjbousfzkpkcrxdhqj.supabase.co` por `https`;
   - el host de **producción** (`cidrlwpsqkygnuxiffsu.supabase.co`) se rechaza **siempre**, con un mensaje que lo diga, sea cual sea `SEED_TARGET`;
   - cualquier otro valor de `SEED_TARGET` o cualquier otra URL, error.

   Además, con `SEED_TARGET=pruebas`: el correo tiene que ser `demo@example.com` (otro, error); la contraseña es obligatoria (`SEED_USER_PASSWORD`) y **nunca se genera ni se muestra**; la clave `service_role` se obtiene en el momento con `npx supabase projects api-keys --project-ref oxkjbousfzkpkcrxdhqj` (usa `SUPABASE_ACCESS_TOKEN` del entorno) y no se guarda ni se imprime. Todo se comprueba **antes** de escribir nada.
3. **Usuario de demostración**: `demo@example.com`, creado (o reutilizado) con la API de administración, igual que hoy el usuario de siembra. Al volver a sembrar, se borran **solo** los datos de ese usuario (como ya hace el script con el suyo); comprueba que el `user_id` que se va a limpiar es el de ese correo.
4. **Flujo manual** `.github/workflows/seed-pruebas.yml`: solo `workflow_dispatch` (nunca automático), entorno `pruebas`, `concurrency` para no solaparse con el despliegue a pruebas. Ejecuta la siembra con `SEED_TARGET=pruebas`, `SEED_PROFILE=realistic`, la URL de la variable del entorno y la contraseña del secreto `PRUEBAS_DEMO_PASSWORD`. Enmascara la clave `service_role` en cuanto la obtenga (`::add-mask::`) y no imprime nunca la contraseña. Permisos de `GITHUB_TOKEN` mínimos (`contents: read`).
5. **Envoltorio local**: que `scripts/seed/seed-synthetic-year.sh` (o un envoltorio hermano, si queda más claro) pase al contenedor `SEED_PROFILE`, `SEED_TARGET`, `SUPABASE_ACCESS_TOKEN` y la contraseña sin mostrarla, para que el orquestador pueda hacer la primera siembra en pruebas desde su ordenador mientras el flujo no está en `main` (GitHub solo ofrece «Run workflow» para los flujos que están en la rama por defecto, `main`).
6. **README:** cómo entrar en la web de pruebas con el usuario de demostración (la contraseña está en `secretos.env` como `PRUEBAS_DEMO_PASSWORD`; no la escribas), que la web de pruebas puede pedir antes la sesión de Vercel (está protegida), cómo volver a sembrar (el botón de Actions cuando el flujo esté en `main`; mientras, el envoltorio local) y que solo se borran los datos del usuario de demostración. Actualiza también `scripts/seed/README.md`.

## Fuera de alcance

- `docs/contexto.md`, la bitácora y `docs/decisiones.md` los actualiza el orquestador al cerrar: no los toques ni lo preguntes.
- **No ejecutes nada contra el Supabase de pruebas ni contra el de producción**, ni el flujo nuevo: la primera siembra en pruebas la hace el orquestador después de fusionar. Tú pruebas contra el local.
- No toques el código de la app (`src/` salvo los tests nuevos de la siembra), las migraciones, los otros flujos de `.github/workflows/`, ni `docker/`.
- Nada de dependencias nuevas: `@supabase/supabase-js` y la CLI de Supabase ya están.

## Criterio de hecho

- [ ] Tests de la protección para, como mínimo: local aceptado; pruebas aceptado con `SEED_TARGET=pruebas`; pruebas rechazado sin esa variable; producción rechazado con y sin la variable; otra URL rechazada; `SEED_TARGET` desconocido rechazado; correo distinto de `demo@example.com` rechazado en pruebas; contraseña ausente rechazada en pruebas.
- [ ] Tests del perfil `realistic` que comprueban sus recuentos (categorías, 10 hábitos por tipo, 30 tareas por grupo, 90 días, proporciones aproximadas de marcas, la racha en curso) y que es determinista (dos ejecuciones con el mismo `SEED_TODAY` dan lo mismo).
- [ ] El perfil `year` no cambia: `src/data/performance.integration.test.ts` sigue pasando sin tocarlo.
- [ ] Con el Supabase local, `SEED_PROFILE=realistic ./scripts/seed/seed-synthetic-year.sh` siembra sin errores (di en el informe qué recuentos salieron).
- [ ] `npm run lint`, `npm run typecheck` y los tests de tu parte pasan (con `./docker/app/run`).
- [ ] Ninguna contraseña, clave ni token en el código, en los tests, en el registro de los scripts ni en el del flujo.
- [ ] Cumple la regla de legibilidad de `AGENTS.md` (nombres en inglés; comentarios y commits en español)
- [ ] PR abierto **contra `develop`**, con `ADP-33` en el título. **No hagas merge**: lo decide el orquestador

## Documentación a actualizar

- `README.md` (secciones de datos sintéticos y de despliegue) y `scripts/seed/README.md`.

## Cómo informar al terminar

En la descripción del PR, con estos seis puntos y **en formato corto** (DEC-45). Sin repetir el encargo ni pegar salidas largas:

1. **Hecho:** qué has hecho, en tres líneas como mucho.
2. **Ficheros:** la lista, sin explicar cada uno.
3. **Decisiones:** las que has tomado tú, una línea cada una con su porqué. «Ninguna» si no hay.
4. **Dudas:** lo que no estaba especificado, una línea cada una. «Ninguna» si no hay.
5. **Tests:** el comando y el resultado en una línea. Si algo falla, el nombre del test y el error, nada más.
6. **PR:** el enlace.

Y al final, `worker_done` con un resumen de tres frases.
