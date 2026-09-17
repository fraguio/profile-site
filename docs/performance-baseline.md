# Baseline de rendimiento

La baseline se mide sobre `dist` de la experiencia completa, construido con
`test/fixtures/fictitious-resume.json`, `PROFILE_SITE_BASE_URL` igual a
`https://fraguio.github.io/profile-site/` y el perfil versionado
`lighthouse-mobile-profile.json`. Lighthouse mobile usa la mediana de tres
ejecuciones; desktop queda como observación y las métricas deterministas se
obtienen una vez.
La métrica de recursos propios incluye el CV PDF contractual.

## Evidencia de calibración

Las ejecuciones [35142010909](https://github.com/fraguio/profile-site/actions/runs/35142010909),
[35188372156](https://github.com/fraguio/profile-site/actions/runs/35188372156)
y su repetición capturaron valores mobile de 97, 87 y 85 con Chromium. La
mediana, 87, se declara como baseline mobile.
Las ejecuciones se realizaron sobre el fixture, el perfil y las variables
contractuales descritas arriba.

| Medición observada | Valor | Umbral | Margen | Justificación |
| --- | ---: | ---: | ---: | --- |
| Lighthouse mobile | 87 | 82 | 5 puntos | Conserva tres puntos sobre la muestra más baja observada (85) para absorber la variación real y detectar una regresión sostenida. |
| Lighthouse desktop | 99 | No aplica | No aplica | Permanece como métrica observacional en todos los eventos. |
| Límite absoluto mobile | 87 | 80 | 7 puntos | Evita publicar una degradación grave en cualquier deploy. |
| JavaScript inicial | 8100 bytes | 9000 bytes | 900 bytes | Cubre variaciones menores de empaquetado sin ocultar una nueva dependencia. |
| Bundles JavaScript | 78801 bytes | 87000 bytes | 8199 bytes | Reserva crecimiento limitado para la interacción del timeline. |
| Fuentes | 253492 bytes | 280000 bytes | 26508 bytes | Mantiene la tipografía autoalojada dentro de un coste conocido. |
| Recursos propios | 433921 bytes | 480000 bytes | 46079 bytes | Incorpora el CV PDF contractual y conserva un margen proporcional al anterior para variaciones menores de su render. |
| Requests críticos | 2 | 3 | 1 | Permite un recurso crítico adicional antes de exigir revisión. |

La tabla anterior es la evidencia de calibración de la PR: vincula cada umbral
y margen con su medición observada y su justificación. Los valores y umbrales
se declaran también en `performance-baseline.json`, que es el input del
evaluador. Los canarios de `test/performance-measurement.test.mjs` ejercitan
fallo técnico, budget determinista, objetivo mobile y límite absoluto sin
modificar el artefacto de producción.
