# Baseline de rendimiento

La baseline se mide sobre `dist` de la experiencia completa, construido con
`test/fixtures/fictitious-resume.json`, `PROFILE_SITE_BASE_URL` igual a
`https://fraguio.github.io/profile-site/` y el perfil versionado
`lighthouse-mobile-profile.json`. Lighthouse mobile usa la mediana de tres
ejecuciones; desktop queda como observación y las métricas deterministas se
obtienen una vez.

## Evidencia de calibración

La ejecución [35142010909](https://github.com/fraguio/profile-site/actions/runs/35142010909)
en GitHub Actions sobre Ubuntu capturó esta baseline con Chromium. Se ejecutó
sobre el commit `5fe53a7`, con el fixture, el perfil y las variables
contractuales descritas arriba; sus valores se fijaron después en
`performance-baseline.json` mediante `a5eaffe`.

| Medición observada | Valor | Umbral | Margen | Justificación |
| --- | ---: | ---: | ---: | --- |
| Lighthouse mobile | 97 | 90 | 7 puntos | Mantiene una regresión visible en pull request y push sin rechazar fluctuaciones menores de la medición. |
| Lighthouse desktop | 99 | No aplica | No aplica | Permanece como métrica observacional en todos los eventos. |
| Límite absoluto mobile | 97 | 80 | 17 puntos | Evita publicar una degradación grave en cualquier deploy. |
| JavaScript inicial | 8100 bytes | 9000 bytes | 900 bytes | Cubre variaciones menores de empaquetado sin ocultar una nueva dependencia. |
| Bundles JavaScript | 78801 bytes | 87000 bytes | 8199 bytes | Reserva crecimiento limitado para la interacción del timeline. |
| Fuentes | 253492 bytes | 280000 bytes | 26508 bytes | Mantiene la tipografía autoalojada dentro de un coste conocido. |
| Recursos propios | 362518 bytes | 400000 bytes | 37482 bytes | Acota el output completo sin restringir su composición actual. |
| Requests críticos | 2 | 3 | 1 | Permite un recurso crítico adicional antes de exigir revisión. |

Los valores y umbrales se declaran también en `performance-baseline.json`, que
es el input del evaluador. Los canarios de `test/performance-measurement.test.mjs`
ejercitan fallo técnico, budget determinista, objetivo mobile y límite absoluto
sin modificar el artefacto de producción.
