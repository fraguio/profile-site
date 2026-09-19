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

**Revisión curricular vigente**:
El SHA del commit más reciente alcanzable desde `profile-data/main` que modificó la fuente curricular canónica.
_Evitar_: HEAD de main, último commit del repositorio

**Revisión curricular publicada**:
El SHA exacto de la fuente curricular que presentan actualmente las superficies públicas.
_Evitar_: Revisión vigente, última versión

**Timeline**:
La secuencia cronológica unificada de hitos de experiencia profesional, formación y proyectos.
_Evitar_: Lista de empleos, carrusel

**Hito**:
Un elemento fechado de experiencia profesional, formación o proyecto que aparece en el timeline.
_Evitar_: Tarjeta, evento genérico

**Habilidad asociada**:
Una tecnología, práctica o capacidad vinculada a un hito concreto.
_Evitar_: Catálogo global, skill transversal

**Publicación del perfil**:
La actualización deliberada y conjunta de la Experiencia interactiva, el CV web y el CV PDF a partir de una revisión curricular efectiva elegida.
_Evitar_: Sincronización automática, publicación curricular
