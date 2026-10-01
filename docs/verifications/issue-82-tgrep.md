# Verificación del modo files de tgrep (#82)

## Alcance y base

- Issue: [#82](https://github.com/fraguio/profile-site/issues/82), parte de [#67](https://github.com/fraguio/profile-site/issues/67).
- Contrato normativo: `docs/specifications/tgrep-opencode.md`. Se consultaron los cuerpos y comentarios de ambas issues y las dependencias nativas de #82.
- #82 no tiene blockers nativos. #68–#73 están cerradas y sus commits `7fab129`, `8361a62`, `5020aa0`, `c4a765d`, `cdb2761` y `b97c351` son ancestros de `origin/main`. La revisión documental `2b4827e` también está integrada mediante #81.
- Worktree inicialmente limpio; `git fetch origin` antes de crear `feat/82-add-tgrep-files-output` desde `origin/main`.
- SHA inicial para revisión: `3da180fce5471c13eb607a3c4aa9605695852b38`.
- GitHub no registra tickets bloqueados por #82. La entrega avanza la ampliación posterior de #67.

## Comportamiento y presupuestos

`output_mode` admite `content` y `files`, con default `content`. El modo inválido se rechaza antes de comprobar el servicio o lanzar clientes. `content` conserva su protocolo JSON, líneas y contexto; ambos modos añaden `output_mode` a la metadata y una cabecera que identifica el modo de resultados.

`files` solicita `--files-with-matches --null --color=never --no-heading`, sin JSON, números de línea ni contexto. El decoder UTF-8 estricto admite chunks fragmentados y conserva el BOM cuando forma parte del nombre. El parser utiliza exclusivamente NUL como delimitador. Las rutas se normalizan respecto al worktree y se deduplican en orden de primera aparición; el orden del CLI no es una garantía de ordenación estable entre consultas.

Cada fila es un string JSON que permite recuperar el nombre sin ambigüedad. Se escapan comillas, backslashes y controles; también los separadores Unicode U+2028 y U+2029 para evitar que rompan una fila. Los espacios, `:` y Unicode ordinario se conservan dentro de las comillas. Los bytes de esa representación se incluyen en el presupuesto.

| Recurso | Presupuesto |
| --- | --- |
| Output textual completo | 48 000 bytes UTF-8 |
| Filas de registros retenidas | 38 000 bytes de representación |
| Rutas únicas retenidas | `max_results`, default 100, rango 1–1000 |
| Estado de deduplicación | Hasta 1000 rutas; sus nombres no exceden los 38 000 bytes de representación retenida |
| Ruta incompleta | 256 000 bytes UTF-8; hasta tres bytes adicionales en el decoder incremental |
| Stderr retenido | 8 192 bytes, compartido con `content` |
| Diagnóstico de fallback del servicio | 1 024 bytes UTF-8, presupuesto existente |
| Cliente de consulta | 30 segundos desde `spawn`, más hasta 5 segundos de cleanup |

Los límites se aplican durante la lectura. Un duplicado no consume resultados; exactamente el límite con fin natural no trunca. Una ruta distinta adicional produce `max_results`; una representación que no cabe produce `output_bytes`; una ruta incompleta excesiva produce `path_bytes`. Estos casos no se presentan como ausencia de coincidencias, aunque no quepa ninguna fila. Stderr excesivo produce `stderr_bytes`. Se reutilizan timeout, cancelación, cleanup y gestión del servicio: se recoge únicamente el cliente, no el daemon compartido.

## Verificaciones realizadas

Entorno: Windows, Node 24.11.1, tgrep 1.0.10, OpenCode 1.18.33 y SDK `@opencode-ai/plugin` 1.18.32.

- TDD en `queryTgrep`: protocolo público `files`, rechazo de modos inválidos antes de procesos, escape de separadores Unicode y conservación de BOM en el nombre. Se observaron los fallos antes de aplicar las correcciones.
- `node --test test/tgrep-files.test.mjs`: 16 tests pasan. Cubren fragmentación byte a byte, UTF-8, espacios, controles, normalización absoluta y de separadores Windows, deduplicación, límites, buffers excesivos, errores, advertencias, filtros y argumentos especiales, regresión de `content`, cancelación previa y en curso, timeout y cleanup fallido.
- `node --test test/tgrep-files.test.mjs test/tgrep-service.test.mjs`: verificación focalizada de la consulta y efectos del servicio; incluye scan sin gestión de servicio, disponibilidad, reutilización, fallback y recuperación en `files`.
- `pnpm exec tsc --noEmit --strict --target esnext --module nodenext --moduleResolution nodenext --allowImportingTsExtensions --skipLibCheck .opencode/tools/tgrep.ts .opencode/plugins/tgrep-server.ts`: correcto, ejecutado regularmente durante la implementación.
- `pnpm check`, con `PROFILE_SITE_BASE_URL=https://fraguio.github.io/profile-site/` y `RESUME_PATH=test/fixtures/fictitious-resume.json`: cero errores, warnings e hints.
- `node --test smoke-checks/tgrep-files.mjs`: pasa con el CLI real. Comprueba varios archivos y 200 coincidencias en uno solo, nombres Windows con espacios y Unicode, literal/regex/mayúsculas, ámbitos, tipos, ocultos, ignore rules y overrides de globs, argumentos especiales, límites y contexto sin efecto, edición posterior al indexado, recuperación y supervivencia del daemon tras límites y errores.
- `node --test smoke-checks/tgrep-service.mjs smoke-checks/tgrep.mjs smoke-checks/tgrep-filters.mjs smoke-checks/tgrep-freshness.mjs smoke-checks/tgrep-limits.mjs smoke-checks/tgrep-cancellation.mjs`: once smoke tests de regresión pasan.
- `node --test smoke-checks/tgrep-opencode.mjs`: pasa con una instancia nueva y los módulos intactos. Descubre enum/default de `output_mode` y sus descripciones; verifica rutas JSON y metadata de `files`, truncamiento por archivos, `content` implícito y explícito, cancelación real de una consulta `files`, reutilización del daemon entre sesiones, recuperación y supervivencia tras cerrar OpenCode.
- `pnpm test`: suite completa ejecutada una vez al finalizar la implementación. Pasan 133 tests de Node, con una omisión POSIX en Windows, y 35 tests de Playwright.

## Fixtures y cleanup

Los tests automatizados usan subprocesses controlados y la frontera pública; no requieren SDK ni instalación de tgrep. Los smoke tests crean worktrees aislados, índices y archivos propios y recogen únicamente sus procesos antes de eliminar los recursos. El fixture de OpenCode termina el proceso directo sin matar su árbol, comprueba que el daemon sobrevive y después lo recoge mediante `serve.json` de su worktree.

Los primeros intentos del smoke real sirvieron para corregir sus expectativas: la regex con `.` también coincide con `X`, y un glob positivo en scan puede reincorporar archivos ignorados, conforme al contrato existente. Sus fixtures se limpiaron al finalizar cada intento.

Para cargar el schema y la tool en una sesión habitual, cerrar y reiniciar OpenCode. La verificación funcional ya utilizó una instancia recién iniciada.

## Revisión y publicación

La revisión se delimita por el SHA inicial e incluye los archivos nuevos y cambios todavía sin commit. El commit previsto es `feat(opencode): add tgrep files output`, con firma GPG. El usuario autorizó expresamente su creación y la publicación de rama y PR después de revisar la entrega.

La primera revisión `/code-review` registró cero incumplimientos documentados en Standards, cero hallazgos de Spec y una sugerencia heurística de duplicación. Se extrajeron la normalización de rutas y la admisión por límites compartidas, conservando ambos protocolos y la frontera pública.

Después de esa corrección pasan el typecheck del SDK, los doce smoke tests del CLI real y el smoke de OpenCode recién iniciado. Los tests focalizados ejecutados en paralelo con esos smoke tests tuvieron dos fallos en los fixtures existentes de cancelación/carreras de `content` (comprobación inmediata de PID y cliente que no llegó a escribir su marker antes del timeout de 150 ms). Se repitieron sin esa carga concurrente, con el mismo `--test-concurrency=1` de la suite del repositorio: `node --test --test-concurrency=1 test/tgrep-files.test.mjs test/tgrep-query.test.mjs test/tgrep-service.test.mjs` pasa con 61 tests y una omisión POSIX, sin modificar los tests existentes ni el runner de procesos.

La revisión de seguimiento concluye con cero hallazgos pendientes en Standards y Spec. `git diff --check` pasa. Los cambios se presentaron sin commit para revisión del usuario antes de recibir la autorización de publicación.
