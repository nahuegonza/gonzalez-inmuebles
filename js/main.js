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
    tasacionForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const originalBtnContent = submitBtn.innerHTML;
      submitBtn.innerHTML =
        '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Procesando solicitud...';
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-80", "cursor-not-allowed");
      lucide.createIcons();

      setTimeout(() => {
        submitBtn.innerHTML = originalBtnContent;
        submitBtn.disabled = false;
        submitBtn.classList.remove("opacity-80", "cursor-not-allowed");

        successMessage.classList.remove("hidden");
        tasacionForm.reset();

        setTimeout(() => {
          successMessage.classList.add("hidden");
        }, 6000);
      }, 1800);
    });
  }

  /* ==========================================
     BASE DE DATOS EN MEMORIA
  ========================================== */
  let properties = [
    {
      id: Date.now() + 1,
      title: "Casa de Diseño en Barrio Privado",
      operation: "Venta",
      type: "Casa",
      currency: "USD",
      price: 350000,
      location: "Zona Norte",
      beds: 4,
      baths: 3,
      sqm: 280,
      image:
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: Date.now() + 2,
      title: "Departamento Luminoso 3 Ambientes",
      operation: "Alquiler",
      type: "Departamento",
      currency: "ARS",
      price: 450000,
      location: "Zona Norte",
      beds: 2,
      baths: 1,
      sqm: 75,
      image:
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
    },
        {
      id: Date.now() + 2,
      title: "Departamento lujoso 5 Ambientes",
      operation: "Venta",
      type: "Departamento",
      currency: "ARS",
      price: 750000,
      location: "Zona Norte",
      beds: 3,
      baths: 1,
      sqm: 105,
      image:
        <div style="position: relative; width: 100%; height: 0; padding-top: 100.0000%;
 padding-bottom: 0; box-shadow: 0 2px 8px 0 rgba(63,69,81,0.16); margin-top: 1.6em; margin-bottom: 0.9em; overflow: hidden;
 border-radius: 8px; will-change: transform;">
  <iframe loading="lazy" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; border: none; padding: 0;margin: 0;"
    src="https://www.canva.com/design/DAHGdLucpog/fe_droQ2TCneCw87rUTodQ/view?embed" allowfullscreen="allowfullscreen" allow="fullscreen">
  </iframe>
</div>
<a href="https:&#x2F;&#x2F;www.canva.com&#x2F;design&#x2F;DAHGdLucpog&#x2F;fe_droQ2TCneCw87rUTodQ&#x2F;view?utm_content=DAHGdLucpog&amp;utm_campaign=designshare&amp;utm_medium=embeds&amp;utm_source=link" target="_blank" rel="noopener">Diseño</a> de Nahuel Gonzalez,
    },
  ];

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

    if (properties.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    properties.forEach((prop) => {
      const formattedPrice = new Intl.NumberFormat("es-AR").format(prop.price);
      const isVenta = prop.operation.toLowerCase() === "venta";
      const tagClass = isVenta
        ? "bg-brand-green text-white"
        : "bg-white text-brand-dark";

      const aiString = encodeURIComponent(
        `${prop.title} en ${prop.location}, ${prop.currency} ${formattedPrice}, ${prop.beds} hab, ${prop.baths} baños, ${prop.sqm} m²`
      );

      const cardHTML = `
        <article class="bg-white rounded-[16px] shadow-soft overflow-hidden flex flex-col">
          <div class="relative h-64">
            <span class="absolute top-4 left-4 ${tagClass} text-xs font-bold px-3 py-1.5 rounded-full">
              EN ${prop.operation}
            </span>
            <img src="${prop.image}" class="w-full h-full object-cover">
          </div>

          <div class="p-6 flex flex-col justify-between flex-1">
            <div>
              <h3 class="text-2xl font-bold text-brand-green">
                ${prop.currency} ${formattedPrice}
              </h3>
              <p class="font-medium text-lg">${prop.title}</p>
              <p class="text-sm text-brand-gray flex items-center gap-1">
                <i data-lucide="map-pin" class="w-4 h-4"></i> ${prop.location}
              </p>
            </div>

            <button
              class="mt-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-brand-green font-semibold"
              onclick="generatePropertyStory(decodeURIComponent('${aiString}'))">
              ✨ Imaginá tu vida acá
            </button>
          </div>
        </article>
      `;
      grid.insertAdjacentHTML("beforeend", cardHTML);
    });

    lucide.createIcons();
  };

  /* ==========================================
     RENDER TABLA ADMIN
  ========================================== */
  window.renderAdminTable = () => {
    const tbody = document.getElementById("adminTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    properties.forEach((prop) => {
      const formattedPrice = new Intl.NumberFormat("es-AR").format(prop.price);

      tbody.insertAdjacentHTML(
        "beforeend",
        `
        <tr>
          <td class="p-4">${prop.title}</td>
          <td class="p-4">${prop.operation}</td>
          <td class="p-4">${prop.currency} ${formattedPrice}</td>
          <td class="p-4 text-right">
            <button onclick="deleteProperty(${prop.id})">
              <i data-lucide="trash-2"></i>
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
    properties = properties.filter((p) => p.id !== id);
    renderPublicProperties();
    renderAdminTable();
  };

  /* ==========================================
     INICIAL RENDER
  ========================================== */
  renderPublicProperties();
  renderAdminTable();
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
