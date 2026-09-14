# Publicar como project site de GitHub Pages

Aceptado. La v1 se publica mediante GitHub Actions en `https://fraguio.github.io/profile-site/` y `PROFILE_SITE_BASE_URL` representa esa URL pública completa. El build deriva el origin y el base path para Astro porque separar su configuración del contrato público permitiría generar canonical, enlaces o smoke tests inconsistentes; usar la raíz de `github.io` queda descartado porque este repositorio es un project site y no hay dominio propio en esta fase.
