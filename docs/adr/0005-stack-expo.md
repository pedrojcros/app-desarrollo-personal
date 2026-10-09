# ADR-0005: Stack — Expo (React Native) con Supabase, móvil primero

- **Estado:** Aceptada (DEC-24). Sustituye a la [ADR-0001](0001-stack.md)
- **Fecha:** 2026-10-06
- **Decisores:** el humano, a propuesta del arquitecto

## Contexto

El humano quiere que la app sea **importante en el móvil** (DEC-24): se usa sobre todo a diario y fuera de casa. La ADR-0001 (Next.js, web primero, móvil como web instalable) no encaja con eso: una web en el móvil no se siente como una app, y los recordatorios en el propio móvil, los widgets y el uso sin conexión cuestan mucho más. Sigue siendo un proyecto de coste cero, de un solo usuario, hecho por agentes y revisable por una persona, con nombres en inglés.

## Opciones consideradas

| | A: Next.js + web instalable (ADR-0001) | B: Expo (React Native), una base de código | C: Next.js para web + Expo para móvil | Flutter |
|---|---|---|---|---|
| Sensación en el móvil | Web | App nativa | App nativa | App propia, muy fluida |
| Web | Excelente | Buena (Expo Router genera la web) | Excelente | Floja (lienzo, accesibilidad) |
| Bases de código de interfaz | 1 | 1 | 2 | 1 |
| Lenguaje | TypeScript | TypeScript | TypeScript | Dart |
| Recordatorios en el móvil | Difícil | Fácil (`expo-notifications`, locales) | Fácil | Fácil |
| Conocimiento de los agentes y skills | Muy alto | Muy alto (skills oficiales de Expo) | Muy alto | Medio |

## Decisión

**B: una sola app con Expo**, Android primero y también en el navegador del ordenador; iPhone, más adelante.

| Pieza | Elección |
|---|---|
| Aplicación | Expo (SDK 56, React Native con la nueva arquitectura), Expo Router y TypeScript estricto |
| Interfaz | NativeWind (Tailwind en React Native) y React Native Reusables (el equivalente de shadcn para móvil: el código de los componentes vive en el proyecto) |
| Datos y login | Supabase: PostgreSQL, Auth y RLS (igual que antes; [ADR-0004](0004-acceso-un-usuario.md) sigue vigente) |
| Estado de servidor | TanStack Query: caché, reintentos y **actualizaciones optimistas** (marcar al instante y «Deshacer») |
| Pruebas | Jest con `jest-expo` y React Native Testing Library; Maestro para recorrer la app en el emulador Android |
| Web | Exportación estática de Expo publicada en Vercel (plan gratuito) |
| Android | Expo Go en el móvil para desarrollar; APK instalable con EAS Build (plan gratuito) para el uso diario. Google Play, cuando el humano decida |

La lógica pura del producto (motor de ocurrencias, [ADR-0003](0003-ocurrencias-calculadas.md)) no cambia. Las fechas de calendario se calculan con la zona horaria del dispositivo, que para el dueño es Europe/Madrid.

## Consecuencias

- **Más fácil:** app de verdad en el móvil; recordatorios locales sin servidor (versión 1.1); una sola base de código para Android, web y, más adelante, iPhone; el motor de fechas se escribe una vez.
- **Más difícil:** la versión de escritorio queda algo menos pulida que con Next.js; no hay servidor propio, así que **todo lo protege RLS** (la clave pública de Supabase va dentro de la app, como está previsto); hace falta el SDK de Android y un emulador para que los agentes prueben; el plan gratuito de EAS da 15 compilaciones Android al mes, en cola lenta; actualizar el SDK de Expo cada pocos meses tiene trabajo.
- **Revisar:** si la web se queda corta para el uso en el ordenador; al conectar Google Calendar (puede pedir una función en el servidor de Supabase); al publicar en Google Play.
