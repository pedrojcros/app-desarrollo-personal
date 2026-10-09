# Encargo 006 — Corrección de T02 tras la revisión independiente

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado. Trabajas **en el worktree y la rama que ya existen** de T02 (`ADP-3-base-de-datos-y-acceso`, PR #10): el trabajador anterior terminó y está liberado. **No abras otro PR**: haz commits pequeños sobre esta rama y súbelos; el PR #10 se actualiza solo.

| Campo | Valor |
|---|---|
| Tarea del plan | `T02` (corrección) |
| Ticket | `ADP-3` (solo informativo) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills a usar | `supabase-postgres-best-practices`, `security-and-hardening`, `test-driven-development`, `codigo-legible`, `flujo-git` |
| Reservado | lo mismo que el encargo 002 (`docs/agentes/encargos/002-base-de-datos-y-acceso.md` en la rama `docs/orquestador-ejecucion`: `git show origin/docs/orquestador-ejecucion:docs/agentes/encargos/002-base-de-datos-y-acceso.md`), más `README.md` |

## Antes de empezar

Lee `AGENTS.md` entero. Todo se ejecuta en Docker (`./docker/app/run ...`). **No toques `supabase/config.toml`**: el hallazgo 1 de la revisión (inicio de sesión con email) lo tiene que decidir el humano; los tests omitidos por esa causa se quedan omitidos **con su motivo escrito** (es una decisión pendiente del humano, no una forma de pasar los tests). Otro trabajador puede estar usando los puertos 8081 y 54321/54322 (Supabase local de otra tarea): **no pares contenedores ajenos**; si tu Supabase no arranca por eso, díselo al coordinador con `orca orchestration ask` en vez de forzar nada.

## Qué corregir (hallazgos de la revisión independiente de Codex; fusionar solo tras esto)

2. **`weekdays` NULL pasa el CHECK** (`supabase/migrations/20261007100000_create_core_tables.sql:82,88-89`): con `frequency='weekdays'` y `weekdays` NULL o ausente, el `cardinality(...)` es NULL y el CHECK lo acepta. **Una migración nueva** (no edites la ya creada si ya se aplicó en algún sitio; si la rama aún no se ha fusionado a ningún entorno, puedes editarla, pero explícalo en el PR) que exija `weekdays IS NOT NULL` y `cardinality(weekdays) >= 1` cuando la frecuencia es `weekdays`. Añade a `constraints.integration.test.ts` los casos NULL y campo omitido.
3. **Los tests de RLS no demuestran todas las barreras de UPDATE y DELETE** (`row-level-security.integration.test.ts:127-185`): (a) el caso «move a row to themselves» lo ejecuta el intruso sobre una fila ajena, así que no prueba el `with check`: añade el caso del **dueño actualizando su propia fila hacia el `user_id` del otro usuario**, con referencias válidas para que una clave foránea no sea la barrera, y comprueba el error de RLS y que la fila conserva su dueño (leyendo con administración); (b) añade pruebas **positivas**: el dueño sí puede actualizar y borrar lo suyo en cada tabla (distinguen aislamiento de una política que lo prohíbe todo); (c) un `delete` sin filtro de clave ni `select()` encadenado con un usuario ajeno no borra filas del otro (verifícalo con administración); (d) un test de catálogo que compruebe que las seis tablas tienen RLS **enabled y forced** y que existen las 24 políticas con `user_id = (select auth.uid())`. Usa fixtures propios por operación y tabla.
4. **El comando documentado no pasa las credenciales** (`README.md:66-68`, `scripts/create-development-user.mjs:12-15`): las variables del anfitrión no llegan al contenedor. Documenta y prueba una invocación que sí las pase (por ejemplo `docker compose run -e DEV_USER_EMAIL -e DEV_USER_PASSWORD ...` con el uid/gid del anfitrión, o un script envoltorio en `scripts/` que las lea sin dejarlas en el historial). Ninguna contraseña real en el repositorio.
5. **Legibilidad y tokens** (menores obligatorios): `row-level-security.integration.test.ts:48` (cuatro llamadas en una línea), `local-supabase.ts:55` y `:91` y `scripts/create-development-user.mjs:30` (cadenas y cálculo anidado): un paso por línea con variables con nombre. `login.tsx:47,58,67,69` usa `border-gray-400`, `bg-black` y `text-white` sueltos: usa los componentes de `src/components/ui` y clases neutras ya existentes, sin inventar tokens (el sistema visual lo trae T14 y se fusionará después; deja un comentario `// T14:` si hace falta).
6. **Limpieza de usuarios** (`local-supabase.ts:143-147`): comprueba el error de `deleteUser` y falla si no se pudo; añade comprobaciones de cascada (al borrar el usuario las seis tablas quedan vacías para él; al borrar un hábito se borran sus reglas y marcas).
7. **README obsoleto** (`README.md:5,56-57,124-125,136`): actualiza lo que aún dice que el acceso, el cliente o las migraciones están pendientes o vacíos.
8. Elimina de los mocks las cadenas que parezcan contraseñas reales de prueba (usa valores obviamente sintéticos construidos en el test, no literales que parezcan credenciales).

## Fuera de alcance

`supabase/config.toml`, T14, T03, `package.json`, otras tareas, documentación general, Jira, `docs/contexto.md`. **No hagas merge. No abras otro PR.**

## Criterio de hecho

- [ ] Los hallazgos 2 a 8 corregidos, cada uno con su test cuando aplique; **migraciones desde cero sin errores**.
- [ ] Lint, tipos, tests unitarios y de integración y exportación web pasan dentro de Docker; la CI del PR #10 en verde.
- [ ] Actualiza la descripción del PR #10 con una sección «Correcciones tras la revisión» (qué se cambió, qué queda pendiente del humano: solo el hallazgo 1).
- [ ] Informe con los seis puntos habituales y `worker_done` (`--outcome succeeded|failed`).
