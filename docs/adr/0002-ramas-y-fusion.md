# ADR-0002: Modelo de ramas y de fusión

- **Estado:** Aceptada (DEC-01)
- **Fecha:** 2026-10-06
- **Decisores:** el humano

## Contexto

Varios agentes trabajan en paralelo y el humano revisa poco y cuando puede. Quiere que `main` tenga solo versiones estables y completas.

## Opciones consideradas

- **A:** `develop` para integrar, con fusión del orquestador; `main` solo para versiones, que publica el humano.
- **B:** solo `main`, con todos los PR fusionados por el humano.
- **C:** solo `main`, con fusión automática si la integración continua pasa.

## Decisión

**A.** La integración no espera al humano y `main` solo recibe lo que él decide publicar.

## Consecuencias

- **Más fácil:** avanzar en paralelo; `main` siempre estable.
- **Más difícil:** `develop` puede romperse si una revisión falla (lo frenan la integración continua y los tests que ejecuta el orquestador). Hay dos ramas que mantener. En un repositorio privado con el plan gratuito de GitHub puede no haber protección de ramas: la regla vive escrita en `AGENTS.md`.
- **Revisar:** si aparecen fusiones malas en `develop`.
