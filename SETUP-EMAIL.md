# Configuración de envío de emails para Tasaciones

El formulario de tasación envía automáticamente un correo a tu casilla cuando alguien completa la solicitud.  
Usa **dos servicios gratuitos** en cascada para garantizar la entrega:

| Servicio | Límite gratis | Rol |
|----------|--------------|-----|
| [Web3Forms](https://web3forms.com) | **250 emails/mes** | Primario |
| [EmailJS](https://emailjs.com) | **200 emails/mes** | Fallback automático |

Total combinado: **~450 envíos gratis por mes** con redundancia.

Además se aplica un **bloqueo por IP**: máximo 3 envíos cada 24 horas desde la misma dirección,  
lo que previene abuso sin necesidad de CAPTCHA.

---

## Paso 1 — Configurar Web3Forms (primario)

1. Ingresá a [web3forms.com](https://web3forms.com)
2. Escribí el **email de destino** (donde querés recibir las tasaciones)
3. Hacé clic en **"Create your Access Key"**
4. Revisá tu correo y copiá la Access Key que te enviaron
5. Abrí `js/main.js` y reemplazá:
   ```js
   const WEB3FORMS_KEY = 'REEMPLAZAR_WEB3FORMS_KEY';
   ```
   por:
   ```js
   const WEB3FORMS_KEY = 'tu-access-key-aqui';
   ```

> No requiere cuenta, no requiere backend. ¡Listo!

---

## Paso 2 — Configurar EmailJS (fallback)

> Solo se usa si Web3Forms falla o llega al límite mensual.

### 2a. Crear cuenta y servicio
1. Registrate en [emailjs.com](https://emailjs.com) (gratis)
2. En el panel → **Email Services** → **Add New Service**
3. Elegí Gmail u Outlook y conectá tu cuenta
4. Copiá el **Service ID** (ej: `service_abc123`)

### 2b. Crear template de email
1. En el panel → **Email Templates** → **Create New Template**
2. Pegá este contenido de ejemplo:

**Subject:** `Nueva tasación – {{nombre}}`

**Body:**
```
Nueva solicitud de tasación recibida:

Nombre:      {{nombre}}
Teléfono:    {{telefono}}
Email:       {{email}}
Barrio:      {{barrio}}
Tipo:        {{tipo}}
Ambientes:   {{ambientes}}
M² totales:  {{sqm}}
Antigüedad:  {{antiguedad}}
Comentarios: {{comentarios}}
Fecha:       {{fecha}}
```

3. Guardá y copiá el **Template ID** (ej: `template_xyz789`)

### 2c. Obtener Public Key
1. En el panel → tu usuario (arriba a la derecha) → **Account**
2. Copiá la **Public Key** (ej: `user_AbCdEf123`)

### 2d. Pegar las claves en el código
Abrí `js/main.js` y completá:
```js
const EMAILJS_SERVICE  = 'service_abc123';
const EMAILJS_TEMPLATE = 'template_xyz789';
const EMAILJS_PUBKEY   = 'user_AbCdEf123';
```

---

## Cómo funciona el envío

```
Usuario envía el form
        │
        ▼
  ¿Rate limit por IP?  (máx 3 / 24 h)
  ├── Sí → muestra aviso, NO envía
  └── No ↓
        ▼
  Intenta Web3Forms
  ├── ✅ Éxito → email enviado, fin
  └── ❌ Falla ↓
        ▼
  Intenta EmailJS
  ├── ✅ Éxito → email enviado, fin
  └── ❌ Falla → el lead se guardó igual en localStorage (panel admin)
```

El lead **siempre se guarda en localStorage** independientemente del email,  
así lo podés ver en el panel de administración → sección **Tasaciones**.

---

## Verificar que funcione

1. Completá el formulario de tasación en el sitio
2. Revisá tu casilla de correo
3. También revisá el panel de admin → Tasaciones (debe aparecer el lead)

Si no llega el email pero sí aparece en el panel, revisá que las claves sean correctas.
