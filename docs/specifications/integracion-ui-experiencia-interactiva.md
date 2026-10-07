# Integración de la UI de la Experiencia interactiva

## Estado y autoridad

- **Estado:** integración implementada y aceptada por el titular el 2026-10-06, que da por terminada la integración de la UI diseñada en Stitch en la aplicación.
- **Procedimiento:** especificación elaborada con `/to-spec`, aprobada para ejecución el 2026-10-05 y consolidada con la especificación maestra. El ciclo de integración queda cerrado con la aceptación del titular; las siguientes mejoras requieren su propia definición de alcance.
- **Autoridad:** especificación normativa del alcance de la integración realizada de la Experiencia interactiva, en coordinación con la [especificación maestra](https://github.com/fraguio/profile-site/blob/main/docs/specifications/profile-site.md), que gobierna los contratos generales. Este documento desarrolla los requisitos específicos de presentación, comportamiento y aceptación de la integración.
- **Referencia aceptada:** P11/intento-03 del ciclo de Stitch. P12/intento-02 es un candidato evaluado y no aceptado; P12/intento-03 está exportado, con inspección estática parcial y sin evaluación funcional completa ni aceptación.
- **Objeto:** documentar el contrato de la base visual y funcional integrada de la Experiencia interactiva, incluido el alcance estructural y de presentación de P12 resuelto mediante trabajo directo sobre el repositorio.
- **Seguimiento:** [issue #84](https://github.com/fraguio/profile-site/issues/84), cerrada como completada tras la confirmación del titular el 2026-10-06.

## Planteamiento del problema

Al definir esta integración, la UI acordada con Stitch todavía no estaba integrada en la aplicación. Continuar corrigiendo el prototipo mediante prompts resultaba lento y costoso para los ajustes precisos pendientes. El titular necesitaba que las siguientes mejoras se realizaran sobre componentes, estilos e interacción reales, conservando la identidad aceptada y con resultados pequeños y verificables.

El proyecto ya disponía de una aplicación Astro, un consumidor curricular compartido, metadatos, CV web, CV PDF y pruebas. Su interacción respondía a acuerdos anteriores: loop automático, detalle cerrable y panel mobile que sustituía al timeline. Pegar el HTML exportado no resolvía ese desajuste ni conservaba por sí mismo el contrato de datos, la degradación progresiva o los gates del proyecto.

La muestra de cuatro hitos usada en Stitch es parcial y temporal. Incluye extensiones y decisiones editoriales que el consumidor actual no presenta. Convertirla en la fuente de la aplicación ocultaría una sustitución curricular y confundiría fidelidad visual con aceptación de contenido o de P12.

## Solución

Adaptar la UI de referencia a la Experiencia interactiva existente: identidad y navegación operativas, composición desktop de tres regiones, timeline con selección única permanente, filtros accesibles y un detalle único que se intercala tras el hito seleccionado en mobile.

Usar el consumidor y la cadena de build del proyecto. Conservar la Fuente curricular elegida, su procedencia y el orden cronológico actual. Adaptar la presentación del contenido soportado y consumir explícitamente el enlace estándar de proyecto; mantener la adaptación curricular completa como trabajo independiente.

Verificar los comportamientos afectados por cada incremento aprovechando la aplicación renderizada y los checks existentes, con la proporcionalidad definida en `AGENTS.md`. La comparación visual global y los criterios P12 se aceptan al cierre de la integración, no como entregables de cada ticket. La compensación fina del scroll, la alineación superior y la apertura tipo persiana permanecen fuera de esta etapa.

## Historias de usuario

1. Como titular del perfil, quiero trasladar la UI aceptada al proyecto, para continuar las mejoras sobre el código que realmente se publica.
2. Como titular del perfil, quiero conservar las exportaciones originales, para poder identificar la referencia y los candidatos que informaron cada decisión.
3. Como visitante, quiero reconocer una identidad oscura, editorial y coherente, para distinguir el perfil y orientarme en la trayectoria.
4. Como visitante, quiero leer el nombre, rol y resumen de la Fuente curricular, para conocer al profesional sin contenido de demostración introducido por el diseño.
5. Como visitante, quiero acceder al CV web, CV PDF y contacto, para elegir la forma de consultar el perfil o contactar con su titular.
6. Como visitante, quiero acceder a los enlaces profesionales disponibles, para consultar los destinos declarados en la Fuente curricular.
7. Como visitante desktop, quiero disponer de identidad, timeline y detalle en tres regiones, para explorar sin perder el contexto general.
8. Como visitante desktop, quiero desplazar el timeline o el cuerpo del detalle cuando lo necesitan, para acceder al contenido que no cabe en el viewport.
9. Como visitante desktop, quiero ver señales de scroll ajustadas al overflow real, para entender cuándo queda contenido por leer.
10. Como visitante, quiero que el timeline permanezca estático mientras no actúo sobre él, para controlar la exploración sin movimiento automático.
11. Como visitante, quiero empezar con un hito seleccionado y su detalle disponible, para comprender de inmediato la relación entre ambos.
12. Como visitante, quiero seleccionar otro hito mediante clic, Enter o Espacio, para consultar su contenido con el dispositivo que utilizo.
13. Como visitante, quiero que haya una sola selección y un solo detalle activo, para identificar inequívocamente qué estoy consultando.
14. Como visitante, quiero que activar el hito seleccionado no cierre el detalle, para mantener un patrón de selección permanente.
15. Como visitante, quiero filtrar por Todo, Experiencia, Formación o Proyectos, para acotar la exploración a una categoría.
16. Como visitante, quiero que no se ofrezcan filtros de categorías vacías, para evitar resultados sin hitos.
17. Como visitante, quiero conservar el hito seleccionado cuando un filtro todavía lo incluye, para seguir consultándolo.
18. Como visitante, quiero que un filtro excluyente seleccione el primer resultado visible, para disponer de un detalle coherente con el nuevo conjunto.
19. Como usuario de teclado, quiero mantener el foco en el filtro que activo y conocer el resultado, para continuar la navegación sin transferencias inesperadas al detalle.
20. Como usuario de teclado, quiero que los hitos excluidos salgan inmediatamente del orden de interacción, para no activar contenido oculto.
21. Como visitante mobile, quiero recorrer identidad y trayectoria mediante scroll vertical del documento, para leer sin un segundo scroller impuesto.
22. Como visitante mobile, quiero ver un detalle inmediatamente después del hito seleccionado, para asociar la lectura con su origen.
23. Como visitante mobile, quiero que el detalle sea independiente del botón del hito, para utilizar sus enlaces sin controles anidados.
24. Como visitante mobile, quiero una cabecera compacta y una asociación accesible identificativa, para aprovechar el espacio sin perder contexto.
25. Como visitante mobile, quiero leer prosa, listas y habilidades completas con anchura suficiente, para acceder a todo el contenido sin truncado ni overflow horizontal.
26. Como visitante mobile, quiero poder llegar al siguiente hito después de un detalle largo, para continuar la exploración con scroll normal.
27. Como visitante, quiero que seleccionar un hito conserve las dimensiones de su botón, para reconocer una geometría estable.
28. Como visitante, quiero que la línea conecte los nodos visibles y se oculte con un solo hito, para interpretar correctamente el timeline filtrado.
29. Como visitante, quiero conservar filtro y selección al cambiar de tamaño de pantalla, para seguir explorando el mismo contenido.
30. Como usuario de teclado, quiero que la recolocación responsive conserve el foco de un elemento que siga disponible, para no perder mi posición de navegación.
31. Como usuario de teclado, quiero distinguir foco y selección mediante indicadores legibles, para reconocer el control activo sin depender solo del color.
32. Como visitante con reducción de movimiento, quiero cambios inmediatos y sin animaciones de altura, para evitar movimiento que dificulte la lectura.
33. Como visitante sin JavaScript, quiero leer la trayectoria completa y usar las acciones del perfil, para acceder al contenido aunque no cargue la mejora interactiva.
34. Como visitante, quiero ver bloques y metadatos solo cuando contienen información, para no encontrar placeholders ni restos del hito anterior.
35. Como visitante, quiero usar el enlace de un proyecto cuando la Fuente curricular lo proporciona, para consultar ese proyecto concreto.
36. Como titular del perfil, quiero preservar la Revisión curricular efectiva y las superficies documentales existentes, para que integrar la UI no cambie silenciosamente los hechos publicados.
37. Como desarrollador, quiero ejecutar pruebas sobre comportamientos observables y fuentes reproducibles, para corregir la integración sin depender de la estructura interna del prototipo.
38. Como titular del perfil, quiero un cierre con evidencia y pendientes explícitos, para distinguir la base integrada de las mejoras de scroll y animación posteriores.

## Decisiones de implementación

### 1. Adaptación a la aplicación existente

- La integración afecta a la composición, los estilos y la mejora interactiva de la Experiencia interactiva. Reutiliza la carga curricular compartida, metadatos, acciones operativas, configuración pública y cadena de build.
- No se incorpora una aplicación paralela ni un dataset embebido procedente del HTML de Stitch. El HTML exportado aporta referencia de identidad, composición y comportamiento, no una implementación de producción para pegar sin adaptación.
- La mejora se aplica al HTML accesible generado por Astro. Sin JavaScript, o si no se inicializa la mejora, permanecen disponibles la trayectoria completa, sus detalles y las acciones nativas.
- Los filtros y controles de selección solo se ofrecen cuando son operativos. Su inicialización no depende de cargar una librería de animación; el loop y los controles de pausa, reanudación y cierre dejan de formar parte de esta interacción.
- Se conserva el vocabulario de [CONTEXT.md](https://github.com/fraguio/profile-site/blob/main/CONTEXT.md) y los contratos de las superficies públicas.

### 2. Fuente curricular y alcance de datos

- Se mantiene la adquisición y validación existentes: JSON Resume 1.3.1, reglas locales y una Fuente curricular explícita para cada build. Se respetan el [ADR de revisión curricular exacta](https://github.com/fraguio/profile-site/blob/main/docs/adr/0001-consumir-revision-curricular-exacta.md) y el [ADR de Publicación del perfil](https://github.com/fraguio/profile-site/blob/main/docs/adr/0006-publicar-el-perfil-explicitamente-desde-profile-site.md).
- Se conserva el orden del timeline: hitos vigentes primero, finalización descendente, comienzo descendente y orden de origen ante empate. No se impone el orden ni los IDs de la muestra de Stitch sobre otra fuente.
- Desde #103 el filtro inicial es Experiencia cuando existe esa categoría, o Todo si la fuente no tiene experiencia. Se selecciona su primer resultado según el orden cronológico del consumidor; no se codifica una identificación como selección universal.
- Una fuente sin hitos conserva identidad y acciones, sin filtros, timeline o detalle vacíos. Una categoría sin hitos no crea filtro.
- La descripción y el resumen de una participación se conservan completos, como párrafos independientes cuando ambos existen. Sus contribuciones y habilidades asociadas mantienen el contenido del consumidor. La formación presenta `details` con contenido, o sus cursos cuando falta o está vacío, como Contenidos; los proyectos conservan descripción, contribuciones, roles y habilidades.
- Se admite la adaptación mínima del modelo de presentación para consumir `projects.url`, campo estándar opcional, y ofrecer Ver proyecto en el detalle. Se mantiene su validación de URL según el schema: un valor inválido falla en la validación existente; la acción se omite cuando el campo está ausente. No se utiliza un enlace de identidad como sustituto ni se transforma una URL ausente en una acción representada.
- Las etiquetas Descripción, Contribuciones, Contenidos y Habilidades asociadas dependen de bloques con contenido. Rol/Roles, ubicación y enlace dependen de sus datos. No se inventan entidades, ubicación de hito, roles, fechas finales ni datos para completar la composición.
- #103 habilita `work.clientName` y `work.projectName`: strings opcionales no vacíos que componen el título con « — » cuando existen ambos, o con el único valor disponible. La contratante `work.name` sigue siendo la entidad y `work.position` conserva el rol completo en el detalle y el CV web/PDF. Sin ambos campos se conserva el fallback anterior de posición y nombre.
- `education.title`, string opcional no vacío, tiene prioridad sobre la composición estándar. `education.details` es un array opcional de strings no vacíos que admite lista vacía; con contenido sustituye a `courses`, sin duplicar listas. Las cuatro extensiones reutilizan validación y diagnósticos locales, sin cambiar JSON Resume 1.3.1 ni el orden del consumidor compartido.
- El ensayo local de #103 usa `.tmp/profile-data/resume.fixture.json`, excluido de Git y cargado mediante `RESUME_PATH` explícito: dos participaciones Mapfre, formación Backend y proyecto profile-site. Inicialmente selecciona Mapfre — Integraciones WhatsApp / Genesys Cloud. Se conservan íntegros textos, listas y su orden, precisión de fechas, roles y URL. La ubicación personal no se reutiliza como ubicación de los hitos. Los checks reproducibles usan fixtures ficticios versionados.
- El ensayo delimita esta muestra de cuatro hitos; no acredita la curación completa de la trayectoria ni inicia una Publicación del perfil.

### 3. Identidad y composición

- P11/intento-03 y los acuerdos de sus planes guían la identidad. La captura exportada y el HTML aceptado prevalecen como referencia concreta sobre los valores históricos contradictorios de DESIGN.md.
- Se conservan el fondo oscuro, la jerarquía serif/sans, la navegación neutra y las categorías dorada, turquesa y violeta. Todo activo es neutro; el acento de proyectos es `#818cf8`. Leer CV web mantiene su excepción dorada contenida y los iconos profesionales conservan los acentos decorativos aceptados.
- Newsreader para el nombre e Inter para la UI son la referencia tipográfica de P11. Se sirven localmente y se comprueba el presupuesto de fuentes antes de aceptar; una sustitución visual relevante requiere acuerdo y evidencia. Solo se incluyen familias y pesos efectivamente usados.
- Nombre, rol, resumen, ubicación personal y destinos profesionales proceden de la fuente actual. Las acciones de CV web, CV PDF y contacto mantienen sus destinos funcionales y el base path del project site; no se copian los href representados del prototipo. No se incorpora un control de tema inerte.
- La navegación superior ofrece CV web, CV PDF y Contacto. El usuario confirmó retirar el enlace redundante Trayectoria en la revisión de #100; se conserva Explorar trayectoria en mobile. El repaso visual recupera las superficies, tipografía y bordes de P11, incluidos los círculos de 8 px en Contribuciones y Contenidos y las variantes claras de color de las etiquetas de categoría; filtros, nodos y encabezados mantienen sus acentos base.
- Desde 1024 px se dispone la composición de identidad, timeline y detalle ajustada al viewport. Timeline y cuerpo de detalle permiten scroll independiente cuando existe overflow. El encaje no se obtiene truncando texto ni reduciendo incidentalmente la tipografía aceptada.
- Por debajo de 1024 px, identidad y timeline son regiones consecutivas del mismo documento, conforme al [ADR de scroll vertical mobile](https://github.com/fraguio/profile-site/blob/main/docs/adr/0005-usar-scroll-vertical-en-mobile.md). Se conserva Explorar trayectoria hacia su encabezado. No se imponen una altura de detalle, scroll-snap ni scroll interno al timeline o al cuerpo del detalle.
- Los filtros conservan escala compacta, wrapping y separación estable en los dos tamaños mobile de aceptación. Ningún filtro queda recortado por un marco.
- El periodo del timeline ocupa la columna lateral desktop y aparece encima de la superficie del hito en mobile, conservando la anchura útil aceptada del título y el nodo. Las etiquetas resumidas se derivan de las fechas fuente; el detalle mantiene su precisión original y presenta Actualidad para un periodo abierto, sin inventar `endDate` ni reemplazarlo por texto en los datos.

### 4. Selección y filtrado

- Con hitos disponibles, hay una selección única permanente y un detalle activo. Los hitos son controles nativos operables por clic, Enter y Espacio, con nombre accesible que identifica categoría, título, entidad y periodo disponibles.
- La selección comunica su estado, conserva el foco en el control activado y no se presenta como un acordeón plegable. No hay cierre por repetición, Escape o un control de cierre.
- Al elegir otro hito, se sustituye el contenido del detalle y se retiran los bloques o atributos que no corresponden. El cuerpo desktop del nuevo detalle empieza al principio.
- Activar el hito seleccionado no lo deselecciona. La conservación fina de la posición de lectura al repetir selección sigue siendo un pendiente P13 y no se acredita con esta especificación.
- Los filtros son botones nativos con `aria-pressed`, nombre de grupo y selección única. Todos se recorren con Tab; recibir foco no cambia los resultados. Clic, Enter y Espacio activan el filtro y conservan el foco en él, conforme a la decisión correctiva de #100 que sustituye la posibilidad de reutilizar radios de #84.
- Desde el último filtro, Tab alcanza el primer hito visible sin detenerse en el contenedor del timeline. Los hitos permiten recorrer la trayectoria desplazable; el cuerpo desplazable del detalle desktop sigue siendo alcanzable por teclado.
- Si el filtro incluye al seleccionado, se mantienen selección y contenido, sin reconstrucción ni reinicio forzado de la lectura desktop. Si lo excluye, desaparecen ese hito y su detalle y se selecciona el primer resultado según el orden del consumidor.
- El foco permanece en el filtro activado. El resultado se anuncia mediante la región viva existente, sin mover el foco ni desplazar programáticamente al usuario desde los filtros hasta el detalle.
- Los hitos excluidos salen inmediatamente de la interacción y de Tab; los cambios rápidos de filtro no permiten seleccionar un hito ajeno al resultado vigente.
- Filtro y selección viven en memoria: no se persisten ni se reflejan en URL o historial.

### 5. Detalle y responsive

- Hay una única instancia de detalle activo. Desktop la coloca en su región permanente; mobile la sitúa inmediatamente después del botón seleccionado y antes del siguiente hito visible, también cuando el seleccionado es el último.
- El detalle es un bloque separado del botón. El enlace Ver proyecto es nativo y no queda dentro del control del hito.
- La cabecera desktop identifica categoría, título y entidad. Mobile evita repetir esa cabecera visual completa, conserva los metadatos adicionales y mantiene un nombre accesible específico asociado al hito precedente.
- El cuerpo presenta íntegros los párrafos, listas, roles y habilidades disponibles. Los bloques son independientes; un hito sin descripción puede mostrar contenidos o habilidades. Cambiar a un hito sin URL o sin listas retira sus valores previos del detalle activo.
- Mobile aprovecha la anchura de la región para lectura. El detalle no se limita a la columna estrecha del título ni genera overflow horizontal; sus enlaces y etiquetas largas admiten wrapping.
- La selección no altera borde, dimensiones ni anchura útil del botón: borde constante de 1 px y espacio del chevron reservado. La inserción del detalle mobile desplaza deliberadamente los hitos siguientes y es la excepción acordada a la estabilidad global.
- Cambiar el breakpoint conserva filtro, selección, contenido e instancia única. La recolocación no destruye el detalle ni pierde el foco de un elemento que sigue disponible. Si el elemento focalizado deja de ser un control pertinente para ese layout, el retorno se hace al hito seleccionado sin scroll programático.
- La recolocación responsive no define una compensación del scroll mobile ni un offset superior; esas reglas siguen en P13.

### 6. Línea, marco, foco y señales de scroll

- La línea conecta los centros reales del primer y último nodo visibles. Se recalcula tras selección, filtrado, cambios de contenido, fuentes y viewport, con el layout definitivo. El detalle no añade nodo y con un único hito la línea se oculta.
- El detalle desktop mantiene cabecera fuera del marco de lectura, padding de 12 px en un único marco y un cuerpo identificable y alcanzable por teclado. El contenido desplazable conserva un gutter estable.
- El foco visible es interior champán de 1 px (`#c9bea6`), sin halo ni offset exterior. Sobre filtros activos claros usa trazo interior oscuro (`#07131a`) y conserva fondo y texto. Selección y foco son estados independientes.
- El foco del scroller desktop se refleja en su marco único. El enlace del proyecto y los otros controles conservan su indicador interior.
- Se mantiene el objetivo WCAG 2.2 AA, con contraste de texto y controles, operación por teclado y estados reconocibles sin depender solo del color. Las excepciones decorativas no sustituyen los indicadores de estado.
- Barras y degradados responden al overflow real. En desktop con ratón y puntero fino, la señal de barra aparece con hover o foco visible de teclado; un clic no la mantiene al salir el puntero. Si no hay overflow, no se muestra una señal residual.
- Los degradados se limitan a la superficie desplazable, excluyen marco y gutter y desaparecen al final del scroll o cuando no hay overflow. Mobile no presenta overlays de un scroller interno inexistente.
- Se mantiene la corrección de distribución entre filas visibles de B01 y el comportamiento de barras de B02. Filtrar no deja márgenes residuales de filas ocultas.

### 7. Movimiento y contratos conservados

- El timeline no tiene movimiento automático. Esta integración no incorpora persiana ni transiciones de altura; con reducción de movimiento los cambios y recolocaciones son inmediatos.
- El CV web y el CV PDF mantienen su composición, contenido factual actual, rutas y generación compartida. Incorporar el enlace de proyecto en la Experiencia interactiva no rediseña esas superficies ni modifica sus hechos curriculares.
- Metadatos, enlaces públicos, validación y Publicación del perfil conservan los contratos vigentes. La integración local no inicia una publicación ni modifica la Revisión curricular publicada.
- Se respetan los budgets y el evaluador de rendimiento existentes. Un cambio de umbrales requiere un trabajo explícito; no se recalibran para ocultar una regresión de la UI.

## Decisiones de pruebas

### Enfoque confirmado

El usuario confirmó el 2026-10-05 la aplicación renderizada con Playwright como seam principal para selección, filtros, detalle, foco, responsive y lectura íntegra. Se reutilizan los checks contractuales de build, datos, CV web/PDF y rendimiento. No se introducen interfaces internas de prueba por defecto.

Una buena prueba expresa un comportamiento observable: selección comunicada, contenido que puede leerse, enlace que apunta a la fuente, foco real, posición del detalle, dimensiones estables o overflow efectivo. No valida el nombre de una función, una lista de clases de Tailwind o el resultado de llamar a funciones privadas del HTML exportado.

### Antecedentes y datos reproducibles

- Reutilizar las pruebas browser de composición, acciones, filtros, teclado, Axe y fallback; sus expectativas de cierre y ausencia de selección inicial deben adaptarse al nuevo contrato.
- Reutilizar los casos de categoría vacía y detalle largo. Sustituir las expectativas del panel mobile que oculta el timeline por el patrón intercalado y el scroll natural.
- Sustituir las pruebas del loop por comprobaciones de ausencia de movimiento automático y de degradación cuando no carga la mejora. El fallo de una librería opcional no debe retirar contenido accesible.
- Mantener los checks contractuales que ya cubren validación, orden y textos curriculares, metadatos, base path, acciones, generación PDF y ausencia de timeline vacío. Si cambia la semántica de un control, actualizar solo las expectativas estructurales necesarias conservando sus objetivos externos.
- Usar el fixture ficticio contractual y sus variantes existentes. Añadir únicamente variantes ficticias necesarias para ejercitar URL de proyecto, metadatos ausentes o wrapping prolongado; no copiar el fixture personal de Stitch.
- Los datos de prueba y el estado inicial se identifican en cada evidencia. No se comparan posiciones absolutas o wrapping entre fuentes distintas como si fueran una regresión de geometría.

### Matriz de aceptación de la integración

Esta matriz describe el cierre de la integración completa. Cada incremento comprueba solo las áreas afectadas y reutiliza la cobertura existente; el comportamiento de las skills del flujo se mantiene. Un ajuste local de etiquetas, enlaces o estilos no exige recorrer toda la matriz ni crear una colección de evidencias por ticket. Las pruebas nuevas cubren comportamientos que aún no estén protegidos; los viewports adicionales se justifican por diferencias de layout o breakpoint.

| Área | Comprobación observable | Cobertura |
| --- | --- | --- |
| Identidad y acciones | Composición, nombre, resumen íntegro, tipografía, destinos funcionales y base path | Revisión visual en 1366 × 768, 1440 × 900, 360 × 800 y 390 × 844 al aceptar la composición integrada |
| Selección permanente | Un seleccionado, un detalle, cambio por clic/Enter/Espacio y repetición sin cierre | Desktop y mobile representativos; estados ausentes y largos donde cambien el layout |
| Filtros | Compatible, excluyente, retorno a Todo, categoría vacía, cambios rápidos, foco y anuncio; excluidos fuera de Tab | Una matriz funcional focalizada y regresión responsive cuando haya cambio de wrapping |
| Detalle y contenido | Orden hito → detalle → siguiente, último hito, texto íntegro, bloques independientes, roles, habilidades y URL de fuente | Mobile 360/390 para lectura y wrapping; desktop con detalle largo y sin overflow |
| Geometría y línea | Botón estable antes/después, nodos conectados, línea oculta con un resultado y sin espacios residuales | Los cuatro viewports por el alcance responsive de la integración |
| Marco y señales | Padding de 12 px, foco interior, barra según hover/teclado y overflow, degradado al inicio/final sin invadir gutter | Desktop 1366/1440; confirmar ausencia de scroll interno impuesto mobile |
| Breakpoint | Secuencia 1366 → 360 → 1440 → 390 con estado e instancia únicos; foco en hito y en enlace de proyecto disponible | Una secuencia identificable por escenario de foco, sin reconstrucción del estado |
| Degradación y movimiento | HTML completo sin JavaScript o sin mejora; timeline estático; reducción de movimiento sin animaciones | Desktop/mobile representativos y fuente sin hitos |
| Contratos conservados | Build, datos, CV web/PDF, SEO, rutas y presupuestos de rendimiento | Checks existentes afectados y regresiones justificadas; comprobación final del conjunto |

La revisión visual utiliza P11 e identifica las diferencias debidas a fuente o layout mobile. Las capturas pueden utilizarse como artefactos temporales de revisión; se versionan solo cuando aporten una referencia duradera necesaria o el usuario lo solicite. Una captura no acredita teclado, scroll ni filtrado. No se exige igualdad pixel a pixel entre fuentes distintas ni se usa P12/intento-03 como baseline aceptada.

Ejecutar primero las pruebas afectadas y después las regresiones justificadas, conservando la comprobación final que pide el flujo. La matriz completa corresponde al cierre de la integración; repetirla requiere cambios o fallos que lo justifiquen. Los gates existentes conservan la validación de build, PDF y rendimiento; ejecutar los checks no exige informes nuevos por ticket. El resumen de entrega recoge cambios, comprobaciones y pendientes concretos. Un éxito de Axe no certifica accesibilidad universal; lector de pantalla, otros motores y táctil real mantienen sus pendientes mientras no se prueben.

### Condiciones de cierre de la integración completa

1. La Experiencia interactiva utiliza la fuente y el orden actuales, conserva acciones y contratos y presenta la base visual acordada.
2. Los cinco criterios estructurales y de presentación de P12 tienen evidencia nueva en la aplicación: instancia/posición, separación/estabilidad, lectura/cabecera, filtros/línea y desktop/breakpoint.
3. Los remates R01–R04/R06 de intento 02 tienen comprobaciones pertinentes en la integración; reducción de movimiento, B01 y B02 tienen evidencia propia, no una aceptación heredada por copia.
4. La evidencia distingue aplicación integrada, prototipo histórico y comportamientos pendientes. Las extensiones curriculares aplazadas no se dan por implementadas y la muestra de cuatro hitos no se declara migrada íntegramente.
5. Se registra por separado aceptación de la integración y aceptación de P12. Si un criterio de P12 no está comprobado o requiere corrección, permanece abierto aunque haya un incremento integrado.
6. Al completar P12 se cierra la sesión de integración sin iniciar P13; las siguientes mejoras vuelven al inicio del flujo de definición.

## Fuera de alcance

- Nuevos prompts, correcciones o exportaciones de Stitch; modificación de sus originales.
- Compensación fina del documento mobile, alineación cerca del borde superior, offsets y excepciones, continuidad al repetir selección y conservación precisa del punto de lectura. P13 no se inicia.
- Apertura tipo persiana, animaciones de altura y diseño de su coordinación con scroll, foco o reducción de movimiento.
- Adaptación completa de la Fuente curricular y de sus extensiones locales, curación de hechos, selección editorial definitiva y datos destacados de la trayectoria.
- Curación completa de la trayectoria más allá del ensayo delimitado de cuatro hitos de #103.
- Rediseño del CV web/PDF, tema, formulario de contacto, backend, fotografía, multilingüismo y nuevas acciones generales.
- Inicio del trabajo histórico P14, pruebas exhaustivas de otros entornos o aceptación automática de sus pendientes.
- Cambios de workflows de publicación, adquisición curricular, budgets o perfil de rendimiento.
- Commits, push o PR sin petición explícita.

## Notas adicionales

### Referencias y evidencia histórica

Los materiales de Stitch están fuera del worktree. Para este entorno se localizan en `F:/dev/projects/profiles/profile-site/doc/.tmp/stitch/projects/20260922-Aarav Rao-Galicia/iteraciones/`. Sus rutas identifican antecedentes locales; no son recursos públicos de la aplicación ni archivos versionados de esta especificación.

- **Primera iteración:** `20261002 19.58-01/plan.md`, con identidad, foco, geometría y aceptaciones B01/B02.
- **Segunda iteración:** `20261004 20.45-02/plan.md`, con decisiones actuales, criterios P12, evidencia y cierre del método.
- **Base aceptada:** `20261004 20.45-02/P11/intento-03/`, captura y HTML aceptados. La selección Todo/profile-site pertenece a su muestra y no impone datos a la aplicación.
- **Candidato evaluado:** `20261004 20.45-02/P12/intento-02/`; su script e informe propios están en `materiales/revision-P12-intento-02.cjs` y `.json`. Sus 361 comprobaciones pertenecen a ese intento.
- **Último candidato:** `20261004 20.45-02/P12/intento-03/`; exportado y parcialmente inspeccionado de forma estática, sin evaluación funcional completa ni aceptación.

Las exportaciones permanecen intactas. Cualquier copia de referencia o evidencia nueva debe identificar su origen y diferenciarse de los originales; no se presenta una corrección propia como salida de Stitch.

### Consolidación del punto 3

La especificación maestra se ha reconciliado con este contrato el 2026-10-05. La consolidación comprende:

- Estado real de la aplicación y reparto de autoridad: contratos generales en la maestra y requisitos específicos de integración en esta spec.
- Selección inicial del primer hito como regla técnica provisional, filtros compatibles/excluyentes y selección permanente.
- Detalle intercalado, cabecera compacta y scroll natural mobile, sin sustitución del timeline ni cierre.
- Foco en el control activado y conservación coherente al cambiar el breakpoint.
- Retirada del loop obligatorio, sus controles y la dependencia de animación para inicializar; movimiento reducido y animación futura delimitados.
- Identidad de P11 y familias tipográficas de referencia, servidas localmente dentro de los budgets vigentes.
- Consumo del enlace estándar de proyecto y aplazamiento explícito de las extensiones curriculares de la muestra.
- Evidencia de selección, contenido, instancia, geometría, foco y responsive en lugar de requisitos históricos de cierre y loop; baseline y salidas actuales conservadas.

La consolidación documental del 2026-10-05 precedió a la implementación. La aceptación posterior del titular se registra en el cierre de esta integración. Las decisiones de fuente exacta, publicación deliberada y scroll vertical mobile se mantienen en sus ADRs existentes.

Las issues [#3](https://github.com/fraguio/profile-site/issues/3) y [#64](https://github.com/fraguio/profile-site/issues/64) son antecedentes de construcción y exploración. Esta especificación delimita la integración directa actual; las descripciones históricas incompatibles no gobiernan sus tickets.

### Cierre y continuidad

El 2026-10-06 el titular confirmó que la implementación de #84 había terminado y dio por terminada la integración de la UI diseñada en Stitch en la aplicación. Esta aceptación cierra el ciclo de integración y la issue #84 como completada. Las exportaciones y evaluaciones históricas de Stitch conservan sus estados propios.

Las siguientes mejoras parten de la aplicación integrada y vuelven al flujo de definición con alcance propio. Siguen pendientes la adaptación y curación de la Fuente curricular, la selección editorial definitiva, la compensación fina del scroll mobile y la apertura tipo persiana. La elección del siguiente incremento se acordará con el titular a partir de las necesidades del producto y de la Fuente curricular real.
