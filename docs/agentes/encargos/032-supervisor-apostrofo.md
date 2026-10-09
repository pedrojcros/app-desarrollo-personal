# Encargo 032 — El supervisor reconoce el aviso de cuota con apóstrofo tipográfico

> **Permiso de publicación:** puedes hacer `git push` de tu rama y abrir el PR contra `develop`. Nunca hagas merge.

| Campo | Valor |
|---|---|
| Agente | copilot (pequeño y mecánico, DEC-39) |
| Rama | `fix/supervisor-apostrofo`, desde `develop` |
| Reservado | `scripts/orca/supervise_workers.py` (solo la detección del aviso de cuota) y `scripts/orca/test_supervise_workers.py` |

## Qué pasa

La pantalla real de Codex (2026-10-07) dice `■ You’ve hit your usage limit.` con el apóstrofo tipográfico `’` (U+2019), y el supervisor busca `You've` con el apóstrofo recto. Por eso `detect_usage_limit` da `False` y el supervisor avisa de inactividad en vez de esperar la cuota.

## Qué hacer

1. **Test primero**, en `scripts/orca/test_supervise_workers.py`, con este texto real:

   ```
   ■ You’ve hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/settings/
   usage to purchase more credits or try again at Oct 8th, 2026 2:09 AM.
   › Ask Codex to do anything
   ```

   Tiene que detectarse como límite de cuota sin menú, esperar a las 02:09 y no contestar «2». Mantén también el caso con el apóstrofo recto.
2. Haz que la detección acepte los dos apóstrofos. Por ejemplo, busca `hit your usage limit`, sin el principio. Usa el mismo texto en los dos sitios donde se mira el aviso.
3. Un commit en español, push y PR contra `develop` con un título que empiece por «Supervisor».

No toques nada más. Regla de legibilidad de `AGENTS.md`.

## Criterio de hecho

- [ ] `python3 -m unittest scripts/orca/test_supervise_workers.py` pasa, con el caso nuevo.
- [ ] PR abierto contra `develop`. **No hagas merge.**

Termina con `worker_done` (resumen de tres frases y `--outcome succeeded|failed`).
