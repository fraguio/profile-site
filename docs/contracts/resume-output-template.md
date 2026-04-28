# Resume Output Template

## Metadata

- Status: target contract (approved, pending full implementation).
- Scope: definition of expected output formats for `/`, `/read/`, and stable PDF delivery.
- Source of truth for target output behavior.
- Last updated: 2026-04-28.

Este documento fija la plantilla acordada para los formatos de salida del CV.

**Estado**: contrato funcional objetivo vigente para la evolucion del proyecto.

## Plantilla final (sin cambios)

- Premium:
  - Descripción: Experiencia interactiva “human-readable premium” con timeline dinámico, filtros por categoría y detalle animado de cada ítem.
  - Render: `profile-site` con Astro + JS progresivo (GSAP solo en premium).
  - Formato de salida: HTML + CSS + JavaScript.
  - Se genera: `dist/index.html`
  - Consumidor: Usuario que navega el perfil público.
  - Como consumirlo: Accediendo a https://dominio.com/.

- Lectura (`/read`) = documento ATS-friendly:
  - Descripción: Versión simplificada y lineal del CV, sin animaciones decorativas, orientada a lectura rápida y estructura clara.
  - Render: `profile-site` con Astro (misma fuente de datos, plantilla específica en `/read`).
  - Formato de salida: HTML + CSS (JS mínimo/no esencial).
  - Se genera: `dist/read/index.html`
  - Consumidor: Recruiter o usuario que prefiere formato tradicional.
  - Como consumirlo: Accediendo a https://dominio.com/read/.

- Print/ATS/Descargar PDF:
  - Descripción: Experiencia unificada ATS-friendly; tanto “Imprimir” como “Descargar PDF” entregan el mismo enfoque documental (estructura simple, texto claro, orden cronológico inverso, sin elementos complejos).
  - Render: Render único desde `profile-site` (`/read` como fuente canónica ATS).
  - Formato de salida:
    - HTML + CSS  (ATS base)  
    - PDF generado a partir de ese mismo `/read` y publicado en URL estable.
  - Se genera:
    - `dist/read/index.html` (ATS base)  
    - `cv/eduardo-nogueira-fraguio-cv.pdf` generado a partir de ese mismo `/read` y publicado en URL estable.
  - Consumidor:
    - Personas (recruiters/usuarios) que necesitan compartir, guardar o imprimir el CV.
    - Sistemas automáticos que consumen directamente la URL estable del PDF.
  - Como consumirlo:
    - Botón “Imprimir” en https://dominio.com/read/.
    - Botón “Descargar PDF” (URL estable): https://dominio.com/cv/eduardo-nogueira-fraguio-cv.pdf.

## Comentarios operativos

- Esta plantilla sirve como contrato funcional de salida para `profile-site`.
- Cualquier cambio futuro en estos bloques debe acordarse explícitamente antes de modificar implementación o tareas.
