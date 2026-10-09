# Arquitectura

Forma del sistema, tecnología y convenciones. Las decisiones importantes tienen su propia ADR en [adr/](adr/README.md); aquí se enlazan, no se repiten.

*Estado: **replanificada el 2026-10-06** para la opción móvil primero (DEC-24, [ADR-0005](adr/0005-stack-expo.md)). Espera la nueva aprobación del plan.*

## Restricciones

Coste cero, un solo usuario, **Android primero y también en el navegador del ordenador**, sin fecha límite. Detalle en [01-vision-y-alcance](01-vision-y-alcance.md#restricciones).

## Estrategia de solución

1. **Una sola app con Expo (React Native) en TypeScript**, para Android y web, con Supabase → [ADR-0005](adr/0005-stack-expo.md)
2. **La lógica del producto es una función pura**: las ocurrencias se calculan, solo se guardan las marcas, y las fechas son de calendario → [ADR-0003](adr/0003-ocurrencias-calculadas.md)
3. **Un único usuario protegido en la base de datos** (RLS): sin servidor propio, RLS es la barrera → [ADR-0004](adr/0004-acceso-un-usuario.md)
4. **`develop` integra, `main` publica** → [ADR-0002](adr/0002-ramas-y-fusion.md)

## Stack

| Parte | Tecnología | Por qué |
|---|---|---|
| Lenguaje | TypeScript en modo estricto | Un solo lenguaje para todo |
| Aplicación | Expo (SDK 56) con React Native y Expo Router | App nativa en Android y web desde el mismo código (ADR-0005) |
| Interfaz | NativeWind y React Native Reusables | Tailwind en React Native y componentes accesibles cuyo código vive en el proyecto |
| Iconos | `lucide-react-native` | Los que usa React Native Reusables |
| Datos e inicio de sesión | Supabase: PostgreSQL y Auth, con `@supabase/supabase-js` | Gratis, estándar, con RLS |
| Estado de servidor | TanStack Query | Caché, reintentos y actualizaciones optimistas (marcar al instante, «Deshacer») |
| Validación | Zod | Validar la entrada antes de escribir en la base de datos |
| Fechas y horas | `@react-native-community/datetimepicker` en Android; en la web, el selector del navegador | Los selectores nativos de cada plataforma (DEC-25) |
| Pruebas | Jest (`jest-expo`), React Native Testing Library y Maestro | Unitarias, de componentes y de extremo a extremo en el emulador |
| Calidad | ESLint, Prettier y gitleaks en la integración continua | Linter, formato y escaneo de secretos |
| Distribución | Expo Go (desarrollo), EAS Build (APK) y Vercel (web) | Gratis |

Las versiones exactas viven en `AGENTS.md`; las fija la tarea T01.

## Contexto del sistema

```
   ┌─────────────────────┐        ┌─────────────────────┐
   │ Móvil Android       │        │ Navegador (PC)      │
   │ App Expo            │        │ Web exportada       │
   │ (APK o Expo Go)     │        │ (alojada en Vercel) │
   └──────────┬──────────┘        └──────────┬──────────┘
              │ HTTPS (supabase-js, sesión del dueño)  │
              └──────────────────┬──────────────────────┘
                       ┌─────────▼─────────┐
                       │ Supabase          │
                       │ PostgreSQL + Auth │
                       │ RLS: cada fila,   │
                       │ de su dueño       │
                       └───────────────────┘

   Versión 1.1: recordatorios locales en el móvil (sin servidor).
   Versión 2: Google Calendar (puede necesitar una función en Supabase).
```

No hay servidor propio en la versión 1: la app habla directamente con Supabase y **RLS es lo que protege los datos**.

## Estructura interna

Por **capas**, porque el dominio es pequeño y lo que importa es que la lógica pura no dependa del framework:

```
src/domain/      Lógica pura: fechas de calendario, motor de ocurrencias y reglas de
                 cada vista. Sin React, sin Supabase, sin entrada ni salida.
src/data/        La ÚNICA capa que habla con Supabase: cliente, lecturas y escrituras por
                 entidad, y los hooks de TanStack Query que usan las pantallas.
src/app/         Rutas y pantallas (Expo Router): hoy, bandeja, categorías, pendientes,
                 historial, login. Usan src/data y src/components, nunca Supabase.
src/components/  Componentes compartidos. En src/components/ui, los de React Native
                 Reusables; fuera, los propios (aviso con «Deshacer», selector de categoría…).
src/theme/       Tokens del sistema visual (color, tipografía, espaciado), con NativeWind.
supabase/        Configuración local y migraciones SQL numeradas.
e2e/             Flujos de Maestro (extremo a extremo en el emulador).
```

**Pantallas finas**: una pantalla solo compone componentes y llama a hooks de `src/data`; las reglas viven en `src/domain`.

## Modelo de datos

Sin cambios respecto a la planificación anterior. Nombres en inglés (DEC-06); ver el [glosario](#glosario). **Cambiarlo requiere aprobación** (`AGENTS.md`).

| Tabla | Qué guarda | Campos principales |
|---|---|---|
| `categories` | Categorías | `id`, `user_id`, `name` (único por usuario, sin distinguir mayúsculas), `icon`, `color` (DEC-31) |
| `sections` | Secciones de una categoría (DEC-31) | `id`, `user_id`, `category_id`, `name` (único dentro de su categoría) |
| `habits` | Hábitos | `id`, `user_id`, `category_id` (vacío = Bandeja), `section_id` (vacío = sin sección; de su misma categoría), `name`, `start_date`, `time_of_day` o `time_slot` (`morning`, `afternoon`, `night`), `duration_minutes`, `archived_at` |
| `habit_rules` | Versiones de la regla de repetición | `id`, `habit_id`, `valid_from`, `frequency` (`daily`, `weekdays`, `every_n_days`, `monthly`), `weekdays`, `interval_days` |
| `habit_marks` | Marcas de ocurrencias | `habit_id`, `occurrence_date`, `status` (`done`, `not_done`), `marked_at`; clave única (`habit_id`, `occurrence_date`) |
| `tasks` | Tareas | `id`, `user_id`, `category_id` (vacío = Bandeja), `section_id` (vacío = sin sección; de su misma categoría), `name`, `notes`, `due_date`, `due_time`, `status` (`pending`, `done`, `not_done`), `marked_at`, `archived_at` |

Las ocurrencias **no son filas**: se calculan (ADR-0003). «Cada mes» usa el día de `valid_from`. Todas las tablas tienen RLS por `user_id` (ADR-0004).

## Conceptos transversales

| Tema | Decisión |
|---|---|
| Autenticación y autorización | Supabase Auth con email y contraseña, registro desactivado y RLS en todas las tablas ([ADR-0004](adr/0004-acceso-un-usuario.md)). La sesión se guarda en el dispositivo según la guía oficial de Supabase para Expo |
| Claves | En la app solo van `EXPO_PUBLIC_SUPABASE_URL` y la clave pública (*anon*): están pensadas para ir dentro de la app y RLS las limita. **La clave `service_role` nunca va en la app ni en una variable `EXPO_PUBLIC_*`**. Los tokens de los servicios, en `~/.config/app-desarrollo-personal/secretos.env` y en los secretos de GitHub Actions (DEC-33) |
| Gestión de errores | Las funciones de `src/data` devuelven `{ ok: true, value }` o `{ ok: false, error: { code, message } }`. Códigos y mensajes técnicos en inglés; la interfaz muestra textos en español y nunca un error técnico |
| Actualizaciones optimistas | Marcar y «Deshacer» se ven al instante (TanStack Query) y se deshacen solos si Supabase falla (CU-03, E1) |
| Validación | Zod en `src/data`, antes de cada escritura |
| Sin conexión | La versión 1 necesita internet (DEC-25): lo ya cargado se sigue viendo, pero marcar sin cobertura avisa del error y no se guarda |
| Fechas y zonas horarias | Fechas de calendario con la zona horaria del dispositivo (para el dueño, Europe/Madrid) e instantes en UTC ([ADR-0003](adr/0003-ocurrencias-calculadas.md)) |
| Registros (*logs*) | Solo en desarrollo; nunca datos personales ni claves |
| Internacionalización | No: la interfaz solo en español |
| Accesibilidad | Etiquetas de accesibilidad en todo lo que se pulsa, tamaños de toque de al menos 44 puntos y contraste AA (RNF-03) |
| Datos personales | Solo los del dueño; nunca en registros; exportación propia (RNF-04) |

## Estrategia de pruebas

| Nivel | Qué prueba | Herramienta | Cuándo corre |
|---|---|---|---|
| Unitarias | `src/domain`: motor de ocurrencias, fechas y reglas de cada vista | Jest | Cada commit y PR |
| Componentes | Pantallas y componentes con datos simulados | Jest y React Native Testing Library | Cada PR |
| Integración | `src/data` contra un Supabase local real (Docker), incluidas las políticas RLS | Jest y Supabase CLI | Cada PR |
| Extremo a extremo | Caminos críticos en el emulador Android: entrar, crear un hábito, marcar en Hoy con «Deshacer», resolver pendientes | Maestro | Al cerrar cada ola y antes de publicar (necesita el emulador) |

Qué exige test sí o sí: todo `src/domain`, con casos de cambio de hora, fin de mes, «cada N días» y versiones de la regla; las políticas RLS, con dos usuarios; y cada función de escritura de `src/data`.

## Despliegue

- **Desarrollo:** todo en Docker (DEC-26): el servidor de Expo, las comprobaciones, Supabase local y el emulador con Maestro corren en contenedores. En el móvil del dueño, la app **Expo Go**. Siempre contra el Supabase local.
- **Web:** `npx expo export --platform web` y Vercel publica `develop` y cada PR contra el proyecto Supabase `pruebas`, y `main` contra `produccion`.
- **Android:** EAS Build genera el APK instalable (perfil de vista previa) **solo al publicar una versión**, para no gastar las 15 compilaciones gratuitas del mes. Google Play, cuando el humano lo decida.
- **Migraciones:** la integración continua las aplica a `pruebas` al fusionar en `develop`, y a `produccion` solo desde `main`, que solo toca el humano.
- **Vuelta atrás:** Vercel vuelve al despliegue anterior; en Android se reinstala el APK anterior; las migraciones solo van hacia delante.
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
| Sección | `section` |
| Bandeja de entrada | `inbox` (categoría vacía) |
| Franja: mañana, tarde, noche | `timeSlot`: `morning`, `afternoon`, `night` |
| Pendiente, hecha, no hecha | `pending`, `done`, `not_done` |
| Sin marcar | `unmarked` |
| Vencida | `overdue` |
| Pendientes de días anteriores | `pastPending` |
| Historial | `history` |
| Progreso, periodo | `progress`, `ProgressPeriod` |
| Porcentaje de cumplimiento | `completion` |
| Racha | `streak` |
| Archivar | `archive` |
| Hoy | `today` |
