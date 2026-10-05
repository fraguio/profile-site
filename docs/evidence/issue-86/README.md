# Evidencia de contenido curricular y enlace de proyecto — #86

## Alcance y procedencia

- Rama: `feat/86-curricular-content-project-link`.
- SHA de partida: `9f5c9e25d746d1c9d9f87b896cc3c22a43423575`, `main` actualizado con #85 integrado mediante la PR #92.
- #86 es el primer ticket abierto disponible, sin dependencias nativas. #87 permanece disponible; #88 y #89 siguen bloqueados por #87 y #90 por #86, #88 y #89.
- Contratos: #84, #86 y las dos specs normativas versionadas. Las notas históricas de preparación documental no cambian la autoridad de sus contratos.
- Fuentes: `test/fixtures/fictitious-resume.json`, con un destino ficticio añadido al proyecto existente, y `test/fixtures/valid-resume-with-independent-blocks.json`, variante ficticia para bloques y metadatos ausentes, Roles y wrapping. La fixture negativa `invalid-project-url.json` verifica el schema antes del render.
- Referencia visual: captura y HTML originales de P11/intento-03, en la ubicación externa identificada por la spec. Las exportaciones permanecen intactas.
- Chromium con Playwright, fuentes locales cargadas y reducción de movimiento. Filtro Todo, hito indicado seleccionado mediante teclado sobre el lector/panel actuales.

## Capturas y revisión visual

| Viewport | Fuente y estado | Captura |
| --- | --- | --- |
| 1366 × 768 | Fixture contractual; Proyecto Vigente; Ver proyecto focalizado por Tab | [Proyecto desktop](issue-86-project-1366x768.png) |
| 1440 × 900 | Fixture contractual; Proyecto Vigente; Ver proyecto focalizado por Tab | [Proyecto desktop amplio](issue-86-project-1440x900.png) |
| 360 × 800 | Fixture contractual; Proyecto Vigente; Ver proyecto focalizado por Tab | [Proyecto mobile](issue-86-project-360x800.png) |
| 390 × 844 | Fixture contractual; Proyecto Vigente; Ver proyecto focalizado por Tab | [Proyecto mobile amplio](issue-86-project-390x844.png) |
| 1440 × 900 | Variante independiente; Proyecto con metadatos; habilidad larga visible | [Wrapping desktop](issue-86-wrapping-1440.png) |
| 360 × 900 | Variante independiente; Proyecto con metadatos; cuerpo desplazado hasta la habilidad larga | [Wrapping mobile](issue-86-wrapping-360.png) |
| 390 × 900 | Variante independiente; Proyecto con metadatos; cuerpo desplazado hasta la habilidad larga | [Wrapping mobile amplio](issue-86-wrapping-390.png) |

Las siete capturas se revisaron frente a P11: se conservan fondo oscuro y tipografía local; la acción nueva utiliza el acento de proyecto `#818cf8`, subrayado y foco interior champán. Descripción, Rol/Roles, Contribuciones y Habilidades asociadas son legibles; las habilidades largas hacen wrapping sin overflow horizontal. La formación muestra Contenidos sin depender de descripción. La fuente contractual tiene prosa, fechas, entidades y número de hitos diferentes de Stitch: no se comparan sus posiciones absolutas como si fueran la misma fuente.

El incremento se entrega sobre el lector desktop y el panel mobile existentes, tal como permite #86. Sus controles de cierre, movimiento, cabecera, alturas y scrollers siguen correspondiendo a los tickets de interacción y lectura. Las capturas después de navegar por teclado incluyen el desplazamiento real producido por esa navegación; no son capturas del estado inicial. No acreditan la geometría ni composición final de P12.

Para regenerar:

```powershell
$env:MILESTONE_CONTENT_EVIDENCE_DIRECTORY='docs/evidence/issue-86'
pnpm exec playwright test e2e/milestone-content.browser.mjs --workers=1
pnpm exec playwright test --config=playwright-independent-blocks.config.mjs --workers=1
```

## Comprobaciones

- TDD: seis casos de enlace fallaron por ausencia de Ver proyecto antes de su consumo y render; después pasaron. Cuatro casos de bloques fallaron por ausencia de Descripción antes de incorporar las etiquetas; después pasaron.
- `pnpm check`: 0 errores, warnings o hints durante el desarrollo.
- Playwright focalizado: 13 pruebas cubren los cuatro viewports principales, párrafos independientes íntegros, bloques opcionales, Rol/Roles, destino exacto, Tab y Enter, fallback sin JavaScript, fechas con precisión fuente y limpieza del detalle activo y oculto. La variante acredita bloques sin prosa, habilidad larga legible y extensiones aplazadas no visibles. Axe AA sobre el detalle con enlace no presenta vulneraciones.
- La comprobación de intersección de la habilidad larga admite el redondeo subpíxel del navegador (`ratio: 0.99`); se comprueba además que no hay overflow horizontal del documento. No se recorta el texto para satisfacer la prueba.
- `pnpm test`: 134 pruebas Node aprobadas, una omisión POSIX en Windows y 59 pruebas Playwright aprobadas. Incluye fuente, validación, orden, metadatos, base path alternativo, fallback, CV web, datos de publicación y canarios de rendimiento.
- `pnpm test:pdf`: 4 checks aprobados. El build contractual produce el PDF de 2 páginas desde el CV web. El CV web no incorpora Ver proyecto ni su URL; conserva presentación y hechos anteriores.
- Tras extraer el helper duplicado señalado en revisión y reforzar la activación del enlace sin JavaScript, se repiten las 13 pruebas afectadas y typechecking.
- Rendimiento real: [informe](performance.md). Evaluador vigente aprobado, sin cambios de budgets ni perfil.

## Revisión y aceptación delimitada

`/code-review` se ejecutó contra el SHA de partida antes del único commit, con el diff del worktree y lectura explícita de archivos nuevos. Standards: ninguna infracción documentada y una posible duplicación menor entre helpers de pruebas, extraída a `e2e/support/milestone.mjs`; la revisión posterior confirmó su resolución. Spec: ningún hallazgo para #86.

Este informe acredita únicamente el incremento de #86. La integración completa y P12 conservan aceptaciones separadas y pendientes. #87 es el siguiente ticket disponible; su selección permanente se entrega en otra sesión. P13, persiana, extensiones curriculares aplazadas, lector de pantalla, otros motores y táctil real conservan sus pendientes normativos.
