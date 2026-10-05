# Lo que lleva un proyecto por defecto

Lista del arquitecto. Cada punto es un **valor por defecto razonable**: se acepta, se ajusta o se descarta **con un motivo escrito** en [decisiones](../decisiones.md). Lo que se descarta en silencio es lo que luego duele.

Se recorre en la sesión 6 de la [agenda](arquitecto.md). El criterio general: *barato de hacer el día 1, caro de añadir después* va a la primera tarea del plan; lo demás, cuando haga falta.

Marcas: **[día 1]** entra en el esqueleto · **[cuando toque]** se añade al necesitarlo · **[según proyecto]** depende de lo que sea.

## 1. Repositorio y flujo

- **[día 1]** Repositorio git con `develop` y `main` protegidas: nada entra sin PR y sin CI en verde, y `main` solo recibe `develop` por mano del humano. *(Si la plataforma no permite proteger ramas en el plan gratuito, regla escrita en `AGENTS.md`, que ya la tiene.)*
- **[día 1]** `AGENTS.md` (reglas para agentes) + `CLAUDE.md` que lo importa + `docs/contexto.md`.
- **[día 1]** `.gitignore` con secretos y dependencias; `.env.example` versionado con todas las variables, sin valores reales.
- **[día 1]** Plantilla de PR.
- **[día 1]** Un solo tipo de fin de línea y de formato, forzado por herramienta (`.editorconfig` y formateador), para que los diffs sean limpios.
- **[día 1]** Nombre de rama y de commit con la clave del ticket.
- **[día 1]** Cada publicación de `develop` a `main` lleva una **etiqueta de versión** y unas notas de cambios breves.
- **[cuando toque]** Versionado semántico y *changelog* detallado si hay consumidores externos.

## 2. Calidad

- **[día 1]** **Tests desde la primera tarea**, con un test de extremo a extremo trivial que demuestre que todo el montaje funciona.
- **[día 1]** Linter y compilación estricta (tipado estricto si el lenguaje lo ofrece), con las reglas más severas que se aguanten.
- **[día 1]** Formateador automático.
- **[día 1]** **Integración continua** que repite en cada push y PR: tests, linter, compilación. Acciones/dependencias de CI con versión fijada.
- **[día 1]** Pirámide de pruebas: muchas unitarias (lógica pura, sin framework), algunas de integración contra piezas **reales** (la base de datos real, no en memoria), pocas de extremo a extremo.
- **[día 1]** Regla de **legibilidad** para el código (ver `AGENTS.md`): al haber agentes escribiendo, es lo que mantiene el código revisable por una persona.
- **[cuando toque]** Cobertura mínima en el módulo central; no como cifra global.
- **[cuando toque]** Pruebas de carga, solo si hay un requisito de rendimiento escrito.

## 3. Entornos y configuración

- **[día 1]** Arranque en local **con un comando** (contenedores para dependencias como la base de datos). El README dice cómo.
- **[día 1]** Configuración por variables de entorno, con valores por defecto seguros. Cero valores de producción en el código.
- **[día 1]** Versión de la plataforma fijada en un fichero (`.nvmrc`, `.tool-versions`, `pom.xml`, `pyproject`...) y documentada en `AGENTS.md`.
- **[según proyecto]** Entornos: local → (staging) → producción. Staging solo si hay usuarios reales a los que no se puede romper.

## 4. Datos

- **[día 1, si hay base de datos]** **Migraciones versionadas**; una migración aplicada no se edita, se crea otra.
- **[día 1]** Identificadores, fechas e instantes con tipos propios y zona horaria decidida (UTC por defecto).
- **[día 1]** Nombres de tablas y columnas con una convención escrita.
- **[según proyecto]** Copias de seguridad automáticas y **un test de restauración** antes de producción. Una copia que nunca se ha restaurado no existe.
- **[según proyecto]** Datos semilla y de prueba reproducibles.

## 5. API e interfaces

- **[día 1, si hay API]** **El contrato se escribe antes que el código** (OpenAPI u otro) y los tipos de los clientes se generan de él. Es lo que permite repartir backend y frontend en paralelo.
- **[día 1]** Formato único de errores (por ejemplo `ProblemDetail`/RFC 9457) y códigos de estado coherentes.
- **[día 1]** Una sola capa de acceso a la API en el cliente; ningún componente llama a la red directamente.
- **[cuando toque]** Paginación, filtros y versionado de la API: cuando haya un consumidor al que no se pueda romper.

## 6. Seguridad

- **[día 1]** **Cero secretos en el repositorio.** Escaneo de secretos en CI.
- **[día 1]** Autenticación y autorización decididas en una ADR **antes** de escribir endpoints; la autorización se comprueba en el servidor, nunca solo en la interfaz.
- **[día 1]** Entrada validada en el borde del sistema; salida escapada.
- **[día 1]** Contraseñas con algoritmo de derivación lento (nunca cifrado reversible ni hash simple), si el proyecto las guarda.
- **[día 1]** Dependencias: política de aprobación escrita (`AGENTS.md`), versiones fijadas por lockfile, y revisión automática de vulnerabilidades en CI.
- **[día 1]** Cabeceras de seguridad, CSRF/CORS configurados de forma explícita.
- **[según proyecto]** **Datos personales**: qué se guarda, por qué, quién lo ve. Mínimo necesario, nunca en respuestas públicas, y atención especial si hay **menores**. Decidir antes del modelo de datos.
- **[según proyecto]** Límite de peticiones y protección ante abuso, si hay endpoints públicos.

## 7. Observabilidad y operación

- **[día 1]** Un endpoint de salud.
- **[día 1]** Registros (*logs*) estructurados, sin datos personales ni secretos.
- **[cuando toque]** Métricas y alertas mínimas: ¿está caído?, ¿hay errores?
- **[cuando toque]** Seguimiento de errores en producción.
- **[según proyecto]** Despliegue repetible (script o pipeline) y **plan de vuelta atrás** escrito antes del primer despliegue.
- **[según proyecto]** Nada de despliegues justo antes de un evento importante.

## 8. Interfaz de usuario (si hay)

- **[día 1]** Móvil primero si los usuarios van a estar en móvil. Ancho mínimo de diseño decidido.
- **[día 1]** Accesibilidad básica: contraste, foco de teclado, etiquetas en formularios, textos alternativos.
- **[cuando toque]** Internacionalización, solo si hay más de un idioma real en el alcance.

## 9. Dependencias y terceros

- **[día 1]** Lo externo **nunca en el camino crítico** si se puede evitar: si la API de un tercero cae, ¿sigue funcionando lo esencial? Si no, es un riesgo con contingencia.
- **[día 1]** Cada dependencia nueva se justifica: qué problema resuelve, cuánto pesa y cómo se sustituye.
- **[según proyecto]** Cuotas, claves y plazos de aprobación de terceros anotados en [06-riesgos](../06-riesgos.md).

## 10. Documentación y decisiones

- **[día 1]** Estas piezas, que ya trae el kit: visión y alcance, funcionalidades, casos de uso, arquitectura, plan, riesgos, decisiones, ADR, contexto.
- **[día 1]** La documentación se actualiza **en el mismo commit** que el cambio que la deja obsoleta.
- **[día 1]** Los términos del dominio, en un glosario dentro de [04-arquitectura](../04-arquitectura.md); el idioma ya decidido (DEC-06): nombres en inglés, comentarios, commits y documentación en español.
- **[cuando toque]** Runbook (cómo se opera, qué hacer si algo cae) cuando haya producción.

## 11. Orquestación y agentes

- **[día 1]** Tabla de [agentes disponibles](agentes-disponibles.md) al día y probada.
- **[día 1]** Jira activo (proyecto `ADP`, DEC-02): falta comprobarlo en el equipo donde se ejecutará.
- **[día 1]** Lo que **nunca** se delega, escrito en [orquestador](orquestador.md).
- **[día 1]** Política de merge decidida (DEC-01): el orquestador fusiona a `develop`, el humano publica a `main`.
- **[día 1]** Tope de paralelismo decidido (DEC-03): 3.
- **[día 1]** Primera tarea del plan hecha por **un solo agente** y revisada entera por el humano, antes de abrir el paralelismo.

## 12. Alcance (lo más importante)

- **[día 1]** Lista de **fuera de alcance** con nombre, en [01-vision-y-alcance](../01-vision-y-alcance.md), y una **lista de espera** para lo que llegue después. Esta regla decide si el proyecto se entrega.
- **[día 1]** Qué hace «terminado» a la primera versión, medible.
- **[según proyecto]** Si no hay fecha límite, **ponerse una**: sin ella no hay freno natural al alcance. *(Descartado en este proyecto, DEC-07: sin fecha límite; el freno es la lista de fuera de alcance.)*
