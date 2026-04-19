import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

const app  = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/* ================================================
   AUTH — login / sesión del panel admin
================================================ */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_TTL    = 8 * 60 * 60 * 1000; // 8 horas

const signToken = (payload) => {
  const data = JSON.stringify(payload);
  const sig  = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
  return Buffer.from(data).toString('base64') + '.' + sig;
};
const verifyToken = (token) => {
  if (!token) return null;
  const [b64, sig] = token.split('.');
  if (!b64 || !sig) return null;
  const data     = Buffer.from(b64, 'base64').toString();
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
  if (sig !== expected) return null;
  const payload = JSON.parse(data);
  if (Date.now() > payload.exp) return null;
  return payload;
};

// Middleware que protege rutas del panel admin
const requireAuth = (req, res, next) => {
  if (verifyToken(req.cookies?.admin_session)) return next();
  res.redirect('/login.html');
};

// POST /api/login — valida contraseña y emite cookie
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Contraseña incorrecta' });
  }
  const token = signToken({ role: 'admin', exp: Date.now() + SESSION_TTL });
  res.cookie('admin_session', token, {
    httpOnly: true,   // JS del cliente no puede leerla
    sameSite: 'lax',
    maxAge:   SESSION_TTL
  });
  res.json({ ok: true });
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('admin_session');
  res.json({ ok: true });
});

// Proteger panel.html — requiere sesión válida
app.get('/panel.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'panel.html'));
});

// Archivos estáticos públicos (index, pages, js, etc.)
app.use(express.static(__dirname, {
  // Excluir panel.html del static serving (lo maneja la ruta protegida arriba)
  index: 'index.html'
}));

/* ================================================
   HELPERS
================================================ */
const parseCSV = (text) => {
  const rows = text.trim().split('\n');
  if (rows.length < 2) return [];
  const headers = csvSplit(rows[0]);
  return rows.slice(1).map(row => {
    const vals = csvSplit(row);
    const obj  = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] ?? '').trim(); });
    return obj;
  });
};

const csvSplit = (line) => {
  const out = []; let cur = '', inQ = false;
  for (const c of line) {
    if (c === '"') inQ = !inQ;
    else if (c === ',' && !inQ) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
};

/* ================================================
   Cache en memoria para propiedades
   TTL configurable via env CACHE_TTL_MS (default: 5 min)
   Evita llamar a Google Sheets en cada request.
================================================ */
const CACHE_TTL = Number(process.env.CACHE_TTL_MS) || 5 * 60 * 1000; // 5 minutos
let _cache = { data: null, expiresAt: 0 };

const fetchProperties = async () => {
  const url = process.env.SHEETS_PUB_URL;
  if (!url) return [];

  const r    = await fetch(url);
  const text = await r.text();

  if (text.trimStart().startsWith('<')) {
    console.warn('[properties] La Sheet devolvió HTML — publicala en: Archivo → Compartir → Publicar en la web → CSV');
    return [];
  }

  return parseCSV(text).map(p => ({
    ...p,
    price: Number(p.price) || 0,
    beds:  Number(p.beds)  || 0,
    baths: Number(p.baths) || 0,
    sqm:   Number(p.sqm)   || 0,
    images: p.images ? String(p.images).split(';').filter(Boolean) : []
  }));
};

/* ================================================
   GET /api/properties
   Sirve desde cache; refresca solo cuando expira.
================================================ */
app.get('/api/properties', async (req, res) => {
  try {
    if (Date.now() < _cache.expiresAt && _cache.data) {
      return res.json(_cache.data); // cache hit
    }
    const props    = await fetchProperties();
    _cache.data      = props;
    _cache.expiresAt = Date.now() + CACHE_TTL;
    console.log(`[properties] Cache refrescado — ${props.length} propiedades, próximo refresh en ${CACHE_TTL / 1000}s`);
    res.json(props);
  } catch (e) {
    console.error('[/api/properties]', e.message);
    // Si falla el fetch pero tenemos cache viejo, lo usamos igual
    if (_cache.data) return res.json(_cache.data);
    res.status(502).json({ error: 'No se pudo leer la Sheet' });
  }
});

/* ================================================
   POST /api/invalidate-cache
   Llamado automáticamente después de guardar una propiedad
   para que el próximo GET traiga datos frescos.
================================================ */
app.post('/api/invalidate-cache', (req, res) => {
  _cache.expiresAt = 0;
  console.log('[cache] Invalidado manualmente');
  res.json({ ok: true });
});

/* ================================================
   POST /api/sync-property
   Reenvía la propiedad al Apps Script para escribirla en la Sheet.
   Ahora podemos leer la respuesta (sin no-cors).
================================================ */
app.post('/api/sync-property', async (req, res) => {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) return res.json({ ok: false, reason: 'no_url' });

  try {
    const r = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify(req.body)
    });
    const text = await r.text();
    let data = {};
    try { data = JSON.parse(text); } catch {}
    // Invalidar cache: el próximo GET traerá los datos frescos de la Sheet
    _cache.expiresAt = 0;
    res.json({ ok: data.success !== false });
  } catch (e) {
    console.error('[/api/sync-property]', e.message);
    res.status(502).json({ ok: false, error: e.message });
  }
});

/* ================================================
   POST /api/send-email
   Primario: Gmail SMTP via Nodemailer (server-side, sin restricciones de CORS)
   Fallback:  EmailJS API
   Ninguna credencial sale al cliente.
================================================ */
app.post('/api/send-email', async (req, res) => {
  const lead = req.body;

  const cuerpo = `
Nueva solicitud de tasación recibida:

Nombre:       ${lead.nombre}
Teléfono:     ${lead.telefono}
Email:        ${lead.email}
Barrio:       ${lead.barrio}
Tipo:         ${lead.tipo}
Ambientes:    ${lead.ambientes}
M² totales:   ${lead.sqm}
Antigüedad:   ${lead.antiguedad}
Comentarios:  ${lead.comentarios || '—'}
Fecha:        ${lead.fecha}
  `.trim();

  // Primario: Gmail SMTP via Nodemailer
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass }
      });
      await transporter.sendMail({
        from:    `"González Inmuebles" <${gmailUser}>`,
        to:      gmailUser,
        replyTo: lead.email || gmailUser,
        subject: `Nueva tasación – ${lead.nombre} | ${lead.barrio || 'sin barrio'}`,
        text:    cuerpo
      });
      return res.json({ sent: true, via: 'gmail' });
    } catch (e) {
      console.warn('[/api/send-email] Gmail falló:', e.message);
    }
  }

  // Fallback: EmailJS API (server-side call)
  const ejService  = process.env.EMAILJS_SERVICE;
  const ejTemplate = process.env.EMAILJS_TEMPLATE;
  const ejPubkey   = process.env.EMAILJS_PUBKEY;
  const ejPrivkey  = process.env.EMAILJS_PRIVATE_KEY; // recomendado para llamadas server-side
  if (ejService && ejTemplate && ejPubkey) {
    try {
      const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id:   ejService,
          template_id:  ejTemplate,
          user_id:      ejPubkey,
          accessToken:  ejPrivkey || undefined,
          template_params: {
            subject:    `Nueva tasación – ${lead.nombre}`,
            nombre:     lead.nombre,   telefono: lead.telefono,
            email:      lead.email,    barrio:   lead.barrio,
            tipo:       lead.tipo,     ambientes:lead.ambientes,
            sqm:        lead.sqm,      antiguedad:lead.antiguedad,
            comentarios:lead.comentarios || '—', fecha: lead.fecha
          }
        })
      });
      if (r.status === 200) return res.json({ sent: true, via: 'emailjs' });
    } catch (e) {
      console.warn('[/api/send-email] EmailJS falló:', e.message);
    }
  }

  res.json({ sent: false });
});

/* ================================================
   SPA fallback: rutas HTML que no son archivos
================================================ */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`González Inmuebles corriendo en http://localhost:${PORT}`);
});
