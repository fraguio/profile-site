# Workflow OpenSpec + OpenCode (evolución)

Este documento captura cómo estamos evolucionando el flujo de trabajo con agentes.

Objetivo: mantener implementación fluida, con commits pequeños y atómicos, sin abandonar OpenSpec.

## Referencia operativa vigente

Para el trabajo diario en este repositorio, usar como referencia principal:

- `docs/workflow/openspec-simple-skills-flow.md`

Ese documento define el modo simple acordado para `profile-site`, incluyendo:

- Integración práctica de `tdd` dentro de `/ospec-apply`.
- Integración por disparador de `improve-codebase-architecture`.
- Flujo mínimo de trabajo con `grill-me`, `ospec-propose`, `ospec-apply` y `opsx-archive`.
- Decisión explícita de no usar `to-prd` ni `to-issues` por ahora.
- Trazabilidad solo en `tasks.md` (sin GitHub issues en esta etapa).

## Principios actuales

- OpenSpec es la fuente de verdad para alcance, diseño y tareas.
- La implementación se hace en ramas de trabajo; evitar cambios directos sobre `main`.
- El trabajo se ejecuta en unidades pequeñas (`1.2` o `1.x`) con parada obligatoria.
- No se avanza al siguiente bloque sin revisión explícita.
- Cada unidad debe poder cerrar en un commit coherente.

## Flujo base (resumen)

1. `grill-me` para endurecer decisiones cuando haya dudas.
2. `/ospec-propose` con tareas atómicas y orientadas a commit.
3. Revisión humana de artifacts (`proposal`, `design`, `tasks`, `specs`).
4. `/ospec-apply <change> [flags]` para ejecutar por alcance con guardrails.
5. Veredicto de revisión: `Ready to commit` o `Not ready to commit`.
6. `/opsx-archive` al completar el cambio.

## Convenciones operativas

- Unidad por defecto: `1 commit = 1 tarea`.
- Excepción: `1 commit = 1 bloque` cuando las subtareas son inseparables.
- Título de commit corto (ideal <=72 caracteres), cuerpo opcional.
- Guardrail de alcance: si se detecta inicio de `2.x` durante `1.x`, parar.

## Estado de automatización (actual)

- `opsx-*` se mantiene upstream sin personalización local.
- `ospec-propose` define tareas atómicas y verificables.
- `ospec-apply` aplica modo scope, review gate y preparación de commit.

## Decisión pendiente: versionado del documento

Opciones:
- Versionado en Git (recomendado): deja trazabilidad del proceso.
- No versionado: mantener copia local fuera de seguimiento.

Mientras no se decida lo contrario, este archivo se mantiene versionado para conservar contexto entre sesiones.
