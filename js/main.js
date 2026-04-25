/* ================================================
   Rate limiter por IP (cliente): máx 3 envíos / 24 h
   El envío real y las keys viven en el servidor (/api/send-email)
================================================ */
const _checkTasacionRateLimit = async () => {
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal });
    const { ip } = await res.json();
    const key  = 'rl_t_' + btoa(ip).replace(/[^a-z0-9]/gi, '');
    const data = JSON.parse(localStorage.getItem(key) || '{"n":0,"until":0}');
    if (Date.now() > data.until) { data.n = 0; data.until = Date.now() + 86400000; }
    if (data.n >= 3) return false;
    data.n++;
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return true;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================
     INICIALIZACIÓN
  ========================================== */
  if (window.lucide) {
    lucide.createIcons();
  }

  /* ==========================================
     FORMULARIO DE TASACIÓN
  ========================================== */
  const tasacionForm = document.getElementById("tasacionForm");
  const submitBtn = document.getElementById("submitBtn");
  const successMessage = document.getElementById("successMessage");

  if (tasacionForm) {
    tasacionForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const originalBtnContent = submitBtn.innerHTML;
      const setLoading = (msg) => {
        submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> ${msg}`;
        submitBtn.disabled = true;
        submitBtn.classList.add("opacity-80", "cursor-not-allowed");
        lucide.createIcons();
      };
      const resetBtn = () => {
        submitBtn.innerHTML = originalBtnContent;
        submitBtn.disabled = false;
        submitBtn.classList.remove("opacity-80", "cursor-not-allowed");
        lucide.createIcons();
      };
      const showMsg = (html, classes = 'bg-green-50 text-green-800 border-green-200') => {
        successMessage.className = `p-4 rounded-xl border flex items-center gap-3 ${classes}`;
        successMessage.innerHTML = html;
        successMessage.classList.remove("hidden");
        setTimeout(() => successMessage.classList.add("hidden"), 7000);
      };

      setLoading('Verificando...');

      // Rate limit por IP
      const allowed = await _checkTasacionRateLimit();
      if (!allowed) {
        resetBtn();
        showMsg(
          '<i data-lucide="alert-circle" class="w-5 h-5 shrink-0"></i><span>Límite alcanzado. Podés enviarnos un WhatsApp o email directamente.</span>',
          'bg-yellow-50 text-yellow-800 border-yellow-200'
        );
        lucide.createIcons();
        return;
      }

      setLoading('Enviando solicitud...');

      // Recopilar datos del lead
      const lead = {
        fecha: new Date().toLocaleString('es-AR'),
        nombre: document.getElementById('tasNombre')?.value || '',
        telefono: document.getElementById('tasTelefono')?.value || '',
        email: document.getElementById('tasEmail')?.value || '',
        barrio: document.getElementById('tasBarrio')?.value || '',
        tipo: document.getElementById('tasTipo')?.value || '',
        ambientes: document.getElementById('tasAmbientes')?.value || '',
        sqm: document.getElementById('tasSqm')?.value || '',
        antiguedad: document.getElementById('tasAntiguedad')?.value || '',
        comentarios: document.getElementById('tasComentarios')?.value || '',
        estado: 'Nuevo'
      };

      // Guardar en localStorage (panel admin)
      if (lead.nombre) {
        const leads = JSON.parse(localStorage.getItem('tasaciones_db') || '[]');
        leads.unshift(lead);
        localStorage.setItem('tasaciones_db', JSON.stringify(leads));
      }

      // Enviar email via servidor (keys guardadas en variables de entorno de Render)
      let sent = false;
      try {
        const r = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead)
        });
        const d = await r.json();
        sent = d.sent === true;
      } catch { sent = false; }

      resetBtn();

      if (sent) {
        showMsg('<i data-lucide="check-circle" class="w-5 h-5 shrink-0 text-green-600"></i><span class="font-medium">¡Solicitud enviada! Nos contactaremos a la brevedad.</span>');
      } else {
        // Sin configurar o ambos servicios fallaron → éxito silencioso (lead igual quedó guardado)
        showMsg('<i data-lucide="check-circle" class="w-5 h-5 shrink-0 text-green-600"></i><span class="font-medium">¡Solicitud recibida! Nos contactaremos a la brevedad.</span>');
      }

      tasacionForm.reset();
      lucide.createIcons();
    });
  }

  /* ==========================================
     FORMULARIO DE CONTACTO
  ========================================== */
  const contactoForm = document.getElementById("contactoForm");
  const contactSubmit = document.getElementById("contactSubmit");
  const contactSuccess = document.getElementById("contactSuccess");

  if (contactoForm) {
    contactoForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const originalBtnContent = contactSubmit.innerHTML;
      contactSubmit.innerHTML =
        '<i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto"></i>';
      contactSubmit.disabled = true;
      contactSubmit.classList.add("opacity-80", "cursor-not-allowed");
      lucide.createIcons();

      setTimeout(() => {
        contactSubmit.innerHTML = originalBtnContent;
        contactSubmit.disabled = false;
        contactSubmit.classList.remove("opacity-80", "cursor-not-allowed");

        contactSuccess.classList.remove("hidden");
        contactoForm.reset();

        setTimeout(() => {
          contactSuccess.classList.add("hidden");
        }, 6000);
      }, 1500);
    });
  }

  /* ==========================================
     BASE DE DATOS Y PERSISTENCIA
  ========================================== */
  let properties = [];


  // Cargar propiedades: intenta /api/properties (servidor) primero, cae a localStorage.
  const loadProperties = async () => {
    let raw = [];

    // 1. Leer desde el servidor (que a su vez lee de Google Sheets — sin exponer la URL)
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 6000);
      const res  = await fetch('/api/properties', { signal: ctrl.signal });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          raw = data;
          localStorage.setItem('properties_db', JSON.stringify(raw));
        }
      }
    } catch (e) {
      console.warn('[González] /api/properties no disponible, usando localStorage:', e.message);
    }

    // 2. Fallback: localStorage
    if (raw.length === 0) {
      raw = JSON.parse(localStorage.getItem("properties_db")) || [];
    }

    // 3. Normalizar imágenes a array
    properties = raw.map(p => ({
      ...p,
      images: Array.isArray(p.images)
        ? p.images
        : (p.images ? String(p.images).split(";").filter(Boolean) : [])
    }));

    // 4. Placeholder de demo si no hay nada
    if (properties.length === 0) {
      properties = [
        {
          id: 1,
          title: "Casa de Diseño en Barrio Privado",
          operation: "Venta",
          type: "Casa",
          currency: "USD",
          price: 350000,
          location: "Zona Norte",
          beds: 4,
          baths: 3,
          sqm: 280,
          images: ["https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=1200&q=80"],
        }
      ];
    }

    applyUrlFilters();
    renderPublicProperties();
    renderAdminTable();
    return properties;
  };

  // Exponer para que property-detail.html pueda llamarla
  window.loadProperties = loadProperties;

  /* ==========================================
     FILTROS Y BÚSQUEDA
  ========================================== */
  let filteredProperties = [];
  // Exponer para que pages/properties.html pueda leerla/modificarla
  Object.defineProperty(window, 'filteredProperties', {
    get: () => filteredProperties,
    set: (v) => { filteredProperties = v; }
  });

  const applyUrlFilters = () => {
    const params = new URLSearchParams(window.location.search);
    const operation = params.get("operacion");
    const type = params.get("tipo");
    const location = params.get("ubicacion");

    filteredProperties = [...properties];

    if (operation) {
      filteredProperties = filteredProperties.filter(
        (p) => p.operation.toLowerCase() === operation.toLowerCase()
      );
    }
    if (type) {
      filteredProperties = filteredProperties.filter(
        (p) => p.type.toLowerCase() === type.toLowerCase()
      );
    }
    if (location) {
      filteredProperties = filteredProperties.filter(
        (p) => p.location.toLowerCase().includes(location.toLowerCase())
      );
    }
  };

  window.filterProperties = () => {
    const operation = document.getElementById("filterOperation")?.value;
    const type = document.getElementById("filterType")?.value;
    const minPrice = Number(document.getElementById("filterMinPrice")?.value) || 0;
    const maxPrice = Number(document.getElementById("filterMaxPrice")?.value) || Infinity;
    const sortOrder = document.getElementById("filterSort")?.value;

    filteredProperties = properties.filter((p) => {
      const matchOp = !operation || p.operation.toLowerCase() === operation.toLowerCase();
      const matchType = !type || p.type.toLowerCase() === type.toLowerCase();
      const matchPrice = p.price >= minPrice && p.price <= maxPrice;
      return matchOp && matchType && matchPrice;
    });

    if (sortOrder === "asc") {
      filteredProperties.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "desc") {
      filteredProperties.sort((a, b) => b.price - a.price);
    }

    renderPublicProperties();
  };

  /* ==========================================
     EXPORTAR A CSV
  ========================================== */
  window.exportToCSV = () => {
    const localData = JSON.parse(localStorage.getItem("properties_db")) || [];
    if (localData.length === 0) {
      alert("No hay nuevas propiedades locales para exportar.");
      return;
    }

    const headers = ["id", "title", "operation", "type", "currency", "price", "location", "beds", "baths", "sqm", "images"];
    const csvRows = [headers.join(",")];

    localData.forEach(p => {
      const row = [
        p.id,
        `"${p.title}"`,
        p.operation,
        p.type,
        p.currency,
        p.price,
        `"${p.location}"`,
        p.beds,
        p.baths,
        p.sqm,
        `"${p.images.join(";")}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "nuevas_propiedades.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ==========================================
     CLOUDINARY UPLOAD WIDGET
  ========================================== */
  let uploadedImages = [];
  const uploadWidget = window.cloudinary?.createUploadWidget({
    cloudName: 'dzyiwuftf',
    uploadPreset: 'ml_default',
    sources: ['local', 'url', 'camera'],
    multiple: true
  }, (error, result) => {
    if (!error && result && result.event === "success") {
      uploadedImages.push(result.info.secure_url);
      document.getElementById("adminImages").value = uploadedImages.join(";");

      // Preview
      const previews = document.getElementById("imagePreviews");
      const img = document.createElement("img");
      img.src = result.info.secure_url;
      img.className = "h-20 w-20 object-cover rounded-lg border";
      previews.appendChild(img);
    }
  });

  const uploadBtn = document.getElementById("upload_widget");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => uploadWidget.open());
  }

  /* ==========================================
     FORMULARIO ADMIN (GUARDAR / EDITAR)
  ========================================== */
  const adminForm = document.getElementById("adminForm");
  let editingId = null;

  if (adminForm) {
    adminForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const newProp = {
        id: editingId || Date.now(),
        title: document.getElementById("adminTitle").value,
        operation: document.getElementById("adminOperation").value,
        type: document.getElementById("adminType").value,
        currency: document.getElementById("adminCurrency").value,
        price: Number(document.getElementById("adminPrice").value),
        location: document.getElementById("adminLocation").value,
        beds: Number(document.getElementById("adminBeds").value),
        baths: Number(document.getElementById("adminBaths").value),
        sqm: Number(document.getElementById("adminSqm").value),
        sqmCovered: Number(document.getElementById("adminSqmCovered")?.value) || 0,
        sqmLand: Number(document.getElementById("adminSqmLand")?.value) || 0,
        antiguedad: document.getElementById("adminAntiguedad")?.value || '',
        description: document.getElementById("adminDescription")?.value || '',
        status: document.getElementById("adminStatus")?.value || 'Publicada',
        agentId: document.getElementById("adminAgent")?.value || '',
        images: document.getElementById("adminImages").value.split(";").filter(i => i)
      };

      const localData = JSON.parse(localStorage.getItem("properties_db")) || [];

      if (editingId) {
        const index = localData.findIndex(p => p.id === editingId);
        if (index !== -1) {
          localData[index] = newProp;
        } else {
          // Si no estaba en localData (venía de CSV), lo agregamos a localData para "sobreescribir"
          localData.push(newProp);
        }
        editingId = null;
        adminForm.querySelector('button[type="submit"]').innerHTML = '<i data-lucide="save" class="w-4 h-4"></i> Publicar Propiedad';
      } else {
        localData.push(newProp);
      }

      localStorage.setItem("properties_db", JSON.stringify(localData));

      adminForm.reset();
      document.getElementById("imagePreviews").innerHTML = "";
      uploadedImages = [];

      loadProperties();
      syncToSheet(newProp).then(synced => {
        alert(synced
          ? "✓ Propiedad guardada y sincronizada con Google Sheets."
          : "✓ Propiedad guardada. (Google Sheets no configurado o no disponible)");
      });
    });
  }

  window.editProperty = (id) => {
    const prop = properties.find(p => p.id === id);
    if (!prop) return;

    editingId = id;
    document.getElementById("adminTitle").value = prop.title;
    document.getElementById("adminOperation").value = prop.operation;
    document.getElementById("adminType").value = prop.type;
    document.getElementById("adminCurrency").value = prop.currency;
    document.getElementById("adminPrice").value = prop.price;
    document.getElementById("adminLocation").value = prop.location;
    document.getElementById("adminBeds").value = prop.beds;
    document.getElementById("adminBaths").value = prop.baths;
    document.getElementById("adminSqm").value = prop.sqm;
    document.getElementById("adminImages").value = prop.images.join(";");
    if (document.getElementById("adminSqmCovered")) document.getElementById("adminSqmCovered").value = prop.sqmCovered || '';
    if (document.getElementById("adminSqmLand")) document.getElementById("adminSqmLand").value = prop.sqmLand || '';
    if (document.getElementById("adminAntiguedad")) document.getElementById("adminAntiguedad").value = prop.antiguedad || '';
    if (document.getElementById("adminDescription")) document.getElementById("adminDescription").value = prop.description || '';
    if (document.getElementById("adminStatus")) document.getElementById("adminStatus").value = prop.status || 'Publicada';
    if (document.getElementById("adminAgent")) document.getElementById("adminAgent").value = prop.agentId || '';

    // Preview images
    const previews = document.getElementById("imagePreviews");
    previews.innerHTML = "";
    prop.images.forEach(url => {
      const img = document.createElement("img");
      img.src = url;
      img.className = "h-20 w-20 object-cover rounded-lg border";
      previews.appendChild(img);
    });
    uploadedImages = [...prop.images];

    adminForm.querySelector('button[type="submit"]').innerHTML = '<i data-lucide="edit" class="w-4 h-4"></i> Actualizar Propiedad';
    window.showAdminSection?.('propiedades');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ==========================================
     NAVEGACIÓN PUBLIC / ADMIN
  ========================================== */
  window.toggleView = (view) => {
    const publicView = document.getElementById("publicView");
    const adminView = document.getElementById("adminView");

    if (view === "admin") {
      publicView.classList.add("hidden");
      adminView.classList.remove("hidden");
      adminView.classList.add("flex");
    } else {
      adminView.classList.add("hidden");
      publicView.classList.remove("hidden");
    }

    window.scrollTo(0, 0);
  };

  /* ==========================================
     RENDER PROPIEDADES (FRONT)
  ========================================== */
  window.renderPublicProperties = () => {
    const grid = document.getElementById("propertiesGrid");
    const emptyState = document.getElementById("emptyState");

    if (!grid) return;

    grid.innerHTML = "";

    const isPublished = p => !p.status || p.status === 'Publicada';
    const displayProperties = (filteredProperties.length > 0 || window.location.search)
      ? filteredProperties.filter(isPublished)
      : properties.filter(isPublished);

    if (displayProperties.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    displayProperties.forEach((prop) => {
      const formattedPrice = new Intl.NumberFormat("es-AR").format(prop.price);
      const isVenta = prop.operation.toLowerCase() === "venta";
      const tagClass = isVenta
        ? "bg-brand-green text-white"
        : "bg-white text-brand-dark";

      // Usar la primera imagen o un placeholder
      const mainImage = prop.images && prop.images.length > 0 ? prop.images[0] : 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=1200&q=80';
      const extraImagesCount = prop.images && prop.images.length > 1 ? prop.images.length - 1 : 0;

      const cardHTML = `
        <article class="bg-[#FDFBF7] rounded-sm border border-[#e5ddca] overflow-hidden flex flex-col group cursor-pointer" onclick="openPropertyModal(${prop.id})">
          <div class="relative h-64 overflow-hidden shimmer-bg">
            <span class="absolute top-4 left-4 ${tagClass} text-xs font-bold px-3 py-1.5 rounded-full z-10">
              EN ${prop.operation}
            </span>
            ${extraImagesCount > 0 ? `<span class="absolute top-4 right-4 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full z-10">+${extraImagesCount} fotos</span>` : ''}
            <img src="${mainImage}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 img-fade" onload="this.classList.add('img-loaded')">
            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span class="bg-[#FDFBF7] text-brand-dark px-4 py-2 rounded-sm font-medium text-xs tracking-widest uppercase border border-[#c6a56a]">Ver Detalle</span>
            </div>
          </div>

          <div class="p-6 flex flex-col justify-between flex-1">
            <div>
              <h3 class="text-2xl font-bold text-brand-green">
                ${prop.currency} ${formattedPrice}
              </h3>
              <p class="font-medium text-lg">${prop.title}</p>
              <div class="flex gap-4 mt-2 text-brand-gray text-sm">
                 <span class="flex items-center gap-1"><i data-lucide="maximize" class="w-3 h-3"></i> ${prop.sqm}m²</span>
                 <span class="flex items-center gap-1"><i data-lucide="bed" class="w-3 h-3"></i> ${prop.beds}</span>
                 <span class="flex items-center gap-1"><i data-lucide="bath" class="w-3 h-3"></i> ${prop.baths}</span>
              </div>
              <p class="text-sm text-brand-gray flex items-center gap-1 mt-2">
                <i data-lucide="map-pin" class="w-4 h-4"></i> ${prop.location}
              </p>
            </div>
          </div>
        </article>
      `;
      grid.insertAdjacentHTML("beforeend", cardHTML);
    });

    lucide.createIcons();
  };

  /* ==========================================
     MODAL DE DETALLE
  ========================================== */
  window.openPropertyModal = (id) => {
    const prop = properties.find(p => String(p.id) === String(id));
    if (!prop) return;

    let modal = document.getElementById("propertyModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "propertyModal";
      modal.className = "fixed inset-0 z-[100] hidden bg-brand-dark/70 backdrop-blur-md flex items-center justify-center p-4";
      document.body.appendChild(modal);
    }

    const formattedPrice = new Intl.NumberFormat("es-AR").format(prop.price);

    const imgs = Array.isArray(prop.images)
      ? prop.images.filter(Boolean)
      : (prop.images ? String(prop.images).split(';').filter(Boolean) : []);

    modal.innerHTML = `
        <div class="bg-[#FDFBF7] rounded-sm border border-[#e5ddca] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative">
            <button onclick="closePropertyModal()" class="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all">
                <i data-lucide="x" class="w-6 h-6 text-brand-dark"></i>
            </button>
            
            <div class="overflow-y-auto">
                <!-- Galería -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                    ${imgs.length === 0
                      ? `<div class="md:col-span-2 h-96 overflow-hidden rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">Sin imágenes</div>`
                      : imgs.map((img, i) => `
                        <div class="${i === 0 ? 'md:col-span-2 h-96' : 'h-48'} overflow-hidden rounded-2xl shimmer-bg">
                            <img src="${img}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700 img-fade" onload="this.classList.add('img-loaded')">
                        </div>
                    `).join('')}
                </div>
                
                <div class="p-8">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <span class="bg-brand-green/10 text-brand-green text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                                ${prop.type} en ${prop.operation}
                            </span>
                            <h2 class="text-3xl font-heading font-bold text-brand-dark">${prop.title}</h2>
                            <p class="text-brand-gray flex items-center gap-2 mt-2">
                                <i data-lucide="map-pin" class="w-5 h-5 text-brand-green"></i> ${prop.location}
                            </p>
                        </div>
                        <div class="text-left md:text-right">
                            <p class="text-sm text-brand-gray font-medium">Precio de Publicación</p>
                            <p class="text-4xl font-bold text-brand-green">${prop.currency} ${formattedPrice}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-gray-100 mb-8">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
                                <i data-lucide="maximize" class="w-6 h-6 text-brand-green"></i>
                            </div>
                            <div>
                                <p class="text-xs text-brand-gray font-bold uppercase">Superficie</p>
                                <p class="font-bold">${prop.sqm} m²</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
                                <i data-lucide="bed" class="w-6 h-6 text-brand-green"></i>
                            </div>
                            <div>
                                <p class="text-xs text-brand-gray font-bold uppercase">Dormitorios</p>
                                <p class="font-bold">${prop.beds}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
                                <i data-lucide="bath" class="w-6 h-6 text-brand-green"></i>
                            </div>
                            <div>
                                <p class="text-xs text-brand-gray font-bold uppercase">Baños</p>
                                <p class="font-bold">${prop.baths}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
                                <i data-lucide="check-circle" class="w-6 h-6 text-brand-green"></i>
                            </div>
                            <div>
                                <p class="text-xs text-brand-gray font-bold uppercase">Estado</p>
                                <p class="font-bold">Disponible</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-4">
                        <a href="https://wa.me/5491175259500?text=Hola! Me interesa la propiedad: ${prop.title}" target="_blank" class="w-full bg-brand-green text-white text-center py-4 rounded-2xl font-bold hover:bg-brand-greenLight transition-all flex items-center justify-center gap-2">
                            <i data-lucide="message-circle" class="w-5 h-5"></i> Consultar por WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    lucide.createIcons();
  };

  window.closePropertyModal = () => {
    const modal = document.getElementById("propertyModal");
    if (modal) modal.classList.add("hidden");
    document.body.style.overflow = "auto";
  };

  /* ==========================================
     RENDER TABLA ADMIN
  ========================================== */
  window.renderAdminTable = () => {
    const tbody = document.getElementById("adminTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const statusBadge = {
      'Publicada': 'bg-green-100 text-green-800',
      'Borrador': 'bg-gray-100 text-gray-600',
      'Pausada': 'bg-yellow-100 text-yellow-800',
      'Vendida/Alquilada': 'bg-blue-100 text-blue-800'
    };

    properties.forEach((prop) => {
      const formattedPrice = new Intl.NumberFormat("es-AR").format(prop.price);
      const st = prop.status || 'Publicada';
      const stClass = statusBadge[st] || 'bg-green-100 text-green-800';
      const thumb = prop.images && prop.images[0] ? prop.images[0] : 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=200&q=80';

      tbody.insertAdjacentHTML(
        "beforeend",
        `
        <tr class="hover:bg-gray-50/50">
          <td class="p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg overflow-hidden shimmer-bg flex-shrink-0"><img src="${thumb}" class="w-full h-full object-cover img-fade" onload="this.classList.add('img-loaded')"></div>
              <span class="font-medium">${prop.title}</span>
            </div>
          </td>
          <td class="p-4 text-sm">${prop.operation}</td>
          <td class="p-4 text-sm font-semibold">${prop.currency} ${formattedPrice}</td>
          <td class="p-4"><span class="text-xs font-bold px-2 py-1 rounded-full ${stClass}">${st}</span></td>
          <td class="p-4 text-right flex justify-end gap-2">
            <button onclick="editProperty(${prop.id})" class="text-brand-green hover:text-brand-greenLight p-1">
              <i data-lucide="edit" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteProperty(${prop.id})" class="text-red-500 hover:text-red-700 p-1">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `
      );
    });

    lucide.createIcons();
  };

  /* ==========================================
     ELIMINAR PROPIEDAD
  ========================================== */
  window.deleteProperty = (id) => {
    if (confirm("¿Seguro que querés eliminar esta propiedad?")) {
      const localData = JSON.parse(localStorage.getItem("properties_db")) || [];
      const updatedLocal = localData.filter(p => p.id !== id);
      localStorage.setItem("properties_db", JSON.stringify(updatedLocal));

      // Invalidar cache del servidor para que el próximo GET refleje el cambio
      fetch('/api/invalidate-cache', { method: 'POST' }).catch(() => {});

      loadProperties();
    }
  };

  /* ==========================================
     SECCIONES DEL PANEL ADMIN (ADM-203/204/205/206)
  ========================================== */
  window.showAdminSection = (section) => {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById('adminSection-' + section);
    if (target) target.classList.remove('hidden');
    document.querySelectorAll('.admin-nav-item').forEach(a => {
      a.classList.remove('bg-brand-green/20', 'text-brand-greenLight');
      a.classList.add('text-white/70');
    });
    const nav = document.getElementById('adminNav-' + section);
    if (nav) { nav.classList.add('bg-brand-green/20', 'text-brand-greenLight'); nav.classList.remove('text-white/70'); }
    if (section === 'consultas') window.renderConsultas();
    if (section === 'tasaciones') window.renderTasaciones();
    if (section === 'agentes') window.renderAgentes();
    if (section === 'catalogos') window.renderCatalogos();
  };

  /* -- CONSULTAS (ADM-203) -- */
  window.renderConsultas = () => {
    const tbody = document.getElementById('consultasTableBody');
    if (!tbody) return;
    const data = JSON.parse(localStorage.getItem('consultas_db') || '[]');
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-400 text-sm">No hay consultas todavía.</td></tr>'; return; }
    tbody.innerHTML = data.map((c, i) => `
      <tr class="border-b border-gray-50 hover:bg-gray-50/50">
        <td class="p-3 text-xs text-gray-500">${c.fecha}</td>
        <td class="p-3 font-semibold text-sm">${c.nombre}</td>
        <td class="p-3 text-sm">${c.telefono || '—'}</td>
        <td class="p-3 text-sm">${c.email}</td>
        <td class="p-3 text-sm text-brand-green font-medium">${c.propiedad}</td>
        <td class="p-3">
          <select onchange="updateLeadEstado('consultas_db',${i},this.value)" class="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white">
            ${['Nuevo', 'Contactado', 'Descartado'].map(s => `<option ${c.estado === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
      </tr>
      ${c.mensaje ? `<tr class="bg-gray-50/50 border-b border-gray-100"><td colspan="6" class="px-4 pb-3 text-sm text-gray-500 italic">"${c.mensaje}"</td></tr>` : ''}
    `).join('');
  };

  /* -- TASACIONES (ADM-204) -- */
  window.renderTasaciones = () => {
    const tbody = document.getElementById('tasacionesTableBody');
    if (!tbody) return;
    const data = JSON.parse(localStorage.getItem('tasaciones_db') || '[]');
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-400 text-sm">No hay solicitudes de tasación.</td></tr>'; return; }
    tbody.innerHTML = data.map((l, i) => `
      <tr class="border-b border-gray-50 hover:bg-gray-50/50">
        <td class="p-3 text-xs text-gray-500">${l.fecha}</td>
        <td class="p-3 font-semibold text-sm">${l.nombre}</td>
        <td class="p-3 text-sm">${l.telefono}</td>
        <td class="p-3 text-sm">${l.barrio}</td>
        <td class="p-3 text-sm">${l.tipo}</td>
        <td class="p-3">
          <select onchange="updateLeadEstado('tasaciones_db',${i},this.value)" class="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white">
            ${['Nuevo', 'Contactado', 'Descartado'].map(s => `<option ${l.estado === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
      </tr>
      ${l.comentarios ? `<tr class="bg-gray-50/50 border-b border-gray-100"><td colspan="6" class="px-4 pb-3 text-sm text-gray-500 italic">"${l.comentarios}"</td></tr>` : ''}
    `).join('');
  };

  window.updateLeadEstado = (key, idx, estado) => {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    if (data[idx]) { data[idx].estado = estado; localStorage.setItem(key, JSON.stringify(data)); }
  };

  /* -- AGENTES (ADM-206) -- */
  let _editingAgentId = null;

  window.updateAgentSelectors = () => {
    const agents = JSON.parse(localStorage.getItem('agents_db') || '[]');
    document.querySelectorAll('.agent-selector').forEach(sel => {
      const cur = sel.value;
      sel.innerHTML = '<option value="">Sin asignar</option>' +
        agents.map(a => `<option value="${a.id}" ${String(cur) === String(a.id) ? 'selected' : ''}>${a.nombre}${a.oficina ? ' — ' + a.oficina : ''}</option>`).join('');
    });
  };

  window.renderAgentes = () => {
    const tbody = document.getElementById('agentesTableBody');
    if (!tbody) return;
    const agents = JSON.parse(localStorage.getItem('agents_db') || '[]');
    if (!agents.length) { tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-400 text-sm">No hay agentes cargados.</td></tr>'; window.updateAgentSelectors(); return; }
    tbody.innerHTML = agents.map(a => `
      <tr class="border-b border-gray-50 hover:bg-gray-50/50">
        <td class="p-3"><div class="flex items-center gap-3">
          ${a.foto ? `<img src="${a.foto}" class="w-9 h-9 rounded-full object-cover">` : `<div class="w-9 h-9 rounded-full bg-brand-green/10 flex items-center justify-center"><i data-lucide="user" class="w-4 h-4 text-brand-green"></i></div>`}
          <span class="font-semibold text-sm">${a.nombre}</span>
        </div></td>
        <td class="p-3 text-sm">${a.oficina || '—'}</td>
        <td class="p-3 text-sm">${a.telefono}</td>
        <td class="p-3 text-sm">${a.email}</td>
        <td class="p-3 text-right flex justify-end gap-2">
          <button onclick="editAgente(${a.id})" class="text-brand-green hover:text-brand-greenLight p-1"><i data-lucide="edit" class="w-4 h-4"></i></button>
          <button onclick="deleteAgente(${a.id})" class="text-red-500 hover:text-red-700 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </td>
      </tr>`).join('');
    window.updateAgentSelectors();
    lucide.createIcons();
  };

  window.saveAgente = () => {
    const nombre = document.getElementById('agentNombre')?.value?.trim();
    const telefono = document.getElementById('agentTelefono')?.value?.trim();
    const email = document.getElementById('agentEmail')?.value?.trim();
    if (!nombre || !telefono) return alert('Nombre y teléfono son obligatorios.');
    const agents = JSON.parse(localStorage.getItem('agents_db') || '[]');
    const agent = {
      id: _editingAgentId || Date.now(),
      nombre, telefono, email,
      oficina: document.getElementById('agentOficina')?.value || '',
      matricula: document.getElementById('agentMatricula')?.value || '',
      foto: document.getElementById('agentFoto')?.value || ''
    };
    if (_editingAgentId) { const i = agents.findIndex(a => a.id === _editingAgentId); if (i !== -1) agents[i] = agent; }
    else agents.push(agent);
    localStorage.setItem('agents_db', JSON.stringify(agents));
    _editingAgentId = null;
    document.getElementById('agentForm')?.reset();
    if (document.getElementById('agentFormTitle')) document.getElementById('agentFormTitle').textContent = 'Nuevo Agente';
    window.renderAgentes();
  };

  window.editAgente = (id) => {
    const a = JSON.parse(localStorage.getItem('agents_db') || '[]').find(a => a.id === id);
    if (!a) return;
    _editingAgentId = id;
    ['Nombre', 'Telefono', 'Email', 'Oficina', 'Matricula', 'Foto'].forEach(f => {
      const el = document.getElementById('agent' + f);
      if (el) el.value = a[f.toLowerCase()] || '';
    });
    if (document.getElementById('agentFormTitle')) document.getElementById('agentFormTitle').textContent = 'Editar Agente';
    window.showAdminSection('agentes');
  };

  window.deleteAgente = (id) => {
    if (!confirm('¿Eliminar este agente?')) return;
    const agents = JSON.parse(localStorage.getItem('agents_db') || '[]').filter(a => a.id !== id);
    localStorage.setItem('agents_db', JSON.stringify(agents));
    window.renderAgentes();
  };

  /* -- CATÁLOGOS (ADM-205) -- */
  const _getTypes = () => {
    const defaults = ['Casa', 'Ph', 'Departamento', 'Terreno', 'Comercial', 'Emprendimiento', 'Cochera'];
    return JSON.parse(localStorage.getItem('property_types_db') ||
      JSON.stringify(defaults.map((n, i) => ({ id: i + 1, nombre: n, activo: true }))));
  };

  window.updateTypesSelectors = () => {
    const active = _getTypes().filter(t => t.activo);
    document.querySelectorAll('.type-selector').forEach(sel => {
      const cur = sel.value;
      sel.innerHTML = active.map(t => `<option value="${t.nombre}" ${cur === t.nombre ? 'selected' : ''}>${t.nombre}</option>`).join('');
    });
  };

  window.renderCatalogos = () => {
    const container = document.getElementById('catalogosBody');
    if (!container) return;
    const types = _getTypes();
    container.innerHTML = types.map(t => `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
        <span class="font-medium text-sm ${t.activo ? '' : 'line-through text-gray-400'}">${t.nombre}</span>
        <div class="flex gap-2">
          <button onclick="togglePropertyType(${t.id})" class="text-xs px-2.5 py-1 rounded-lg border ${t.activo ? 'border-green-300 text-green-700 bg-green-50' : 'border-gray-300 text-gray-400'}">
            ${t.activo ? 'Activo' : 'Inactivo'}
          </button>
          <button onclick="deletePropertyType(${t.id})" class="text-red-400 hover:text-red-600 p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
        </div>
      </div>`).join('');
    lucide.createIcons();
    window.updateTypesSelectors();
  };

  window.addPropertyType = () => {
    const input = document.getElementById('newTypeName');
    const nombre = input?.value?.trim();
    if (!nombre) return;
    const types = _getTypes();
    types.push({ id: Date.now(), nombre, activo: true });
    localStorage.setItem('property_types_db', JSON.stringify(types));
    if (input) input.value = '';
    window.renderCatalogos();
  };

  window.togglePropertyType = (id) => {
    const types = _getTypes().map(t => t.id === id ? { ...t, activo: !t.activo } : t);
    localStorage.setItem('property_types_db', JSON.stringify(types));
    window.renderCatalogos();
  };

  window.deletePropertyType = (id) => {
    if (!confirm('¿Eliminar este tipo?')) return;
    localStorage.setItem('property_types_db', JSON.stringify(_getTypes().filter(t => t.id !== id)));
    window.renderCatalogos();
  };

  /* ==========================================
     SINCRONIZACIÓN CON GOOGLE SHEETS
  ========================================== */
  const syncToSheet = async (property) => {
    try {
      const r = await fetch('/api/sync-property', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(property)
      });
      const d = await r.json();
      return d.ok === true;
    } catch (e) {
      console.error('Error al sincronizar con Google Sheets:', e);
      return false;
    }
  };

  /* ==========================================
     INICIAL RENDER
  ========================================== */
  loadProperties();
});
// ===============================
// HOME SEARCH → PROPERTIES PAGE
// ===============================
const searchBtn = document.getElementById("searchButton");

if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    const operation = document.getElementById("searchOperation")?.value;
    const type = document.getElementById("searchType")?.value;
    const location = document.getElementById("searchLocation")?.value;

    const params = new URLSearchParams();

    if (operation) params.append("operacion", operation);
    if (type) params.append("tipo", type);
    if (location) params.append("ubicacion", location);

    window.location.href = `pages/properties.html?${params.toString()}`;
  });
}
