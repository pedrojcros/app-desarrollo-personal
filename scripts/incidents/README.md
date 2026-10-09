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
