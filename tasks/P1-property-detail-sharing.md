# P1 - Detalle De Propiedad Y Compartir

## P1-01 - Definir Pagina De Detalle Individual

### Problema

El sitio usa modal para ver propiedades y no expone claramente una URL compartible por propiedad.

### Impacto

Una inmobiliaria necesita compartir fichas por WhatsApp, redes sociales y campanas.

### Archivos Probables

- `pages/property-detail.html`
- `pages/properties.html`
- `js/main.js`
- `server.js`

### Criterios De Aceptacion

- Cada card ofrece un link directo a la ficha.
- La URL incluye el identificador de propiedad.
- Si el identificador no existe, se muestra error controlado.
- El enlace se puede compartir y abre la misma propiedad.

### Notas Tecnicas

Ya existe `pages/property-detail.html?id=X`; decidir si se usa esa URL o se agrega ruta amigable.

## P1-02 - CTA Ver Detalle Es Enganoso

### Problema

En las cards aparece "VER DETALLE", pero el click abre una vista/modal que tambien funciona como galeria.

### Impacto

El usuario no entiende si vera fotos, detalle completo o navegara a otra pagina.

### Archivos Probables

- `js/main.js`
- `pages/properties.html`

### Criterios De Aceptacion

- El CTA describe la accion real.
- Si abre modal, el texto indica "Ver fotos y detalle" o similar.
- Si navega a ficha, el texto indica "Ver ficha".
- La accion es consistente en toda la card.

### Notas Tecnicas

Resolver junto con la tarea de URL compartible para evitar doble comportamiento.

## P1-03 - WhatsApp Inconsistente

### Problema

El modal usa `wa.me/5491175259500`, mientras otras partes usan `wa.me/message/CT6J2GLTSVDZG1`.

### Impacto

El contacto puede llegar a canales distintos y dificulta medir conversiones.

### Archivos Probables

- `js/main.js`
- `pages/property-detail.html`
- `pages/contacto.html`
- `index.html`

### Criterios De Aceptacion

- Hay un unico link o numero canonico de WhatsApp.
- Todos los CTAs usan ese valor.
- El mensaje incluye el titulo y link de la propiedad cuando corresponde.
- El valor esta centralizado o documentado.

### Notas Tecnicas

Confirmar con negocio si el canal correcto es numero directo o link de WhatsApp Business.
