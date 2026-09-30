# Especificación de búsqueda de código con `tgrep` en OpenCode

## Planteamiento del problema

La integración inicial permite al modelo invocar `tgrep` desde OpenCode y favorece su uso para búsquedas de contenido en todo el repositorio. Sin embargo, la herramienta solo acepta un patrón, busca siempre en todo el worktree y devuelve el output textual del CLI. El modelo no puede expresar directamente filtros, búsqueda literal, inclusión de archivos ocultos, contexto ni lectura del contenido actual.

Una búsqueda sin coincidencias devuelve el código de salida `1` del CLI, que la implementación actual no diferencia de un fallo. El wrapper tampoco establece límites propios de resultados, timeout o cancelación. El plugin registra el lanzamiento del servidor sin comprobar después su disponibilidad.

El desarrollador necesita consultas precisas y resultados interpretables, con una ejecución acotada que se integre en Windows 10 y pueda construirse mediante entregas pequeñas, verificables y asumibles en sesiones independientes de OpenCode.

### Trabajo previo completado

La integración inicial está documentada en la [issue #65](https://github.com/fraguio/profile-site/issues/65) y se incorporó mediante el commit [`78d785dfdf5ca390ac8880473a19e79e9e1e74aa`](https://github.com/fraguio/profile-site/commit/78d785dfdf5ca390ac8880473a19e79e9e1e74aa), `chore(opencode): integrate tgrep code search tool`.

- [x] Plugin que consulta el estado del servidor para el worktree e intenta arrancar `tgrep serve` en segundo plano mediante PowerShell si no detecta uno activo.
- [x] Custom tool `tgrep` que acepta un patrón, ejecuta una búsqueda regex con números de línea y devuelve el output textual del CLI.
- [x] Descripción de la tool que orienta al modelo a priorizarla para búsquedas de contenido en todo el repositorio.
- [x] Exclusión del índice local `.tgrep/` en Git.

La issue #65 registra verificaciones en Windows 10 de descubrimiento de la tool, selección autónoma por el modelo, arranque del servidor, watcher nativo y reutilización del servicio desde otra instancia de OpenCode. Esta especificación amplía ese trabajo completado.

## Solución

Ampliar la custom tool existente para ofrecer un contrato de consulta explícito sobre el CLI de `tgrep`. El modelo elegirá la herramienta y sus argumentos a partir del schema y sus descripciones; OpenCode coordinará la llamada; la implementación aplicará el contrato, ejecutará el CLI y gestionará resultados y recursos.

La herramienta permitirá acotar el ámbito, buscar texto literal o regex, filtrar archivos, incluir archivos ocultos, obtener contexto y consultar el contenido actual. Devolverá resultados legibles con rutas relativas al worktree y distinguirá coincidencias, ausencia de coincidencias, truncamiento, errores, timeout y cancelación.

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
13. Como agente de programación, quiero recibir números de línea y rutas relativas estables, para localizar el contenido encontrado.
14. Como agente de programación, quiero añadir líneas de contexto, para interpretar una coincidencia sin solicitar inmediatamente otra lectura.
15. Como agente de programación, quiero distinguir coincidencias y contexto, para identificar qué líneas satisfacen realmente el patrón.
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

## Decisiones de implementación

### Arquitectura y responsabilidad

- Mantener la custom tool `tgrep` como interfaz de OpenCode y el CLI de `tgrep` como motor de búsqueda.
- Mantener el plugin como punto de prewarming del servicio y compartir la gestión del servidor con las consultas indexadas.
- Concentrar la integración tras una frontera pública de consulta que reciba argumentos, worktree y señal de cancelación y devuelva un resultado o un error. La organización interna de procesos, argumentos y parsing es un detalle de implementación.
- Preferir `node:child_process` con argumentos separados y `shell: false` para ejecutar consultas. Es compatible con el entorno de OpenCode y permite reutilizar el runner de tests de Node 24 sin exigir un ejecutable independiente de Bun.
- Usar los tipos del SDK para el contexto y el resultado de la tool. La versión instalada aporta `context.abort` y resultados con `output` y `metadata`.
- Mantener los helpers fuera de las ubicaciones que OpenCode descubre automáticamente como tools o plugins.
- Orientar al modelo mediante descripciones operativas de cada parámetro. La elección de una combinación válida pero poco adecuada corresponde al modelo y no se resuelve mediante validación de tipos.

### Contrato de entrada

| Parámetro | Tipo | Valor predeterminado | Semántica |
| --- | --- | --- | --- |
| `pattern` | string | Obligatorio | Regex por defecto; texto exacto cuando `literal` es `true`. |
| `path` | string | `"."` | Archivo o directorio existente dentro del worktree. Las rutas relativas se resuelven respecto al worktree. |
| `literal` | boolean | `false` | Activa la búsqueda de texto literal. |
| `ignore_case` | boolean | `false` | Activa la búsqueda sin distinguir mayúsculas y minúsculas. |
| `glob` | array de strings | Sin filtros | Globs del CLI, incluidas exclusiones. |
| `file_types` | array de strings | Sin filtros | Nombres de tipos del CLI. |
| `hidden` | boolean | `false` | Incluye archivos y directorios ocultos no ignorados. |
| `context_lines` | integer | `0` | Líneas de contexto antes y después de una coincidencia; rango `0–10`. |
| `freshness` | enum | `"indexed"` | Valores `"indexed"` y `"current"`. |
| `max_results` | integer | `100` | Máximo de registros devueltos; rango `1–1000`. |

- Validar tipos y rangos antes de ejecutar el CLI. Rechazar strings con NUL, que no pueden representarse como argumentos del proceso.
- Resolver el ámbito respecto al worktree, no respecto al directorio del proceso de OpenCode. Admitir rutas absolutas únicamente cuando su destino real esté dentro del worktree.
- Comprobar la existencia y pertenencia del destino real, incluidos symlinks y junctions resueltos. Los scans de directorio conservan el comportamiento del CLI sin seguimiento de symlinks.
- Pasar el patrón como un único argumento después de `--`, de modo que espacios, comillas, prefijos `-` y nombres de subcomandos conserven su significado de patrón.
- Aplicar los globs y tipos con la semántica del CLI. Los globs positivos de una búsqueda indexada filtran su corpus y no recuperan por sí solos archivos ignorados; un scan actual puede aplicar los overrides propios del recorrido del filesystem.
- `hidden` modifica la visibilidad, no desactiva las ignore rules. Se conserva el comportamiento del CLI para ámbitos nombrados explícitamente.
- Los defaults de regex, distinción de mayúsculas, visibilidad y contexto conservan la interpretación inicial de una consulta que solo aporta `pattern`.

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

- Solicitar JSON al CLI y procesarlo incrementalmente. No interpretar el output separando rutas, líneas y contenido mediante `:`.
- Convertir los eventos de coincidencia y contexto en registros con ruta, número de línea, texto y clase de registro. Un registro corresponde a una línea devuelta, no a cada submatch individual.
- Normalizar las rutas respecto al worktree y conservar el contenido textual de cada línea, incluida su indentación. El parsing debe tolerar chunks partidos entre eventos y entre caracteres UTF-8.
- Devolver output legible y metadata del SDK. El output debe hacer visibles el modo de búsqueda y el truncamiento; la metadata debe incluir al menos `search_mode`, `truncated`, su motivo cuando exista y el número de registros devueltos.
- Interpretar el código `0` como consulta con coincidencias y el código `1` como consulta válida sin coincidencias. Una consulta sin coincidencias debe comunicar explícitamente que no se encontraron resultados.
- Diferenciar los errores del CLI, los fallos al lanzar el ejecutable y los errores del protocolo de resultados. Conservar un diagnóstico útil y acotado.
- Conservar stderr relevante como advertencias en consultas válidas y como diagnóstico en consultas fallidas.
- Diferenciar una consulta completa, una respuesta parcial por límites, un timeout y una cancelación. Los resultados parciales no deben presentarse como una consulta completa.

### Límites y ciclo de vida

- `max_results` cuenta coincidencias y filas de contexto por igual.
- Acotar el output textual completo a `48 000` bytes UTF-8, incluidos cabecera y avisos. Acotar también la metadata, sin duplicar en ella todos los registros.
- Acotar por separado stderr y el buffer de un evento JSON incompleto mediante presupuestos documentados por la implementación. Una fila que no cabe o un evento excesivo deben producir truncamiento explícito, no un falso resultado sin coincidencias.
- Aplicar los límites durante la lectura. Recortar una respuesta después de haber acumulado todo stdout no satisface el límite de memoria del wrapper.
- Cuando la lectura se interrumpe por límites, identificar esa causa y recoger el subprocess. Distinguir esa terminación intencional de los errores reales observados.
- Aplicar un timeout de consulta de `30` segundos desde el lanzamiento del cliente. Las comprobaciones de disponibilidad del servicio tienen un plazo propio y acotado.
- Conectar la cancelación de OpenCode con el cliente de consulta. Una cancelación anterior al lanzamiento evita crear el cliente.
- Unificar el cleanup de finalización normal, error, truncamiento, timeout y cancelación. Retirar timers y listeners, terminar el cliente cuando corresponda y recoger su cierre.
- Hacer explícitos los fallos de terminación o cleanup en lugar de comunicarlos como éxito. El cleanup tampoco debe esperar indefinidamente.
- Terminar el cliente de consulta sin detener el daemon compartido. La interrupción del cliente no garantiza la cancelación del trabajo ya recibido por el daemon.

### Entregas y defaults

- Dividir la implementación en tickets de comportamiento completo, cada uno verificable y asumible en una sesión nueva de OpenCode, con un commit atómico que incluya su verificación.
- Publicar los tickets como sub-issues de la nueva issue de especificación, con `ready-for-agent` y dependencias nativas que reflejen bloqueos reales.
- Usar GitHub para el estado y las decisiones de ejecución. Mantener este documento como contrato normativo y actualizarlo cuando cambie el comportamiento acordado.
- Revisar los defaults después de varias sesiones reales. Evaluar la intención, el resultado, las reformulaciones y el uso de otras herramientas, además de los parámetros enviados por el modelo.
- Cualquier ajuste de defaults justificado por esa evidencia se realizará en un commit independiente y actualizará el contrato. La recogida manual de observaciones es suficiente para esa revisión.

## Decisiones de verificación

### Frontera principal

La frontera principal de tests es la ejecución pública de una consulta: argumentos, worktree y señal de cancelación como entrada; output, metadata o error como salida. Los tests deben verificar comportamiento observable, no la distribución interna de helpers ni una copia de las condiciones de implementación.

La gestión del servidor se verifica por sus efectos externos: disponibilidad, reutilización, logs y fallback de la consulta. Los tests de procesos usan un ejecutable controlado para emitir eventos, errores o bloqueos reproducibles. Los smoke tests con el CLI real verifican que ese contrato coincide con `tgrep` en Windows.

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
- Añadir en esta entrega una herramienta de búsqueda por nombres equivalente a `find_files` o los modos de output `files` y `count`.
- Prometer un snapshot atómico, freshness inmediata de una consulta indexada o cancelación del trabajo ya recibido por el daemon.
- Administrar la instalación o actualizar la versión del ejecutable de `tgrep`.
- Introducir telemetría de uso o cambios automáticos de defaults.
- Modificar las superficies públicas o el contrato curricular de `profile-site`.

## Notas adicionales

- Seguimiento de la especificación: [issue #67](https://github.com/fraguio/profile-site/issues/67).
- Esta especificación del repositorio es la fuente normativa del contrato. La issue padre publica el alcance acordado y los antecedentes; sus sub-issues gestionan el trabajo pendiente.
- El entorno observado dispone de Node `24.11.1`, `tgrep 1.0.10` y `@opencode-ai/plugin 1.18.32`. Son referencias de verificación del estado inicial, no una petición de actualizar versiones.
- Las [MCP search tools oficiales](https://github.com/microsoft/tgrep/blob/7b706715ad3b620c350c73209523ba5034cd66a8/scripts/agent/README.md) también invocan el CLI. El [runtime consultado](https://github.com/microsoft/tgrep/blob/7b706715ad3b620c350c73209523ba5034cd66a8/scripts/agent/runtime.py) contiene dependencias POSIX; la custom tool aprovecha el CLI que ya funciona en este entorno Windows.
- La ejecución y los valores predeterminados no dependen de que el modelo complete todos los parámetros opcionales. Sus descripciones deben explicar cuándo conviene buscar literal, incluir ocultos o solicitar contenido actual.
- Las entregas propuestas son: resultados y errores; ámbito y filtros; freshness y contexto; límites y truncamiento; timeout y cancelación; disponibilidad y recuperación del servicio. Los bloqueos se concretan en los tickets mediante relaciones nativas de GitHub.
- Reiniciar OpenCode después de cambios de configuración, schema, tool o plugin para cargar la nueva implementación antes de su verificación funcional.
