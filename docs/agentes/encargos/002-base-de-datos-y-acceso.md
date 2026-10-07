# Encargo 002 — Base de datos y acceso de un solo usuario (T02)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

| Campo | Valor |
|---|---|
| Tarea del plan | `T02` en `docs/05-plan.md` |
| Ticket | `ADP-3` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` (tarea delicada: seguridad; la revisará después un modelo distinto) |
| Skills a usar | `supabase-postgres-best-practices`, `security-and-hardening`, `source-driven-development`, `test-driven-development`, `codigo-legible`, `flujo-git` (en `.agents/skills/`); además la skill `supabase:supabase` si la tienes |
| Rama y worktree | `ADP-3-base-de-datos-y-acceso`, desde `develop`, tu propio worktree |
| Depende de | T01 (ya fusionada en `develop`) |
| Reservado para este encargo | **todas las migraciones de la versión 1** (`supabase/migrations/`); `src/data/supabase/` (el cliente); `src/data/auth/`; `src/data/database.types.ts`; `src/app/login.tsx`; y, solo para proteger las pantallas, `src/app/_layout.tsx` |

## Antes de empezar

Lee `AGENTS.md` entero (prohibiciones, regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español; comandos: **todo se ejecuta en Docker** con `./docker/app/run ...`), `docs/adr/0004-acceso-un-usuario.md`, `docs/adr/0003-ocurrencias-calculadas.md` y el modelo de datos de `docs/04-arquitectura.md#modelo-de-datos`. La puerta de esta tarea es `requiere-revisión` del humano (seguridad): **tu PR no se fusionará esta noche**; déjalo muy bien explicado.

## Objetivo

Que existan las tablas del modelo de datos con sus restricciones y RLS, que se pueda iniciar sesión con email y contraseña, que sin sesión no se vea ninguna pantalla salvo el login, y que haya tipos de TypeScript generados.

## Qué hacer

1. **Migraciones** en `supabase/migrations/` (numeradas por fecha como hace la CLI; una migración aplicada no se edita), con las tablas de `docs/04-arquitectura.md`: `categories`, `sections`, `habits`, `habit_rules`, `habit_marks`, `tasks`. Tablas y columnas en inglés, `snake_case`, tablas en plural.
   - **Toda tabla lleva `user_id`** (también `habit_rules` y `habit_marks`, aunque el modelo no lo liste: lo exige `AGENTS.md`; es una consecuencia de la regla, no un cambio de modelo) y **RLS activado con políticas** para `select`, `insert`, `update` y `delete` limitadas a `user_id = (select auth.uid())`. `user_id` referencia `auth.users` con borrado en cascada y, por defecto, `auth.uid()`.
   - Restricciones del modelo: nombre de categoría **único por usuario sin distinguir mayúsculas** (índice único sobre `lower(name)`); nombre de sección único dentro de su categoría; `category_id` vacío = Bandeja (`null`); `section_id` vacío = sin sección y, si existe, **debe pertenecer a la misma categoría** que el hábito o tarea (clave foránea compuesta o disparador, lo que sea más simple y comprobable); en `habits`, `time_of_day` y `time_slot` **nunca los dos a la vez** (`check`); `time_slot` solo `morning`, `afternoon`, `night`; `frequency` solo `daily`, `weekdays`, `every_n_days`, `monthly`; `status` de marcas solo `done`/`not_done`, y de tareas `pending`/`done`/`not_done`; `habit_marks` con clave única (`habit_id`, `occurrence_date`); `interval_days` entero ≥ 1 cuando la frecuencia es `every_n_days`; nombres no vacíos.
   - **Contrato con T03 (motor de ocurrencias), no lo cambies:** `habit_rules.weekdays` es un array de enteros pequeños con **días ISO: 1 = lunes … 7 = domingo**; las fechas de calendario (`start_date`, `valid_from`, `occurrence_date`, `due_date`) son tipo `date`; `time_of_day` y `due_time` son tipo `time`; los instantes (`marked_at`, `archived_at`) son `timestamptz`.
   - Índices en las columnas de las políticas y de las claves foráneas.
   - **Registro de usuarios desactivado** (ya lo está en `supabase/config.toml`; no lo cambies) y el servidor no acepta el alta pública. Dentro de la **versión 1 no hace falta ninguna pantalla de registro**.
2. **Cliente de Supabase** en `src/data/supabase/`: crea el cliente con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`, guardando la **sesión en el dispositivo** como dice la guía oficial de Supabase para Expo (con `@react-native-async-storage/async-storage`, ya instalado; en la web, `localStorage`). **La clave `service_role` nunca va en la app.**
3. **Acceso** en `src/data/auth/`: funciones `signInWithPassword`, `signOut` y un hook `useSession` (sesión actual y estado de «cargando»). Siguen la convención de `AGENTS.md`: devuelven `{ ok: true, value }` o `{ ok: false, error: { code, message } }`; la interfaz muestra textos en español y **nunca un error técnico**. Valida con Zod antes de llamar.
4. **Login** en `src/app/login.tsx`: email y contraseña, botón «Entrar», errores en español («Email o contraseña incorrectos», «No se ha podido conectar. Inténtalo de nuevo»). Usa los componentes de `src/components/ui`; no inventes estilo (lo trae T14): sobrio y funcional.
5. **Protección de pantallas** en `src/app/_layout.tsx` (la única tarea que puede tocarlo después de T01): sin sesión, todo redirige al login; con sesión, el login redirige a Hoy. Mientras se comprueba la sesión, no parpadea el contenido protegido. Usa el mecanismo de Expo Router para rutas protegidas (`Stack.Protected` u otro oficial de la versión instalada: comprueba en su documentación).
6. **Tipos generados**: `src/data/database.types.ts` con `supabase gen types typescript --local` (dentro de Docker) y úsalos para tipar el cliente. Añade un script en `package.json` **solo si es imprescindible** y dilo (solo T01 toca `package.json`: si necesitas tocarlo para un script, es una excepción que debes anotar en el informe).
7. **Tests** (todo contra el Supabase local real, nunca un sustituto en memoria):
   - **Integración con dos usuarios**: un usuario no ve ni cambia (select, insert con `user_id` ajeno, update, delete) los datos del otro, **en cada tabla**. Crea los usuarios de prueba con la API de administración **leyendo la clave de servicio del Supabase local en tiempo de ejecución** (por ejemplo, de la salida de `supabase status`), **sin escribirla en ningún fichero del repositorio** ni en la CI de forma que quede en un registro (gitleaks la detectaría).
   - Restricciones: nombre de categoría duplicado con otra capitalización falla; `time_of_day` y `time_slot` juntos fallan; sección de otra categoría falla; marca duplicada falla; el alta pública de usuarios falla.
   - Componentes: el login muestra el error en español y llama al acceso; la protección redirige sin sesión (con el acceso simulado, es un test de componente).
   - Que la sesión sobrevive a cerrar y abrir la app se comprueba en el test del cliente con un almacenamiento simulado que persiste entre dos creaciones del cliente.
8. **Documentación**: añade a `README.md` una sección corta «Usuario de desarrollo»: cómo crear el usuario del dueño en el Supabase local (por ejemplo, con la CLI o un script documentado, **sin contraseñas reales ni claves en el repositorio**) y que el registro está desactivado. Actualiza `AGENTS.md` solo si cambia algún comando.

## Contrato

El modelo de datos de `docs/04-arquitectura.md` es el contrato del resto de tareas: los nombres de tablas y columnas que dejes serán los que usen T04 a T13. Los tipos generados son la fuente de verdad. **No cambies el modelo ni añadas tablas fuera de él** más allá de lo dicho (columnas `user_id`).

## Fuera de alcance

- Pantallas de la app más allá del login; estilo (T14); motor de ocurrencias (T03); funciones de lectura/escritura de categorías, hábitos, tareas o marcas (T04 y siguientes).
- Registro público, «olvidé mi contraseña», Google (versión 2).
- Proyectos reales de Supabase, Vercel o Expo, ni producción: **solo el Supabase local** (T12 hará el resto).
- No añadas dependencias fuera de las aprobadas. No toques `docs/contexto.md`, `docs/05-plan.md`, Jira ni otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] `./docker/app/run npx supabase start` (o `db reset`) aplica las migraciones desde cero sin errores.
- [ ] Un test de integración con dos usuarios demuestra que uno no ve ni cambia los datos del otro, en **todas** las tablas.
- [ ] Sin sesión no se ve ninguna pantalla salvo el login; con sesión se entra a Hoy; la sesión sobrevive a cerrar y abrir (test).
- [ ] Lint, tipos, tests unitarios y de integración y exportación web pasan dentro de Docker; la CI del PR está en verde (gitleaks incluido).
- [ ] No hay claves ni contraseñas en el repositorio.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-3` en el título; descripción con: qué tablas y políticas hay, cómo se probó el aislamiento entre usuarios y cómo revisar la seguridad. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
