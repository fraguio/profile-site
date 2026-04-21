# Workflow OpenSpec + OpenCode (evolución)

Este documento captura cómo estamos evolucionando el flujo de trabajo con agentes.

Objetivo: mantener implementación fluida, con commits pequeños y atómicos, sin abandonar OpenSpec.

## Principios actuales

- OpenSpec es la fuente de verdad para alcance, diseño y tareas.
- El trabajo se ejecuta en unidades pequeñas (`1.2` o `1.x`) con parada obligatoria.
- No se avanza al siguiente bloque sin revisión explícita.
- Cada unidad debe poder cerrar en un commit coherente.

## Flujo base

1. `/opsx-explore` para aclarar problema y decisiones.
2. `/ospec-propose` con tareas atómicas y orientadas a commit.
3. Revisión humana de artifacts (`proposal`, `design`, `tasks`, `specs`).
4. `/ospec-apply <change> [flags]` para ejecutar por alcance con guardrails.
   - Ejemplo 1 (una tarea): `/ospec-apply bootstrap-profile-site-pipeline-and-contract-validation scope=1.2 review_gate=true commit_prep=true`
   - Ejemplo 2 (bloque): `/ospec-apply bootstrap-profile-site-pipeline-and-contract-validation scope=1.x review_gate=true commit_prep=true forbid_next_blocks=true`
   - Precedencia: hints explícitos > defaults del comando.
5. Gate de revisión:
   - `openspec status --change "<change>"`
   - `git status`
   - `git diff`
6. Veredicto: `Ready to commit` o `Not ready to commit`.
7. Si merece commit, preparar mensaje y comando exacto; luego parar sesión.

## Convenciones operativas

- Unidad por defecto: `1 commit = 1 tarea`.
- Excepción: `1 commit = 1 bloque` cuando las subtareas son inseparables.
- Título de commit corto (ideal <=72 caracteres), cuerpo opcional.
- Guardrail de alcance: si se detecta inicio de `2.x` durante `1.x`, parar.

## Estado de automatización (actual)

- `opsx-*` se mantiene upstream sin personalización local.
- `ospec-propose` define tareas atómicas y verificables.
- `ospec-apply` aplica modo scope, review gate y preparación de commit.
- Próximo objetivo: wrappers/alias de shell y checks locales opcionales.

## Decisión pendiente: versionado del documento

Opciones:
- Versionado en Git (recomendado): deja trazabilidad del proceso.
- No versionado: mantener copia local fuera de seguimiento.

Mientras no se decida lo contrario, este archivo se mantiene versionado para conservar contexto entre sesiones.
