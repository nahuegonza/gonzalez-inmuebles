# González Inmuebles — Sitio Web

Sitio web completo para inmobiliaria, con catálogo de propiedades, formulario de tasación, panel de administración y sincronización con Google Sheets.

---

## Estructura de archivos

```
/
├── index.html                  ← Página principal (home + panel admin embebido)
├── panel.html                  ← Panel admin alternativo (acceso por URL directa)
├── js/
│   └── main.js                 ← Toda la lógica frontend
├── pages/
│   ├── properties.html         ← Listado de propiedades con filtros
│   ├── property-detail.html    ← Detalle de una propiedad
│   ├── tasacion.html           ← Formulario de tasación dedicado
│   └── contacto.html           ← Página de contacto
├── user_stories/               ← Historias de usuario (estado del desarrollo)
├── SETUP-EMAIL.md              ← Guía para configurar envío de emails
└── SETUP-GOOGLE-SHEETS.md      ← Guía para configurar sincronización con Google Sheets
```

---

## Páginas públicas

| Página | URL | Descripción |
|--------|-----|-------------|
| Home | `index.html` | Hero, propiedades destacadas, sección de tasación con formulario inline |
| Propiedades | `pages/properties.html` | Grilla de propiedades con filtros (tipo, operación, precio, ambientes, ubicación) |
| Detalle | `pages/property-detail.html?id=X` | Galería de imágenes, datos completos, formulario de contacto |
| Tasación | `pages/tasacion.html` | Formulario completo de tasación con geolocalización automática |
| Contacto | `pages/contacto.html` | Datos de contacto y mapa |

---

## Panel de Administración

### Acceso

Hay dos formas de acceder al panel:

1. **Panel embebido** (`index.html`): actualmente solo accesible desde el código (la ruedita fue removida del header por decisión de diseño). Se puede volver a activar llamando `toggleView('admin')` desde la consola del navegador.
2. **Panel independiente** (`panel.html`): acceder directo por URL, pide contraseña al cargar.

**Contraseña del panel:** `admin123`

> ⚠️ Cambiar esta contraseña antes de publicar el sitio. Está en `panel.html` línea ~54.

### Secciones del panel

- **Propiedades**: Crear, editar y eliminar propiedades. Estado: Publicada / Borrador / Pausada. Solo las "Publicadas" aparecen en el sitio público.
- **Consultas**: Leads recibidos desde el formulario de contacto de cada propiedad.
- **Tasaciones**: Solicitudes de tasación recibidas.
- **Agentes**: CRUD de agentes de la inmobiliaria.
- **Catálogos**: Gestión de tipos de propiedad disponibles.

### Almacenamiento (localStorage)

Todos los datos se guardan en el `localStorage` del navegador:

| Clave | Contenido |
|-------|-----------|
| `properties_db` | Array de propiedades |
| `consultas_db` | Array de leads de contacto |
| `tasaciones_db` | Array de leads de tasación |
| `agents_db` | Array de agentes |
| `property_types_db` | Array de tipos de propiedad |

> Los datos son **locales al navegador** donde se cargan. Para compartir entre dispositivos usar la sincronización con Google Sheets (ver más abajo).

---

## Imágenes de propiedades

Las imágenes se gestionan con **Cloudinary** (servicio gratuito de hosting de imágenes).

- **Cloud Name configurado:** `dzyiwuftf`
- **Upload Preset:** `ml_default`

### Cómo funciona

1. En el formulario del panel admin hay un botón "Subir imágenes"
2. Abre un widget de Cloudinary para subir desde el dispositivo, cámara o URL
3. Las URLs resultantes se guardan en el campo `images` separadas por `;`
4. En el detalle de la propiedad se muestran como galería:
   - **Mobile**: carrusel con flechas (swipe táctil incluido)
   - **Desktop**: imagen principal + strip de 5 thumbnails + botón "Ver N más" para expandir el resto

### También se puede ingresar URLs manualmente

En el campo "Imágenes" del formulario se pueden pegar URLs separadas por `;`:
```
https://ejemplo.com/foto1.jpg;https://ejemplo.com/foto2.jpg
```

---

## Envío de emails (tasaciones)

Cuando alguien completa el formulario de tasación, se envía automáticamente un email a la casilla configurada. Usa dos servicios en cascada:

| Servicio | Límite gratis | Rol |
|----------|--------------|-----|
| [Web3Forms](https://web3forms.com) | 250 emails/mes | Primario |
| [EmailJS](https://emailjs.com) | 200 emails/mes | Fallback automático |

**Total gratuito: ~450 envíos/mes.**

### Claves a configurar en `js/main.js`

```js
const WEB3FORMS_KEY    = '...';  // Access Key de web3forms.com
const EMAILJS_SERVICE  = '...';  // Service ID de emailjs.com
const EMAILJS_TEMPLATE = '...';  // Template ID de emailjs.com
const EMAILJS_PUBKEY   = '...';  // Public Key de emailjs.com
```

### Rate limiting por IP

Para evitar abuso, el formulario bloquea más de **3 envíos por IP cada 24 horas**. Si se supera, muestra un aviso con contacto alternativo (WhatsApp/email directo).

📄 **Guía de configuración paso a paso:** [`SETUP-EMAIL.md`](./SETUP-EMAIL.md)

---

## Sincronización con Google Sheets

Las propiedades del panel admin se pueden sincronizar con una Google Sheet en la nube mediante Google Apps Script.

### Clave a configurar en `js/main.js`

```js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/.../exec';
```

### Cómo funciona

1. El botón "Sincronizar con Google Sheets" en el panel admin envía todas las propiedades como POST al Apps Script
2. El script escribe los datos en la hoja de cálculo configurada
3. Usa `mode: 'no-cors'` para evitar bloqueos del navegador (el request llega igual)

📄 **Guía de configuración paso a paso:** [`SETUP-GOOGLE-SHEETS.md`](./SETUP-GOOGLE-SHEETS.md)

---

## Contacto configurado en el sitio

| Canal | Valor actual |
|-------|-------------|
| WhatsApp | `+54 9 11 7525 9500` |
| Email | `info@gonzalezinmuebles.com.ar` |

Para cambiarlos, buscar en `index.html` y `pages/tasacion.html`:
- `wa.me/5491175259500`
- `mailto:info@gonzalezinmuebles.com.ar`

---

## Tecnologías usadas

| Tecnología | Uso |
|------------|-----|
| HTML / CSS / JS vanilla | Base del sitio, sin frameworks |
| [TailwindCSS](https://tailwindcss.com) (CDN) | Estilos y responsividad |
| [Lucide Icons](https://lucide.dev) (CDN) | Iconografía |
| [Cloudinary](https://cloudinary.com) | Hosting de imágenes |
| [Nominatim / OpenStreetMap](https://nominatim.org) | Autocompletado de ubicaciones |
| localStorage | Persistencia de datos en el browser |
| Express (Node.js) | Servidor proxy — oculta todas las keys del cliente |
| Google Apps Script | Backend serverless para escribir en Google Sheets |
| Web3Forms + EmailJS | Envío de emails (llamados desde el servidor) |

---

## Deploy en Render

### Archivos relevantes

- `server.js` — servidor Express (API proxy + static serving)
- `package.json` — dependencias
- `.env.example` — template de variables de entorno

### Pasos

1. En Render → **New Web Service** → conectar el repositorio
2. Configurar:
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
   - **Node version:** 18 o superior
3. En la sección **Environment**, agregar las variables del `.env.example`:

| Variable | Descripción |
|----------|-------------|
| `SHEETS_PUB_URL` | URL del CSV publicado de Google Sheets |
| `APPS_SCRIPT_URL` | URL del Apps Script para escribir en la Sheet |
| `WEB3FORMS_KEY` | Access Key de web3forms.com |
| `EMAILJS_SERVICE` | Service ID de emailjs.com |
| `EMAILJS_TEMPLATE` | Template ID de emailjs.com |
| `EMAILJS_PUBKEY` | Public Key de emailjs.com |

4. Hacer clic en **Deploy**

> El free tier de Render duerme el servicio tras 15 min de inactividad. El primer request después del sleep tarda ~30s. Para un sitio de bajo tráfico es aceptable.

### Desarrollo local

```bash
cp .env.example .env   # completar con valores reales
npm install
npm run dev            # usa node --watch para hot reload
```

---

## Notas de seguridad

- Ninguna key ni URL de servicios externos se expone al cliente. Todo vive en variables de entorno del servidor.
- La contraseña `admin123` del panel está en `panel.html`. **Cambiarla antes de publicar.**
- Los leads (consultas, tasaciones) viven en localStorage del navegador. Para persistirlos en la nube habría que agregar un endpoint `/api/leads` al servidor.
