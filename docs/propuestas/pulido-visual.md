# Pulido visual (1.1.1)

> **En curso** desde el 2026-10-09 (DEC-48). Aquí se apunta lo que el humano ve
> mal, tal como lo dice, y cómo lo clasifica el arquitecto. Cuando la lista esté
> completa, el arquitecto la convierte en encargos (apartado 3) y el humano la
> aprueba.

**Objetivo que marca el humano:** «quiero que la pantalla de Hoy sea **la más
cómoda de todas**». Es el criterio para decidir cualquier duda sobre Hoy.

## 1. Cómo se revisa

- **Con qué versión:** la de `develop`, no la de producción. Producción es
  `v1.0.0` y no tiene lo fusionado después, como ADP-27.
- **Con qué datos:** los sintéticos del Supabase local
  (`scripts/seed/seed-synthetic-year.sh`, usuario `seed@example.com`), en la web
  (`http://localhost:8081`) o en el emulador. El script se niega a escribir en
  pruebas o en producción, así que los datos reales del dueño no se mezclan con
  los de prueba.
- **Capturas:** en `~/capturas-adp/`, **fuera del repositorio**, porque el
  repositorio es público (DEC-44). Solo las capturas con datos sintéticos que
  haga falta pasar a un encargo se copian a `docs/diseno/capturas/pulido/`.

## 2. Lo que ve el humano

Clasificación: **S** = sistema visual (va antes de la 1.2) · **P** = una
pantalla que la 1.2 no toca (puede ir con la primera ola de la 1.2) · **R** =
rediseño grande (propuesta aparte) · **Hecho** = ya está en `develop`.

| # | Fecha | Lo que dice el humano | Pantalla | Clase | Nota del arquitecto |
|---|---|---|---|---|---|
| 1 | 2026-10-09 | «En Hoy la palabra Hoy aparece dos veces» | Hoy | **Hecho** | Arreglado en `develop` (ADP-27, PR #73); no está aún en producción. Comprobarlo con la versión de `develop` |

## 3. Encargos

*(Se escriben cuando la lista del apartado 2 esté completa.)*
