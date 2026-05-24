# P2 - Formularios Y Leads

## P2-01 - Formulario De Tasacion Sin Tipo De Inmueble

### Problema

El JavaScript intenta leer `tasTipo`, pero el HTML del formulario de tasacion no tiene ese elemento.

### Impacto

Los leads de tasacion llegan sin tipo de propiedad, dato clave para evaluar.

### Archivos Probables

- `index.html`
- `js/main.js`
- `server.js`
- `SETUP-EMAIL.md`

### Criterios De Aceptacion

- El formulario incluye selector de tipo de inmueble.
- El selector usa la misma lista canonica que busqueda y admin.
- El payload enviado a EmailJS incluye `tipo`.
- El panel de tasaciones muestra el tipo.

### Notas Tecnicas

Coordinar con la tarea de tipos de inmueble para no duplicar opciones.

## P2-02 - Formulario De Contacto Sin Labels Accesibles Suficientes

### Problema

El formulario de contacto depende demasiado de placeholders o puede no exponer labels claros en todas las vistas.

### Impacto

Pierde accesibilidad y claridad cuando el usuario escribe.

### Archivos Probables

- `pages/contacto.html`
- `pages/property-detail.html`
- `js/main.js`

### Criterios De Aceptacion

- Todos los campos tienen label visible o `aria-label` adecuado.
- Los placeholders no son la unica forma de identificar el campo.
- El feedback de envio se anuncia visualmente y no borra contexto necesario.
- Los errores de envio muestran un mensaje comprensible.

### Notas Tecnicas

Mantener estilos visuales actuales, pero mejorar semantica y accesibilidad.

## P2-03 - Formularios De Contacto Deben Persistir Y Enviar

### Problema

Algunos formularios historicamente simulaban el envio o solo guardaban en `localStorage`.

### Impacto

El negocio puede perder consultas si no llegan por email o no quedan visibles.

### Archivos Probables

- `server.js`
- `js/main.js`
- `pages/contacto.html`
- `pages/property-detail.html`

### Criterios De Aceptacion

- Contacto general envia por EmailJS.
- Consulta de propiedad envia por EmailJS.
- Ambos guardan lead local si corresponde.
- Los logs de servidor distinguen `contacto`, `consulta_propiedad` y `tasacion`.

### Notas Tecnicas

Verificar templates de EmailJS para que acepten los campos comunes: `nombre`, `email`, `telefono`, `mensaje`, `propiedad`, `tipoLead`.
