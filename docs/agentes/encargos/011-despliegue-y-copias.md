# Encargo 011 — Despliegue, migraciones y copia de seguridad (T12)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

| Campo | Valor |
|---|---|
| Tarea del plan | `T12` en `docs/05-plan.md` |
| Ticket | `ADP-15` (solo informativo: no lo toques) |
| Agente | codex (esfuerzo alto: servicios reales y secretos) |
| Skills a usar | `source-driven-development`, `security-and-hardening`, `verification-before-completion`, `codigo-legible`, `flujo-git` (en `.agents/skills/`); a demanda, por su ruta: `.agents/skills-a-demanda/ci-cd-and-automation/SKILL.md`, `shipping-and-launch`, `vercel-cli`, `deployments-cicd`, `env-vars`, `access-protected-vercel-deployment` y `eas-app-stores` (solo la parte de `eas.json`) |
| Rama y worktree | `ADP-15-despliegue-y-copias`, desde `develop`, tu propio worktree |
| Depende de | T02 (fusionada) y H02 (hecha: el humano creó las cuentas y los tokens, DEC-33 y DEC-34) |
| Reservado para este encargo | `.github/workflows/deploy-*.yml`, `.github/workflows/backup.yml`, **en `.github/workflows/ci.yml` solo el punto 9**, `eas.json`, `vercel.json` (o la configuración de Vercel que pida su documentación), `scripts/backup/`, `app.json` **solo para el identificador del proyecto de EAS**, la sección de despliegue del `README.md` y la de comandos de `AGENTS.md` si cambia |

## Antes de empezar

Lee `AGENTS.md` entero, sobre todo las **prohibiciones 3, 6, 7, 9 y 10** y «Claves». Lee DEC-33, DEC-34 y **DEC-37** (puntos 4 y 7) en `docs/decisiones.md`, el apartado «Despliegue» de `docs/04-arquitectura.md`, R-07 y R-09 en `docs/06-riesgos.md`, y RNF-04 en `docs/02-funcionalidades.md`.

## Secretos: reglas que no se negocian

- Los tokens están en `~/.config/app-desarrollo-personal/secretos.env` (permisos 600): `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`, `EXPO_TOKEN` y `SUPABASE_DB_PASSWORD_PRODUCCION`. **Cárgalos en el entorno del proceso sin imprimirlos** (nada de `cat`, `echo $X`, `set -x` ni `--debug` con ellos). Si una herramienta los muestra en su salida, para y avísame.
- Los secretos nuevos que generes (contraseña de la base de `pruebas`, clave de cifrado de las copias) los creas con un generador aleatorio fuerte y **los añades a ese mismo fichero** (sin cambiar sus permisos) con los nombres `SUPABASE_DB_PASSWORD_PRUEBAS` y `BACKUP_PASSPHRASE`.
- A GitHub van con `gh secret set NOMBRE` leyendo el valor del entorno (por la entrada estándar), nunca escritos en la línea de órdenes. Los valores **públicos** (URL de Supabase, clave pública, identificadores de proyecto) van como **variables** de GitHub (`gh variable set`), no en el código.
- Nada de secretos en el repositorio, el PR, los registros de Actions, Jira ni tus mensajes. gitleaks lo comprueba en la CI.

## Qué hacer

1. **Supabase** (con la API de gestión o la CLI y `SUPABASE_ACCESS_TOKEN`): crea en la organización del humano **dos proyectos del plan gratuito**, `app-desarrollo-personal-pruebas` y `app-desarrollo-personal-produccion`, en la región **`eu-central-1` (Fráncfort)**. Producción usa `SUPABASE_DB_PASSWORD_PRODUCCION`; pruebas, la que generes. En los dos: **alta pública desactivada** (`disable_signup`), inicio de sesión con email activado y la URL del sitio apuntando a su web. Si en cualquier paso aparece un plan de pago, una tarjeta o un límite que obligue a pagar, **para y pregunta** (prohibición 6).
2. **Migraciones**: aplica las de `develop` a **pruebas** ahora (`supabase link` + `supabase db push`). **A producción no le apliques nada a mano**: solo lo hará el flujo de `main` (punto 5), con su copia previa. Comprueba en pruebas, con un usuario sintético creado por administración, que RLS funciona (un usuario sin sesión no lee nada) y que `signUp` falla.
3. **Vercel** (con `VERCEL_TOKEN` y la CLI de Vercel con versión fijada, `VERCEL_TELEMETRY_DISABLED=1`): crea el proyecto `app-desarrollo-personal` para la web **estática** que sale de `npx expo export --platform web` (`app.json` tiene `web.output: "static"`). Sigue la documentación oficial de Expo para alojar en Vercel, incluidas las **rutas dinámicas** (por ejemplo `/categorias/[id]`, que llegará con T10) y que recargar una ruta funcione. **Cabeceras de seguridad** (`Content-Security-Policy` que permita solo lo necesario —el propio sitio y el dominio de Supabase de cada entorno—, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`/`X-Frame-Options` y `Permissions-Policy`); comprueba con el MCP de Chrome que la página desplegada no da errores de CSP en la consola. Deja la protección de Vercel por defecto en las vistas previas.
4. **Flujos de despliegue** en `.github/workflows/`: la web se construye en Actions con las variables `EXPO_PUBLIC_*` del entorno que toque y se sube con la CLI de Vercel. **`develop` y los PR** contra `develop` → base de **pruebas** (`deploy-preview.yml` publica una vista previa por PR y deja su URL en un comentario del PR; `deploy-pruebas.yml`, al fusionar en `develop`, aplica las migraciones a pruebas y publica la web de `develop`). Usa **entornos de GitHub** (`pruebas`, `produccion`) con sus secretos, y que `produccion` solo lo pueda usar la rama `main`.
5. **`deploy-produccion.yml`** (solo en push a `main`, que solo hace el humano): **primero la copia cifrada de producción** (la del punto 6), después `supabase db push` a producción y, por último, la web de producción en Vercel (`--prod`). Si la copia falla, no sigue (prohibición 7).
6. **Copia semanal** (`backup.yml`, DEC-37 punto 7): cada semana (y a mano con `workflow_dispatch`, con una entrada para elegir `produccion` o `pruebas`), volcado del esquema y los datos con la CLI de Supabase, **cifrado** con `gpg --symmetric --cipher-algo AES256` y la clave `BACKUP_PASSPHRASE`, y subido como **artefacto de Actions que caduca a los 90 días**. El script, en `scripts/backup/`, legible y con comentarios del porqué.
7. **Restauración probada** (RNF-04): mete datos sintéticos en **pruebas** (un usuario sintético, una categoría con una sección, un hábito con su regla y una marca, y dos tareas), lanza la copia de pruebas, descárgala (`gh run download`), descífrala y restáurala en el **Supabase local** (dentro de Docker); comprueba que las filas son las mismas. Pega la evidencia (recuentos por tabla en origen y en destino) en el informe. Antes de restaurar en local, avisa con `orca orchestration ask`: **el Supabase local es compartido** con otros trabajadores y una restauración lo cambiaría; espera mi respuesta para elegir el momento (o restaura en un esquema o base aparte, si la documentación lo permite sin pararlo). Al terminar, borra el usuario sintético y sus datos de pruebas.
8. **EAS** (con `EXPO_TOKEN`, `EXPO_NO_TELEMETRY=1` y `eas-cli` con versión fijada): vincula el proyecto (`eas init` en modo no interactivo, que escribe el identificador en `app.json`: es lo único que tocas de `app.json`) y escribe `eas.json` con un perfil `preview` que genere un **APK instalable** con las variables de **producción**, según la documentación oficial. **No lances ninguna compilación**: la primera se hace al publicar (H04).
9. **Minutos de CI**: hoy `ci.yml` corre dos veces por cada push a una rama con PR (`push` a `pedrojcros/**` y `pull_request`). Deja solo `pull_request` contra `develop` y `push` a `develop` y `main`, para no gastar el doble de los 2.000 minutos gratuitos al mes de un repositorio privado. No cambies nada más de `ci.yml`.
10. **README**: sección «Despliegue» con qué hay en cada entorno, cómo se despliega cada rama, cómo **restaurar** una copia (paso a paso), cómo **reactivar Supabase** si se pausa por inactividad (R-07) y **cómo crea el humano su usuario de producción** en el panel de Supabase (DEC-37 punto 4: Authentication → Users → Add user, con «Auto Confirm User»; ningún agente crea ese usuario ni ve su contraseña).

## Fuera de alcance

Crear el usuario del humano en producción; tocar los datos de producción (está vacía y así sigue); compilar con EAS; dominios propios; cualquier plan de pago; pantallas y código de la app; `package.json` (si necesitas una herramienta, por `npx` con versión fijada dentro de los flujos o del contenedor, nunca como dependencia); Jira; `docs/contexto.md`; otros encargos. **No hagas merge.** El Supabase local es compartido: no hagas `db reset`, `stop` ni `start` sin preguntarme.

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Los dos proyectos de Supabase existen en el plan gratuito, con alta pública desactivada; las migraciones de `develop` están en pruebas y **nada** en producción.
- [ ] **El PR de este encargo obtiene su vista previa en Vercel** (comentario con la URL), la página carga contra pruebas, sin errores de CSP, y un usuario sintético de pruebas puede entrar.
- [ ] Una copia de pruebas se restaura en local con los mismos datos (evidencia de recuentos).
- [ ] `eas.json` sigue la documentación oficial de EAS (enlace en el PR); sin compilaciones lanzadas.
- [ ] Secretos solo en `secretos.env` y en GitHub; gitleaks en verde; ningún valor secreto en registros.
- [ ] Lint, tipos, tests y exportación web siguen en verde; CI del PR en verde.
- [ ] PR abierto **contra `develop`** con `ADP-15` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de las comprobaciones con comando y salida, **sin secretos**; enlace al PR) y `worker_done` con `--outcome succeeded|failed`. Incluye la lista de recursos creados (nombres y regiones, sin claves).
