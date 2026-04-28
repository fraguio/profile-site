# Contexto

## Metadata

- Status: roadmap decision set (baseline integration contract).
- Scope: bloque 1 de comunicación cross-repo `profile-data -> profile-site`.
- Implementation state: contrato definido; aplicación completa depende también del workflow emisor en `profile-data`.
- Last updated: 2026-04-28.

`profile-site` y `profile-engine` consumen información de `profile-data`, cuyo archivo fuente de verdad es `data/resume.json`.
Hasta ahora, `profile-data` ya dispara a `profile-engine` mediante `repository_dispatch`.
Para `profile-site`, se define un bloque específico de comunicación cross-repo, independiente de la migración de renderer a Astro.
Este documento consolida **solo** las decisiones del bloque de comunicación `profile-data -> profile-site` y prevalece sobre descripciones antiguas si hay conflicto.
# Objetivo
Definir un contrato operativo, reproducible y observable para que cambios en `profile-data` desencadenen un rebuild/deploy de `profile-site` mediante `repository_dispatch`, con seguridad mínima necesaria y fallo explícito ante errores.
# Requisitos
## Funcionales
1. `profile-data` debe incluir un workflow dedicado para dispatch a `profile-site` (separado del dispatch a `profile-engine`).
2. El workflow debe dispararse en `push` a `main` **solo si cambia** `data/resume.json`.
3. El workflow debe enviar `repository_dispatch` al repositorio `fraguio/profile-site`.
4. El `event_type` del dispatch debe ser `profile-data-updated`.
5. El `client_payload` debe incluir:
   - `profile_data_ref: main`
   - `profile_data_path: data/resume.json`
   - `profile_data_sha: <sha del commit origen>`
6. Si el dispatch falla, el job debe fallar (fail hard).
7. El workflow debe validar explícitamente que existe el secreto `PROFILE_SITE_DISPATCH_TOKEN` antes de invocar la API, con error claro si falta.
8. El mecanismo de envío debe usar `curl` directo (fase actual), manteniendo consistencia con el workflow existente hacia `profile-engine`.
## No funcionales
1. Seguridad por mínimo privilegio: token fine-grained restringido a un único repo objetivo (`fraguio/profile-site`).
2. Claridad operativa: workflows separados por consumidor para aislar fallos y facilitar diagnóstico.
3. Trazabilidad: incluir `profile_data_sha` aunque el consumo funcional siga siendo `profile_data_ref=main`.
4. Robustez de entrega: política de cola sin cancelación para no perder actualizaciones.
5. Compatibilidad con arquitectura vigente: se mantiene el modelo ingest/build/deploy actual de `profile-site`, cambiando solo el disparo cross-repo en esta fase.
# Decisiones técnicas
1. **Workflow separado en `profile-data`**
   - Nombre recomendado: `dispatch-profile-site.yml`.
   - Motivo: aislamiento de fallos y mayor claridad operativa.
2. **Trigger acotado por cambios relevantes**
   - Evento: `push` en `main`.
   - Filtro: `paths` sobre `data/resume.json`.
   - Motivo: evitar dispatches innecesarios cuando cambian archivos no contractuales.
3. **Contrato de evento estable**
   - Endpoint: `POST /repos/fraguio/profile-site/dispatches`.
   - `event_type`: `profile-data-updated`.
   - `client_payload`:
     - `profile_data_ref=main`
     - `profile_data_path=data/resume.json`
     - `profile_data_sha=${{ github.sha }}`
4. **Estrategia de referencia en fase 1**
   - Se fija `profile_data_ref=main`.
   - `profile_data_sha` se envía para trazabilidad y futura migración a ref exacta por SHA.
5. **Política de error**
   - Si falla el `repository_dispatch`, falla el job.
   - Motivo: evitar pérdida silenciosa de sincronización entre repositorios.
6. **Autenticación y secreto**
   - Secreto requerido: `PROFILE_SITE_DISPATCH_TOKEN`.
   - Tipo de token: Fine-grained PAT restringido a `fraguio/profile-site`.
   - Permisos: mínimo necesario para invocar `repository_dispatch`.
   - Validación previa explícita del secreto antes de ejecutar `curl`.
7. **Mecanismo de ejecución**
   - Se usa `curl` directo en esta fase.
   - Motivo: coherencia con `dispatch-profile-engine.yml` existente y menor cambio lateral.
8. **Concurrencia**
   - Se mantiene cola (sin cancelación en progreso) para no descartar eventos.
   - Motivo: preservar entrega de actualizaciones, especialmente mientras `ref` funcional sea `main`.
9. **Orden de rollout acordado**
   - Primero: activar dispatch `profile-data -> profile-site` sin tocar renderer.
   - Después: migrar render de `profile-site` a Astro.
   - Finalmente: reforzar checks adicionales (`/`, `/read`, print y contrato PDF).
# Alternativas consideradas
1. **Usar SHA como `profile_data_ref` desde el inicio**
   - Estado: pospuesta.
   - Razón: aumenta precisión/reproducibilidad, pero se prioriza simplicidad operativa en fase 1.
2. **Usar action dedicada para dispatch (en lugar de `curl`)**
   - Estado: descartada por ahora.
   - Razón: `curl` ya está adoptado en `profile-data` para `profile-engine` y mantiene consistencia inmediata.
3. **No fallar job si falla dispatch (warning only)**
   - Estado: descartada.
   - Razón: puede ocultar roturas de integración y perder actualizaciones sin señal fuerte.
4. **Workflow único para dispatch a múltiples consumidores**
   - Estado: descartada.
   - Razón: menor aislamiento de fallos y peor observabilidad por consumidor.
5. **Disparar en todo push a `main` sin filtro `paths`**
   - Estado: descartada.
   - Razón: genera ruido y ejecuciones innecesarias en `profile-site`.
# Supuestos
1. `profile-site` mantiene soporte para `repository_dispatch` con tipo `profile-data-updated`.
2. `profile-site` resuelve defaults contractuales cuando faltan coordenadas (`main`, `data/resume.json`), aunque en este diseño se envían explícitamente.
3. El repositorio `fraguio/profile-site` está disponible y accesible para el token configurado.
4. El archivo `data/resume.json` es la única fuente contractual que debe disparar sincronización.
5. El modelo de despliegue sigue siendo estático (build/deploy en pipeline; no render por request).
# Dudas abiertas
## Bloqueantes
- Ninguna para implementar este bloque de comunicación.
## No bloqueantes (seguimiento recomendado)
1. Confirmar y documentar de forma exacta el nombre de permiso Fine-grained PAT requerido por GitHub para `repository_dispatch` (manteniendo principio de mínimo privilegio).
2. Planificar transición futura de `profile_data_ref=main` a `profile_data_ref=<sha>` para reproducibilidad total sin ambigüedad temporal.
3. Alinear documentación histórica de `profile-data` que pudiera implicar un flujo distinto (por ejemplo, referencias previas que excluyen consumo directo por `profile-site` en v1).
