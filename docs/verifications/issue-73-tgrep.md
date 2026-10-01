# Verificación de disponibilidad y recuperación de tgrep (#73)

## Alcance y base

- Issue: [#73](https://github.com/fraguio/profile-site/issues/73), parte de [#67](https://github.com/fraguio/profile-site/issues/67).
- Contrato normativo: `docs/specifications/tgrep-opencode.md`. Ambas issues se consultaron junto con sus comentarios; no había decisiones posteriores en comentarios.
- Blocker nativo único: #72, cerrado. Su commit `cdb2761668dc6c323bf133e4cfb0629cdddc6539` es ancestro de `origin/main` tras actualizar la referencia.
- Worktree inicialmente limpio; rama `fix/73-verify-tgrep-server-availability` creada desde `origin/main`.
- SHA inicial de revisión: `d5b6b8f295de026ed4e2eb63e163a491015ebec8`.
- GitHub no registra tickets bloqueados por #73. Su integración completa la última entrega de implementación de #67.

## Comportamiento y presupuestos

El plugin y las consultas `indexed` utilizan `ensureTgrepService`. Primero comprueban el servicio del worktree. Si responde, lo reutilizan; si no, intentan lanzar un daemon separado y comprueban periódicamente su disponibilidad. El lanzamiento conserva `.tgrep/` y delega la exclusividad del índice al lock del CLI. Los intentos concurrentes pueden reutilizar el servidor que obtiene ese lock.

Los logs distinguen intento de lanzamiento, disponibilidad confirmada y fallo, también cuando una consulta recupera el servicio. El plugin envía sus eventos al logger del SDK; la consulta admite un logger en su contexto y utiliza la consola de OpenCode por defecto. La disponibilidad no espera al indexado completo ni promete que el daemon siga activo durante toda la consulta. Una consulta posterior vuelve a comprobar el estado y puede recuperar una caída.

Los presupuestos de producción son:

| Operación o recurso | Presupuesto |
| --- | --- |
| Cada cliente de `status` | 2 segundos desde `spawn` |
| Espera de disponibilidad después del intento de lanzamiento | 5 segundos; cada comprobación usa como máximo el tiempo restante |
| Separación entre comprobaciones | Hasta 100 milisegundos, limitada por el tiempo restante |
| Cleanup de cada cliente | Hasta 5 segundos adicionales, compartidos con el runner de consultas |
| stdout retenido de cada `status` | 8 192 bytes |
| stderr retenido de cada `status` | 2 048 bytes |
| Diagnóstico de fallback incorporado al output | 1 024 bytes UTF-8, sin cortar un carácter |
| Cliente de consulta | 30 segundos desde `spawn`, más hasta 5 segundos de cleanup |

La comprobación inicial y la espera posterior tienen presupuestos separados. La suma conservadora de sus presupuestos es de hasta 17 segundos: 2 + 5 para el estado inicial y 5 + 5 para disponibilidad y su último cleanup. Un fallo de lectura, terminación o cleanup del cliente de estado detiene el intento de asegurar el servicio y se comunica como indisponibilidad, sin ocultarlo con un arranque posterior. Los tests usan plazos internos reducidos; estos parámetros no forman parte del schema de OpenCode.

Si no se asegura el servicio, la consulta fuerza `--no-index`, devuelve `current_scan` e incluye un diagnóstico acotado de la causa, también si el scan termina con un error. Si se asegura, mantiene `indexed_or_scan` y la selección conservadora del CLI. Una consulta `current` omite toda gestión del servicio desde esa ruta; el plugin sigue realizando prewarming.

El runner compartido recoge únicamente el cliente de estado o consulta y retira timers y listeners. El daemon separado conserva su ciclo de vida compartido. Ningún cierre o cancelación de consulta termina el daemon ni promete cancelar el trabajo que este haya recibido.

## Verificaciones realizadas

Entorno: Windows, Node 24.11.1, tgrep 1.0.10, OpenCode 1.18.33 y SDK `@opencode-ai/plugin` 1.18.32.

- TDD en la consulta pública: comprobación y reutilización de servicio disponible, fallback ante arranque fallido y límite global del output con diagnóstico Unicode. Se observaron los fallos antes de implementar las correcciones.
- `node --test test/tgrep-service.test.mjs`: doce tests pasan. Cubren prewarming, logs de prewarming y consulta, estado y arranque bloqueados, clientes recogidos, scan directo, concurrencia, recuperación, presupuesto UTF-8, cancelación durante el estado, errores del scan y fallos de cleanup del estado.
- Los tests existentes de consulta se adaptan al nuevo comportamiento: sus CLIs controlados responden a `status`, o utilizan `current` cuando verifican exclusivamente el ciclo de vida del cliente.
- `pnpm exec tsc --noEmit --strict --target esnext --module nodenext --moduleResolution nodenext --allowImportingTsExtensions --skipLibCheck .opencode/tools/tgrep.ts .opencode/plugins/tgrep-server.ts`: correcto, ejecutado regularmente durante la implementación.
- `pnpm check`, con `PROFILE_SITE_BASE_URL=https://fraguio.github.io/profile-site/` y `RESUME_PATH=test/fixtures/fictitious-resume.json`: cero errores, warnings e hints.
- `node --test smoke-checks/tgrep-service.mjs smoke-checks/tgrep.mjs smoke-checks/tgrep-filters.mjs smoke-checks/tgrep-freshness.mjs smoke-checks/tgrep-limits.mjs smoke-checks/tgrep-cancellation.mjs`: once tests pasan con CLI real. Verifican arranque concurrente, reutilización del PID, conservación del índice local, recuperación y supervivencia tras cancelar un cliente, además de los contratos anteriores.
- `node --test smoke-checks/tgrep-opencode.mjs`: pasa con una instancia recién iniciada que carga los módulos intactos. Descubre una única tool `tgrep` y el schema de diez parámetros; el plugin asegura el daemon sobre un índice preparado. Dos sesiones reutilizan el mismo PID, incluida una cancelación real mediante `context.abort`; otra consulta indexada recupera el servicio después de detener el daemon del fixture. El daemon recuperado sobrevive al cierre de OpenCode.
- `pnpm test`: suite completa ejecutada una vez al finalizar la implementación inicial; 113 tests de Node pasan, con una omisión POSIX en Windows, y 35 tests de Playwright pasan. Después de las correcciones de revisión se repiten los tests focalizados y verificaciones afectadas: `node --test test/tgrep-query.test.mjs test/tgrep-service.test.mjs` pasa con 44 tests y una omisión POSIX, además de tipos y los smoke tests reales.

## Fixtures y cleanup

Todos los tests de servicio usan worktrees temporales propios. Los subprocesses controlados registran acción y PID en un único evento y simulan exclusividad con un lock del fixture. Los smoke tests identifican el daemon mediante el `serve.json` de su propio worktree y recogen sus procesos antes de eliminar sus archivos e índices.

En Windows se deja avanzar el event loop antes de borrar el cwd de los daemons creados mediante `spawn`. El smoke test de OpenCode utiliza el ejecutable directo cuando está instalado mediante Chocolatey y termina exclusivamente OpenCode, sin matar su árbol de procesos: así verifica que el daemon compartido sobrevive al cierre. Los recursos residuales de los primeros intentos de smoke se limpiaron después de corregir el cleanup.

Para cargar los cambios del plugin y la tool en una sesión habitual, cerrar y reiniciar OpenCode. Los smoke tests ya verifican una instancia nueva.

## Revisión y publicación

`/code-review` abarca el diff desde el SHA inicial y los archivos nuevos todavía sin commit. Se corrigieron tres hallazgos de Spec mediante tests públicos observados en red: logs de arranque desde la consulta, conservación del fallo de cleanup del estado y del diagnóstico de fallback cuando el scan falla. También se resolvieron dos sugerencias heurísticas de Standards mediante helpers locales de lectura de registros y eventos de los fixtures.

La revisión de seguimiento concluyó con cero hallazgos pendientes en Standards y Spec. Los tests focalizados, el typecheck, `pnpm check` y el smoke de OpenCode recién iniciado pasan después de las últimas correcciones. El smoke comprueba también los logs de intento y disponibilidad en la recuperación desde una consulta real. `git diff --check` pasa.

El commit previsto es `fix(opencode): verify tgrep server availability`, firmado con GPG. El usuario autorizó expresamente el commit y la publicación de la PR después de revisar la entrega.
