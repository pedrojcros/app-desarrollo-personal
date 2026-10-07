# Encargo 024 — Corrección de T05: una sola regla para cambiar la frecuencia

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | `T05` (corrección tras la revisión independiente del PR #29, ya fusionado) |
| Ticket | `ADP-8` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6.1-sol`, esfuerzo alto (lógica central) |
| Skills a usar | `test-driven-development`, `codigo-legible`, `supabase-postgres-best-practices` (en `.agents/skills/`) |
| Rama y worktree | `ADP-8-correccion-reglas`, desde `origin/develop` (con T05 ya fusionada) |
| Reservado para este encargo | migración nueva `supabase/migrations/20261007200000_habit_rule_guard.sql`; `src/data/habits.ts` y sus tests; `src/data/habit-functions.integration.test.ts`; `src/components/habit-form/`; `src/app/habitos/`; **solo para M2 y M3**: exportar `mapHabitRow` de `src/data/agenda.ts` y añadir las claves de hábitos a `src/data/query-keys.ts` |

## Antes de empezar

Lee el encargo original `docs/agentes/encargos/016-habitos.md` (sus «Reglas que decide el orquestador» siguen mandando), ADR-0003 (`docs/adr/0003-ocurrencias-calculadas.md`) y el informe de revisión que va pegado al final de este encargo: los identificadores I1–I4 y M1–M9 son los suyos. **El Supabase local es compartido:** aplica tu migración con `./docker/app/run npx supabase migration up --include-all`; **no** hagas `db reset`, `stop` ni `start`. **Lo pesado, de uno en uno:** `test:integration`, `test:zones`, `expo export` y `expo start` van con `flock /tmp/adp-pesado.lock ./docker/app/run ...`.

## Reglas que decide el orquestador

- **Una migración aplicada no se edita.** Todo cambio de SQL va en la migración nueva `20261007200000_habit_rule_guard.sql`, con comentarios en español que expliquen el porqué.
- **Una sola implementación de «cambiar la regla»**, en SQL. El orquestador aprueba el cambio de firma: `set_habit_rule(p_habit_id uuid, p_today date, p_frequency, p_weekdays smallint[], p_interval_days int)`. La fecha efectiva la calcula ella: `greatest(p_today, start_date)`. No la recibe, así que **el pasado no puede cambiar** (I1). Borra la firma antigua y mantén `security invoker`, `search_path = ''`, `revoke` y `grant` como en la original.
- Dentro de `set_habit_rule`, con `previous` como la última versión con `valid_from` anterior a la fecha efectiva:
  - si la regla nueva es igual a `previous`, se **borra** la versión de la fecha efectiva si existe, porque sobra (I4), y no se hace nada más;
  - si es igual a la versión que ya existe en la fecha efectiva, no se hace nada (I2);
  - en otro caso, alta o cambio sobre el `unique (habit_id, valid_from)`.
  
  La primera versión no se borra nunca: si la fecha efectiva es `start_date`, no hay `previous`.
- `update_habit` llama a `set_habit_rule` en vez de repetir la lógica. `changeHabitRule(habitId, rule, today)` **no cambia de firma en TypeScript** (es el contrato de T16): llama a la RPC sin la lectura previa.
- **Menores:**
  - **Se corrigen** M1 (archivar con `.is('archived_at', null)` y 0 filas = `not_found`), M2, M3, M4, M5, M6, M8 y M9.
  - **M7**, solo si `DateField` y `CategorySelect` ya admiten `disabled`; no los cambies.

## Qué hacer

1. Tests primero (TDD), contra el Supabase local:
   - I1: una regla no puede cambiar el pasado.
   - I2: la regla vigente no crea otra versión, ni por `changeHabitRule` ni por `update_habit`.
   - I4: cambiar y deshacer el mismo día deja las versiones como estaban.
   - I3: los casos (a) a (d) del informe sobre `update_habit`.
   - M5 y M6.
2. La migración y los cambios de `src/data/habits.ts`. Regenera `src/data/database.types.ts` con `supabase gen types typescript --local`.
3. Los menores del formulario y de la pantalla.

## Fuera de alcance

Las tablas (no se cambia el modelo de datos), el motor de `src/domain`, el añadir rápido (T16, en paralelo: no toques `src/components/quick-add/`), `package.json`, Jira, `docs/contexto.md` y otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Los tests nuevos fallan sin la corrección y pasan con ella. Pasan el resto de tests.
- [ ] Lint, tipos, tests unitarios, `test:zones` e integración en verde dentro de Docker; CI del PR en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-8` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
