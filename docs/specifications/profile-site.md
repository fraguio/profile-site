# Especificación maestra de `profile-site`

## Estado y autoridad

- Estado actual: no existe aún una aplicación de producto en este repositorio.
- Estado objetivo: aprobado para construcción desde cero.
- Autoridad: este documento es la única fuente normativa para el producto. `CONTEXT.md` define vocabulario y los ADRs registran decisiones concretas sin duplicar esta especificación.
- Identidad canónica: `fraguio/profile-site`.
- Idioma público inicial: español.

Los documentos de investigación que precedieron a esta especificación son contexto histórico y no fuentes normativas. Cualquier decisión incompatible queda supersedida por este documento.

## Objetivo de producto

El sitio es el activo público de marca profesional. Su resultado principal es generar contactos y oportunidades profesionales; exponer la trayectoria con profundidad es el resultado secundario.

La audiencia primaria son profesionales de selección y responsables de contratación. Responsables de ingeniería y perfiles técnicos son audiencia secundaria. El sitio debe transmitir credibilidad, experiencia técnica senior, claridad comunicativa y orientación a resultados mediante hechos curriculares verificables, no afirmaciones vacías.

Principios no negociables:

- Claridad antes que adorno.
- Datos reales antes que marketing.
- Interacción solo cuando mejora comprensión o exploración.
- Accesibilidad, rendimiento y degradación progresiva como requisitos de producto.
- Ninguna sección o campo vacío se muestra como marcador de posición.

## Superficies y salidas

| Superficie | Ruta pública canónica | Artefacto | Propósito | JavaScript |
| --- | --- | --- | --- | --- |
| Experiencia interactiva | `/` | `dist/index.html` | Presentar y explorar la trayectoria | Progresivo; GSAP core solo aquí |
| CV web | `/read/` | `dist/read/index.html` | Lectura lineal, ATS-oriented e impresión | Solo `window.print()` |
| CV PDF | `/cv/eduardo-nogueira-fraguio-cv.pdf` | `dist/cv/eduardo-nogueira-fraguio-cv.pdf` | Documento estable para descarga y distribución | No aplica |

Astro debe usar `trailingSlash: "always"`. Los enlaces, canonical y pruebas usan `/read/`, nunca `/read` ni el nombre físico `index.html` como URL pública.

El CV web es el documento ATS-oriented canónico. Imprimir y descargar PDF comparten su contenido factual; solo pueden diferir por composición física, paginación, márgenes y representación de URLs.

## Fuente curricular y contrato de datos

La única fuente de hechos curriculares es `profile-data/data/resume.json`. `profile-site` es responsable de presentar, validar y publicar esos datos, no de duplicarlos.

La validación usa JSON Resume `1.3.1` exacto. Se versiona en este repositorio una copia identificada del schema oficial junto con su procedencia y checksum; Ajv valida esa copia. Una actualización del schema requiere una decisión explícita y revisable.

Las claves del JSON permanecen en inglés. La capa de presentación localiza etiquetas, fechas, países y otros valores estructurados; no traduce automáticamente prosa libre. El contenido textual debe llegar redactado en español. Si llega contenido en otro idioma, se publica tal cual y se revisa editorialmente fuera del gate automático.

### Alcance visible inicial

Se renderizan solo `basics`, `work`, `education` y `projects`. Las demás secciones del estándar se aceptan en la fuente pero no se muestran. `meta` no es contenido visual. Se omiten silenciosamente secciones, campos y listas vacías.

La sección superior `skills` puede existir en la fuente, pero no se muestra ni actúa como catálogo en esta versión.

### Habilidades asociadas

- `work[].skills` es una extensión local opcional: array de strings no vacíos.
- `education[].skills` es una extensión local opcional: array de strings no vacíos.
- `projects[].keywords` es el campo estándar que representa habilidades asociadas a proyectos.
- Una habilidad puede aparecer en varios hitos y se muestra en cada uno.
- Se pueden eliminar duplicados exactos dentro de un mismo elemento.
- No hay validación cruzada con `skills` ni normalización de grafía, mayúsculas o minúsculas.

Las reglas locales se validan antes del render y fallan con diagnóstico que incluya ruta del campo, valor y regla incumplida. Además de las extensiones, las reglas incluyen fechas válidas, `endDate >= startDate` cuando exista y campos requeridos por la presentación.

### Información personal

Se muestran email profesional, web y perfiles profesionales disponibles. El teléfono es configurable pero queda oculto por defecto. La ubicación se limita a ciudad, región y país localizado; no se muestra dirección postal ni código postal. No se muestra fotografía en ninguna superficie inicial.

## Experiencia interactiva

### Hero y navegación

El hero muestra nombre, rol profesional, el contenido íntegro de `basics.summary` y CTAs a CV web, PDF y contacto. Nombre, rol y CTAs deben ser visibles antes del scroll; el resumen no se trunca ni se reescribe para forzar ese límite.

El CTA de contacto abre `mailto:` hacia el email profesional. LinkedIn y GitHub, si existen en `basics.profiles`, son enlaces secundarios prioritarios. No se muestra fecha de actualización en la primera versión.

### Timeline

El timeline combina `work`, `education` y `projects` en una secuencia cronológica. Un elemento de cualquiera de esas secciones debe tener `startDate` válida; los elementos sin `endDate` se consideran vigentes y aparecen primero. El orden es descendente por fecha de finalización o vigencia, después por `startDate` descendente y, ante empate, conserva el orden de origen.

El filtro inicial definitivo es `all`: muestra la trayectoria combinada. El valor `work` fue una propuesta provisional histórica y no forma parte del contrato. Los filtros disponibles corresponden a categorías con elementos; una categoría vacía no muestra control.

El cambio de filtro reinicia suavemente el carril en el hito más reciente del nuevo conjunto y anuncia el resultado mediante una región viva. No conserva una posición aproximada entre conjuntos distintos.

El estado inicial no selecciona ningún hito. El estado de filtro, selección, pausa y posición vive solo en memoria del cliente y no se persiste ni se refleja en URL.

### Detalle y responsive

El patrón es `single-open`: solo puede existir un detalle abierto.

En desktop, el timeline es un carril vertical continuo y el detalle aparece en un lector lateral estable. El lector tiene cabecera fija con categoría, título, entidad, periodo y cierre; su cuerpo desplazable contiene prosa y habilidades asociadas.

En mobile, al seleccionar un hito el carril se congela y es sustituido temporalmente por un panel de detalle. El cuerpo del panel es desplazable; no es un modal ni una expansión inline. Al cerrarlo, se restaura el carril en la posición congelada y se reanuda su movimiento según el estado anterior.

Se abre o alterna un hito por clic, `Enter` o `Space`. Abrir otro cierra el anterior. Un botón de cierre y `Esc` cierran el detalle. En mobile, al abrir el foco pasa al encabezado del detalle y, al cerrar, vuelve al hito activador.

### Movimiento

El movimiento vertical continuo es obligatorio en la experiencia objetivo, aunque una entrega incremental pueda validar antes el mismo marcado en estado estático. No se construyen dos timelines distintos: el HTML accesible base debe ser el que el cliente mejora.

El loop se pausa al hover, foco, touch o selección. Existe un control secundario visible `Pausar/Reanudar` operable con teclado y touch. Cuando hay detalle abierto, ese control dice `Cerrar detalle y reanudar` y ejecuta ambas acciones. Con `prefers-reduced-motion`, el timeline comienza estático y solo se mueve tras una acción explícita compatible con la preferencia.

En mobile el loop es moderado y se detiene inmediatamente al tocar o seleccionar. Si las pruebas de implementación demuestran que interfiere con el scroll, puede desactivarse en mobile sin invalidar el objetivo global de movimiento.

Drag & Drop queda fuera de alcance: la trayectoria no admite reordenación como operación de dominio.

### Degradación sin JavaScript

Sin JavaScript, `/` muestra la trayectoria completa, sus detalles y CTAs operativos. Filtros, selección, loop y transiciones son mejoras progresivas. Nunca redirige automáticamente a `/read/`.

## CV web, impresión y PDF

`/read/` prioriza lectura documental, orden, semántica y navegación completa por teclado. Muestra todo el contenido curricular relevante de las secciones soportadas sin truncar automáticamente textos, `highlights`, roles o habilidades asociadas.

El orden es:

1. Identidad y contacto.
2. Resumen profesional.
3. Experiencia profesional.
4. Proyectos.
5. Formación.

`/read/` ofrece:

- `data-contract="read-print-action"` para imprimir mediante `window.print()`.
- `data-contract="read-download-pdf"` para el enlace PDF estable con atributo `download`.

Sin JavaScript, la acción de imprimir se oculta y la descarga permanece visible. Las acciones se marcan como no imprimibles y no aparecen ni en impresión ni en PDF.

El PDF se genera exclusivamente desde `/read/` ya renderizado, servido desde `dist` mediante un servidor temporal y abierto con Playwright y Chromium. No existe plantilla PDF paralela. Usa A4, márgenes uniformes de `2 cm` y una pila reproducible para PDF que incluye `Liberation Sans, Arial, Helvetica, sans-serif`.

El PDF debe existir, no estar vacío, empezar por `%PDF-` y tener al menos una página. El número de páginas se informa en CI, pero no limita el build en esta versión.

## Accesibilidad

El objetivo es WCAG 2.2 nivel AA en `/` y `/read/`. Este objetivo se respalda con automatización y revisión manual; ningún resultado de Axe por sí solo certifica conformidad.

Requisitos mínimos:

- Operación completa por teclado.
- Foco visible y gestión de foco coherente.
- Contraste AA para texto y controles.
- Semántica y etiquetas accesibles.
- Estados hover, focus, active y disabled comprensibles sin depender solo del color.
- Respeto estricto a `prefers-reduced-motion`.
- Contenido legible con zoom, sin JavaScript y al imprimir.

La aceptación combina Axe, pruebas Playwright de teclado, foco y estados, y una checklist manual para lectura, zoom, movimiento, impresión y tecnologías asistivas.

## SEO y metadatos

`/` y `/read/` son indexables y poseen `title`, `meta description` y canonical autorreferente no vacíos. Cada ruta tiene texto SEO propio; no se duplica la descripción.

`PROFILE_SITE_BASE_URL` es obligatorio en builds contractuales. Debe ser HTTPS en producción, no incluir path y alimenta canonicals, Open Graph y datos estructurados. El dominio definitivo queda pendiente.

`/` incluye JSON-LD `Person` y `ProfilePage` derivado exclusivamente de datos públicos ya visibles. No expone teléfono, dirección completa ni campos ocultos.

Open Graph inicial exige `og:title`, `og:description`, `og:url`, `og:type` y `og:locale`. `og:image` debe estar disponible antes de la publicación pública, pero no bloquea el bootstrap inicial. La imagen será un recurso estable diseñado, no una captura generada en cada build.

## Arquitectura y toolchain

- Astro en la raíz, con salida estática.
- Node 24 LTS en CI y rango de engine que acepta la línea 24.
- pnpm `11.5.2` exacto, declarado en `packageManager`, con lockfile obligatorio.
- Páginas previstas: `src/pages/index.astro` y `src/pages/read/index.astro`.
- Capa compartida de carga, normalización y presentación de datos fuera de las páginas.
- `/` usa TypeScript de navegador y GSAP core, sin React, Vue, Svelte ni hidratación de framework.
- GSAP se limita a `/`, falla de forma segura hacia HTML estático y no usa plugins salvo necesidad demostrada, medida y documentada.
- `/read/` no contiene JavaScript de aplicación ni librerías; su única excepción es el disparo de impresión.

Las familias tipográficas definitivas se eligen durante diseño. Deben ser autoalojables, admitir español y cumplir el presupuesto de rendimiento. La dirección de referencia es oscura, editorial y sobria-profesional, con alto contraste y acento contenido; no es una identidad visual cerrada.

## Integración curricular

El emisor `profile-data` envía un `repository_dispatch` dedicado al repositorio con:

```json
{
  "event_type": "profile-data-updated",
  "client_payload": {
    "profile_data_ref": "main",
    "profile_data_path": "data/resume.json",
    "profile_data_sha": "<sha-del-commit-origen>"
  }
}
```

En dispatch, los tres campos son obligatorios. `profile_data_sha` es la revisión efectiva: debe existir, pertenecer al repositorio de datos y se usa para leer `profile_data_path`. `profile_data_ref` es contexto humano y puede ser rama, tag o SHA. El build registra referencia, ruta y `resolved_profile_data_sha`.

Una carga ausente, inválida o inaccesible falla con diagnóstico explícito. Un build de publicación que no recibe SHA resuelve primero la referencia configurada a un SHA exacto y usa exclusivamente ese valor después.

En desarrollo local se usa un `RESUME_PATH` explícito. Los pull requests usan un fixture ficticio versionado, sin secretos ni datos personales.

Las actualizaciones automáticas usan `latest-wins`:

1. Cada ejecución valida y construye el SHA que recibió.
2. Antes de desplegar, comprueba si sigue siendo la revisión vigente de `profile-data/main`.
3. Si hay una revisión posterior, queda marcada como publicación supersedida y no despliega.
4. Un despliegue que ya comenzó no se interrumpe de forma insegura; una ejecución posterior publica la revisión vigente.

## CI, despliegue y observabilidad

GitHub Pages es el destino inicial. Ningún fallo contractual sustituye o publica parcialmente sobre la última versión publicada.

| Evento | Datos | Despliegue | Regla de referencia |
| --- | --- | --- | --- |
| `pull_request` | Fixture ficticio | No | No requiere secretos |
| `push` a `main` | Revisión vigente de `profile-data/main` resuelta a SHA | Sí | Registra SHA efectivo |
| `repository_dispatch` | SHA recibido | Sí, si no fue supersedido | Usa el SHA recibido |
| `workflow_dispatch` | Ref y ruta introducidas por operador | Solo con `deploy=true` | Resuelve la ref a SHA antes de construir |

`workflow_dispatch` ofrece `profile_data_ref` con default `main`, `profile_data_path` con default `data/resume.json` y `deploy` booleano con default `false`. Puede validar cualquier rama, tag o commit accesible. Para desplegar manualmente requiere `deploy=true`, entorno protegido de GitHub y logs visibles con referencia solicitada y SHA efectivo.

Cada fase ejecuta pasos contractuales atómicos y diagnosticables para su alcance. La fase Base valida adquisición, schema, reglas locales, render HTML, rutas, SEO, CTAs y accesibilidad automatizable. La fase PDF añade generación, validación y output PDF. Cualquier fallo aplicable a la fase bloquea el despliegue.

Tras un deploy se ejecutan smoke tests sobre la URL pública para `/` y `/read/`; desde la fase PDF también verifican el PDF. Un fallo marca la publicación como fallida y deja diagnóstico; el rollback automático queda fuera de alcance.

### Rendimiento

Lighthouse mobile es la medición contractual principal; desktop es observacional en todos los eventos. Las métricas Lighthouse usan la mediana de tres ejecuciones sobre `dist` servido localmente. El perfil móvil se versiona. Las métricas deterministas de build usan una sola ejecución.

Hay tres protecciones:

- Un fallo técnico de medición bloquea siempre.
- Los budgets deterministas de build para JavaScript inicial, bundles, fuentes, recursos propios y requests críticos bloquean siempre.
- Lighthouse mobile tiene un objetivo y un límite absoluto de seguridad.

| Control | Pull request | Push a `main` | Repository dispatch | Workflow dispatch |
| --- | --- | --- | --- | --- |
| Fallo técnico de medición | Bloquea | Bloquea | Bloquea | Bloquea |
| Budget determinista de build | Bloquea | Bloquea | Bloquea | Bloquea |
| Objetivo Lighthouse mobile | Bloquea | Bloquea | Warning | Warning |
| Límite absoluto de seguridad | Bloquea | Bloquea deploy | Bloquea deploy | Bloquea deploy |
| Lighthouse desktop | Informa | Informa | Informa | Informa |

Los valores numéricos de budgets y límite absoluto se fijan con la baseline real del primer PR que entregue la experiencia completa. Todos los resultados, warnings y fallos se publican en `GITHUB_STEP_SUMMARY`. Cambiar budgets o perfil de medición exige PR justificada y actualización de checks; no se usan etiquetas de fase para gobernar esos cambios.

## Entregas incrementales y evidencia

| Fase | Entregable | Cierre con evidencia |
| --- | --- | --- |
| Base | Astro, datos, `/`, `/read/`, validación, SEO, a11y base y CI | Build contractual verde con fixture y rutas generadas |
| PDF | PDF estable derivado del CV web | PDF publicado y checks de archivo, firma y páginas verdes |
| Interactividad | Timeline, filtros, lector, movimiento y degradación progresiva | Pruebas de estado, teclado, foco, motion y rendimiento verdes |
| Mejora | Ajustes posteriores basados en evidencia | Decisión y evidencia específicas |

Una entrega puede avanzar con el timeline estático si conserva el marcado final mejorable, pero la fase de interactividad no queda completada sin movimiento continuo conforme a este contrato.

## Trazabilidad mínima

| ID | Requisito | Evidencia esperada |
| --- | --- | --- |
| OUT-001 | Generar experiencia interactiva | `dist/index.html` |
| OUT-002 | Generar CV web | `dist/read/index.html` |
| PDF-001 | Publicar PDF estable desde CV web | `dist/cv/eduardo-nogueira-fraguio-cv.pdf` y checks PDF |
| DATA-001 | Validar schema y reglas locales | Paso CI y diagnóstico de validación |
| DATA-002 | Consumir revisión curricular exacta | Logs con `resolved_profile_data_sha` |
| INT-001 | Timeline con filtro inicial `all` | Prueba de render y estado cliente |
| INT-002 | Detalle responsive accesible | Pruebas Playwright de foco, teclado y cierre |
| A11Y-001 | WCAG 2.2 AA como objetivo | Axe, pruebas de interacción y checklist manual |
| SEO-001 | Metadatos por ruta | Check sobre ambos HTML generados |
| PERF-001 | Rendimiento con dos niveles | Lighthouse y budgets de build en summary |
| DEPLOY-001 | Publicación íntegra y smoke test | Workflow y comprobación pública |

## Decisiones aplazadas

- Dominio final de `PROFILE_SITE_BASE_URL`.
- Imagen estable de Open Graph.
- Familias tipográficas concretas.
- Valores numéricos de budgets de rendimiento y límite absoluto.
- Si el loop automático en mobile interfiere con scroll real; puede desactivarse en mobile tras evidencia.

## Fuera de alcance inicial

- Versión multilingüe.
- Formulario de contacto y backend asociado.
- Fotografía profesional.
- Render por request.
- Drag & Drop del timeline.
- Persistencia mediante URL, local storage o historial del estado interactivo.
- Rollback automático después de un smoke test publicado fallido.
