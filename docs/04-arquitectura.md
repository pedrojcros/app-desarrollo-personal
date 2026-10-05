# Arquitectura

Forma del sistema, tecnología y convenciones. Las decisiones importantes tienen su propia ADR en [adr/](adr/README.md); aquí se enlazan, no se repiten.

*Estado: **BORRADOR** (sesión 5, 2026-10-06). ADR-0003 y ADR-0004 esperan el «ok» del humano (DEC-21).*

## Restricciones

Coste cero, un solo usuario, en internet desde la versión 1, solo ordenador en la versión 1, sin fecha límite. Detalle en [01-vision-y-alcance](01-vision-y-alcance.md#restricciones).

## Estrategia de solución

1. **Una sola aplicación Next.js en TypeScript, con Supabase y Vercel gratis** → [ADR-0001](adr/0001-stack.md)
2. **La lógica del producto es una función pura**: las ocurrencias se calculan, solo se guardan las marcas, y las fechas son de calendario → [ADR-0003](adr/0003-ocurrencias-calculadas.md)
3. **Un único usuario protegido en la base de datos** (RLS), no solo en la aplicación → [ADR-0004](adr/0004-acceso-un-usuario.md)
4. **`develop` integra, `main` publica** → [ADR-0002](adr/0002-ramas-y-fusion.md)

## Stack

| Parte | Tecnología | Por qué |
|---|---|---|
| Lenguaje | TypeScript en modo estricto | Un solo lenguaje para pantallas y servidor |
| Aplicación | Next.js (App Router) con React | Pantallas y servidor en un proyecto (ADR-0001) |
| Estilos | Tailwind CSS | Lo trae Next.js de serie; sin librerías de componentes |
| Datos e inicio de sesión | Supabase: PostgreSQL y Auth | Gratis, estándar, con RLS |
| Validación | Zod | Validar la entrada en el borde (cada acción de servidor) |
| Alojamiento | Vercel (plan Hobby) | Gratis; despliegue de prueba por PR |
| Pruebas | Vitest y Playwright | Unitarias, integración y extremo a extremo |
| Calidad | ESLint, Prettier y gitleaks en la integración continua | Linter, formato y escaneo de secretos |

Las versiones exactas viven en `AGENTS.md`, que es lo que leen todos los agentes; las fija la tarea T01.

## Contexto del sistema

```
                 ┌──────────────────────┐
   El dueño ────►│ Navegador (ordenador)│
                 └──────────┬───────────┘
                            │ HTTPS
                 ┌──────────▼───────────┐        ┌────────────────────────┐
                 │ Vercel               │        │ Supabase               │
                 │ Aplicación Next.js   ├───────►│ PostgreSQL + Auth      │
                 │ (pantallas y         │        │ (RLS: cada fila, de    │
                 │  acciones)           │        │  su dueño)             │
                 └──────────┬───────────┘        └────────────────────────┘
                            │ solo en la versión 2
                    ┌───────▼────────┐
                    │ Google Calendar│
                    └────────────────┘
```

## Estructura interna

Por **capas**, porque el dominio es pequeño y la regla que importa es que la lógica pura no dependa del framework:

```
src/domain/      Lógica pura: fechas de calendario, motor de ocurrencias y reglas de
                 cada vista. Sin Next.js, sin Supabase, sin entrada ni salida.
src/data/        La ÚNICA capa que habla con Supabase: lectura y escritura por entidad
                 y acciones de servidor.
src/app/         Rutas y pantallas: /hoy, /bandeja, /categorias, /pendientes,
                 /historial, /login. Usan src/data, nunca Supabase directamente.
src/components/  Componentes compartidos: aviso con «Deshacer», selector de categoría,
                 navegación.
supabase/        Configuración local y migraciones SQL numeradas.
tests/e2e/       Pruebas de extremo a extremo.
```

**Next.js, acotado** para que el código se pueda revisar: componentes de servidor para **leer**, acciones de servidor para **escribir**, componentes de cliente **solo** donde hay interacción (marcar, aviso, formularios). Sin rutas de API salvo `/api/health` (y Calendar en la versión 2).

## Modelo de datos

Nombres en inglés (DEC-06); ver el [glosario](#glosario). **Cambiarlo requiere aprobación** (`AGENTS.md`).

| Tabla | Qué guarda | Campos principales |
|---|---|---|
| `categories` | Categorías | `id`, `user_id`, `name` (único por usuario, sin distinguir mayúsculas) |
| `habits` | Hábitos | `id`, `user_id`, `category_id` (vacío = Bandeja), `name`, `start_date`, `time_of_day` o `time_slot` (`morning`, `afternoon`, `night`), `duration_minutes`, `archived_at` |
| `habit_rules` | Versiones de la regla de repetición | `id`, `habit_id`, `valid_from`, `frequency` (`daily`, `weekdays`, `every_n_days`, `monthly`), `weekdays`, `interval_days` |
| `habit_marks` | Marcas de ocurrencias | `habit_id`, `occurrence_date`, `status` (`done`, `not_done`), `marked_at`; clave única (`habit_id`, `occurrence_date`) |
| `tasks` | Tareas | `id`, `user_id`, `category_id` (vacío = Bandeja), `name`, `notes`, `due_date`, `due_time`, `status` (`pending`, `done`, `not_done`), `marked_at`, `archived_at` |

Las ocurrencias **no son filas**: se calculan (ADR-0003). «Cada mes» usa el día de `valid_from`. Todas las tablas tienen RLS por `user_id` (ADR-0004).

## Conceptos transversales

| Tema | Decisión |
|---|---|
| Autenticación y autorización | Supabase Auth con email y contraseña, registro desactivado y RLS en todas las tablas ([ADR-0004](adr/0004-acceso-un-usuario.md)) |
| Gestión de errores | Las acciones devuelven `{ ok: true, value }` o `{ ok: false, error: { code, message } }`. Códigos y mensajes técnicos en inglés; la interfaz muestra textos en español y nunca un error técnico |
| Registros (*logs*) | JSON por consola (se ven en Vercel), sin datos personales ni secretos |
| Configuración y secretos | Variables de entorno; `.env.example` versionado. Las claves de Supabase viven en Vercel y en GitHub, nunca en el repositorio. La clave `service_role` nunca llega al navegador |
| Fechas y zonas horarias | Fechas de calendario en Europe/Madrid e instantes en UTC ([ADR-0003](adr/0003-ocurrencias-calculadas.md)) |
| Internacionalización | No: la interfaz solo en español |
| Datos personales | Solo los del dueño; nunca en registros; exportación propia (RNF-04) |
| Validación | Zod en cada acción de servidor |

## Estrategia de pruebas

| Nivel | Qué prueba | Herramienta | Cuándo corre |
|---|---|---|---|
| Unitarias | `src/domain`: motor de ocurrencias, fechas y reglas de cada vista | Vitest | Cada commit y PR |
| Integración | `src/data` contra un Supabase local real (Docker), incluidas las políticas RLS | Vitest y Supabase CLI | Cada PR |
| Extremo a extremo | Caminos críticos: entrar, crear un hábito, marcar en Hoy con «Deshacer», resolver pendientes | Playwright | Cada PR |

Qué exige test sí o sí: todo `src/domain`, con casos de cambio de hora, fin de mes, «cada N días» y versiones de la regla; las políticas RLS, con dos usuarios (uno no ve los datos del otro); y cada acción de servidor.

## Despliegue

- **Producción:** Vercel despliega `main` contra el proyecto Supabase `produccion`.
- **Pruebas:** Vercel despliega `develop` y cada PR contra el proyecto Supabase `pruebas`.
- **Local y tests:** siempre Supabase local (Docker), nunca un proyecto remoto.
- **Migraciones:** la integración continua las aplica a `pruebas` al fusionar en `develop`, y a `produccion` solo desde `main`, que solo toca el humano al publicar.
- **Vuelta atrás:** Vercel permite volver al despliegue anterior; las migraciones solo van hacia delante (para deshacer, una migración nueva).
- **Copias:** exportación semanal automática y una restauración probada antes del uso diario (RNF-04).
- **Pausa de Supabase:** ver R-07 en [06-riesgos](06-riesgos.md).

## Glosario

Los términos del dominio se definen en [03-casos-de-uso](03-casos-de-uso.md#vocabulario). En el código se llaman así:

| Término | En el código |
|---|---|
| Hábito | `habit` |
| Regla de repetición (y sus versiones) | `habitRule` / `habit_rules` |
| Ocurrencia | `occurrence` |
| Marca | `mark` / `habit_marks` |
| Tarea | `task` |
| Categoría | `category` |
| Bandeja de entrada | `inbox` (categoría vacía) |
| Franja: mañana, tarde, noche | `timeSlot`: `morning`, `afternoon`, `night` |
| Pendiente, hecha, no hecha | `pending`, `done`, `not_done` |
| Sin marcar | `unmarked` |
| Vencida | `overdue` |
| Pendientes de días anteriores | `pastPending` |
| Historial | `history` |
| Archivar | `archive` |
| Hoy | `today` |
