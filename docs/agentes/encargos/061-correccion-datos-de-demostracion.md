# Encargo 061 — Corrección de los datos de demostración

| Campo | Valor |
|---|---|
| Tarea del plan | Pulido visual 1.1.1, corrección del encargo 060 (`docs/propuestas/pulido-visual.md`, DEC-49) |
| Ticket | `ADP-34` (solo informativo: no lo toques) |
| Agente | codex |
| Modelo y esfuerzo | `gpt-6.1-sol`, esfuerzo por defecto (corrección; toca la protección de la siembra) |
| Skills a usar | `test-driven-development`, `codigo-legible`, `flujo-git` |
| Rama y worktree | Rama `ADP-34-correccion-datos-de-demostracion`, creada desde `develop`. Un worktree solo para este encargo |
| Depende de | 060 (PR #77), ya fusionado en `develop` |
| Reservado para este encargo | `scripts/seed/**` y los tests de la siembra (`src/data/seed.test.ts`, `src/data/seed-profile.test.ts`, `src/data/seed.integration.test.ts`) |

## Antes de empezar

Lee `AGENTS.md` entero. Es obligatorio aunque tu herramienta lo cargue sola.

## Cómo trabajar (DEC-39)

- **Commits pequeños a menudo**, uno por paso terminado.
- **En local, solo los tests de tu parte** (y lint y tipos). Al terminar, cierra los contenedores que hayas arrancado.
- **El Supabase local es compartido**: puedes usarlo, pero **nunca** hagas `supabase db reset`, `stop` ni `start`.
- **No ejecutes nada contra el Supabase de pruebas ni contra el de producción**, ni el flujo `seed-pruebas.yml`: la nueva siembra en pruebas la hace el orquestador tras fusionar.

## Objetivo

Corregir cuatro detalles que encontró la revisión del encargo 060 en el perfil `realistic` y en la protección de la siembra, sin cambiar nada más de su comportamiento.

## Contexto que necesitas

- `scripts/seed/README.md` y el código de `scripts/seed/` (sobre todo `generate-realistic.mjs`, `local-guard.mjs`, `seed-synthetic-year.mjs` y `seed-synthetic-year.sh`).
- `.github/workflows/seed-pruebas.yml` llama a `seed-synthetic-year.sh` sin `SEED_TODAY`, en un ejecutor de GitHub cuya zona es UTC. El dueño de la app vive en `Europe/Madrid`.

## Qué hacer

1. **Cada tarea en su categoría** (`generate-realistic.mjs`, `TASK_GROUPS`). Hoy todas las tareas que no son de la compra van a la categoría 0 (Universidad), incluidas «Lavar las sábanas», «Sacar la basura», «Limpiar la cocina», «Llamar al dentista» o «Ir al entrenamiento». Haz que cada tarea vaya a la categoría que le corresponde por su nombre (Universidad, Salud, Casa o Compra), de modo que Salud y Casa tengan cada una **al menos dos tareas pendientes**. Mantén **exactamente** los recuentos por grupo de fecha del encargo 060 (5 vencidas, 3 hoy con una con hora, 8 en las próximas tres semanas, 6 sin fecha, 8 resueltas con 2 hechas tarde) y que la tarea «Mirar una mochila nueva» siga en la Bandeja si ya lo está. La forma de expresarlo (categoría por tarea en vez de por grupo, por ejemplo) la eliges tú, con legibilidad.
2. **Cálculo muerto en las vencidas** (`createTask`): el grupo de vencidas suma `offset += taskIndex * 2` y después lo sobrescribe. Que el caso de las vencidas se resuelva primero y salga, sin cálculos que no se usan. Mismo resultado de fechas que ahora.
3. **«Hoy» con la zona de Madrid en pruebas** (`seed-synthetic-year.sh`): si `SEED_TODAY` no viene dada y el destino es `pruebas`, el envoltorio la calcula como la fecha de hoy en `Europe/Madrid` (`TZ=Europe/Madrid date +%F`) antes de llamar a Docker. Con destino local y sin `SEED_TODAY`, la fecha de hoy en la zona del anfitrión (`date +%F`), para que el contenedor, que está en UTC, no siembre «ayer» de madrugada. Si `SEED_TODAY` viene dada, se respeta tal cual. No cambies cómo `seed-synthetic-year.mjs` calcula «hoy» cuando se le llama directamente (lo usa el test de rendimiento).
4. **Mensaje de producción con punto final** (`local-guard.mjs`): la URL de producción escrita con punto final (`https://cidrlwpsqkygnuxiffsu.supabase.co.`) ya se rechaza, pero con el mensaje genérico. Que dé el mismo mensaje que la URL de producción sin el punto. Sigue rechazándose siempre, con cualquier `SEED_TARGET`.
5. Actualiza `scripts/seed/README.md` si algo de lo anterior lo deja desactualizado (por ejemplo, de dónde sale «hoy» en el envoltorio).

## Fuera de alcance

- `docs/contexto.md`, la bitácora y `docs/decisiones.md` los actualiza el orquestador al cerrar: no los toques ni lo preguntes.
- No toques `.github/workflows/` (el arreglo de «hoy» va en el envoltorio, que el flujo ya usa), `README.md` de la raíz, el código de la app, las migraciones ni `docker/`.
- No cambies el perfil `year` ni `src/data/performance.integration.test.ts`.
- Nada de dependencias nuevas.

## Criterio de hecho

- [ ] Test que comprueba que Salud y Casa tienen al menos dos tareas pendientes cada una y que ninguna tarea de casa o de salud queda en Universidad (por ejemplo, comprobando la categoría de «Sacar la basura», «Limpiar la cocina» y «Llamar al dentista»).
- [ ] Los tests de recuentos del perfil `realistic` siguen pasando sin rebajar ninguna comprobación.
- [ ] Test de la protección: la URL de producción con punto final da el mensaje de producción.
- [ ] Prueba del envoltorio (test o comprobación descrita en el informe) de que, con destino `pruebas` y sin `SEED_TODAY`, la fecha que llega al contenedor es la de `Europe/Madrid`, y que una `SEED_TODAY` dada se respeta. Sin llamar a ningún Supabase remoto (puedes sustituir `docker` por un falso en el `PATH`, como hacen los tests del 060 con `npx`).
- [ ] `npm run lint`, `npm run typecheck` y los tests de la siembra pasan (con `./docker/app/run`), incluida `src/data/seed.integration.test.ts` y `src/data/performance.integration.test.ts` si el Supabase local está arrancado.
- [ ] Cumple la regla de legibilidad de `AGENTS.md` (nombres en inglés; comentarios y commits en español)
- [ ] PR abierto **contra `develop`**, con `ADP-34` en el título. **No hagas merge**: lo decide el orquestador

## Documentación a actualizar

- `scripts/seed/README.md`, si hace falta.

## Cómo informar al terminar

En la descripción del PR, con estos seis puntos y **en formato corto** (DEC-45). Sin repetir el encargo ni pegar salidas largas:

1. **Hecho:** qué has hecho, en tres líneas como mucho.
2. **Ficheros:** la lista, sin explicar cada uno.
3. **Decisiones:** las que has tomado tú, una línea cada una con su porqué. «Ninguna» si no hay.
4. **Dudas:** lo que no estaba especificado, una línea cada una. «Ninguna» si no hay.
5. **Tests:** el comando y el resultado en una línea. Si algo falla, el nombre del test y el error, nada más.
6. **PR:** el enlace.

Y al final, `worker_done` con un resumen de tres frases.
