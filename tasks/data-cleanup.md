# Limpieza Y Migracion De Datos

Estas tareas requieren tocar datos publicados o el contrato de Google Sheets. Deben hacerse con cuidado porque impactan directamente en produccion.

## DATA-01 - Eliminar Propiedad De Prueba Ofensiva

### Problema

La propiedad "Inodoro con olor a culo" esta publicada y visible.

### Impacto

Riesgo reputacional alto.

### Acciones

1. Buscar la fila por `title`.
2. Eliminarla desde el panel o desde Google Sheets.
3. Invalidar cache o esperar refresh.
4. Verificar `/api/properties`.
5. Verificar home y listado publico.

### Criterios De Aceptacion

- La propiedad ya no esta en el CSV publicado.
- No aparece en home ni en listado.
- No existe detalle accesible por URL.

## DATA-02 - Corregir Filas Con Columnas Corridas

### Problema

Algunas filas fueron escritas con mas columnas que los headers actuales. Eso dejo `images`, `status` y `description` desalineados.

### Impacto

Propiedades reales pueden ocultarse porque `status` queda como `0`, y las imagenes pueden no renderizar.

### Acciones

1. En Google Sheets, identificar filas donde `images` o `status` tengan valores invalidos como `0`.
2. Mover URLs de imagenes a la columna `images`.
3. Mover `Publicada`, `Borrador`, `Pausada` o `Vendida/Alquilada` a `status`.
4. Mover texto descriptivo a `description`.
5. Borrar valores sobrantes en columnas sin header.
6. Editar/guardar desde el panel con el Apps Script nuevo para confirmar que no vuelve a correrse.

### Criterios De Aceptacion

- Cada fila tiene `images` con URLs separadas por `;` o vacio.
- Cada fila tiene `status` valido.
- La descripcion queda en `description`.
- `/api/properties` no registra warnings de columnas corridas para esas filas.

## DATA-03 - Asegurar Headers Canonicos En Google Sheets

### Problema

El codigo mapea por nombre de columna. Headers incorrectos impiden persistir o leer campos.

### Headers Minimos

```text
id,title,operation,type,currency,price,location,beds,baths,sqm,images,status
```

### Headers Opcionales Recomendados

```text
description,sqmCovered,sqmLand,antiguedad,agentId,featured
```

### Criterios De Aceptacion

- La primera fila tiene headers exactos, sin espacios al final.
- `description` esta en ingles y minuscula.
- No hay columnas duplicadas con nombres parecidos como `descripcion` o `Descripción`.
- El Apps Script agrega automaticamente opcionales faltantes.

## DATA-04 - Completar Descripcion De Propiedades Reales

### Problema

"Casa 6 ambientes en Almagro" no tiene descripcion visible.

### Impacto

La ficha de propiedad queda incompleta.

### Acciones

1. Agregar columna `description` si aun no existe.
2. Cargar descripcion comercial para propiedades reales.
3. Verificar detalle publico.

### Criterios De Aceptacion

- La propiedad muestra una descripcion real.
- No aparece "Sin descripcion disponible" en propiedades principales.
- La descripcion se conserva al editar desde admin.

## DATA-05 - Redeploy Del Apps Script

### Problema

Editar el codigo del Apps Script no actualiza la URL publicada si no se crea una nueva implementacion.

### Acciones

1. Pegar el codigo actualizado desde `SETUP-GOOGLE-SHEETS.md`.
2. Crear nueva implementacion como aplicacion web.
3. Configurar "Ejecutar como: Yo".
4. Configurar acceso para cualquier persona.
5. Copiar URL `/exec`.
6. Actualizar `APPS_SCRIPT_URL` en Render si cambio.
7. Reiniciar o redeployar Render.

### Criterios De Aceptacion

- Crear propiedad devuelve `success: true`.
- Editar propiedad actualiza la fila correcta.
- Borrar propiedad elimina la fila correcta.
- Las columnas no se desalinean.
