# Perfil público profesional

Contexto único para presentar y publicar una trayectoria profesional a partir de datos curriculares estructurados.

## Superficies

**Experiencia interactiva**:
La superficie pública de exploración narrativa en `/`, con timeline y mejoras progresivas.
_Avoid_: Premium, home, landing

**CV web**:
La representación lineal y ATS-oriented de la trayectoria publicada en `/read/`.
_Avoid_: Modo lectura, versión simplificada

**CV PDF**:
La representación estable descargable generada desde el CV web.
_Avoid_: Plantilla PDF, CV alternativo

**Documento ATS-oriented**:
Un documento curricular lineal, semántico y legible, orientado a extracción automatizada sin prometer compatibilidad universal con terceros.
_Avoid_: ATS-friendly

## Trayectoria

**Fuente curricular**:
El archivo JSON Resume que contiene los hechos profesionales usados por el sitio.
_Avoid_: Datos del sitio, contenido duplicado

**Revisión curricular efectiva**:
El SHA exacto de la fuente curricular que un build consume y registra.
_Avoid_: Main actual, última versión

**Timeline**:
La secuencia cronológica unificada de hitos de experiencia profesional, formación y proyectos.
_Avoid_: Lista de empleos, carrusel

**Hito**:
Un elemento fechado de experiencia profesional, formación o proyecto que aparece en el timeline.
_Avoid_: Tarjeta, evento genérico

**Habilidad asociada**:
Una tecnología, práctica o capacidad vinculada a un hito concreto.
_Avoid_: Catálogo global, skill transversal

**Publicación supersedida**:
Una ejecución automática que construyó una revisión curricular exacta pero no la publica porque existe una revisión más reciente.
_Avoid_: Build fallido, despliegue cancelado
