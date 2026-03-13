# Plan Técnico de Ejecución: MVP Creador de AV Veeva (Hostinger)

## Fase 1: Base de Datos, Autenticación JWT y Setup Base Frontend [x]
**Objetivo:** Tener el sistema de login seguro operando con estado persistente, manejador de peticiones y estructura Clean Architecture base.

### 1.1 Backend (Slim PHP - `/api`)
* **Migraciones y Seeders:**
    * Crear migración `create_users_table` (`id`, `email`, `password_hash`, `created_at`, `updated_at`).
    * Crear seeder `UserSeeder` para insertar un usuario administrador de prueba.
* **Clean Architecture (Auth):**
    * `Domain/User`: Entidad de usuario y repositorio interface (`UserRepositoryInterface`).
    * `Infrastructure/Persistence`: Implementación de `UserRepository` usando PDO/MySQL.
    * `Application/Actions/Auth`: Crear `LoginAction` (valida credenciales, genera JWT) y `MeAction` (devuelve datos del usuario según JWT).
* **Middlewares y Utils:**
    * `JwtAuthMiddleware`: Para proteger rutas privadas.
    * `JsonResponseHelper`: Función pura para estandarizar respuestas `{ "success": boolean, "message": string, "data": array/object, "errors": array }`.

### 1.2 Frontend (React + TS - `/frontend`)
* **Setup Vite & API:**
    * Configurar el proxy en `vite.config.ts` para redirigir `/api` al backend.
    * Crear cliente Axios (`src/lib/axios.ts`) con interceptores: adjuntar Bearer token automáticamente y manejo global de errores (401 redirige a login, 422 muestra toasts).
* **Gestión de Estado:**
    * Configurar Zustand (`src/store/useAuthStore.ts`) para persistir token y datos del usuario.
    * Configurar TanStack Query Provider (`src/lib/queryClient.ts`).
* **Componentes UI (Atomicidad estricta - 1 componente = 1 archivo):**
    * Instalar Shadcn UI: Form, Input, Button, Toast.
    * Crear `LoginForm.tsx`, `InputField.tsx`, `SubmitButton.tsx` en `src/components/auth/`.
* **Vista y Lógica:**
    * Crear página `src/pages/Login.tsx` usando React Hook Form + Zod para validación.

---

## Fase 2: Gestión de Proyectos, Paginación y Procesamiento PDF [x]
**Objetivo:** Permitir subir el PDF, que el servidor lo divida en imágenes (slides) y mostrar la lista paginada en el Dashboard.

### 2.1 Backend
* **Migraciones:**
    * `create_projects_table` (`id`, `user_id`, `name`, `created_at`).
    * `create_slides_table` (`id`, `project_id`, `slide_number`, `image_path`, `created_at`).
* **Clean Architecture (Projects):**
    * Endpoints: `GET /api/projects` (obligatorio: offset/limit), `POST /api/projects`.
    * `Application/Actions/Projects`: `ListProjectsAction`, `CreateProjectAction`.
* **Servicio PDF (Infrastructure):**
    * Crear `PdfToImageService`. Recibe el upload, usa Imagick o Ghostscript (nativos en Hostinger) para extraer cada página a JPG/PNG en `/public/uploads/projects/{id}/`.
    * Insertar un registro en la tabla `slides` por cada imagen generada.

### 2.2 Frontend
* **Estado en URL:**
    * Crear Hook `usePaginationUrl.ts` que sincronice `?page=X` con la URL.
* **Componentes Atómicos:**
    * `ProjectList.tsx`, `ProjectCard.tsx`, `PaginationControls.tsx`.
    * `PdfUploader.tsx` (Drag & drop zone).
* **Vistas:**
    * Página `src/pages/Dashboard.tsx`.
    * Usar TanStack Query (`useQuery` para el GET, `useMutation` para el POST). Mostrar estados de `isLoading` de forma elegante (Skeleton loaders de Shadcn).

---

## Fase 3: Editor Visual (Lienzo) y Navegación Base (Hotspots) [x]
**Objetivo:** Interfaz principal de edición. Ver slides, navegar entre ellos y dibujar anclas de navegación Veeva.

### 3.1 Backend
* **Migraciones:**
    * `create_navigation_links_table` (`id`, `slide_id`, `target_slide_id`, `top_percent`, `left_percent`, `width_percent`, `height_percent`).
* **API:**
    * `GET /api/projects/{id}/editor-data` (Devuelve el JSON completo: slides y sus navigation links).
    * Endpoints CRUD para actualizar los links (`POST /api/slides/{id}/navigation`).

### 3.2 Frontend
* **Sincronización URL y Layout:**
    * Página `src/pages/Editor.tsx`. Leer `?slide=X` de la URL para saber qué página renderizar.
    * Componentes de Layout: `EditorHeader.tsx`, `SlideListSidebar.tsx`, `PropertiesSidebar.tsx`, `CanvasWorkspace.tsx`.
* **Lienzo (CanvasWorkspace):**
    * Contenedor estricto con `aspect-ratio: 4/3`.
    * Renderizar la imagen del slide actual de fondo.
* **Herramienta de Navegación:**
    * Lógica para arrastrar y redimensionar `<div>` absolutos (simulando los `<a>` de navegación) sobre el canvas y guardar sus coordenadas en porcentajes (`%`) para que sea responsivo.
    * `PropertiesSidebar`: Permitir seleccionar hacia qué slide apunta el enlace (`veeva:gotoSlide(slide_02.zip)`).

---

## Fase 4: Editor Visual - Popups Dinámicos [x]
**Objetivo:** Añadir botones y ventanas modales (imágenes) personalizadas.

### 4.1 Backend
* **Migraciones:**
    * `create_popups_table` (`id`, `slide_id`, `image_path`, `button_top`, `button_left`, `button_width`, `button_height`, `popup_top`, `popup_left`, `popup_width_percent`, `close_color`, `overlay_type`, `exclusive_open`).
* **API:**
    * Endpoint para subir la imagen del popup a `/public/uploads/popups/` y guardar las coordenadas del disparador (botón) y de la imagen (popup).

### 4.2 Frontend
* **Lienzo:**
    * Añadir modo "Agregar Popup".
    * Componente `PopupTrigger.tsx` (posicionable en el lienzo).
    * Componente `PopupPreview.tsx` (posicionable y redimensionable).
* **Panel de Propiedades:**
    * Controles para: Tamaño del popup, Color del icono "X" (cerrar), Toggle "Cerrar los demás al abrir" (exclusive_open booleano).

---

## Fase 5: Gestión Avanzada de Slides (CRUD, Reordenamiento y Limpieza) [x]
**Objetivo:** Flexibilidad total para modificar la estructura del proyecto después de la carga inicial.

### 5.1 Backend
* **Endpoints CRUD Slides:**
    * `POST /api/projects/{id}/slides`: Permitir subir una o varias imágenes nuevas. Procesar y asignar `slide_number` correlativo.
    * `DELETE /api/slides/{id}`: Eliminar el registro, el archivo físico y **limpieza en cascada** (navigation links donde sea origen o destino, y popups asociados con sus imágenes).
    * `PATCH /api/projects/{id}/slides/reorder`: Recibir array de IDs en el nuevo orden. Actualizar `slide_number` y renombrar archivos físicos para mantener la secuencia `slide_01.jpg`, `slide_02.jpg`, etc.
* **Lógica de Integridad:**
    * Al borrar un slide, actualizar los `target_slide_id` de otros links si es necesario (o marcarlos como rotos/eliminar).
    * Al reordenar, disparar un proceso que renombre los archivos en disco y actualice `image_path` en la BD para evitar saltos en la secuencia de nombres.

### 5.2 Frontend
* **SlideListSidebar Mejorado:**
    * Implementar Drag & Drop (usando `@dnd-kit/core` o similar) para reordenar las miniaturas.
    * Botón de eliminación con confirmación (`AlertDialog`) en cada slide.
    * Zona de carga o botón "Añadir Slide" para subir nuevas imágenes al final del proyecto.
* **Estado e Integridad:**
    * Actualizar el `SlideStore` o refetch de TanStack Query tras cambios estructurales para reflejar el nuevo orden y nombres inmediatamente.

---

## Fase 6: Preview (Motor Veeva Web) [x]
**Objetivo:** Visor web que emula el iPad. Todo local en React antes de generar el ZIP.

### 6.1 Frontend
* **Vista Compartida:**
    * Ruta `src/pages/Preview.tsx` (pantalla completa, sin barras laterales).
* **Lógica de Renderizado:**
    * Consumir el endpoint `GET /api/projects/{id}/editor-data`.
    * Implementar gestos: Swipe Izquierda/Derecha para cambiar de slide (si el dispositivo es touch o emulado).
    * Inyectar flechas flotantes translúcidas a los lados para desktop (con `:hover`).
* **Simulación de Motor Veeva:**
    * Clicks en links de navegación deben cambiar el estado del slide actual (`?slide=Y`).
    * Lógica de Popups: Funciones en React que manejen el estado local (`activePopups`). Aplicar lógica de "exclusive_open" si está configurada.

---

## Fase 7: Empaquetador y Motor de Plantillas ZIP [x]
**Objetivo:** El core del negocio. Convertir la data estructurada en los assets físicos de Veeva.

### 7.1 Backend
* **Motor de Exportación (`POST /api/projects/{id}/export`):**
    * **HTML Generator:** Función que lee los datos del slide e inyecta las etiquetas (`<a>`, `<button>`, `<img>`) en un template `index.html`.
    * **CSS Generator:** Crea `css/styles.css` por slide, usando los porcentajes guardados en la BD para posicionar absolutamente cada elemento. Añade estilos dinámicos del overlay.
    * **JS Generator:** Crea `js/main.js` optimizado. En lugar de repetir funciones, usa una clase modular o Event Delegation para manejar los clicks de los popups.
    * **Thumbnail:** Usa Imagick/GD para reducir la imagen del slide a 200x150px y guardarla como `thumb.png`.
* **Empaquetado (PHP `ZipArchive`):**
    * Crear una estructura temporal. Por cada slide crear un ZIP (`slide_01.zip`, `slide_02.zip`).
    * Empaquetar todos los `slide_XX.zip` en un `Master_Project.zip`.
    * Devolver el binario o una URL firmada de descarga temporal.

### 7.2 Frontend
* **Consumo y Descarga:**
    * Componente `ExportButton.tsx` en el Editor Header.
    * Usar TanStack Mutation para enviar la petición, recibir el Blob (`responseType: 'blob'`), e invocar la descarga del navegador. Notificaciones (Toast) de progreso.
* **Auditoría Final DRY:**
    * Revisar hooks de posición y componentes de interfaz para extraer a `/components/shared` o `/hooks`.