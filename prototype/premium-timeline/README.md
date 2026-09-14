# Prototipo de timeline premium

Prototipo UI desechable para comparar tres estructuras de timeline, no código de producto. El contenido es completamente ficticio y el estado vive solo en memoria.

## Pregunta investigada

¿Qué estructura de timeline equilibra movimiento continuo, filtros, lectura de detalle, accesibilidad y cambio a mobile sin convertir la trayectoria en una sucesión de tarjetas?

Se comparan tres variantes intercambiables mediante `?variant=`:

- `a`: secuencia vertical con detalle expandible dentro del carril.
- `b`: navegador vertical y lector lateral estable; en mobile, panel de detalle sustitutivo.
- `c`: cinta horizontal de capítulos y atril de lectura.

## Veredicto

La variante B responde la pregunta y se elige como dirección de producción: un carril vertical continuo para explorar hitos y un lector lateral estable en desktop; en mobile, el carril se congela y se sustituye temporalmente por un panel de detalle desplazable.

Esta conclusión coincide con la especificación normativa en [`docs/specifications/profile-site.md`](../../docs/specifications/profile-site.md), apartados «Detalle y responsive» y «Movimiento». El prototipo preserva el marcado y los datos de ejemplo solo como evidencia de diseño, no como implementación reutilizable.

## Evidencia observada

- Desktop: B mantiene el navegador en movimiento separado de un lector estable, con cabecera y cuerpo desplazable para el texto largo de `Signal Atlas` y sus habilidades asociadas.
- Mobile a `375px`: al seleccionar un hito, B oculta el carril y muestra el panel de detalle; `Esc` lo cierra y el foco vuelve al hito activador.
- Filtros: `Todo`, `Trabajo`, `Formación` y `Proyectos` reconstruyen la secuencia desde su inicio y anuncian el resultado.
- Interacción: clic, `Enter` y `Space` activan los botones nativos; el cierre funciona mediante botón y `Esc`. El movimiento se pausa ante hover, foco, pulsación, touch o detalle abierto, y el control visible permite pausarlo y reanudarlo.
- Movimiento reducido: con `prefers-reduced-motion`, B comienza estática; una acción explícita permite iniciar el movimiento.
- Sin JavaScript: el bloque `noscript` expone los siete hitos, sus textos y los CTAs de muestra sin filtros ni animación.

La comprobación automatizada con Playwright cubrió selección y cierre en desktop, filtro de trabajo, sustitución y foco en mobile, reducción de movimiento con consentimiento explícito y el fallback sin JavaScript. La inspección visual se realizó para A, B y C en desktop, y para B en viewport mobile.

## Alternativas descartadas

- A no separa exploración y lectura: el detalle expandido altera la geometría del carril y compite con el movimiento continuo, especialmente con contenido largo.
- C convierte la trayectoria en una cinta horizontal. Su atril es claro, pero contradice la dirección de carril vertical continuo y ofrece una exploración menos natural en mobile.

## Limitaciones

- Es un prototipo estático con datos ficticios: no valida la integración con JSON Resume, GSAP, rendimiento ni el contenido curricular real.
- La prueba mobile se realizó con emulación Chromium; queda pendiente revisión manual en dispositivos reales, lectores de pantalla y navegadores adicionales.
- La degradación sin JavaScript demuestra el contenido de ejemplo del prototipo, no el render semántico final de Astro.
- No se han aplicado Axe ni una auditoría WCAG completa; las comprobaciones de accesibilidad son de interacción y foco, no una certificación.

## Decisiones para producción

- Conservar un único HTML accesible de timeline que el cliente mejore progresivamente; no crear dos timelines distintos para el loop y el fallback.
- Implementar el patrón `single-open`: lector lateral estable en desktop y panel sustitutivo en mobile.
- Al abrir mobile, mover el foco al encabezado del detalle; al cerrar, devolverlo al hito activador y restaurar la posición y el estado previo de movimiento. El foco restaurado programáticamente no debe activar una pausa nueva.
- Mantener filtros en memoria, reiniciar cada nuevo conjunto en el hito más reciente y anunciar el resultado.
- Iniciar estático con `prefers-reduced-motion` y permitir movimiento solo mediante una acción explícita compatible con la preferencia.

## Ejecutar

Ejecutar desde la raíz del worktree:

```powershell
python -m http.server 4173 --directory prototype/premium-timeline
```

Abrir `http://localhost:4173/?variant=a`. Las variantes son `a`, `b` y `c`.
