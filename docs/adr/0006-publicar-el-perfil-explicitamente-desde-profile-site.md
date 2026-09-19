# Publicar el perfil explícitamente desde `profile-site`

Aceptado. `profile-site` es el único responsable de iniciar una Publicación del perfil: una release manual desde su rama `main` elige una revisión curricular exacta y alcanzable desde `profile-data/main`, supera los gates y requiere aprobación del entorno protegido antes de sustituir el site público. Se descartan el dispatch desde `profile-data`, la publicación automática por cambios de código o datos y `latest-wins` porque acoplan la edición con la publicación e impiden conservar deliberadamente una revisión curricular sin hacerla pública.

La integración cross-repo queda reducida a lectura: `profile-site` conserva un fine-grained PAT limitado a `fraguio/profile-data` con `Contents: read`; `profile-data` no necesita conocer ni poder modificar `profile-site`.
