# Especificación maestra de `profile-site`

## Estado y autoridad

- Estado actual: no existe aún una aplicación de producto en este repositorio.
- Estado objetivo: aprobado para construcción desde cero.
- Autoridad: este documento es la única fuente normativa para el producto. `CONTEXT.md` define vocabulario y los ADRs registran decisiones concretas sin duplicar esta especificación.
- Identidad canónica: `fraguio/profile-site`.
- Idioma público inicial: español.

Los documentos de investigación que precedieron a esta especificación son contexto histórico y no fuentes normativas. Cualquier decisión incompatible queda supersedida por este documento.

El prototipo publicado en [`5c53cc1cf27aa93c745237179290649d741eb891`](https://github.com/fraguio/profile-site/tree/5c53cc1cf27aa93c745237179290649d741eb891/prototype/premium-timeline) aporta evidencia de investigación para la interacción del timeline. Su [README](https://github.com/fraguio/profile-site/blob/5c53cc1cf27aa93c745237179290649d741eb891/prototype/premium-timeline/README.md) contiene el veredicto, la evidencia y las limitaciones; el prototipo no es código de producción ni fuente normativa.

## Objetivo de producto

El sitio es el activo público de marca profesional. Su resultado principal es generar contactos y oportunidades profesionales; exponer la trayectoria con profundidad es el resultado secundario.

La audiencia primaria son profesionales de selección y responsables de contratación. Responsables de ingeniería y perfiles técnicos son audiencia secundaria. El sitio debe transmitir credibilidad, experiencia técnica senior, claridad comunicativa y orientación a resultados mediante hechos curriculares verificables, no afirmaciones vacías.

Principios no negociables:

- Claridad antes que adorno.
- Datos reales antes que marketing.
- Interacción solo cuando mejora comprensión o exploración.
- Accesibilidad, rendimiento y degradación progresiva como requisitos de producto.
- Ninguna sección o campo vacío se muestra como placeholder.

## Superficies y salidas

| Superficie | Ruta interna | Artefacto en `dist` | URL pública de la v1 | Propósito | JavaScript |
| --- | --- | --- | --- | --- | --- |
| Experiencia interactiva | `/` | `dist/index.html` | `https://fraguio.github.io/profile-site/` | Presentar y explorar la trayectoria | Progresivo; GSAP core solo aquí |
| CV web | `/read/` | `dist/read/index.html` | `https://fraguio.github.io/profile-site/read/` | Lectura lineal, ATS-oriented e impresión | Solo `window.print()` |
| CV PDF | `/cv/eduardo-nogueira-fraguio-cv.pdf` | `dist/cv/eduardo-nogueira-fraguio-cv.pdf` | `https://fraguio.github.io/profile-site/cv/eduardo-nogueira-fraguio-cv.pdf` | Documento estable para descarga y distribución | No aplica |

Las rutas internas expresan la navegación dentro de la aplicación y los artefactos expresan el output físico del build. Las URLs públicas anteponen el base path `/profile-site/` del project site; ninguna comprobación debe confundir esos tres niveles ni asumir que la publicación vive en la raíz del origin.

Astro debe usar `trailingSlash: "always"`. Los contratos internos usan `/read/`, nunca `/read` ni el nombre físico `index.html`; los enlaces renderizados, canonical, recursos y smoke tests incorporan además el base path público.

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

El hero muestra nombre, rol profesional, el contenido íntegro de `basics.summary` y CTAs a CV web y contacto. Desde la fase PDF añade también el CTA al PDF. Nombre, rol y los CTAs aplicables a la fase deben ser visibles antes del scroll; el resumen no se trunca ni se reescribe para forzar ese límite.

El CTA de contacto abre `mailto:` hacia el email profesional. LinkedIn y GitHub, si existen en `basics.profiles`, son enlaces secundarios prioritarios. No se muestra fecha de actualización en la primera versión.

### Dirección visual y composición v1

La [referencia visual de la v1](../design/profile-site-v1-reference.png) guía tanto la estética como la distribución general, pero no constituye un contrato literal ni autoriza a anticipar funciones de fases posteriores. La experiencia adopta un marco oscuro, editorial y sobrio-profesional, con alto contraste, acento dorado contenido, navegación superior y jerarquía tipográfica serif/sans. No incorpora controles inertes para representar filtros, selección, lector, PDF, tema o movimiento antes de que sus fases los hagan operativos.

En desktop, la composición dispone la identidad, el resumen, los CTAs Base y los enlaces profesionales en una columna izquierda, y la trayectoria en una zona derecha más amplia. Esa zona puede dividirse después en carril y lector lateral sin reemplazar el árbol de contenido ni rehacer la composición principal. En la entrega estática, la trayectoria usa todo el espacio disponible y no muestra un lector vacío.

En mobile, el hero y el timeline son regiones consecutivas del mismo documento. El desplazamiento principal es vertical, libre y sin `scroll-snap`; no se presentan como pantallas laterales ni se fuerzan alturas rígidas. El hero puede crecer para conservar el resumen completo y ofrece un enlace textual visible `Explorar trayectoria` hacia el encabezado del timeline. La continuidad gráfica y, cuando el viewport lo permita, el inicio de la siguiente región refuerzan que existe contenido debajo sin depender de animación ni de un icono aislado.

La referencia de CV web no amplía el alcance de la composición visual de la experiencia interactiva. Cualquier rediseño de `/read/` conserva su contrato documental y se aborda de forma independiente.

### Timeline

El timeline combina `work`, `education` y `projects` en una secuencia cronológica. Un elemento de cualquiera de esas secciones debe tener `startDate` válida; los elementos sin `endDate` se consideran vigentes y aparecen primero. El orden es descendente por fecha de finalización o vigencia, después por `startDate` descendente y, ante empate, conserva el orden de origen.

El filtro inicial definitivo es `all`: muestra la trayectoria combinada. El valor `work` fue una propuesta provisional histórica y no forma parte del contrato. Los filtros disponibles corresponden a categorías con elementos; una categoría vacía no muestra control.

El cambio de filtro cierra cualquier detalle, limpia la selección, reinicia suavemente el carril en el hito más reciente del nuevo conjunto y anuncia el resultado mediante una región viva. No conserva una posición aproximada entre conjuntos distintos. La pausa activada mediante el control visible se conserva; las pausas transitorias por hover, foco, touch o selección se recalculan según la interacción vigente.

El estado inicial no selecciona ningún hito. El estado de filtro, selección, pausa y posición vive solo en memoria del cliente y no se persiste ni se refleja en URL.

### Detalle y responsive

El patrón es `single-open`: solo puede existir un detalle abierto.

En desktop, el timeline es un carril vertical continuo y el detalle aparece en un lector lateral estable. El lector tiene cabecera fija con categoría, título, entidad, periodo y cierre; su cuerpo desplazable contiene prosa y habilidades asociadas.

En mobile, al seleccionar un hito el carril se congela y es sustituido temporalmente por un panel de detalle. El cuerpo del panel es desplazable; no es un modal ni una expansión inline. Al cerrarlo, se restaura el carril en la posición congelada y se reanuda su movimiento según el estado anterior. El retorno programático de foco al hito activador no crea por sí mismo una nueva pausa que invalide esa restauración.

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

Desde la fase Base, `/read/` ofrece:

- `data-contract="read-print-action"` para imprimir mediante `window.print()`.

Desde la fase PDF añade:

- `data-contract="read-download-pdf"` para el enlace PDF estable con atributo `download`.

Sin JavaScript, la acción de imprimir se oculta. Antes de la fase PDF no se muestra un enlace de descarga roto; desde esa fase, la descarga permanece visible sin JavaScript. Las acciones se marcan como no imprimibles y no aparecen ni en impresión ni en PDF.

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

`/` y `/read/` son indexables y poseen `title`, `meta description` y canonical autorreferente no vacíos. Cada ruta tiene texto SEO propio; no se duplica la descripción. Los canonical son las URLs públicas completas bajo `/profile-site/`, no rutas internas ni URLs relativas al origin.

`PROFILE_SITE_BASE_URL` es obligatorio en builds contractuales y representa la URL pública completa de la aplicación, incluido su base path y el slash final. En la v1 su valor de producción es `https://fraguio.github.io/profile-site/`. Debe ser una URL HTTPS absoluta, sin query ni fragmento. El build deriva de ella el origin `https://fraguio.github.io` para `site` y `/profile-site` para `base`; la misma fuente alimenta enlaces internos, recursos, canonical, Open Graph, datos estructurados y smoke tests sin concatenaciones raíz ad hoc.

`/` incluye JSON-LD `Person` y `ProfilePage` derivado exclusivamente de datos públicos ya visibles. No expone teléfono, dirección completa ni campos ocultos.

Open Graph inicial exige `og:title`, `og:description`, `og:url`, `og:type` y `og:locale`; `og:url` usa la URL pública completa de cada superficie. La v1 no incluye `og:image`. Una imagen posterior será un recurso estable, versionado y sin información privada, no una captura generada en cada build.

## Arquitectura y toolchain

- Astro en la raíz, con salida estática y configuración compatible con el project site de GitHub Pages.
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

La integración cross-repo usa dos fine-grained PAT independientes. `profile-site` guarda `PROFILE_DATA_READ_TOKEN`, limitado a `fraguio/profile-data` con `Contents: read`; `profile-data` guarda `PROFILE_SITE_DISPATCH_TOKEN`, limitado a `fraguio/profile-site` con `Contents: write`. El `GITHUB_TOKEN` de `profile-site` no sustituye al primero porque su alcance no incluye otro repositorio privado. Los tokens tienen expiración finita, se rotan de forma operativa y sus valores no aparecen en archivos, payloads ni logs.

Provisionar ambos PAT y secrets, activar Pages y configurar la aprobación del deploy manual son prerrequisitos humanos para habilitar publicaciones; el build y las validaciones locales no dependen de ellos.

El receptor de `profile-site` debe estar publicado en la rama por defecto antes de habilitar el nuevo emisor. Debido a las instrucciones de `profile-data`, el propietario aplica allí el cambio como entrega humana: añade un workflow independiente que emite al cambiar `data/resume.json` en `main` y permite reenviar manualmente la revisión vigente de `main`. El envío manual desde otra ref falla. Ambos triggers envían los tres campos contractuales con el SHA exacto y fallan ante una respuesta HTTP no exitosa.

El emisor existente hacia `profile-engine` se conserva de forma independiente mientras se resuelve [`profile-engine#14`](https://github.com/fraguio/profile-engine/issues/14). Esta coexistencia no convierte `profile-engine` en intermediario: `profile-site` sigue consumiendo directamente la fuente curricular. Retirar el emisor histórico queda fuera de la autoridad de este proyecto.

Una carga ausente, inválida o inaccesible falla con diagnóstico explícito. Un build de publicación que no recibe SHA resuelve primero la referencia configurada a un SHA exacto y usa exclusivamente ese valor después.

En desarrollo local se usa un `RESUME_PATH` explícito. Los pull requests usan un fixture ficticio versionado, sin secretos ni datos personales.

Las actualizaciones automáticas usan `latest-wins`:

1. Cada ejecución valida y construye el SHA que recibió.
2. Antes de desplegar, comprueba si sigue siendo la revisión curricular vigente: el commit más reciente alcanzable desde `profile-data/main` que modificó `data/resume.json`.
3. Si hay una revisión posterior, queda marcada como publicación supersedida y no despliega.
4. Un despliegue que ya comenzó no se interrumpe de forma insegura; una ejecución posterior publica la revisión vigente.

## CI, despliegue y observabilidad

GitHub Pages es el destino inicial como project site en `https://fraguio.github.io/profile-site/`, publicado mediante GitHub Actions. Los fallos contractuales anteriores al deploy conservan la última versión publicada y el despliegue del nuevo artefacto es atómico.

| Evento | Datos | Despliegue | Regla de referencia |
| --- | --- | --- | --- |
| `pull_request` | Fixture ficticio | No | No requiere secretos |
| `push` a `main` | Revisión vigente de `profile-data/main` resuelta a SHA | Sí | Registra SHA efectivo |
| `repository_dispatch` | SHA recibido | Sí, si no fue supersedido | Usa el SHA recibido |
| `workflow_dispatch` | Ref y ruta introducidas por operador | Solo con `deploy=true` | Resuelve la ref a SHA antes de construir |

`workflow_dispatch` ofrece `profile_data_ref` con default `main`, `profile_data_path` con default `data/resume.json` y `deploy` booleano con default `false`. Puede validar cualquier rama, tag o commit accesible. Para desplegar manualmente requiere `deploy=true`, aprobación humana mediante un entorno protegido de GitHub y logs visibles con referencia solicitada y SHA efectivo. Esa aprobación adicional solo gobierna el deploy manual; un `push` a `main` o un `repository_dispatch` válido publica automáticamente tras superar sus gates.

Cada fase ejecuta pasos contractuales atómicos y diagnosticables para su alcance. La fase Base valida adquisición, schema, reglas locales, render HTML, rutas, SEO, CTAs y accesibilidad automatizable. La fase PDF añade generación, validación y output PDF. Cualquier fallo aplicable a la fase bloquea el despliegue.

Tras un deploy se ejecutan smoke tests sobre las URLs públicas completas derivadas de `PROFILE_SITE_BASE_URL` para las rutas internas `/` y `/read/`; desde la fase PDF también verifican el PDF. Un fallo marca la publicación como fallida y deja diagnóstico, pero puede dejar esa versión servida hasta el siguiente deploy porque el rollback automático queda fuera de alcance.

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

Antes de fijar umbrales, la medición técnica debe terminar correctamente y publicar resultados, pero las comparaciones todavía son informativas. Una vez disponibles datos, metadatos, filtros, detalle y movimiento, un PR posterior y dedicado captura la baseline de la experiencia completa. Se mide el `dist` contractual con el fixture y el perfil versionado que usarán los gates: mediana de tres ejecuciones para Lighthouse y una ejecución para métricas deterministas.

Ese PR registra los valores observados y propone cada budget, objetivo, límite absoluto y margen con una justificación explícita; no se aceptan cifras anteriores a la medición. También demuestra mediante canarios controlados contra el mismo evaluador que cada protección puede fallar: fallo técnico de medición, recurso o métrica determinista sobre presupuesto, objetivo Lighthouse incumplido y límite absoluto incumplido. Los canarios pueden usar fixtures de medición cuando corresponda y no degradan deliberadamente los artefactos de producción ni conservan umbrales imposibles.

Desde que aterrizan la baseline y sus umbrales, se aplica la matriz de bloqueo anterior en todos los eventos. Todos los resultados, warnings, fallos y evidencia de calibración se publican en `GITHUB_STEP_SUMMARY`. Cambiar budgets o perfil de medición exige PR justificada y actualización de checks; no se usan etiquetas de fase para gobernar esos cambios.

## Entregas incrementales y evidencia

| Fase | Entregable | Cierre con evidencia |
| --- | --- | --- |
| Base | Astro, datos, los dos HTML, validación, SEO, a11y base y CI | Build contractual verde con fixture y `dist/index.html` y `dist/read/index.html` generados |
| PDF | Tercer artefacto estable derivado del CV web | PDF publicado y checks de archivo, firma y páginas verdes |
| Interactividad | Timeline, filtros, lector, movimiento y degradación progresiva | Pruebas de estado, teclado, foco, motion y rendimiento verdes |
| Mejora | Ajustes posteriores basados en evidencia | Decisión y evidencia específicas |

Una entrega puede avanzar con el timeline estático si conserva el marcado final mejorable, pero la fase de interactividad no queda completada sin movimiento continuo conforme a este contrato.

El build contractual se amplía por fases. En Base produce exactamente los dos HTML y no falla por la ausencia del PDF ni presenta CTAs que apunten a él. Desde la fase PDF exige los tres artefactos y activa los CTAs, la descarga y el smoke test correspondientes.

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
| PERF-001 | Rendimiento con dos niveles | Baseline, canarios negativos, Lighthouse y budgets de build en summary |
| DEPLOY-001 | Publicación íntegra y smoke test | Workflow y comprobación pública |

## Decisiones aplazadas

- Posible migración futura desde el project site a un dominio propio.
- Imagen estable de Open Graph posterior a la v1.
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
