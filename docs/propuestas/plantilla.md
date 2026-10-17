# Propuesta: plantilla para proyectos de pago

*Arquitecto, 2026-10-17. Decisiones abiertas en [DEC-61](../decisiones.md).*

## 1. Qué es y para qué

El humano quiere que esta app sirva sobre todo para obtener «una plantilla arquitectonica con la q trabajar en proyectos por los cuales voy a cobrar dinero» (DEC-60). La plantilla vive en un **repositorio privado aparte** y recoge la forma de trabajar que se ha probado aquí: papeles, documentos, flujo de git, Orca, gentle-ai, supervisión, medida y CI.

Principio: **esta app es el laboratorio.** A la plantilla solo pasa lo que ya ha funcionado aquí o en un proyecto de cliente, después de su retrospectiva. Lo que está a prueba (por ejemplo DEC-57 y DEC-58, hasta la retrospectiva de la 1.2) entra marcado como «a prueba».

## 2. Las tres capas

| Capa | Qué lleva | Cuándo cambia |
|---|---|---|
| **Proceso** | Papeles (arquitecto, orquestador, trabajador), documentos base, decisiones, contexto, bitácora, buzón, flujo de git, Orca, gentle-ai, medida, incidencias, skills de proceso | Con cada retrospectiva |
| **Perfil de stack** | Docker, CI y despliegue, skills a demanda y trampas de una tecnología concreta. El primero: Expo + Supabase, el de esta app | Cuando un proyecto pide otro stack |
| **Proyecto de pago** | Lo que aquí no hay: el cliente, el alcance contratado, las entregas, el coste y el traspaso | Con cada proyecto de cliente |

La capa de proceso no menciona ninguna tecnología. Un perfil de stack se añade copiando su carpeta, sin tocar el proceso.

## 3. Inventario: qué pasa y cómo

**Pasa tal cual o casi** (capa de proceso):

- `.claude/commands/` (`/arquitecto`, `/orquestador`, `/ejecutar-plan`, `/idea`) y `CLAUDE.md`.
- `docs/agentes/`: `arquitecto.md`, `orquestador.md`, `plantilla-encargo.md`, `checklist-defaults.md`, `orca.md`, `jira.md`, `agentes-disponibles.md` y la parte general de `trampas.md`.
- Esqueletos vacíos de `docs/`: `01` a `06`, `decisiones.md`, `contexto.md`, `bitacora.md`, `buzon.md`, `adr/README.md`, `plantilla-caso-de-uso.md` y `README.md`.
- `scripts/orca/`, `scripts/incidents/`, `scripts/jira/` y `scripts/with-heavy-lock`, con sus tests.
- `.github/workflows/jira.yml` y la parte de `ci.yml` que no depende del stack (gitleaks).
- Las cinco skills automáticas de `.agents/skills/`.

**Pasa tras quitarle lo de esta app:**

- `AGENTS.md`: se quedan las prohibiciones, la regla de legibilidad, el flujo de git y las convenciones generales; la tabla del stack y la estructura de carpetas pasan al perfil de stack.
- `codigo-legible`: hoy habla de TypeScript; la regla es general y los ejemplos van al perfil.
- `orquestador.md` y `trampas.md`: lo de Maestro, el emulador y Expo va al perfil.
- Las decisiones de proceso (DEC-12, 36, 39, 45, 50, 54, 57 y 58) se convierten en **valores por defecto ya escritos** en los documentos, sin su historia.

**Perfil de stack Expo + Supabase:** `docker/`, `ci.yml` y `deploy-*.yml`, `backup.yml`, `scripts/backup/`, `scripts/seed/`, `scripts/e2e/`, el usuario de desarrollo, `prueba-emulador-docker.md` y las skills a demanda de Expo, EAS, Supabase, Vercel y emulador.

**No pasa:** el contenido de `01` a `06`, `diseno/`, `propuestas/`, `encargos/`, las ADR propias de esta app, `src/` y las migraciones.

## 4. Lo nuevo para proyectos de pago

- **Papeles:** el **cliente** decide el qué (alcance, prioridades y si acepta una entrega); el humano (Pedro) decide el cómo y es «el humano» para los agentes. **Los agentes nunca hablan con el cliente.**
- **`docs/00-encargo-del-cliente.md`:** qué se ha contratado, qué no entra, precio o forma de cobro, plazos y cómo se piden los cambios.
- **Hitos de entrega:** cada hito, con su criterio de aceptación del cliente; un hito se cobra cuando el cliente lo acepta.
- **Coste del proyecto:** horas del humano y tokens medidos con `measure.py`, para saber si el precio compensa.
- **Datos y secretos del cliente:** nunca en el repositorio; un `secretos.env` por proyecto fuera de él; los agentes no ven datos reales del cliente sin permiso escrito.
- **Traspaso:** `docs/traspaso.md` con cómo se despliega, dónde están las cuentas y las credenciales (sin escribirlas) y qué mantenimiento necesita.

## 5. Decisiones para el humano

Ver [DEC-61](../decisiones.md). Valores por defecto:

1. **Contenido de la primera versión:** la capa de proceso y un solo perfil de stack, el de Expo + Supabase. Otros stacks, cuando un proyecto los pida.
2. **Forma:** un repositorio de GitHub marcado como *template*, más una lista «Primer día» que pasa el arquitecto. Sin script generador hasta el segundo proyecto, cuando se sepa qué se repite.
3. **Cómo crece:** solo entra lo probado, tras su retrospectiva, con etiquetas de versión (`v0.1`, `v0.2`…). Cada proyecto anota de qué versión partió.
4. **Papeles:** el cliente decide el qué, el humano el cómo, y los agentes nunca hablan con el cliente.
5. **Documentos nuevos:** encargo del cliente, hitos de entrega, coste del proyecto y traspaso (sección 4).
6. **Datos y secretos del cliente:** como en la sección 4.
7. **Jira:** módulo opcional, activado por defecto, porque ya funciona; se apaga si el cliente usa otra herramienta.
8. **Idioma de los artefactos:** se elige por proyecto en `AGENTS.md`; por defecto, español.
9. **Cómo se construye:** el humano crea el repositorio privado vacío, y el copiado y la limpieza se hacen con encargos del orquestador, porque el arquitecto no escribe fuera de `docs/`. Se empieza tras fusionar el PR #103.
