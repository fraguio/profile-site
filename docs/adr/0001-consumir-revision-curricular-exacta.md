# Consumir una revisión curricular exacta

Aceptado. Cada build de publicación resuelve y registra un SHA curricular efectivo; los dispatch consumen el SHA recibido y las demás ejecuciones resuelven su referencia antes de validar. Esto evita que una actualización posterior cambie silenciosamente el contenido asociado a un evento y permite aplicar `latest-wins` solo antes de publicar una revisión ya reproducible.

## Alternativas consideradas

- Leer siempre la rama principal en el inicio del job: descartado porque no identifica con precisión el contenido que originó el evento.
