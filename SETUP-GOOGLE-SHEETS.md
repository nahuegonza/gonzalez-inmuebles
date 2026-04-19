# Configuración de Google Sheets como base de datos

Este proyecto usa **Google Apps Script** como backend serverless gratuito para escribir propiedades directamente en Google Sheets desde el botón "Guardar Propiedad" del panel admin.

## Paso 1 — Crear la Google Sheet

1. Andá a [sheets.google.com](https://sheets.google.com) y creá una hoja nueva.
2. Nombrá la primera hoja (pestaña) exactamente: **`Propiedades`**
3. Las columnas se crean solas la primera vez que guardás una propiedad.

## Paso 2 — Crear el Apps Script

1. Dentro de la Google Sheet, andá a **Extensiones → Apps Script**.
2. Borrá todo el código que aparece por defecto.
3. Pegá el siguiente código:

```javascript
/** @OnlyCurrentDoc */

// ─── LEER propiedades (el sitio público llama esto al cargar) ───
function doGet(e) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Propiedades') || ss.getActiveSheet();
    var data  = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return _jsonResponse([]);
    }

    var headers = data[0];
    var props = data.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      // Normalizar imágenes a array
      obj.images = obj.images
        ? String(obj.images).split(';').filter(Boolean)
        : [];
      obj.price = Number(obj.price) || 0;
      return obj;
    });

    return _jsonResponse(props);
  } catch(err) {
    return _jsonResponse({ error: err.toString() });
  }
}

// ─── GUARDAR / ACTUALIZAR propiedad (el panel admin llama esto) ───
function doPost(e) {
  try {
    var prop  = JSON.parse(e.postData.contents);
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Propiedades') || ss.getActiveSheet();

    var HEADERS = ['id','title','operation','type','currency','price','location',
                   'beds','baths','sqm','sqmCovered','sqmLand','antiguedad',
                   'description','images','status','agentId'];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    var images = Array.isArray(prop.images) ? prop.images.join(';') : (prop.images || '');
    var row = [
      prop.id, prop.title, prop.operation, prop.type, prop.currency,
      Number(prop.price) || 0, prop.location,
      Number(prop.beds) || 0, Number(prop.baths) || 0, Number(prop.sqm) || 0,
      Number(prop.sqmCovered) || 0, Number(prop.sqmLand) || 0,
      prop.antiguedad || '', prop.description || '',
      images, prop.status || 'Publicada', prop.agentId || ''
    ];

    // Actualizar fila existente o agregar nueva
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(prop.id)) { rowIndex = i + 1; break; }
    }

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return _jsonResponse({ success: true });
  } catch(err) {
    return _jsonResponse({ success: false, error: err.toString() });
  }
}

// ─── Helper ───
function _jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Paso 3 — Deployar (o redesplegar) como Web App

> ⚠️ **Si ya tenías el script deployado**, tenés que crear una **nueva implementación** (no editar la existente) para que los cambios tomen efecto. La URL puede cambiar.

1. En el editor de Apps Script, hacé clic en **Implementar → Nueva implementación**.
2. En "Seleccionar tipo" elegí **Aplicación web**.
3. Configurá:
   - **Descripción:** `API González Inmuebles`
   - **Ejecutar como:** `Yo (tu cuenta de Google)`
   - **Quién tiene acceso:** `Cualquier usuario` *(necesario para que el frontend pueda llamarla)*
4. Hacé clic en **Implementar**.
5. Google te pedirá autorizar permisos → Aceptá todo.
6. **Copiá la URL** que aparece (tiene el formato `https://script.google.com/macros/s/XXXXX/exec`).

## Paso 4 — Obtener las dos URLs del proyecto

El sitio usa **dos URLs distintas** para evitar el error CORS del exec:

| Propósito | URL | Dónde se usa |
|-----------|-----|-------------|
| **Escribir** (guardar desde admin) | URL del Apps Script `/exec` | `APPS_SCRIPT_URL` en `js/main.js` y `panel.html` |
| **Leer** (mostrar en el sitio público) | URL CSV de la Sheet | `SHEETS_CSV_URL` en `js/main.js` |

### 4a — URL de escritura (Apps Script)

Ya la tenés del paso anterior. Pegala en `js/main.js`:
```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/TU_URL/exec';
```
Y hacé lo mismo en `panel.html`.

### 4b — URL pública CSV (sin API keys, sin GCP, 3 clics)

1. Abrí tu Google Sheet
2. Menú **Archivo → Compartir → Publicar en la web**
3. En el primer desplegable elegí la pestaña **"Propiedades"**
4. En el segundo desplegable elegí **"Valores separados por comas (.csv)"**
5. Hacé clic en **Publicar** → confirmá
6. Copiá la URL que aparece (formato: `https://docs.google.com/spreadsheets/d/.../pub?gid=...&output=csv`)
7. Pegala en `js/main.js`:
   ```javascript
   const SHEETS_PUB_URL = 'https://docs.google.com/spreadsheets/d/.../pub?gid=...&output=csv';
   ```

> Esta URL es pública, sin login, sin CORS. Cada vez que alguien cargue el sitio lee los datos frescos de la Sheet.

## ¡Listo!

- El **panel admin** guarda/actualiza propiedades → escribe en la Sheet via Apps Script
- El **sitio público** lee las propiedades → lee el CSV directamente de la Sheet (sin CORS)
- Si alguna URL no está configurada, todo sigue funcionando con `localStorage` como fallback

---

### Notas técnicas

- La URL CSV de lectura requiere que la Sheet esté compartida como "Cualquier persona con el enlace puede ver". No requiere login.
- Las imágenes se guardan en la Sheet como URLs separadas por `;` y el frontend las convierte a array automáticamente.
- La sincronización es en tiempo real: cada vez que alguien carga el sitio, lee los últimos datos de la Sheet.
