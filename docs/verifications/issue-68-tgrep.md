# Verificación de la issue #68

Entrega: [diferenciar coincidencias, ausencia de resultados y errores](https://github.com/fraguio/profile-site/issues/68).

## Preparación y alcance

- Rama: `fix/68-tgrep-exit-codes`.
- SHA inicial para la revisión: `af4cae2f9ad49a9bc621ae1d15a4b317ef16b816`.
- Dependencias nativas de #68: ninguna. La integración previa #65 está cerrada y el commit `78d785dfdf5ca390ac8880473a19e79e9e1e74aa` es ancestro de `origin/main`.
- Consultados el cuerpo y los comentarios de #68 y #67; no había comentarios adicionales.
- Contrato normativo: `docs/specifications/tgrep-opencode.md`. La conversión de JSON, la metadata y freshness corresponden a #70; los límites, la cancelación y la recuperación del servicio tienen sus propias entregas.
- La frontera pública es `queryTgrep`: argumentos de consulta y worktree como entrada, output o error como salida. La selección del ejecutable permite usar subprocesses controlados sin importar el SDK ni instalar `tgrep`.

## Verificaciones reproducibles

Entorno utilizado: Windows 10 Pro `10.0.19045`, Node `24.11.1`, `tgrep 1.0.10`, OpenCode `1.18.33` y SDK `@opencode-ai/plugin 1.18.32`.

### Tests focalizados y tipos

```powershell
node --test test/tgrep-query.test.mjs
pnpm exec tsc --noEmit --strict --module nodenext --target es2023 --allowImportingTsExtensions .opencode/tools/tgrep.ts
$env:PROFILE_SITE_BASE_URL='https://fraguio.github.io/profile-site/'
pnpm check
```

Los ocho tests de contrato verifican coincidencias, ausencia de resultados, stderr como error o advertencia, ejecutable ausente, fallo de lanzamiento síncrono, códigos de error adicionales y patrones intactos después de `--`. Se recorren espacios, comillas, prefijos `-`, subcomandos y caracteres de shell con subprocesses reales controlados. Se observaron los fallos esperados antes de implementar cada comportamiento nuevo. El typecheck del adaptador contra el SDK y el check de Astro pasan; Astro informa cero errores, warnings y hints.

### CLI real

```powershell
node --test smoke-checks/tgrep.mjs
```

El smoke test pasa con un fixture temporal cuya ruta incluye espacios. Confirma regex, distinción de mayúsculas, números de línea, coincidencias, ausencia de resultados, regex inválida y patrones con espacios, comillas, prefijos `-` y nombres de subcomandos. El fixture y cualquier índice que el CLI cree se eliminan al finalizar.

### OpenCode recién iniciado

```powershell
node --test smoke-checks/tgrep-opencode.mjs
```

Requiere el SDK instalado en `.opencode/node_modules`, `git`, `tgrep`, OpenCode y credenciales para el modelo. El default es `openai/gpt-6.1-sol`; se puede seleccionar otro mediante `OPENCODE_SMOKE_MODEL`.

El smoke test prepara un repositorio temporal aislado y copia la tool, la frontera pública y el plugin. Inicia un daemon propio, espera su disponibilidad y lanza una instancia nueva de OpenCode. Comprueba mediante la API real el descubrimiento de `tgrep`, su schema con únicamente `pattern` y la ausencia de helpers como tools adicionales. Un modelo ejecuta consultas con coincidencias, sin coincidencias y con regex inválida: las dos primeras terminan como llamadas válidas y la tercera como error con diagnóstico. El daemon sigue vivo después de las consultas. El cleanup termina únicamente los procesos de la prueba, espera su cierre y elimina el fixture, el enlace al SDK y el índice.

La sesión de OpenCode que ya estuviera abierta conserva la implementación anterior: hay que cerrarla y reiniciarla para cargar esta entrega.

## Suite final y revisión

Comando de la suite completa del repositorio: `pnpm test`.

La suite completa se ejecutó una vez al finalizar la implementación y pasó: 80 tests de Node y 35 tests de Playwright (31 de la configuración principal, uno de categorías vacías, uno de contenido largo y dos de panel mobile).

La revisión de `/code-review` incluyó el diff desde el SHA inicial y los archivos nuevos todavía sin commit, mediante dos revisiones independientes de estándares y contrato. No encontró incumplimientos de estándares ni defectos funcionales de #68. Se corrigió un hallazgo de cleanup del smoke de OpenCode: el polling y las peticiones HTTP ahora observan la señal de cancelación del test, y la espera del daemon tiene un plazo total propio. Tras la corrección se repitió el smoke real de OpenCode y pasó.

Ambas revisiones confirmaron la corrección; no quedan hallazgos de estándares ni de contrato dentro del alcance de #68.

Después de la revisión, el desarrollador autorizó conservar en inglés las descripciones operativas de la tool y de `pattern`, por consistencia con la integración inicial. Se mantuvieron las aclaraciones de comportamiento y se repitieron satisfactoriamente el typecheck del adaptador y el smoke con OpenCode recién iniciado.

El commit previsto es `fix(opencode): handle tgrep exit codes correctly`, con firma GPG y después de la autorización explícita del desarrollador.

Al integrar la PR y cerrar #68 se desbloquearán directamente #69 y #70, según las dependencias nativas consultadas en GitHub.
