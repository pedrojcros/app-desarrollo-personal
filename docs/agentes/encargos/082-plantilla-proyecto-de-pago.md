# Encargo 082 — Plantilla: proyecto de pago, «Primer día» y versión 0.1

| Campo | Valor |
|---|---|
| Tarea del plan | Plantilla para proyectos de pago ([propuesta](../../propuestas/plantilla.md), DEC-60 y DEC-61) |
| Ticket | Sin ticket |
| Agente | **El orquestador** (DEC-57: documentación e integración final) |
| Modelo y esfuerzo | Opus 5.5, esfuerzo alto |
| Skills a usar | `cognitive-doc-design` |
| Repositorio | `pedrojcros/template-multiagents-develop` |
| Rama y worktree | `docs/proyecto-de-pago`, desde `main` con el 079 fusionado |
| Depende de | 079 fusionado; la etiqueta, también el 080 y el 081 |
| Reservado para este encargo | Los documentos nuevos de `docs/` que se listan abajo y `README.md` |

## Objetivo

Que la plantilla sirva para un proyecto de cliente desde el primer día, y publicar su versión `v0.1`.

## Qué hacer

1. Documentos nuevos de la sección 4 de la propuesta, como esqueletos con instrucciones:
   - `docs/00-encargo-del-cliente.md`: qué se ha contratado, qué no entra, precio o forma de cobro, plazos y cómo se piden los cambios;
   - `docs/hitos.md`: cada hito con su criterio de aceptación del cliente, y que se cobra cuando lo acepta;
   - `docs/coste.md`: horas del humano y tokens medidos con `measure.py`;
   - `docs/traspaso.md`: despliegue, dónde están las cuentas y las credenciales (sin escribirlas) y mantenimiento.
2. Los papeles del cliente (DEC-61, punto 4) en `AGENTS.md` y en `docs/agentes/arquitecto.md`: el cliente decide el qué, el humano el cómo, **los agentes nunca hablan con el cliente**.
3. Las reglas de datos y secretos del cliente (punto 6) como prohibiciones de `AGENTS.md`.
4. Jira como módulo opcional (punto 7): cómo se apaga, en `docs/agentes/jira.md`.
5. El idioma de los artefactos como un valor de `AGENTS.md` que se elige por proyecto, español por defecto (punto 8).
6. `docs/primer-dia.md`: la lista que pasa el arquitecto en un proyecto nuevo (copiar la plantilla, aplicar un perfil, rellenar `proyecto.env`, el encargo del cliente, los hitos y las primeras sesiones de `/arquitecto`).
7. `README.md`: qué es la plantilla, sus tres capas y cómo se usa.
8. Con el 080 y el 081 fusionados: el changelog de `v0.1` en `CHANGELOG.md` y la etiqueta `v0.1`.

## Lo que hace el humano

Marcar el repositorio como *template* en GitHub (Settings → Template repository), o dar permiso para hacerlo con `gh repo edit --template`.

## Criterio de hecho

- Un proyecto nuevo puede seguir `docs/primer-dia.md` sin preguntar nada que no esté escrito.
- Enlaces relativos sin romper.
- PR contra `main` de la plantilla y etiqueta `v0.1` tras fusionarlo.

## Cómo informar al terminar

Qué documentos hay, dudas abiertas, el enlace al PR y la etiqueta.
