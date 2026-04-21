# Política de comandos

Este repositorio usa una estrategia de dos capas para los flujos de OpenSpec.

- `opsx-*`: comandos upstream generados por OpenSpec.
- `ospec-*`: comandos de overlay del proyecto con guardrails locales.

## Reglas

- No editar manualmente archivos `opsx-*`.
- Poner el comportamiento específico del proyecto solo en `ospec-*`.
- Mantener artefactos OpenSpec (`proposal`, `design`, `tasks`, `specs`) en inglés.
- Mantener documentación de contexto del repositorio en español.

## Flujo de actualizacion

1. Actualizar o reinicializar OpenSpec para que `opsx-*` refleje el estado upstream.
2. Validar que los comandos `ospec-*` sigan alineados con el comportamiento actual de OpenSpec.
3. Ejecutar un smoke test con un cambio de ejemplo:
   - `/ospec-propose`
   - `/ospec-apply`
