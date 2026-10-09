# Encargo 022 — Añadir rápido (T16)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | `T16` en `docs/05-plan.md` |
| Ticket | `ADP-16` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6.1-sol` (DEC-39) |
| Skills a usar | `expo-native-ui`, `test-driven-development`, `codigo-legible` (en `.agents/skills/`) |
| Rama y worktree | `ADP-16-anadir-rapido`, desde `develop`, tu propio worktree |
| Depende de | T04, T05 (`src/data/habits.ts`), T06 (`src/data/tasks.ts`), T08 (`DateField`, `TimeField`) y T14, fusionadas en `develop` |
| Reservado para este encargo | `src/components/quick-add/` y sus tests |
| Puedes tocar, solo lo justo | `src/app/(tabs)/_layout.tsx` (poner el botón +), `src/app/_layout.tsx` (el proveedor, una línea), `src/app/categorias/[id].tsx` y `src/components/category-view/` (el botón + y el «+» de cada sección), `src/app/tareas/nueva.tsx` y `src/app/habitos/nuevo.tsx` (aceptar el parámetro `name`) |

## Antes de empezar

Lee `AGENTS.md` (capas, regla de legibilidad: nombres en inglés **sin abreviaturas**, comentarios y commits en español; **todo en Docker** con `./docker/app/run ...`; **sin dependencias nuevas**). Lee de `docs/diseno.md` las reglas «Botón +», «Añadir rápido», «Más» y «Desplegables hacia arriba»; de `docs/03-casos-de-uso.md`, CU-02 (escenarios 6 y 7, RN-13) y CU-01 (E1 a E3); RNF-06 en `docs/02-funcionalidades.md`. Del código, solo lo que vas a usar: `src/data/tasks.ts` (`createTask`, `useCreateTask`), `src/data/habits.ts` (`createHabit`, `useCreateHabit`), `src/domain/calendar-date.ts`, `CategorySelect`, `DateField`, `TimeField` y `src/components/ui/`. **El Supabase local es compartido**: no hagas `db reset`, `stop` ni `start`. Otro trabajador puede usar los puertos 8081 u 8090: elige uno libre (`ss -ltn`). **Lo pesado, de uno en uno**: `test:integration`, `test:zones`, `expo export`, `expo start` y la prueba en el navegador van con `flock /tmp/adp-pesado.lock ./docker/app/run ...` (hay más trabajadores en el portátil); no dejes Expo ni contenedores arrancados si no los usas.

## Reglas que decide el orquestador (no las cambies sin preguntar)

- **De dónde salen los valores iniciales:** desde **Hoy**, la fecha de hoy y sin categoría; desde la **vista de una categoría**, esa categoría, sin sección y sin fecha; desde el **«+» de una sección** (en la cabecera de cada sección de la vista de categoría), su categoría y su sección, sin fecha; desde cualquier otra pantalla, sin fecha y sin categoría (Bandeja). En Hábito, la fecha inicial es la de inicio y, si no hay, hoy.
- **Tarea por defecto.** El selector Tarea/Hábito conserva lo escrito al cambiar.
- **Enviar:** con el botón de enviar o con Intro. Crea con `createTask`/`createHabit`, **vacía el nombre y deja la barra abierta**, con los mismos valores, para añadir otra. Se cierra tocando fuera, con «atrás» o con Escape en la web. Si falla, mensaje en español junto al nombre y **sin perder lo escrito**.
- **Validación** con los mismos mensajes que los formularios: tarea de 1 a 120 caracteres; hábito de 1 a 80, con al menos un día (días de la semana) y N de 1 a 365 (cada N días).
- **Atajos de fecha:** Sin fecha · Hoy · Mañana · Lunes (el próximo lunes; si hoy es lunes, el de la semana que viene) · calendario (`DateField`). En Hábito no hay «Sin fecha».
- **«Más»** navega al formulario completo (`/tareas/nueva` o `/habitos/nuevo`) con lo que ya hay en la barra como parámetros de ruta: `name`, `categoryId`, `sectionId` y `dueDate` (tarea) o `startDate` (hábito). Añade a esas dos pantallas solo la lectura del parámetro `name`.
- **Todo lo que se elige se abre hacia arriba**, nunca debajo del teclado. **El teclado no tapa la barra**, ni en Android (edge-to-edge) ni en la web. Sin dependencias nuevas: lo que traen React Native y Expo.

## Qué hacer

1. **Contrato** en `src/components/quick-add/index.ts`:

   ```ts
   export interface QuickAddDefaults {
     dueDate: CalendarDate | null;
     categoryId: string | null;
     sectionId: string | null;
   }
   export function QuickAddProvider(props: { children: React.ReactNode }): JSX.Element;
   export function useQuickAdd(): { open(defaults: QuickAddDefaults): void; close(): void };
   export function QuickAddButton(props: { defaults: QuickAddDefaults }): JSX.Element; // el + flotante
   ```

2. **La barra** en `src/components/quick-add/`: arriba, el nombre en grande con el botón de enviar; debajo, Tarea/Hábito y «Más»; luego los atajos de fecha y la categoría con su sección (`CategorySelect`). En Hábito, además, la frecuencia (las cuatro de T05), cuándo (Sin hora · Mañana · Tarde · Noche · Hora exacta con `TimeField`) y la fecha de inicio con los mismos atajos. Accesible: etiquetas, 44 pt, teclado en la web, foco en el nombre al abrir. Solo tokens de `src/theme`.
3. **El botón +** redondo, abajo a la derecha y encima de la barra de pestañas, en las cinco pestañas (con los valores de la primera regla) y en la vista de categoría; y un «+» pequeño en la cabecera de cada sección de la vista de categoría.
4. **Tests** (TDD): la lógica de los valores iniciales y de los atajos de fecha, como funciones puras (con `test:zones`); los **escenarios 6 y 7 de CU-02** contra la base de datos real; componentes con datos simulados: enviar con Intro, la barra sigue abierta y vacía, el error conserva lo escrito, «Más» lleva los parámetros y el cambio Tarea/Hábito conserva el nombre.

## Fuera de alcance

Los formularios completos (más allá del parámetro `name`), las vistas (salvo el botón + y el «+» de sección), Pendientes (T11 toca `usePendingCount` en `src/app/(tabs)/_layout.tsx`: no lo cambies), los flujos de Maestro (T13), `package.json`, Jira, `docs/contexto.md` y otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Pasan los escenarios 6 y 7 de CU-02 y el resto de tests.
- [ ] Lint, tipos, tests unitarios, `test:zones`, integración y exportación web en verde dentro de Docker; CI del PR en verde.
- [ ] En la web (MCP de Chrome) y en el emulador de Android (si está disponible; si no, dilo): crear una tarea escribiendo solo el nombre y pulsando Intro (RNF-06), desde Hoy y desde una sección; crear un hábito «días de la semana»; el teclado no tapa la barra. Capturas en la descripción del PR.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-16` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
