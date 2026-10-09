# App desarrollo personal

Aplicación personal de tareas y hábitos para Android y navegador. El esqueleto
contiene cinco pestañas vacías: Hoy, Bandeja, Categorías, Pendientes e Historial.
Ya tiene la base de datos con RLS, el cliente de Supabase y el acceso con email y
contraseña (pantalla de login y protección de las pantallas); las pantallas de
datos y el sistema visual se implementan en tareas posteriores.

## Arrancar en local

Requisitos: Linux, Docker Engine y Docker Compose, con permiso para usar Docker.
Node, npm y Supabase CLI se ejecutan dentro del contenedor; no se instalan en el
anfitrión. La imagen fija Node 24.14.0 y Docker CLI 29.8.2.

Desde la raíz del repositorio:

```sh
./docker/app/run build
./docker/app/run npm ci
cp .env.example .env
./docker/app/run npx supabase start
./docker/app/run npm run web
```

Abre <http://localhost:8081/hoy> en el navegador. El servidor muestra también un
QR y una URL `exp://IP_DEL_ORDENADOR:8081` para Expo Go. Instala una versión de
Expo Go compatible con SDK 56 en Android (disponible en <https://expo.dev/go>),
conecta móvil y ordenador a la misma red y escanea el QR. El servidor usa LAN,
sin túnel. Si elige la IP de una VPN u otra interfaz, exporta
`REACT_NATIVE_PACKAGER_HOSTNAME` con la IP de tu red antes de arrancarlo.

Para arrancar solamente el servidor de Expo:

```sh
./docker/app/run npm run start
```

El envoltorio `docker/app/run` configura uid/gid y el grupo del socket de Docker
del anfitrión y ejecuta `docker compose run --rm app`. El código y `node_modules`
quedan en el repositorio, propiedad del usuario. Conserva la ruta absoluta del
repositorio dentro del contenedor para los montajes que necesita Supabase.
No hace falta instalar Node ni ejecutar npm fuera de Docker.

También puedes usar Compose directamente después de configurar esos identificadores:

```sh
export APP_UID=$(id -u)
export APP_GID=$(id -g)
export DOCKER_GID=$(stat -c '%g' /var/run/docker.sock)
docker compose up --build app
```

Supabase usa los puertos locales 54321 (API), 54322 (Postgres) y 54323 (Studio).
La configuración procede de `supabase init`, con registro desactivado. Las
migraciones de `supabase/migrations/` crean las tablas con sus políticas RLS;
`supabase db reset` las aplica desde cero. La clave de `.env.example`
es la clave anon pública del Supabase local, no una credencial de producción.
Expo Go accede al servidor de Expo por la IP del ordenador; como la app ya se
conecta a Supabase, para probarla en el móvil la URL de Supabase en `.env`
también debe usar esa IP.

## Usuario de desarrollo

La app tiene un único usuario, el dueño, y el registro está **desactivado**: no
existe pantalla de alta y el servidor rechaza `signUp` (`signup_disabled`). El
usuario se crea con la API de administración del Supabase local, con Supabase
arrancado:

```sh
./scripts/create-development-user.sh
```

El envoltorio pide el email y la contraseña por teclado (la contraseña no se
muestra ni queda en el historial) y los pasa al contenedor; `docker/app/run`
no reenvía las variables del anfitrión. También acepta `DEV_USER_EMAIL` y
`DEV_USER_PASSWORD` ya definidas en el entorno. El script de Node lee la clave de servicio de `supabase status` en el momento: no la
guarda en ningún fichero. Usa una contraseña de desarrollo, nunca la real, y no
la escribas en el repositorio. Los datos del usuario se borran con
`./docker/app/run npx supabase db reset`.

Los tipos de `src/data/database.types.ts` se generan y se formatean así:

```sh
./docker/app/run npx supabase gen types typescript --local > src/data/database.types.ts
./docker/app/run npx prettier --write src/data/database.types.ts
```

Para terminar, pulsa Ctrl+C en Expo y detén Supabase:

```sh
./docker/app/run npx supabase stop
```

## Emulador y navegador

Construye las imágenes una vez (Linux x86_64 con `/dev/kvm` accesible):

```sh
docker compose build android-emulator chrome-mcp
```

Prepara el emulador antes de los caminos críticos: esta orden recrea su
contenedor, elimina los candados del AVD y espera a Android y Expo Go. Si lo
comparte otro trabajador, pide turno al orquestador antes de ejecutarla:

```sh
./docker/android/reset
```

Comprueba su visibilidad desde el ordenador; `adb` y el programa del emulador
de `~/Android/Sdk` ya deben estar instalados para el panel de Orca (DEC-26,
opción B). No instales Node, Maestro ni Chromium en el anfitrión:

```sh
~/Android/Sdk/platform-tools/adb devices
orca emulator devices
docker compose exec -T android-emulator adb -s emulator-5554 shell getprop sys.boot_completed
```

Los dos primeros deben listar `emulator-5554`; el último debe responder `1`.
Selecciona ese dispositivo en el panel de emulador de Orca. Sirve la app en el
puerto 8090 y, desde otro terminal, ejecuta todos los flujos de Maestro. El
lanzador renueva el usuario local de pruebas para cada tamaño, ejecuta primero
con el tamaño normal del emulador y después a 360 dp, y restaura el tamaño y la
densidad originales:

```sh
./docker/app/run npm run start -- --port 8090
flock /tmp/adp-pesado.lock ./docker/app/run env EXPO_PORT=8090 npm run test:e2e
```

Los flujos cubren iniciar sesión, crear una tarea rápida desde Hoy, marcarla y
deshacer, crear un hábito semanal, crear una categoría con sección y tarea,
marcar una tarea vencida desde Pendientes y consultar el Historial. También se
conserva `e2e/smoke.yaml`. Los flujos llegan al anfitrión mediante `10.0.2.2`.
Maestro guarda los resultados en `/tmp/maestro-results` dentro del contenedor
del emulador, separados por tamaño y flujo. Para detener Expo, interrumpe su
terminal; para detener el emulador: `docker compose stop android-emulator`.

La entrada `chrome-devtools` de `.mcp.json` arranca su contenedor por stdio
con `docker compose run --rm --pull never -T -i chrome-mcp`. El MCP lanza
Chromium al abrir una página; prueba `http://localhost:8081/hoy` (o el puerto
elegido) después de servir la web con `./docker/app/run npm run web`.
Ejecuta el cliente MCP desde la raíz del repositorio. Si Codex tiene una
entrada global propia, configura allí el mismo comando de `.mcp.json`.
Cada sesión usa un perfil temporal, sin ventana, estadísticas ni CrUX.
Chromium corre como usuario sin privilegios; su sandbox interno se desactiva
porque Docker bloquea los namespaces que necesita. El contenedor del navegador
no monta el repositorio ni el socket Docker. Puedes comprobar el MCP real con
`./docker/app/run node docker/chrome-mcp/check.mjs` (admite `env EXPO_PORT=8090`).

Versiones fijadas: Debian trixie por digest, Android 36 Google APIs x86_64
revisión 7, cmdline-tools 23.0 (16111833), emulador 37.2.12, platform-tools
37.0.1, Maestro 2.11.0 y Expo Go 56.0.4; navegador sobre Node 24.14.0,
Chromium Debian 154.0.8037.92 y MCP 1.10.1. Todas las descargas Android,
Maestro y Expo Go verifican sus checksums; el APK viene de la
[release oficial de Expo](https://github.com/expo/expo-go-releases/releases/tag/Expo-Go-56.0.4).
El SDK usa los [archivos oficiales de Google](https://developer.android.com/studio).
Maestro lleva [las analíticas desactivadas](https://docs.maestro.dev/maestro-cli/environment-variables)
y su API apunta a un puerto local cerrado para impedir también los informes
de errores; no se usa Maestro Cloud. El
[MCP desactiva estadísticas y CrUX](https://github.com/ChromeDevTools/chrome-devtools-mcp#usage-statistics).
Las imágenes propias tienen `pull_policy: never`: si faltan, constrúyelas.
El emulador requiere KVM y se comprueba localmente, sin añadirlo a la CI.

## Comprobaciones

```sh
./docker/app/run npm run lint
./docker/app/run npm run typecheck
./docker/app/run npm run test
./docker/app/run npm run test:integration
./docker/app/run npx expo export --platform web
./docker/app/run npx expo install --check
```

La integración necesita Supabase arrancado y las variables de `.env`; comprueba
las restricciones de las tablas, que un usuario no ve ni cambia los datos de otro
(RLS, con dos usuarios por tabla), que la sesión sobrevive a cerrar y abrir y que
no permite registro. Los usuarios de prueba se crean con la API de administración,
leyendo la clave de servicio de `supabase status` en tiempo de ejecución. Rechaza URLs que no sean locales.
Jest prueba el botón con React Native Testing Library; la configuración de
integración usa Node y el cliente real de Supabase. La exportación queda en `dist/`.
`./docker/app/run npm run test:e2e` comprueba el arranque en Expo Go; necesita
el emulador preparado y Expo servido, como se explica arriba.

En cada PR a `develop`, la CI ejecuta lint, formato, tipos, tests, integración
y exportación dentro de Docker, y Gitleaks escanea el historial. Los cambios
solo de documentación omiten la batería cara; si el PR también cambia código,
se ejecuta completa. En `push` a `main` se repite la CI completa. En `develop`,
la fusión solo despliega a pruebas y aplica sus migraciones. Gitleaks usa su
imagen fijada, sin licencia de pago ni dependencias npm. `.gitleaks.toml` permite
únicamente la clave anon pública de `.env.example`; cualquier otro JWT se comprueba.

La vista previa de Vercel no se publica automáticamente: añade la etiqueta
`preview` al PR para solicitarla. También se puede iniciar manualmente desde
Actions. La CI reutiliza la caché de npm; Expo y Supabase CLI mantienen la
telemetría desactivada y el contenedor no abre aplicaciones gráficas del anfitrión.

## Despliegue

En pruebas y producción, `supabase db push --include-all` aplica también migraciones independientes de ramas paralelas fusionadas en distinto orden que sus fechas.

Los servicios son gratuitos. Supabase tiene dos proyectos en Fráncfort
(`eu-central-1`): `app-desarrollo-personal-pruebas` y
`app-desarrollo-personal-produccion`. Los dos tienen el alta pública desactivada
y permiten entrar con email y contraseña. Solo el humano crea su usuario real.

| Rama o acción                    | Base de datos | Publicación                                                                           |
| -------------------------------- | ------------- | ------------------------------------------------------------------------------------- |
| PR contra `develop`              | Pruebas       | Vista previa protegida de Vercel; URL en un comentario del PR                         |
| Push a `develop`                 | Pruebas       | Migraciones y web; alias estable `https://app-desarrollo-personal-pruebas.vercel.app` |
| Push a `main` (solo el humano)   | Producción    | Copia cifrada conservada, migraciones y web con `vercel --prod`                       |
| EAS `preview` (solo al publicar) | Producción    | APK instalable; ninguna compilación se lanza por abrir un PR                          |

Vercel publica únicamente la exportación estática de Expo, construida en Actions.
`vercel.mjs` conserva las rutas HTML existentes y sirve `index.html` para las
rutas dinámicas que Expo Router resuelve en el navegador (por ejemplo
`/categorias/[id]`). Por eso se puede recargar una URL sin recibir un 404 del
alojamiento. La CSP limita las conexiones al Supabase del entorno y permite los
scripts inline de Expo por su hash. React Native Web necesita estilos inline.
Zod valida sin JIT para que tampoco intente generar código con `eval`.
Las vistas previas conservan la protección de Vercel Authentication.

El proyecto Vercel es `app-desarrollo-personal`, en el equipo
`agentes-app-desarrollo-personal`; su dominio de producción asignado es
`https://app-desarrollo-personal-three.vercel.app`. Vercel promocionó el primer
despliegue de preparación automáticamente; apunta a **pruebas** y está protegido.
El primer push humano a `main` lo sustituirá por la web de producción.

### Configuración por entorno

Los entornos de GitHub `pruebas` y `produccion` contienen los secretos
`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `VERCEL_TOKEN`, `EXPO_TOKEN` y
`BACKUP_PASSPHRASE`. `produccion` solo permite la rama `main`.
Sus variables públicas son `SUPABASE_PROJECT_REF`, `EXPO_PUBLIC_SUPABASE_URL`,
`EXPO_PUBLIC_SUPABASE_ANON_KEY`, `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`.
No se guardan sus valores en git. EAS tiene las dos variables `EXPO_PUBLIC_*`
de producción en su entorno `production`; `eas.json` las selecciona para el APK.
Las versiones de las herramientas están fijadas: Vercel CLI 62.7.0 y EAS CLI
24.11.0, ejecutadas con telemetría desactivada y sin instalarlas en el anfitrión.

Si un despliegue falla, Actions se detiene. En producción, un error de volcado,
cifrado o subida del artefacto impide ejecutar las migraciones. Los despliegues
y las copias de cada base se serializan para evitar que una migración se
intercale en una copia. Para volver a la web anterior se usa el panel de Vercel
(Deployments → despliegue anterior → Instant Rollback); las migraciones se
corrigen con una nueva migración, nunca editando una aplicada.

### Copias cifradas

`backup.yml` copia producción los domingos a las 03:17 UTC. También permite
`workflow_dispatch` con `produccion` o `pruebas`; producción exige ejecutarlo
desde `main`. **Los cron y el botón manual solo estarán activos cuando el
humano publique estos ficheros en la rama por defecto, `main`.** Hasta entonces
producción permanece sin migraciones ni datos de la aplicación.

El archivo `backup-<entorno>-<run_id>` de Actions contiene únicamente un
`database.tar.gz.gpg`, cifrado con GPG AES256 y retenido 90 días (DEC-37).
Cada despliegue de producción conserva además su copia previa durante 90 días.
La validación de un PR que modifica los scripts o flujos de copia copia solo
**pruebas** y conserva ese artefacto **un día**.

El archivo incluye esquema de la aplicación, esquema gestionado de Auth y
Storage, datos (también usuarios y sesiones de Auth) e historial de migraciones. Antes de la primera migración, la ausencia de historial se comprueba mediante una consulta de solo lectura y sus dos ficheros quedan vacíos de SQL.
El script elimina el SQL temporal al terminar. No incluye archivos binarios de
Storage ni configuración de los servicios; la aplicación no utiliza Storage.
Conservar `BACKUP_PASSPHRASE` en `~/.config/app-desarrollo-personal/secretos.env`
(permisos 600) permite recuperar los datos aunque no se pueda entrar a GitHub.

### Restaurar una copia en una base local aislada

Este procedimiento se ha comprobado dentro del Postgres del Supabase local,
sin cambiar su base compartida `postgres`, detener servicios ni hacer `db reset`.
La base restaurada es para inspeccionar y comparar los datos; la aplicación
local sigue conectada a `postgres`. Coordina antes cualquier recuperación sobre
una base que ya contenga datos; producción requiere una copia recién hecha.

1. Elige en Actions una ejecución correcta de «Copia cifrada» o la validación
   de un PR. Copia su identificador y el nombre del artefacto. Prepara un
   directorio privado fuera del repositorio y descarga allí el archivo:

   ```sh
   umask 077
   restore_directory=$(mktemp -d)
   gh run download RUN_ID --name NOMBRE_DEL_ARTEFACTO --dir "$restore_directory"
   ```

2. Carga la clave sin imprimirla y descifra. La clave se envía por stdin;
   no uses `set -x`, `--debug` ni la pases como argumento:

   ```sh
   set -a
   . "$HOME/.config/app-desarrollo-personal/secretos.env"
   set +a
   printf '%s' "$BACKUP_PASSPHRASE" | gpg --batch --pinentry-mode loopback --passphrase-fd 0 --decrypt --output "$restore_directory/backup.tar.gz" "$restore_directory/database.tar.gz.gpg"
   tar -xzf "$restore_directory/backup.tar.gz" -C "$restore_directory"
   unset BACKUP_PASSPHRASE
   ```

3. Identifica el contenedor con `docker ps` (en este proyecto,
   `supabase_db_ADP-2-esqueleto-expo`). El nombre de la base elegida debe estar
   libre: si `CREATE DATABASE` falla, para, no borres la que ya existe.
   El usuario `supabase_admin` es necesario para restaurar los propietarios
   internos. Crea las piezas que Supabase provisiona fuera del volcado:

   ```sh
   database_container=supabase_db_ADP-2-esqueleto-expo
   docker exec "$database_container" psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -c 'CREATE DATABASE adp_restore'
   docker exec "$database_container" psql -U supabase_admin -d adp_restore -v ON_ERROR_STOP=1 -c 'CREATE SCHEMA extensions; CREATE SCHEMA vault; CREATE EXTENSION "uuid-ossp" WITH SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions; CREATE PUBLICATION supabase_realtime'
   ```

4. Restaura todo en una transacción que falla ante el primer error. El esquema
   gestionado se usa solo en esta **base vacía**; un Supabase ya provisionado
   tiene sus tablas internas y necesita una recuperación coordinada compatible
   con sus versiones de Auth y Storage.

   ```sh
   cat "$restore_directory/managed-schema.sql" "$restore_directory/schema.sql" "$restore_directory/history-schema.sql" "$restore_directory/data.sql" "$restore_directory/history-data.sql" | docker exec -i "$database_container" psql -U supabase_admin -d adp_restore --single-transaction --variable ON_ERROR_STOP=1
   ```

5. Compara los recuentos de `auth.users`, `public.categories`, `public.sections`,
   `public.habits`, `public.habit_rules`, `public.habit_marks` y `public.tasks`
   con los de origen, y los contenidos de las filas. Por ejemplo:

   ```sh
   docker exec "$database_container" psql -U supabase_admin -d adp_restore -c 'SELECT count(*) FROM public.tasks'
   ```

6. Después de verificar, elimina **solo la base aislada que acabas de crear**
   y el directorio temporal. El SQL descifrado contiene datos privados:

   ```sh
   docker exec "$database_container" psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -c 'DROP DATABASE adp_restore'
   rm -rf -- "$restore_directory"
   ```

### Reactivar Supabase tras una pausa

Si Supabase pausa un proyecto gratuito por inactividad (R-07), entra en su
panel, selecciona `app-desarrollo-personal-pruebas` o
`app-desarrollo-personal-produccion` y pulsa **Restore project**. Espera hasta
que vuelva a estar activo, comprueba que el inicio de sesión funciona y reintenta
el flujo fallido desde Actions. No crees otro proyecto ni ejecutes un reset.
Si el panel indica que la ventana de recuperación ha terminado, conserva la
última copia cifrada y coordina una restauración antes de modificar nada.

### Crear el usuario real de producción

Solo el humano: abre `app-desarrollo-personal-produccion` en Supabase y ve a
**Authentication → Users → Add user → Create new user**. Introduce su email y
una contraseña privada y activa **Auto Confirm User**. Después de publicar
`main`, entra con esas credenciales desde la web de producción o el APK.
No compartas la contraseña con ningún agente ni la guardes en el repositorio.
El alta pública seguirá desactivada (DEC-37, punto 4).

Fuentes oficiales: [Expo en Vercel](https://docs.expo.dev/guides/publishing-websites/#vercel),
[configuración programática de Vercel](https://vercel.com/docs/project-configuration/vercel-ts),
[copias y restauración de Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore),
[perfil APK de EAS](https://docs.expo.dev/build-reference/apk/),
[entornos de EAS](https://docs.expo.dev/eas/environment-variables/)
y [entornos protegidos de GitHub](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).

## Estructura

| Carpeta              | Contenido                                                           |
| -------------------- | ------------------------------------------------------------------- |
| `src/app/`           | Rutas de Expo Router y layouts                                      |
| `src/components/ui/` | Button y Text mínimos adaptados de React Native Reusables           |
| `src/theme/`         | CSS de NativeWind y ThemeProvider vacío para T14                    |
| `src/domain/`        | Reservada para la lógica pura                                       |
| `src/data/`          | Cliente de Supabase, acceso, tipos generados y tests de integración |
| `supabase/`          | Configuración local y migraciones (tablas y políticas RLS)          |
| `docker/app/`        | Imagen y envoltorio del entorno de desarrollo                       |
| `docs/`              | Documentación y plan del proyecto                                   |

## Fuentes de la configuración

- [Expo SDK 56 y sus versiones de React y React Native](https://docs.expo.dev/versions/v56.0.0/).
- [Instalación de Expo Router](https://docs.expo.dev/router/installation/) y [rutas en src/app](https://docs.expo.dev/router/reference/src-directory/).
- [NativeWind 4, Tailwind 3, Babel y Metro](https://www.nativewind.dev/docs/getting-started/installation).
- [Instalación manual de React Native Reusables](https://github.com/founded-labs/react-native-reusables/blob/385834c2196f8a303cbc9057d1ac768f3bde0a3b/apps/docs/content/docs/installation/manual.mdx). Los componentes conservan la composición y el contexto de texto; las variantes y los tokens quedan para T14.
- [Jest con Expo](https://docs.expo.dev/develop/unit-testing/). El renderer se fija a 19.2.3 mediante un override para coincidir con React y evitar que el peer de RNTL elija otra versión.
- [Persistencia de sesión con AsyncStorage en Expo](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native), que sigue el cliente de `src/data/supabase`.
- [Telemetría de Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started#telemetry) y [telemetría de Expo CLI](https://docs.expo.dev/more/expo-cli/#telemetry).

## Documentación

- Estado y siguiente paso: [docs/contexto.md](docs/contexto.md).
- Índice completo: [docs/README.md](docs/README.md).
- Reglas para agentes: [AGENTS.md](AGENTS.md).
