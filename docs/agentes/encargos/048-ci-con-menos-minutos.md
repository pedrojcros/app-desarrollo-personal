# Encargo 048 — Que la CI gaste muchos menos minutos (DEC-44)

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Agente | codex, `--model gpt-6-luna` (configuración con pasos fijados; DEC-41) |
| Skills | `codigo-legible` (en `.agents/skills/`); a demanda, `.agents/skills-a-demanda/ci-cd-and-automation` |
| Rama | `chore/ci-con-menos-minutos`, desde `origin/develop` |
| Reservado | `.github/workflows/ci.yml`, `.github/workflows/deploy-preview.yml`, `.github/workflows/deploy-pruebas.yml`, `scripts/jira/jira.py`, la sección de la CI en `README.md` |

## Por qué

El 2026-10-09 se acabaron los minutos gratis de GitHub Actions del repositorio privado y la CI dejó de arrancar. El humano lo hizo **público por ahora** (Actions es gratis en los públicos) y quiere poder volver a **privado** cuando acabe el desarrollo inicial, con pocos cambios al mes, **sin quedarse sin minutos**. Hoy cada PR lanza:

- la CI completa (unos 10 minutos: Docker, Supabase, integración y exportación);
- una vista previa en Vercel;
- y, al fusionar, otra vez la CI completa y el despliegue a pruebas.

Además, los PR que solo cambian documentación pagan lo mismo.

## Qué hacer (cada punto, un commit)

1. **`ci.yml`:**
   - `concurrency` por rama con `cancel-in-progress: true`, para que un push nuevo cancele el anterior;
   - `paths-ignore` para lo que no cambia la app: `docs/**`, `**/*.md` (salvo que el PR también toque código), `.agents/**` y `.claude/**`;
   - si `ci.yml` es un *required check*, que un PR solo de documentación no quede bloqueado. Comprueba en la documentación oficial de GitHub cómo se hace (un trabajo «vacío» que pasa, o filtros dentro del trabajo) y aplícalo.
2. **`ci.yml`, la parte cara:** guarda en caché lo que se pueda sin dependencias nuevas, como la caché de npm y la de la imagen de Docker con `actions/cache` o la caché de `docker/build-push-action` si ya se usa. Mide el antes y el después con los tiempos de los últimos runs (`gh run list`, `gh run view`) y ponlos en el PR.
3. **No repetir trabajo al fusionar:**
   - en `push` a `develop`, la CI ya pasó en el PR: que el push solo haga lo imprescindible (el despliegue a pruebas con sus migraciones), sin volver a pasar toda la batería;
   - en `push` a `main` se mantiene la CI completa, porque es la publicación.
4. **`deploy-preview.yml`:** que la vista previa de Vercel **no se lance en cada PR**, solo cuando el PR tenga la etiqueta `preview` o lo pida el orquestador a mano (`workflow_dispatch`). Mantén el `concurrency` con cancelación.
5. **`scripts/jira/jira.py`:** quita el correo del dueño escrito en el código (`DEFAULT_EMAIL`). Que se lea solo de `JIRA_EMAIL` (entorno o `~/.config/app-desarrollo-personal/secretos.env`, como el token), con un error claro si falta.
6. **`README.md`:** en la sección de la CI, explica en pocas líneas qué se lanza y cuándo, y cómo pedir una vista previa (etiqueta `preview`).

## Criterio de hecho

- [ ] La CI de tu PR pasa, y un PR de prueba solo con un cambio en `docs/` no lanza la CI cara pero queda fusionable. Abre ese PR de prueba aparte, enlázalo y ciérralo sin fusionar.
- [ ] El PR dice cuántos minutos se ahorran por PR y por fusión (estimación con los tiempos reales).
- [ ] `python3 scripts/jira/jira.py status ADP-1` funciona con `JIRA_EMAIL` en `secretos.env`; el script ya no contiene ningún correo.
- [ ] PR abierto contra `develop` con un título que empiece por «CI». **No hagas merge.**

No cambies los despliegues a producción (`deploy-produccion.yml` y `deploy-web.yml`) ni las copias (`backup.yml`). Si algo no está claro, pregunta con `orca orchestration ask`. Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`).
