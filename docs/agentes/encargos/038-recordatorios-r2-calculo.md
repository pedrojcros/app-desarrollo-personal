# Encargo 038 — Recordatorios R2: cálculo de los avisos (dominio)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | Versión 1.1, recordatorios, encargo R2 de la propuesta (DEC-43) |
| Ticket | `ADP-23` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6.1-sol` (reglas, fechas y casos raros; DEC-41) |
| Skills a usar | `test-driven-development`, `codigo-legible` (en `.agents/skills/`) |
| Rama y worktree | `ADP-23-recordatorios-calculo`, desde `origin/develop` (con R1 ya fusionado), tu propio worktree |
| Reservado para este encargo | `src/domain/reminders.ts` y `src/domain/reminders.test.ts` |

## Antes de empezar

- **`AGENTS.md`:** capas (`src/domain` sin React, Expo ni Supabase), prohibición 8 (el motor de ocurrencias **no se toca**) y regla de legibilidad. **Todo en Docker.**
- **Funcionalidades y caso de uso:** RF-24 a RF-27 en `docs/02-funcionalidades.md`, y CU-08 en `docs/03-casos-de-uso.md` (reglas **RN-34 a RN-40**, escenarios 1 a 9, 14 y 15).
- **Propuesta:** de `docs/propuestas/recordatorios.md`, **solo** el apartado 3.2 (contrato del dominio). Las reglas que allí se llaman RN-33 a RN-39 son RN-34 a RN-40.
- **Código:** los tipos ya están en `src/domain/reminder-types.ts` (los hizo R1): reutilízalos y vuelve a exportarlos desde `reminders.ts`. Usa `getHabitOccurrences` y `getOccurrenceStatus` tal como están, y las utilidades de `src/domain/calendar-date.ts`.
- **Lo pesado, de uno en uno:** `test:zones` va con `flock /tmp/adp-pesado.lock ./docker/app/run npm run test:zones`.

## Qué hacer

1. **Funciones** en `src/domain/reminders.ts`, puras:
   - `planReminders(input)`: ventana de 7 días, como mucho los 64 más próximos, ordenados por momento, nunca en un momento pasado;
   - `diffReminders(planned, scheduledKeys)`;
   - los textos de los avisos: «En 3 días, el viernes 20», «Mañana», «Hoy», «Hoy a las 23:59», «Ahora, a las 17:00», con el título del elemento y la categoría en el cuerpo, como en el CU-08.
2. **La `key`** es estable: `task:<id>:<fecha>:<antelación>` o `habit:<id>:<fecha>`, más una huella corta del contenido (título, cuerpo y hora). Así, un cambio de nombre o de hora cambia la `key`.
3. **Tests exhaustivos (TDD):**
   - los escenarios 1 a 9, 14 y 15 de CU-08;
   - el criterio extra de RF-25 («cada 3 días» a las 08:00: avisa los días 1, 4 y 7);
   - hábitos con cambio de regla en la ventana;
   - tareas sin fecha y vencidas;
   - ajustes apagados;
   - franjas encendidas y apagadas;
   - la `key` cambia con el nombre o la hora.
   
   Los tests pasan con `npm run test:zones` en las dos zonas (Madrid y Los Ángeles), incluido el cambio de hora (escenario 14).

## Fuera de alcance

La plataforma, `src/data`, las pantallas, Ajustes, `package.json`, el motor de ocurrencias, Jira, `docs/contexto.md` y otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan los escenarios 1 a 9, 14 y 15 de CU-08 y el criterio de RF-25.
- [ ] Lint, tipos, `npm run test` y `test:zones` en verde dentro de Docker; CI del PR en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-23` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
