<?php
/**
 * Ingredio - Kitchen Intelligence Platform
 * index.php: Main SPA shell entry point
 * 
 * This file serves as the single HTML shell for the entire SPA.
 * All views are loaded dynamically into #app-content via JavaScript.
 */

// Session & security headers
session_start();
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");
header("X-XSS-Protection: 1; mode=block");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Ingredio - Smart Kitchen Inventory, Nutrition Tracking & Recipe Discovery">
    <meta name="theme-color" content="#2ECC71">
    <title>Ingredio &mdash; Kitchen Intelligence</title>

    <!-- Google Fonts: Poppins (body) + Playfair Display (display) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Main stylesheet -->
    <link rel="stylesheet" href="style.css">

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238BCF3F' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 22c4.97 0 9-4.03 9-9-4.97 0-9-4.03-9-9s-4.03 9-9 9 4.03 9 9 9z'/><path d='M12 22c-4.97 0-9-4.03-9-9 4.97 0 9-4.03 9-9s4.03 9 9 9-4.03 9-9 9z'/></svg>">
</head>
<body>

    <!-- =============================================
         TOAST NOTIFICATION CONTAINER
         Shown dynamically via showToast() in script.js
    ============================================= -->
    <div id="toast-container" aria-live="polite" aria-atomic="true"></div>

    <!-- =============================================
         GLOBAL LOADER OVERLAY
         Shown via showLoader() / hideLoader()
    ============================================= -->
    <div id="global-loader" class="loader-overlay" aria-hidden="true">
        <div class="loader-inner">
            <div class="loader-spinner"></div>
            <span class="loader-text">Loading...</span>
        </div>
    </div>

    <!-- =============================================
         MODAL OVERLAY
         Populated and shown via openModal()
    ============================================= -->
    <div id="modal-overlay" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title" hidden>
        <div class="modal-box">
            <button class="modal-close" id="modal-close-btn" aria-label="Close modal">&times;</button>
            <div id="modal-content"></div>
        </div>
    </div>

    <!-- =============================================
         STICKY HEADER
         Loaded from header.php
    ============================================= -->
    <?php include 'header.php'; ?>

    <!-- =============================================
         MAIN SPA CONTENT AREA
         ALL views are injected here — never reload the page.
    ============================================= -->
    <main id="app-content" role="main" aria-live="polite">
        <!-- Default landing state: Dashboard loads on init -->
        <div class="splash-screen">
            <div class="splash-logo" style="display:flex;align-items:center;justify-content:center;color:var(--primary-color);">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9-4.03-9-9s-4.03 9-9 9 4.03 9 9 9z"/><path d="M12 22c-4.97 0-9-4.03-9-9 4.97 0 9-4.03 9-9s4.03 9 9 9-4.03 9-9 9z"/></svg>
            </div>
            <h1 class="splash-title">Ingredio</h1>
            <p class="splash-sub">Initializing your kitchen intelligence&hellip;</p>
            <div class="splash-bar"><div class="splash-bar-fill"></div></div>
        </div>
    </main>

    <!-- =============================================
         FOOTER
         Loaded from footer.php
    ============================================= -->
    <?php include 'footer.php'; ?>

    <!-- =============================================
         JAVASCRIPT
         API_Ops.js must load before script.js
    ============================================= -->
    <script src="API_Ops.js"></script>
    <script src="script.js"></script>

</body>
</html>
