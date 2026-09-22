# Sesión 2: variante A

- Fecha: 2026-09-22.
- Variante: `A`, capítulos editoriales.
- Pregunta: ¿puede una narrativa editorial comunicar modernización, seniority y continuidad con más claridad y personalidad que un navegador cronológico?
- Tarea de evaluación: identificar la especialización en modernización backend, localizar la evidencia que la respalda y acceder a contacto o CV web en treinta segundos.
- Estado: completada; prototipo inacabado.

## Impeccable

- Contexto: `.opencode/skills/impeccable/scripts/impeccable.cmd context`.
- Crítica: flujo equivalente a `/impeccable critique` con dos evaluaciones aisladas. La evaluación A revisó la especificidad, jerarquía, carga cognitiva, recorrido emocional y heurísticas de `src/prototypes/interactive-experience/variants/VariantA.astro` sin consultar el detector. La evaluación B ejecutó exclusivamente el detector sobre los archivos y las URLs renderizadas. El informe está en `.impeccable/critique/active-experience-variants-varianta-astro-a9c48374-2026-09-22.md`.
- Resultado de la crítica: la estructura editorial es específica para la trayectoria, pero el acceso inicial a la evidencia de modernización y la densidad de las intervenciones secundarias requerían simplificación.
- Pasada única: `distill`. El CTA principal lleva a `#modernizacion`; la navegación queda en modernización, continuidad y proyectos; Nébula mantiene el detalle abierto y las otras intervenciones revelan responsabilidades y habilidades bajo demanda. Los ajustes de contraste, leading, overflow e inset mobile forman parte del cierre de esa misma pasada.

## Detector

- Código: `.opencode/skills/impeccable/scripts/impeccable.cmd detect --json src/prototypes/interactive-experience/variants/VariantA.astro src/styles/interactive-prototype.css`.
- Desktop: `IMPECCABLE_BROWSER=C:\Users\fraguio\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe .opencode/skills/impeccable/scripts/impeccable.cmd detect --json --viewport 1280x800 http://localhost:4321/profile-site/?variant=A`.
- Mobile: `IMPECCABLE_BROWSER=C:\Users\fraguio\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe .opencode/skills/impeccable/scripts/impeccable.cmd detect --json --viewport 390x844 http://localhost:4321/profile-site/?variant=A`.
- Outputs: `session-2-variant-a-code.json`, `session-2-variant-a-desktop.json` y `session-2-variant-a-mobile.json`.
- Resultado final: los tres outputs están vacíos.

## Checks

- `pnpm check:prototype:interactive-experience`: correcto.
- `pnpm build:prototype:interactive-experience`: correcto.
- Smoke de navegador: `?variant=A`, `?variant=B` y `?variant=C` cargan en `1280x800` y `390x844` sin overflow horizontal; `ArrowRight` cambia A a B; A no anima con `prefers-reduced-motion`.
- Fallback sin JavaScript en `390x844`: visible, con 3 CTAs y 19 artículos.
- Se revisó el diff: B, C y `SemanticFallback.astro` no se modificaron.
