# Flujo simple OpenSpec + Skills

Este documento fija el flujo de trabajo acordado para `profile-site`.

Objetivo: mantener el proceso simple para un proyecto pequeno, sin perder calidad tecnica ni ritmo de entrega.

## Estado del documento

- Este es el documento canonico para la operativa diaria.
- Si hay conflicto con otros documentos de workflow, prevalece este archivo.
- El documento `docs/workflow/openspec-opencode.md` se mantiene como contexto historico de evolucion.

## Decisiones de uso de skills

- `grill-me`: usar (alto valor) para aclarar ideas y decisiones antes de implementar.
- `to-prd`: no usar por ahora.
- `to-issues`: no usar por ahora.
- `tdd`: usar en implementacion dentro de `/ospec-apply`.
- `improve-codebase-architecture`: usar solo por disparador, cuando aparezca friccion real.

## Como integrar `tdd` sin complicar

- **Unidad de trabajo fija**: 1 tarea OpenSpec (`X.Y`) = 1 mini-ciclo TDD.
- **Secuencia por tarea**:
  1. Definir comportamiento observable de la tarea.
  2. Escribir test que falla (RED).
  3. Implementar minimo para pasar (GREEN).
  4. Hacer refactor pequeno manteniendo verde.
- **Regla clave**: tests por interfaz publica/comportamiento, no por detalles internos.
- **Guardrail practico**: no abrir la siguiente tarea hasta cerrar el ciclo TDD de la actual.
- **Con el flujo actual**: mantener `/ospec-apply <change> scope=1.2 review_gate=true commit_prep=true` y ejecutar ese ciclo dentro del scope.

## Como integrar `improve-codebase-architecture` por disparador

- Activarlo solo cuando aparezcan senales reales durante implementacion:
  - una tarea crece demasiado,
  - duplicacion repetida,
  - modulo dificil de testear,
  - cambios pequenos que obligan a tocar muchos archivos.
- Cuando dispare:
  1. Pausa breve de implementacion.
  2. Exploracion arquitectonica acotada.
  3. Decidir si vale la pena ahora.
- Si vale la pena: abrir cambio OpenSpec separado de arquitectura (pequeno y con tareas atomicas).
- Si no vale la pena ahora: continuar tarea actual y dejar nota breve en `design.md` o `tasks.md` del cambio activo (sin overengineering).

## Plantilla operativa minima

0. Crear rama de trabajo (no implementar directamente en `main`).
1. `grill-me` (si hay dudas de alcance/diseno).
2. `/ospec-propose <change>`.
3. `/ospec-apply <change> scope=X.Y review_gate=true commit_prep=true`.
4. Ejecutar TDD completo en esa `X.Y`.
5. Si emerge deuda arquitectonica, evaluar disparador y, solo si compensa, nuevo cambio OpenSpec.
6. `/opsx-archive` al completar.

## Trazabilidad

No usamos issues en este proyecto por ahora.

- La trazabilidad de trabajo se mantiene en `tasks.md`.
- OpenSpec se mantiene como fuente de verdad de alcance, diseno y ejecucion.
