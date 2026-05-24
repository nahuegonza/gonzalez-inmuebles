# P1 - Panel Admin

## P1-01 - Agregar Campo Destacada

### Problema

No existe forma de marcar una propiedad como destacada desde el panel.

### Impacto

La seccion de propiedades destacadas del home no puede administrarse correctamente.

### Archivos Probables

- `index.html`
- `panel.html`
- `js/main.js`
- `SETUP-GOOGLE-SHEETS.md`

### Criterios De Aceptacion

- El formulario de alta permite marcar `Destacada`.
- El formulario de edicion permite cambiar ese valor.
- Google Sheets guarda un campo consistente, por ejemplo `featured`.
- El home muestra propiedades con `featured = true`.
- Si no hay destacadas, la seccion se oculta o muestra un estado cuidado.

### Notas Tecnicas

Agregar el header opcional `featured` al Apps Script si se persiste en Sheets.

## P1-02 - Campo Estado En Alta De Propiedad

### Problema

El codigo contempla `adminStatus`, pero hay que verificar si existe en el formulario de creacion.

### Impacto

Las propiedades nuevas pueden publicarse automaticamente sin control editorial.

### Archivos Probables

- `index.html`
- `panel.html`
- `js/main.js`

### Criterios De Aceptacion

- Alta y edicion tienen control visible de estado.
- Estados permitidos: `Publicada`, `Borrador`, `Pausada`, `Vendida/Alquilada`.
- Solo propiedades `Publicada` se muestran publicamente.
- El estado se guarda y se recupera desde Google Sheets.

### Notas Tecnicas

Centralizar lista de estados para evitar strings sueltos.

## P1-03 - Crear Y Editar Tienen Experiencias Diferentes

### Problema

Crear usa formulario inline y editar usa modal.

### Impacto

La experiencia es inconsistente y aumenta la chance de errores al administrar.

### Archivos Probables

- `panel.html`
- `index.html`
- `js/main.js`

### Criterios De Aceptacion

- Crear y editar comparten un mismo componente o patron visual.
- Los campos disponibles son equivalentes.
- El usuario entiende claramente si esta creando o editando.
- Guardar muestra feedback consistente.

### Notas Tecnicas

Puede resolverse moviendo alta al mismo modal o reutilizando el formulario inline para edicion.

## P1-04 - Thumbnail Faltante En Panel

### Problema

La propiedad "Exclusivo Departamento 3 ambientes" aparece sin foto en el panel.

### Impacto

El admin pierde referencia visual y parece que la propiedad no tiene imagen.

### Archivos Probables

- `panel.html`
- `js/main.js`
- Google Sheets.

### Criterios De Aceptacion

- El panel muestra la primera imagen valida si existe.
- Si no hay imagen valida, muestra placeholder claro.
- Propiedades con columnas corridas no rompen thumbnails.

### Notas Tecnicas

Revisar normalizacion de `images`: debe soportar array y string separado por `;`.

## P1-05 - Navegacion De Secciones Admin Incompleta

### Problema

Existen funciones para consultas, tasaciones, agentes y catalogos, pero no hay navegacion clara para acceder.

### Impacto

El panel tiene funcionalidades ocultas o inalcanzables.

### Archivos Probables

- `index.html`
- `panel.html`
- `js/main.js`

### Criterios De Aceptacion

- Hay navegacion visible para `Propiedades`, `Consultas`, `Tasaciones`, `Agentes` y `Catalogos`.
- Cada seccion renderiza su estado vacio correctamente.
- La navegacion indica seccion activa.
- Funciona con teclado y mobile.

### Notas Tecnicas

Verificar si existen dos paneles admin paralelos y decidir cual sera el canonico.
