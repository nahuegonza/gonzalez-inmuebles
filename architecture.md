# Arquitectura y Decisiones de Diseño - González Inmuebles

Este documento describe la estructura técnica, las decisiones de diseño y las convenciones para el proyecto González Inmuebles. Sirve como guía de referencia para la implementación de las historias de usuario.

## 1. Mandatos de Negocio (Prioridad Máxima)
*   **Costo Zero/Mínimo:** El stack debe ser 100% gratuito o de costo extremadamente bajo.
*   **Autonomía Total:** El sistema debe ser operable por un administrador sin conocimientos técnicos y sin un equipo de desarrolladores detrás.
*   **Simplicidad sobre Complejidad:** Preferir soluciones "no-code" o "low-code" integradas (como Google Sheets) sobre bases de datos complejas.
*   **Escalabilidad Acotada:** Optimizado para un inventario de **70-100 propiedades** y bajo tráfico. No sobrediseñar para millones de usuarios.
*   **Configuración Fácil:** El despliegue y la actualización de datos deben ser procesos de "copiar y pegar" o edición directa en Excel/Sheets.

## 2. Stack Tecnológico
*   **Frontend:** HTML5, Vanilla JavaScript (ES6+).
*   **Estilos:** Tailwind CSS (via CDN).
*   **Iconografía:** Lucide Icons.
*   **Base de Datos:** Google Sheets (leído vía CSV). El "Excel" es la base de datos para que el admin no necesite un panel complejo.
*   **Multimedia:** Cloudinary (Hosting de imágenes/videos). Plan gratuito.
*   **Hosting:** GitHub Pages / Netlify / Vercel (Gratis).

## 3. Estructura de Vistas (SPA Lite)
El proyecto utiliza un enfoque de **Single Page Application (SPA) simplificada** dentro de `index.html`. 
*   **`publicView`**: Interfaz cliente (Home, Buscador, Destacados).
*   **`adminView`**: CMS para gestión de inventario y recepción de leads.

## 4. Decisiones de Diseño

### 4.1. Persistencia de Datos (Híbrida)
*   **Lectura:** Las propiedades se leen directamente de un Google Sheet publicado como CSV. Actualizar una propiedad es tan simple como editar una fila en el Sheet.
*   **Escritura:** El Admin guarda temporalmente en `localStorage` y ofrece un botón de "Exportar a CSV" para que el usuario simplemente pegue las nuevas filas en su Google Sheet.

### 4.2. Gestión de Multimedia (Cloudinary)
*   **Widget:** Se usa el Widget oficial para subir fotos. El admin sube fotos, Cloudinary le da el link, y ese link se pega en el Sheet.
*   **Optimización:** Uso de transformaciones dinámicas automáticas para no ralentizar la web.

### 4.3. UI/UX
*   **Consistencia:** Paleta `brand` en Tailwind.
*   **Simplicidad Admin:** Interfaz limpia, con etiquetas claras y ayuda visual para la carga de datos.
