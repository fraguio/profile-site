# Consumir una revisión curricular exacta

Aceptado. Todo build que consume `profile-data` usa y registra una revisión curricular exacta; los pull requests usan un fixture ficticio. Esto evita que una actualización posterior cambie silenciosamente el contenido asociado a un evento y permite decidir la publicación sobre una revisión reproducible.

## Alternativas consideradas

- Leer siempre la rama principal en el inicio del job: descartado porque no identifica con precisión el contenido que originó el evento.
