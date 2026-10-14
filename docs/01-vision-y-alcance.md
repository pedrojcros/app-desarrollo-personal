# Visión y alcance

Qué se construye, para quién y por qué. También, y sobre todo, **qué no**.

*Estado: **suscrito por el humano** al aprobar el plan, el 2026-10-06 (DEC-08, DEC-09 y DEC-19). **Replanificado para móvil primero** el mismo día (DEC-24): espera la nueva aprobación del plan.*

## El problema

Hoy se usa Todoist con su calendario, y no sirve para el seguimiento personal por tres motivos: una tarea o hábito no se puede marcar como **no completado** (solo se queda pendiente, acumulando días de retraso), no hay **estadísticas** del progreso propio, y no hay nada **interactivo** que ayude a ver la evolución. Pasa a diario con los hábitos y cada vez que una tarea se queda sin hacer.

## La propuesta

Una aplicación personal de tareas y hábitos en la que todo se puede marcar como **hecho o no hecho**, y donde ese historial queda guardado para consultarlo y, más adelante, analizarlo.

## Para quién

| Usuario | Qué necesita | Qué hace con esto |
|---|---|---|
| El propio autor (único usuario) | Registrar hábitos que se repiten, tareas con y sin fecha, y cerrar cada una como hecha o no hecha | Planificar el día, anotar lo que cumple y lo que no, y revisar su historial |

Quién **no** es usuario de esta primera versión: cualquier otra persona. Puede que más adelante guste a más gente y se comparta, pero no se diseña para ello ahora.

## Qué tipos de cosas se registran

- **Hábitos recurrentes**, con su frecuencia: «todos los días por la noche me lavo los dientes», «los miércoles a las 17:00 voy a nadar».
- **Tareas con fecha**, por ejemplo entregas de la universidad: «el día X entrego la práctica».
- **Tareas sin fecha**, por ejemplo una lista de la compra.

## Cómo se sabe que está terminado (versión 1)

- [ ] Se pueden crear tareas y hábitos, y marcar cada uno como **hecho** o **no hecho** (no solo hecho).
- [ ] Un hábito recurrente genera su ocurrencia en cada día o semana que toca, sin crearla a mano.
- [ ] El historial de lo hecho y lo no hecho se puede consultar en alguna pantalla.
- [ ] Funciona instalada en el móvil Android y también en el navegador del ordenador.

*(Criterios iniciales del humano. Se irán añadiendo casos de uso según se use la aplicación.)*

## Alcance de la versión 1

Las 15 funcionalidades imprescindibles están en [02-funcionalidades](02-funcionalidades.md); las 8 deseables van justo después (DEC-19). Perímetro:

- Crear, editar y borrar tareas (con fecha y sin fecha) y hábitos recurrentes. Frecuencias: todos los días, días de la semana, cada N días y cada mes. Momento del día opcional (hora exacta o franja) y duración opcional.
- Estado de cada ocurrencia: pendiente, **hecha** o **no hecha**.
- Categorías mínimas para agrupar hábitos y tareas («Compra», «Universidad»): nombre único, una por elemento, opcional (DEC-13).
- Vistas: **Hoy** (solo lo de hoy, nunca tareas sin fecha), **Bandeja de entrada** (lo que no tiene categoría), cada categoría, pendientes de días anteriores e historial (DEC-15).

**Plataforma de la versión 1:** **app para Android**, instalable con su APK sin pasar por Google Play, y la misma app en el **navegador del ordenador**. Datos en Supabase, con inicio de sesión solo para el dueño (DEC-24, [ADR-0005](adr/0005-stack-expo.md)). iPhone, más adelante.

## Después de la versión 1 (confirmado, no se construye ahora)

- **Versión 1.1 — Recordatorios** en el propio móvil, locales y sin servidor: «en 4 días entregas la práctica» (DEC-24). Es lo primero después de la versión 1.
- **Versión 1.2 — Progreso** (DEC-46): porcentaje de cumplimiento, rachas y mapa de cada hábito, y un resumen por periodo de hábitos y tareas, con los datos que ya se guardan. Diseño en [propuestas/progreso](propuestas/progreso.md).
- **Versión 2 — Conexión con Google Calendar**, con la duración de los hábitos (RF-04): la aplicación crea eventos en el calendario (por ejemplo, la sesión de natación de los miércoles o la entrega de una práctica).
- **Google Play**: cuando el humano lo decida (DEC-18).

## Fuera de alcance

**Lo que no se construye, aunque lo pida alguien.** Cada línea con su motivo. Esta lista es lo que hace que el proyecto se termine.

| Fuera de alcance | Por qué | ¿Cuándo se reconsidera? |
|---|---|---|
| Otros usuarios, cuentas, compartir | Es una herramienta personal; evita autenticación y privacidad ajena | Cuando el autor quiera compartirla |
| ~~Estadísticas e interfaces interactivas del progreso~~ | *Entran en la versión 1.2 (DEC-46).* Siguen fuera los gráficos de varios años, exportar estadísticas y los objetivos con metas numéricas | Cuando el uso diario lo pida |
| Integración con Todoist | Dependencia de un tercero que se quiere abandonar | Solo si hace falta migrar datos |
| Conexión con Google Calendar | Exige cuenta de Google y permisos de su API | Versión 2 |
| Uso sin conexión (marcar sin cobertura) | La versión 1 necesita internet: sin conexión se ve lo ya cargado, pero no se puede marcar (DEC-25) | Si el uso diario lo pide (D-01 en [06-riesgos](06-riesgos.md)) |
| iPhone | Compilar para iPhone exige un Mac o servicios de pago | Cuando el humano lo decida |
| Publicación en Google Play | Cuesta 25 USD y exige una prueba con 12 personas; el APK instalable cubre el uso diario | Cuando el humano lo decida |

Todo lo que llegue y no esté en el alcance va a una lista de espera, no a tareas.

## Restricciones

Lo que no se elige, viene dado: plazo, presupuesto, equipo, tecnología impuesta, normativa.

| Restricción | Detalle |
|---|---|
| Plazo | **Sin fecha límite** (DEC-07): el autor es estudiante y avanza según su tiempo libre. Solo se fijan fechas si él lo pide |
| Presupuesto | **Coste cero**: solo servicios gratuitos. Google Play (25 USD, una vez) solo cuando el humano decida publicar (DEC-18) |
| Tecnología | Expo (React Native) y Supabase, con Vercel para la web, en sus planes gratuitos (DEC-24, [ADR-0005](adr/0005-stack-expo.md)) |
| Equipo | Una persona más agentes de IA coordinados con Orca. El proyecto también sirve para aprender ese flujo y Jira |
| Normativa y datos personales | Solo datos del propio autor. Sin terceros |

## Lista de espera

Ideas que han aparecido y quedan para después de la versión 1.

| Idea | Quién la propuso | Fecha |
|---|---|---|
| Recordatorios con antelación para entregas de la universidad | Humano | 2026-10-05 |
| ~~Estadísticas e interfaces interactivas del progreso~~ (planificadas en la 1.2, DEC-46) | Humano | 2026-10-05 |
| Conexión con Google Calendar (versión 2) y Google Play (cuando el humano decida) | Humano | 2026-10-05 |
