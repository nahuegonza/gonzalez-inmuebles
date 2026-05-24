# P1 - Busqueda Y Filtros De Propiedades

## P1-01 - Unificar Tipos De Inmueble

### Problema

Los tipos de inmueble difieren entre home, pagina de propiedades y panel admin.

### Impacto

Una propiedad creada como `Galpon` o `PH` puede no aparecer al filtrar desde otra pantalla.

### Archivos Probables

- `index.html`
- `pages/properties.html`
- `panel.html`
- `js/main.js`

### Criterios De Aceptacion

- Home, listado y admin comparten exactamente los mismos valores.
- `PH` tiene una sola escritura canonica.
- `Galpon`, `Local/galpon/deposito`, `Cochera`, `Hotel` y `Emprendimiento` tienen equivalencias claras o se eliminan de todos lados.
- El filtro encuentra propiedades creadas desde el panel.
- Las opciones estan documentadas en un solo lugar o se generan desde una fuente comun.

### Notas Tecnicas

Evitar comparar strings inconsistentes. Si no se implementa catalogo real, usar una constante compartida en `js/main.js` y reflejarla en HTML.

## P1-02 - Ubicacion Del Home No Coincide Con Los Datos

### Problema

El home ofrece `Centro`, `Zona Norte` y `Zona Sur`, pero las propiedades guardan direcciones completas de Nominatim/OpenStreetMap.

### Impacto

El usuario filtra por ubicacion y no encuentra propiedades que si existen.

### Archivos Probables

- `index.html`
- `js/main.js`
- `pages/properties.html`

### Criterios De Aceptacion

- El filtro de ubicacion usa valores que existen en los datos.
- Si se mantiene como texto libre, busca por substring en `location`.
- Si se mantiene como selector, las opciones se derivan de barrios/localidades reales.
- El resultado del home y el filtro de la pagina de propiedades coinciden.

### Notas Tecnicas

Definir si `location` seguira siendo direccion completa o si se agrega un campo normalizado como `neighborhood`.

## P1-03 - Limpiar Filtros No Refresca El Grid

### Problema

Al limpiar filtros, los controles se vacian pero el grid puede quedar con resultados anteriores.

### Impacto

El usuario no sabe si los filtros siguen aplicados.

### Archivos Probables

- `pages/properties.html`
- `js/main.js`

### Criterios De Aceptacion

- El boton "Limpiar filtros" resetea controles.
- El grid vuelve a mostrar todas las propiedades publicadas.
- Se limpia cualquier estado interno de filtro.
- Si hay parametros en URL, se limpian o dejan de impactar.

### Notas Tecnicas

Despues de limpiar valores, llamar explicitamente a la funcion que recalcula y renderiza el grid.

## P1-04 - Responsive Roto En Anchos Medianos

### Problema

En ventanas intermedias, el panel de filtros ocupa todo el ancho y el grid se va fuera del viewport horizontal.

### Impacto

Tablets, laptops chicas o ventanas redimensionadas no pueden navegar correctamente el listado.

### Archivos Probables

- `pages/properties.html`
- `index.html`
- CSS/Tailwind inline.

### Criterios De Aceptacion

- No hay scroll horizontal en anchos alrededor de 938px.
- Los filtros y el grid se apilan o distribuyen de forma estable.
- El grid siempre queda visible.
- El layout funciona en mobile, tablet y desktop.

### Notas Tecnicas

Revisar clases `grid`, `flex`, widths fijos, contenedores `container` y breakpoints Tailwind.
