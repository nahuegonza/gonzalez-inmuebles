# Backlog De Issues

Este directorio organiza los bugs, inconsistencias y mejoras detectadas en el sitio de Gonzalez Inmuebles. Las tareas estan agrupadas por prioridad y area funcional para poder implementarlas por tandas sin perder contexto.

## Prioridades

### P0 - Critico

Estos puntos bloquean funcionamiento basico, seguridad o reputacion del sitio:

1. Corregir filtros de propiedades cuando el resultado es cero.
2. Sincronizar parametros de URL con los controles visuales de filtros.
3. Proteger el panel admin para que no sea accesible sin sesion.
4. Eliminar la propiedad de prueba ofensiva publicada.
5. Completar o recuperar descripcion de propiedades reales.
6. Definir una URL compartible para cada propiedad.

Ver detalle en [`P0-critical.md`](./P0-critical.md).

### P1 - Alto Impacto

Estos puntos afectan busqueda, administracion y consistencia de datos:

1. Unificar tipos de inmueble en home, filtros y admin.
2. Corregir ubicacion del home para que coincida con los datos reales.
3. Asegurar que "Limpiar filtros" recargue el grid.
4. Agregar campo "Destacada" y mejorar el home.
5. Revisar estado visible en alta de propiedades.
6. Resolver thumbnails faltantes y navegacion del panel.
7. Unificar WhatsApp y comportamiento de detalle.

Ver detalles en:

- [`P1-property-search-and-filters.md`](./P1-property-search-and-filters.md)
- [`P1-admin-panel.md`](./P1-admin-panel.md)
- [`P1-property-detail-sharing.md`](./P1-property-detail-sharing.md)

### P2 - UX, Accesibilidad Y Consistencia Visual

Estos puntos mejoran percepcion, accesibilidad y experiencia:

1. Agregar indicadores visuales a selects del home.
2. Clarificar el CTA "VER DETALLE" en cards.
3. Unificar headers entre home, paginas internas y admin.
4. Corregir responsive en anchos medianos.
5. Completar campos y labels de formularios.
6. Ocultar o contextualizar secciones vacias.

Ver detalles en:

- [`P2-forms-and-leads.md`](./P2-forms-and-leads.md)
- [`P2-ux-visual-consistency.md`](./P2-ux-visual-consistency.md)

## Datos Y Limpieza

Hay tareas que no son solo de codigo: requieren corregir Google Sheets o datos publicados. Estan separadas en [`data-cleanup.md`](./data-cleanup.md).

## Orden Recomendado De Implementacion

1. Seguridad del panel admin.
2. Limpieza de datos visibles en produccion.
3. Filtros y prefiltrado por URL.
4. Contrato de Google Sheets y descripcion de propiedades.
5. Tipos de inmueble y ubicaciones.
6. Pagina o ruta de detalle compartible.
7. Mejoras de panel admin.
8. Formularios y accesibilidad.
9. UX visual y responsive.

## Archivos Del Proyecto A Revisar

- `server.js`: autenticacion, rutas protegidas, APIs y logs.
- `js/main.js`: filtros, render publico, formularios y panel embebido.
- `index.html`: buscador del home, tasacion, destacadas y admin embebido.
- `pages/properties.html`: filtros visuales, grid y responsive.
- `pages/property-detail.html`: detalle, contacto y compartir.
- `pages/contacto.html`: formulario general de contacto.
- `panel.html`: panel admin independiente.
- `SETUP-GOOGLE-SHEETS.md`: contrato Apps Script y estructura de datos.
