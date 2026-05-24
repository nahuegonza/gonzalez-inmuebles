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

var SCRIPT_VERSION = '2026-05-22-schema-v2';

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

// ─── GUARDAR / ACTUALIZAR / BORRAR propiedad (el panel admin llama esto) ───
function doPost(e) {
  try {
    var prop  = JSON.parse(e.postData.contents);
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Propiedades') || ss.getActiveSheet();

    var DEFAULT_HEADERS = ['id','title','operation','type','currency','price',
                           'location','beds','baths','sqm','images','status'];
    var OPTIONAL_HEADERS = ['description','sqmCovered','sqmLand','antiguedad','agentId'];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(DEFAULT_HEADERS);
    }

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function(h) { return String(h).trim(); })
      .filter(Boolean);

    if (headers.length === 0) {
      headers = DEFAULT_HEADERS;
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    headers = _ensureHeaders(sheet, headers, OPTIONAL_HEADERS);
    _repairShiftedRows(sheet, headers);

    var operation = prop._operation || 'upsert';
    var data = sheet.getDataRange().getValues();

    if (operation === 'delete') {
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(prop.id)) {
          sheet.deleteRow(i + 1);
          return _jsonResponse({ success: true, deleted: true, version: SCRIPT_VERSION });
        }
      }

      return _jsonResponse({ success: true, deleted: false, reason: 'not_found', version: SCRIPT_VERSION });
    }

    var valuesByHeader = _propertyValuesByHeader(prop);
    var row = headers.map(function(header) {
      return valuesByHeader.hasOwnProperty(header) ? valuesByHeader[header] : '';
    });

    // Actualizar fila existente o agregar nueva
    var rowIndex = -1;
    for (var j = 1; j < data.length; j++) {
      if (String(data[j][0]) === String(prop.id)) { rowIndex = j + 1; break; }
    }

    if (rowIndex > 0) {
      // Limpiar celdas sobrantes de versiones anteriores que escribían más columnas.
      sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).clearContent();
      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return _jsonResponse({ success: true, headers: headers, version: SCRIPT_VERSION });
  } catch(err) {
    return _jsonResponse({ success: false, error: err.toString(), version: SCRIPT_VERSION });
  }
}

function _propertyValuesByHeader(prop) {
  var images = Array.isArray(prop.images) ? prop.images.join(';') : (prop.images || '');
  return {
    id: prop.id,
    title: prop.title || '',
    operation: prop.operation || '',
    type: prop.type || '',
    currency: prop.currency || 'USD',
    price: Number(prop.price) || 0,
    location: prop.location || '',
    beds: Number(prop.beds) || 0,
    baths: Number(prop.baths) || 0,
    sqm: Number(prop.sqm) || 0,
    sqmCovered: Number(prop.sqmCovered) || 0,
    sqmLand: Number(prop.sqmLand) || 0,
    antiguedad: prop.antiguedad || '',
    description: prop.description || '',
    images: images,
    status: prop.status || 'Publicada',
    agentId: prop.agentId || ''
  };
}

function _ensureHeaders(sheet, headers, optionalHeaders) {
  var updated = headers.slice();
  optionalHeaders.forEach(function(header) {
    if (updated.indexOf(header) === -1) {
      updated.push(header);
    }
  });

  if (updated.length !== headers.length) {
    sheet.getRange(1, 1, 1, updated.length).setValues([updated]);
  }

  return updated;
}

function _repairShiftedRows(sheet, headers) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var lastColumn = Math.max(sheet.getLastColumn(), headers.length);
  var range = sheet.getRange(2, 1, lastRow - 1, lastColumn);
  var rows = range.getValues();
  var changed = false;

  var imagesIdx = headers.indexOf('images');
  var statusIdx = headers.indexOf('status');
  var descriptionIdx = headers.indexOf('description');
  var validStatuses = ['Publicada', 'Borrador', 'Pausada', 'Vendida/Alquilada'];

  if (imagesIdx === -1 || statusIdx === -1) return;

  rows.forEach(function(row) {
    var currentImages = String(row[imagesIdx] || '');
    var currentStatus = String(row[statusIdx] || '');
    var looksShifted = currentImages.indexOf('http') === -1
      && validStatuses.indexOf(currentStatus) === -1;

    if (!looksShifted) return;

    var recoveredImages = '';
    var recoveredStatus = '';
    var recoveredDescription = '';

    for (var i = statusIdx + 1; i < row.length; i++) {
      var value = String(row[i] || '').trim();
      if (!value) continue;

      if (!recoveredImages && value.indexOf('http') !== -1) {
        recoveredImages = value;
      } else if (!recoveredStatus && validStatuses.indexOf(value) !== -1) {
        recoveredStatus = value;
      } else if (!recoveredDescription && value.indexOf('http') === -1 && validStatuses.indexOf(value) === -1) {
        recoveredDescription = value;
      }
    }

    if (recoveredImages) {
      row[imagesIdx] = recoveredImages;
      changed = true;
    }
    if (recoveredStatus) {
      row[statusIdx] = recoveredStatus;
      changed = true;
    }
    if (descriptionIdx !== -1 && recoveredDescription && !row[descriptionIdx]) {
      row[descriptionIdx] = recoveredDescription;
      changed = true;
    }

    if (recoveredImages || recoveredStatus || recoveredDescription) {
      for (var j = headers.length; j < row.length; j++) {
        row[j] = '';
      }
    }
  });

  if (changed) {
    range.setValues(rows);
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

- El **panel admin** guarda/actualiza/borra propiedades → escribe en la Sheet via Apps Script
- El **sitio público** lee las propiedades → lee el CSV directamente de la Sheet (sin CORS)
- Si alguna URL no está configurada, todo sigue funcionando con `localStorage` como fallback

---

### Notas técnicas

- La URL CSV de lectura requiere que la Sheet esté compartida como "Cualquier persona con el enlace puede ver". No requiere login.
- Las imágenes se guardan en la Sheet como URLs separadas por `;` y el frontend las convierte a array automáticamente.
- La sincronización es en tiempo real: cada vez que alguien carga el sitio, lee los últimos datos de la Sheet.
