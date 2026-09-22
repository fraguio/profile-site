# Brief de exploración para el rediseño de la Experiencia interactiva

## Estado y propósito

- Estado: aprobado para exploración mediante prototipos; no existe todavía una dirección ganadora.
- Revisión del baseline: 3.
- Alcance: rediseño de la Experiencia interactiva en `/`.
- Propósito: proporcionar una fuente común y durable, destinada a quedar versionada, para las sesiones sucesivas que construirán y evaluarán las variantes del prototipo.
- Autoridad: este brief gobierna la exploración visual. No sustituye todavía la especificación maestra ni autoriza a llevar un prototipo a producción.

La [especificación maestra](../specifications/profile-site.md) continúa siendo la fuente normativa del producto desplegable hasta que una dirección sea elegida y sus decisiones se incorporen expresamente. Durante la exploración, los prototipos pueden cuestionar los contratos ligados a la referencia visual v1 y al timeline actual, según se delimita en este documento.

La declaración de estado de la especificación que afirma que todavía no existe una aplicación ha quedado obsoleta respecto al repositorio actual. Para la exploración, la implementación existente es el baseline técnico. Esta excepción descriptiva no invalida el resto de requisitos de producto y debe corregirse al consolidar el diseño ganador.

La [referencia visual de la v1](profile-site-v1-reference.png) no debe consultarse ni utilizarse como inspiración, punto de partida o criterio de comparación. La implementación existente tampoco es una referencia visual: puede reutilizarse como host del prototipo y como evidencia de comportamiento, datos y restricciones ya resueltas.

## Orden de lectura para cada sesión

1. Leer [`CONTEXT.md`](../../CONTEXT.md) para utilizar el vocabulario canónico del producto.
2. Leer este brief completo.
3. Consultar en la [especificación maestra](../specifications/profile-site.md) únicamente los contratos que este brief conserva o cita.
4. Inspeccionar la implementación y las pruebas existentes solo cuando aporten contexto necesario para la variante asignada.
5. Cargar la skill `prototype` antes de construir una variante.

No se debe utilizar `handoff` como fuente común entre sesiones. Esa skill queda reservada para transferir el contexto de una sesión interrumpida antes de que pueda representarlo en los artefactos compartidos. Escribe un artefacto temporal; este brief, su registro y el propio código del prototipo constituyen el estado compartido y duradero.

## Baseline compartido

Las sesiones solo son comparables si parten del mismo código, brief y contenido. Antes de construir la primera variante, la sesión del harness debe registrar en la sección `Registro de exploración`:

- Rama de prototipo.
- Ruta del `worktree` compartido.
- SHA de origen.
- Revisión del baseline declarada en este brief.
- Issue de implementación.
- Fuente de contenido fijada.
- Comando único de arranque.
- Comandos mínimos de verificación.
- Versión y comando de instalación de Impeccable.

La rama única prevista para el prototipo completo es `prototype/interactive-experience-redesign`, creada desde `main`. Si no existe, la sesión del harness debe pedir autorización al usuario para crearla y, si procede, asociarla a un `worktree` separado. Si ya existe pero la sesión está en `main` o en otro directorio, debe pedir autorización para reutilizarla y abrir o retomar su único `worktree`; no intenta crear la rama de nuevo ni asociarla simultáneamente a otro `worktree`.

Ningún agente crea commits sin una petición explícita. El titular autoriza checkpoints únicamente al completar las sesiones 1 a 5, siempre que cumplan sus criterios y checks, estén firmados con GPG y se creen en `prototype/interactive-experience-redesign`. El agente los crea con `git commit -S` y verifica la firma con `git log -1 --show-signature`; si la firma falla, no crea un fallback sin firma. Esta autorización no cubre `push`, merge, commits parciales ni commits sin firma. La captura final del prototipo completo en su rama sí es un requisito de la skill `prototype`, pero necesita una autorización explícita independiente; se realiza después de incorporar la decisión validada al producto. La sesión responsable de la captura debe solicitar esa autorización si todavía no consta.

Antes de repartir variantes también debe identificarse el issue de implementación que enlazará la rama, la pregunta de diseño, el veredicto y la fuente primaria capturada. Si todavía no existe, la sesión del harness debe pedir autorización al usuario antes de crearlo.

### Topología de trabajo

Esta exploración constituye un único UI prototype según la skill `prototype`. Las variantes A, B y C forman parte del mismo artefacto, comparten harness y se seleccionan mediante `?variant=`. Una variante no constituye por sí sola otro prototipo.

Las sesiones 1 a 5 trabajan consecutivamente sobre la misma rama del prototipo. Si se utiliza un `worktree` separado, existe uno solo para el prototipo completo y esas sesiones nuevas de OpenCode deben iniciarse desde su directorio. La sesión 6 sigue el flujo de producción definido por el issue sin alterar ni eliminar ese `worktree`; la sesión 7 vuelve a él para capturar el artefacto completo. No se crea una rama, un `worktree` ni una invocación independiente del ciclo de prototipado por variante. Las variantes tampoco se desarrollan en paralelo sobre copias divergentes del repositorio.

Las sesiones que operan sobre el artefacto compartido cargan la skill `prototype` para aplicar sus reglas. Cargarla no reinicia el ciclo de vida del prototipo ni exige generar variantes adicionales. La sesión del harness prepara el artefacto común; las sesiones posteriores continúan ese mismo artefacto para completar A, B y C.

La fuente común fijada para el prototipo es [`src/prototypes/interactive-experience/resume.fixture.json`](../../src/prototypes/interactive-experience/resume.fixture.json). La fixture fue validada por el titular del currículum y debe versionarse únicamente en la rama del prototipo cuando esta se cree.

La fixture deriva de `fraguio/profile-data@d16f238c59718eaf6d44381b7498a3be44f0bf7d` y preserva su contenido salvo la eliminación de `basics.phone`. Añade las asociaciones `work[].skills` y `education[].skills`, y dos hitos en `projects` para `profile-site` y `profile-engine`; sus campos `keywords` representan las habilidades asociadas. Su bloque `meta.prototypeFixture` registra la procedencia, los SHA de los repositorios y el carácter temporal de las adiciones.

Ninguna variante elige su propia revisión, reescribe textos ni introduce datos sintéticos distintos. La fixture no se incorpora automáticamente a producción y no debe versionarse en `main`.

Las secciones anteriores a `Registro de exploración` forman el baseline del brief. Su revisión es el número declarado en `Estado y propósito`; actualizar solo el registro no lo modifica. Una premisa común solo cambia con aprobación del usuario. El cambio incrementa la revisión, se anota en el registro y obliga a marcar para reevaluación todas las variantes construidas con la premisa anterior.

## Objetivo del producto

El sitio es un activo público de marca profesional. Su resultado principal es generar contactos y oportunidades profesionales. Exponer la trayectoria con profundidad es un resultado secundario.

La audiencia primaria está formada por profesionales de selección y responsables de contratación. Responsables de ingeniería y perfiles técnicos constituyen la audiencia secundaria.

La experiencia debe transmitir:

- Experiencia técnica senior.
- Capacidad para modernizar sistemas corporativos.
- Confiabilidad y continuidad.
- Claridad comunicativa.
- Adaptación tecnológica sostenida.
- Orientación a la calidad, mantenibilidad y rendimiento.

Estas cualidades deben demostrarse mediante hechos curriculares. El diseño no debe convertir responsabilidades ordinarias en logros extraordinarios ni suplir con marketing la ausencia de métricas.

## Superficies

### Experiencia interactiva

La Experiencia interactiva vive en `/`. No debe ser una copia animada del currículum. Su función es presentar un argumento profesional memorable, permitir explorar las evidencias que lo sostienen y conducir hacia el contacto o una lectura más exhaustiva.

Puede jerarquizar, condensar y relacionar el contenido de forma editorial. Todos los hechos que muestre deben proceder de la fuente curricular y las evidencias esenciales deben seguir siendo accesibles sin depender de una animación.

El área inicial conserva nombre, rol profesional, resumen íntegro y CTAs aplicables. Nombre, rol y CTAs principales deben poder identificarse antes del primer scroll intencional. El resumen no se trunca para forzar su entrada en un viewport. Su composición, orden interno, escala y relación con el resto de la experiencia permanecen abiertos.

### CV web

El CV web vive en `/read/`. Conserva su propósito documental, lineal y ATS-oriented. Presenta la relación curricular completa en un orden predecible y constituye la fuente para impresión y CV PDF.

Su rediseño visual no forma parte de esta exploración. La Experiencia interactiva puede enlazarlo y diferenciarse de él, pero ninguna variante debe modificar su contrato.

## Posicionamiento elegido

La idea rectora es:

> Senior Backend Developer especializado en modernizar sistemas corporativos.

El mensaje de respaldo es:

> Más de 20 años construyendo y evolucionando sistemas backend, desde las primeras aplicaciones web hasta arquitecturas corporativas, microservicios y cloud.

Después de unos treinta segundos, el visitante debería haber entendido:

- Que el perfil es senior y está especializado en backend.
- Que la experiencia supera los veinte años y está respaldada por periodos fechados.
- Que existe una continuidad clara en sistemas corporativos y entornos críticos.
- Que la trayectoria muestra evolución desde tecnologías y arquitecturas anteriores hacia prácticas y plataformas actuales.
- Que puede consultar el CV web o iniciar un contacto sin tener que comprender toda la interacción.

La antigüedad es una prueba de solidez, no el único mensaje. La especialización en modernización debe ocupar la posición principal.

## Evidencia curricular disponible

### Etapa inicial

Entre noviembre de 2000 y mayo de 2003 se trabajó como programador junior en aplicaciones web con Java, Struts e Hibernate para CIS Galicia, CEAGA y Mapfre Portugal.

Entre noviembre de 2003 y octubre de 2007 se desarrolló una actividad profesional como trabajador autónomo:

- Gestores de contenidos en PHP.
- Aplicaciones web con Java, Struts e Hibernate.
- Venta y mantenimiento de equipos informáticos.

La actividad autónoma se solapó realmente con el inicio en COMTEC entre mayo y octubre de 2007. Durante esa transición se continuó prestando servicio, en la medida de lo posible, a algunos clientes de la etapa autónoma. Las visualizaciones de duración deben admitir periodos simultáneos y no asumir que todas las experiencias son mutuamente excluyentes.

Estas dos experiencias todavía no están incorporadas con su estructura definitiva en la fuente curricular. Deben registrarse con una redacción compacta y verificable antes de la implementación final. La ausencia de recuerdos o datos adicionales se resuelve omitiendo esos detalles, no infiriéndolos.

### Continuidad en sistemas corporativos

La etapa en el entorno Abanca abarca desde marzo de 2008 hasta septiembre de 2022, con continuidad funcional y técnica a través de COMTEC Software Factory, BT España y Evolutio Cloud Enabler.

Las evidencias principales son:

- Participación en el análisis, diseño y desarrollo de un framework web corporativo propio.
- Alta autonomía en decisiones técnicas y responsabilidad individual sobre el framework durante varios años.
- Participación en el core bancario dentro de un entorno corporativo de gran escala.
- Trabajo con arquitectura SOA y tecnologías Java.
- Integraciones con APIs externas.
- Logging estructurado y explotación con Elasticsearch y Kibana.
- Soporte técnico a equipos consumidores del core y del framework.
- Participación en seguridad y corrección de vulnerabilidades.

La duración y responsabilidad de esta etapa justifican un peso visual muy superior al de una formación breve o una intervención de pocos meses.

### Modernización e integraciones cloud

Entre octubre de 2022 y mayo de 2024 aparecen tres registros solapados bajo Evolutio Cloud Enabler. Representan contextos y proyectos relacionados, no una sucesión de tres empleos independientes:

- Proyecto Nébula para Mapfre, orientado a microservicios, middleware e integración con Genesys Cloud.
- Integraciones de WhatsApp y Genesys Cloud para Mapfre mediante AWS Lambda y Node.js.
- Proyecto Enel para migración de soluciones de contact center e integración mediante Spring Boot.

Las evidencias principales son:

- Diseño y desarrollo de microservicios backend con Spring Boot.
- Construcción y evolución de componentes corporativos reutilizables.
- Capas de abstracción para desacoplar aplicaciones internas de plataformas externas.
- Integración con servicios de AWS.
- Autenticación, auditoría, caché distribuida y observabilidad.
- Funciones serverless con Node.js.
- Procesos batch y generación documental para requisitos legales.

Las variantes pueden agrupar visualmente estos registros bajo un contexto común, siempre que conserven sus periodos y responsabilidades y no oculten que se solapan.

### Aprendizaje reciente

La formación entre 2021 y 2026 muestra actualización profesional en cloud, Python, full stack e inteligencia artificial. Debe presentarse como aprendizaje continuo, no como experiencia laboral ni como sustituto de experiencia práctica no documentada.

Las formaciones breves no deben adquirir automáticamente el mismo peso que una etapa profesional prolongada. La formación reglada o de mayor alcance puede recibir una jerarquía diferente cuando los datos permitan distinguirla.

### Límites de la evidencia

- El currículum es deliberadamente normal y no contiene una colección de logros espectaculares.
- La mayoría de los `highlights` describen responsabilidades, sistemas y contribuciones, no resultados cuantificados.
- No debe construirse un portfolio de impacto basado en métricas inexistentes.
- La fuente curricular canónica no contiene todavía una sección `projects` con contenido; la fixture validada añade temporalmente `profile-site` y `profile-engine` para la exploración.
- No existe material suficiente para presentar cada experiencia como un case study completo con problema, alternativas, decisiones y resultados.
- La etapa inicial dispone de información limitada y debe mantenerse concisa.

La fuerza de la narrativa procede de la continuidad, la responsabilidad y la evolución técnica. La calidad visual debe elevar esos hechos sin exagerarlos.

## Contrato de contenido

La exploración mantiene el alcance visible inicial de la especificación:

- Se consideran `basics`, `work`, `education` y `projects`.
- Las demás secciones de JSON Resume pueden existir, pero no forman parte de la presentación inicial.
- `meta` no es contenido visual.
- Las secciones, campos y listas vacías se omiten.
- La sección superior `skills` no se muestra ni actúa como catálogo global.

Las habilidades se vinculan a evidencias concretas:

- `work[].skills` representa habilidades asociadas a una experiencia profesional.
- `education[].skills` representa habilidades asociadas a una formación.
- `projects[].keywords` representa habilidades asociadas a un proyecto.
- Una habilidad puede aparecer en varios elementos.
- Solo se eliminan duplicados exactos dentro de un mismo elemento.
- No existe normalización de grafía, mayúsculas o minúsculas.
- No existe validación cruzada con la sección superior `skills`.

Las variantes pueden utilizar estas habilidades dentro del detalle de su elemento. No deben agregarlas para construir una taxonomía global, un ranking de conocimientos o una navegación principal por capacidades. Esa estructura exigiría curación y normalización que el contrato no proporciona.

Todos los hechos públicos de producción proceden de la fuente curricular. El código de presentación puede calcular duraciones, ordenar, agrupar visualmente registros compatibles y localizar etiquetas, pero no debe mantener una segunda copia manual de los hechos. La fixture temporal de prototipo es la única excepción y se elimina de la rama principal al consolidar.

La adquisición compartida debe exponer un modelo neutral que conserve `basics`, `work`, `education` y `projects` sin imponer orden cronológico, filtros, agrupaciones ni el concepto `TimelineMilestone`. El export actual `timeline` no es el contrato común de los prototipos. Cada variante deriva del modelo neutral la estructura necesaria para responder a su pregunta de diseño.

## Jerarquía narrativa

Todas las variantes deben trabajar con la misma jerarquía para que la comparación evalúe diseño y no relatos distintos:

1. Posicionamiento: modernización de sistemas corporativos desde backend.
2. Credibilidad: más de veinte años de experiencia documentable.
3. Evidencia principal: continuidad y responsabilidad en el entorno Abanca.
4. Evolución reciente: microservicios, cloud, serverless e integraciones.
5. Origen: aplicaciones web, actividad autónoma y primeras tecnologías Java/PHP.
6. Actualización: formación reciente y ampliación del campo técnico.
7. Conversión: contacto, CV web y CV PDF.

La presentación puede empezar por el presente y revelar el origen después. No está obligada a seguir un orden cronológico, pero las fechas deben permanecer accesibles y comprensibles.

## Ambición visual

La Experiencia interactiva debe ser llamativa, atractiva, moderna, dinámica y capaz de sorprender. Al mismo tiempo, presenta un currículum y debe resultar seria, elegante y confiable.

La sorpresa debe proceder de:

- Una composición reconocible y específica para este perfil.
- Jerarquía tipográfica fuerte.
- Ritmo editorial.
- Uso deliberado del espacio.
- Relaciones visibles entre afirmaciones y evidencias.
- Transiciones que mantengan contexto.
- Diferencias de escala que expresen relevancia.
- Detalles de interacción precisos.

La sorpresa no debe proceder de exagerar el contenido, ocultar información básica ni obligar al visitante a descifrar la interfaz.

No existe una preferencia cerrada por tema claro u oscuro. La exploración debe permitir comparar lenguajes visuales distintos:

- La variante A puede explorar una dirección clara y editorial.
- La variante B puede explorar una dirección oscura y atmosférica.
- La variante C puede explorar una dirección documental o híbrida.

Estas orientaciones no son paletas obligatorias. Cada variante debe justificar su tratamiento mediante la pregunta de diseño que intenta responder.

## Desktop y mobile

Cada variante debe diseñar desktop y mobile como composiciones relacionadas pero propias. Mobile no es una reducción mecánica de desktop.

### Desktop

- Debe aprovechar el espacio para construir una jerarquía expresiva sin dispersar la atención.
- Debe permitir entender el posicionamiento y acceder a los CTAs antes de exigir una exploración profunda.
- Puede utilizar regiones persistentes, composiciones asimétricas, capas o lectores, siempre que el foco y el orden de lectura sigan siendo coherentes.
- No debe exigir precisión de puntero para acceder al contenido.

### Mobile

- El desplazamiento principal es vertical, libre y compatible con el comportamiento normal del navegador.
- El contenido no se divide en pantallas horizontales obligatorias.
- No se utiliza `scroll-snap` para imponer el ritmo de lectura.
- No se fuerzan alturas rígidas que puedan truncar resumen o detalles.
- La interacción touch no compite con el scroll.
- La composición debe mantener visible la existencia de contenido posterior sin depender de un icono o una animación.

El principio del [ADR de scroll vertical en mobile](../adr/0005-usar-scroll-vertical-en-mobile.md) se conserva aunque deje de existir un timeline. Su redacción deberá actualizarse si el diseño ganador sustituye ese término.

## Movimiento y efectos

El movimiento es parte de la ambición de la Experiencia interactiva, pero debe estar subordinado a comprensión, contexto y lectura.

Usos apropiados:

- Revelar la relación entre una afirmación y su evidencia.
- Transformar una síntesis en un detalle sin perder el contexto.
- Expresar acumulación, continuidad o cambio de etapa.
- Reorganizar elementos tras una selección explícita.
- Acompañar cambios de escala o jerarquía.
- Añadir respuesta ambiental sutil al puntero cuando no afecte al acceso.

Usos inapropiados:

- Retrasar la aparición del texto necesario para comprender la página.
- Secuestrar el scroll o sustituirlo por una navegación opaca.
- Mantener contenido esencial en movimiento continuo.
- Requerir un cursor personalizado.
- Introducir movimiento ornamental permanente que compita con la lectura.
- Utilizar contadores animados para métricas que no existen.
- Convertir `prefers-reduced-motion` en una experiencia incompleta.

Con `prefers-reduced-motion`, la jerarquía, las relaciones y el contenido deben seguir siendo comprensibles. La reducción puede sustituir desplazamientos por cambios inmediatos, fundidos breves o ausencia total de animación.

Sin JavaScript, los CTAs y el contenido profesional esencial deben seguir disponibles. La mejora progresiva continúa siendo una restricción de producto, aunque los prototipos no necesiten alcanzar todavía el nivel de robustez de producción.

La selección mediante `?variant=` requiere JavaScript porque el output de Astro es estático y el servidor no interpreta la query. El harness debe renderizar un único fallback semántico compartido cuando JavaScript no está disponible; no muestra las tres variantes duplicadas. Durante la exploración, la comprobación sin JavaScript se realiza una vez sobre ese fallback común. La variante ganadora deberá demostrar su propia degradación progresiva durante la consolidación.

## Accesibilidad, rendimiento y resiliencia

Los prototipos deben permitir evaluar la viabilidad de los requisitos finales, no posponer los problemas evidentes hasta la implementación.

Se conservan como objetivos:

- WCAG 2.2 nivel AA.
- Operación completa mediante teclado.
- Foco visible y orden coherente.
- Semántica y etiquetas accesibles.
- Contraste suficiente.
- Estados que no dependan solo del color.
- Lectura con zoom.
- Respeto a `prefers-reduced-motion`.
- Degradación progresiva.
- Rendimiento compatible con los budgets del proyecto.

Un prototipo no necesita implementar toda la automatización ni los tests de producción. Sí debe evitar una dirección cuya propuesta dependa intrínsecamente de un canvas inaccesible, un bundle desproporcionado, contenido duplicado o una versión mobile completamente distinta en semántica.

La solución final continúa limitada a Astro, TypeScript de navegador, CSS y GSAP core en `/`, salvo que una necesidad se demuestre y documente después de la exploración. Los prototipos no deben introducir un framework de UI ni una dependencia pesada para simular un efecto que pueda evaluarse con la pila existente.

## Antiobjetivos visuales

Las siguientes direcciones no encajan con el producto salvo que un prototipo aporte una justificación y evidencia excepcionales:

- Dashboard SaaS genérico.
- Cuadrícula `bento` de tarjetas equivalentes.
- Tarjetas anidadas como estructura dominante.
- Terminal, lluvia de código, neón cyberpunk o estética de hacker.
- Diagramas de arquitectura que parezcan describir sistemas reales cuando solo son decoración.
- Portfolio de impacto con métricas inventadas.
- Catálogo global de habilidades.
- Constelación de tecnologías construida a partir de etiquetas sin normalizar.
- Gamificación de la carrera profesional.
- Fotografía como centro del diseño; la primera versión no publica fotografía.
- Controles inertes o elementos que aparenten funciones inexistentes.
- Copiar la paleta oscura, el acento dorado, la composición o la jerarquía de la referencia v1.
- Disfrazar el mismo timeline con otra forma gráfica sin cuestionar su modelo de exploración.

También debe evitarse que todos los elementos reciban el mismo peso. Una experiencia de casi quince años y una formación breve no son unidades equivalentes.

## Herramientas y método de diseño

La herramienta principal de exploración es el propio código ejecutado en navegador. Este producto depende de contenido variable, responsive, movimiento, foco, reducción de movimiento y degradación progresiva; un mockup estático no permite evaluar esas condiciones con suficiente fidelidad.

### Código y navegador

- Astro, CSS y TypeScript constituyen el medio principal para construir las variantes.
- El prototipo utiliza la fixture validada y fijada en el baseline.
- La evaluación se realiza en desktop y mobile desde el comienzo.
- Las DevTools del navegador se utilizan para revisar responsive, movimiento reducido, foco y ausencia de JavaScript.
- GSAP core puede utilizarse cuando una pregunta de movimiento lo requiera; CSS sigue siendo suficiente para transiciones sencillas.

### Impeccable

Impeccable forma parte del método de esta exploración, pero no constituye un segundo ciclo de prototipado. La skill `prototype` gobierna el ciclo de vida del artefacto, la topología de Git, la divergencia entre A, B y C y su captura. Este brief gobierna producto, contenido, restricciones y la dirección asignada a cada variante. Impeccable aporta vocabulario y operaciones de diseño dentro de esos límites. Ante un conflicto, prevalecen `prototype` y este brief; un output de Impeccable nunca cambia por sí solo una premisa común ni decide la dirección ganadora.

#### Preparación en la sesión del harness

La sesión 1 instala para OpenCode una versión exacta de Impeccable con alcance de proyecto y registra tanto la versión como el comando reproducible. No se utiliza una instalación global ni una referencia móvil como `latest`; la invocación de instalación incluye `--no-hooks`. Después de recargar OpenCode, ejecuta `/impeccable init` una sola vez y revisa su output antes de continuar.

`PRODUCT.md` actúa como adaptador de contexto para Impeccable dentro de la rama del prototipo. Resume audiencia, propósito, plataforma y restricciones a partir de `CONTEXT.md`, este brief y los contratos conservados de la especificación maestra; no introduce decisiones nuevas ni sustituye esas fuentes. Las incertidumbres permanecen explícitas. Si existe una contradicción, se corrige `PRODUCT.md`, no el baseline sin aprobación. La preferencia compartida de construcción se fija como `code-led`, porque el código ejecutado en navegador es el medio principal de la exploración.

La sesión 1 no ejecuta `/impeccable document` ni crea `DESIGN.md`: la dirección visual existente está abierta a reemplazo y la v1 no puede convertirse en sistema de referencia. Tampoco crea un brief de superficie para `/`; A, B y C comparten esa ruta y se distinguen mediante query string, por lo que un único registro de superficie confundiría sus decisiones. La fuente de las tres direcciones sigue siendo este brief.

Los hooks automáticos no forman parte del baseline. La documentación de Impeccable no describe actualmente un harness de hooks para OpenCode, aunque sí soporta OpenCode como coding tool. La sesión comprueba la instalación con `/impeccable doctor` y registra comandos manuales del detector para código, desktop y mobile. Un hallazgo del detector es evidencia para revisar, no un fallo automático: las elecciones intencionales se justifican y no se silencian mediante excepciones amplias.

El harness reserva `src/prototypes/interactive-experience/evidence/` para la evidencia reproducible de Impeccable. Cada archivo identifica sesión, variante, comando o prompt exacto, URL, viewport, fecha, rutas de los informes generados y resultado. Los outputs JSON del detector se conservan junto a esos manifiestos con nombres que distinguen variante y target. Este directorio documenta observaciones y decisiones del experimento; no constituye una especificación de producto ni un sistema visual.

Si la instalación, `init`, `doctor` o el detector no pueden verificarse, la sesión 1 queda `Bloqueada` y consulta al usuario. No se omite Impeccable silenciosamente ni se sustituye por una instalación distinta en cada sesión.

#### Construcción y refinamiento de A, B y C

Cada sesión de variante parte de la pregunta y la dirección ya asignadas en este brief. El agente construye una primera versión coherente cargando Impeccable como conocimiento de diseño, pero no invoca el flujo abierto `/impeccable design`: ese flujo volvería a proponer y seleccionar direcciones dentro de una variante ya elegida. Tampoco utiliza `shape`, porque este brief ya cumple esa función.

Cuando la primera versión puede recorrerse en desktop y mobile, la sesión ejecuta `/impeccable critique` sobre esa variante concreta. El encargo identifica siempre la query `?variant=`, la tarea principal del visitante, el estado inacabado del prototipo y los elementos que deben preservarse. `critique` es de solo lectura; su informe se conserva bajo `.impeccable/critique/` y su ruta y síntesis se incorporan al manifiesto de evidencia y a la fila de la sesión.

Después de leer el informe, cada variante dispone del mismo presupuesto: una única pasada dirigida con, como máximo, uno de estos comandos, elegido por el problema prioritario que deba resolver:

- `layout`, `typeset`, `colorize` o `animate` para estructura, tipografía, color o movimiento.
- `bolder` o `quieter` para corregir presencia o ruido sin cambiar la dirección.
- `distill` o `clarify` para reducir competencia o aclarar el recorrido.
- `adapt` para resolver una composición mobile propia.
- `delight` u `overdrive` únicamente cuando el gesto distintivo ya forme parte de la dirección asignada y no añada hechos, controles ni espectáculo sin función.

La sesión puede no aplicar ningún refinamiento si la crítica no identifica un cambio compatible con el brief, pero debe registrar el motivo. No encadena comandos hasta obtener una puntuación deseada ni usa sus scores como aceptación automática. Tras la pasada, ejecuta el detector contra los archivos exclusivos de la variante y contra su URL renderizada en desktop y mobile; revisa el diff y confirma que las otras variantes y el fallback común siguen intactos.

Durante las sesiones 2 a 4 quedan excluidos `generate` y `live`, porque crean alternativas internas o permiten dirigir la página completa; `polish`, `harden`, `optimize` y `onboard`, porque endurecen código todavía desechable; y `document` y `extract`, porque consolidarían prematuramente una identidad o abstracciones compartidas. Las variantes temporales de Impeccable no sustituyen A, B y C ni se añaden al selector común.

#### Evaluación conjunta

La sesión 5 vuelve a ejecutar `critique` y `audit` sobre A, B y C con el mismo texto base, la misma tarea principal, el mismo contenido y los viewports `1280x800` y `390x844`. El único dato variable del encargo es la query `?variant=A|B|C`. El texto base exige evaluar si un recruiter puede identificar en treinta segundos la especialización en modernización backend, localizar la evidencia que la respalda y acceder a contacto o al CV web sin perder claridad en desktop o mobile. Ambos comandos dejan el código sin cambios. Primero se guardan los seis informes completos y los resultados JSON del detector bajo `src/prototypes/interactive-experience/evidence/`; después se comparan con la matriz de `Evaluación común`. No se corrige una variante mientras se evalúan las demás.

Los informes de Impeccable aportan observaciones sobre jerarquía, carácter, usabilidad, accesibilidad, responsive, rendimiento e integridad de implementación. No sustituyen la revisión humana ni los criterios del brief. Una regla heurística de `AI slop` señala una decisión que debe justificarse; no invalida por sí sola una elección deliberada. El veredicto identifica qué hallazgos se aceptan, cuáles se descartan y por qué.

#### Después del veredicto

`generate` y `live` permanecen excluidos hasta el cierre de la sesión 7. El veredicto termina la exploración de direcciones: no abre otro ciclo de alternativas, ni siquiera dentro de la ganadora. Cualquier exploración posterior de un elemento concreto requiere una nueva decisión explícita del usuario y un alcance propio en el issue de producción; no forma parte de este brief.

La implementación de producción puede utilizar `polish`, `harden`, `optimize`, `adapt` y otros refinamientos focalizados cuando lo exijan la especificación consolidada y el issue. `extract` se reserva para patrones que la implementación final demuestre como repetidos. `/impeccable document` y `DESIGN.md` quedan fuera de este ciclo: la documentación visual definitiva se incorpora a las fuentes normativas enumeradas en `Consolidación posterior`. Adoptar en el futuro el formato `DESIGN.md` requiere una decisión expresa que defina su autoridad y evite duplicar esas fuentes.

### Figma

Figma es opcional. Puede utilizarse para manipular manualmente composición, tipografía, referencias o motion studies y para recoger comentarios visuales. No debe convertirse en una especificación paralela ni ser necesario para ejecutar o entender el prototipo.

### Stitch

Stitch puede utilizarse para divergencia inicial o moodboards. Su output se trata como material desechable para descubrir ideas, no como implementación, sistema de diseño ni fuente factual.

### Verificación

Durante la exploración se prioriza la revisión directa en navegador. Playwright, Axe y los checks contractuales existentes se incorporan al consolidar la dirección elegida. Axe aporta evidencia automatizada, pero no certifica por sí solo la conformidad WCAG.

El orden de trabajo es:

1. Brief compartido.
2. Harness común.
3. Tres variantes estructuralmente independientes dentro del mismo prototipo.
4. Evaluación comparativa.
5. Especificación de la dirección ganadora.
6. Implementación y verificación de producción.

No se construye un design system completo ni una especificación visual exhaustiva antes de aprender de los prototipos.

## Contratos abiertos a exploración

Los prototipos pueden sustituir o reformular:

- El timeline como metáfora y estructura principal.
- La secuencia cronológica unificada de trabajo, formación y proyectos.
- Los filtros por categoría.
- El carril con movimiento vertical continuo.
- El patrón de selección `single-open` actual.
- El lector lateral de desktop.
- El panel sustitutivo de mobile.
- La composición de identidad a la izquierda y trayectoria a la derecha.
- La dirección oscura, editorial, serif/sans y dorada de la v1.
- El uso de GSAP para un loop automático.

Abrir estos contratos no obliga a descartarlos. Una variante puede conservar una parte si demuestra que sirve a su concepto y no la hereda por inercia.

## Contratos conservados

Todas las variantes deben mantener:

- La separación entre Experiencia interactiva y CV web.
- Las rutas y CTAs hacia CV web, CV PDF y contacto aplicables a la fase actual.
- El contenido derivado de la fuente curricular.
- La omisión de campos y secciones vacíos.
- La ausencia de fotografía.
- El alcance visible de secciones.
- Las reglas de habilidades asociadas.
- La prioridad de claridad sobre adorno.
- La presentación de hechos antes que marketing.
- Desktop y mobile.
- Scroll vertical normal como eje principal en mobile.
- Accesibilidad, rendimiento y degradación progresiva como requisitos del producto.
- Respeto a `prefers-reduced-motion`.
- Una ruta clara hacia contacto y lectura documental.
- Fechas accesibles aunque la cronología no organice la composición.
- Nombre, rol, resumen íntegro y CTAs aplicables dentro del área inicial.
- Nombre, rol y CTAs principales identificables antes del primer scroll intencional.

## Variante A: capítulos editoriales

### Pregunta

¿Puede una narrativa editorial comunicar modernización, seniority y continuidad con más claridad y personalidad que un navegador cronológico?

### Estructura

- Portada tipográfica con posicionamiento, resumen y CTAs.
- Presentación temprana de la señal de más de veinte años.
- Capítulo principal sobre continuidad y responsabilidad en sistemas corporativos.
- Capítulo principal sobre modernización, microservicios, cloud e integraciones.
- Prólogo compacto para la etapa 2000-2008.
- Epílogo o sección secundaria de aprendizaje continuo.
- Cierre orientado al contacto y al CV web.

Las experiencias no se presentan como tarjetas iguales. Cada capítulo adopta la escala y densidad que corresponde a su relevancia.

### Desktop

Puede combinar texto de lectura con un escenario visual persistente que cambie de composición al entrar en cada capítulo. La navegación principal sigue siendo el scroll del documento.

### Mobile

Los capítulos se convierten en regiones consecutivas. Las síntesis aparecen antes que los detalles y la lectura no depende de elementos sticky de gran tamaño.

### Movimiento

- Transiciones tipográficas.
- Cambios de escala entre síntesis y evidencia.
- Reconfiguración del escenario al cambiar de capítulo.
- Revelado progresivo de metadatos y habilidades asociadas.

### Riesgo

Puede convertirse en una publicación visual atractiva pero demasiado pasiva. Debe conservar exploración suficiente para justificar la Experiencia interactiva.

### Señal de éxito

El visitante comprende el posicionamiento y recuerda la evolución profesional sin necesitar una línea temporal ni una explicación adicional.

## Variante B: sistema en evolución

### Pregunta

¿Puede una representación abstracta de capas, conexiones y transformación hacer memorable el perfil sin fingir que muestra una arquitectura real?

### Estructura

- Hero integrado con un sistema visual abstracto.
- Estados vinculados a contextos profesionales, no a años aislados.
- Evidencias textuales que modifican o completan la representación.
- Agrupación de proyectos solapados dentro del contexto Evolutio.
- Etapa inicial y aprendizaje reciente como capas de origen y expansión.
- Acceso constante a contacto y CV web.

La representación es una metáfora de acumulación y modernización. No debe etiquetar componentes como si documentara sistemas reales ni convertir tecnologías en planetas o nodos arbitrarios.

### Desktop

Puede utilizar un escenario amplio con contenido textual y representación reactiva. El visitante debe poder leer y navegar sin manipular directamente todos los elementos gráficos.

### Mobile

La representación se simplifica y acompaña a una secuencia vertical. No se intenta comprimir el escenario desktop ni se obliga a explorar un grafo mediante touch.

### Movimiento

- Incorporación y separación de capas.
- Conexiones que aparecen al activar una evidencia.
- Transformaciones de composición entre contextos.
- Respuesta ambiental contenida al puntero.

### Riesgo

Puede parecer experimental, excesivamente técnica o decorativa. La metáfora debe reforzar modernización y no competir con los hechos.

### Señal de éxito

La experiencia sorprende, pero un perfil no técnico sigue entendiendo quién es el candidato, qué ofrece y dónde consultar el detalle.

## Variante C: dossier de modernización

### Pregunta

¿Puede una interfaz de consulta precisa y documental resultar distintiva sin convertirse en otro CV web?

### Estructura

- Portada breve y orientada al posicionamiento.
- Índice de contextos profesionales o ámbitos de responsabilidad.
- Área de lectura que presenta síntesis, periodo, entidad, responsabilidades y habilidades asociadas.
- Agrupación explícita de las intervenciones solapadas bajo Evolutio.
- Sección compacta para origen y formación.
- Acciones de contacto y acceso documental siempre fáciles de localizar.

El índice no debe ser un filtro global de habilidades ni una secuencia cronológica disfrazada. Organiza contextos profesionales con nombres comprensibles y respaldados por el contenido.

### Desktop

Puede utilizar un índice estable y un lector amplio, con una composición más precisa y técnica que la variante editorial. El estado inicial no debe mostrar un panel vacío sin propósito.

### Mobile

El índice se convierte en tabla de contenidos o selector compacto. Los detalles aparecen dentro del flujo vertical y la dirección debe poder consolidarse posteriormente sobre el fallback semántico compartido.

### Movimiento

- Transiciones de página o sección.
- Reorganización de cabeceras y metadatos.
- Subrayados, reglas y anotaciones que reaccionan a la navegación.
- Transiciones compartidas entre índice y detalle.

### Riesgo

Puede ser clara y confiable pero insuficientemente memorable, o aproximarse demasiado al CV web.

### Señal de éxito

Permite escanear y profundizar con rapidez, mantiene una personalidad reconocible y ofrece una razón clara para existir junto al CV web.

## Harness común de prototipos

Las variantes se construyen sobre la ruta existente `/`, en la rama de prototipo, y se seleccionan mediante un parámetro compartible:

- `?variant=A`: capítulos editoriales.
- `?variant=B`: sistema en evolución.
- `?variant=C`: dossier de modernización.

El selector del prototipo debe:

- Aparecer como una barra flotante claramente ajena a las propuestas evaluadas.
- Mostrar la variante activa y su nombre.
- Permitir avanzar y retroceder con controles visibles.
- Admitir las teclas de flecha cuando el foco no está en un campo editable.
- Actualizar el parámetro de la URL.
- Quedar excluido de builds de producción.

La carga, validación y modelo neutral de datos se mantienen compartidos. Cada variante controla su propia estructura, orden, agrupación y composición. No se crea un layout compartido que obligue a las tres a parecerse.

Las tres variantes utilizan la fixture fijada en el baseline para que la comparación evalúe diseño y no diferencias de contenido. La fixture no se convierte en una segunda fuente de contenido de producción.

El harness debe iniciarse con un único comando documentado y debe permitir cambiar de variante sin editar código.

Las variantes A, B y C, consideradas en conjunto, satisfacen el requisito de variantes múltiples de la skill `prototype`. Cada sesión construye solo la variante asignada y no genera tres subvariantes dentro de ella. Esta partición temporal reemplaza únicamente el paso de generación simultánea de esa skill; no crea tres prototipos y mantiene sus reglas de divergencia estructural, selector compartido, código desechable y captura posterior.

El harness también debe definir una verificación mínima específica para prototipos:

- `pnpm check` o su reemplazo documentado debe finalizar correctamente.
- El comando de build del prototipo debe finalizar correctamente con la fuente común fijada.
- Un smoke test manual debe abrir A, B y C en desktop y mobile.
- El fallback común debe abrir con JavaScript desactivado.

La suite contractual existente describe el timeline de producción y no constituye la aceptación de las variantes. No se modifica ni se debilita para hacer pasar el prototipo; su adaptación corresponde a la consolidación del diseño ganador.

## Flujo entre sesiones

Una sesión nueva de OpenCode no hereda la conversación de la anterior. La continuidad se establece, por este orden, mediante:

1. Este brief y su `Registro de exploración`.
2. El código presente en el `worktree` compartido y su estado observable mediante Git.
3. El issue de implementación para conectar la consolidación de producción con el cierre posterior del prototipo.
4. Los commits de checkpoint, únicamente cuando el usuario los haya autorizado.
5. Un documento temporal de `handoff`, solo si una sesión queda interrumpida antes de representar su contexto necesario en los artefactos anteriores.

Las sesiones se ejecutan en el orden descrito a continuación. La sesión 1 constituye el bootstrap: inspecciona el estado inicial y, con las autorizaciones necesarias, establece y registra la rama y el `worktree` compartidos. Antes de construir el harness debe comprobar que ya opera desde ambos. Si la creación de un `worktree` deja la sesión actual en otro directorio, traslada al nuevo directorio todos los artefactos del baseline que aún no estén versionados y comprueba físicamente que contiene `AGENTS.md`, este brief y la fixture antes de detenerse. Solo entonces pide al usuario que inicie una nueva sesión desde la ruta registrada para reanudar la sesión 1.

Antes de editar, las sesiones 2 a 7 deben comprobar que se encuentran en la rama y el `worktree` que les correspondan e inspeccionar `git status` y `git diff`. Las sesiones 2 a 5 confirman en el registro que la precedente figura como `Completada`. La sesión 6 sigue el flujo de consolidación e implementación que establezca el issue. La sesión 7 confirma en ese issue que la consolidación y la implementación de producción están completadas antes de volver al `worktree` del prototipo. Si el estado físico no coincide con la fuente de coordinación correspondiente o falta un prerrequisito, deben detenerse y consultar al usuario en lugar de crear otra rama, otro `worktree` u otro prototipo.

Al finalizar, las sesiones 1 a 5 actualizan su fila del registro con el resultado, los cambios relevantes, los checks ejecutados, los bloqueos y el siguiente paso habilitado. La sesión 6 registra esa misma información en el issue de implementación para no crear una copia divergente del registro en otra rama. La sesión 7 verifica esa evidencia, sincroniza la fila 6 en el registro del prototipo y actualiza su propia fila antes de crear el commit final autorizado. El código, el estado de Git y esos checkpoints constituyen el traspaso ordinario a la sesión siguiente.

### Sesión 1: preparar el harness

Objetivo: fijar el baseline, establecer la selección por `?variant=`, el selector visual, el modelo neutral de datos, el fallback semántico y espacios independientes para A, B y C; instalar y configurar la versión compartida de Impeccable.

Criterio de finalización: el registro identifica rama, `worktree`, SHA, revisión del brief, issue, fuente, comandos y versión de Impeccable; `PRODUCT.md` refleja sin contradicciones el contexto aprobado, el flujo `code-led`, `doctor` y el detector quedan verificados; existe la convención de evidencia; las tres URLs cargan, identifican su variante y pueden desarrollarse por separado sin duplicar la adquisición de datos.

### Sesión 2: construir la variante A

Objetivo: responder únicamente a la pregunta de los capítulos editoriales.

Criterio de finalización: la variante puede evaluarse en desktop y mobile con el contenido representativo completo, su estructura difiere sustancialmente de un timeline y responde exclusivamente a los compromisos estructurales de A, y constan su crítica, su única pasada de refinamiento o la renuncia justificada y los resultados del detector.

### Sesión 3: construir la variante B

Objetivo: responder únicamente a la pregunta del sistema en evolución.

Criterio de finalización: la metáfora visual reacciona a evidencias reales, sigue siendo comprensible sin efectos, dispone de una adaptación mobile propia y constan su crítica, su única pasada de refinamiento o la renuncia justificada y los resultados del detector.

### Sesión 4: construir la variante C

Objetivo: responder únicamente a la pregunta del dossier de modernización.

Criterio de finalización: la interfaz permite escanear y profundizar, se diferencia claramente del CV web, funciona en desktop y mobile y constan su crítica, su única pasada de refinamiento o la renuncia justificada y los resultados del detector.

### Sesión 5: evaluar

Objetivo: comparar las variantes bajo los mismos recorridos y criterios, sin corregir una mientras se evalúa otra.

Criterio de finalización: existen informes comparables de `critique`, `audit` y detector para las tres variantes, y un veredicto que identifica una variante ganadora o una combinación concreta de elementos, junto con las razones, hallazgos descartados y riesgos aceptados.

### Sesión 6: consolidar

Objetivo: traducir el veredicto a una especificación implementable.

Criterio de finalización: la especificación maestra, los ADR, el vocabulario de dominio y los contratos de prueba reflejan la dirección elegida; el código desechable de las variantes perdedoras no permanece en la rama principal; y el issue registra el resultado, los checks y la finalización de la implementación de producción.

La implementación de producción se realiza a partir de esa especificación y se controla desde el issue de implementación. No se copia directamente el código desechable del prototipo.

### Sesión 7: capturar y cerrar el prototipo

Prerrequisito: el issue de implementación confirma que la decisión validada ya se ha incorporado al producto.

Objetivo: volver al `worktree` y la rama del prototipo, preservar el conjunto completo de variantes como fuente primaria y cerrar la exploración.

Criterio de finalización: existe autorización explícita para el commit de captura; el registro se marca como completado dentro de ese commit; el commit está creado en `prototype/interactive-experience-redesign`; y su SHA, la pregunta, el veredicto y el enlace a la rama constan en el issue de implementación. El SHA no se escribe dentro del propio commit.

## Reglas para cada sesión de variante

- Trabajar exclusivamente en la variante asignada y en el mínimo soporte común imprescindible.
- Preservar el funcionamiento de las variantes ya existentes.
- Usar exclusivamente la fixture validada y fijada en el baseline.
- Mantener la variante libre para adoptar una estructura radicalmente distinta.
- No extraer abstracciones visuales compartidas antes de elegir una dirección.
- No implementar persistencia, mutaciones ni navegación de producto fuera del alcance.
- No añadir tests de detalle para código desechable.
- Ejecutar al menos los checks necesarios para asegurar que el prototipo arranca y que no rompe el harness.
- Aplicar el presupuesto y los límites de Impeccable definidos para las sesiones 2 a 4.
- Proponer al usuario cualquier descubrimiento que cambie una premisa común; tras su aprobación, anotarlo en `Registro de exploración` y marcar las variantes afectadas para reevaluación.
- No realizar commits salvo petición explícita del usuario.

Si una sesión termina con trabajo incompleto, puede utilizar `handoff` y debe anotar la ubicación del documento temporal en su fila del registro. Una sesión completada no crea un documento de traspaso adicional: el brief, el registro, el código y el estado de Git deben bastar.

## Evaluación común

Cada variante se valora de 1 a 5 en los siguientes criterios:

| Criterio | Pregunta |
| --- | --- |
| Posicionamiento | ¿Se entiende en treinta segundos la especialización en modernización backend? |
| Credibilidad | ¿La propuesta parece honesta, seria y respaldada por hechos? |
| Memorabilidad | ¿Existe un gesto o estructura que se recuerde sin caer en espectáculo vacío? |
| Escaneabilidad | ¿Un perfil de selección puede identificar rol, experiencia y evidencias principales con rapidez? |
| Profundidad | ¿Un perfil técnico puede explorar responsabilidades y tecnologías asociadas? |
| Diferenciación | ¿La superficie ofrece algo distinto al CV web? |
| Integridad factual | ¿Evita métricas, relaciones o capacidades no respaldadas por la fuente? |
| Jerarquía | ¿El peso visual refleja la relevancia y duración de cada contenido? |
| Desktop | ¿Aprovecha el espacio sin fragmentar la lectura? |
| Mobile | ¿Mantiene claridad, personalidad y scroll natural? |
| Accesibilidad | ¿La dirección puede alcanzar teclado, foco, contraste y reducción de movimiento? |
| Rendimiento | ¿La propuesta parece viable dentro de la pila y budgets del proyecto? |
| Resiliencia | ¿Soporta contenido largo y campos ausentes, y puede consolidarse sobre el fallback semántico compartido? |
| Conversión | ¿Contacto, CV web y PDF resultan fáciles de localizar y comprender? |

El efecto sorpresa no compensa un fallo de credibilidad, comprensión o acceso. La puntuación orienta la conversación, pero el veredicto debe explicar qué se elige y por qué.

## Recorridos de evaluación

Cada variante debe revisarse mediante los mismos recorridos:

1. Entrar sin contexto previo e identificar el perfil y su propuesta.
2. Localizar la evidencia de más de veinte años de experiencia.
3. Comprender la importancia de la etapa Abanca.
4. Comprender la evolución hacia microservicios, cloud e integraciones.
5. Reconocer que los registros Evolutio se solapan dentro de un contexto común.
6. Consultar una experiencia con contenido largo.
7. Identificar habilidades asociadas sin confundirlas con un catálogo global.
8. Acceder a contacto, CV web y CV PDF.
9. Repetir el recorrido con teclado.
10. Repetirlo en mobile.
11. Revisarlo con `prefers-reduced-motion`.
12. Comprobar una vez que el fallback común conserva el contenido esencial sin JavaScript.

## Decisiones cerradas

- Se mantienen Experiencia interactiva y CV web como superficies distintas.
- Se diseñan versiones desktop y mobile.
- El posicionamiento principal es la especialización en modernización de sistemas corporativos desde backend.
- La experiencia superior a veinte años actúa como evidencia principal de credibilidad.
- La referencia visual v1 queda fuera de la exploración.
- Las tres direcciones iniciales son capítulos editoriales, sistema en evolución y dossier de modernización.
- Las variantes se realizan en sesiones separadas dentro de un harness común.
- Las habilidades permanecen asociadas a experiencias, formaciones o proyectos.
- El catálogo superior `skills` no se muestra.
- Los periodos profesionales solapados se representan como tales.
- La calidad visual no se apoya en logros o métricas inventados.

## Decisiones abiertas

- Dirección ganadora o combinación de elementos.
- Tema claro, oscuro o híbrido definitivo.
- Familias tipográficas.
- Metáfora visual final.
- Organización exacta de los contextos profesionales.
- Nivel de síntesis de la etapa inicial dentro de la Experiencia interactiva.
- Redacción definitiva de las dos experiencias anteriores a 2007 en la fuente curricular.
- Estructura final de la formación todavía no adaptada al contrato de presentación.
- Intensidad y naturaleza del movimiento.
- Necesidad de selección, filtros o lector en la solución final.
- Uso final de GSAP más allá de transiciones puntuales.
- Ajustes de budgets de rendimiento que pudiera exigir la dirección seleccionada.

## Fuera de alcance de la exploración

- Rediseñar el CV web.
- Cambiar el CV PDF o su proceso de generación.
- Crear un formulario de contacto.
- Añadir backend o persistencia.
- Crear una versión multilingüe.
- Publicar fotografía.
- Convertir `skills` en catálogo global.
- Inventar proyectos, métricas o case studies.
- Resolver de forma definitiva la normalización de la fuente curricular.
- Construir el design system de producción antes de elegir una dirección.
- Llevar una variante directamente a producción.

## Consolidación posterior

Cuando exista un veredicto, la solución no se promociona copiando sin revisión el código desechable. Las decisiones validadas se reimplementan con calidad de producción.

La consolidación debe revisar al menos:

- La declaración obsoleta sobre el estado de la aplicación en la especificación maestra.
- La sección de dirección visual de la especificación maestra.
- Los contratos de estructura, detalle y movimiento del timeline.
- El ADR de scroll vertical en mobile.
- Las definiciones `Timeline` y `Hito` de `CONTEXT.md` si dejan de representar el producto.
- Los tests de interacción, teclado, foco, reducción de movimiento y degradación.
- La baseline y los budgets de rendimiento si cambia sustancialmente el JavaScript o los recursos.
- La documentación de la dirección visual y sus tokens.
- El puntero de `AGENTS.md`, que debe retirarse o sustituirse por la documentación definitiva.

La rama principal conserva únicamente la solución validada y su documentación. Después de incorporar la decisión validada al producto, el conjunto completo de variantes se captura como fuente primaria mediante un commit autorizado en la rama de prototipo y se enlaza desde el issue de implementación, de acuerdo con la skill `prototype`. Este brief se marca como supersedido cuando la especificación definitiva asume sus decisiones y la captura ha quedado registrada.

## Prompt común para nuevas sesiones

```text
Continúa el único UI prototype definido en
docs/design/interactive-experience-redesign-brief.md.

En las sesiones 1 a 5 y 7, trabaja en el mismo worktree y la misma rama del
prototipo registrados en “Registro de exploración”. La sesión 6 sigue la rama
y el worktree de producción indicados por el issue sin modificar la topología
del prototipo. No crees otro worktree, otra rama ni otro prototipo para una
variante.

La sesión 1 es la única excepción: si esos campos todavía están pendientes,
establece y registra el worktree y la rama después de obtener las
autorizaciones exigidas por el brief. No construyas el harness hasta comprobar
que ya operas desde ambos. Si el worktree registrado está en otro directorio,
traslada allí los artefactos no versionados del baseline y verifica que existen
`AGENTS.md`, el brief y la fixture. Solo entonces detente y pide al usuario que
reanude la sesión 1 desde esa ruta.

Antes de editar:
- Lee CONTEXT.md, el brief y su Registro de exploración.
- Consulta la especificación maestra solo para los contratos que el brief
  conserva.
- Carga la skill prototype como conjunto de reglas para el artefacto
  compartido, no como inicio de un nuevo prototipo.
- Usa Impeccable solo con la función, el presupuesto y los comandos permitidos
  para esta fase; no inicies su flujo abierto de diseño ni crees subvariantes.
- Comprueba que el directorio y la rama coinciden con el registro o, para la
  sesión 6, con el issue de implementación siempre que esos campos ya estén
  informados. Solo el bootstrap inicial de la sesión 1 puede encontrarlos
  pendientes y establecerlos con autorización.
- Inspecciona git status, git diff y el código existente.
- Si existe una sesión precedente, confirma que figura como Completada.

Ejecuta únicamente: <sesión y foco>.

Preserva el harness y las variantes existentes, usa la misma fuente de
contenido y aplica los requisitos desktop, mobile, accesibilidad y
rendimiento del brief. No uses la referencia visual v1.

Al terminar, actualiza el Registro de exploración con el estado, los cambios,
los checks, los bloqueos y el siguiente paso. No hagas commits sin
autorización explícita. Si tu criterio de finalización exige capturar el
prototipo y esa autorización no consta, solicítala y marca la sesión como
Bloqueada.
```

El marcador `<sesión y foco>` se sustituye por un único encargo explícito, por ejemplo `Sesión 3: construir la variante B`. No se añade una petición genérica de prototipar porque podría interpretarse como el inicio de otro ciclo.

Para la sesión 6, la instrucción de cierre se sustituye por `registra el resultado, los checks y el estado de la implementación en el issue; no edites el Registro de exploración desde la rama de producción`. Para la sesión 7, se añade `verifica el cierre en el issue y sincroniza las filas 6 y 7 en el Registro de exploración antes del commit de captura`.

## Registro de exploración

Esta es la única sección operativa que las sesiones actualizan durante la exploración. No se completan sus valores por suposición.

| Campo | Valor |
| --- | --- |
| Rama de prototipo | `prototype/interactive-experience-redesign` |
| Ruta del `worktree` compartido | `F:/dev/projects/profiles/profile-site/profile-site-interactive-experience` |
| SHA de origen | `ad96a1b8b6197f46f026bfbd35174545f1765a36` |
| Revisión del baseline | 3 |
| Issue de implementación | [#64](https://github.com/fraguio/profile-site/issues/64) |
| Fuente de contenido | `src/prototypes/interactive-experience/resume.fixture.json`, derivada de `profile-data@d16f238c59718eaf6d44381b7498a3be44f0bf7d` |
| Comando de arranque | `pnpm prototype:interactive-experience` |
| Comandos de verificación | `pnpm check:prototype:interactive-experience`; `pnpm build:prototype:interactive-experience`; smoke test en `?variant=A`, `?variant=B` y `?variant=C` para `1280x800`, `390x844` y el fallback sin JavaScript; detector manual registrado en `src/prototypes/interactive-experience/evidence/session-1-harness.md` |
| Impeccable | `impeccable@4.1.0` instalado para OpenCode con alcance de proyecto mediante `npx impeccable@4.1.0 install -y --providers=opencode --scope=project --no-hooks`; `/impeccable init` creó `PRODUCT.md` y fijó `code-led`; `/impeccable doctor` no informó hallazgos |
| Estado de captura final | Pendiente hasta incorporar la decisión validada al producto; el SHA final se registra en el issue |

Los estados permitidos son `Pendiente`, `En curso`, `Completada` y `Bloqueada`. Una sesión solo se marca como `Completada` cuando cumple su criterio de finalización y ha registrado sus checks. La siguiente no comienza mientras la anterior permanezca en otro estado. La única excepción de soporte es la sesión 6: mantiene su estado operativo en el issue y la sesión 7 lo sincroniza en esta tabla durante el cierre.

| Sesión | Estado | Resultado y cambios | Checks | Bloqueos y siguiente paso |
| --- | --- | --- | --- | --- |
| 1. Harness | Completada | Bootstrap completado: rama, `worktree`, SHA e issue registrados. La primera reanudación se bloqueó porque el nuevo `worktree` no contenía los artefactos no versionados del baseline; se trasladaron y ya están disponibles. Se instaló `impeccable@4.1.0` para OpenCode con alcance de proyecto y sin hooks. Se creó `PRODUCT.md` como adaptador factual y se fijó `code-led`. El harness incorpora la fixture como fuente neutral validada, el fallback semántico compartido, el selector flotante `?variant=`, espacios aislados para A, B y C y la convención de evidencia. | Verificados la rama, el `worktree`, el issue y la presencia física de `AGENTS.md`, brief y fixture en el `worktree` compartido; `git diff --check` y `PROFILE_SITE_BASE_URL=https://fraguio.github.io/profile-site/ pnpm check` correctos. La instalación se verificó con `npx --no-install impeccable@4.1.0 --version`, que devolvió `4.1.0`. `/impeccable doctor` no informó hallazgos. `pnpm check:prototype:interactive-experience` y `pnpm build:prototype:interactive-experience` finalizaron correctamente. El smoke test comprobó A, B y C en `1280x800` y `390x844`, el cambio mediante flechas y el fallback sin JavaScript. Los outputs del detector para código, desktop y mobile están en `src/prototypes/interactive-experience/evidence/`. | Sin bloqueos. La sesión 2 puede construir exclusivamente la variante A desde este mismo `worktree` y rama. |
| 2. Variante A | Completada | Se construyó la dirección de capítulos editoriales sobre la fixture compartida: portada con posicionamiento, señal de más de veinte años y CTAs; capítulos de continuidad Abanca, modernización Evolutio con solapes explícitos, origen, proyectos y aprendizaje continuo. La crítica está en `.impeccable/critique/active-experience-variants-varianta-astro-a9c48374-2026-09-22.md`; la única pasada `distill` alineó el CTA principal con modernización, redujo la navegación y aplicó divulgación progresiva a dos intervenciones. Se ajustaron contraste, leading, overflow e inset mobile. | `pnpm check:prototype:interactive-experience` y `pnpm build:prototype:interactive-experience` correctos. Smoke de A, B y C en `1280x800` y `390x844` sin overflow; flechas verificadas; A respeta `prefers-reduced-motion`; fallback sin JavaScript visible con 3 CTAs y 19 artículos. El detector de código, desktop y mobile finalizó sin hallazgos; outputs y manifiesto en `src/prototypes/interactive-experience/evidence/session-2-variant-a.*`. | Sin bloqueos. La sesión 3 puede construir exclusivamente la variante B desde este mismo `worktree` y rama. |
| 3. Variante B | Pendiente | Pendiente | Pendiente | Requiere la sesión 2 completada |
| 4. Variante C | Pendiente | Pendiente | Pendiente | Requiere la sesión 3 completada |
| 5. Evaluación conjunta | Pendiente | Pendiente | Pendiente | Requiere las sesiones 2, 3 y 4 completadas |
| 6. Consolidación | Pendiente | Pendiente | Pendiente | Requiere la sesión 5 completada |
| 7. Captura y cierre | Pendiente | Pendiente | Pendiente | Requiere la sesión 6 y la implementación de producción completadas |

Los cambios de premisa aprobados se añaden debajo de la tabla con fecha, decisión, motivo y variantes que requieren reevaluación.

- 2026-09-21, revisión 2: se fija la fixture validada como fuente única de las variantes. Incorpora los dos proyectos y las asociaciones de skills aprobadas. No requiere reevaluación porque todavía no se ha construido ninguna variante.
- 2026-09-21, revisión 3: se aprueba la integración operativa de Impeccable subordinada a la skill `prototype` y a este brief. Se fijan su preparación en el harness, el presupuesto equivalente por variante, la evaluación conjunta y los comandos reservados para después del veredicto. No requiere reevaluación porque todavía no se ha construido ninguna variante.
