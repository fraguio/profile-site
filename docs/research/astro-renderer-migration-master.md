# Contexto

## Metadata

- Status: roadmap decision set (planned, pending implementation).
- Scope: bloque 2 de evolucion, migracion del renderer actual a Astro.
- Implementation state: no implementado aun en este repositorio.
- Last updated: 2026-04-28.

`profile-site` ya opera con un pipeline estático orientado a contrato: adquiere `data/resume.json` desde `profile-data`, valida JSON Resume `v1.2.1`, renderiza HTML y despliega en GitHub Pages.
El bloque 1 (`profile-data -> profile-site`) quedó cerrado y define el contrato de comunicación cross-repo por `repository_dispatch`.  
Este documento consolida **solo** las decisiones del bloque 2: migración del renderer actual a Astro, sin implementación de código en esta fase.
El objetivo funcional de salida vigente está definido en `docs/contracts/resume-output-template.md`:
- `/` como experiencia premium.
- `/read/` como versión ATS-friendly.
- contrato objetivo de PDF estable derivado de `/read/` (diferido a fase posterior).
# Objetivo
Definir un contrato técnico, reproducible y observable para migrar el renderer de `profile-site` a Astro, manteniendo paridad funcional en Fase A, conservando el modelo estático de build/deploy y dejando explícitamente acotado lo que se difiere a Fase B.
# Requisitos
## Funcionales
1. Mantener el modelo operativo actual: `profile-data` actualiza -> dispatch/pipeline -> build estático -> deploy en Pages.
2. Migrar el renderer a Astro en la raíz del repositorio (sin monorepo ni subcarpeta de app).
3. Generar obligatoriamente:
   - `dist/index.html`
   - `dist/read/index.html`
4. Fallar el pipeline (fail hard) si falta o está vacío cualquiera de esos dos outputs.
5. Mantener paridad funcional estricta en Fase A con el renderer actual:
   - mismo alcance y orden de secciones: header, work, education, projects, skills, languages, certificates.
   - misma regla de ocultación silenciosa de secciones vacías.
6. Consumir una única fuente de build: `data/resume.json` local al workspace de CI.
7. Validar `data/resume.json` contra JSON Resume `v1.2.1` antes de `astro build` (fail hard).
8. Exigir SEO mínimo en ambas rutas (`/` y `/read/`):
   - `title` no vacío
   - `meta description` no vacío
   - `canonical` no vacío y autorreferente por ruta
9. Canonical oficial:
   - `/` -> `${PROFILE_SITE_BASE_URL}/`
   - `/read/` -> `${PROFILE_SITE_BASE_URL}/read/`
10. Mantener `/read/` indexable en Fase A.
11. JS progresivo en Fase A:
   - `/read/` sin JS de aplicación (sin hidratación ni librerías de animación).
   - `/` con JS mínimo no crítico y degradación elegante si falla JS.
12. Mantener el contrato objetivo de PDF en producto, pero diferir implementación/validación a Fase B.
13. Mantener `repository_dispatch` y usar `profile_data_sha` solo para trazabilidad en Fase A.
14. Añadir trigger `pull_request` con validación completa del contrato y sin deploy.
15. En PR desde fork sin secretos, fallar rápido con diagnóstico explícito.
## No funcionales
1. Fase A debe quedar 100% Node/Astro (sin pasos Python en workflow).
2. Reproducibilidad de runtime:
   - CI en Node `20.19.x` fijo.
   - `engines.node: >=20.19 <21`.
3. Gestor de paquetes: `npm`.
4. `package-lock.json` obligatorio.
5. Instalación determinista con `npm ci` en todos los jobs Node.
6. Validación de schema sin dependencia de red en cada run:
   - schema JSON Resume `v1.2.1` versionado en el repo.
7. Observabilidad obligatoria en `GITHUB_STEP_SUMMARY` y logs.
8. Estrategia operativa de rollout en Fase A: fix-forward por defecto.
9. Mantener comportamiento estático/cacheable de Pages: contenido vigente hasta nuevo deploy exitoso.
# Decisiones técnicas
1. **Faseado de migración**
   - Fase A: migración técnica a Astro + contratos mínimos obligatorios.
   - Fase B: interactividad premium avanzada (incl. GSAP) y materialización del contrato PDF.
2. **Arquitectura Astro en raíz**
   - `src/pages/index.astro` (`/`)
   - `src/pages/read/index.astro` (`/read/`)
   - `src/layouts/BaseLayout.astro`
   - `src/components/` para secciones reutilizables
   - `src/lib/` para carga/normalización de datos y helpers SEO
3. **Configuración de build/rutas**
   - `output: "static"`.
   - `trailingSlash: "always"`.
4. **Capa de datos compartida**
   - `/` y `/read/` comparten lógica en `src/lib/`.
   - Diferencias entre rutas solo en plantilla/presentación.
5. **Modo de carga de datos**
   - Lectura build-time local de `data/resume.json` (Node `fs`).
   - Sin `fetch` HTTP durante render de páginas.
6. **Validación de contrato en Node**
   - Implementación con `ajv` (o equivalente).
   - Error detallado con campo/regla/causa raíz.
   - Fail hard antes de build/render.
7. **SEO por ruta como contrato**
   - Validación separada en `dist/index.html` y `dist/read/index.html`.
   - Canonical autorreferente y consistente con `PROFILE_SITE_BASE_URL`.
8. **Contrato de JS progresivo**
   - `/read/`: cero JS de aplicación.
   - `/`: JS no crítico, contenido base siempre legible sin JS.
9. **PDF/print**
   - `/read/` sigue siendo fuente ATS canónica.
   - PDF estable sigue como objetivo de producto, diferido a Fase B.
10. **CI/CD: mantener topología, reemplazar toolchain**
    - Se conserva la topología existente:
      - `trigger-baseline`
      - `source-and-validate`
      - `deploy`
    - Se reemplazan scripts/pasos Python por equivalentes Node/Astro.
11. **Un solo workflow con gates por evento**
    - Sin separar workflows de validate/publish.
    - `pull_request`: contrato completo sin deploy.
    - `push/main` y `repository_dispatch`: contrato completo + deploy.
12. **PR desde fork sin secretos**
    - Fallo temprano explícito.
    - Mensaje debe indicar:
      - secreto/variable faltante
      - comando(s) de reproducción local
13. **Trazabilidad de origen**
    - `profile_data_ref` y `profile_data_path` se mantienen como coordenadas efectivas.
    - `profile_data_sha` se registra para observabilidad (no fuerza checkout por SHA en Fase A).
14. **Orden de rollout acordado**
    - 1) introducir toolchain Astro/Node + validación Node manteniendo checks contractuales,
    - 2) endurecer verificación obligatoria de outputs y SEO por ruta,
    - 3) retirar dependencia Python del workflow.
15. **Criterios de aceptación de Fase A**
    1. Pipeline verde en `push`, `workflow_dispatch` y `repository_dispatch`.
    2. Validación JSON Resume `v1.2.1` en Node con fail hard.
    3. `dist/index.html` y `dist/read/index.html` existen y no están vacíos.
    4. SEO mínimo correcto en ambas rutas con canonical autorreferente.
    5. `/read/` sin JS de aplicación y `/` con degradación elegante si JS falla.
# Alternativas consideradas
1. **Mantener renderer Python**
   - Estado: descartada para Fase A.
   - Razón: no cumple objetivo explícito de migración a Astro.
2. **Pipeline híbrido Python + Node**
   - Estado: descartada.
   - Razón: aumenta complejidad y reduce reproducibilidad operativa.
3. **Astro en subcarpeta/monorepo**
   - Estado: descartada.
   - Razón: añade fricción innecesaria para un sitio estático con contrato claro de outputs.
4. **Separar workflows (validate y publish)**
   - Estado: descartada.
   - Razón: más duplicación y menor trazabilidad unificada frente a un workflow con gates.
5. **Descargar schema en cada ejecución**
   - Estado: descartada.
   - Razón: dependencia de red y menor determinismo.
6. **Exigir paridad visual pixel-perfect**
   - Estado: descartada.
   - Razón: la migración se define por paridad funcional y contractual, no cosmética.
7. **Implementar GSAP/PDF en Fase A**
   - Estado: descartada.
   - Razón: ensancha riesgo y alcance de la migración base.
8. **Rollback como estrategia principal**
   - Estado: descartada para este bloque.
   - Razón: se adopta fix-forward por contexto operativo actual.
# Supuestos
1. El contrato de comunicación del bloque 1 (`profile-data-updated`, `profile_data_ref`, `profile_data_path`, `profile_data_sha`) se mantiene estable.
2. `PROFILE_DATA_REPOSITORY`, `PROFILE_DATA_READ_TOKEN` y `PROFILE_SITE_BASE_URL` estarán configurados cuando se requiera validación completa.
3. GitHub Pages permanece como destino estático de Fase A.
4. El renderer actual sirve como referencia de paridad funcional (secciones/orden/ocultación) para Fase A.
5. El contrato objetivo de PDF en `docs/contracts/resume-output-template.md` sigue vigente como alcance de Fase B.
# Dudas abiertas
## Bloqueantes
- Ninguna para ejecutar Fase A.
## No bloqueantes (seguimiento Fase B)
1. Definir implementación exacta de generación/publicación de `cv/eduardo-nogueira-fraguio-cv.pdf` desde `/read/`.
2. Definir contrato técnico de interactividad premium avanzada (incluyendo GSAP) y sus límites de performance.
3. Evaluar migración futura a checkout/reproducibilidad estricta por SHA como coordenada efectiva.
4. Definir checks adicionales de calidad no mínimos (performance budgets, validaciones ATS extendidas).
