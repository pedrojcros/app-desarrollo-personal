# Datos sintéticos

La siembra es determinista respecto a `SEED_TODAY` y el usuario. Si no se indica,
el envoltorio calcula hoy en la zona del anfitrión para local y en
`Europe/Madrid` para pruebas, antes de llamar a Docker. Una fecha explícita se
respeta tal cual. La llamada directa al script `.mjs` conserva su valor por
defecto: hoy en la zona del proceso. Reutiliza el usuario o lo crea mediante
la API de administración, comprueba su correo e identificador antes del borrado
y **borra únicamente sus datos** antes de insertar el perfil elegido.

## Uso local

Con Supabase local arrancado:

```sh
./scripts/seed/seed-synthetic-year.sh
SEED_PROFILE=realistic ./scripts/seed/seed-synthetic-year.sh
```

El usuario local por defecto es `seed@example.com`. Para entrar con él, define
`SEED_USER_PASSWORD` en el entorno antes de sembrar. Si no la defines, el
envoltorio genera una contraseña local aleatoria, sin imprimirla.

| Variable                | Para qué                                                      |
| ----------------------- | ------------------------------------------------------------- |
| `SEED_PROFILE`          | `year` (por defecto) o `realistic`; otros valores dan error.  |
| `SEED_TARGET`           | `local` (por defecto) o `pruebas`; otros valores dan error.   |
| `SEED_USER_EMAIL`       | Correo local alternativo; en pruebas solo `demo@example.com`. |
| `SEED_USER_PASSWORD`    | Contraseña; obligatoria en pruebas, nunca se imprime.         |
| `SEED_TODAY`            | «Hoy» como `YYYY-MM-DD`.                                      |
| `SEED_API_URL`          | API local alternativa; obligatoria y exacta en pruebas.       |
| `SUPABASE_ACCESS_TOKEN` | Token para obtener la clave de servicio de pruebas.           |

El envoltorio pasa las variables por su nombre a Docker, sin incluir los
secretos en la línea de comandos. No guarda la clave de servicio en archivos.

## Perfiles

`year` conserva los datos de rendimiento de RNF-01:

- 8 categorías con 18 secciones.
- 50 hábitos: 42 diarios, 3 por días de la semana, 3 cada N días y 2 mensuales.
  Seis cambian de regla a mitad de año, cinco empiezan tarde y tres están
  archivados. Unas 14.500 ocurrencias y 12.800 marcas en un año.
- 2.000 tareas con fecha y sin fecha, pendientes, resueltas y archivadas.

`realistic` permite revisar la interfaz con datos de un estudiante:

- Universidad, Salud, Casa y Compra, cada una con una sección, y elementos en
  la Bandeja.
- 10 hábitos: 5 diarios activos con horas o franjas, 2 por días de la semana
  (Nadar los miércoles a las 17:00), 1 cada 3 días, 1 mensual y 1 archivado.
- 30 tareas: 5 vencidas pendientes, 3 de hoy (una a las 12:00), 8 en las próximas
  tres semanas, 6 sin fecha y 8 resueltas en el pasado, incluidas 2 hechas tarde.
- Los 90 días anteriores a hoy de historial: aproximadamente 75 % hecho,
  10 % no hecho y 15 % sin marcar. Leer antes de dormir tiene una racha de
  14 días hechos hasta ayer; hoy queda sin marcar.

## Pruebas remotas

Solo el orquestador hace la primera siembra tras fusionar el PR. Para sembrar
desde su ordenador mientras el flujo no está en `main`, en una shell **sin
trazado de comandos** (`set -x` debe estar desactivado):

```sh
set +x
set -a
. "$HOME/.config/app-desarrollo-personal/secretos.env"
set +a
export SEED_USER_PASSWORD="$PRUEBAS_DEMO_PASSWORD"
SEED_TARGET=pruebas SEED_PROFILE=realistic \
  SEED_API_URL=https://oxkjbousfzkpkcrxdhqj.supabase.co \
  ./scripts/seed/seed-synthetic-year.sh
unset SEED_USER_PASSWORD
```

No escribas la contraseña ni el token en el comando. El correo por defecto en
pruebas es `demo@example.com`. Cuando `seed-pruebas.yml` esté en `main`, también
se podrá repetir desde Actions → **Sembrar demostración en pruebas** →
**Run workflow**. Usa el entorno GitHub `pruebas` y su secreto
`PRUEBAS_DEMO_PASSWORD`; se serializa con el despliegue y las copias de pruebas.

## Seguridad y pruebas

Sin `SEED_TARGET`, o con `local`, solo se aceptan `localhost`, `127.0.0.1`,
`[::1]` o un contenedor `supabase_*`. La clave local se obtiene de
`supabase status` en memoria.

Con `SEED_TARGET=pruebas` se exige exactamente
`https://oxkjbousfzkpkcrxdhqj.supabase.co`, el correo `demo@example.com` y una
contraseña explícita. Antes de escribir, la CLI obtiene la clave `service_role`
con `supabase projects api-keys --project-ref oxkjbousfzkpkcrxdhqj -o json`,
usando el token del entorno; su salida se captura, nunca se imprime ni guarda.
En Actions se emite `::add-mask::` inmediatamente al obtenerla. **Producción
(`cidrlwpsqkygnuxiffsu.supabase.co`) se rechaza siempre.** Ningún otro destino
remoto está permitido.

`src/data/seed.test.ts` prueba la protección, la identidad y la gestión de claves,
y `src/data/seed-profile.test.ts` comprueba el perfil realista, sin peticiones
remotas. `src/data/seed.integration.test.ts` comprueba la resiembra y la
conservación de los datos de otro usuario contra Supabase local.
`src/data/performance.integration.test.ts` sigue usando `year` en Supabase local
y comprueba las consultas de Hoy, Pendientes e historial, además del rechazo de
una URL remota sin destino explícito.
