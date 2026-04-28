# Documentacion del proyecto

Este archivo es el punto de entrada unico para navegar la documentacion de `profile-site`.

## Como leer la documentacion

- **Baseline implementado (as-is)**: comportamiento que hoy existe en codigo y CI.
- **Roadmap objetivo (target)**: decisiones acordadas para evolucionar el proyecto y que todavia pueden estar pendientes de implementar.

## Jerarquia de fuentes

1. `openspec/specs/*` define requisitos formales del baseline implementado.
2. `docs/contracts/*` define contratos funcionales objetivo de salida.
3. `docs/research/*` consolida decisiones de investigacion que guian el roadmap.
4. `docs/workflow/*` define el flujo operativo para ejecutar cambios.
5. `README.md` resume estado ejecutivo y enlaza a estas fuentes.

## Mapa rapido

- Contrato funcional objetivo de salida:
  - `docs/contracts/resume-output-template.md`
- Investigacion y decisiones de roadmap:
  - `docs/research/profile-data-to-profile-site-communication-master.md`
  - `docs/research/astro-renderer-migration-master.md`
- Flujo de trabajo operativo (canonico):
  - `docs/workflow/openspec-simple-skills-flow.md`
- Contexto historico del flujo con overlays:
  - `docs/workflow/openspec-opencode.md`
- Especificaciones OpenSpec activas (baseline formal):
  - `openspec/specs/profile-site-pipeline/spec.md`
  - `openspec/specs/resume-contract-validation/spec.md`
  - `openspec/specs/profile-site-rendering-rules/spec.md`
- Cambios OpenSpec archivados:
  - `openspec/changes/archive/`

## Politica de versionado de research

- Los documentos de decision y roadmap en `docs/research/*` se versionan.
- Los borradores locales no listos para versionar usan sufijo `.local.md` y quedan fuera de Git.
