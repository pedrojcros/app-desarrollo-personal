# Sincronización con Jira

`jira.py` mueve incidencias, gestiona etiquetas de agente, añade comentarios y
consulta el estado usando la API de Jira Cloud. Lee `JIRA_EMAIL`,
`JIRA_API_TOKEN` y `JIRA_CLOUD_ID` del entorno o de
`~/.config/app-desarrollo-personal/secretos.env`; el correo y el cloud id tienen
valores predeterminados. El flujo de GitHub actualiza las incidencias al subir
ramas con una clave ADP o al abrir y fusionar PR contra `develop`.

```sh
python3 scripts/jira/jira.py move ADP-12 en-curso
python3 scripts/jira/jira.py agent ADP-12 codex
python3 scripts/jira/jira.py comment ADP-12 "Comentario"
python3 scripts/jira/jira.py status ADP-12
```

Las pruebas usan solo la biblioteca estándar:

```sh
python3 -m unittest discover scripts/jira
```
