# Perfil público profesional

Contexto único para presentar y publicar una trayectoria profesional a partir de datos curriculares estructurados.

## Superficies

**Experiencia interactiva**:
La superficie pública de exploración narrativa en `/`, con timeline y mejoras progresivas.
_Evitar_: Premium, home, landing

**CV web**:
La representación lineal y ATS-oriented de la trayectoria publicada en `/read/`.
_Evitar_: Modo lectura, versión simplificada

**CV PDF**:
La representación estable y descargable generada desde el CV web.
_Evitar_: Plantilla PDF, CV alternativo

**Documento ATS-oriented**:
Un documento curricular lineal, semántico y legible, orientado a extracción automatizada sin prometer compatibilidad universal con terceros.
_Evitar_: ATS-friendly

## Trayectoria

**Fuente curricular**:
El archivo JSON Resume que contiene los hechos profesionales usados por el sitio.
_Evitar_: Datos del sitio, contenido duplicado

**Revisión curricular efectiva**:
El SHA exacto de la fuente curricular que un build consume y registra.
_Evitar_: Main actual, última versión

**Timeline**:
La secuencia cronológica unificada de hitos de experiencia profesional, formación y proyectos.
_Evitar_: Lista de empleos, carrusel

**Hito**:
Un elemento fechado de experiencia profesional, formación o proyecto que aparece en el timeline.
_Evitar_: Tarjeta, evento genérico

**Habilidad asociada**:
Una tecnología, práctica o capacidad vinculada a un hito concreto.
_Evitar_: Catálogo global, skill transversal

**Publicación supersedida**:
Una ejecución automática que construyó una revisión curricular exacta pero no la publica porque existe una revisión más reciente.
_Evitar_: Build fallido, despliegue cancelado
