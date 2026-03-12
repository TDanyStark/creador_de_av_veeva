# Veeva AV Creator - Implementation Plan

This application allows users to upload a PDF, convert it into individual slides (PNGs), and organize them into the Veeva (VIVA) format (ZIP of ZIPs). It includes a visual editor for creating hitboxes that trigger popups or navigate between slides.

## User Review Required
> [!IMPORTANT]
> **Veeva Navigation:** Navigation links will follow the format `<a href="veeva:gotoSlide(Slide_XX.zip)">`. For the online preview, a small script will intercept these calls to allow navigation within the app.

> [!NOTE]
> **Assets per Slide:** Each slide ZIP will contain `/css/styles.css` and `/js/main.js`. These will combine global code (defined at project level) and per-slide code.

## Proposed Changes

### Backend (PHP Slim)
The backend will be located in the `/api` directory.

#### [NEW] [index.php](file:///c:/Users/USER/Documents/dev/projects/MS/creador_de_av_veeva/api/index.php)
- Entry point for the Slim application.
- Routes for:
    - Auth (Login).
    - Project management (CRUD).
    - PDF Upload & Conversion.
    - Slide/Popup structure management.
    - Hitbox saving.
    - ZIP Export.

#### [NEW] [PDFProcessor.php](file:///c:/Users/USER/Documents/dev/projects/MS/creador_de_av_veeva/api/src/PDFProcessor.php)
- Logic to convert PDF pages to PNG using `Imagick`.

#### [NEW] [VeevaExporter.php](file:///c:/Users/USER/Documents/dev/projects/MS/creador_de_av_veeva/api/src/VeevaExporter.php)
- Logic to generate `index.html` based on the provided template.
- Logic to package images, CSS, and JS into individual slide ZIPs and a master project ZIP.

### Frontend (React + Vite)
The frontend will be located in the `/frontend` directory.

#### [NEW] [Login.tsx](file:///c:/Users/USER/Documents/dev/projects/MS/creador_de_av_veeva/frontend/src/pages/Login.tsx)
- Simple login screen.

#### [NEW] [Dashboard.tsx](file:///c:/Users/USER/Documents/dev/projects/MS/creador_de_av_veeva/frontend/src/pages/Dashboard.tsx)
- List of projects and "New Project" button.

#### [NEW] [ProjectEditor.tsx](file:///c:/Users/USER/Documents/dev/projects/MS/creador_de_av_veeva/frontend/src/pages/ProjectEditor.tsx)
- Sidebar with slide list.
- Ability to drag/reorder slides and convert slides to popups.
- Main area for the Interactive Editor:
    - Draw hitboxes for **Popups**.
    - Draw hitboxes for **Navigation** (Veeva links: `veeva:gotoSlide`).
- Code Editor for **Global CSS/JS** and **Slide-specific CSS/JS**.

### Infrastructure

#### [NEW] [.htaccess](file:///c:/Users/USER/Documents/dev/projects/MS/creador_de_av_veeva/.htaccess)
- Root `.htaccess` to handle routing:
    - `/api/*` -> `api/index.php`
    - Everything else -> `public/index.html` (React build)

## Verification Plan

### Automated Tests
- N/A for initial prototype, will rely on manual verification.

### Manual Verification
1. Log in with fixed credentials.
2. Upload a sample PDF.
3. Verify PDF pages appear as slides.
4. Convert a slide to a popup of another slide.
5. Draw a hitbox on a slide and link it to a popup.
6. Create a navigation button that links to another slide.
7. Preview the project and verify both popups and navigation buttons work.
8. Download the ZIP and verify the structure matches Veeva requirements, including the correct `Veeva - Go to page` syntax.
