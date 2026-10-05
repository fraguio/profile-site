## Agent skills

### Gestor de issues

Los issues se gestionan en GitHub Issues para `fraguio/profile-site`. Consulta `docs/agents/issue-tracker.md`.

### Etiquetas de triage

El triage utiliza las cinco etiquetas canónicas predeterminadas. Consulta `docs/agents/triage-labels.md`.

### Documentación de dominio

Este repositorio utiliza una estructura de contexto único. Consulta `docs/agents/domain.md`.

## Proporcionalidad del trabajo

Mantén «The main flow» y el comportamiento de sus skills. Dimensiona el alcance de los tickets, las pruebas nuevas y la documentación según el comportamiento cambiado y el riesgo real.

- Para ajustes locales de UI, modifica directamente la implementación y reutiliza las pruebas y fixtures existentes. Añade cobertura solo para comportamiento nuevo o regresiones que la cobertura actual no detecte; una modificación de texto, markup o CSS no exige por sí sola pruebas nuevas.
- Cada archivo auxiliar nuevo debe cubrir una necesidad de mantenimiento concreta que no resuelvan los archivos existentes. Prioriza ampliar lo existente frente a crear configuraciones, helpers o variantes por ticket.
- Documenta contratos, decisiones duraderas y uso necesario para mantener el producto en sus documentos actuales. El resumen de entrega y los resultados de los checks bastan para registrar el trabajo ordinario; informes por issue y capturas versionadas requieren una necesidad concreta o petición explícita.
- Aplica las matrices de aceptación global al cierre de la integración correspondiente. Para cada incremento, comprueba los comportamientos afectados; amplía viewports y escenarios cuando cambie el responsive o exista un fallo concreto.
- Ejecuta las comprobaciones del flujo sin convertir cada ejecución en documentación adicional. Usa los gates existentes para validar el producto; una medición local adicional de rendimiento se justifica por cambios en recursos, carga, animación o un indicio de regresión.
- Al redactar specs y tickets, expresa resultados observables y referencia la cobertura existente. Conserva los contratos del producto sin convertirlos en una lista de entregables auxiliares para cada cambio.

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

Todos los commits deben llevar firma GPG. Comprueba que la firma GPG está disponible antes de ejecutar el commit y utiliza `git commit -S`. Si no es posible firmarlo con GPG o la firma falla, detén la operación: nunca crees un commit sin firma ni reintentes desactivándola.

## Ramas

Todas las ramas nuevas deben seguir [Conventional Branch](https://conventional-branch.github.io/): `type/description`, con un prefijo admitido por la convención y una descripción breve en inglés, en minúsculas y con palabras separadas por guiones. Incluye el número de issue cuando corresponda. Usa `chore/` para cambios de documentación; por ejemplo, `chore/proportionate-ui-delivery`. Las ramas troncales `main`, `master` y `develop` conservan sus nombres sin prefijo.
