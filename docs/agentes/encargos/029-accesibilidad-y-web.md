# Encargo 029 — Accesibilidad y web (T13, RNF-03 y la web de RNF-08)

> Tú no has visto nada de lo que se habló antes. Todo lo que necesitas está aquí o enlazado.

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop` (lo pide este encargo, por encima del aviso genérico de tu preámbulo). Nunca hagas merge.

| Campo | Valor |
|---|---|
| Tarea del plan | `T13` en `docs/05-plan.md` (RNF-03 y la parte web de RNF-08; los flujos de Maestro van en el encargo 028, en paralelo) |
| Ticket | `ADP-17` (solo informativo: no lo toques) |
| Agente | codex, `--model gpt-6.1-sol` (criterio repartido por toda la app) |
| Skills a usar | `codigo-legible` (en `.agents/skills/`); a demanda, `.agents/skills-a-demanda/better-accessibility` y `.agents/skills-a-demanda/browser-testing-with-devtools` |
| Rama y worktree | `ADP-17-accesibilidad`, desde `develop`, tu propio worktree |
| Reservado para este encargo | arreglos de accesibilidad en `src/app/` y `src/components/`; **no toques** `e2e/`, `scripts/e2e/` ni `docker/android/` (encargo 028) |

## Antes de empezar

- **`AGENTS.md`:** regla de legibilidad; **todo en Docker**; **sin dependencias nuevas**; solo tokens de `src/theme`.
- **Documentación:** RNF-03 y RNF-08 en `docs/02-funcionalidades.md`; «Accesibilidad» en `docs/diseno.md`.
- **Base de datos:** el Supabase local es compartido. No hagas `db reset`, `stop` ni `start`. Para entrar en la web, crea un usuario local con `scripts/create-development-user.sh`, usando un correo de pruebas tuyo.
- **Lo pesado, de uno en uno:** `expo export`, `expo start`, el navegador y `test:integration` van con `flock /tmp/adp-pesado.lock ...`. Si necesitas Expo, usa el puerto **8091**.

## Qué hacer

1. **Recorrido con el teclado y Lighthouse.** Con el MCP de Chrome, en la web exportada y servida en local, recorre usando **solo el teclado** las cinco pestañas, Ajustes, el añadir rápido (el +), los formularios de tarea y hábito y la vista de una categoría. Pasa la auditoría de accesibilidad de Lighthouse en cada pantalla, a 1280 px de ancho y a 360 px.
2. **Arregla** lo que encuentres, sin cambiar el comportamiento ni el diseño:
   - etiquetas y roles;
   - zonas de toque de 44 pt;
   - orden y visibilidad del foco;
   - contraste, solo si algo no usa los tokens;
   - textos que se cortan a 360 px.
   
   Cada arreglo lleva su test de componente cuando se pueda comprobar (por ejemplo, la etiqueta o el rol).
3. **Lo que no sea pequeño**, como cambiar un diseño o un componente compartido de forma visible, no lo arregles: haz una lista en el informe con pantalla, problema y propuesta.

## Fuera de alcance

Cambiar el comportamiento o el aspecto de las pantallas, `src/domain`, `src/data`, `package.json`, los flujos de Maestro, Jira, `docs/contexto.md` y otros encargos. **No hagas merge.**

## Criterio de hecho (lo comprobará el orquestador ejecutándolo él)

- [ ] Lighthouse sin errores graves de accesibilidad en ninguna pantalla, con la puntuación de cada una, antes y después, en el informe.
- [ ] Todo se puede usar con el teclado en la web, y a 360 px no se corta nada.
- [ ] Lint, tipos y tests unitarios en verde dentro de Docker; CI del PR en verde.
- [ ] Cumple la regla de legibilidad de `AGENTS.md`.
- [ ] PR abierto **contra `develop`** con `ADP-17` en el título. **No hagas merge.**

## Cómo informar al terminar

Los seis puntos habituales (qué has hecho en tres líneas; ficheros tocados; decisiones tuyas y por qué; dudas; resultado de los tests con comando y salida; enlace al PR) y `worker_done` con `--outcome succeeded|failed`.
