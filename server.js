import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const newRequestId = () => crypto.randomUUID?.() || crypto.randomBytes(8).toString('hex');
const truncateText = (value, maxLength = 300) => {
  const text = String(value ?? '');
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};
const getUrlInfo = (value) => {
  if (!value) return { configured: false };
  try {
    const url = new URL(value);
    return {
      configured: true,
      host: url.host,
      pathnamePrefix: truncateText(url.pathname, 60)
    };
  } catch {
    return { configured: true, invalidUrl: true };
  }
};
const summarizePropertyPayload = (property = {}) => ({
  operation: property._operation || 'upsert',
  id: property.id ?? null,
  title: property.title || null,
  price: property.price ?? null,
  location: property.location || null,
  status: property.status || null,
  imagesCount: Array.isArray(property.images) ? property.images.length : 0,
  fields: Object.keys(property)
});
const logStartupDiagnostics = () => {
  console.log('[startup] Configuración de entorno', {
    nodeEnv: process.env.NODE_ENV || 'sin NODE_ENV',
    nodeVersion: process.version,
    cwd: process.cwd(),
    port: PORT,
    render: Boolean(process.env.RENDER),
    hasAdminPassword: Boolean(process.env.ADMIN_PASSWORD),
    hasSessionSecret: Boolean(process.env.SESSION_SECRET),
    appsScriptUrl: getUrlInfo(process.env.APPS_SCRIPT_URL),
    sheetsPubUrl: getUrlInfo(process.env.SHEETS_PUB_URL),
    emailjs: {
      hasService: Boolean(process.env.EMAILJS_SERVICE),
      hasTemplate: Boolean(process.env.EMAILJS_TEMPLATE),
      hasPublicKey: Boolean(process.env.EMAILJS_PUBKEY),
      hasPrivateKey: Boolean(process.env.EMAILJS_PRIVATE_KEY)
    }
  });
};

app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) return next();

  const requestId = req.headers['x-request-id'] || newRequestId();
  const startedAt = Date.now();
  req.requestId = requestId;

  console.log(`[request:${requestId}] Inicio`, {
    method: req.method,
    path: req.path,
    contentType: req.headers['content-type'] || null,
    userAgent: truncateText(req.headers['user-agent'], 120)
  });

  res.on('finish', () => {
    console.log(`[request:${requestId}] Fin`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt
    });
  });

  next();
});

/* ================================================
   AUTH — login / sesión del panel admin
================================================ */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Familia01$';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 horas

const signToken = (payload) => {
  const data = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
  return Buffer.from(data).toString('base64') + '.' + sig;
};
const verifyToken = (token) => {
  if (!token) return null;
  const [b64, sig] = token.split('.');
  if (!b64 || !sig) return null;
  const data = Buffer.from(b64, 'base64').toString();
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

const requireApiAuth = (req, res, next) => {
  if (verifyToken(req.cookies?.admin_session)) return next();
  res.status(401).json({ ok: false, error: 'auth_required' });
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
    maxAge: SESSION_TTL
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
  const rows = parseCSVRows(text);
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).filter(row => row.some(value => String(value ?? '').trim())).map(vals => {
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] ?? '').trim(); });
    if (vals.length > headers.length) {
      obj.__extra = vals.slice(headers.length).map(v => (v ?? '').trim());
    }
    return obj;
  });
};

const parseCSVRows = (text) => {
  if (!text.trim()) return [];

  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cur);
      cur = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else {
      cur += char;
    }
  }

  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }

  return rows;
};

const VALID_PROPERTY_STATUSES = new Set(['Publicada', 'Borrador', 'Pausada', 'Vendida/Alquilada']);

const normalizePropertyRow = (p) => {
  const normalized = { ...p };
  const extras = Array.isArray(p.__extra) ? p.__extra.filter(Boolean) : [];
  const looksShifted = extras.length > 0
    && (!VALID_PROPERTY_STATUSES.has(String(p.status || '')))
    && (!String(p.images || '').includes('http'));

  if (looksShifted) {
    const recoveredImages = extras.find(value => String(value).includes('http'));
    const recoveredStatus = extras.find(value => VALID_PROPERTY_STATUSES.has(String(value)));
    const recoveredDescription = extras.find(value => {
      const text = String(value);
      return text && !text.includes('http') && !VALID_PROPERTY_STATUSES.has(text);
    });

    if (recoveredImages) normalized.images = recoveredImages;
    if (recoveredStatus) normalized.status = recoveredStatus;
    if (!normalized.description && recoveredDescription) normalized.description = recoveredDescription;

    console.warn('[properties] Fila con columnas corridas recuperada desde valores extra', {
      id: p.id,
      title: p.title,
      originalImages: p.images,
      originalStatus: p.status,
      recoveredStatus: normalized.status,
      recoveredImagesCount: recoveredImages ? String(recoveredImages).split(';').filter(Boolean).length : 0
    });
  } else if (p.status && !VALID_PROPERTY_STATUSES.has(String(p.status))) {
    console.warn('[properties] Fila con status no reconocido', {
      id: p.id,
      title: p.title,
      status: p.status
    });
  }

  delete normalized.__extra;
  return normalized;
};

const normalizeBlockedPropertyTitle = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ');

const BLOCKED_PROPERTY_TITLE_PHRASES = new Set([
  'inodoro con olor a culo'
]);

const isBlockedPropertyRow = (p) => {
  const normalizedTitle = normalizeBlockedPropertyTitle(p.title);
  if (!normalizedTitle) return false;

  for (const blockedTitle of BLOCKED_PROPERTY_TITLE_PHRASES) {
    if (normalizedTitle === blockedTitle || normalizedTitle.includes(blockedTitle)) {
      console.warn('[properties] Fila bloqueada por titulo ofensivo/de prueba conocido', {
        id: truncateText(p.id, 80),
        title: truncateText(p.title, 120)
      });
      return true;
    }
  }

  return false;
};

/* ================================================
   Cache en memoria para propiedades
   TTL configurable via env CACHE_TTL_MS (default: 5 min)
   Evita llamar a Google Sheets en cada request.
================================================ */
const CACHE_TTL = Number(process.env.CACHE_TTL_MS) || 5 * 60 * 1000; // 5 minutos
let _cache = { data: null, expiresAt: 0 };

const normalizeFetchedProperties = (rows) => rows
  .map(normalizePropertyRow)
  .filter(p => !isBlockedPropertyRow(p))
  .map(p => ({
    ...p,
    price: Number(p.price) || 0,
    beds: Number(p.beds) || 0,
    baths: Number(p.baths) || 0,
    sqm: Number(p.sqm) || 0,
    images: Array.isArray(p.images)
      ? p.images.filter(Boolean)
      : (p.images && String(p.images) !== '0' ? String(p.images).split(';').filter(Boolean) : [])
  }));

const fetchPropertiesFromAppsScript = async () => {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) throw new Error('APPS_SCRIPT_URL no configurada');

  console.log('[properties] Leyendo Apps Script', getUrlInfo(url));
  const r = await fetch(url);
  const text = await r.text();
  console.log('[properties] Respuesta Apps Script', {
    status: r.status,
    ok: r.ok,
    contentType: r.headers.get('content-type'),
    responseLength: text.length
  });

  if (text.trimStart().startsWith('<')) {
    throw new Error(`Apps Script devolvió HTML: ${truncateText(text)}`);
  }

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error(`Apps Script no devolvió un array: ${truncateText(text)}`);
  }

  return normalizeFetchedProperties(parsed);
};

const fetchPropertiesFromPublishedCsv = async () => {
  const url = process.env.SHEETS_PUB_URL;
  if (!url) throw new Error('SHEETS_PUB_URL no configurada');

  console.log('[properties] Leyendo CSV publicado', getUrlInfo(url));
  const r = await fetch(url);
  const text = await r.text();
  console.log('[properties] Respuesta CSV', {
    status: r.status,
    ok: r.ok,
    contentType: r.headers.get('content-type'),
    responseLength: text.length
  });

  if (text.trimStart().startsWith('<')) {
    throw new Error(`La Sheet devolvió HTML: ${truncateText(text)}`);
  }

  return normalizeFetchedProperties(parseCSV(text));
};

const fetchProperties = async () => {
  if (process.env.APPS_SCRIPT_URL) {
    try {
      return await fetchPropertiesFromAppsScript();
    } catch (e) {
      console.warn('[properties] No se pudo leer Apps Script, usando CSV publicado como fallback', {
        message: e.message
      });
    }
  }

  if (!process.env.SHEETS_PUB_URL) {
    console.warn('[properties] SHEETS_PUB_URL no configurada');
    return [];
  }

  return fetchPropertiesFromPublishedCsv();
};

/* ================================================
   GET /api/properties
   Sirve desde cache; refresca solo cuando expira.
================================================ */
app.get('/api/properties', async (req, res) => {
  try {
    if (Date.now() < _cache.expiresAt && _cache.data) {
      console.log(`[properties:${req.requestId}] Cache hit`, { count: _cache.data.length });
      return res.json(_cache.data); // cache hit
    }
    const props = await fetchProperties();
    _cache.data = props;
    _cache.expiresAt = Date.now() + CACHE_TTL;
    console.log(`[properties] Cache refrescado — ${props.length} propiedades, próximo refresh en ${CACHE_TTL / 1000}s`);
    res.json(props);
  } catch (e) {
    console.error(`[properties:${req.requestId}] Error`, e.message);
    // Si falla el fetch pero tenemos cache viejo, lo usamos igual
    if (_cache.data) {
      console.warn(`[properties:${req.requestId}] Usando cache vieja por error`, { count: _cache.data.length });
      return res.json(_cache.data);
    }
    res.status(502).json({ error: 'No se pudo leer la Sheet' });
  }
});

/* ================================================
   POST /api/invalidate-cache
   Llamado automáticamente después de guardar una propiedad
   para que el próximo GET traiga datos frescos.
================================================ */
app.post('/api/invalidate-cache', requireApiAuth, (req, res) => {
  _cache.expiresAt = 0;
  console.log(`[cache:${req.requestId}] Invalidado manualmente`);
  res.json({ ok: true });
});

/* ================================================
   POST /api/sync-property
   Reenvía la propiedad al Apps Script para escribirla en la Sheet.
   Ahora podemos leer la respuesta (sin no-cors).
================================================ */
app.post('/api/sync-property', requireApiAuth, async (req, res) => {
  const requestId = req.requestId || newRequestId();
  const url = process.env.APPS_SCRIPT_URL;
  const operation = req.body?._operation || 'upsert';
  const propertyId = req.body?.id ?? 'sin-id';

  console.log(`[sync-property:${requestId}] Inicio`, {
    operation,
    propertyId,
    appsScriptUrl: getUrlInfo(url),
    payload: summarizePropertyPayload(req.body)
  });

  if (!url) {
    console.warn(`[sync-property:${requestId}] APPS_SCRIPT_URL no configurada`);
    return res.json({ ok: false, reason: 'no_url' });
  }

  try {
    const body = JSON.stringify(req.body);
    console.log(`[sync-property:${requestId}] Enviando a Apps Script`, {
      operation,
      propertyId,
      bodyLength: body.length
    });

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body
    });
    const text = await r.text();
    let data = {};
    let parsedJson = false;
    try {
      data = JSON.parse(text);
      parsedJson = true;
    } catch {
      console.warn(`[sync-property:${requestId}] La respuesta no es JSON`, {
        status: r.status,
        contentType: r.headers.get('content-type'),
        responseLength: text.length,
        responsePreview: truncateText(text)
      });
    }
    const syncOk = r.ok && parsedJson && data.success !== false;
    console.log(`[sync-property:${requestId}] Respuesta de Apps Script`, {
      status: r.status,
      ok: r.ok,
      contentType: r.headers.get('content-type'),
      parsedJson,
      appsScriptSuccess: data.success,
      appsScriptVersion: data.version,
      deleted: data.deleted,
      reason: data.reason,
      headers: Array.isArray(data.headers) ? data.headers : undefined,
      responseKeys: Object.keys(data),
      syncOk
    });

    if (!syncOk) {
      console.warn(`[sync-property:${requestId}] Sync falló o quedó indeterminado`, {
        operation,
        propertyId,
        httpOk: r.ok,
        parsedJson,
        appsScriptSuccess: data.success,
        appsScriptVersion: data.version,
        error: data.error,
        headers: Array.isArray(data.headers) ? data.headers : undefined,
        responsePreview: parsedJson ? undefined : truncateText(text)
      });
    }

    // Invalidar cache: el próximo GET traerá los datos frescos de la Sheet
    _cache.expiresAt = 0;
    res.json({
      ok: syncOk,
      operation,
      appsScript: parsedJson ? data : { parse_error: true, status: r.status }
    });
  } catch (e) {
    console.error(`[sync-property:${requestId}] Error`, {
      operation,
      propertyId,
      message: e.message,
      stack: e.stack
    });
    res.status(502).json({ ok: false, error: e.message });
  }
});

/* ================================================
   POST /api/send-email
   Envía tasaciones, consultas generales y consultas
   por propiedad usando EmailJS del lado servidor.
   Ninguna credencial sale al cliente.
================================================ */
app.post('/api/send-email', async (req, res) => {
  const requestId = req.requestId || newRequestId();
  const lead = req.body;
  const leadType = lead?.tipoLead || lead?.source || 'tasacion';
  const subjectByType = {
    tasacion: `Nueva tasación - ${lead?.nombre || 'sin nombre'}`,
    contacto: `Nuevo mensaje de contacto - ${lead?.nombre || 'sin nombre'}`,
    consulta_propiedad: `Consulta por propiedad - ${lead?.propiedad || 'sin propiedad'}`
  };
  const subject = subjectByType[leadType] || `Nuevo contacto - ${lead?.nombre || 'sin nombre'}`;
  const comentarios = lead?.comentarios || lead?.mensaje || '—';

  console.log(`[send-email:${requestId}] Solicitud recibida`, {
    leadType,
    camposConValor: Object.entries(lead || {})
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key),
    hasEmail: Boolean(lead?.email),
    hasPhone: Boolean(lead?.telefono),
    hasMessage: Boolean(lead?.mensaje || lead?.comentarios),
    propertyId: lead?.propiedadId || null
  });

  if (!lead?.nombre || !lead?.email) {
    console.warn(`[send-email:${requestId}] Payload incompleto`, {
      leadType,
      hasNombre: Boolean(lead?.nombre),
      hasEmail: Boolean(lead?.email)
    });
    return res.status(400).json({ sent: false, error: 'missing_required_fields' });
  }

  // EmailJS API (server-side call)
  const ejService = process.env.EMAILJS_SERVICE;
  const ejTemplate = process.env.EMAILJS_TEMPLATE;
  const ejPubkey = process.env.EMAILJS_PUBKEY;
  const ejPrivkey = process.env.EMAILJS_PRIVATE_KEY; // recomendado para llamadas server-side
  console.log(`[send-email:${requestId}] Configuración EmailJS`, {
    hasService: Boolean(ejService),
    hasTemplate: Boolean(ejTemplate),
    hasPublicKey: Boolean(ejPubkey),
    hasPrivateKey: Boolean(ejPrivkey)
  });
  if (ejService && ejTemplate && ejPubkey) {
    try {
      const templateParams = {
        subject,
        tipoLead: leadType,
        tipo_lead: leadType,
        nombre: lead.nombre,
        telefono: lead.telefono || '',
        email: lead.email,
        barrio: lead.barrio || '',
        tipo: lead.tipo || '',
        ambientes: lead.ambientes || '',
        sqm: lead.sqm || '',
        antiguedad: lead.antiguedad || '',
        comentarios,
        mensaje: lead.mensaje || comentarios,
        propiedad: lead.propiedad || '',
        propiedadId: lead.propiedadId || '',
        fecha: lead.fecha || new Date().toLocaleString('es-AR')
      };
      console.log(`[send-email:${requestId}] Enviando a EmailJS`, {
        leadType,
        templateParamsKeys: Object.keys(templateParams),
        hasSubject: Boolean(subject)
      });

      const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: ejService,
          template_id: ejTemplate,
          user_id: ejPubkey,
          accessToken: ejPrivkey || undefined,
          template_params: templateParams
        })
      });
      console.log(`[send-email:${requestId}] Respuesta EmailJS`, {
        leadType,
        status: r.status,
        ok: r.ok,
        contentType: r.headers.get('content-type')
      });
      if (r.status === 200) return res.json({ sent: true, via: 'emailjs', leadType });
      const errorText = await r.text();
      console.warn(`[send-email:${requestId}] EmailJS respondió error`, {
        leadType,
        status: r.status,
        preview: truncateText(errorText)
      });
    } catch (e) {
      console.warn(`[send-email:${requestId}] EmailJS falló:`, {
        message: e.message,
        stack: e.stack
      });
    }
  } else {
    console.warn(`[send-email:${requestId}] EmailJS incompleto, no se intenta envío`);
  }

  console.warn(`[send-email:${requestId}] No se pudo enviar email por ningún proveedor`);
  res.json({ sent: false });
});

/* ================================================
   SPA fallback: rutas HTML que no son archivos
================================================ */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  logStartupDiagnostics();
  console.log(`González Inmuebles corriendo en http://localhost:${PORT}`);
});
