# Evidencia de identidad y acciones — #85

## Alcance y procedencia

- Aplicación Astro de la rama `feat/85-p11-identity-actions`, desde `45317a0bc450884d5a5ce650c11b3aec58e9a3ba`.
- Fuente curricular: `test/fixtures/fictitious-resume.json`, explícita en el build contractual, sin datos personales de Stitch.
- Referencia visual: captura y HTML originales de `20261004 20.45-02/P11/intento-03`, en la ubicación externa identificada por la spec.
- Estado de las capturas: carga inicial, filtro Todo, sin selección; preferencia de reducción de movimiento para estabilizar la evidencia del incremento. La selección inicial permanente se entrega en #87.
- Chromium mediante Playwright; capturas del viewport, sin scroll previo, después de cargar las fuentes locales.

## Capturas

| Viewport | Archivo |
| --- | --- |
| 1366 × 768 | [Identidad desktop](identity-1366x768.png) |
| 1440 × 900 | [Identidad desktop amplia](identity-1440x900.png) |
| 360 × 800 | [Identidad mobile](identity-360x800.png) |
| 390 × 844 | [Identidad mobile amplia](identity-390x844.png) |

Las capturas se regeneran con:

```powershell
$env:PROFILE_IDENTITY_EVIDENCE_DIRECTORY='docs/evidence/issue-85'
pnpm exec playwright test e2e/profile-identity.browser.mjs
```

## Revisión visual

- Las cuatro capturas se han revisado frente a la captura y el HTML aceptados de P11: fondo `#07131a`, nombre serif Newsreader, UI Inter, navegación neutra, acciones compactas con iconos y excepción dorada de Leer CV web sobre fondo oscuro. Se mantiene el texto íntegro de la fuente.
- Nombre, rol y las tres acciones principales caben completos antes del scroll en los cuatro viewports. En mobile se ve también el inicio de Trayectoria; Explorar trayectoria permite llegar al encabezado mediante un enlace nativo.
- Alicia Ejemplo tiene nombre y resumen más cortos que la muestra de P11. Su ubicación y Mastodon proceden del fixture y explican las filas adicionales de metadatos y enlaces. No se reproduce el nombre, resumen ni los destinos representados de Stitch.
- La marca superior usa el nombre fuente, sin iniciales editoriales de la muestra ni una tercera familia tipográfica. Se omite el control de tema inerte. El espaciado exterior y la composición final del lector corresponden a #89.
- El timeline que aparece en las capturas conserva sus controles históricos y queda sin detalle inicial: esta evidencia no acredita la selección, los filtros compactos ni la geometría final de #87–#89. La tipografía base sans se aplica también a sus títulos.
- Los iconos profesionales son SVG locales con acentos violeta, cian y amarillo; sus etiquetas y destinos permanecen legibles y no dependen del icono para su nombre accesible.

## Comprobaciones y revisión

- TDD: las expectativas Newsreader/Inter fallaron antes de cambiar las fuentes; la navegación superior falló antes de incorporarla; la prueba de hover profesional falló antes de corregir ese estado.
- `pnpm check`: 0 errores, advertencias o hints, ejecutado durante la implementación y tras la corrección de revisión.
- `pnpm test`: 133 pruebas Node aprobadas y una omitida (fixture POSIX en Windows); 45 pruebas Playwright aprobadas antes de la corrección final de estados profesionales.
- Tras la corrección: 19 pruebas Playwright afectadas aprobadas, incluida la nueva prueba de hover/activación de los cuatro enlaces profesionales y la comprobación Axe AA. Se conservan los resultados del resto de la suite, cuyo comportamiento no cambia con esa regla CSS.
- `pnpm test:pdf`: 4 pruebas aprobadas; generación factual compartida y diagnósticos negativos. El build contractual genera un CV PDF de 2 páginas.
- Checks contractuales de fuente, schema, datos, SEO y un base path alternativo aprobados. Se adaptan únicamente las expectativas de SVG y orden editorial del resumen; no cambian los datos ni sus reglas.
- Rendimiento real con budgets vigentes: [informe del evaluador](performance.md), incluidos el fallo inicial de entorno y su resolución. Las fuentes locales contienen únicamente el subconjunto latin con español: Inter 400/600/700 y Newsreader 400, sin cursivas ni familias adicionales.
- Contraste calculado sobre las parejas de colores renderizadas: CV web `#e0b354`/`#0c1e28`, **8,72:1**; otras acciones `#cbd5e1`/`#0c1e28`, **11,48:1**; navegación y perfiles `#94a3b8`/`#07131a`, **7,33:1**; foco `#c9bea6`/`#0c1e28`, **9,25:1**. El subrayado de hover/activación complementa el color y el foco interior.
- `/code-review` antes del commit contra el SHA de partida, usando el diff preparado para incluir todos los archivos nuevos: Standards sin hallazgos; Spec detectó un P2 por hover/activación profesional sin señal no cromática, corregido y verificado con TDD. La segunda revisión confirmó cerrado el P2, sin hallazgos nuevos.
- La revisión visual no acredita lector de pantalla, otros motores ni táctil real. Teclado, foco, Axe, fallback y contraste tienen la cobertura indicada.

## Aceptación delimitada

Esta evidencia corresponde únicamente a #85. No acredita la integración completa ni acepta P12. Los comportamientos de selección, detalle, geometría y lectura pendientes siguen en #86–#90; P13, persiana y extensiones curriculares aplazadas conservan sus límites normativos.
