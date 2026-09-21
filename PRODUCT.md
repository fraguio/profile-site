# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

La audiencia primaria son profesionales de selección y responsables de contratación que evalúan rápidamente la idoneidad del perfil y buscan una vía de contacto. Los responsables de ingeniería y perfiles técnicos constituyen la audiencia secundaria y necesitan profundizar en las evidencias curriculares.

## Product Purpose

`profile-site` es un activo público de marca profesional. Su resultado principal es generar contactos y oportunidades profesionales; la exploración de la trayectoria profesional es un resultado secundario que respalda esa decisión.

## Positioning

El perfil se posiciona como Senior Backend Developer especializado en modernizar sistemas corporativos. Más de veinte años de experiencia documentable, la continuidad en el entorno Abanca y la evolución hacia microservicios, cloud, serverless e integraciones sustentan ese posicionamiento.

## Operating Context

La Experiencia interactiva se visita en un navegador, en desktop y mobile, desde `/`. Debe conducir a contacto, al CV web documental en `/read/` y al CV PDF. El único UI prototype se evalúa mediante código ejecutado en el navegador y selecciona sus variantes mediante `?variant=`.

## Capabilities and Constraints

- La plataforma usa Astro, TypeScript de navegador y CSS; GSAP core solo puede usarse en `/` cuando una pregunta de movimiento lo requiera.
- La Experiencia interactiva y el CV web son superficies distintas; el CV web, el CV PDF y sus contratos no se rediseñan en esta exploración.
- El prototipo contiene una única fuente de adquisición, validación y modelo neutral para `basics`, `work`, `education` y `projects`; cada variante controla su estructura y composición.
- La fuente común es `src/prototypes/interactive-experience/resume.fixture.json`. La sección superior `skills` no se muestra y las habilidades solo se asocian a su experiencia, formación o proyecto.
- No hay persistencia, backend, formulario de contacto, fotografía, métricas inventadas ni catálogo global de habilidades.
- La dirección ganadora, el tema definitivo, las familias tipográficas, la metáfora visual, la organización de contextos y el nivel de movimiento siguen abiertos.

## Brand Commitments

La experiencia debe comunicar experiencia técnica senior, modernización de sistemas corporativos, confiabilidad, continuidad, claridad comunicativa, adaptación tecnológica, calidad, mantenibilidad y rendimiento mediante hechos curriculares verificables. La referencia visual v1 queda excluida de esta exploración.

## Evidence on Hand

La fixture común validada contiene el contenido curricular disponible, incluidas habilidades asociadas y los proyectos temporales `profile-site` y `profile-engine`. No hay fotografía, métricas de impacto, case studies completos ni datos suficientes para presentar responsabilidades ordinarias como logros extraordinarios.

## Product Principles

- Priorizar claridad y acceso a contacto sobre adorno.
- Presentar hechos curriculares antes que marketing.
- Relacionar las afirmaciones con evidencias comprensibles y fechadas.
- Mantener la jerarquía proporcional a relevancia y duración.
- Usar interacción y movimiento solo cuando mejoren comprensión o exploración.

## Accessibility & Inclusion

El objetivo es WCAG 2.2 nivel AA. La experiencia debe permitir teclado, foco visible y orden coherente, contraste suficiente, semántica y etiquetas accesibles, lectura con zoom, respeto de `prefers-reduced-motion` y degradación progresiva. En mobile el desplazamiento principal es vertical, libre y no usa `scroll-snap` ni alturas rígidas que trunquen contenido.
