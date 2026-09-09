# Generar el PDF desde el CV web

Aceptado. El PDF estable se genera desde `/read/` renderizado en un servidor temporal con Playwright y Chromium; no existe una plantilla PDF paralela. Una única fuente documental evita divergencias entre lectura web, impresión y descarga, a cambio de tratar el render del navegador como parte obligatoria del build.

## Alternativas consideradas

- Mantener una plantilla PDF independiente: descartado por el riesgo de que el documento descargable deje de reflejar el CV web.
