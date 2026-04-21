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

### Contrato de triggers CI (baseline)

- Triggers soportados: `push` en `main`, `workflow_dispatch` y `repository_dispatch`.
- Evento de dispatch esperado: `profile-data-updated`.
- Coordenadas de entrada compartidas: `profile_data_ref` y `profile_data_path`.
- Defaults del baseline: `profile_data_ref=main` y `profile_data_path=data/resume.json`.
- La pipeline registra en resumen de ejecución (`GITHUB_STEP_SUMMARY`) el trigger, coordenadas de origen, estado del build y estado del deploy.
- La resolución de coordenadas incluye verificación automatizada de casos reproducibles: `workflow_dispatch` con `profile_data_ref` no default, y `repository_dispatch` con payload default/explícito.
- El flujo se define por contrato compartido; no depende de implementaciones concretas de otros consumidores.

### Acceso autenticado a `profile-data` (privado)

- Variable de repositorio requerida: `PROFILE_DATA_REPOSITORY` con formato `owner/profile-data`.
- Variable de repositorio requerida: `PROFILE_SITE_BASE_URL` con la URL base pública del sitio (ej.: `https://tu-dominio.com`).
- Secreto requerido: `PROFILE_DATA_READ_TOKEN` con permisos de lectura sobre `Contents` del repositorio privado.
- El pipeline falla de forma temprana y explícita si falta configuración de acceso o si la ruta del JSON no existe en el `ref/path` resuelto.
- El archivo origen resuelto se copia a `data/resume.json` y se valida de forma estricta contra JSON Resume `v1.2.1` antes de cualquier etapa de render.

## Proceso OpenSpec

- Propuesta de cambio: `/ospec-propose`
- Implementación de tareas: `/ospec-apply`
- Archivo y cierre: `/opsx-archive`

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
