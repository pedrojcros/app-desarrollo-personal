# Registro de incidencias

El registro local conserva los problemas que hacen perder tiempo durante el
trabajo, para preparar una retrospectiva con datos al cerrar cada versión. El
fichero `logs/incidents.jsonl` vive en la raíz principal del repositorio, incluso
cuando una orden se ejecuta desde un worktree. Está ignorado por Git; el resumen
de la retrospectiva es lo que se comparte.

## Contrato

Cada línea es un objeto JSON con `date`, `type`, `task`, `minutes`, `cause`,
`fix` y `source`. `date` es un instante ISO 8601 con zona horaria; `type` es
`environment`, `quota`, `stuck-agent`, `flaky-test`, `app-bug`, `waiting-human`
o `tool`; `task` es una clave como `ADP-27` o texto vacío; `minutes` es un
entero mayor o igual que cero; `cause` y `fix` son texto; `source` es
`supervisor` u `orchestrator`.

`ADP_INCIDENTS_FILE` permite indicar otro fichero, sobre todo para pruebas.
`incident_log.py` valida las escrituras y añade líneas sin reescribir el
registro. Las lecturas omiten las líneas inválidas e informan cuántas omitieron.

## Órdenes

Registrar una incidencia manualmente:

```sh
python3 scripts/incidents/record_incident.py --type environment --minutes 20 \
  --cause "ADB perdió el emulador" --fix "docker/android/reset" --task ADP-27
```

`--fix`, `--task` son opcionales; `--source` acepta `orchestrator` o
`supervisor` y usa `orchestrator` por defecto.

Generar un informe desde una fecha:

```sh
python3 scripts/incidents/report.py --since 2026-10-01
```

Limitar también la fecha final:

```sh
python3 scripts/incidents/report.py --since 2026-10-01 --until 2026-10-31
```

El informe muestra los minutos por tipo, las causas repetidas y las tareas con
más minutos. El supervisor añade incidencias cuando envía encargos, concede
permisos, gestiona esperas o avisa de trabajadores parados; un error al guardar
se comunica en el terminal sin detener la supervisión.

## Medir encargos y sesiones

`measure.py` cruza metadatos locales de Codex y Claude Code, los pull requests
de GitHub y las incidencias. Solo lee rutas, modelos, marcas de tiempo y
contadores de uso de las sesiones; no lee ni guarda el texto de las
conversaciones. Usa exclusivamente la biblioteca estándar de Python y `gh`.

Medir un encargo (las sesiones se agrupan por agente y modelo):

```sh
python3 scripts/incidents/measure.py task ADP-16
```

Imprimir una línea breve para pegar en Jira:

```sh
python3 scripts/incidents/measure.py task ADP-16 --jira
```

Listar las sesiones de Claude Code de la carpeta principal del repositorio,
desde una fecha:

```sh
python3 scripts/incidents/measure.py sessions --since 2026-10-01
```

Se incluyen las sesiones con actividad desde la fecha indicada, aunque hayan
empezado antes. Los pasos, tokens, inicio y duración corresponden únicamente
a la actividad desde esa fecha.

`--folder RUTA` permite indicar otra carpeta de trabajo. Una sesión pertenece
a esa carpeta si cualquiera de sus `cwd` está en ella o en una subcarpeta. Las fuentes se pueden
redirigir para las pruebas o para una máquina distinta con `ADP_CODEX_SESSIONS`
y `ADP_CLAUDE_SESSIONS`; `ADP_PULL_REQUESTS_FILE` sustituye la consulta a `gh`
por un JSON con su respuesta. `ADP_INCIDENTS_FILE` conserva el significado
documentado arriba. Una fuente ausente o ilegible genera un aviso y no impide
mostrar los datos de las otras fuentes.

Los contadores de Codex son acumulados por sesión: se toma el último registro,
y los tokens nuevos se calculan restando los tokens releídos de la entrada
total. Claude registra uso por paso, por lo que se suma una sola vez cada `message.id`, aunque aparezca repetido. En
`test_data/` hay sesiones pequeñas inventadas para probar ambos formatos sin
acceder a los directorios personales.
