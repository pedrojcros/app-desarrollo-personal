# Encargo 036 — Arreglar el test intermitente de «Todo no hecho» (RF-14)

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Ticket | `ADP-18` (solo informativo: no lo toques) |
| Agente | claude, `--model claude-sonnet-5-5` |
| Skills | `systematic-debugging`, `test-driven-development` (en `.agents/skills/`) |
| Rama | `ADP-18-test-intermitente`, desde `origin/develop` |
| Reservado | `src/components/past-pending/past-pending-screen.test.tsx`; el código de producción **solo** si la causa está ahí (dilo en el informe) |

## Qué pasa

En la CI de GitHub fallan siempre, desde el 2026-10-08 hacia las 09:30 UTC, dos tests de `src/components/past-pending/past-pending-screen.test.tsx`:

- `Mark a whole day as not done (RF-14) › marks everything pending that day with a single notice`, con «Unable to find an element with text: 2 marcadas como no hechas»;
- `… › brings the whole day back with Undo`.

En la CI esa suite tarda unos 14,6 s. En local pasan siempre, también con `TZ=UTC` y con la batería completa. Con el mismo código, la CI de `develop` pasó a las 06:10 UTC.

**Hipótesis del orquestador, por comprobar:** el aviso con «Deshacer» se oculta solo a los 4 segundos. Con la CI lenta, desaparece antes de que el test lo busque. Busca también cualquier otra dependencia del reloj real (`new Date()`, temporizadores, el `markedAt` de las marcas).

## Qué hacer

1. **Reproduce el fallo antes de arreglar nada.** Por ejemplo, ralentiza a propósito el guardado simulado o usa los temporizadores simulados de Jest con un avance mayor que el del aviso. Demuestra la causa.
2. **Haz el test independiente del tiempo real:** temporizadores simulados, o esperar el aviso de forma que no dependa de lo rápida que sea la máquina. Que siga comprobando lo mismo: un solo aviso con su texto y que «Deshacer» devuelve todo el día. **No subas los tiempos de espera ni quites comprobaciones.**
3. **Revisa los otros tests de ese fichero** y de `src/data/marks.test.tsx` que miran el aviso, por si tienen el mismo problema, y corrígelos igual.
4. **Comprueba:**
   - el fichero pasa 10 veces seguidas (`for i in $(seq 10); do ./docker/app/run npx jest <fichero> || break; done`);
   - lint, tipos y `npm run test` en verde, dentro de Docker;
   - la CI de tu PR en verde.
5. Commits en español, push y PR contra `develop` con `ADP-18` en el título.

Termina con `worker_done` (resumen de tres frases con la causa demostrada y `--outcome succeeded|failed`).
