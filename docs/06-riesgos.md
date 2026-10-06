# Riesgos y deuda técnica

Reconocer por escrito lo que puede salir mal, antes de que salga.

*Estado: aprobado con el plan, el 2026-10-06.*

## Cómo se escribe un riesgo

Identificador, descripción, probabilidad, impacto, **mitigación** (qué se hace para que no pase) y **contingencia** (qué se hace si pasa igualmente). Probabilidad e impacto: ALTA / MEDIA / BAJA. **Un riesgo sin contingencia es una preocupación, no un riesgo gestionado.**

## Riesgos que casi siempre aplican

### R-01 — El alcance crece y el proyecto no se termina

- **Probabilidad:** ALTA (no hay fecha límite, DEC-07) · **Impacto:** ALTO
- **Mitigación:** la versión 1 son 14 funcionalidades cerradas (DEC-19); fuera de alcance escrito; todo lo nuevo pasa por el [buzón](buzon.md) y, si choca con una decisión, se le pregunta al humano.
- **Contingencia:** publicar la versión 1 con lo imprescindible que ya funcione y dejar el resto a la lista de espera.

### R-02 — Los agentes en paralelo se pisan o divergen

- **Probabilidad:** MEDIA · **Impacto:** MEDIO
- **Mitigación:** contratos escritos antes de repartir, ficheros y migraciones reservados por tarea en [05-plan](05-plan.md), un worktree por encargo y tope de 3.
- **Contingencia:** fusionar de menos a más conflictivo; si un encargo diverge del contrato, se descarta y se reescribe.

### R-03 — Un agente produce algo que parece bien y no lo está

- **Probabilidad:** ALTA · **Impacto:** MEDIO
- **Mitigación:** el orquestador ejecuta los tests él mismo; revisión cruzada con otro modelo en lo delicado (T02, T03); criterios de hecho comprobables.
- **Contingencia:** encargo de corrección; tras dos fallos, se escala al humano.

### R-04 — Se agotan las cuotas de los agentes

- **Probabilidad:** MEDIA · **Impacto:** MEDIO
- **Mitigación:** trabajadores con Sonnet 5.5; Opus solo para decidir; repartir entre Claude, Codex y Copilot (DEC-04).
- **Contingencia:** bajar el paralelismo y esperar a que se renueve la cuota; el plan no depende de un agente concreto.

### R-05 — Supabase, Vercel o Expo cambian o recortan sus planes gratuitos

- **Probabilidad:** BAJA · **Impacto:** ALTO
- **Mitigación:** PostgreSQL estándar y exportación propia (RNF-04); nada específico de un proveedor fuera de `src/data` y la configuración.
- **Contingencia:** mover la base de datos a otro PostgreSQL gratuito, la web a otro alojamiento estático, y compilar el APK en local con el SDK de Android en vez de con EAS.

### R-06 — Se pierde el hilo entre sesiones y agentes

- **Probabilidad:** MEDIA · **Impacto:** MEDIO
- **Mitigación:** `contexto.md`, `decisiones.md` y las ADR se actualizan en el mismo commit; nada importante vive solo en un chat.
- **Contingencia:** reconstruir el estado desde git, las decisiones y Jira.

## Riesgos propios de este proyecto

### R-07 — Supabase gratis se pausa tras 7 días sin uso

- **Probabilidad:** MEDIA (exámenes, vacaciones) · **Impacto:** BAJO
- **Mitigación:** con el uso diario no se pausa.
- **Contingencia:** reactivarlo desde el panel de Supabase (conserva los datos); los pasos, en el README.

### R-08 — La lógica de fechas y repeticiones falla (cambios de hora, fin de mes, cambios de frecuencia)

- **Probabilidad:** MEDIA · **Impacto:** ALTO (el historial sería falso)
- **Mitigación:** ADR-0003 (función pura con fechas de calendario); tests exhaustivos en T03, con revisión de otro modelo.
- **Contingencia:** como solo se guardan las marcas, corregir la función arregla todo el historial sin migrar datos.

### R-09 — Se pierden los datos

- **Probabilidad:** BAJA · **Impacto:** ALTO
- **Mitigación:** exportación semanal automática y una restauración probada antes del uso diario (RNF-04).
- **Contingencia:** restaurar la última exportación.

### R-10 — Codex y Copilot no funcionan con Orca

- **Probabilidad:** BAJA (resuelto en P01; puede volver con versiones nuevas de Orca o de los agentes) · **Impacto:** MEDIO
- **Mitigación:** los ajustes y trampas de [agentes/orca](agentes/orca.md#trampas-conocidas); repetir la prueba de arranque tras actualizar Orca o un agente.
- **Contingencia:** todo el trabajo con trabajadores Claude; la revisión cruzada, con otro modelo de Claude.

### R-11 — El humano tiene poco tiempo y de forma irregular (es estudiante)

- **Probabilidad:** ALTA · **Impacto:** MEDIO
- **Mitigación:** orquestador autónomo por niveles (DEC-12); decisiones en lotes con valores por defecto (DEC-14); puertas solo donde el humano las pida.
- **Contingencia:** el orquestador sigue con todo lo que no depende del humano y deja las preguntas apuntadas.

### R-12 — El código de React Native es difícil de revisar para una persona

- **Probabilidad:** MEDIA · **Impacto:** MEDIO
- **Mitigación:** regla de legibilidad y skill `codigo-legible`; lógica en `src/domain` sin framework; pantallas finas (ver [04-arquitectura](04-arquitectura.md#estructura-interna)).
- **Contingencia:** encargo de simplificación de la parte afectada.

### R-13 — Se agotan las compilaciones gratuitas de EAS o la cola es lenta

- **Probabilidad:** MEDIA · **Impacto:** BAJO
- **Mitigación:** desarrollar con Expo Go y el emulador; compilar el APK con EAS **solo al publicar** una versión (15 compilaciones Android gratis al mes).
- **Contingencia:** compilar en local con el SDK de Android (`npx expo run:android` o Gradle).

### R-14 — Una actualización del SDK de Expo rompe dependencias

- **Probabilidad:** MEDIA · **Impacto:** MEDIO
- **Mitigación:** SDK fijado (56); actualizar solo con un encargo propio y la skill `expo-upgrade`; instalar paquetes con `npx expo install`, que elige versiones compatibles.
- **Contingencia:** volver a la versión anterior del SDK desde git y repetir la actualización por partes.

### R-15 — La versión web se queda corta para el uso en el ordenador

- **Probabilidad:** MEDIA · **Impacto:** BAJO
- **Mitigación:** diseño adaptable desde el sistema visual (T14); probar la web con el MCP de Chrome en cada ola.
- **Contingencia:** ajustar las pantallas de escritorio; si no basta, reconsiderar una web propia (opción C de la ADR-0005).

### R-16 — Sin servidor propio, un fallo en RLS expone datos

- **Probabilidad:** BAJA · **Impacto:** ALTO
- **Mitigación:** RLS en todas las tablas desde T02, tests con dos usuarios y revisión cruzada de T02; la clave `service_role` nunca en la app.
- **Contingencia:** cerrar el acceso desactivando la clave pública en Supabase, corregir la política y rotar las claves.

## Deuda técnica aceptada

| Id | Qué | Por qué se acepta | Cuándo se paga |
|---|---|---|---|
| D-01 | Sin modo sin conexión (solo la caché de TanStack Query) | Simplifica la versión 1 (confirmado por el humano, DEC-25) | Si el uso diario en el móvil lo pide |
| D-02 | Zona horaria del dispositivo, sin gestión de viajes | Un solo usuario en un sitio | Si el dueño viaja y le descoloca el historial |
| D-03 | Sin borrado definitivo | Protege el historial (RN-18) | Si el dueño lo pide |
| D-04 | Sin protección de ramas en GitHub | El plan gratuito con repositorio privado puede no ofrecerla; la regla está en `AGENTS.md` | Si se pasa a un plan que la incluya |
