<?php
/**
 * Ingredio - footer.php
 * Professional responsive site footer.
 * 
 * Security: Static content only. Any future dynamic output must use htmlspecialchars().
 */

$current_year = date('Y');
?>

<footer class="site-footer" role="contentinfo">
    <div class="footer-inner">

        <!-- ── Brand Column ──────────────────────────── -->
        <div class="footer-brand">
            <a href="#" class="footer-logo" data-view="dashboard" aria-label="Ingredio Home">
                <span class="footer-logo-icon" aria-hidden="true" style="display:flex;align-items:center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9-4.03-9-9s-4.03 9-9 9 4.03 9 9 9z"/><path d="M12 22c-4.97 0-9-4.03-9-9 4.97 0 9-4.03 9-9s4.03 9 9 9-4.03 9-9 9z"/></svg>
                </span>
                <span class="footer-logo-text">Ingredio</span>
            </a>
            <p class="footer-tagline">
                Your smart kitchen companion for<br>
                less waste, better nutrition, and<br>
                inspired cooking.
            </p>
            <!-- Social links (placeholders) -->
            <div class="footer-social" aria-label="Social media links">
                <a href="#" class="social-link" aria-label="Instagram" title="Instagram">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href="#" class="social-link" aria-label="Twitter / X" title="Twitter">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
                </a>
                <a href="#" class="social-link" aria-label="YouTube" title="YouTube">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
                </a>
                <a href="#" class="social-link" aria-label="Pinterest" title="Pinterest">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.04-2.83.18-.77 1.22-5.17 1.22-5.17s-.31-.62-.31-1.55c0-1.45.84-2.54 1.88-2.54.89 0 1.32.67 1.32 1.47 0 .9-.57 2.24-.87 3.48-.25 1.04.52 1.89 1.54 1.89 1.85 0 3.09-2.37 3.09-5.17 0-2.14-1.44-3.64-3.49-3.64-2.38 0-3.78 1.79-3.78 3.63 0 .72.28 1.49.62 1.91.07.08.08.15.06.23-.06.25-.2.82-.23.94-.04.15-.13.18-.3.11-1.12-.52-1.82-2.17-1.82-3.5 0-2.84 2.06-5.45 5.95-5.45 3.12 0 5.55 2.23 5.55 5.2 0 3.1-1.95 5.6-4.66 5.6-.91 0-1.77-.47-2.06-1.03l-.56 2.1c-.2.78-.75 1.76-1.12 2.36.84.26 1.74.4 2.67.4 5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
                </a>
            </div>
        </div>

        <!-- ── Quick Links ────────────────────────────── -->
        <div class="footer-col">
            <h3 class="footer-heading">Navigate</h3>
            <ul class="footer-links" role="list">
                <li><a href="#" class="footer-link" data-view="dashboard">Dashboard</a></li>
                <li><a href="#" class="footer-link" data-view="pantry">My Pantry</a></li>
                <li><a href="#" class="footer-link" data-view="recipes">Recipe Explorer</a></li>
                <li><a href="#" class="footer-link" data-view="cooking-log">Cooking Log</a></li>
                <li><a href="#" class="footer-link" data-view="profile">My Profile</a></li>
            </ul>
        </div>

        <!-- ── Features ───────────────────────────────── -->
        <div class="footer-col">
            <h3 class="footer-heading">Features</h3>
            <ul class="footer-links" role="list">
                <li><a href="#" class="footer-link">Pantry Tracking</a></li>
                <li><a href="#" class="footer-link">Nutrition Analysis</a></li>
                <li><a href="#" class="footer-link">Waste Reduction</a></li>
                <li><a href="#" class="footer-link">Recipe Discovery</a></li>
                <li><a href="#" class="footer-link">Meal Photo Log</a></li>
            </ul>
        </div>

        <!-- ── Legal & Info ───────────────────────────── -->
        <div class="footer-col">
            <h3 class="footer-heading">Information</h3>
            <ul class="footer-links" role="list">
                <li><a href="#" class="footer-link">About Ingredio</a></li>
                <li><a href="#" class="footer-link">Privacy Policy</a></li>
                <li><a href="#" class="footer-link">Terms of Service</a></li>
                <li><a href="#" class="footer-link">Cookie Policy</a></li>
                <li><a href="#" class="footer-link">Contact Us</a></li>
            </ul>
        </div>

    </div><!-- /.footer-inner -->

    <!-- ── Bottom Bar ─────────────────────────────── -->
    <div class="footer-bottom">
        <div class="footer-bottom-inner">
            <p class="footer-copy">
                &copy; <?= $current_year ?> Ingredio. All rights reserved.
                Built with <span aria-label="care" title="care" style="display:inline-flex;align-items:center;vertical-align:middle;color:var(--accent-color);"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></span> for smarter kitchens.
            </p>
            <p class="footer-tech">
                Powered by PHP &bull; MySQL &bull; Vanilla JS &bull; Spoonacular API
            </p>
        </div>
    </div>

</footer><!-- /.site-footer -->
