# Autenticar la integración cross-repo con dos PAT

Aceptado. La v1 usa dos fine-grained PAT independientes: `PROFILE_DATA_READ_TOKEN` permite a `profile-site` leer únicamente `fraguio/profile-data` con `Contents: read`, y `PROFILE_SITE_DISPATCH_TOKEN` permite a `profile-data` emitir hacia `fraguio/profile-site` con `Contents: write`. Se prefieren dos credenciales con expiración y rotación separadas frente a un PAT compartido para reducir el blast radius; una GitHub App se aplaza porque sus credenciales de corta duración no compensan todavía el mayor coste de provisioning y mantenimiento.
