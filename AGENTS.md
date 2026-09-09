## Agent skills

### Gestor de issues

Los issues se gestionan en GitHub Issues para `fraguio/profile-site`. Consulta `docs/agents/issue-tracker.md`.

### Etiquetas de triage

El triage utiliza las cinco etiquetas canónicas predeterminadas. Consulta `docs/agents/triage-labels.md`.

### Documentación de dominio

Este repositorio utiliza una estructura de contexto único. Consulta `docs/agents/domain.md`.

## Idioma

Redacta en español la prosa de toda la documentación del repositorio, incluidos issues, PRs, especificaciones, ADRs, comentarios de código y docstrings.

Mantén en inglés:

- El código y los identificadores.
- Los nombres de tipos, funciones y variables.
- Los comandos, rutas, etiquetas canónicas y nombres propios de herramientas o skills.
- Los términos técnicos asentados cuando sean más precisos o naturales para el equipo, por ejemplo `build`, `SHA`, `home`, `landing`, `placeholder`, `fixture`, `smoke test`, `workflow`, `dispatch`, `schema`, `render` y `output`.

Traduce la prosa explicativa, pero no sustituyas un término técnico asentado por una perífrasis española si pierde precisión, resulta menos natural o altera el significado. Las correcciones de idioma deben preservar los hechos, las relaciones, las rutas y las restricciones del dominio.

Usa los términos definidos en `CONTEXT.md` con su forma canónica, aunque combinen español e inglés.

Una instrucción explícita para usar otro idioma prevalece sobre estas reglas.

## Commits

Utiliza Conventional Commits con el formato `type(scope): description` y redacta los mensajes en inglés.
