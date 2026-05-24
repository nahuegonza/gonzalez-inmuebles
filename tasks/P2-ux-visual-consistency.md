# P2 - UX Y Consistencia Visual

## P2-01 - Selects Del Home Sin Flecha Indicadora

### Problema

Los campos "Tipo de Inmueble" y "Ubicacion" parecen inputs de texto, mientras "Operacion" si muestra indicador de selector.

### Impacto

El usuario puede no descubrir que puede desplegar opciones.

### Archivos Probables

- `index.html`
- CSS/Tailwind inline.

### Criterios De Aceptacion

- Todos los selects del buscador tienen indicador visual consistente.
- La interaccion es clara en desktop y mobile.
- La solucion no rompe estilos actuales.

### Notas Tecnicas

Usar el mismo patron visual que ya tiene `Operacion`.

## P2-02 - Propiedades Destacadas Pobre O Vacia

### Problema

El home muestra una sola propiedad destacada o queda con espacio vacio.

### Impacto

La home se percibe incompleta.

### Archivos Probables

- `index.html`
- `js/main.js`
- `SETUP-GOOGLE-SHEETS.md`

### Criterios De Aceptacion

- Si hay propiedades destacadas, se muestran hasta el maximo definido.
- Si no hay destacadas, se oculta la seccion o se muestra contenido cuidado.
- El admin permite marcar propiedades como destacadas.
- No se muestran placeholders rotos.

### Notas Tecnicas

Depende de la tarea del campo `featured` en panel admin.

## P2-03 - Header Inconsistente

### Problema

Home, paginas internas y panel admin tienen headers visualmente distintos.

### Impacto

El sitio se siente menos profesional y menos cohesivo.

### Archivos Probables

- `index.html`
- `pages/properties.html`
- `pages/contacto.html`
- `pages/property-detail.html`
- `panel.html`

### Criterios De Aceptacion

- Home y paginas internas comparten identidad visual.
- El CTA "Tasa tu propiedad" aparece donde corresponda.
- El panel admin puede diferenciarse, pero mantiene marca coherente.
- Mobile conserva navegacion clara.

### Notas Tecnicas

Considerar extraer header a un snippet compartido solo si el proyecto incorpora build o templating. Si no, mantener cambios sincronizados manualmente.

## P2-04 - Secciones Vacias Sin Contexto

### Problema

"Seleccion Exclusiva / Propiedades Destacadas" puede quedar vacia o incompleta.

### Impacto

Da apariencia amateur.

### Archivos Probables

- `index.html`
- `js/main.js`

### Criterios De Aceptacion

- Una seccion sin datos no deja huecos visuales.
- Hay estado vacio elegante o se oculta la seccion.
- El home no muestra cards incompletas.

### Notas Tecnicas

Resolver junto con destacadas y `featured`.
