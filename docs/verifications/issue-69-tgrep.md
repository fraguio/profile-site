# Verificación de la issue #69

Entrega: [buscar por ámbito, filtros y texto literal](https://github.com/fraguio/profile-site/issues/69).

## Preparación y alcance

- Rama: `feat/69-tgrep-search-filters`, creada desde `origin/main` con el worktree limpio tras `git fetch origin main`.
- SHA inicial para la revisión: `7986d8983294fadb26e2eb4a13bc235e2928b6b9`.
- Único blocker nativo: #68, cerrado. Su commit `7fab129dcd1e26c7cb32e71d30327cd6d4648e50` es ancestro de `origin/main`; su PR #75 está integrada.
- Consultados el cuerpo, los comentarios y los criterios de #69 y de la issue padre #67; no había comentarios adicionales.
- Contrato normativo: `docs/specifications/tgrep-opencode.md`.
- Frontera pública de tests: `queryTgrep`, con argumentos y worktree como entrada y output o error como salida. Los tests de contrato usan subprocesses controlados sin SDK ni `tgrep` instalado; los smoke tests tienen ejecución explícita con el CLI real.

## Criterios satisfechos

- El schema expone `path`, `literal`, `ignore_case`, `glob`, `file_types` y `hidden`, con descripciones operativas. Solo `pattern` es obligatorio.
- Todos los argumentos de `describe()` se conservan en inglés, conforme a la decisión de #68 registrada en `docs/verifications/issue-68-tgrep.md:59` y reafirmada por el desarrollador para esta entrega.
- Se conservan los defaults: todo el worktree, regex sensible a mayúsculas, sin ocultos ni filtros. La búsqueda sobre un único archivo incluye su nombre mediante `-H` para mantener resultados localizables.
- Las rutas relativas parten del worktree y las absolutas se admiten dentro de él. Se comprueban existencia y pertenencia del destino real, incluidos junctions, antes del lanzamiento.
- Los tipos inválidos y strings con NUL se rechazan antes de lanzar el cliente. Los globs y tipos válidos se delegan al CLI, que conserva sus diagnósticos de filtros inválidos.
- Se verifica literal frente a regex, mayúsculas, ámbitos con espacios, globs de inclusión y exclusión, tipos y archivos y directorios ocultos. `hidden` no desactiva las ignore rules y los ámbitos explícitos conservan la semántica del CLI.
- Las descripciones explican que un glob sobre un índice filtra su corpus y no recupera archivos ignorados, mientras que un scan puede reincorporarlos mediante overrides positivos.
- El adaptador pasa el typecheck contra el SDK instalado. Una instancia nueva de OpenCode presenta el schema ampliado y el modelo ejecuta consultas con las opciones nuevas.

## Verificaciones reproducibles

Entorno: Node `24.11.1`, `tgrep 1.0.10`, OpenCode `1.18.33` y SDK `@opencode-ai/plugin 1.18.32`, en Windows.

### Tests focalizados y tipos

```powershell
node --test test/tgrep-query.test.mjs
pnpm exec tsc --noEmit --strict --module nodenext --target es2023 --allowImportingTsExtensions .opencode/tools/tgrep.ts
$env:PROFILE_SITE_BASE_URL='https://fraguio.github.io/profile-site/'
pnpm check
```

Pasan 11 tests de contrato: los ocho anteriores y las verificaciones de ámbito desde otro cwd, destinos externos o inexistentes y validación de tipos y NUL. Se admite un junction interno y se rechaza un junction externo y sus archivos. Se observaron fallos antes de implementar los comportamientos nuevos mediante ciclos TDD en la frontera pública. Se ejecutaron regularmente el archivo focalizado y el typecheck. Astro informa cero errores, warnings y hints.

### CLI real

```powershell
node --test smoke-checks/tgrep.mjs
node --test smoke-checks/tgrep-filters.mjs
```

Pasan el smoke anterior y los seis nuevos smoke tests con fixtures temporales aislados y rutas con espacios. Verifican literal/regex, mayúsculas, filtros combinados, errores de glob y tipo, valores de filtros con prefijo `-`, ocultos y ignore rules, ámbitos explícitos y el no seguimiento de junctions durante un scan de directorio. Un índice local real verifica que los globs positivos no recuperan archivos ignorados y que un scan forzado admite los overrides del CLI. El scan se fuerza únicamente en el comando del fixture; la opción pública de freshness pertenece a #70. El cleanup elimina los repositorios temporales, índices y junctions; estas pruebas no arrancan daemons.

### OpenCode recién iniciado

```powershell
node --test smoke-checks/tgrep-opencode.mjs
```

Pasa el smoke con un repositorio temporal aislado, un daemon propio y una instancia nueva de OpenCode. La API real confirma las siete propiedades del schema, sus tipos y que solo `pattern` es obligatorio; los helpers no aparecen como tools adicionales. El modelo ejecuta las tres consultas anteriores y dos nuevas: ámbito con espacios y búsqueda literal sin distinguir mayúsculas con globs y tipos, y una consulta de configuración oculta con globs y tipos. Se comprueban sus argumentos y resultados observables. El daemon compartido sigue vivo tras las consultas. El cleanup termina únicamente los procesos del fixture, espera sus cierres y elimina el repositorio, el índice y el enlace al SDK.

Una sesión de OpenCode que ya estuviera abierta debe cerrarse y reiniciarse para cargar el nuevo schema y la implementación.

## Suite final y revisión

`pnpm test` se ejecutó una vez al finalizar la implementación: pasan 83 tests de Node y 35 tests de Playwright (31 de la configuración principal, uno de categorías vacías, uno de contenido largo y dos de panel mobile).

`git diff --check` pasa. `/code-review` revisó los cambios desde el SHA inicial, incluidos el worktree y los dos archivos nuevos todavía sin commit, mediante dos revisiones independientes en paralelo:

- **Standards:** cero incumplimientos documentados y cero smells relevantes.
- **Spec:** cero requisitos ausentes o parciales, cero ampliaciones de alcance y cero defectos identificados dentro de #69.

No quedan hallazgos pendientes.

Tras la revisión inicial, el desarrollador recordó la decisión de conservar en inglés las descripciones operativas. Se corrigieron los siete argumentos de `describe()` sin alterar su semántica y se repitieron satisfactoriamente el typecheck contra el SDK y el smoke con OpenCode recién iniciado. La revisión de seguimiento de `/code-review` confirmó cero hallazgos en ambos ejes para este ajuste.

El commit previsto es `feat(opencode): add tgrep search filters`, con firma GPG y únicamente tras autorización expresa del desarrollador.

Según las dependencias nativas consultadas, #69 no bloquea directamente ningún ticket; integrarla completa esta entrega de #67.
