# Especificación de búsqueda de código con `tgrep` en OpenCode

## Planteamiento del problema

La integración inicial permitía al modelo invocar `tgrep` desde OpenCode y favorecía su uso para búsquedas de contenido en todo el repositorio. Sin embargo, la herramienta solo aceptaba un patrón, buscaba siempre en todo el worktree y devolvía el output textual del CLI. El modelo no podía expresar directamente filtros, búsqueda literal, inclusión de archivos ocultos, contexto ni lectura del contenido actual.

Una búsqueda sin coincidencias devuelve el código de salida `1` del CLI, que la implementación inicial no diferenciaba de un fallo. El wrapper tampoco establecía límites propios de resultados, timeout o cancelación. El plugin registraba el lanzamiento del servidor sin comprobar después su disponibilidad. Las entregas #68–#73 ya han resuelto esas limitaciones e incorporado ámbito, filtros, freshness y contexto.

La necesidad actual es localizar los archivos cuyo contenido coincide con un patrón sin recibir todas sus líneas coincidentes. Una respuesta de contenido puede consumir el límite de resultados en un único archivo con muchas coincidencias y ocultar otros archivos relevantes. El agente necesita un modo que devuelva rutas únicas, aproveche los filtros y controles existentes y cuente el límite por archivos.

El desarrollador necesita consultas precisas y resultados interpretables, con una ejecución acotada que se integre en Windows 10 y pueda construirse mediante entregas pequeñas, verificables y asumibles en sesiones independientes de OpenCode.

### Trabajo previo completado

La integración inicial está documentada en la [issue #65](https://github.com/fraguio/profile-site/issues/65) y se incorporó mediante el commit [`78d785dfdf5ca390ac8880473a19e79e9e1e74aa`](https://github.com/fraguio/profile-site/commit/78d785dfdf5ca390ac8880473a19e79e9e1e74aa), `chore(opencode): integrate tgrep code search tool`.

- [x] Plugin que consulta el estado del servidor para el worktree e intenta arrancar `tgrep serve` en segundo plano mediante PowerShell si no detecta uno activo.
- [x] Custom tool `tgrep` que acepta un patrón, ejecuta una búsqueda regex con números de línea y devuelve el output textual del CLI.
- [x] Descripción de la tool que orienta al modelo a priorizarla para búsquedas de contenido en todo el repositorio.
- [x] Exclusión del índice local `.tgrep/` en Git.

La issue #65 registra verificaciones en Windows 10 de descubrimiento de la tool, selección autónoma por el modelo, arranque del servidor, watcher nativo y reutilización del servicio desde otra instancia de OpenCode.

La ampliación de la [issue #67](https://github.com/fraguio/profile-site/issues/67) se implementó mediante sus sub-issues:

- [x] [#68](https://github.com/fraguio/profile-site/issues/68): resultados válidos sin coincidencias, errores diferenciados y ejecución con argumentos separados.
- [x] [#69](https://github.com/fraguio/profile-site/issues/69): ámbito, texto literal, mayúsculas, globs, tipos y ocultos.
- [x] [#70](https://github.com/fraguio/profile-site/issues/70): freshness, contexto, parsing incremental y metadata.
- [x] [#71](https://github.com/fraguio/profile-site/issues/71): límites durante la lectura y truncamiento explícito.
- [x] [#72](https://github.com/fraguio/profile-site/issues/72): timeout, cancelación y cleanup acotado del cliente.
- [x] [#73](https://github.com/fraguio/profile-site/issues/73): disponibilidad, reutilización, fallback y recuperación del servicio compartido.

Esta revisión amplía ese contrato con el modo `files`. La implementación existente constituye su base; #67 continúa siendo la issue padre.

## Solución

Ampliar la custom tool existente para ofrecer un contrato de consulta explícito sobre el CLI de `tgrep`. El modelo elegirá la herramienta y sus argumentos a partir del schema y sus descripciones; OpenCode coordinará la llamada; la implementación aplicará el contrato, ejecutará el CLI y gestionará resultados y recursos.

La herramienta permitirá acotar el ámbito, buscar texto literal o regex, filtrar archivos, incluir archivos ocultos, obtener contexto y consultar el contenido actual. Devolverá resultados legibles con rutas relativas al worktree y distinguirá coincidencias, ausencia de coincidencias, truncamiento, errores, timeout y cancelación.

Añadir `output_mode` con valores `content` y `files`, y default `content`. El modo `content` conserva las líneas coincidentes y su contexto. El modo `files` devuelve únicamente las rutas únicas de los archivos cuyo contenido satisface el patrón, sin números de línea ni contenido del archivo. La consulta sigue siendo una búsqueda de contenido, no de nombres.

El modo `files` obtiene las rutas directamente del CLI y aplica los límites por archivos. No deduce el listado a partir de una respuesta de contenido ya limitada. Esto mejora la cobertura de archivos relevantes y reduce el consumo de contexto. El esfuerzo se concentra en el contrato del nuevo modo y su protocolo de resultados, aprovechando los controles de proceso y servicio ya implementados.

La consulta tendrá límites de resultados y output, lectura incremental y un ciclo de vida acotado. Las consultas indexadas comprobarán la disponibilidad del servidor y usarán un scan actual si falla el intento de asegurar el servicio. El plugin y la tool compartirán esa gestión del servidor.

Los defaults iniciales conservarán la interpretación regex del patrón y se revisarán posteriormente con evidencia del uso real del agente.

## Historias de usuario

1. Como desarrollador, quiero conservar la integración ya incorporada, para ampliar sus capacidades de forma incremental.
2. Como agente de programación, quiero buscar con un patrón regex, para localizar variantes de una expresión en el código.
3. Como agente de programación, quiero buscar texto literal, para localizar identificadores o fragmentos sin interpretar sus caracteres como regex.
4. Como agente de programación, quiero elegir si la búsqueda distingue mayúsculas y minúsculas, para ajustar la consulta a su intención.
5. Como agente de programación, quiero consultar todo el worktree cuando omito el ámbito, para mantener el uso sencillo de la herramienta.
6. Como agente de programación, quiero consultar un directorio concreto, para reducir ruido y consumo de contexto.
7. Como agente de programación, quiero consultar un archivo concreto, para verificar una hipótesis localizada.
8. Como desarrollador, quiero que el ámbito permanezca dentro del worktree, para mantener el contrato de búsqueda de este repositorio.
9. Como agente de programación, quiero filtrar mediante globs de inclusión y exclusión, para seleccionar los archivos relevantes.
10. Como agente de programación, quiero filtrar por tipos de archivo del CLI, para concentrarme en los lenguajes que necesito examinar.
11. Como agente de programación, quiero incluir archivos y directorios ocultos no ignorados, para consultar la configuración y las instrucciones del repositorio.
12. Como agente de programación, quiero conocer la relación entre globs, archivos ocultos e ignore rules, para interpretar correctamente el ámbito de los resultados.
13. Como agente de programación, quiero recibir números de línea y rutas relativas estables en el modo `content`, para localizar el contenido encontrado.
14. Como agente de programación, quiero añadir líneas de contexto en el modo `content`, para interpretar una coincidencia sin solicitar inmediatamente otra lectura.
15. Como agente de programación, quiero distinguir coincidencias y contexto en el modo `content`, para identificar qué líneas satisfacen realmente el patrón.
16. Como agente de programación, quiero permitir el uso del servidor y el índice, para aprovechar las búsquedas indexadas disponibles.
17. Como agente de programación, quiero forzar la lectura del contenido actual, para comprobar cambios recientes sin depender de la actualización asíncrona del índice.
18. Como agente de programación, quiero conocer el modo de ejecución, para interpretar las garantías de freshness de la respuesta.
19. Como agente de programación, quiero recibir una respuesta válida cuando no hay coincidencias, para continuar el razonamiento sin confundir ese resultado con un fallo.
20. Como agente de programación, quiero recibir un diagnóstico ante una regex inválida o una ruta inaccesible, para corregir la consulta.
21. Como agente de programación, quiero conservar los diagnósticos relevantes de stderr, para interpretar resultados acompañados de advertencias.
22. Como agente de programación, quiero limitar el número de resultados, para ajustar la respuesta a la ventana de contexto.
23. Como agente de programación, quiero saber si la respuesta está truncada y por qué, para estrechar la consulta cuando sea necesario.
24. Como desarrollador, quiero que una línea enorme o mucho stderr no produzcan una acumulación ilimitada de memoria en el wrapper, para mantener una ejecución acotada.
25. Como desarrollador, quiero que una consulta tenga timeout, para recuperar el control ante un subprocess bloqueado.
26. Como desarrollador, quiero cancelar una consulta desde OpenCode, para detener el cliente cuando su resultado deja de ser necesario.
27. Como desarrollador, quiero que las consultas recojan sus subprocesses y liberen timers y listeners, para evitar recursos pendientes al finalizar.
28. Como desarrollador, quiero que cancelar una consulta conserve el daemon compartido, para que otras sesiones puedan seguir utilizándolo.
29. Como desarrollador, quiero reutilizar un servidor disponible para el mismo worktree, para mantener la integración con el servicio y el índice locales existentes.
30. Como desarrollador, quiero comprobar que el servidor responde después de un lanzamiento, para que los logs reflejen disponibilidad real.
31. Como desarrollador, quiero que los intentos concurrentes de arranque respeten la exclusividad del índice, para reutilizar un servicio disponible sin competir por su propiedad.
32. Como agente de programación, quiero obtener un scan actual cuando falla el arranque del servidor, para poder continuar una búsqueda válida.
33. Como desarrollador, quiero verificaciones reproducibles en Windows, para conservar el entorno que motivó esta integración.
34. Como desarrollador, quiero tickets autocontenidos y commits atómicos, para ejecutar cada entrega en una sesión con contexto acotado.
35. Como desarrollador, quiero revisar los defaults mediante la intención y los resultados de consultas reales, para mejorar la interfaz con evidencia de uso.
36. Como agente de programación, quiero elegir el modo `files`, para localizar los archivos que contienen un patrón con menos output.
37. Como agente de programación, quiero recibir únicamente rutas relativas en `files`, para seleccionar qué archivos leer a continuación.
38. Como agente de programación, quiero recibir cada ruta una sola vez, para que varias coincidencias en un archivo no consuman el límite de archivos.
39. Como agente de programación, quiero que un archivo con muchas coincidencias no oculte otros archivos relevantes por agotar un límite de líneas, para conocer mejor el alcance de un cambio.
40. Como agente de programación, quiero que omitir `output_mode` conserve el modo `content`, para mantener el comportamiento de las consultas existentes.
41. Como agente de programación, quiero usar el mismo patrón, ámbito, globs, tipos, visibilidad y control de mayúsculas en ambos modos, para cambiar la presentación sin cambiar la intención de búsqueda.
42. Como agente de programación, quiero forzar un scan actual también en `files`, para localizar archivos cuyo contenido acabo de modificar.
43. Como agente de programación, quiero que `max_results` cuente rutas únicas en `files`, para limitar directamente el número de archivos que recibo.
44. Como agente de programación, quiero que alcanzar exactamente el límite no se confunda con recibir una respuesta parcial, para saber si necesito estrechar la consulta.
45. Como agente de programación, quiero recibir el modo de resultados y su número de registros en la metadata, para interpretar si cada registro es una línea o un archivo.
46. Como agente de programación, quiero que `context_lines` solo afecte a `content`, para conservar una salida de rutas cuando selecciono `files`.
47. Como agente de programación, quiero recibir una respuesta válida cuando ningún archivo contiene el patrón, para distinguir ese resultado de un fallo.
48. Como desarrollador, quiero procesar incrementalmente las rutas y su delimitador, para tolerar chunks fragmentados sin acumular todo stdout.
49. Como agente de programación, quiero que las rutas con espacios, Unicode o caracteres especiales se representen sin ambigüedad, para poder localizar el archivo correcto.
50. Como desarrollador, quiero conservar el presupuesto de output y acotar una ruta incompleta excesiva, para que el nuevo modo mantenga los límites de memoria del wrapper.
51. Como desarrollador, quiero conservar errores, advertencias, timeout, cancelación y cleanup en ambos modos, para aprovechar la ejecución acotada ya implementada.
52. Como desarrollador, quiero que terminar una consulta `files` conserve el daemon compartido, para que otras sesiones sigan utilizándolo.
53. Como desarrollador, quiero que un modo inválido se rechace antes de lanzar procesos, para disponer de un contrato explícito.
54. Como desarrollador, quiero verificar el nuevo modo en la frontera pública existente y con el CLI real en Windows, para ampliar la tool sin introducir nuevas fronteras de tests.
55. Como desarrollador, quiero documentar primero la ampliación y después crear su ticket de implementación como sub-issue de #67, para ejecutar el trabajo sobre un contrato integrado.

## Decisiones de implementación

### Arquitectura y responsabilidad

- Mantener la custom tool `tgrep` como interfaz de OpenCode y el CLI de `tgrep` como motor de búsqueda.
- Mantener el plugin como punto de prewarming del servicio y compartir la gestión del servidor con las consultas indexadas.
- Concentrar la integración tras una frontera pública de consulta que reciba argumentos, worktree y señal de cancelación y devuelva un resultado o un error. La organización interna de procesos, argumentos y parsing es un detalle de implementación.
- Preferir `node:child_process` con argumentos separados y `shell: false` para ejecutar consultas. Es compatible con el entorno de OpenCode y permite reutilizar el runner de tests de Node 24 sin exigir un ejecutable independiente de Bun.
- Usar los tipos del SDK para el contexto y el resultado de la tool. La versión instalada aporta `context.abort` y resultados con `output` y `metadata`.
- Mantener los helpers fuera de las ubicaciones que OpenCode descubre automáticamente como tools o plugins.
- Orientar al modelo mediante descripciones operativas de cada parámetro. La elección de una combinación válida pero poco adecuada corresponde al modelo y no se resuelve mediante validación de tipos.
- Ampliar la misma tool y la misma frontera pública de consulta con `output_mode`; la selección del protocolo de resultados es un detalle interno. Los modos comparten validación del ámbito, filtros, disponibilidad, límites, timeout, cancelación y cleanup.

### Contrato de entrada

| Parámetro | Tipo | Valor predeterminado | Semántica |
| --- | --- | --- | --- |
| `pattern` | string | Obligatorio | Regex por defecto; texto exacto cuando `literal` es `true`. |
| `output_mode` | enum | `"content"` | Valores `"content"` y `"files"`; selecciona líneas de contenido o rutas de archivos con coincidencias. |
| `path` | string | `"."` | Archivo o directorio existente dentro del worktree. Las rutas relativas se resuelven respecto al worktree. |
| `literal` | boolean | `false` | Activa la búsqueda de texto literal. |
| `ignore_case` | boolean | `false` | Activa la búsqueda sin distinguir mayúsculas y minúsculas. |
| `glob` | array de strings | Sin filtros | Globs del CLI, incluidas exclusiones. |
| `file_types` | array de strings | Sin filtros | Nombres de tipos del CLI. |
| `hidden` | boolean | `false` | Incluye archivos y directorios ocultos no ignorados. |
| `context_lines` | integer | `0` | Líneas de contexto antes y después de una coincidencia en `content`; rango `0–10`. No modifica el listado en `files`. |
| `freshness` | enum | `"indexed"` | Valores `"indexed"` y `"current"`. |
| `max_results` | integer | `100` | Máximo de registros devueltos; rango `1–1000`. Cuenta líneas de coincidencia y contexto en `content`, y rutas únicas en `files`. |

- Validar tipos y rangos antes de ejecutar el CLI. Rechazar strings con NUL, que no pueden representarse como argumentos del proceso.
- Resolver el ámbito respecto al worktree, no respecto al directorio del proceso de OpenCode. Admitir rutas absolutas únicamente cuando su destino real esté dentro del worktree.
- Comprobar la existencia y pertenencia del destino real, incluidos symlinks y junctions resueltos. Los scans de directorio conservan el comportamiento del CLI sin seguimiento de symlinks.
- Pasar el patrón como un único argumento después de `--`, de modo que espacios, comillas, prefijos `-` y nombres de subcomandos conserven su significado de patrón.
- Aplicar los globs y tipos con la semántica del CLI. Los globs positivos de una búsqueda indexada filtran su corpus y no recuperan por sí solos archivos ignorados; un scan actual puede aplicar los overrides propios del recorrido del filesystem.
- `hidden` modifica la visibilidad, no desactiva las ignore rules. Se conserva el comportamiento del CLI para ámbitos nombrados explícitamente.
- Los defaults de regex, distinción de mayúsculas, visibilidad y contexto conservan la interpretación inicial de una consulta que solo aporta `pattern`.
- Omitir `output_mode` equivale a seleccionar `content`. Rechazar valores distintos de `content` y `files` antes de ejecutar procesos. La validación de `context_lines` mantiene su tipo y rango también en `files`, aunque ese modo no lo utiliza.

### Freshness y gestión del servicio

- `freshness: "current"` fuerza `--no-index`, lee el filesystem y no necesita comprobar ni arrancar el servidor.
- `freshness: "indexed"` intenta asegurar un servidor disponible y después usa la selección normal del CLI entre servidor, índice local y scan.
- El modo de respuesta `indexed_or_scan` no afirma que se haya usado necesariamente el índice ni que este refleje todas las modificaciones recientes.
- El modo `current_scan` identifica una consulta forzada a scan, tanto por petición explícita como por fallo al asegurar el servicio.
- Los scans leen el contenido durante la consulta y no constituyen un snapshot atómico del filesystem.
- Reutilizar el servicio y el índice locales existentes del worktree. El daemon conserva la exclusividad del índice mediante su lock propio.
- Acotar las comprobaciones de estado y la espera de disponibilidad. El arranque no espera a que termine el indexado inicial del corpus.
- Registrar disponibilidad exitosa únicamente después de una comprobación positiva del servicio. Diferenciar un intento de lanzamiento de un servidor que responde.
- Si no se consigue asegurar la disponibilidad, ejecutar la búsqueda como scan actual y comunicar el motivo como diagnóstico.
- Si el daemon desaparece después de comprobar su disponibilidad, se conserva el fallback normal del CLI; una comprobación previa no garantiza que permanezca activo durante toda la consulta.
- El servicio compartido sobrevive al fin de una consulta y al cierre de una sesión. La recuperación de una caída se intenta en la siguiente consulta indexada.

### Resultados y errores

- En `content`, solicitar JSON al CLI y procesarlo incrementalmente. No interpretar el output separando rutas, líneas y contenido mediante `:`.
- En `content`, convertir los eventos de coincidencia y contexto en registros con ruta, número de línea, texto y clase de registro. Un registro corresponde a una línea devuelta, no a cada submatch individual. Conservar el texto de cada línea, incluida su indentación.
- En `files`, solicitar al CLI archivos con coincidencias mediante `--files-with-matches` y rutas delimitadas por NUL mediante `--null`, sin JSON de contenido, color ni cabeceras de agrupación. No usar `--files`, que enumera archivos sin buscar el patrón, ni deduplicar una respuesta de contenido ya truncada.
- En `files`, procesar incrementalmente cada ruta completa delimitada por NUL. No separar por `:`, saltos de línea o espacios. Una ruta residual sin delimitador al finalizar naturalmente, UTF-8 inválido o una ruta vacía producen un error de protocolo, diferenciado de un fallo del CLI.
- Normalizar las rutas de ambos modos respecto al worktree, con separadores `/`, y rechazar rutas de resultado que escapen de él. El parsing debe tolerar chunks partidos entre eventos, rutas y caracteres UTF-8.
- En `files`, deduplicar las rutas normalizadas, conservando el orden de su primera aparición. El orden del listado depende del CLI y no constituye una ordenación estable entre consultas.
- En `files`, representar cada archivo en una fila de output sin números de línea ni contenido. Escapar de forma inequívoca los caracteres de la ruta que puedan confundirse con separadores o romper esa fila, conservando el nombre del archivo; los bytes de esa representación cuentan para el presupuesto de output.
- Devolver output legible y metadata del SDK. El output debe hacer visibles el modo de resultados, el modo de búsqueda y el truncamiento; la metadata debe incluir al menos `output_mode`, `search_mode`, `truncated`, su motivo cuando exista y `record_count`. En `files`, `record_count` cuenta rutas únicas devueltas, no líneas coincidentes ni submatches. La metadata no duplica el listado de registros.
- Interpretar el código `0` como consulta con coincidencias y el código `1` como consulta válida sin coincidencias. Una consulta sin coincidencias debe comunicar explícitamente que no se encontraron resultados.
- Diferenciar los errores del CLI, los fallos al lanzar el ejecutable y los errores del protocolo de resultados. Conservar un diagnóstico útil y acotado.
- Conservar stderr relevante como advertencias en consultas válidas y como diagnóstico en consultas fallidas.
- Diferenciar una consulta completa, una respuesta parcial por límites, un timeout y una cancelación. Los resultados parciales no deben presentarse como una consulta completa.
- En una consulta `files` completa, el código `0` requiere al menos una ruta válida y el código `1` requiere un listado vacío. Una contradicción entre código y registros es un error de protocolo. Una interrupción intencional por límites se interpreta mediante su causa, conservando los errores reales ya observados.
- `context_lines` no añade líneas ni modifica qué archivos aparecen en `files`; las descripciones del schema deben explicar ese comportamiento.

### Límites y ciclo de vida

- En `content`, `max_results` cuenta coincidencias y filas de contexto por igual. En `files`, cuenta rutas normalizadas únicas; los duplicados no consumen unidades adicionales.
- Recibir exactamente `max_results` registros y después un fin natural válido no implica truncamiento. En `files`, un archivo adicional distinto que exceda ese límite produce truncamiento; el listado devuelto no incluye esa ruta adicional.
- Acotar el output textual completo a `48 000` bytes UTF-8, incluidos cabecera y avisos. Acotar también la metadata, sin duplicar en ella todos los registros.
- Acotar por separado stderr y el buffer de un evento JSON o una ruta incompletos mediante presupuestos documentados por la implementación. Una fila que no cabe, un evento excesivo o una ruta excesiva deben producir truncamiento explícito, no un falso resultado sin coincidencias. El estado de deduplicación de `files` queda acotado por el número y los bytes de las rutas retenidas.
- Aplicar los límites durante la lectura. Recortar una respuesta después de haber acumulado todo stdout no satisface el límite de memoria del wrapper.
- Cuando la lectura se interrumpe por límites, identificar esa causa y recoger el subprocess. Distinguir esa terminación intencional de los errores reales observados.
- Aplicar un timeout de consulta de `30` segundos desde el lanzamiento del cliente. Las comprobaciones de disponibilidad del servicio tienen un plazo propio y acotado.
- Conectar la cancelación de OpenCode con el cliente de consulta. Una cancelación anterior al lanzamiento evita crear el cliente.
- Unificar el cleanup de finalización normal, error, truncamiento, timeout y cancelación. Retirar timers y listeners, terminar el cliente cuando corresponda y recoger su cierre.
- Hacer explícitos los fallos de terminación o cleanup en lugar de comunicarlos como éxito. El cleanup tampoco debe esperar indefinidamente.
- Terminar el cliente de consulta sin detener el daemon compartido. La interrupción del cliente no garantiza la cancelación del trabajo ya recibido por el daemon.

### Entregas y defaults

- Dividir la implementación en tickets de comportamiento completo, cada uno verificable y asumible en una sesión nueva de OpenCode, con un commit atómico que incluya su verificación.
- Publicar los tickets como sub-issues de #67, con `ready-for-agent` y dependencias nativas que reflejen bloqueos reales.
- Usar GitHub para el estado y las decisiones de ejecución. Mantener este documento como contrato normativo y actualizarlo cuando cambie el comportamiento acordado.
- La ampliación `files` sigue la secuencia documentación, PR de documentación integrada, publicación del ticket e implementación desde una nueva rama basada en el `origin/main` actualizado. Se prevé un único ticket vertical que incluya schema, consulta, output y verificación; la granularidad se confirma al preparar los tickets.
- Revisar los defaults después de varias sesiones reales. Evaluar la intención, el resultado, las reformulaciones y el uso de otras herramientas, además de los parámetros enviados por el modelo.
- Cualquier ajuste de defaults justificado por esa evidencia se realizará en un commit independiente y actualizará el contrato. La recogida manual de observaciones es suficiente para esa revisión.

## Decisiones de verificación

### Frontera principal

La frontera principal de tests es la ejecución pública de una consulta: argumentos, worktree y señal de cancelación como entrada; output, metadata o error como salida. Los tests deben verificar comportamiento observable, no la distribución interna de helpers ni una copia de las condiciones de implementación.

La gestión del servidor se verifica por sus efectos externos: disponibilidad, reutilización, logs y fallback de la consulta. Los tests de procesos usan un ejecutable controlado para emitir eventos, errores o bloqueos reproducibles. Los smoke tests con el CLI real verifican que ese contrato coincide con `tgrep` en Windows.

La ampliación `files` reutiliza esa misma frontera pública, `queryTgrep`, sin añadir fronteras de tests. El desarrollador confirmó esta decisión: argumentos, worktree y señal de cancelación como entrada; output, metadata o error como salida, complementados por el CLI real en Windows y el descubrimiento/schema de OpenCode. Los subprocesses controlados emiten rutas delimitadas por NUL para verificar el protocolo observable, sin comprobar helpers privados ni copiar la construcción de argumentos.

### Casos de aceptación

1. Una consulta con coincidencias devuelve contenido localizable; una consulta sin coincidencias es válida; una regex inválida y un ejecutable ausente producen errores diferenciados.
2. Los argumentos con espacios, comillas, prefijos `-` y nombres de subcomandos llegan intactos al CLI.
3. Un fixture con varios archivos y directorios verifica búsquedas literales y regex, mayúsculas, ámbitos de archivo y directorio, globs, tipos y archivos ocultos.
4. Las rutas se resuelven respecto al worktree y se rechazan destinos inexistentes o cuyo destino real quede fuera, incluidos enlaces que escapen de él.
5. Las coincidencias y filas de contexto se distinguen; Unicode, CRLF, indentación y eventos JSON repartidos entre chunks se procesan correctamente.
6. Después de modificar un archivo tras su indexado, una consulta `current` devuelve el contenido actual. Una consulta `indexed` comunica únicamente la garantía conservadora `indexed_or_scan`.
7. El número de registros y los bytes de output respetan los límites; la finalización natural y la interrupción por límites se comunican de forma distinguible.
8. Una fila enorme, un evento incompleto excesivo y mucho stderr no generan acumulación ilimitada ni se confunden con ausencia de coincidencias.
9. La cancelación antes del lanzamiento y durante la lectura, el timeout y su carrera con la finalización liberan los recursos del cliente.
10. Los tests de timeout usan plazos internos reducidos, conservando los `30` segundos del contrato de producción.
11. El servidor ya activo se reutiliza; el arranque se confirma por disponibilidad; los intentos concurrentes respetan la propiedad del índice.
12. Un arranque fallido produce un scan actual con diagnóstico; una consulta `current` evita comprobar o arrancar el servicio.
13. La caída del servidor permite un nuevo intento en una consulta indexada posterior. Cancelar un cliente conserva el servicio compartido.
14. OpenCode descubre la tool y el plugin y presenta al modelo el schema ampliado después de reiniciar la sesión.
15. Omitir `output_mode` y seleccionar `content` explícitamente conservan el comportamiento de contenido. Un modo inválido, incluido `count`, se rechaza antes de lanzar procesos.
16. En `files`, un fixture con muchas coincidencias en un archivo y coincidencias en otros devuelve las rutas correspondientes sin agotar el límite por líneas. No devuelve contenido ni números de línea, y normaliza y deduplica rutas.
17. Ambos modos respetan patrones literales y regex, mayúsculas, ámbitos de archivo y directorio, globs de inclusión y exclusión, tipos, ocultos e ignore rules. Una consulta `files` actual refleja una edición posterior al indexado que cambia qué archivos coinciden.
18. Las rutas delimitadas por NUL se procesan aunque el delimitador o un carácter UTF-8 lleguen en chunks distintos. Los fixtures cubren espacios, Unicode, separadores y caracteres que requieren escape en el output; las pruebas reales usan nombres admitidos por Windows.
19. En `files`, se distinguen éxito, ausencia de coincidencias, regex inválida, ejecutable ausente, advertencias, ruta vacía, destino fuera del worktree, UTF-8 inválido, ruta residual incompleta y contradicciones entre código de salida y registros.
20. El límite de `files` cuenta rutas únicas: los casos por debajo, exactamente en el límite y por encima, incluidos duplicados, distinguen fin natural y truncamiento. El output completo respeta los `48 000` bytes también cuando las rutas requieren escape o incluyen avisos.
21. Una ruta incompleta excesiva o una ruta cuya representación no cabe produce truncamiento explícito sin acumular memoria ilimitada ni aparentar ausencia de coincidencias. La lectura se interrumpe y recoge el cliente.
22. `context_lines` válido no cambia el listado de `files`; su tipo y rango se validan igualmente. La metadata identifica `output_mode` y `record_count` con la unidad correspondiente en ambos modos.
23. En `files`, truncamiento, timeout, cancelación previa y en curso y errores conservan el cleanup acotado y el daemon compartido. Las consultas indexadas reutilizan el servicio o aplican el fallback existente; las consultas `current` evitan su gestión.
24. Los smoke tests con el CLI real y una instancia recién iniciada de OpenCode verifican el enum y default de `output_mode`, las rutas y la metadata de `files` y la conservación del modo de contenido.

### Entorno y precedentes

- Reutilizar el runner `node:test` de Node 24, los fixtures temporales y las verificaciones de subprocesses empleados en los tests existentes del repositorio.
- Mantener los tests automatizados de contrato ejecutables sin instalar `tgrep` ni cargar el SDK de OpenCode; los smoke tests con el ejecutable real tienen una ejecución explícita.
- Verificar tipos contra el SDK instalado y el descubrimiento real desde OpenCode. Los tests de la frontera compartida no sustituyen esa comprobación del adaptador.
- Verificar argumentos, rutas, terminación y disponibilidad con el CLI real en Windows 10. Los tests deben limpiar los archivos y procesos que creen y limitarse a fixtures aislados.
- Ejecutar las verificaciones específicas de cada entrega y, al finalizar la integración, la suite de tests unitarios del repositorio y un smoke test completo.

## Fuera de alcance

- Instalar o portar el bridge MCP oficial, introducir un servicio MCP adicional o migrar el entorno a Linux, macOS o WSL.
- Reproducir todo el instalador oficial, su cache compartida, ownership, repair o uninstall.
- Añadir búsqueda semántica: se conserva el motor de texto literal y regex de `tgrep`.
- Añadir `output_mode: "count"`. Su valor para navegación de código es menor que el de localizar archivos; se reconsiderará si aparecen necesidades recurrentes de conteos. La paridad MCP por sí sola no justifica su coste.
- Añadir una herramienta de búsqueda por nombres equivalente a `find_files`. OpenCode ya dispone de `Glob`; su posible ventaja de rendimiento con el listado indexado se reconsiderará si se observa un problema real de velocidad. El modo `files` busca contenido y no sustituye esa operación.
- Prometer un snapshot atómico, freshness inmediata de una consulta indexada o cancelación del trabajo ya recibido por el daemon.
- Administrar la instalación o actualizar la versión del ejecutable de `tgrep`.
- Introducir telemetría de uso o cambios automáticos de defaults.
- Modificar las superficies públicas o el contrato curricular de `profile-site`.

## Notas adicionales

- Seguimiento de la especificación: [issue #67](https://github.com/fraguio/profile-site/issues/67).
- Esta especificación del repositorio es la fuente normativa del contrato. La issue padre publica el alcance acordado y los antecedentes; sus sub-issues gestionan el trabajo pendiente.
- Las entregas #68–#73 completaron la ampliación inicial. `files` es una ampliación posterior aprobada por su cobertura de archivos y ahorro de contexto, manteniendo #67 como issue padre. El ticket de implementación se publicará mediante `/to-tickets` después de integrar la revisión documental.
- El entorno observado dispone de Node `24.11.1`, `tgrep 1.0.10` y `@opencode-ai/plugin 1.18.32`. Son referencias de verificación del estado inicial, no una petición de actualizar versiones.
- Las [MCP search tools oficiales](https://github.com/microsoft/tgrep/blob/7b706715ad3b620c350c73209523ba5034cd66a8/scripts/agent/README.md) también invocan el CLI. El [runtime consultado](https://github.com/microsoft/tgrep/blob/7b706715ad3b620c350c73209523ba5034cd66a8/scripts/agent/runtime.py) contiene dependencias POSIX; la custom tool aprovecha el CLI que ya funciona en este entorno Windows.
- La ejecución y los valores predeterminados no dependen de que el modelo complete todos los parámetros opcionales. Sus descripciones deben explicar cuándo conviene buscar literal, incluir ocultos, solicitar contenido actual o elegir rutas de archivos en lugar de líneas de contenido.
- La nueva entrega aprovecha la infraestructura existente; el esfuerzo adicional es moderado y se concentra en el modo, las rutas delimitadas por NUL y sus verificaciones. La equivalencia funcional útil guía el alcance; copiar defaults, presupuestos, transporte e instalador del MCP oficial no es el objetivo.
- Reiniciar OpenCode después de cambios de configuración, schema, tool o plugin para cargar la nueva implementación antes de su verificación funcional.
