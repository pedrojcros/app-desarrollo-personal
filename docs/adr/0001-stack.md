# ADR-0001: Stack — Next.js, Supabase y Vercel

- **Estado:** Sustituida por [ADR-0005](0005-stack-expo.md) (DEC-24)
- **Fecha:** 2026-10-06
- **Decisores:** el humano, a propuesta del arquitecto

## Contexto

Aplicación web personal, un solo usuario, en internet desde la versión 1 (DEC-19). En la versión 2: web instalable en el móvil y conexión con Google Calendar. **Coste cero.** El código lo escriben agentes de IA y lo tiene que poder revisar una persona, con nombres en inglés (DEC-06).

## Opciones consideradas

| | A: Next.js + Supabase (Vercel) | B: React (Vite) estático + Supabase | C: Cloudflare (Workers + D1 + Access) |
|---|---|---|---|
| Complejidad | Media | Baja | Media |
| Coste | Gratis | Gratis | Gratis |
| Familiaridad para los agentes | Muy alta | Alta | Media |
| Servidor propio para Calendar (v2) | Sí, en el mismo proyecto | No: funciones de Supabase (Deno) | Sí |
| Se pausa sin uso | Supabase, a los 7 días | Supabase, a los 7 días | No |

## Decisión

**A.** Es la idea del humano, es gratis, es la combinación que mejor conocen los agentes, usa un solo lenguaje y un solo proyecto con servidor propio para Google Calendar, permite la web instalable sin cambiar de tecnología, y PostgreSQL es estándar: los datos se pueden llevar a otro sitio.

## Consecuencias

- **Más fácil:** inicio de sesión y base de datos sin montar un servidor; despliegues de prueba en cada PR con Vercel.
- **Más difícil:** Next.js tiene muchos conceptos; se acota su uso (ver [04-arquitectura](../04-arquitectura.md#estructura-interna)). Supabase gratis **se pausa tras 7 días sin uso** (R-07) y no conviene depender de sus copias en el plan gratuito: hay exportación propia (RNF-04). Se depende de dos proveedores (R-05). Vercel gratis solo permite uso personal y no comercial.
- **Revisar:** si Supabase o Vercel cambian sus planes gratuitos, y al empezar la versión 2.
