# App desarrollo personal

Aplicación personal de tareas y hábitos para Android y navegador. El esqueleto
contiene cinco pestañas vacías: Hoy, Bandeja, Categorías, Pendientes e Historial.
El acceso, los datos y el sistema visual se implementan en tareas posteriores.

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
La configuración procede de `supabase init`, con registro desactivado. No hay
tablas de aplicación ni migraciones; las creará T02. La clave de `.env.example`
es la clave anon pública del Supabase local, no una credencial de producción.
Expo Go accede al servidor de Expo por la IP del ordenador; cuando T02 conecte
la app a Supabase, la URL de Supabase en `.env` también deberá usar esa IP.

Para terminar, pulsa Ctrl+C en Expo y detén Supabase:

```sh
./docker/app/run npx supabase stop
```

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
que Auth responde y que no permite registro. Rechaza URLs que no sean locales.
Jest prueba el botón con React Native Testing Library; la configuración de
integración usa Node y el cliente real de Supabase. La exportación queda en `dist/`.
`test:e2e` y el emulador con Maestro quedan pendientes de T15.

La CI repite lint, formato, tipos, tests, integración y exportación dentro de
Docker. Gitleaks escanea el historial con su imagen fijada, sin licencia de pago
ni dependencias npm. `.gitleaks.toml` permite únicamente la clave anon pública
conocida en `.env.example`; cualquier otro JWT se sigue comprobando.
Expo y Supabase CLI llevan la telemetría desactivada; el
contenedor no abre aplicaciones gráficas del anfitrión.

## Estructura

| Carpeta              | Contenido                                                             |
| -------------------- | --------------------------------------------------------------------- |
| `src/app/`           | Rutas de Expo Router y layouts                                        |
| `src/components/ui/` | Button y Text mínimos adaptados de React Native Reusables             |
| `src/theme/`         | CSS de NativeWind y ThemeProvider vacío para T14                      |
| `src/domain/`        | Reservada para la lógica pura                                         |
| `src/data/`          | Reservada para Supabase y TanStack Query; test de integración inicial |
| `supabase/`          | Configuración local y carpeta vacía de migraciones                    |
| `docker/app/`        | Imagen y envoltorio del entorno de desarrollo                         |
| `docs/`              | Documentación y plan del proyecto                                     |

## Fuentes de la configuración

- [Expo SDK 56 y sus versiones de React y React Native](https://docs.expo.dev/versions/v56.0.0/).
- [Instalación de Expo Router](https://docs.expo.dev/router/installation/) y [rutas en src/app](https://docs.expo.dev/router/reference/src-directory/).
- [NativeWind 4, Tailwind 3, Babel y Metro](https://www.nativewind.dev/docs/getting-started/installation).
- [Instalación manual de React Native Reusables](https://github.com/founded-labs/react-native-reusables/blob/385834c2196f8a303cbc9057d1ac768f3bde0a3b/apps/docs/content/docs/installation/manual.mdx). Los componentes conservan la composición y el contexto de texto; las variantes y los tokens quedan para T14.
- [Jest con Expo](https://docs.expo.dev/develop/unit-testing/). El renderer se fija a 19.2.3 mediante un override para coincidir con React y evitar que el peer de RNTL elija otra versión.
- [Persistencia de sesión con AsyncStorage en Expo](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native); T02 implementará el cliente y el acceso.
- [Telemetría de Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started#telemetry) y [telemetría de Expo CLI](https://docs.expo.dev/more/expo-cli/#telemetry).
- [Modo sin interfaz gráfica del CLI de Expo](https://github.com/expo/expo/blob/sdk-56/packages/%40expo/cli/src/utils/env.ts).

## Documentación

- Estado y siguiente paso: [docs/contexto.md](docs/contexto.md).
- Índice completo: [docs/README.md](docs/README.md).
- Reglas para agentes: [AGENTS.md](AGENTS.md).
