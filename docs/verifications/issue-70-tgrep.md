# Verificación de la issue #70

Entrega: [consultar contenido actual y mostrar contexto](https://github.com/fraguio/profile-site/issues/70).

## Preparación y alcance

- Rama: `feat/70-tgrep-current-search-context`, creada desde `origin/main` después de `git fetch origin`, con el worktree limpio.
- SHA inicial para delimitar la revisión: `485cc35c214237c01cc54d86050f196d1ea4bd57`.
- Único blocker nativo: #68, cerrado. Su commit `7fab129dcd1e26c7cb32e71d30327cd6d4648e50` es ancestro de `origin/main`, integrado mediante la PR #75.
- Consultados el cuerpo, los comentarios, los criterios de aceptación y las dependencias nativas de #70, así como las decisiones de la issue padre #67. Ninguna de las dos tenía comentarios adicionales.
- Contrato normativo: `docs/specifications/tgrep-opencode.md`. Se conserva la decisión previa de redactar en inglés las descripciones operativas de la tool y sus parámetros, registrada en las entregas #68 y #69.
- Frontera acordada: ejecución pública de `queryTgrep`, con argumentos y worktree como entrada y output, metadata o error como salida. Los tests usan subprocesses controlados sin SDK ni CLI instalado; los smoke tests verifican el CLI y OpenCode reales con fixtures aislados.

## Criterios satisfechos

- El schema expone `freshness`, enum `indexed`/`current` con default `indexed`, y `context_lines`, integer de `0–10` con default `0`. Solo `pattern` es obligatorio. La frontera de consulta también rechaza valores inválidos antes del lanzamiento.
- `current` fuerza `--no-index`, sin comprobar ni arrancar el servicio desde la consulta, y comunica `current_scan`. La selección normal del CLI comunica `indexed_or_scan`, sin afirmar que utilizó el índice ni garantizar su actualización.
- Se solicita JSON y se decodifica incrementalmente, incluidos eventos y caracteres UTF-8 repartidos entre chunks. Las rutas absolutas o relativas de los eventos se normalizan respecto al worktree y se presentan con `/`.
- Cada línea devuelta genera un registro con ruta, número, texto y clase. Se distinguen `[coincidencia]` y `[contexto]`; varios submatches de una línea no multiplican los registros. No se interpreta el protocolo separando el output por `:`.
- Se conservan Unicode, indentación y terminadores recibidos. El fixture de protocolo comprueba CRLF exacto; el CLI `tgrep 1.0.10` elimina el `\r` del archivo antes de emitir las líneas JSON. El adaptador conserva el texto que recibe, sin reconstruir terminadores que el CLI haya eliminado.
- Output y metadata incluyen modo, truncamiento y número de registros. Una consulta completa comunica `truncated: false`; la metadata usa `search_mode`, `truncated` y `record_count`, sin duplicar los registros.
- Los eventos inválidos, UTF-8 inválido, streams incompletos y códigos incompatibles con los registros producen errores de protocolo. Se preservan la clasificación de errores del CLI, los fallos de lanzamiento y stderr relevante.

## Verificaciones reproducibles

Entorno: Windows, Node `24.11.1`, `tgrep 1.0.10`, OpenCode `1.18.33` y SDK `@opencode-ai/plugin 1.18.32`.

### TDD, tests focalizados y tipos

```powershell
node --test test/tgrep-query.test.mjs
pnpm exec tsc --noEmit --strict --module nodenext --target es2023 --allowImportingTsExtensions .opencode/tools/tgrep.ts
$env:PROFILE_SITE_BASE_URL='https://fraguio.github.io/profile-site/'
pnpm check
```

Pasan 16 tests de frontera. Se observaron ciclos red → green para el resultado estructurado, el scan actual, contexto y fragmentación, validación de opciones, errores de protocolo y registros por línea. Se ejecutaron regularmente los tests focalizados y el typecheck. Astro informa cero errores, warnings y hints.

Los subprocesses controlados verifican los argumentos de scan y contexto, el modo normal sin `--no-index`, rutas con espacios, eventos fragmentados entre bytes Unicode, CRLF exacto, indentación, varias líneas y submatches, eventos inválidos y el diagnóstico de stderr. Los fixtures temporales se eliminan tras recoger el cierre de los clientes.

### CLI real

```powershell
node --test smoke-checks/tgrep.mjs smoke-checks/tgrep-filters.mjs smoke-checks/tgrep-freshness.mjs
```

Pasan ocho smoke tests. El nuevo smoke construye un índice real en un repositorio temporal con espacios, comprueba una consulta normal, modifica el archivo y verifica que `current` devuelve el texto nuevo con Unicode y tres registros: contexto anterior, coincidencia con dos submatches y contexto posterior. Comprueba la ausencia de coincidencias con `context_lines: 10` y que las consultas no arrancaron un daemon. El cleanup elimina el repositorio y su índice.

Los smoke tests anteriores se adaptan al resultado estructurado y vuelven a verificar patrones, filtros, tipos, ignore rules y junctions. El scan para recuperar un archivo ignorado ahora se solicita mediante la opción pública `freshness: "current"`.

### OpenCode recién iniciado

```powershell
node --test smoke-checks/tgrep-opencode.mjs
```

Pasa el smoke con un repositorio aislado, un daemon propio y una instancia nueva de OpenCode. La API real confirma las nueve propiedades del schema, defaults, enum y rango; los helpers no aparecen como tools adicionales. El modelo realiza seis consultas, incluida `freshness: "current"` con contexto. Las respuestas comprueban las clases de registro, Unicode, indentación y metadata del SDK en ambos modos. El servicio compartido sigue vivo al terminar las consultas. El cleanup recoge únicamente los procesos del fixture y elimina sus archivos, índice y enlace al SDK.

Las sesiones de OpenCode que ya estuvieran abiertas deben cerrarse y reiniciarse para cargar el schema y la implementación nuevos.

## Suite final y revisión

`pnpm test` se ejecutó una vez al finalizar la implementación: pasan 88 tests de Node y 35 tests de Playwright. `git diff --check` pasa.

La revisión `/code-review` se delimita por el SHA inicial e incluye los cambios todavía sin commit y los archivos nuevos de esta entrega. Se realizaron dos revisiones independientes en paralelo:

- **Standards:** cero infracciones documentadas; un posible `Duplicated Code` de prioridad baja en el predicado de escape del worktree. Se extrajo el predicado compartido, manteniendo la resolución real del ámbito y la normalización léxica de eventos.
- **Spec:** un defecto P3 en la coerción de `type`: un array podía aceptarse y descartarse silenciosamente. Se añadió una regresión pública, se observó su fallo y se corrigió la validación para exigir un string del conjunto admitido.

Después de las correcciones vuelven a pasar los 16 tests focalizados, el typecheck contra el SDK, los ocho smoke tests del CLI y el smoke de OpenCode con una nueva instancia. La suite completa conserva su única ejecución final; las correcciones se verificaron mediante los checks afectados.

La revisión de seguimiento confirma que ambos hallazgos están resueltos: cero infracciones o smells relevantes pendientes en Standards y cero requisitos ausentes, ampliaciones de alcance o defectos pendientes en Spec.

El commit previsto es `feat(opencode): add current searches and match context`, firmado con GPG y únicamente después de la revisión y autorización expresa del desarrollador.

Según las dependencias nativas consultadas, integrar esta entrega y cerrar #70 desbloqueará directamente #71, límites y truncamiento. La PR deberá incluir `Closes #70`; el cierre se producirá al integrarla.
