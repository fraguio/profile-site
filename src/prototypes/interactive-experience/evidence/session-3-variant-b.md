# Sesión 3: variante B

- Fecha: 2026-09-22.
- Variante: `B`, sistema en evolución.
- Pregunta: ¿puede una representación abstracta de capas, conexiones y transformación hacer memorable el perfil sin fingir que muestra una arquitectura real?
- Tarea de evaluación: identificar la especialización en modernización backend, localizar la evidencia que la respalda y acceder a contacto o CV web en treinta segundos.
- Estado: completada; prototipo inacabado.

## Impeccable

- Contexto: `.opencode/skills/impeccable/scripts/impeccable.cmd context`.
- Crítica: flujo equivalente a `/impeccable critique` con dos evaluaciones aisladas. La evaluación A revisó especificidad, jerarquía, carga cognitiva, recorrido emocional y heurísticas de `src/prototypes/interactive-experience/variants/VariantB.astro` sin consultar el detector. La evaluación B ejecutó exclusivamente el detector sobre el código y las URLs renderizadas.
- Informe: `.impeccable/critique/active-experience-variants-variantb-astro-2026-09-22.md`.
- Resultado de la crítica: la metáfora sirve al posicionamiento y conserva una semántica sólida, pero los resúmenes de evidencia y la primera decisión del recruiter requerían lenguaje más directo.
- Pasada única: `clarify`. El CTA principal pasa a ser `Ver caso de modernización`; la navegación nombra los contextos Abanca, Evolutio, base inicial y práctica/aprendizaje; y cada evidencia profesional empieza por cargo y organización. En mobile, los CTAs usan dos columnas sin overflow horizontal.

## Detector

- Código: `.opencode/skills/impeccable/scripts/impeccable.cmd detect --json src/prototypes/interactive-experience/variants/VariantB.astro src/styles/interactive-prototype.css`.
- Desktop: `IMPECCABLE_BROWSER=C:\Users\fraguio\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe .opencode/skills/impeccable/scripts/impeccable.cmd detect --json --no-advisory --viewport 1280x800 http://localhost:4321/profile-site/?variant=B`.
- Mobile: `IMPECCABLE_BROWSER=C:\Users\fraguio\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe .opencode/skills/impeccable/scripts/impeccable.cmd detect --json --no-advisory --viewport 390x844 http://localhost:4321/profile-site/?variant=B`.
- Outputs: `session-3-variant-b-code.json`, `session-3-variant-b-desktop.json` y `session-3-variant-b-mobile.json`.
- Resultado: el código no registra hallazgos. Desktop registra dos avisos de medida de línea y cuatro de repetición; mobile registra dos de padding y los cuatro de repetición. Las repeticiones derivan de los tres registros reales de Evolutio y de sus habilidades asociadas, que el contrato exige conservar. El detector completo también informó avisos `gpt-thin-border-wide-shadow` sobre los planos abstractos; se aceptan como decisión intencional de profundidad de la metáfora, no como un patrón de tarjetas.

## Checks

- `pnpm check:prototype:interactive-experience`: correcto.
- `pnpm build:prototype:interactive-experience`: correcto.
- Smoke con Chromium: A, B y C cargan en `1280x800` y `390x844` sin overflow horizontal; `ArrowRight` cambia B a C; B no anima con `prefers-reduced-motion`; el fallback sin JavaScript en `390x844` muestra 4 CTAs y 19 artículos.
- Se revisó el diff: A, C y `SemanticFallback.astro` no se modificaron.
