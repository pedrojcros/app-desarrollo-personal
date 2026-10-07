# Datos sintéticos de un año

Siembra en el Supabase **local** un año de datos para medir el rendimiento
(RNF-01). Es determinista: dos ejecuciones dan los mismos datos.

## Uso

Con Supabase arrancado:

```sh
./scripts/seed/seed-synthetic-year.sh
```

Crea (o reutiliza) el usuario `seed@example.com`, **borra los datos que ya tenga
ese usuario** y vuelve a sembrarlos. Si no pones contraseña, genera una y la
muestra. Variables opcionales:

| Variable             | Para qué                                                              |
| -------------------- | --------------------------------------------------------------------- |
| `SEED_USER_EMAIL`    | Otro usuario de siembra (solo se tocan sus datos).                    |
| `SEED_USER_PASSWORD` | Su contraseña.                                                        |
| `SEED_TODAY`         | «Hoy» como `YYYY-MM-DD`; por defecto, hoy en la zona del dispositivo. |

## Qué genera

- 8 categorías con 18 secciones.
- 50 hábitos: 42 diarios, 3 por días de la semana, 3 cada N días y 2 mensuales.
  Seis cambian de regla a mitad de año, cinco empiezan tarde y tres están
  archivados. Eso son unas 14.500 ocurrencias en el año (con 50 hábitos no caben
  20.000: el máximo es 50 × 365 = 18.250), de las que unas 12.800 llevan marca
  (la mayoría `done`, algunas `not_done`, el resto sin marcar).
- 2.000 tareas: con fecha (vencidas, de hoy y futuras), sin fecha, hechas,
  no hechas, pendientes y algunas archivadas.

## Seguridad

Se niega a funcionar (y sale con error sin escribir nada) si la URL de la API no
es `localhost`, `127.0.0.1`, `[::1]` o un contenedor `supabase_*`. La clave de
servicio se lee de `supabase status` en el momento y no se guarda.

## Prueba

`src/data/performance.integration.test.ts` siembra un usuario propio con este
script y mide Hoy (< 500 ms), Pendientes y el historial de 30 días (< 1 s),
con la mediana de 5 ejecuciones tras una de calentamiento. También comprueba que
el script rechaza una URL que no es local.
