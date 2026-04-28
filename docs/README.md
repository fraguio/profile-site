# Documentación del proyecto

Este archivo es el punto de entrada único para navegar la documentación de `profile-site`.

## Cómo leer la documentación

- **Baseline implementado (as-is)**: comportamiento que hoy existe en código y CI.
- **Roadmap objetivo (target)**: decisiones acordadas para evolucionar el proyecto y que todavía pueden estar pendientes de implementar.

## Fuentes por capa

- **As-is (implementado)**:
  - `openspec/specs/*` define requisitos formales del baseline implementado.
  - `README.md` resume el estado ejecutivo y enlaza al resto de artefactos.
- **Target (roadmap acordado)**:
  - `docs/contracts/*` define contratos funcionales objetivo de salida.
  - `docs/research/*` consolida decisiones de investigación que guían el roadmap.
- **Operativa de ejecución**:
  - `docs/workflow/*` define el flujo operativo para ejecutar cambios.

## Mapa rápido

- Contrato funcional objetivo de salida:
  - `docs/contracts/resume-output-template.md`
- Investigación y decisiones de roadmap:
  - `docs/research/profile-data-to-profile-site-communication-master.md`
  - `docs/research/astro-renderer-migration-master.md`
- Flujo de trabajo operativo (canónico):
  - `docs/workflow/openspec-simple-skills-flow.md`
- Contexto histórico del flujo con overlays:
  - `docs/workflow/openspec-opencode.md`
- Especificaciones OpenSpec activas (baseline formal):
  - `openspec/specs/profile-site-pipeline/spec.md`
  - `openspec/specs/resume-contract-validation/spec.md`
  - `openspec/specs/profile-site-rendering-rules/spec.md`
- Cambios OpenSpec archivados:
  - `openspec/changes/archive/`

## Política de versionado de research

- Los documentos de decisión y roadmap en `docs/research/*` se versionan.
- Los borradores locales no listos para versionar usan sufijo `.local.md` y quedan fuera de Git.
