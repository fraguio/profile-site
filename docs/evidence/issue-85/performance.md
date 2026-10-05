# Rendimiento del incremento #85

Fuente: `test/fixtures/fictitious-resume.json`. Build contractual local bajo `/profile-site/`, evaluador y perfil versionados, budgets de `pull_request` sin cambios.

Dos intentos directos fallaron técnicamente durante el cleanup de chrome-launcher en Windows (`EPERM` sobre su directorio temporal), con Chromium y Google Chrome instalado. Esos intentos no acreditan mediciones válidas. Para evitar ese fallo de entorno, el runner temporal inicia Chromium con Playwright y un puerto CDP efímero, delega todos los argumentos recibidos al CLI real de Lighthouse añadiendo `--port` y cierra el navegador con Playwright. Se conserva el perfil versionado, el CLI real, la mediana de tres ejecuciones mobile, la ejecución desktop observacional y el evaluador vigente; no se utilizan resultados simulados.
## Medición de rendimiento

- Output estático servido localmente: `http://127.0.0.1:64732/profile-site/`
- Perfil mobile versionado: `lighthouse-mobile-profile.json`
- Ruta pública medida: `/profile-site/`
- Baseline de la experiencia completa y gates aplicados desde `performance-baseline.json`.

### Lighthouse mobile (mediana de 3 ejecuciones)

- Ejecuciones mobile: 93, 93, 93

| Métrica | Valor |
| --- | ---: |
| Performance | 93 |
| First Contentful Paint | 1805 ms |
| Largest Contentful Paint | 2105 ms |
| Total Blocking Time | 0 ms |
| Cumulative Layout Shift | 0.139 |
| Time to Interactive | 2105 ms |

### Lighthouse desktop (observacional)

| Métrica | Valor |
| --- | ---: |
| Performance | 99 |
| First Contentful Paint | 405 ms |
| Largest Contentful Paint | 445 ms |
| Total Blocking Time | 0 ms |
| Cumulative Layout Shift | 0.070 |
| Time to Interactive | 445 ms |

### Métricas deterministas

| Métrica | Valor |
| --- | ---: |
| JavaScript inicial | 8097 bytes |
| Bundles JavaScript | 78798 bytes |
| Fuentes | 216516 bytes |
| Recursos propios | 393816 bytes |
| Requests críticos | 2 |

### Gates

- Objetivo Lighthouse mobile: 82
- Límite absoluto Lighthouse mobile: 80
- Justificación de calibración: `docs/performance-baseline.md`.

| Control | Baseline observada | Umbral | Margen |
| --- | ---: | ---: | ---: |
| Lighthouse mobile | 87 | 82 | 5 |
| Límite absoluto mobile | 87 | 80 | 7 |
| initialJavaScript | 8100 | 9000 | 900 |
| javascriptBundles | 78801 | 87000 | 8199 |
| fonts | 253492 | 280000 | 26508 |
| ownResources | 433921 | 480000 | 46079 |
| criticalRequests | 2 | 3 | 1 |

- Resultado: aprobado

## Revalidación tras la revisión

La medición anterior corresponde a la implementación previa al hallazgo de hover/activación de enlaces profesionales. La medición siguiente revalida el build final con la corrección CSS y el mismo fixture, runner real, perfil y evaluador.
## Medición de rendimiento

- Output estático servido localmente: `http://127.0.0.1:65252/profile-site/`
- Perfil mobile versionado: `lighthouse-mobile-profile.json`
- Ruta pública medida: `/profile-site/`
- Baseline de la experiencia completa y gates aplicados desde `performance-baseline.json`.

### Lighthouse mobile (mediana de 3 ejecuciones)

- Ejecuciones mobile: 93, 93, 93

| Métrica | Valor |
| --- | ---: |
| Performance | 93 |
| First Contentful Paint | 1804 ms |
| Largest Contentful Paint | 2104 ms |
| Total Blocking Time | 0 ms |
| Cumulative Layout Shift | 0.139 |
| Time to Interactive | 2104 ms |

### Lighthouse desktop (observacional)

| Métrica | Valor |
| --- | ---: |
| Performance | 99 |
| First Contentful Paint | 427 ms |
| Largest Contentful Paint | 487 ms |
| Total Blocking Time | 0 ms |
| Cumulative Layout Shift | 0.073 |
| Time to Interactive | 487 ms |

### Métricas deterministas

| Métrica | Valor |
| --- | ---: |
| JavaScript inicial | 8097 bytes |
| Bundles JavaScript | 78798 bytes |
| Fuentes | 216516 bytes |
| Recursos propios | 393973 bytes |
| Requests críticos | 2 |

### Gates

- Objetivo Lighthouse mobile: 82
- Límite absoluto Lighthouse mobile: 80
- Justificación de calibración: `docs/performance-baseline.md`.

| Control | Baseline observada | Umbral | Margen |
| --- | ---: | ---: | ---: |
| Lighthouse mobile | 87 | 82 | 5 |
| Límite absoluto mobile | 87 | 80 | 7 |
| initialJavaScript | 8100 | 9000 | 900 |
| javascriptBundles | 78801 | 87000 | 8199 |
| fonts | 253492 | 280000 | 26508 |
| ownResources | 433921 | 480000 | 46079 |
| criticalRequests | 2 | 3 | 1 |

- Resultado: aprobado
