# Encargo 033 — «Marcadas hoy» y ver otros días (RF-09 y RF-10)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | «Después de la versión 1», puntos 3 y 4: RF-09 y RF-10 (DESEABLE), en la pantalla Hoy |
| Ticket | `ADP-19` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6.1-sol` (reglas de fechas y estado de la vista) |
| Skills a usar | `test-driven-development`, `codigo-legible` (en `.agents/skills/`) |
| Rama y worktree | `ADP-19-marcadas-hoy-y-otros-dias`, desde `origin/develop`, tu propio worktree |
| Reservado para este encargo | `src/app/(tabs)/hoy.tsx`, `src/components/today/`, `src/domain/views/today.ts`, `src/data/today.ts` y sus tests |

## Antes de empezar

- **`AGENTS.md`:** capas, regla de legibilidad y **todo en Docker**.
- **Casos de uso:** en `docs/03-casos-de-uso.md`, CU-03 entero (A2, A3, E2 y escenarios 7 y 8; RN-05, RN-07, RN-08 y RN-29).
- **Funcionalidades:** RF-09 y RF-10 en `docs/02-funcionalidades.md`.
- **Código:** lo que ya hay en `src/app/(tabs)/hoy.tsx`, `src/components/today/`, `src/domain/views/today.ts` y `src/data/today.ts`, y `useMarkItem` en `src/data/marks.ts`, que no se toca.
- **En paralelo:** otro trabajador añade a `useMarkItem` una función `markItems` y a `ListRow` una acción secundaria opcional. No toques esos dos ficheros.
- **Base de datos:** el Supabase local es compartido. No hagas `db reset`, `stop` ni `start`.
- **Lo pesado, de uno en uno:** `test:integration`, `test:zones`, `expo export` y `expo start` van con `flock /tmp/adp-pesado.lock ./docker/app/run ...`. Expo, en el puerto 8093.

## Reglas que decide el orquestador

- **Otro día (RF-10):**
  - en la cabecera, flechas «Día anterior» y «Día siguiente» y, al pulsar la fecha, el `DateField`;
  - el título dice «Hoy», «Ayer» o «Mañana» y, en otro caso, el día de la semana, con la fecha pequeña encima como ahora;
  - fuera de hoy aparece el botón «Volver a hoy»;
  - el día elegido vive en el estado de la pantalla, no en la URL; al volver a la pestaña puede seguir en ese día.
- **Qué se ve en otro día:** lo que tiene fecha de ese día (ocurrencias y tareas), pendiente arriba y con los cuadritos de progreso, igual que hoy.
  - **Día pasado:** se puede marcar.
  - **Día futuro:** se ve, pero ✓ y ✗ salen **desactivados**, con la etiqueta accesible «Todavía no se puede marcar» (RN-05; CU-03, escenario 8).
  - El mensaje de día libre vale para cualquier día.
- **«Marcadas hoy» (RF-09):**
  - va debajo de la lista, **plegado por defecto**, con el número de elementos;
  - fuera de hoy se llama «Marcadas ese día»;
  - cada elemento muestra su estado y permite pasarlo a hecho, a no hecho o **devolverlo a pendiente**, con `markItem`; si vuelve a pendiente, sube a la lista (CU-03 A2, escenario 7).
- **El añadir rápido no cambia:** desde Hoy sigue proponiendo la fecha de hoy aunque se vea otro día. Apúntalo en el informe como posible mejora.

## Qué hacer

1. **Dominio:** en `src/domain/views/today.ts`, lo que haga falta para un día cualquiera: título del día (`Hoy`, `Ayer`, `Mañana` o el día de la semana) y si se puede marcar. Hazlo con funciones puras, con tests y probado con `test:zones`.
2. **Datos:** `useTodayView(date)` ya admite cualquier fecha. Si cambias su nombre, que sea un alias compatible.
3. **Interfaz:** la cabecera con navegación y la sección plegable, accesibles (etiquetas, 44 pt, teclado en la web). Usa solo tokens.
4. **Tests (TDD):**
   - escenarios 7 y 8 de CU-03;
   - el próximo miércoles muestra «Nadar» a las 17:00 (RF-10);
   - componentes: navegar entre días, volver a hoy, plegar y desplegar, devolver a pendiente.

## Fuera de alcance

Pendientes, Historial, el añadir rápido, `src/data/marks.ts`, `src/components/ui/list-row.tsx` (salvo, si hace falta, una prop opcional `markDisabled` que desactive ✓ y ✗ sin cambiar el aspecto cuando no se usa; otro encargo toca el mismo fichero, así que haz `git rebase origin/develop` antes del PR), `package.json`, Jira, `docs/contexto.md` y otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan los escenarios 7 y 8 de CU-03, el de RF-10 y el resto de tests.
- [ ] Lint, tipos, tests unitarios, `test:zones` e integración en verde dentro de Docker; CI del PR en verde.
- [ ] RF-09 y RF-10 marcados como hechos en `docs/02-funcionalidades.md`.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-19` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
