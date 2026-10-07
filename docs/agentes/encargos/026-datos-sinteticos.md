# Encargo 026 — Datos sintéticos de un año y medida de RNF-01 (T13, primera parte)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | `T13` en `docs/05-plan.md` (primera parte: datos sintéticos y RNF-01; los flujos de Maestro van en otro encargo, después de T16) |
| Ticket | `ADP-17` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills a usar | `test-driven-development`, `codigo-legible`, `verification-before-completion` (en `.agents/skills/`) |
| Rama y worktree | `ADP-17-datos-sinteticos`, desde `develop`, tu propio worktree |
| Reservado para este encargo | `scripts/seed/` (entero) y un test de rendimiento nuevo `src/data/performance.integration.test.ts` |

## Antes de empezar

Lee `AGENTS.md` (regla de legibilidad, también en los scripts; **todo en Docker** con `./docker/app/run ...`; **sin dependencias nuevas**), RNF-01 en `docs/02-funcionalidades.md`, el esquema en `supabase/migrations/` (tablas `habits`, `habit_rules`, `habit_marks`, `tasks`, `categories`, `sections`) y `scripts/create-development-user.mjs` y `.sh`, que es el patrón a seguir: la clave de servicio se lee de `supabase status` en el momento y nunca se guarda. **El Supabase local es compartido** con otros trabajadores: no hagas `db reset`, `stop` ni `start`, y no borres datos de otros usuarios. **Lo pesado, de uno en uno:** `test:integration`, `test:zones`, `expo export` y `expo start` van con `flock /tmp/adp-pesado.lock ./docker/app/run ...`.

## Qué hacer

1. **Script de datos sintéticos** en `scripts/seed/`. Sigue el patrón de `create-development-user`: un `.sh` que lo lanza en Docker y un `.mjs` que hace el trabajo.
   - Crea o reutiliza un usuario propio (`seed@example.com` o el que se le pase) y **solo toca los datos de ese usuario**. Primero borra los que ya tenga, así que se puede repetir.
   - Genera **un año** hasta hoy, con fechas en la zona del dispositivo:
     - unas 8 categorías con secciones;
     - **50 hábitos** con las cuatro frecuencias, algunas con cambio de regla a mitad de año, y alguno archivado;
     - **2.000 tareas**: con fecha, sin fecha, vencidas, hechas y no hechas;
     - marcas de hábito para **unas 20.000 ocurrencias**, la mayoría marcadas y algunas sin marcar.
   - Debe ser **determinista**, con una semilla fija: dos ejecuciones dan los mismos datos.
   - **Se niega a funcionar** si la URL de la API no es local (`127.0.0.1`, `localhost` o el nombre del contenedor de Supabase). Nunca contra pruebas ni producción.
2. **Test de rendimiento** `src/data/performance.integration.test.ts`. Siembra al usuario sintético y, con su sesión, mide:
   - `fetchTodayView` (Hoy, de `src/data/today.ts`): por debajo de **500 ms**, la mitad del presupuesto de RNF-01 (el resto es para pintar en el móvil);
   - `fetchPastPending` (Pendientes) y la carga del historial de 30 días: cada uno por debajo de **1 segundo**.
   
   Toma la mediana de 5 ejecuciones tras una de calentamiento. Si un umbral no se cumple, **no lo subas ni optimices fuera de tu reserva**: dilo en el informe con los números.
3. **Documenta** en un `scripts/seed/README.md` corto cómo se usa y qué genera.

## Fuera de alcance

El código de la app y las consultas de `src/data` (salvo el test nuevo), `package.json`, los flujos de Maestro y `e2e/` (otro encargo), Jira, `docs/contexto.md` y otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] `./scripts/seed/<tu script>.sh` siembra el año en el Supabase local, y repetirlo da los mismos recuentos (dilos en el informe).
- [ ] Contra una URL no local, el script sale con un error claro sin escribir nada (con un test o una prueba manual descrita).
- [ ] El test de rendimiento pasa, o el informe dice qué umbral falla y con qué números.
- [ ] Lint, tipos y tests unitarios en verde dentro de Docker; CI del PR en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-17` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
