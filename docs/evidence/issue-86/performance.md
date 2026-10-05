# Rendimiento de #86

Build contractual con `test/fixtures/fictitious-resume.json` y `PROFILE_SITE_BASE_URL=https://fraguio.github.io/profile-site/`. Evaluador vigente, `PERFORMANCE_ENFORCE_BUDGETS=true`, evento `pull_request` y perfil `lighthouse-mobile-profile.json` sin cambios.

El primer intento directo falló técnicamente al terminar Lighthouse: `chrome-launcher` produjo `EPERM` durante el cleanup de su directorio temporal en Windows. No acredita una medición válida. Se reutilizó el runner temporal documentado en #85, `C:/Users/fraguio/AppData/Local/Temp/opencode/lighthouse-existing-browser.mjs`: inicia Chromium con Playwright y puerto CDP efímero, delega los argumentos al CLI real de Lighthouse añadiendo `--port` y cierra el navegador con Playwright. No utiliza resultados simulados ni modifica el evaluador o los budgets.

La ejecución válida sirvió `dist` en `http://127.0.0.1:56393/profile-site/`. Informe original del evaluador: `C:/Users/fraguio/AppData/Local/Temp/opencode/issue-86-performance-valid.md`.

## Lighthouse

| Métrica | Mobile, mediana de 3 ejecuciones | Desktop, observacional |
| --- | ---: | ---: |
| Performance | 93 | 99 |
| First Contentful Paint | 1804 ms | 423 ms |
| Largest Contentful Paint | 2104 ms | 483 ms |
| Total Blocking Time | 0 ms | 0 ms |
| Cumulative Layout Shift | 0.139 | 0.070 |
| Time to Interactive | 2104 ms | 483 ms |

Las tres ejecuciones mobile obtuvieron 93. Objetivo vigente: 82; límite absoluto: 80.

## Métricas deterministas y budgets

| Control | Valor | Umbral vigente |
| --- | ---: | ---: |
| JavaScript inicial | 8097 bytes | 9000 bytes |
| Bundles JavaScript | 78798 bytes | 87000 bytes |
| Fuentes | 216516 bytes | 280000 bytes |
| Recursos propios | 394463 bytes | 480000 bytes |
| Requests críticos | 2 | 3 |

Resultado del evaluador: **aprobado**. Baseline y justificación de umbrales: `performance-baseline.json` y `docs/performance-baseline.md`.
