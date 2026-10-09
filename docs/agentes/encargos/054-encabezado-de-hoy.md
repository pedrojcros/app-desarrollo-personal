# Encargo 054 — El título grande de Hoy, marcado como encabezado

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Ticket | `ADP-27` (solo informativo: no lo toques) |
| Agente | copilot (diminuto y mecánico; DEC-39) |
| Skills | `codigo-legible` (en `.agents/skills/`) |
| Rama | `ADP-27-encabezado-hoy`, desde `origin/develop` |
| Reservado | `src/components/today/today-header.tsx` y su test (o `src/tests/tabs-layout.test.tsx` si el test va mejor ahí) |

Lee la regla de legibilidad de `AGENTS.md`. No uses el emulador ni Supabase.

## Qué pasa

El PR #73 quitó el título «Hoy» de la cabecera de la pestaña porque salía repetido. Pero ahora la pantalla Hoy **no tiene ningún encabezado para los lectores de pantalla**: el «Hoy» grande de `src/components/today/today-header.tsx` (hacia la línea 38, `<Text variant="title">{getDayTitle(date, today)}</Text>`) es un texto normal.

## Qué hacer

1. En ese `Text`, añade `accessibilityRole="header"`, como ya se hace en `src/app/(tabs)/historial.tsx:156` y en `src/components/ui/section-title.tsx`. Nada más en ese fichero.
2. Un test con React Native Testing Library que renderice la cabecera de Hoy y compruebe que hay **un** elemento con rol de encabezado y texto «Hoy» (`screen.getByRole('header', { name: 'Hoy' })` o lo que use el resto de tests del proyecto; mira cómo lo hacen otros tests con `accessibilityRole="header"`). El test tiene que fallar sin el cambio.
3. `./docker/app/run npm run lint`, `./docker/app/run npm run typecheck` y `./docker/app/run npm run test` en verde.
4. Un commit en español, push y PR contra `develop` con `ADP-27` en el título. En la descripción, el informe corto de la plantilla (seis puntos, una línea cada uno).

## Fuera de alcance

- Cualquier otro fichero o detalle: si ves algo, anótalo en el PR.
- `docs/`.

Si algo no está claro, pregunta con `orca orchestration ask`. Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`).
