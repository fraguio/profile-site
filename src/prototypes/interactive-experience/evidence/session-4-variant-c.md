# Sesión 4: variante C

- Fecha: 2026-09-22.
- Variante: `C`, dossier de modernización.
- Pregunta: ¿puede una interfaz de consulta precisa y documental resultar distintiva sin convertirse en otro CV web?
- Tarea de evaluación: identificar la especialización en modernización backend, localizar la evidencia que la respalda y acceder a contacto o CV web en treinta segundos.
- Estado: completada; prototipo inacabado.

## Impeccable

- Contexto: `.opencode/skills/impeccable/scripts/impeccable.cmd context`.
- Crítica: flujo equivalente a `/impeccable critique` con dos evaluaciones aisladas. La evaluación A revisó especificidad, jerarquía, lectura mobile y accesibilidad de `src/prototypes/interactive-experience/variants/VariantC.astro` sin consultar el detector. La evaluación B ejecutó exclusivamente el detector sobre el código y las URLs renderizadas.
- Informe: `.impeccable/critique/active-experience-variants-variantc-astro-2026-09-22.md`.
- Resultado de la crítica: el índice por ámbitos, el lector documental y la agrupación de Evolutio son específicos para la trayectoria, pero la portada necesitaba relacionar mejor Abanca y la modernización posterior y reducir CTAs equivalentes.
- Pasada única: `clarify`. Contacto pasa a ser la acción principal; la portada y la apertura relacionan la continuidad corporativa con la modernización; se añaden enlaces directos a ambos contextos, se eliminan los labels sobre titulares y se refuerza el foco visible de los `summary` nativos.

## Detector

- Código: `.opencode/skills/impeccable/scripts/impeccable.cmd detect --json src/prototypes/interactive-experience/variants/VariantC.astro src/styles/interactive-prototype.css`.
- Desktop: `IMPECCABLE_BROWSER=C:\Users\fraguio\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe .opencode/skills/impeccable/scripts/impeccable.cmd detect --json --no-advisory --viewport 1280x800 http://localhost:4321/profile-site/?variant=C`.
- Mobile: `IMPECCABLE_BROWSER=C:\Users\fraguio\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe .opencode/skills/impeccable/scripts/impeccable.cmd detect --json --no-advisory --viewport 390x844 http://localhost:4321/profile-site/?variant=C`.
- Outputs: `session-4-variant-c-code.json`, `session-4-variant-c-desktop.json` y `session-4-variant-c-mobile.json`.
- Resultado: el código no registra hallazgos. Desktop registra ocho avisos de medida de línea; mobile registra cuatro avisos de padding en las filas del índice horizontal. Se conservan como evidencia para la evaluación conjunta y no se ocultan mediante excepciones.

## Checks

- `pnpm check:prototype:interactive-experience`: correcto.
- `pnpm build:prototype:interactive-experience`: correcto.
- Smoke con Chromium: A, B y C cargan en `1280x800` y `390x844` sin overflow horizontal; `ArrowRight` cambia C a A; C no anima con `prefers-reduced-motion`; el fallback sin JavaScript en `390x844` muestra 19 artículos y al menos 3 enlaces operativos.
- Se revisó el diff: A, B y `SemanticFallback.astro` no se modificaron.
