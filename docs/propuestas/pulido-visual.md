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
- **Con qué datos y dónde:** en la **web de pruebas**
  (`https://app-desarrollo-personal-pruebas.vercel.app`, que publica `develop`
  contra el Supabase de pruebas), con el usuario de demostración y un perfil de
  datos realista (encargo 060, DEC-49). Hasta que 060 esté fusionado: el Supabase
  local con `scripts/seed/seed-synthetic-year.sh` y la web en
  `http://localhost:8081`. Los datos reales del dueño, en producción, nunca se
  mezclan con los de prueba.
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

### 060 — Datos de demostración en la web de pruebas (**hecho** el 2026-10-10: `ADP-33`, PR #77, y su corrección 061)

Para que el humano revise la app en `https://app-desarrollo-personal-pruebas.vercel.app` con datos parecidos a su uso real.

1. **Perfil `realistic`** en el script de siembra (`SEED_PROFILE=realistic`; el perfil actual, `year`, sigue siendo el de por defecto, porque lo usa el test de rendimiento, que no cambia). Determinista, con nombres en español de la vida de un estudiante:
   - 4 categorías con alguna sección (por ejemplo Universidad, Salud, Casa, Compra) y algo en la Bandeja;
   - **10 hábitos**: 5 diarios (unos con hora exacta y otros con franja), 2 por días de la semana (uno, «Nadar», los miércoles a las 17:00), 1 cada N días, 1 mensual y 1 archivado;
   - **30 tareas**: unas 5 vencidas pendientes, 3 para hoy (una con hora), 8 en las próximas tres semanas, 6 sin fecha (por ejemplo, la lista de la compra) y 8 ya resueltas en el pasado (hechas, no hechas y 2 hechas tarde);
   - **90 días de historial**, con alrededor de un 75 % hechas, un 10 % no hechas y un 15 % sin marcar, y al menos un hábito con una racha en curso de más de una semana.
2. **Destino de pruebas.** La protección de `local-guard.mjs` se amplía: además de local, acepta el Supabase de **pruebas** solo si se pide de forma expresa (`SEED_TARGET=pruebas`) y la URL es la de ese proyecto. Rechaza siempre el de **producción** y cualquier otra URL. Tests de la protección para los cuatro casos.
3. **Usuario de demostración** en pruebas: `demo@example.com`, creado con la API de administración. La clave `service_role` se pide en el momento con `SUPABASE_ACCESS_TOKEN` y no se guarda. La contraseña la elige el humano y vive en `secretos.env` (`PRUEBAS_DEMO_PASSWORD`) y en el secreto del entorno `pruebas` de GitHub; nunca en el repositorio, en un registro ni en el chat.
4. **Volver a sembrar con un botón.** Los datos se generan respecto a «hoy» y envejecen; un flujo manual `seed-pruebas.yml` (*Run workflow* en Actions, entorno `pruebas`) borra y vuelve a sembrar **solo** los datos del usuario de demostración. No se ejecuta solo, para no borrar lo que el humano marque mientras revisa.
5. **README:** cómo entrar en la web de pruebas, cómo volver a sembrar y que la web de pruebas puede pedir la sesión de Vercel (está protegida).

- **Agente:** Codex Sol (toca una protección de seguridad y la CI) · **Tamaño:** M · **Depende de:** nada.
- **Ficheros reservados:** `scripts/seed/**`, `.github/workflows/seed-pruebas.yml`, `README.md` (sección de datos sintéticos y de despliegue).
- **Hecho cuando:** los tests de la protección pasan; el perfil `realistic` tiene tests de sus recuentos; la ejecución manual del flujo deja el usuario de demostración con los datos del perfil, y el humano entra en la web de pruebas y los ve.

**Estado (2026-10-10):** fusionado en `develop` (PR #77). La primera siembra en pruebas la hizo el orquestador desde su ordenador, porque GitHub solo ofrece «Run workflow» para los flujos que están en la rama por defecto (`main`): el botón de `seed-pruebas.yml` funcionará cuando `develop` pase a `main`. Mientras, se siembra con el envoltorio local (`scripts/seed/README.md`, «Pruebas remotas»).

### 061 — Corrección de los datos de demostración (**hecho** el 2026-10-10: `ADP-34`, PR #78)

Hallazgos menores de la revisión del 060: cada tarea en su categoría (antes todas en Universidad), «hoy» con la zona de `Europe/Madrid` al sembrar pruebas sin `SEED_TODAY` (el contenedor está en UTC), un cálculo muerto en las vencidas y el mensaje de producción con punto final. Encargo en [061](../agentes/encargos/061-correccion-datos-de-demostracion.md). Pruebas se volvió a sembrar al fusionar.

*(El resto de encargos se escriben cuando la lista del apartado 2 esté completa.)*
