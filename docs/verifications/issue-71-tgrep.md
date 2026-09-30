# Verificación de la issue #71: límites y truncamiento de tgrep

## Base y alcance

- Issue: <https://github.com/fraguio/profile-site/issues/71>.
- Contrato: `docs/specifications/tgrep-opencode.md`; la issue padre #67 no tenía comentarios adicionales al consultar GitHub.
- Rama: `feat/71-bound-tgrep-output`.
- SHA inicial: `fb1e79608b4908fa69ea103a3f4f02c1615e719e`.
- Worktree inicialmente limpio; `origin/main` actualizado antes de crear la rama.
- El único blocker nativo, #70, está cerrado y su merge #77 está integrado en el SHA inicial.
- La integración desbloqueará directamente #72, timeout y cancelación.

## Presupuestos durante la lectura

- `max_results`: default `100`, integer de `1–1000`. Cuenta líneas de coincidencia y contexto, no submatches. Una consulta que finaliza naturalmente con exactamente ese número permanece completa; el siguiente registro provoca truncamiento.
- Output: máximo contractual de `48 000` bytes UTF-8. Los registros renderizados disponen de `38 000` bytes; stderr dispone de `8 192` bytes. Los `1 808` restantes reservan espacio para cabecera, número de registros y avisos de longitud fija.
- Evento JSON: máximo de `256 000` bytes UTF-8 por evento, incluido el pendiente sin newline. Se verifica antes de añadir cada fragmento. Un evento excesivo provoca `event_bytes` sin interpretarse como ausencia de coincidencias.
- Estado de protocolo: máximo de `1 000` archivos abiertos y `256 000` bytes UTF-8 agregados de sus rutas. Se evita retener indefinidamente eventos `begin` sin registros ni `end`.
- Motivos observables: `max_results`, `output_bytes`, `event_bytes`, `protocol_state_bytes` y `stderr_bytes`. No se recorta silenciosamente una fila para hacerla caber.
- Stderr se conserva como un prefijo acotado tanto en bytes originales como en bytes UTF-8 renderizados. Se evita introducir un carácter de reemplazo al cortar dentro de un carácter válido; los bytes inválidos pueden sustituirse sin ampliar el diagnóstico más allá de su presupuesto. Su exceso interrumpe el cliente y se comunica como `stderr_bytes`.
- La metadata contiene únicamente modo, estado de truncamiento, motivo cuando existe y número de registros; no duplica las filas.
- La terminación por límites usa exclusivamente el cliente y espera su cierre. El cleanup tiene un plazo de cinco segundos y comunica fallos explícitos. No detiene el daemon ni garantiza que este deje de procesar el trabajo recibido.
- Los errores de protocolo ya observados y los códigos reales de fallo conservan su clasificación frente a un truncamiento posterior.

## OpenCode

El smoke real detectó que OpenCode `1.18.33` sobrescribe `metadata.truncated` con el estado de su propio recorte de output. El hook `tool.execute.after` del plugin existente conserva `truncated: true` cuando la consulta comunica `truncation_reason`. Se verificó después con una instancia nueva de OpenCode, sin introducir otra tool o plugin.

Las descripciones operativas se mantienen en inglés siguiendo la decisión previa de #68 y #69. Para cargar los cambios en una sesión habitual, salir y reiniciar OpenCode.

## Verificaciones realizadas

Entorno: Windows, Node `24.11.1`, tgrep `1.0.10`, OpenCode `1.18.33` y SDK `@opencode-ai/plugin 1.18.32`.

- Ciclos TDD en la frontera pública: fallo inicial para límite global, presupuesto UTF-8 y streams excesivos; posteriormente pasan.
- `node --test test/tgrep-query.test.mjs`: 23 tests pasan. Incluyen resultados por debajo, exactamente en el límite y por encima, contexto, submatches, Unicode, fila enorme, evento incompleto excesivo, mucho stderr, stderr inválido, estado agregado del protocolo, validación previa y recogida del PID del cliente.
- `pnpm exec tsc --noEmit --strict --module nodenext --target es2023 --allowImportingTsExtensions .opencode/tools/tgrep.ts .opencode/plugins/tgrep-server.ts`: pasa.
- `pnpm check`, con `PROFILE_SITE_BASE_URL=https://fraguio.github.io/profile-site/`: cero errores, warnings y hints.
- `node --test smoke-checks/tgrep.mjs smoke-checks/tgrep-filters.mjs smoke-checks/tgrep-freshness.mjs smoke-checks/tgrep-limits.mjs`: nueve smoke tests pasan con CLI real.
- `node --test smoke-checks/tgrep-opencode.mjs`: pasa tras reiniciar el servidor del fixture. Comprueba las diez propiedades del schema, rango y default de `max_results`, siete consultas reales del modelo, output y metadata de truncamiento, y disponibilidad del daemon tras interrumpir el cliente.
- Los smoke tests usan worktrees aislados y recogen sus archivos, índices y procesos propios.
- `pnpm test`: suite completa ejecutada una vez al finalizar la implementación inicial; 93 tests de Node y 35 de Playwright pasan. Tras las correcciones de revisión se repitieron los 23 tests focalizados, typecheck y smoke tests afectados del CLI y OpenCode, todos satisfactorios.
- `git diff --check`: pasa.

## Revisión y publicación

La revisión se delimita por el SHA inicial e incluye los cambios sin commit. El desarrollador autorizó expresamente el commit `feat(opencode): bound tgrep search output` y la publicación de la PR. La firma GPG debe verificarse antes del push; la PR registra el SHA y la comprobación de la firma publicada.

La revisión inicial `/code-review` comunicó cero hallazgos en Standards y dos en Spec: expansión de stderr inválido al renderizar y memoria de rutas abiertas sin presupuesto agregado. Ambos se reprodujeron con tests públicos en red, se corrigieron y se verificaron con los tests afectados.

La revisión de seguimiento confirmó ambos hallazgos corregidos: cero hallazgos pendientes en Standards y cero en Spec, incluyendo los cambios sin commit y los archivos nuevos.
