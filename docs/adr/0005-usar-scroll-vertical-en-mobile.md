# Usar scroll vertical entre el hero y el timeline en mobile

Aceptado. En mobile, el hero y el timeline forman regiones consecutivas del mismo documento y se recorren mediante scroll vertical normal, con un enlace textual desde el hero hacia la trayectoria. Se descartan las pantallas laterales y `scroll-snap` porque el resumen tiene longitud variable y no puede truncarse, el gesto horizontal puede competir con la navegación del navegador y un segundo eje complicaría teclado, zoom, degradación sin JavaScript y el futuro movimiento vertical del timeline.
