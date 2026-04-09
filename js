        // Inicialización de Iconos
        lucide.createIcons();

        // Lógica del Formulario de Tasación
        const tasacionForm = document.getElementById('tasacionForm');
        const submitBtn = document.getElementById('submitBtn');
        const successMessage = document.getElementById('successMessage');

        tasacionForm.addEventListener('submit', function(e) {
            e.preventDefault(); 
            
            const originalBtnContent = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Procesando solicitud...';
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-80', 'cursor-not-allowed');
            lucide.createIcons();

            setTimeout(() => {
                submitBtn.innerHTML = originalBtnContent;
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-80', 'cursor-not-allowed');
                lucide.createIcons();
                
                successMessage.classList.remove('hidden');
                tasacionForm.reset();

                setTimeout(() => {
                    successMessage.classList.add('hidden');
                }, 6000);

            }, 1800); 
        });

        // 1. BASE DE DATOS EN MEMORIA (Estado Inicial)
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
                image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
            },
            {
                id: Date.now() + 2,
                title: "Departamento Luminoso 3 Ambientes",
                operation: "Alquiler",
                type: "Departamento",
                currency: "ARS",
                price: 450000,
                location: "Centro Histórico",
                beds: 2,
                baths: 1,
                sqm: 75,
                image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80"
            }
        ];

        // 2. SISTEMA DE NAVEGACIÓN (Front / Admin)
        function toggleView(view) {
            const publicView = document.getElementById('publicView');
            const adminView = document.getElementById('adminView');
            
            if(view === 'admin') {
                publicView.classList.remove('block');
                publicView.classList.add('hidden');
                adminView.classList.remove('hidden');
                adminView.classList.add('flex');
            } else {
                adminView.classList.remove('flex');
                adminView.classList.add('hidden');
                publicView.classList.remove('hidden');
                publicView.classList.add('block');
            }
            window.scrollTo(0, 0);
        }

        // 3. LÓGICA DE RENDERIZADO (Frontend)
       function renderPublicProperties() {
 const grid = document.getElementById('propertiesGrid');

  if (!grid) {
    return;
  }

  const emptyState = document.getElementById('emptyState');
  ...
}

            if (properties.length === 0) {
                emptyState.classList.remove('hidden');
                grid.classList.add('hidden');
                return;
            }

            emptyState.classList.add('hidden');
            grid.classList.remove('hidden');

            properties.forEach(prop => {
                const isVenta = prop.operation.toLowerCase() === 'venta';
                const tagClass = isVenta ? 'bg-brand-green text-white' : 'bg-white text-brand-dark';
                
                const formattedPrice = new Intl.NumberFormat('es-AR').format(prop.price);
                const priceSuffix = prop.operation.toLowerCase() === 'alquiler' ? '<span class="text-sm font-normal text-brand-gray">/mes</span>' : '';

                const aiString = `${prop.title} en ${prop.location}, ${prop.currency} ${formattedPrice}, ${prop.beds} hab, ${prop.baths} baños, ${prop.sqm} m²`;

                const cardHTML = `
                    <article class="bg-white rounded-[16px] overflow-hidden shadow-soft group flex flex-col">
                        <div class="relative h-64 overflow-hidden shrink-0">
                            <div class="absolute top-4 left-4 z-10 ${tagClass} text-xs font-bold px-3 py-1.5 rounded-full shadow-md uppercase">
                                EN ${prop.operation}
                            </div>
                            <img src="${prop.image}" alt="${prop.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div class="p-6 flex flex-col flex-1 justify-between">
                            <div>
                                <h3 class="font-heading font-bold text-2xl text-brand-green mb-1">${prop.currency} ${formattedPrice} ${priceSuffix}</h3>
                                <p class="text-brand-dark font-medium text-lg mb-1 line-clamp-1">${prop.title}</p>
                                <p class="text-brand-gray text-sm flex items-center gap-1 mb-6">
                                    <i data-lucide="map-pin" class="w-3.5 h-3.5"></i> ${prop.location}
                                </p>
                                
                                <div class="flex items-center justify-between border-t border-gray-100 pt-4 mb-6">
                                    <div class="flex items-center gap-1.5 text-brand-gray text-sm" title="Habitaciones">
                                        <i data-lucide="bed-double" class="w-4 h-4 text-brand-dark"></i> <span class="font-medium text-brand-dark">${prop.beds}</span>
                                    </div>
                                    <div class="flex items-center gap-1.5 text-brand-gray text-sm" title="Baños">
                                        <i data-lucide="bath" class="w-4 h-4 text-brand-dark"></i> <span class="font-medium text-brand-dark">${prop.baths}</span>
                                    </div>
                                    <div class="flex items-center gap-1.5 text-brand-gray text-sm" title="Metros Cuadrados">
                                        <i data-lucide="maximize" class="w-4 h-4 text-brand-dark"></i> <span class="font-medium text-brand-dark">${prop.sqm}</span> m²
                                    </div>
                                </div>
                            </div>

                            <div class="flex flex-col gap-3">
                                <a href="#" class="block text-center w-full py-2.5 rounded-xl border-2 border-brand-green text-brand-green font-semibold hover:bg-brand-green hover:text-white transition-colors">
                                    Ver detalles
                                </a>
                                <button onclick="generatePropertyStory('${aiString}')" class="block text-center w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 text-brand-green font-semibold hover:from-emerald-100 hover:to-teal-100 transition-colors border border-emerald-200">
                                    ✨ Imaginá tu vida acá
                                </button>
                            </div>
                        </div>
                    </article>
                `;
                grid.insertAdjacentHTML('beforeend', cardHTML);
            });
            lucide.createIcons();
        }

        // 4. LÓGICA DE RENDERIZADO (Tabla Admin)
        function renderAdminTable() {
            const tbody = document.getElementById('adminTableBody');
            tbody.innerHTML = '';

            properties.forEach(prop => {
                const formattedPrice = new Intl.NumberFormat('es-AR').format(prop.price);
                const isVenta = prop.operation.toLowerCase() === 'venta';
                const badgeColor = isVenta ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';

                const tr = `
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td class="p-4">
                            <div class="flex items-center gap-3">
                                <img src="${prop.image}" alt="${prop.title}" class="w-12 h-12 rounded-lg object-cover">
                                <div>
                                    <p class="font-semibold text-gray-900 line-clamp-1">${prop.title}</p>
                                    <p class="text-xs text-gray-500">${prop.location} • ${prop.type}</p>
                                </div>
                            </div>
                        </td>
                        <td class="p-4">
                            <span class="px-2 py-1 rounded-md text-xs font-semibold uppercase ${badgeColor}">${prop.operation}</span>
                        </td>
                        <td class="p-4 font-medium text-gray-900">
                            ${prop.currency} ${formattedPrice}
                        </td>
                        <td class="p-4 text-right">
                            <button onclick="deleteProperty(${prop.id})" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Eliminar">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </td>
                    </tr>
                `;
                tbody.insertAdjacentHTML('beforeend', tr);
            });
            lucide.createIcons();
        }

        // 5. SUBIDA DE IMÁGENES
        let currentUploadedImage = null;
        document.getElementById('adminImageFile').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                currentUploadedImage = URL.createObjectURL(file);
                document.getElementById('uploadPlaceholder').classList.add('hidden');
                document.getElementById('imagePreview').src = currentUploadedImage;
                document.getElementById('imagePreview').classList.remove('hidden');
            }
        });

        // 6. CREAR NUEVA PROPIEDAD
        document.getElementById('adminForm').addEventListener('submit', function(e) {
            e.preventDefault();

            if(!currentUploadedImage) {
                alert("Por favor, subí una fotografía para el inmueble.");
                return;
            }

            const newProperty = {
                id: Date.now(),
                title: document.getElementById('adminTitle').value,
                operation: document.getElementById('adminOperation').value,
                type: document.getElementById('adminType').value,
                currency: document.getElementById('adminCurrency').value,
                price: Number(document.getElementById('adminPrice').value),
                location: document.getElementById('adminLocation').value,
                beds: Number(document.getElementById('adminBeds').value),
                baths: Number(document.getElementById('adminBaths').value),
                sqm: Number(document.getElementById('adminSqm').value),
                image: currentUploadedImage
            };

            properties.unshift(newProperty);
            renderPublicProperties();
            renderAdminTable();

            this.reset();
            currentUploadedImage = null;
            document.getElementById('uploadPlaceholder').classList.remove('hidden');
            document.getElementById('imagePreview').classList.add('hidden');
            document.getElementById('imagePreview').src = '';
        });

        // 7. ELIMINAR PROPIEDAD
        function deleteProperty(id) {
            properties = properties.filter(p => p.id !== id);
            renderPublicProperties();
            renderAdminTable();
        }

        // ==========================================
        // INTEGRACIÓN GEMINI API ✨
        // ==========================================
        const apiKey = "";
        
        const aiModal = document.getElementById('aiModal');
        const aiModalContent = document.getElementById('aiModalContent');
        const aiLoading = document.getElementById('aiLoading');
        const aiTitle = document.getElementById('aiTitle');

        function closeAIModal() { aiModal.classList.add('hidden'); }
        aiModal.addEventListener('click', (e) => { if (e.target === aiModal) closeAIModal(); });

        async function callGeminiAPI(promptText, systemPrompt) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{ parts: [{ text: promptText }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            };
            const retries = [1000, 2000, 4000, 8000, 16000];
            for (let attempt = 0; attempt <= retries.length; attempt++) {
                try {
                    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const result = await response.json();
                    return result.candidates?.[0]?.content?.parts?.[0]?.text || "No pudimos generar una respuesta.";
                } catch (error) {
                    if (attempt === retries.length) return "<p class='text-red-500 font-medium'>Hubo un problema de conexión con la IA.</p>";
                    await new Promise(res => setTimeout(res, retries[attempt]));
                }
            }
        }

        async function generatePropertyStory(propertyDetails) {
            aiModal.classList.remove('hidden');
            aiLoading.classList.remove('hidden');
            aiModalContent.innerHTML = '';
            aiTitle.innerText = "✨ Visualizando tu vida acá...";
            lucide.createIcons();

            const systemPrompt = "Sos un redactor publicitario brillante experto en bienes raíces que trabaja para la agencia 'González Inmuebles'. Respondé en español de Argentina (voseo). Estructurá tu texto en <p>.";
            const prompt = `Escribí un texto emocional y muy breve (máximo 2 párrafos cortos) imaginando en segunda persona ("vos") cómo sería vivir en esta propiedad: ${propertyDetails}.`;
            
            const responseText = await callGeminiAPI(prompt, systemPrompt);
            aiLoading.classList.add('hidden');
            aiTitle.innerText = "✨ Tu próximo hogar";
            aiModalContent.innerHTML = responseText;
        }

        function openSmartSearchModal() {
            aiModal.classList.remove('hidden');
            aiLoading.classList.add('hidden');
            aiTitle.innerText = "✨ Buscador Inteligente IA";
            aiModalContent.innerHTML = `
                <p class="mb-4 text-brand-gray font-normal">Contanos qué estás buscando y nuestra IA te guiará.</p>
                <textarea id="aiSearchInput" rows="4" class="w-full p-4 bg-brand-light border border-gray-200 rounded-xl focus:outline-none focus:border-brand-green mb-6 resize-none text-brand-dark" placeholder="Ej: Busco algo para mi familia..."></textarea>
                <button onclick="executeSmartSearch()" class="w-full bg-brand-green text-white font-semibold py-3.5 rounded-xl hover:bg-brand-greenLight transition-colors flex justify-center items-center gap-2">
                    <i data-lucide="sparkles" class="w-5 h-5"></i> Analizar Búsqueda
                </button>
            `;
            lucide.createIcons();
        }

        async function executeSmartSearch() {
            const input = document.getElementById('aiSearchInput').value;
            if (!input.trim()) return;
            aiLoading.classList.remove('hidden');
            aiModalContent.innerHTML = '';
            aiTitle.innerText = "✨ Analizando opciones...";

            const systemPrompt = "Sos un asesor inmobiliario de 'González Inmuebles'. Respondé en español de Argentina. Usá HTML básico.";
            const prompt = `Un cliente busca: "${input}". Agradecele y sugerile propiedades acordes de forma realista. Invitalo a contactarnos.`;
            
            const responseText = await callGeminiAPI(prompt, systemPrompt);
            aiLoading.classList.add('hidden');
            aiTitle.innerText = "✨ Nuestra Recomendación";
            aiModalContent.innerHTML = responseText;
        }

        // Inicializar vistas al cargar la página
        window.onload = () => {
            renderPublicProperties();
            renderAdminTable();
        };
document.addEventListener("DOMContentLoaded", function () {
  if (window.lucide) {
    lucide.createIcons();
  }
});
