# AGENTS

Este archivo define reglas operativas para agentes en `profile-site`.
Es un contrato vivo: estable en principios, actualizable cuando cambian decisiones del proyecto.

## 1) Precedencia de fuentes (principio general)

Cuando exista conflicto entre artefactos, aplicar este orden de autoridad:

1. `docs/contracts/*` + `docs/research/*` + cambio OpenSpec activo en `openspec/changes/*`.
2. `openspec/specs/*` (baseline formal vigente del estado implementado).
3. Implementación actual en código/CI (legacy o pendiente de alinear).

Regla: no tomar la implementación actual como fuente de verdad si contradice roadmap/documentación aprobada o el cambio OpenSpec activo.

## 2) Política OpenSpec (comandos)

En este repositorio se usan overlays locales como capa canónica:

- Proponer cambios: usar siempre `/ospec-propose`.
- Implementar tareas: usar siempre `/ospec-apply`.
- Archivar cambios completados: usar `/opsx-archive` hasta que exista `ospec-archive`.

No usar directamente `/opsx-propose` ni `/opsx-apply` para trabajo operativo normal.

## 3) Idioma operativo

- Regla general: para texto en español, usar siempre español natural; en ningún caso ASCII simplificado.
- Respuesta del agente al usuario: español.
- Artefactos OpenSpec (`proposal.md`, `design.md`, `tasks.md`, deltas de `specs`): inglés.
- Documentación de contexto del repositorio (`README`, `docs/*` no OpenSpec): español.

En caso de duda, priorizar `openspec/config.yaml` y `README.md`.

## 4) Regla general de fase y alcance

Trabajar por alcance explícito del cambio OpenSpec activo.

- Respetar límites de fase definidos en `proposal.md`, `design.md`, `tasks.md` y deltas de `specs` del cambio activo.
- No implementar alcance diferido de fases futuras salvo instrucción explícita del usuario.
- Evitar mezclar en un mismo paso trabajo dentro y fuera del scope acordado.
- Priorizar ejecución por tareas atómicas (`X.Y`) con evidencia verificable en repositorio.

## 5) Regla de coherencia as-is vs target

- `openspec/specs/*` describe baseline implementado (as-is).
- `docs/contracts/*` y `docs/research/*` describen target/roadmap acordado.

Si hay divergencia, el agente debe:

1. explicitar la divergencia,
2. diseñar y ejecutar cambios alineados con la fuente de mayor precedencia,
3. evitar reforzar comportamiento legacy contrario al roadmap aprobado.

## 6) Guardrails de ejecución

- Mantener cambios pequeños, atómicos y trazables.
- No introducir decisiones de arquitectura fuera del scope sin registrarlo en OpenSpec.
- Si aparece fricción arquitectónica recurrente, proponer cambio OpenSpec separado.
- No degradar validaciones contractuales fail-hard existentes sin decisión explícita documentada.

## 7) Referencias operativas

- Flujo canónico: `docs/workflow/openspec-simple-skills-flow.md`.
- Contexto histórico: `docs/workflow/openspec-opencode.md`.
- Política de comandos overlay/upstream: `.opencode/commands/README.md`.
