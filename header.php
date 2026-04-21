<?php
/**
 * Ingredio - header.php
 * Sticky responsive navigation header.
 * 
 * Security: All dynamic output uses htmlspecialchars() to prevent XSS.
 * The nav links trigger SPA view changes via data-view attributes (no href reload).
 */

// Safely get current user display name if session exists
$user_name = isset($_SESSION['user_name']) ? htmlspecialchars($_SESSION['user_name'], ENT_QUOTES, 'UTF-8') : '';
$is_logged_in = isset($_SESSION['user_id']);
?>

<header class="site-header" id="site-header" role="banner">
    <div class="header-inner">

        <!-- ── Logo ─────────────────────────────────── -->
        <a href="#" class="logo" data-view="dashboard" aria-label="Ingredio Home">
            <span class="logo-icon" aria-hidden="true" style="display:flex;align-items:center;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9-4.03-9-9s-4.03 9-9 9 4.03 9 9 9z"/><path d="M12 22c-4.97 0-9-4.03-9-9 4.97 0 9-4.03 9-9s4.03 9 9 9-4.03 9-9 9z"/></svg>
            </span>
            <span class="logo-text">Ingredio</span>
        </a>

        <!-- ── Desktop Navigation ────────────────────── -->
        <nav class="main-nav" id="main-nav" role="navigation" aria-label="Main navigation">
            <ul class="nav-list" role="list">
                <li>
                    <a href="#" class="nav-link" data-view="dashboard" aria-label="Dashboard">
                        <span class="nav-icon" aria-hidden="true">
                            <!-- Dashboard icon -->
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        </span>
                        Dashboard
                    </a>
                </li>
                <li>
                    <a href="#" class="nav-link" data-view="pantry" aria-label="Pantry">
                        <span class="nav-icon" aria-hidden="true">
                            <!-- Pantry icon -->
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        </span>
                        Pantry
                    </a>
                </li>
                <li>
                    <a href="#" class="nav-link" data-view="recipes" aria-label="Recipe Explorer">
                        <span class="nav-icon" aria-hidden="true">
                            <!-- Recipe icon -->
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        </span>
                        Recipes
                    </a>
                </li>
                <li>
                    <a href="#" class="nav-link" data-view="cooking-log" aria-label="Cooking Log">
                        <span class="nav-icon" aria-hidden="true">
                            <!-- Log icon -->
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        </span>
                        Cooking Log
                    </a>
                </li>
                <li>
                    <a href="#" class="nav-link" data-view="profile" aria-label="Profile">
                        <span class="nav-icon" aria-hidden="true">
                            <!-- Profile icon -->
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </span>
                        Profile
                    </a>
                </li>
            </ul>
        </nav>

        <!-- ── Auth Actions ───────────────────────────── -->
        <div class="header-actions">
            <?php if ($is_logged_in): ?>
                <!-- Logged-in state -->
                <span class="user-greeting" aria-label="Logged in as <?= $user_name ?>">
                    <span class="user-avatar" aria-hidden="true">
                        <?= strtoupper(substr($user_name, 0, 1)) ?>
                    </span>
                    <span class="user-name-display"><?= $user_name ?></span>
                </span>
                <button class="btn btn-ghost" id="logout-btn" aria-label="Log out">
                    Logout
                </button>
            <?php else: ?>
                <!-- Logged-out state -->
                <button class="btn btn-ghost" id="login-btn" data-view="login" aria-label="Log in">
                    Login
                </button>
                <button class="btn btn-primary" id="signup-btn" data-view="signup" aria-label="Sign up">
                    Get Started
                </button>
            <?php endif; ?>
        </div>

        <!-- ── Hamburger (mobile) ─────────────────────── -->
        <button
            class="hamburger"
            id="hamburger-btn"
            aria-label="Toggle mobile menu"
            aria-expanded="false"
            aria-controls="main-nav"
        >
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        </button>

    </div><!-- /.header-inner -->

    <!-- ── Mobile Drawer ─────────────────────────── -->
    <div class="mobile-drawer" id="mobile-drawer" aria-hidden="true">
        <nav aria-label="Mobile navigation">
            <ul class="mobile-nav-list" role="list">
                <li><a href="#" class="mobile-nav-link" data-view="dashboard" style="display:flex;align-items:center;gap:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> Dashboard</a></li>
                <li><a href="#" class="mobile-nav-link" data-view="pantry" style="display:flex;align-items:center;gap:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> Pantry</a></li>
                <li><a href="#" class="mobile-nav-link" data-view="recipes" style="display:flex;align-items:center;gap:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg> Recipes</a></li>
                <li><a href="#" class="mobile-nav-link" data-view="cooking-log" style="display:flex;align-items:center;gap:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/></svg> Cooking Log</a></li>
                <li><a href="#" class="mobile-nav-link" data-view="profile" style="display:flex;align-items:center;gap:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Profile</a></li>
                <li class="mobile-divider"></li>
                <?php if ($is_logged_in): ?>
                    <li><button class="mobile-nav-link mobile-logout" id="mobile-logout-btn" style="display:flex;align-items:center;gap:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Logout</button></li>
                <?php else: ?>
                    <li><a href="#" class="mobile-nav-link" data-view="login" style="display:flex;align-items:center;gap:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Login</a></li>
                    <li><a href="#" class="mobile-nav-link mobile-signup" data-view="signup" style="display:flex;align-items:center;gap:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Get Started</a></li>
                <?php endif; ?>
            </ul>
        </nav>
    </div><!-- /.mobile-drawer -->

</header><!-- /.site-header -->
