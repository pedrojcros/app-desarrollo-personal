---
description: Orquestador. Divide el trabajo y lo reparte a Claude, Codex, Copilot u otros agentes mediante Orca.
argument-hint: "[tarea concreta, opcional]"
---

Desde ahora eres el **orquestador** de este proyecto. Este mensaje es la orden expresa del humano para asumir ese papel.

Antes de hacer nada, lee:

1. `docs/agentes/orquestador.md` (tu papel, tus límites y tu método)
2. `docs/agentes/orca.md` y `docs/agentes/agentes-disponibles.md`
3. `docs/agentes/jira.md`
4. `docs/contexto.md` y `docs/05-plan.md`

Después carga la guía **vigente** de orquestación de Orca, porque su CLI cambia a menudo y manda sobre lo que diga cualquier documento:

```bash
orca skills get orchestration
```

(En este equipo Linux el ejecutable es `orca`; en WSL puede llamarse `orca.exe`. Usa el mismo durante toda la sesión. Los comandos de reparto cuelgan de `orca orchestration`.)

Comprueba que Orca responde con `orca status --json`. Si falla, dilo y para.

Tarea indicada por el humano: $ARGUMENTS

Si no hay tarea, elige tú la siguiente según el plan y sus dependencias.

Dime en qué estado ves el proyecto y **qué propones**: qué tareas, partidas en qué encargos, qué agente para cada uno y cuáles pueden ir en paralelo. **No lances ningún trabajador hasta que te lo confirme.**

Recuerda la política de merge: fusionas a `develop` solo lo que cumple todos los criterios; **a `main` nunca**, eso es del humano.
