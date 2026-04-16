# profile-site

`profile-site` es la web pública de mi perfil profesional, construida como un consumidor independiente del contrato de datos en JSON Resume.

El objetivo del repositorio es publicar un HTML reproducible y mantenible mediante CI/CD, sin acoplarse a implementaciones concretas de otros consumidores del mismo dominio.

## Estado

- Fase actual: bootstrap de v1.
- Planificación activa con OpenSpec.
- Foco: base técnica (pipeline, validación de contrato, render inicial y despliegue).

## Decisiones de arquitectura (v1)

- Contrato de entrada estricto: JSON Resume `v1.2.1`.
- Validación obligatoria antes del render.
- Política `fail hard`: si falla validación, se aborta build y deploy.
- Render sin ruido: las secciones vacías no se muestran.
- Independencia de consumidor: `profile-site` se define por contrato compartido, no por dependencias con otros consumidores.

## Fuente de datos

- Origen de datos: repositorio externo `profile-data` (privado).
- Entrada esperada: `data/resume.json`.
- Integración por referencia y ruta (`ref/path`) para ejecuciones reproducibles.

## Proceso OpenSpec

- Propuesta de cambio: `/opsx-propose`
- Implementación de tareas: `/opsx-apply`
- Archivo y cierre: `/opsx-archive`
- Orquestación por alcance (scope + gate + commit prep): `/flow-run-step`

Guía de evolución del flujo con agentes:
- `docs/workflow/openspec-opencode.md`

### Política de idioma

- Artefactos OpenSpec (`proposal.md`, `design.md`, `tasks.md`, `specs`) en inglés.
- Documentación de contexto del repositorio en español.

## Roadmap v1

- Pipeline con `push`, `workflow_dispatch` y `repository_dispatch`.
- Ingesta de `profile-data` por `profile_data_ref` y `profile_data_path`.
- Validación estricta de contrato con logs diagnósticos.
- Render inicial de HTML con reglas de ocultación de secciones vacías.
- Despliegue base en GitHub Pages.
