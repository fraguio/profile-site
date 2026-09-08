# Documentación de dominio

Cómo deben consumir las engineering skills la documentación de dominio de este repo al explorar el codebase.

## Antes de explorar, lee esto

- **`CONTEXT.md`** en la raíz del repo.
- **`CONTEXT-MAP.md`** en la raíz del repo si existe: apunta a un `CONTEXT.md` por contexto. Lee cada uno que sea relevante para el tema.
- **`docs/adr/`**: lee los ADRs que toquen el área donde vas a trabajar. En repos multi-contexto, revisa también `src/<context>/docs/adr/` para decisiones específicas del contexto.

Si alguno de estos archivos no existe, **continúa en silencio**. No señales su ausencia y no sugieras crearlos de entrada. La skill `/domain-modeling`, alcanzada mediante `/grill-with-docs` y `/improve-codebase-architecture`, los crea de forma perezosa cuando realmente se resuelven términos o decisiones.

## Estructura de archivos

Repo de contexto único, que cubre la mayoría de repos:

```text
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Repo multi-contexto, indicado por la presencia de `CONTEXT-MAP.md` en la raíz:

```text
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← decisiones de sistema
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← decisiones específicas del contexto
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## Usa el vocabulario del glosario

Cuando tu salida nombre un concepto de dominio, ya sea en el título de un issue, una propuesta de refactor, una hipótesis o el nombre de un test, usa el término definido en `CONTEXT.md`. No derives hacia sinónimos que el glosario evita explícitamente.

Si el concepto que necesitas no está todavía en el glosario, eso es una señal: o estás inventando lenguaje que el proyecto no usa, o hay una brecha real. Reconsidéralo o anótalo para `/domain-modeling`.

## Señala conflictos con ADRs

Si tu salida contradice un ADR existente, hazlo explícito en lugar de sobrescribirlo en silencio:

> _Contradice ADR-0007 (event-sourced orders), pero vale la pena reabrirlo porque..._
