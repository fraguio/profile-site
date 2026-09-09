# Gestor de issues: GitHub

Los issues y specs de este repo viven en GitHub Issues para `fraguio/profile-site`. Usa la CLI `gh` para todas las operaciones.

## Convenciones

- **Crear un issue**: `gh issue create --title "..." --body "..."`. Usa un heredoc para cuerpos multilínea.
- **Leer un issue**: `gh issue view <number> --comments`, filtrando comentarios con `jq` y obteniendo también las etiquetas.
- **Listar issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` con filtros `--label` y `--state` adecuados.
- **Comentar un issue**: `gh issue comment <number> --body "..."`
- **Aplicar o quitar etiquetas**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Cerrar**: `gh issue close <number> --comment "..."`

Infiere el repo desde `git remote -v`; `gh` lo hace automáticamente cuando se ejecuta dentro del clon.

## Pull requests como superficie de triage

**PRs as a request surface: no.** _(Cámbialo a `yes` si este repo trata PRs externos como solicitudes de features; `/triage` lee esta marca.)_

Cuando esté en `yes`, los PRs pasan por las mismas etiquetas y estados que los issues, usando los equivalentes de `gh pr`:

- **Leer un PR**: `gh pr view <number> --comments` y `gh pr diff <number>` para el diff.
- **Listar PRs externos para triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` y conservar solo `authorAssociation` con `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR` o `NONE`; descartar `OWNER`, `MEMBER` y `COLLABORATOR`.
- **Comentar, etiquetar o cerrar**: `gh pr comment`, `gh pr edit --add-label` / `--remove-label`, `gh pr close`.

GitHub comparte un único espacio numérico entre issues y PRs, así que un `#42` puede ser cualquiera de los dos: resuélvelo con `gh pr view 42` y, si falla, usa `gh issue view 42`.

## Cuando una skill dice "publish to the issue tracker"

Crea un issue en GitHub.

## Cuando una skill dice "fetch the relevant ticket"

Ejecuta `gh issue view <number> --comments`.

## Operaciones de wayfinding

Usado por `/wayfinder`. El **mapa** es un único issue con issues **hijos** como tickets.

- **Mapa**: un único issue etiquetado `wayfinder:map`, que contiene Notes / Decisions-so-far / Fog en el cuerpo. `gh issue create --label wayfinder:map`.
- **Ticket hijo**: un issue enlazado al mapa como sub-issue de GitHub (`gh api` sobre el endpoint de sub-issues). Cuando sub-issues no esté habilitado, añade el hijo a una task list en el cuerpo del mapa y pon `Part of #<map>` al inicio del cuerpo del hijo. Etiquetas: `wayfinder:<type>` (`research` / `prototype` / `grilling` / `task`). Cuando se reclama, el ticket se asigna al dev que lo conduce.
- **Bloqueo**: las **dependencias nativas de issues** de GitHub son la representación canónica visible en la UI. Añade una arista con `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, donde `<blocker-db-id>` es el **database id** numérico del blocker (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, no el `#number` ni el `node_id`). GitHub informa `issue_dependencies_summary.blocked_by` con blockers abiertos. Cuando las dependencias no estén disponibles, usa como fallback una línea `Blocked by: #<n>, #<n>` al inicio del cuerpo del hijo. Un ticket queda desbloqueado cuando todos sus blockers están cerrados.
- **Consulta de frontera**: lista los hijos abiertos del mapa (`gh issue list --state open`, acotado a los sub-issues o la task list del mapa), descarta cualquiera con un blocker abierto (`issue_dependencies_summary.blocked_by > 0`, o un issue abierto en la línea `Blocked by`) o con assignee; gana el primero en el orden del mapa.
- **Reclamar**: `gh issue edit <n> --add-assignee @me`, la primera escritura de la sesión.
- **Resolver**: `gh issue comment <n> --body "<answer>"`, luego `gh issue close <n>`, luego añade un puntero de contexto (gist + enlace) a Decisions-so-far en el mapa.
