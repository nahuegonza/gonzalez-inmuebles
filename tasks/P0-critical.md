# P0 - Bugs Criticos

## P0-01 - Filtros De Propiedades Muestran Todo Cuando No Hay Resultados

### Problema

En `js/main.js`, `renderPublicProperties()` decide si usa `filteredProperties` o `properties` con esta condicion:

```js
const displayProperties = (filteredProperties.length > 0 || window.location.search)
  ? filteredProperties.filter(isPublished)
  : properties.filter(isPublished);
```

Si el usuario filtra por una combinacion sin resultados, `filteredProperties.length` es `0` y no hay parametros de URL, entonces se muestran todas las propiedades.

### Impacto

El usuario cree que el filtro funciona, pero el sitio muestra propiedades que no coinciden con la busqueda.

### Archivos Probables

- `js/main.js`
- `pages/properties.html`

### Criterios De Aceptacion

- Al filtrar por una combinacion sin resultados, se muestra el estado vacio.
- No se vuelve al listado completo salvo que el usuario limpie filtros.
- El estado vacio se ve correctamente en desktop y mobile.
- La logica distingue entre "sin filtro aplicado" y "filtro aplicado con cero resultados".

### Notas Tecnicas

Agregar una bandera explicita, por ejemplo `hasActiveFilters`, en vez de inferirlo desde el largo de `filteredProperties`.

## P0-02 - Parametros De URL No Actualizan Visualmente Los Filtros

### Problema

El home navega a `pages/properties.html?tipo=...&operacion=...`, pero los dropdowns de la pagina de propiedades quedan visualmente en "Todos/Todas".

### Impacto

El usuario llega a resultados filtrados sin entender que filtros estan activos.

### Archivos Probables

- `js/main.js`
- `index.html`
- `pages/properties.html`

### Criterios De Aceptacion

- Al entrar con `?operacion=Venta`, el selector de operacion muestra `Venta`.
- Al entrar con `?tipo=Casa`, el selector de tipo muestra `Casa`.
- Al entrar con `?ubicacion=...`, el selector o input de ubicacion refleja el valor.
- Si el usuario limpia filtros, tambien se limpian los parametros de URL o deja de aplicarse el filtro.

### Notas Tecnicas

`applyUrlFilters()` no deberia solo filtrar arrays: tambien debe sincronizar los controles del DOM.

## P0-03 - Panel Admin Accesible Sin Contrasena

### Problema

El panel admin puede abrirse directamente desde `/panel.html` sin pasar por login.

### Impacto

Cualquier persona que conozca la URL puede administrar propiedades. Es el riesgo de seguridad mas alto.

### Archivos Probables

- `server.js`
- `panel.html`
- `login.html`
- `index.html`

### Criterios De Aceptacion

- Acceder a `/panel.html` sin cookie valida redirige a `/login.html`.
- Acceder a `/panel.html` con sesion valida abre el panel.
- Los endpoints de escritura del admin estan protegidos o tienen una estrategia documentada.
- La sesion expira segun `SESSION_TTL`.
- El panel no puede servirse como archivo estatico antes de pasar por `requireAuth`.

### Notas Tecnicas

Revisar el orden de middlewares en `server.js`. Si `express.static()` sirve `panel.html` antes que la ruta protegida, se saltea la autenticacion.

## P0-04 - Propiedad De Prueba Ofensiva Publicada

### Problema

Existe una propiedad publica llamada "Inodoro con olor a culo", visible en produccion.

### Impacto

Dana la confianza del sitio y la imagen comercial.

### Archivos Probables

- Google Sheets de propiedades.
- `SETUP-GOOGLE-SHEETS.md`
- Panel admin.

### Criterios De Aceptacion

- La propiedad ofensiva no aparece en `/api/properties`.
- No aparece en home, listado ni detalle.
- Si se mantiene como dato de prueba, debe estar con `status = Borrador` o eliminada.
- El panel permite borrarla o cambiar su estado y sincroniza contra Google Sheets.

### Notas Tecnicas

Es una tarea de datos, no solo de codigo. Ver tambien [`data-cleanup.md`](./data-cleanup.md).

## P0-05 - Propiedades Reales Sin Descripcion

### Problema

La propiedad "Casa 6 ambientes en Almagro" no tiene descripcion visible en detalle.

### Impacto

La ficha queda incompleta y baja la conversion comercial.

### Archivos Probables

- Google Sheets de propiedades.
- `pages/property-detail.html`
- `server.js`
- `SETUP-GOOGLE-SHEETS.md`

### Criterios De Aceptacion

- La Sheet tiene columna `description`.
- La descripcion se guarda al crear/editar propiedades.
- `pages/property-detail.html` muestra descripcion real si existe.
- Si falta descripcion, se muestra un fallback sobrio o se oculta la seccion.

### Notas Tecnicas

El lector CSV mapea por header. El nombre de columna debe ser exactamente `description`.

## P0-06 - No Hay URL Compartible De Propiedad

### Problema

El sitio depende de modales para ver propiedades y no ofrece una URL clara tipo `/propiedad/123` o `/pages/property-detail.html?id=123`.

### Impacto

No se puede compartir facilmente una propiedad por WhatsApp, redes o campanas.

### Archivos Probables

- `js/main.js`
- `pages/properties.html`
- `pages/property-detail.html`
- `server.js`

### Criterios De Aceptacion

- Cada propiedad tiene un link compartible estable.
- Las cards tienen CTA claro hacia ese link o hacia un modal con opcion "copiar enlace".
- WhatsApp comparte el link correcto de la propiedad.
- Si la propiedad no existe, la pagina muestra un estado de error y link al listado.

### Notas Tecnicas

Ya existe `pages/property-detail.html?id=X`; definir si se adopta esa URL o si se agrega una ruta mas amigable en `server.js`.
