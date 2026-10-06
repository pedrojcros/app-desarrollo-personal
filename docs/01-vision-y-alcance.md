# Visión y alcance

Qué se construye, para quién y por qué. También, y sobre todo, **qué no**.

*Estado: **suscrito por el humano** al aprobar el plan, el 2026-10-06 (DEC-08, DEC-09 y DEC-19).*

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
- [ ] Funciona en el ordenador. La versión 1 **no** exige móvil.

*(Criterios iniciales del humano. Se irán añadiendo casos de uso según se use la aplicación.)*

## Alcance de la versión 1

Las 14 funcionalidades imprescindibles están en [02-funcionalidades](02-funcionalidades.md); las 8 deseables van justo después (DEC-19). Perímetro:

- Crear, editar y borrar tareas (con fecha y sin fecha) y hábitos recurrentes. Frecuencias: todos los días, días de la semana, cada N días y cada mes. Momento del día opcional (hora exacta o franja) y duración opcional.
- Estado de cada ocurrencia: pendiente, **hecha** o **no hecha**.
- Categorías mínimas para agrupar hábitos y tareas («Compra», «Universidad»): nombre único, una por elemento, opcional (DEC-13).
- Vistas: **Hoy** (solo lo de hoy, nunca tareas sin fecha), **Bandeja de entrada** (lo que no tiene categoría), cada categoría, pendientes de días anteriores e historial (DEC-15).

**Plataforma de la versión 1:** web para el ordenador, alojada gratis en internet (Vercel y Supabase) con inicio de sesión solo para el dueño (DEC-16, DEC-19). El móvil llega en la versión siguiente (ver abajo), así que la versión 1 se diseña para que añadirlo no obligue a rehacerla.

## Versión siguiente (confirmada, no se construye ahora)

Estas dos cosas **irán de la mano** en la versión siguiente y condicionan el diseño de la 1:

- **Uso en el móvil como web instalable** (gratis, sin tienda). Publicar en Google Play queda para cuando el humano lo decida (DEC-18).
- **Conexión con Google Calendar**: la aplicación crea eventos en el calendario (por ejemplo, la sesión de natación de los miércoles o la entrega de una práctica).

## Fuera de alcance

**Lo que no se construye, aunque lo pida alguien.** Cada línea con su motivo. Esta lista es lo que hace que el proyecto se termine.

| Fuera de alcance | Por qué | ¿Cuándo se reconsidera? |
|---|---|---|
| Otros usuarios, cuentas, compartir | Es una herramienta personal; evita autenticación y privacidad ajena | Cuando el autor quiera compartirla |
| Estadísticas e interfaces interactivas del progreso | Valiosas, pero el historial tiene que existir antes | Primera versión posterior a la 1 |
| Recordatorios y avisos («en 4 días entregas X») | Exigen notificaciones fuera de la aplicación, que es una decisión de arquitectura cara | Después de la 1, con su propia ADR |
| Integración con Todoist | Dependencia de un tercero que se quiere abandonar | Solo si hace falta migrar datos |
| Conexión con Google Calendar y uso en el móvil | Se hacen juntos; **sí están previstos para la versión siguiente** (el móvil como web instalable, DEC-18) | Versión 2 |
| Publicación en Google Play | Cuesta 25 USD y exige una prueba con 12 personas; la web instalable cubre el uso diario | Cuando el humano lo decida |

Todo lo que llegue y no esté en el alcance va a una lista de espera, no a tareas.

## Restricciones

Lo que no se elige, viene dado: plazo, presupuesto, equipo, tecnología impuesta, normativa.

| Restricción | Detalle |
|---|---|
| Plazo | **Sin fecha límite** (DEC-07): el autor es estudiante y avanza según su tiempo libre. Solo se fijan fechas si él lo pide |
| Presupuesto | **Coste cero**: solo servicios gratuitos. Google Play (25 USD, una vez) solo cuando el humano decida publicar (DEC-18) |
| Tecnología | Next.js, Supabase y Vercel en sus planes gratuitos (DEC-16, [ADR-0001](adr/0001-stack.md)) |
| Equipo | Una persona más agentes de IA coordinados con Orca. El proyecto también sirve para aprender ese flujo y Jira |
| Normativa y datos personales | Solo datos del propio autor. Sin terceros |

## Lista de espera

Ideas que han aparecido y quedan para después de la versión 1.

| Idea | Quién la propuso | Fecha |
|---|---|---|
| Recordatorios con antelación para entregas de la universidad | Humano | 2026-10-05 |
| Estadísticas e interfaces interactivas del progreso | Humano | 2026-10-05 |
| Web instalable en el móvil y conexión con Google Calendar (versión siguiente, juntos); Google Play más adelante | Humano | 2026-10-05 |
