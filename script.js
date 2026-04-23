/**
 * ============================================================
 * Ingredio — script.js
 * SPA Frontend Controller
 *
 * Responsibilities:
 *   - SPA routing (no page reloads)
 *   - Dynamic DOM rendering for each view
 *   - UI utilities: loader, toast, modal, transitions
 *   - Client-side validation
 *   - Event binding
 *   - Output sanitization (XSS prevention)
 * ============================================================
 */

'use strict';

/* ============================================================
   STATE
============================================================ */

const AppState = {
  currentView: null,
  pantryItems: [],
  nutritionGoals: { calories: 2000, protein: 150, carbs: 250, fat: 65 },
  nutritionToday: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  recipeResults: [],
  logEntries: [],
  selectedIngredients: [],
  searchMode: 'ingredients',
  savedRecipes: [],
};


/* ============================================================
   1. INITIALISATION
=============================================================== */

/**
 * initApp — Bootstrap the SPA.
 * Called once on DOMContentLoaded.
 */
function initApp() {
  bindGlobalEvents();
  loadSavedTheme();
  markActiveNavLink('dashboard');
  // Delay slightly to show splash animation, then load dashboard
  setTimeout(() => {
    AppState.currentView = null; // ensure dashboard loads fresh
    loadView('dashboard');
  }, 900);
}


/* ============================================================
   2. VIEW ROUTER — loadView()
============================================================ */

/**
 * loadView — Switch the visible view without a page reload.
 * @param {string} view  - One of: dashboard | pantry | recipes | cooking-log | profile
 */
async function loadView(view) {
  if (AppState.currentView === view) return;
  AppState.currentView = view;

  const appContent = document.getElementById('app-content');
  if (!appContent) return;

  markActiveNavLink(view);
  closeMobileDrawer();

  // Fade out
  appContent.style.opacity = '0';
  appContent.style.transform = 'translateY(8px)';

  await sleep(180);

  // Remove splash screen if still present
  const splash = appContent.querySelector('.splash-screen');
  if (splash) {
    splash.style.transition = 'opacity 0.3s ease';
    splash.style.opacity = '0';
  }

  // Toggle auth mode (removes content padding so auth fills viewport)
  if (view === 'login' || view === 'signup') {
    appContent.classList.add('auth-mode');
  } else {
    appContent.classList.remove('auth-mode');
  }

  // Render the view
  switch (view) {
    case 'dashboard': appContent.innerHTML = renderDashboard(); break;
    case 'pantry': appContent.innerHTML = renderPantry(); break;
    case 'recipes': appContent.innerHTML = renderRecipes(); break;
    case 'cooking-log': appContent.innerHTML = renderCookingLog(); break;
    case 'profile': appContent.innerHTML = renderProfile(); break;
    case 'login': appContent.innerHTML = renderLogin(); break;
    case 'signup': appContent.innerHTML = renderRegister(); break;
    default: appContent.innerHTML = renderNotFound(); break;
  }

  // Fade in
  appContent.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  appContent.style.opacity = '1';
  appContent.style.transform = 'translateY(0)';

  // Bind view-specific events
  bindViewEvents(view);

  // Load data for the view
  await hydrateView(view);
}


/* ============================================================
   3. VIEW RENDERERS
============================================================ */

/**
 * renderDashboard — Returns HTML string for the Dashboard view.
 */
function renderDashboard() {
  return `
    <div class="view-wrapper view-enter">

      <!-- Hero welcome -->
      <div class="dashboard-hero">
        <div class="hero-content">
          <p class="hero-greeting">Good ${getTimeGreeting()}</p>
          <h1 class="hero-title">Your Kitchen at a Glance</h1>
          <p class="hero-subtitle">Track your pantry, reduce waste, and cook smarter every day.</p>
          <div class="hero-stats">
            <div>
              <span class="hero-stat-num" id="stat-pantry-count">—</span>
              <span class="hero-stat-label">Pantry Items</span>
            </div>
            <div>
              <span class="hero-stat-num" id="stat-expiring-count">—</span>
              <span class="hero-stat-label">Expiring Soon</span>
            </div>
            <div>
              <span class="hero-stat-num" id="stat-calories-today">—</span>
              <span class="hero-stat-label">kcal Today</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="dashboard-grid">

        <div class="stat-card">
          <div class="stat-icon stat-icon-green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
          <div>
            <div class="stat-num" id="dash-pantry-num">—</div>
            <div class="stat-desc">Pantry Items</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-orange"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div>
            <div class="stat-num" id="dash-expiring-num">—</div>
            <div class="stat-desc">Expiring in 3 days</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-blue"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg></div>
          <div>
            <div class="stat-num" id="dash-log-num">—</div>
            <div class="stat-desc">Meals Logged</div>
          </div>
        </div>

        <!-- Nutrition progress card (span 2) -->
        <div class="card nutrition-card">
          <div class="card-header">
            <h4>Today's Nutrition</h4>
          </div>
          <div class="card-body">
            <div class="nutrition-list" id="nutrition-progress-list">
              <!-- Rendered by hydrateView() -->
              <div class="skeleton skeleton-text" style="width:100%;height:40px;"></div>
              <div class="skeleton skeleton-text" style="width:100%;height:40px;"></div>
              <div class="skeleton skeleton-text" style="width:100%;height:40px;"></div>
              <div class="skeleton skeleton-text" style="width:100%;height:40px;"></div>
            </div>
          </div>
        </div>

        <!-- Expiring soon card -->
        <div class="card">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <h4>Expiring Soon</h4>
            <a href="#" class="text-emerald text-sm" data-view="pantry">View Pantry →</a>
          </div>
          <div class="card-body">
            <div class="expiring-list" id="expiring-list">
              <div class="skeleton skeleton-text" style="width:100%;height:36px;"></div>
              <div class="skeleton skeleton-text" style="width:100%;height:36px;"></div>
              <div class="skeleton skeleton-text" style="width:100%;height:36px;"></div>
            </div>
          </div>
        </div>

      </div><!-- /.dashboard-grid -->

      <!-- Quick action buttons -->
      <div class="flex gap-4" style="flex-wrap:wrap;">
        <button class="btn btn-primary" data-view="pantry">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Ingredient
        </button>
        <button class="btn btn-ghost" data-view="recipes">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Find Recipes
        </button>
        <button class="btn btn-ghost" data-view="cooking-log">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> Log a Meal
        </button>
      </div>

    </div>`;
}

/**
 * renderPantry — Returns HTML string for the Pantry view.
 */
function renderPantry() {
  return `
    <div class="view-wrapper view-enter">

      <div class="section-header">
        <div>
          <h2 class="section-title">My Pantry</h2>
          <p class="section-subtitle">Manage your ingredients. Keep track, waste less.</p>
        </div>
        <button class="btn btn-primary" id="add-ingredient-btn">+ Add Ingredient</button>
      </div>

      <!-- Toolbar: search + filter -->
      <div class="pantry-toolbar">
        <div class="pantry-search-wrap">
          <span class="pantry-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input type="search" class="form-input pantry-search" id="pantry-search" placeholder="Search ingredients…" aria-label="Search pantry">
        </div>
        <select class="form-select" id="pantry-filter" style="width:auto;" aria-label="Filter by category">
          <option value="">All Categories</option>
          <option value="produce">Produce</option>
          <option value="dairy">Dairy</option>
          <option value="protein">Protein</option>
          <option value="grains">Grains</option>
          <option value="spices">Spices</option>
          <option value="beverages">Beverages</option>
          <option value="other">Other</option>
        </select>
        <select class="form-select" id="pantry-sort" style="width:auto;" aria-label="Sort by">
          <option value="name">Sort: Name</option>
          <option value="expiry">Sort: Expiry</option>
          <option value="quantity">Sort: Quantity</option>
        </select>
      </div>

      <!-- Ingredient cards -->
      <div class="ingredients-grid" id="ingredients-grid">
        <!-- Skeleton placeholders while data loads -->
        ${[1, 2, 3, 4, 5, 6].map(() => `
          <div class="card" style="padding:var(--space-5);">
            <div class="skeleton" style="width:48px;height:48px;border-radius:50%;margin-bottom:12px;"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width:70%;"></div>
          </div>
        `).join('')}
      </div>

    </div>`;
}

/**
 * renderRecipes — Returns HTML string for the Recipe Explorer view.
 */
function renderRecipes() {
  return `
    <div class="view-wrapper view-enter">

      <!-- Search hero -->
      <div class="recipe-search-hero">
        <h2 class="section-title" style="font-size:clamp(1.5rem,4vw,2.2rem);">Recipe Explorer</h2>
        <p style="color:var(--color-charcoal-light);margin-top:var(--space-2);">
          Tell us what's in your pantry — we'll find matching recipes.
        </p>
        <!-- Search Mode Toggle -->
        <div style="display:flex; justify-content:center; gap: 16px; margin: 20px 0;">
          <label style="cursor:pointer; display:flex; align-items:center; gap:6px; font-weight:500;">
            <input type="radio" name="search-mode" value="ingredients" ${AppState.searchMode === 'ingredients' ? 'checked' : ''}> By Ingredients
          </label>
          <label style="cursor:pointer; display:flex; align-items:center; gap:6px; font-weight:500;">
            <input type="radio" name="search-mode" value="name" ${AppState.searchMode === 'name' ? 'checked' : ''}> By Name
          </label>
        </div>

        <div class="recipe-search-form" id="search-input-wrapper">
          <input
            type="text"
            class="form-input recipe-search-input"
            id="recipe-search-input"
            placeholder="${AppState.searchMode === 'ingredients' ? 'Add an ingredient (e.g. chicken, tomato)…' : 'Search by meal name (e.g. pasta)…'}"
            aria-label="Recipe search"
          >
          <button class="btn btn-primary" id="recipe-add-ingredient-btn" style="display: ${AppState.searchMode === 'ingredients' ? 'block' : 'none'};">Add</button>
        </div>
        <!-- Selected ingredient chips -->
        <div class="ingredient-chips" id="ingredient-chips" style="display: ${AppState.searchMode === 'ingredients' ? 'flex' : 'none'};">
          <!-- Populated dynamically -->
        </div>
        <div style="margin-top:var(--space-5);display:flex;gap:var(--space-3);justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary btn-lg" id="search-recipes-btn">Find Recipes</button>
          <button class="btn btn-ghost" id="use-pantry-btn">Use My Pantry</button>
        </div>
      </div>

      <!-- Results section -->
      <div id="recipe-results-section">
        <div id="recipe-results-grid" class="recipes-grid">
          <!-- Populated after search -->
        </div>
      </div>

      <hr style="margin: var(--space-8) 0; border: none; border-top: 1px solid var(--color-gray-dark);">

      <!-- Saved Recipes section -->
      <div id="saved-recipes-section">
        <h2 class="section-title" style="margin-bottom: var(--space-4);">My Saved Recipes</h2>
        <div id="saved-recipes-grid" class="recipes-grid">
          <!-- Populated by hydrateRecipes -->
        </div>
      </div>

    </div>`;
}

/**
 * renderCookingLog — Returns HTML string for the Cooking Log view.
 */
function renderCookingLog() {
  return `
    <div class="view-wrapper view-enter">

      <div class="section-header">
        <div>
          <h2 class="section-title">Cooking Log</h2>
          <p class="section-subtitle">Document your meals with photos and notes.</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-8);">

        <!-- Upload form -->
        <div>
          <h4 style="margin-bottom:var(--space-4);">Log a New Meal</h4>

          <!-- Drag & drop upload zone -->
          <div class="upload-zone" id="upload-zone" role="button" tabindex="0" aria-label="Upload meal photo">
            <input type="file" id="meal-image-input" accept="image/jpeg,image/png,image/webp,image/gif" aria-label="Choose meal photo">
            <div class="upload-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>
            <p class="upload-title">Drag &amp; Drop your meal photo</p>
            <p class="upload-hint">or click to browse • JPG, PNG, WEBP, GIF • max 5 MB</p>
          </div>

          <!-- Image preview -->
          <div id="image-preview-container" style="display:none;" class="mt-4">
            <div class="image-preview-wrap">
              <img id="image-preview" src="" alt="Meal preview">
              <button class="image-preview-remove" id="remove-image-btn" title="Remove image"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
          </div>

          <!-- Upload errors -->
          <div id="upload-error" class="form-error mt-4" style="display:none;"></div>

          <!-- Meal details form -->
          <div class="mt-6">
            <div class="form-group">
              <label class="form-label" for="meal-name">Meal Name</label>
              <input type="text" class="form-input" id="meal-name" placeholder="e.g. Grilled Chicken Salad" maxlength="100">
              <span class="form-error" id="meal-name-error" style="display:none;"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="meal-notes">Notes (optional)</label>
              <textarea class="form-textarea" id="meal-notes" placeholder="Describe the meal, recipe used, modifications…" maxlength="500"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="meal-calories">Calories (kcal)</label>
                <input type="number" class="form-input" id="meal-calories" placeholder="e.g. 450" min="0" max="9999">
              </div>
              <div class="form-group">
                <label class="form-label" for="meal-protein">Protein (g)</label>
                <input type="number" class="form-input" id="meal-protein" placeholder="e.g. 25" min="0" max="9999">
              </div>
              <div class="form-group">
                <label class="form-label" for="meal-carbs">Carbs (g)</label>
                <input type="number" class="form-input" id="meal-carbs" placeholder="e.g. 50" min="0" max="9999">
              </div>
              <div class="form-group">
                <label class="form-label" for="meal-fats">Fats (g)</label>
                <input type="number" class="form-input" id="meal-fats" placeholder="e.g. 20" min="0" max="9999">
              </div>
              <div class="form-group">
                <label class="form-label" for="meal-date">Date</label>
                <input type="date" class="form-input" id="meal-date" value="${new Date().toISOString().split('T')[0]}">
              </div>
            </div>
            <button class="btn btn-primary w-full" id="upload-meal-btn" style="margin-top:var(--space-2);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> Log Meal
            </button>
          </div>
        </div>

        <!-- Previous log entries -->
        <div>
          <h4 style="margin-bottom:var(--space-4);">Recent Meals</h4>
          <div id="log-entries-grid" class="log-grid">
            <!-- Skeleton -->
            ${[1, 2, 3, 4].map(() => `
              <div class="log-card">
                <div class="skeleton" style="height:160px;border-radius:0;"></div>
                <div style="padding:var(--space-3);">
                  <div class="skeleton skeleton-text" style="width:80%;"></div>
                  <div class="skeleton skeleton-text" style="width:50%;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div><!-- /.grid -->

    </div>`;
}

/**
 * renderProfile — Returns HTML string for the Profile view.
 * Includes a clickable avatar ring so the user can upload a new photo inline.
 */
function renderProfile() {
  return `
    <div class="view-wrapper view-enter">

      <div class="profile-header">
        <!-- Clickable avatar that opens a hidden file input -->
        <div class="profile-avatar-wrap">
          <div class="profile-avatar-lg" id="profile-avatar">U</div>
          <button class="avatar-change-btn" id="avatar-change-btn"
            title="Change profile photo" aria-label="Change profile photo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
          <!-- Hidden file input; triggered by the button above -->
          <input type="file" id="profile-avatar-input" accept="image/jpeg,image/png,image/webp"
            style="display:none;" aria-label="Upload profile photo">
        </div>
        <div class="profile-info">
          <h2 id="profile-name">User Name</h2>
          <p class="profile-email" id="profile-email">user@example.com</p>
          <span class="badge badge-emerald mt-4">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg> Active Member
          </span>
          <p class="text-muted text-sm" id="avatar-upload-status" style="margin-top:var(--space-2);"></p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-8);">

        <!-- Edit profile form -->
        <div class="card">
          <div class="card-header"><h4>Edit Profile</h4></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label" for="profile-edit-name">Full Name</label>
              <input type="text" class="form-input" id="profile-edit-name" placeholder="Your name">
              <span class="form-error" id="profile-name-error" style="display:none;"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="profile-edit-email">Email Address</label>
              <input type="email" class="form-input" id="profile-edit-email" placeholder="you@example.com">
              <span class="form-error" id="profile-email-error" style="display:none;"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="profile-edit-password">New Password (leave blank to keep)</label>
              <input type="password" class="form-input" id="profile-edit-password" placeholder="••••••••" minlength="8">
            </div>
            <button class="btn btn-primary" id="save-profile-btn">Save Changes</button>
          </div>
        </div>

        <!-- Nutrition goals -->
        <div class="card">
          <div class="card-header"><h4>Daily Nutrition Goals</h4></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label" for="goal-calories">Calories (kcal)</label>
              <input type="number" class="form-input" id="goal-calories" value="2000" min="500" max="9000">
            </div>
            <div class="form-group">
              <label class="form-label" for="goal-protein">Protein (g)</label>
              <input type="number" class="form-input" id="goal-protein" value="150" min="0" max="999">
            </div>
            <div class="form-group">
              <label class="form-label" for="goal-carbs">Carbohydrates (g)</label>
              <input type="number" class="form-input" id="goal-carbs" value="250" min="0" max="999">
            </div>
            <div class="form-group">
              <label class="form-label" for="goal-fat">Fat (g)</label>
              <input type="number" class="form-input" id="goal-fat" value="65" min="0" max="999">
            </div>
            <button class="btn btn-secondary" id="save-goals-btn">Update Goals</button>
          </div>
        </div>

        <!-- Theme Customization -->
        <div class="card" id="theme-card">
          <div class="card-header"><h4>Appearance & Theme</h4></div>
          <div class="card-body">
            <div id="theme-selector-container">
              <!-- Rendered via renderThemeSelector() -->
            </div>
          </div>
        </div>

      </div><!-- /.grid -->

    </div>`;
}

function renderNotFound() {
  return `
    <div class="view-wrapper view-enter text-center" style="padding:80px 24px;">
      <div style="display:flex;justify-content:center;margin-bottom:24px;color:var(--color-charcoal-light);"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
      <h2>Page Not Found</h2>
      <p class="text-muted mt-4">The page you're looking for doesn't exist.</p>
      <button class="btn btn-primary mt-6" data-view="dashboard">Go to Dashboard</button>
    </div>`;
}


/* ============================================================
   4. DATA HYDRATION — hydrateView()
============================================================ */

/**
 * hydrateView — Fetch and inject real data after a view renders.
 * Each case calls the appropriate function from API_Ops.js.
 * @param {string} view
 */
async function hydrateView(view) {
  switch (view) {
    case 'dashboard':
      await hydrateDashboard();
      break;
    case 'pantry':
      await hydratePantry();
      break;
    case 'recipes':
      await hydrateRecipes();
      break;
    case 'cooking-log':
      await hydrateLog();
      break;
    case 'profile':
      await hydrateProfile();
      break;
  }
}

async function hydrateDashboard() {
  try {
    const data = await fetchDashboard();
    if (!data) return;

    // Hero stats
    setInnerText('stat-pantry-count', data.pantry_count ?? 0);
    setInnerText('stat-expiring-count', data.expiring_soon ?? 0);
    setInnerText('stat-calories-today', data.calories_today ?? 0);

    // Stat cards
    setInnerText('dash-pantry-num', data.pantry_count ?? 0);
    setInnerText('dash-expiring-num', data.expiring_soon ?? 0);
    setInnerText('dash-log-num', data.log_count ?? 0);

    // Nutrition progress
    const goals = data.nutrition_goals ?? AppState.nutritionGoals;
    if (data.nutrition_goals) {
      AppState.nutritionGoals = data.nutrition_goals;
    }
    const today = data.nutrition_today ?? AppState.nutritionToday;

    // Keep AppState in sync so other views can read fresh totals
    AppState.nutritionToday = {
      calories: today.calories ?? 0,
      protein: today.protein ?? 0,
      carbs: today.carbs ?? 0,
      fat: today.fat ?? 0,
    };

    renderNutritionProgress(AppState.nutritionToday, goals);

    // Expiring list
    renderExpiringList(data.expiring_items ?? []);

  } catch (err) {
    console.error('[hydrateDashboard]', err);
    showToast('error', 'Dashboard Error', 'Could not load dashboard data.');
  }
}

async function hydratePantry() {
  try {
    const data = await fetchPantry();
    AppState.pantryItems = data ?? [];
    renderIngredientCards(AppState.pantryItems);
  } catch (err) {
    console.error('[hydratePantry]', err);
    const grid = document.getElementById('ingredients-grid');
    if (grid) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h3>Could not load pantry</h3><p>Please try again later.</p></div>`;
  }
}

async function hydrateRecipes() {
  const grid = document.getElementById('saved-recipes-grid');
  if (!grid) return;
  grid.innerHTML = `<div class="skeleton" style="width:100%;height:200px;border-radius:12px;"></div>`;
  try {
    const recipes = await fetchSavedRecipes();
    AppState.savedRecipes = recipes ?? [];
    renderSavedRecipeCards(AppState.savedRecipes);
  } catch (err) {
    console.error('[hydrateRecipes]', err);
    grid.innerHTML = `<p class="text-danger">Failed to load saved recipes.</p>`;
  }
}

async function hydrateLog() {
  try {
    const entries = await fetchCookingLog(20);
    AppState.logEntries = entries ?? [];
    renderLogEntries(AppState.logEntries);
  } catch (err) {
    console.error('[hydrateLog]', err);
    const grid = document.getElementById('log-entries-grid');
    if (grid) grid.innerHTML = `<p class="text-muted text-sm">Could not load recent meals. Please try again.</p>`;
  }
}

async function hydrateProfile() {
  const nameEl = document.getElementById('profile-edit-name');
  const emailEl = document.getElementById('profile-edit-email');
  const avEl = document.getElementById('profile-avatar');
  const nameH2 = document.getElementById('profile-name');
  const emailDisplay = document.getElementById('profile-email');

  try {
    const data = await fetchUserInfo();
    if (!data || !data.success) throw new Error('Profile fetch failed');

    // Sanitize before injecting — use .value / .textContent to avoid XSS
    const name = sanitizeOutput(data.name ?? '');
    const email = sanitizeOutput(data.email ?? '');
    const avatar = data.avatar_path ?? '';

    // Populate display elements (header)
    if (nameH2) nameH2.textContent = data.username;
    if (emailDisplay) emailDisplay.textContent = email;

    // Populate avatar initial (first character of display name)
    if (avEl) {
      if (avatar && !avatar.includes('default-avatar')) {
        // If a real avatar image exists, render it as an <img> inside the circle
        avEl.innerHTML = `<img src="${sanitizeOutput(avatar)}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        avEl.textContent = name.charAt(0).toUpperCase() || 'U';
      }
    }

    // Pre-fill edit form inputs
    if (nameEl) nameEl.value = name;
    if (emailEl) emailEl.value = email;

    // Pre-fill nutrition goals
    if (data.nutrition_goals) {
      AppState.nutritionGoals = data.nutrition_goals;
      const gCal = document.getElementById('goal-calories');
      const gPro = document.getElementById('goal-protein');
      const gCrb = document.getElementById('goal-carbs');
      const gFat = document.getElementById('goal-fat');
      if (gCal) gCal.value = data.nutrition_goals.calories;
      if (gPro) gPro.value = data.nutrition_goals.protein;
      if (gCrb) gCrb.value = data.nutrition_goals.carbs;
      if (gFat) gFat.value = data.nutrition_goals.fat;
    }

  } catch (err) {
    // Graceful fallback — leave placeholder text visible, log for debugging
    console.warn('[hydrateProfile] Could not fetch user info:', err);
    if (nameH2) nameH2.textContent = 'User';
    if (emailDisplay) emailDisplay.textContent = '';
    if (avEl) avEl.textContent = 'U';
  }
}


/* ============================================================
   5. PARTIAL RENDERERS
============================================================ */

function renderNutritionProgress(today, goals) {
  const list = document.getElementById('nutrition-progress-list');
  if (!list) return;

  const nutrients = [
    { key: 'calories', label: 'Calories', unit: 'kcal', color: '#2ECC71' },
    { key: 'protein', label: 'Protein', unit: 'g', color: '#3498DB' },
    { key: 'carbs', label: 'Carbs', unit: 'g', color: '#F39C12' },
    { key: 'fat', label: 'Fat', unit: 'g', color: '#E74C3C' },
  ];

  list.innerHTML = nutrients.map(n => {
    const current = today[n.key] ?? 0;
    const goal = goals[n.key] ?? 1;
    const pct = Math.min(100, Math.round((current / goal) * 100));
    const fillClass = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : '';

    return `
        <div class="nutrition-item">
          <div class="progress-label">
            <span class="nutrition-item-label">${sanitizeOutput(n.label)}</span>
            <span class="nutrition-item-val">${sanitizeOutput(String(current))} / ${sanitizeOutput(String(goal))} ${sanitizeOutput(n.unit)}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill ${fillClass}" style="width:${pct}%;"></div>
          </div>
        </div>`;
  }).join('');
}

function renderExpiringList(items) {
  const list = document.getElementById('expiring-list');
  if (!list) return;

  if (!items || items.length === 0) {
    list.innerHTML = `<p class="text-muted text-sm">No items expiring soon. All good!</p>`;
    return;
  }

  list.innerHTML = items.map(item => {
    const days = item.days_left ?? 0;
    const urgency = days <= 1 ? 'urgent' : days <= 3 ? 'soon' : 'ok';
    const label = days <= 0 ? 'Expired!' : days === 1 ? '1 day' : `${days} days`;

    return `
        <div class="expiring-item">
          <span class="expiring-name">${sanitizeOutput(item.name ?? '')}</span>
          <span class="expiring-days ${urgency}">${sanitizeOutput(label)}</span>
        </div>`;
  }).join('');
}

function renderIngredientCards(items) {
  const grid = document.getElementById('ingredients-grid');
  if (!grid) return;

  if (!items || items.length === 0) {
    grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
          <h3>Your pantry is empty</h3>
          <p>Add your first ingredient to get started.</p>
          <button class="btn btn-primary mt-6" id="add-ingredient-btn-empty">+ Add Ingredient</button>
        </div>`;
    const emptyBtn = document.getElementById('add-ingredient-btn-empty');
    if (emptyBtn) emptyBtn.addEventListener('click', openAddIngredientModal);
    return;
  }

  grid.innerHTML = items.map(item => {
    const daysLeft = daysUntil(item.expiry_date);
    let expiryClass = '';
    let expiryLabel = item.expiry_date ? formatDate(item.expiry_date) : 'No expiry';
    if (daysLeft !== null && daysLeft <= 0) { expiryClass = 'expired'; expiryLabel = 'Expired'; }
    if (daysLeft !== null && daysLeft <= 3 && daysLeft > 0) { expiryClass = 'expiring-soon'; expiryLabel = `${daysLeft}d left`; }

    return `
        <div class="ingredient-card ${expiryClass}" data-id="${sanitizeOutput(String(item.id ?? ''))}">
          <div class="ingredient-icon">${getCategoryIcon(item.category)}</div>
          <div class="ingredient-name">${sanitizeOutput(item.name ?? '')}</div>
          <div class="ingredient-meta">
            <span class="ingredient-quantity">${sanitizeOutput(String(item.quantity ?? ''))} ${sanitizeOutput(item.unit ?? '')}</span>
            <span class="ingredient-expiry text-sm">${sanitizeOutput(expiryLabel)}</span>
          </div>
          ${item.category ? `<span class="badge badge-gray">${sanitizeOutput(item.category)}</span>` : ''}
          <div class="ingredient-actions">
            <button class="btn btn-ghost btn-sm edit-ingredient-btn" data-id="${sanitizeOutput(String(item.id ?? ''))}" aria-label="Edit ${sanitizeOutput(item.name ?? '')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
            </button>
            <button class="btn btn-danger btn-sm delete-ingredient-btn" data-id="${sanitizeOutput(String(item.id ?? ''))}" aria-label="Delete ${sanitizeOutput(item.name ?? '')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>`;
  }).join('');

  // Bind edit & delete buttons
  document.querySelectorAll('.edit-ingredient-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const item = AppState.pantryItems.find(i => String(i.id) === String(id));
      if (item) openEditIngredientModal(item);
    });
  });
  document.querySelectorAll('.delete-ingredient-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      confirmDeleteIngredient(id);
    });
  });
}

function renderRecipeCards(recipes) {
  const grid = document.getElementById('recipe-results-grid');
  if (!grid) return;

  if (!recipes || recipes.length === 0) {
    grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
          <h3>No recipes found</h3>
          <p>Try different ingredients or fewer filters.</p>
        </div>`;
    return;
  }

  grid.innerHTML = recipes.map(r => {
    const image = r.image ? `<img class="recipe-card-image" src="${sanitizeOutput(r.image)}" alt="${sanitizeOutput(r.title ?? '')}" loading="lazy">` : `<div class="recipe-card-image-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg></div>`;
    const cals = r.calories ?? '—';
    const prot = r.protein ?? '—';
    const fat = r.fat ?? '—';

    return `
        <div class="recipe-card" data-recipe-id="${sanitizeOutput(String(r.id ?? ''))}">
          ${image}
          <div class="recipe-card-body">
            <h3 class="recipe-card-title">${sanitizeOutput(r.title ?? 'Untitled Recipe')}</h3>
            <div class="recipe-card-meta">
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${sanitizeOutput(String(r.readyInMinutes ?? '?'))} min</span>
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> ${sanitizeOutput(String(r.servings ?? '?'))} servings</span>
            </div>
            <div class="recipe-macros">
              <div class="recipe-macro">
                <div class="recipe-macro-val">${sanitizeOutput(String(cals))}</div>
                <div class="recipe-macro-label">kcal</div>
              </div>
              <div class="recipe-macro">
                <div class="recipe-macro-val">${sanitizeOutput(String(prot))}g</div>
                <div class="recipe-macro-label">Protein</div>
              </div>
              <div class="recipe-macro">
                <div class="recipe-macro-val">${sanitizeOutput(String(fat))}g</div>
                <div class="recipe-macro-label">Fat</div>
              </div>
            </div>
          </div>
        </div>`;
  }).join('');
}

function renderSavedRecipeCards(recipes) {
  const grid = document.getElementById('saved-recipes-grid');
  if (!grid) return;

  if (!recipes || recipes.length === 0) {
    grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
          <h3>No saved recipes</h3>
          <p>Search for recipes and save them here.</p>
        </div>`;
    return;
  }

  grid.innerHTML = recipes.map(r => {
    const image = r.image_url ? `<img class="recipe-card-image" src="${sanitizeOutput(r.image_url)}" alt="${sanitizeOutput(r.title ?? '')}" loading="lazy">` : `<div class="recipe-card-image-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg></div>`;
    const cals = r.calories ?? '—';
    const prot = r.protein ?? '—';
    const fat = r.fat ?? '—';

    return `
        <div class="recipe-card" data-recipe-id="${sanitizeOutput(String(r.api_id ?? ''))}">
          ${image}
          <div class="recipe-card-body">
            <h3 class="recipe-card-title">${sanitizeOutput(r.title ?? 'Untitled Recipe')}</h3>
            <div class="recipe-macros">
              <div class="recipe-macro">
                <div class="recipe-macro-val">${sanitizeOutput(String(cals))}</div>
                <div class="recipe-macro-label">kcal</div>
              </div>
              <div class="recipe-macro">
                <div class="recipe-macro-val">${sanitizeOutput(String(prot))}g</div>
                <div class="recipe-macro-label">Protein</div>
              </div>
              <div class="recipe-macro">
                <div class="recipe-macro-val">${sanitizeOutput(String(fat))}g</div>
                <div class="recipe-macro-label">Fat</div>
              </div>
            </div>
            <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
              <button class="btn btn-danger btn-sm delete-saved-recipe-btn" data-id="${sanitizeOutput(String(r.id))}" aria-label="Delete ${sanitizeOutput(r.title ?? '')}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> Delete
              </button>
            </div>
          </div>
        </div>`;
  }).join('');

  // Bind delete buttons
  document.querySelectorAll('.delete-saved-recipe-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent opening the recipe modal
      const id = e.currentTarget.dataset.id;
      confirmDeleteSavedRecipe(id);
    });
  });
}

function renderLogEntries(entries) {
  const grid = document.getElementById('log-entries-grid');
  if (!grid) return;

  if (!entries || entries.length === 0) {
    grid.innerHTML = `<p class="text-muted text-sm">No meals logged yet. Upload your first meal!</p>`;
    return;
  }

  grid.innerHTML = entries.map(entry => `
    <div class="log-card">
      <img class="log-card-img" src="${sanitizeOutput(entry.image_path ?? '')}" alt="${sanitizeOutput(entry.meal_name ?? 'Meal photo')}" loading="lazy">
      <div class="log-card-body">
        <p class="log-card-date">${sanitizeOutput(entry.logged_date ?? '')}</p>
        <p class="log-card-note">${sanitizeOutput(entry.meal_name ?? 'Unnamed meal')}</p>
      </div>
    </div>`).join('');
}

/** Show skeleton recipe cards while loading */
function renderRecipeSkeletons(count = 6) {
  const grid = document.getElementById('recipe-results-grid');
  if (!grid) return;
  grid.innerHTML = Array(count).fill(0).map(() => `
    <div class="recipe-skeleton">
      <div class="skeleton recipe-skeleton-img"></div>
      <div class="recipe-skeleton-body">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width:60%;"></div>
      </div>
    </div>`).join('');
}


/* ============================================================
   5b. RECIPE DETAIL MODAL
============================================================ */

/**
 * showRecipeDetails — Fetch full recipe and open the detail modal.
 * Shows a skeleton loader in the modal while the API responds.
 * @param {number} recipeId - Spoonacular recipe ID
 * @param {string} source - 'api' or 'local'
 */
async function showRecipeDetails(recipeId, source = 'api') {
  const id = parseInt(recipeId, 10);
  if (!id || id <= 0) {
    showToast('error', 'Invalid Recipe', 'Could not load this recipe.');
    return;
  }

  // Open modal immediately with a skeleton loader
  openModal(`
    <div class="modal-header">
      <h3 id="modal-title">Loading Recipe…</h3>
    </div>
    <div class="modal-body" id="recipe-detail-body">
      <div class="skeleton skeleton-title" style="height:200px;border-radius:12px;margin-bottom:20px;"></div>
      <div class="skeleton skeleton-text" style="width:60%;"></div>
      <div class="skeleton skeleton-text" style="width:80%;"></div>
      <div class="skeleton skeleton-text" style="width:50%;"></div>
    </div>`);

  try {
    let recipe;
    
    if (source === 'local') {
      const saved = AppState.savedRecipes.find(r => String(r.api_id) === String(id) || String(r.id) === String(id));
      if (!saved) throw new Error('Recipe not found in saved list.');
      
      recipe = {
        success: true,
        id: saved.api_id,
        title: saved.title,
        image: saved.image_url,
        summary: saved.description,
        readyInMinutes: '?', 
        servings: '?', 
        nutrition: {
          calories: saved.calories,
          protein: saved.protein,
          carbs: saved.carbs,
          fat: saved.fat
        },
        extendedIngredients: [],
        analyzedInstructions: []
      };

      try {
        const ings = JSON.parse(saved.ingredients);
        recipe.extendedIngredients = ings.map(i => typeof i === 'string' ? { original: i } : i);
      } catch(e) {
        recipe.extendedIngredients = (saved.ingredients || '').split(',').map(i => ({ original: i.trim() }));
      }

      try {
        const insts = JSON.parse(saved.instructions);
        recipe.analyzedInstructions = insts;
      } catch(e) {
        recipe.analyzedInstructions = [{ steps: [{ step: saved.instructions }] }];
      }
    } else {
      recipe = await getRecipeDetails(id);
    }

    if (!recipe || !recipe.success) {
      throw new Error(recipe?.message ?? 'Could not load recipe details.');
    }

    // Re-render modal with full data
    const content = document.getElementById('modal-content');
    if (content) content.innerHTML = renderRecipeDetailModal(recipe);

    // Bind the Save button
    document.getElementById('save-recipe-btn')?.addEventListener('click', () => handleSaveRecipe(recipe));

  } catch (err) {
    console.error('[showRecipeDetails]', err);
    const body = document.getElementById('recipe-detail-body');
    if (body) {
      body.innerHTML = `<p class="text-muted text-sm" style="padding:20px;">
        Could not load recipe details. ${sanitizeOutput(err.message)}
      </p>`;
    } else {
      closeModal();
      showToast('error', 'Load Failed', err.message ?? 'Could not load recipe details.');
    }
  }
}

/**
 * renderRecipeDetailModal — Build the full recipe detail HTML for the modal.
 * All user-visible strings are run through sanitizeOutput() for XSS prevention.
 * @param {Object} recipe - Mapped recipe object from API_Ops.php
 * @returns {string} HTML string
 */
function renderRecipeDetailModal(recipe) {
  const title = sanitizeOutput(recipe.title ?? 'Untitled Recipe');
  const image = recipe.image ? sanitizeOutput(recipe.image) : '';
  const time = sanitizeOutput(String(recipe.readyInMinutes ?? '?'));
  const servings = sanitizeOutput(String(recipe.servings ?? '?'));
  const summary = sanitizeOutput(recipe.summary ?? '');

  // Nutrition dashboard
  const n = recipe.nutrition ?? {};
  const macros = [
    { label: 'Calories', value: n.calories ?? 0, unit: 'kcal', color: '#2ECC71' },
    { label: 'Protein', value: n.protein ?? 0, unit: 'g', color: '#3498DB' },
    { label: 'Carbs', value: n.carbs ?? 0, unit: 'g', color: '#F39C12' },
    { label: 'Fat', value: n.fat ?? 0, unit: 'g', color: '#E74C3C' },
  ];

  const nutritionHtml = `
    <div class="recipe-detail-macros">
      ${macros.map(m => `
        <div class="recipe-detail-macro-card" style="border-top:3px solid ${m.color};">
          <div class="recipe-detail-macro-val">${sanitizeOutput(String(m.value))}</div>
          <div class="recipe-detail-macro-unit">${sanitizeOutput(m.unit)}</div>
          <div class="recipe-detail-macro-label">${sanitizeOutput(m.label)}</div>
        </div>`).join('')}
    </div>`;

  // Ingredients list
  const ingredients = recipe.extendedIngredients ?? [];
  const ingredientsHtml = ingredients.length === 0
    ? `<p class="text-muted text-sm">No ingredient data available.</p>`
    : `<ul class="recipe-ingredients-list">
        ${ingredients.map(i => `
          <li class="recipe-ingredient-item">
            <span class="recipe-ingredient-dot"></span>
            <span>${sanitizeOutput(String(i.amount ?? ''))} ${sanitizeOutput(i.unit ?? '')}
              <strong>${sanitizeOutput(i.name ?? '')}</strong>
            </span>
          </li>`).join('')}
       </ul>`;

  // Instructions
  const instructionSections = recipe.analyzedInstructions ?? [];
  let instructionsHtml = '';
  if (instructionSections.length === 0) {
    instructionsHtml = `<p class="text-muted text-sm">No instructions available.</p>`;
  } else {
    instructionsHtml = instructionSections.map(section => {
      const sectionName = section.name ? `<h5 class="instructions-section-title">${sanitizeOutput(section.name)}</h5>` : '';
      const steps = (section.steps ?? []).map(s => `
        <li class="instruction-step">
          <span class="step-number">${sanitizeOutput(String(s.number))}</span>
          <span class="step-text">${sanitizeOutput(s.step ?? '')}</span>
        </li>`).join('');
      return `${sectionName}<ol class="instructions-list">${steps}</ol>`;
    }).join('');
  }

  return `
    <div class="modal-header recipe-detail-header" style="padding-bottom:0;">
      ${image ? `<img src="${image}" alt="${title}" class="recipe-detail-hero-img" loading="lazy">` : ''}
      <div class="recipe-detail-title-row">
        <h3 id="modal-title" class="recipe-detail-title">${title}</h3>
        <div class="recipe-detail-meta-row">
          <span class="recipe-detail-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${time} min
          </span>
          <span class="recipe-detail-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            ${servings} servings
          </span>
        </div>
      </div>
    </div>

    <div class="modal-body recipe-detail-body">

      ${summary ? `<p class="recipe-detail-summary">${summary}</p>` : ''}

      <section class="recipe-detail-section">
        <h4 class="recipe-detail-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          Nutrition Dashboard
        </h4>
        ${nutritionHtml}
      </section>

      <section class="recipe-detail-section">
        <h4 class="recipe-detail-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2l1.5 5H21l-3 9H6L3 2z"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>
          Ingredients <span class="recipe-count-badge">${sanitizeOutput(String(ingredients.length))}</span>
        </h4>
        ${ingredientsHtml}
      </section>

      <section class="recipe-detail-section">
        <h4 class="recipe-detail-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Instructions
        </h4>
        ${instructionsHtml}
      </section>

    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" id="save-recipe-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Save Recipe
      </button>
    </div>`;
}

/**
 * handleSaveRecipe — Persist the currently-viewed recipe via saveRecipe().
 * @param {Object} recipe - Full recipe object from getRecipeDetails()
 */
async function handleSaveRecipe(recipe) {
  const btn = document.getElementById('save-recipe-btn');
  setButtonLoading(btn, true);

  try {
    const result = await saveRecipe(recipe);
    if (result && result.success) {
      if (result.duplicate) {
        showToast('info', 'Already Saved', `"${sanitizeOutput(recipe.title ?? 'Recipe')}" is already in your saved recipes.`);
      } else {
        showToast('success', 'Recipe Saved!', `"${sanitizeOutput(recipe.title ?? 'Recipe')}" has been added to your saved recipes.`);
        if (btn) {
          btn.textContent = '✓ Saved';
          btn.disabled = true;
        }
      }
    } else {
      showToast('error', 'Save Failed', result?.message ?? 'Could not save recipe. Please try again.');
    }
  } catch (err) {
    console.error('[handleSaveRecipe]', err);
    showToast('error', 'Error', 'An unexpected error occurred while saving the recipe.');
  } finally {
    if (btn && !btn.disabled) setButtonLoading(btn, false);
  }
}


/* ============================================================
   6. MODALS — Ingredient CRUD
============================================================ */

function openAddIngredientModal() {
  openModal(`
    <div class="modal-header">
      <h3 id="modal-title">Add New Ingredient</h3>
      <p class="text-muted text-sm">Fill in the details below to add to your pantry.</p>
    </div>
    <div class="modal-body">
      <form id="add-ingredient-form" novalidate>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="ing-name">Name *</label>
            <input type="text" class="form-input" id="ing-name" placeholder="e.g. Chicken Breast" required maxlength="100">
            <span class="form-error" id="ing-name-error" style="display:none;"></span>
          </div>
          <div class="form-group">
            <label class="form-label" for="ing-category">Category</label>
            <select class="form-select" id="ing-category">
              <option value="">Select category</option>
              <option value="produce">Produce</option>
              <option value="dairy">Dairy</option>
              <option value="protein">Protein</option>
              <option value="grains">Grains</option>
              <option value="spices">Spices</option>
              <option value="beverages">Beverages</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="ing-quantity">Quantity *</label>
            <input type="number" class="form-input" id="ing-quantity" placeholder="e.g. 500" min="0.01" step="0.01" required>
            <span class="form-error" id="ing-quantity-error" style="display:none;"></span>
          </div>
          <div class="form-group">
            <label class="form-label" for="ing-unit">Unit</label>
            <select class="form-select" id="ing-unit">
              <option value="g">g (grams)</option>
              <option value="kg">kg (kilograms)</option>
              <option value="ml">ml (milliliters)</option>
              <option value="L">L (liters)</option>
              <option value="pcs">pcs (pieces)</option>
              <option value="cups">cups</option>
              <option value="tbsp">tbsp</option>
              <option value="tsp">tsp</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="ing-expiry">Expiry Date</label>
          <input type="date" class="form-input" id="ing-expiry">
        </div>
        <div class="form-group">
          <label class="form-label" for="ing-notes">Notes (optional)</label>
          <input type="text" class="form-input" id="ing-notes" placeholder="e.g. Organic, from local market" maxlength="200">
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="cancel-add-btn">Cancel</button>
      <button class="btn btn-primary" id="confirm-add-btn">Add Ingredient</button>
    </div>`);

  document.getElementById('cancel-add-btn')?.addEventListener('click', closeModal);
  document.getElementById('confirm-add-btn')?.addEventListener('click', handleAddIngredient);
}

function openEditIngredientModal(item) {
  const html = `
    <div class="modal-header">
      <h3 id="modal-title">Edit Ingredient</h3>
      <p class="text-muted text-sm">Update the details for ${sanitizeOutput(item.name ?? '')}.</p>
    </div>
    <div class="modal-body">
      <form id="edit-ingredient-form" novalidate>
        <input type="hidden" id="edit-ing-id" value="${sanitizeOutput(String(item.id ?? ''))}">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="edit-ing-name">Name *</label>
            <input type="text" class="form-input" id="edit-ing-name" value="${sanitizeOutput(item.name ?? '')}" required maxlength="100">
            <span class="form-error" id="edit-ing-name-error" style="display:none;"></span>
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-ing-category">Category</label>
            <select class="form-select" id="edit-ing-category">
              <option value="">Select category</option>
              <option value="produce"   ${item.category === 'produce' ? 'selected' : ''}>Produce</option>
              <option value="dairy"     ${item.category === 'dairy' ? 'selected' : ''}>Dairy</option>
              <option value="protein"   ${item.category === 'protein' ? 'selected' : ''}>Protein</option>
              <option value="grains"    ${item.category === 'grains' ? 'selected' : ''}>Grains</option>
              <option value="spices"    ${item.category === 'spices' ? 'selected' : ''}>Spices</option>
              <option value="beverages" ${item.category === 'beverages' ? 'selected' : ''}>Beverages</option>
              <option value="other"     ${item.category === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="edit-ing-quantity">Quantity *</label>
            <input type="number" class="form-input" id="edit-ing-quantity" value="${sanitizeOutput(String(item.quantity ?? ''))}" min="0.01" step="0.01" required>
            <span class="form-error" id="edit-ing-quantity-error" style="display:none;"></span>
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-ing-unit">Unit</label>
            <select class="form-select" id="edit-ing-unit">
              <option value="g"    ${item.unit === 'g' ? 'selected' : ''}>g</option>
              <option value="kg"   ${item.unit === 'kg' ? 'selected' : ''}>kg</option>
              <option value="ml"   ${item.unit === 'ml' ? 'selected' : ''}>ml</option>
              <option value="L"    ${item.unit === 'L' ? 'selected' : ''}>L</option>
              <option value="pcs"  ${item.unit === 'pcs' ? 'selected' : ''}>pcs</option>
              <option value="cups" ${item.unit === 'cups' ? 'selected' : ''}>cups</option>
              <option value="tbsp" ${item.unit === 'tbsp' ? 'selected' : ''}>tbsp</option>
              <option value="tsp"  ${item.unit === 'tsp' ? 'selected' : ''}>tsp</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-ing-expiry">Expiry Date</label>
          <input type="date" class="form-input" id="edit-ing-expiry" value="${sanitizeOutput(item.expiry_date ?? '')}">
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="cancel-edit-btn">Cancel</button>
      <button class="btn btn-primary" id="confirm-edit-btn">Save Changes</button>
    </div>`;

  openModal(html);

  document.getElementById('cancel-edit-btn')?.addEventListener('click', closeModal);
  document.getElementById('confirm-edit-btn')?.addEventListener('click', handleEditIngredient);
}

function confirmDeleteIngredient(id) {
  const item = AppState.pantryItems.find(i => String(i.id) === String(id));
  const name = item ? sanitizeOutput(item.name) : 'this ingredient';

  openModal(`
    <div class="modal-header">
      <h3 id="modal-title">Delete Ingredient</h3>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to delete <strong>${name}</strong> from your pantry? This cannot be undone.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="cancel-delete-btn">Cancel</button>
      <button class="btn btn-danger" id="confirm-delete-btn" data-id="${sanitizeOutput(String(id))}">Delete</button>
    </div>`);

  document.getElementById('cancel-delete-btn')?.addEventListener('click', closeModal);
  document.getElementById('confirm-delete-btn')?.addEventListener('click', async (e) => {
    const itemId = e.currentTarget.dataset.id;
    closeModal();
    await handleDeleteIngredient(itemId);
  });
}

function confirmDeleteSavedRecipe(id) {
  openModal(`
    <div class="modal-header">
      <h3 id="modal-title">Remove Recipe</h3>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to remove this recipe from your saved list?</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="cancel-recipe-delete-btn">Cancel</button>
      <button class="btn btn-danger" id="confirm-recipe-delete-btn" data-id="${sanitizeOutput(String(id))}">Remove</button>
    </div>`);

  document.getElementById('cancel-recipe-delete-btn')?.addEventListener('click', closeModal);
  document.getElementById('confirm-recipe-delete-btn')?.addEventListener('click', async (e) => {
    const recipeId = e.currentTarget.dataset.id;
    closeModal();
    await handleDeleteSavedRecipe(recipeId);
  });
}


/* ============================================================
   7. CRUD HANDLERS
============================================================ */

async function handleAddIngredient() {
  const name = document.getElementById('ing-name')?.value.trim() ?? '';
  const quantity = document.getElementById('ing-quantity')?.value.trim() ?? '';
  const unit = document.getElementById('ing-unit')?.value ?? '';
  const category = document.getElementById('ing-category')?.value ?? '';
  const expiry = document.getElementById('ing-expiry')?.value ?? '';
  const notes = document.getElementById('ing-notes')?.value.trim() ?? '';

  // --- Client-side validation ---
  let valid = true;
  if (!name) {
    showFieldError('ing-name', 'ing-name-error', 'Name is required.');
    valid = false;
  } else {
    clearFieldError('ing-name', 'ing-name-error');
  }
  if (!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
    showFieldError('ing-quantity', 'ing-quantity-error', 'Enter a valid positive quantity.');
    valid = false;
  } else {
    clearFieldError('ing-quantity', 'ing-quantity-error');
  }
  if (!valid) return;

  const btn = document.getElementById('confirm-add-btn');
  setButtonLoading(btn, true);

  try {
    const result = await addIngredient({ name, quantity, unit, category, expiry_date: expiry, notes });
    if (result && result.success) {
      closeModal();
      showToast('success', 'Ingredient Added', `${name} has been added to your pantry.`);
      await hydratePantry();
    } else {
      showToast('error', 'Add Failed', result?.message ?? 'Could not add ingredient.');
    }
  } catch (err) {
    console.error('[handleAddIngredient]', err);
    showToast('error', 'Error', 'An unexpected error occurred.');
  } finally {
    setButtonLoading(btn, false);
  }
}

async function handleEditIngredient() {
  const id = document.getElementById('edit-ing-id')?.value ?? '';
  const name = document.getElementById('edit-ing-name')?.value.trim() ?? '';
  const quantity = document.getElementById('edit-ing-quantity')?.value.trim() ?? '';
  const unit = document.getElementById('edit-ing-unit')?.value ?? '';
  const category = document.getElementById('edit-ing-category')?.value ?? '';
  const expiry = document.getElementById('edit-ing-expiry')?.value ?? '';

  // --- Client-side validation ---
  let valid = true;
  if (!name) {
    showFieldError('edit-ing-name', 'edit-ing-name-error', 'Name is required.');
    valid = false;
  } else {
    clearFieldError('edit-ing-name', 'edit-ing-name-error');
  }
  if (!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
    showFieldError('edit-ing-quantity', 'edit-ing-quantity-error', 'Enter a valid positive quantity.');
    valid = false;
  } else {
    clearFieldError('edit-ing-quantity', 'edit-ing-quantity-error');
  }
  if (!valid) return;

  const btn = document.getElementById('confirm-edit-btn');
  setButtonLoading(btn, true);

  try {
    const result = await updateIngredient({ id, name, quantity, unit, category, expiry_date: expiry });
    if (result && result.success) {
      closeModal();
      showToast('success', 'Ingredient Updated', `${name} has been updated.`);
      await hydratePantry();
    } else {
      showToast('error', 'Update Failed', result?.message ?? 'Could not update ingredient.');
    }
  } catch (err) {
    console.error('[handleEditIngredient]', err);
    showToast('error', 'Error', 'An unexpected error occurred.');
  } finally {
    setButtonLoading(btn, false);
  }
}

async function handleDeleteIngredient(id) {
  try {
    const result = await deleteIngredient(id);
    if (result && result.success) {
      AppState.pantryItems = AppState.pantryItems.filter(i => String(i.id) !== String(id));
      renderIngredientCards(AppState.pantryItems);
      showToast('success', 'Ingredient Deleted', 'Item removed from your pantry.');
    } else {
      showToast('error', 'Delete Failed', result?.message ?? 'Could not delete ingredient.');
    }
  } catch (err) {
    console.error('[handleDeleteIngredient]', err);
    showToast('error', 'Error', 'An unexpected error occurred.');
  }
}

async function handleDeleteSavedRecipe(id) {
  try {
    const result = await deleteSavedRecipe(id);
    if (result && result.success) {
      showToast('success', 'Recipe Removed', 'The recipe has been removed from your saved list.');
      await hydrateRecipes();
    } else {
      showToast('error', 'Remove Failed', result?.message ?? 'Could not remove recipe.');
    }
  } catch (err) {
    console.error('[handleDeleteSavedRecipe]', err);
    showToast('error', 'Error', 'An unexpected error occurred.');
  }
}


/* ============================================================
   8. RECIPE SEARCH HANDLERS
============================================================ */

function handleAddRecipeIngredient() {
  const input = document.getElementById('recipe-search-input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  if (AppState.selectedIngredients.includes(val.toLowerCase())) {
    showToast('warning', 'Already Added', `"${val}" is already in the list.`);
    input.value = '';
    return;
  }
  AppState.selectedIngredients.push(val.toLowerCase());
  input.value = '';
  renderIngredientChips();
}

function renderIngredientChips() {
  const container = document.getElementById('ingredient-chips');
  if (!container) return;
  container.innerHTML = AppState.selectedIngredients.map(ing => `
    <span class="chip">
      ${sanitizeOutput(ing)}
      <button class="chip-remove" data-ing="${sanitizeOutput(ing)}" aria-label="Remove ${sanitizeOutput(ing)}">✕</button>
    </span>`).join('');

  container.querySelectorAll('.chip-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ing = e.currentTarget.dataset.ing;
      AppState.selectedIngredients = AppState.selectedIngredients.filter(i => i !== ing);
      renderIngredientChips();
    });
  });
}

async function handleSearchRecipes() {
  let query = '';
  
  if (AppState.searchMode === 'ingredients') {
    if (AppState.selectedIngredients.length === 0) {
      showToast('warning', 'No Ingredients', 'Add at least one ingredient to search recipes.');
      return;
    }
    query = AppState.selectedIngredients.join(',');
  } else {
    const input = document.getElementById('recipe-search-input');
    query = input?.value.trim() ?? '';
    if (!query) {
      showToast('warning', 'Empty Search', 'Enter a meal name to search.');
      return;
    }
  }

  renderRecipeSkeletons();
  showLoader();

  try {
    const results = await searchRecipes(query, AppState.searchMode);
    AppState.recipeResults = results ?? [];
    renderRecipeCards(AppState.recipeResults);
  } catch (err) {
    console.error('[handleSearchRecipes]', err);
    const grid = document.getElementById('recipe-results-grid');
    if (grid) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h3>Recipe search failed</h3><p>The API may be unavailable. Please try again.</p></div>`;
    showToast('error', 'Search Failed', 'Could not reach the recipe API. Please try again.');
  } finally {
    hideLoader();
  }
}

function handleUsePantry() {
  const pantryNames = AppState.pantryItems.map(i => i.name?.toLowerCase()).filter(Boolean);
  if (pantryNames.length === 0) {
    showToast('warning', 'Empty Pantry', 'Add ingredients to your pantry first.');
    return;
  }
  AppState.selectedIngredients = pantryNames.slice(0, 10); // API limit
  renderIngredientChips();
  showToast('info', 'Pantry Loaded', `${AppState.selectedIngredients.length} ingredients added from your pantry.`);
}


/* ============================================================
   9. UPLOAD HANDLER
============================================================ */

function handleFileSelect(file) {
  const errorEl = document.getElementById('upload-error');

  // --- Client-side file validation ---
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5 MB

  if (!allowedTypes.includes(file.type)) {
    showEl(errorEl, 'Invalid file type. Only JPG, PNG, WEBP, GIF allowed.');
    return;
  }
  if (file.size > maxSize) {
    showEl(errorEl, 'File too large. Maximum size is 5 MB.');
    return;
  }

  hideEl(errorEl);

  // Show image preview
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('image-preview');
    const container = document.getElementById('image-preview-container');
    const zone = document.getElementById('upload-zone');
    if (preview) preview.src = e.target.result;
    if (container) container.style.display = 'block';
    if (zone) zone.style.display = 'none';
  };
  reader.readAsDataURL(file);

  // Store file reference
  AppState._pendingFile = file;
}

async function handleUploadMeal() {
  const mealName = document.getElementById('meal-name')?.value.trim() ?? '';
  const notes = document.getElementById('meal-notes')?.value.trim() ?? '';
  const calories = document.getElementById('meal-calories')?.value ?? '';
  const date = document.getElementById('meal-date')?.value ?? '';

  // --- Client-side validation ---
  if (!mealName) {
    showEl(document.getElementById('meal-name-error'), 'Meal name is required.');
    document.getElementById('meal-name')?.classList.add('error');
    return;
  }
  document.getElementById('meal-name')?.classList.remove('error');
  hideEl(document.getElementById('meal-name-error'));

  if (!AppState._pendingFile) {
    showToast('warning', 'No Photo', 'Please select a meal photo before uploading.');
    return;
  }

  showLoader();
  const btn = document.getElementById('upload-meal-btn');
  setButtonLoading(btn, true);

  try {
    const result = await uploadMealImage({
      file: AppState._pendingFile,
      mealName: mealName,
      notes: notes,
      calories: calories,
      date: date,
    });

    if (result && result.success) {
      showToast('success', 'Meal Logged!', `${mealName} has been saved.`);
      AppState._pendingFile = null;
      // Reset the form
      const zone = document.getElementById('upload-zone');
      const container = document.getElementById('image-preview-container');
      if (zone) zone.style.display = 'block';
      if (container) container.style.display = 'none';
      document.getElementById('meal-name').value = '';
      document.getElementById('meal-notes').value = '';
      await hydrateLog();
    } else {
      showToast('error', 'Upload Failed', result?.message ?? 'Could not upload the meal image.');
    }
  } catch (err) {
    console.error('[handleUploadMeal]', err);
    showToast('error', 'Error', 'An unexpected error occurred during upload.');
  } finally {
    hideLoader();
    setButtonLoading(btn, false);
  }
}


/* ============================================================
   10. EVENT BINDING
============================================================ */

/**
 * bindGlobalEvents — Attach events that persist across all views.
 */
function bindGlobalEvents() {
  // ── Nav links (header + footer) ──────────────────
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-view]');
    if (link) {
      e.preventDefault();
      loadView(link.dataset.view);
    }
  });

  // ── Hamburger menu ──────────────────────────────
  const hamburger = document.getElementById('hamburger-btn');
  if (hamburger) {
    hamburger.addEventListener('click', toggleMobileDrawer);
  }

  // ── Modal close (overlay click) ─────────────────
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);

  // ── Escape key closes modal ─────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // ── Header scroll shadow ─────────────────────────
  window.addEventListener('scroll', () => {
    const header = document.getElementById('site-header');
    if (header) header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // ── Logout ──────────────────────────────────────
  document.addEventListener('click', (e) => {
    if (e.target.id === 'logout-btn' || e.target.id === 'mobile-logout-btn') {
      handleLogout();
    }
  });
}

/**
 * bindViewEvents — Attach events specific to the currently loaded view.
 * @param {string} view
 */
function bindViewEvents(view) {
  switch (view) {

    case 'pantry': {
      // Add ingredient button
      document.getElementById('add-ingredient-btn')?.addEventListener('click', openAddIngredientModal);

      // Live search filter
      document.getElementById('pantry-search')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = AppState.pantryItems.filter(i => (i.name ?? '').toLowerCase().includes(query));
        renderIngredientCards(filtered);
      });

      // Category filter
      document.getElementById('pantry-filter')?.addEventListener('change', (e) => {
        const cat = e.target.value;
        const filtered = cat
          ? AppState.pantryItems.filter(i => i.category === cat)
          : AppState.pantryItems;
        renderIngredientCards(filtered);
      });

      // Sort
      document.getElementById('pantry-sort')?.addEventListener('change', (e) => {
        const sortBy = e.target.value;
        const sorted = [...AppState.pantryItems].sort((a, b) => {
          if (sortBy === 'name') return (a.name ?? '').localeCompare(b.name ?? '');
          if (sortBy === 'expiry') return new Date(a.expiry_date ?? '9999') - new Date(b.expiry_date ?? '9999');
          if (sortBy === 'quantity') return (b.quantity ?? 0) - (a.quantity ?? 0);
          return 0;
        });
        renderIngredientCards(sorted);
      });
      break;
    }

    case 'recipes': {
      // Search Mode Toggle
      document.querySelectorAll('input[name="search-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          AppState.searchMode = e.target.value;
          const input = document.getElementById('recipe-search-input');
          const addBtn = document.getElementById('recipe-add-ingredient-btn');
          const chips = document.getElementById('ingredient-chips');
          
          if (AppState.searchMode === 'ingredients') {
            if (input) input.placeholder = 'Add an ingredient (e.g. chicken, tomato)…';
            if (addBtn) addBtn.style.display = 'block';
            if (chips) chips.style.display = 'flex';
          } else {
            if (input) input.placeholder = 'Search by meal name (e.g. pasta)…';
            if (addBtn) addBtn.style.display = 'none';
            if (chips) chips.style.display = 'none';
          }
        });
      });

      // Add ingredient chip on button click
      document.getElementById('recipe-add-ingredient-btn')?.addEventListener('click', handleAddRecipeIngredient);

      // Add on Enter key
      document.getElementById('recipe-search-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { 
          e.preventDefault(); 
          if (AppState.searchMode === 'ingredients') {
            handleAddRecipeIngredient(); 
          } else {
            handleSearchRecipes();
          }
        }
      });

      // Search recipes
      document.getElementById('search-recipes-btn')?.addEventListener('click', handleSearchRecipes);

      // Use pantry
      document.getElementById('use-pantry-btn')?.addEventListener('click', handleUsePantry);

      // Recipe card click — delegate on results grid (populated after search)
      document.getElementById('recipe-results-grid')?.addEventListener('click', (e) => {
        const card = e.target.closest('.recipe-card[data-recipe-id]');
        if (card) {
          const recipeId = parseInt(card.dataset.recipeId, 10);
          if (recipeId > 0) showRecipeDetails(recipeId, 'api');
        }
      });

      // Saved Recipe card click — delegate on saved recipes grid
      document.getElementById('saved-recipes-grid')?.addEventListener('click', (e) => {
        // Exclude delete button clicks
        if (e.target.closest('.delete-saved-recipe-btn')) return;
        
        const card = e.target.closest('.recipe-card[data-recipe-id]');
        if (card) {
          const recipeId = parseInt(card.dataset.recipeId, 10);
          if (recipeId > 0) showRecipeDetails(recipeId, 'local');
        }
      });
      break;
    }

    case 'cooking-log': {
      // File input change
      document.getElementById('meal-image-input')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
      });

      // Drag & drop
      const zone = document.getElementById('upload-zone');
      if (zone) {
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
        zone.addEventListener('drop', (e) => {
          e.preventDefault();
          zone.classList.remove('drag-over');
          const file = e.dataTransfer.files?.[0];
          if (file) handleFileSelect(file);
        });
      }

      // Remove image
      document.getElementById('remove-image-btn')?.addEventListener('click', () => {
        AppState._pendingFile = null;
        const container = document.getElementById('image-preview-container');
        const zone2 = document.getElementById('upload-zone');
        if (container) container.style.display = 'none';
        if (zone2) zone2.style.display = 'block';
        const input = document.getElementById('meal-image-input');
        if (input) input.value = '';
      });

      // Upload button
      document.getElementById('upload-meal-btn')?.addEventListener('click', handleUploadMeal);
      break;
    }

    case 'profile': {
      document.getElementById('save-profile-btn')?.addEventListener('click', handleSaveProfile);
      document.getElementById('save-goals-btn')?.addEventListener('click', handleSaveGoals);

      // Avatar upload: clicking the camera button opens the hidden file input
      document.getElementById('avatar-change-btn')?.addEventListener('click', () => {
        document.getElementById('profile-avatar-input')?.click();
      });
      document.getElementById('profile-avatar-input')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) handleAvatarUpload(file);
      });

      renderThemeSelector();
      break;
    }

    case 'login': {
      document.getElementById('login-form')?.addEventListener('submit', handleLogin);
      document.getElementById('login-show-pw')?.addEventListener('click', () =>
        togglePasswordVisibility('login-password', 'login-show-pw'));
      break;
    }

    case 'signup': {
      document.getElementById('register-form')?.addEventListener('submit', handleRegister);
      document.getElementById('reg-show-pw')?.addEventListener('click', () =>
        togglePasswordVisibility('reg-password', 'reg-show-pw'));
      document.getElementById('reg-show-confirm-pw')?.addEventListener('click', () =>
        togglePasswordVisibility('reg-confirm-pw', 'reg-show-confirm-pw'));
      document.getElementById('reg-password')?.addEventListener('input', updatePasswordStrength);
      document.getElementById('reg-confirm-pw')?.addEventListener('input', validatePasswordMatch);
      document.getElementById('avatar-file-input')?.addEventListener('change', handleAvatarPreview);
      document.getElementById('avatar-preview-btn')?.addEventListener('click', () =>
        document.getElementById('avatar-file-input')?.click());
      break;
    }
  }
}

async function handleLogout() {
  showLoader();
  try {
    await logoutUser();
    showToast('info', 'Logged Out', 'You have been safely logged out.');
    // Reload to reset PHP session state
    setTimeout(() => window.location.reload(), 1000);
  } catch (err) {
    hideLoader();
    showToast('error', 'Error', 'Could not log out. Please try again.');
  }
}

async function handleSaveProfile() {
  const name = document.getElementById('profile-edit-name')?.value.trim() ?? '';
  const email = document.getElementById('profile-edit-email')?.value.trim() ?? '';
  const password = document.getElementById('profile-edit-password')?.value ?? '';

  // ── Client-side validation ──────────────────────────
  let valid = true;
  if (name.length < 3) {
    showEl(document.getElementById('profile-name-error'), 'Name must be at least 3 characters.');
    document.getElementById('profile-edit-name')?.classList.add('error');
    valid = false;
  } else {
    hideEl(document.getElementById('profile-name-error'));
    document.getElementById('profile-edit-name')?.classList.remove('error');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showEl(document.getElementById('profile-email-error'), 'Enter a valid email address.');
    document.getElementById('profile-edit-email')?.classList.add('error');
    valid = false;
  } else {
    hideEl(document.getElementById('profile-email-error'));
    document.getElementById('profile-edit-email')?.classList.remove('error');
  }
  if (password && password.length < 8) {
    showToast('warning', 'Weak Password', 'New password must be at least 8 characters.');
    valid = false;
  }
  if (!valid) return;

  const btn = document.getElementById('save-profile-btn');
  setButtonLoading(btn, true);

  try {
    const result = await updateProfile({ name, email, password });
    if (result && result.success) {
      // Refresh displayed name in profile header
      const nameH2 = document.getElementById('profile-name');
      if (nameH2) nameH2.textContent = sanitizeOutput(name);
      // Clear password field after successful save
      const pwEl = document.getElementById('profile-edit-password');
      if (pwEl) pwEl.value = '';
      showToast('success', 'Profile Saved', 'Your profile has been updated successfully.');
    } else {
      showToast('error', 'Save Failed', result?.message ?? 'Could not update profile.');
    }
  } catch (err) {
    console.error('[handleSaveProfile]', err);
    showToast('error', 'Error', 'An unexpected error occurred.');
  } finally {
    setButtonLoading(btn, false);
  }
}

async function handleSaveGoals() {
  const calories = parseInt(document.getElementById('goal-calories')?.value ?? '0', 10);
  const protein = parseInt(document.getElementById('goal-protein')?.value ?? '0', 10);
  const carbs = parseInt(document.getElementById('goal-carbs')?.value ?? '0', 10);
  const fat = parseInt(document.getElementById('goal-fat')?.value ?? '0', 10);

  if (isNaN(calories) || calories < 500) {
    showToast('error', 'Invalid Calories', 'Calories must be at least 500 kcal.');
    return;
  }

  const btn = document.getElementById('save-goals-btn');
  setButtonLoading(btn, true);

  try {
    const result = await updateNutritionGoals({ calories, protein, carbs, fat });
    if (result && result.success) {
      AppState.nutritionGoals = { calories, protein, carbs, fat };
      renderNutritionProgress(AppState.nutritionToday, AppState.nutritionGoals);
      showToast('success', 'Goals Updated', 'Your daily nutrition goals have been saved.');
    } else {
      showToast('error', 'Update Failed', result?.message ?? 'Could not save goals.');
    }
  } catch (err) {
    console.error('[handleSaveGoals]', err);
    showToast('error', 'Error', 'An unexpected error occurred.');
  } finally {
    setButtonLoading(btn, false);
  }
}

/**
 * handleAvatarUpload — Upload a new profile photo from the profile view.
 * Validates client-side, sends via FormData to Upload.php (action=upload_avatar),
 * then updates the avatar element in-place without a page reload.
 * @param {File} file
 */
async function handleAvatarUpload(file) {
  // ── Client-side validation ──────────────────────────────
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5 MB

  if (!allowedTypes.includes(file.type)) {
    showToast('error', 'Invalid File Type', 'Only JPG, PNG, and WEBP images are accepted for avatars.');
    return;
  }
  if (file.size > maxSize) {
    showToast('error', 'File Too Large', 'Profile photo must be under 5 MB.');
    return;
  }

  // Show instant local preview while uploading
  const avEl = document.getElementById('profile-avatar');
  const statusEl = document.getElementById('avatar-upload-status');
  const changeBtn = document.getElementById('avatar-change-btn');
  const fileInput = document.getElementById('profile-avatar-input');

  if (statusEl) statusEl.textContent = 'Uploading…';
  if (changeBtn) changeBtn.disabled = true;

  // Show local preview immediately (FileReader)
  const reader = new FileReader();
  reader.onload = (e) => {
    if (avEl) avEl.innerHTML = `<img src="${e.target.result}" alt="Avatar preview"
      style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  };
  reader.readAsDataURL(file);

  try {
    const result = await uploadAvatar(file);
    if (result && result.success) {
      // Replace temporary blob preview with the server-stored path
      if (avEl && result.avatar_path) {
        avEl.innerHTML = `<img src="${sanitizeOutput(result.avatar_path)}" alt="Avatar"
          style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      }
      if (statusEl) statusEl.textContent = '';
      showToast('success', 'Photo Updated', 'Your profile photo has been saved.');
    } else {
      // Revert to initials on failure
      if (avEl) avEl.textContent = avEl.dataset.initial ?? 'U';
      if (statusEl) statusEl.textContent = '';
      showToast('error', 'Upload Failed', result?.message ?? 'Could not save profile photo.');
    }
  } catch (err) {
    console.error('[handleAvatarUpload]', err);
    if (avEl) avEl.textContent = avEl.dataset.initial ?? 'U';
    if (statusEl) statusEl.textContent = '';
    showToast('error', 'Error', 'An unexpected error occurred during upload.');
  } finally {
    if (changeBtn) changeBtn.disabled = false;
    // Reset file input so the same file can be re-selected if needed
    if (fileInput) fileInput.value = '';
  }
}


/* ============================================================
   10b. THEME MANAGEMENT
============================================================ */

function loadSavedTheme() {
  const saved = localStorage.getItem('ingredio_theme') || 'fresh';
  applyTheme(saved);
}

function applyTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);

  // Smooth transition logic could be handled via global CSS which we added.
  // If 'custom' is selected, we restore saved custom colors:
  if (themeName === 'custom') {
    const customColors = JSON.parse(localStorage.getItem('ingredio_custom_colors')) || {
      primary: '#8BCF3F', secondary: '#FF7A00', bg: '#FFFDF8', card: '#FFFFFF', text: '#1F2937'
    };
    document.documentElement.style.setProperty('--primary-color', customColors.primary);
    document.documentElement.style.setProperty('--secondary-color', customColors.secondary);
    document.documentElement.style.setProperty('--background-color', customColors.bg);
    document.documentElement.style.setProperty('--card-bg', customColors.card);
    document.documentElement.style.setProperty('--text-color', customColors.text);
  } else {
    // Clear inline styles to let the class variables take over
    ['--primary-color', '--secondary-color', '--background-color', '--card-bg', '--text-color'].forEach(prop => {
      document.documentElement.style.removeProperty(prop);
    });
  }
  saveTheme(themeName);
}

function saveTheme(themeName) {
  localStorage.setItem('ingredio_theme', themeName);
}

function renderThemeSelector() {
  const container = document.getElementById('theme-selector-container');
  if (!container) return;

  const currentTheme = localStorage.getItem('ingredio_theme') || 'fresh';
  const themes = [
    { id: 'light', name: 'Light Profile', p: '#FF7A00', b: '#FFF8F0' },
    { id: 'dark', name: 'Dark Performance', p: '#F97316', b: '#111827' },
    { id: 'fresh', name: 'Fresh Default', p: '#8BCF3F', b: '#FFFDF8' },
    { id: 'gym', name: 'Gym Focused', p: '#2563EB', b: '#F8FAFC' },
    { id: 'warm', name: 'Warm Food', p: '#DC2626', b: '#FFF7ED' },
    { id: 'custom', name: 'Custom Palette', p: 'linear-gradient(45deg, red, blue)', b: '#eee' },
  ];

  let html = '<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">';
  themes.forEach(t => {
    const isActive = currentTheme === t.id;
    html += '<label class="theme-option" style="display:flex;align-items:center;cursor:pointer;padding:8px 12px;border-radius:8px;border:2px solid ' + (isActive ? 'var(--primary-color)' : 'var(--color-gray-dark)') + ';background:' + (isActive ? 'var(--color-gray)' : 'transparent') + ';transition:all 0.2s ease;">' +
      '<input type="radio" name="theme_choice" value="' + t.id + '" ' + (isActive ? 'checked' : '') + ' style="margin-right:12px;">' +
      '<span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:' + t.p + ';margin-right:12px;border:1px solid rgba(0,0,0,0.1);"></span>' +
      '<span style="font-weight:500;">' + t.name + '</span>' +
      '</label>';
  });
  html += '</div>';

  // Only show color pickers if custom is selected
  if (currentTheme === 'custom') {
    const customColors = JSON.parse(localStorage.getItem('ingredio_custom_colors')) || {
      primary: '#8BCF3F', secondary: '#FF7A00', bg: '#ffffff', card: '#ffffff', text: '#333333'
    };
    html += '<div style="padding:16px;background:var(--color-gray);border-radius:12px;display:flex;flex-direction:column;gap:12px;">' +
      '<h5 style="margin-bottom:4px;">Customize Colors</h5>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;"><label>Primary</label> <input type="color" id="custom-primary" value="' + customColors.primary + '"></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;"><label>Secondary</label> <input type="color" id="custom-secondary" value="' + customColors.secondary + '"></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;"><label>Background</label> <input type="color" id="custom-bg" value="' + customColors.bg + '"></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;"><label>Card</label> <input type="color" id="custom-card" value="' + customColors.card + '"></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;"><label>Text</label> <input type="color" id="custom-text" value="' + customColors.text + '"></div>' +
      '</div>';
  }

  container.innerHTML = html;

  // Bind event listeners for the radio buttons
  container.querySelectorAll('input[name="theme_choice"]').forEach(radio => {
    radio.addEventListener('change', (e) => handleThemeChange(e.target.value));
  });

  // Bind color pickers
  if (currentTheme === 'custom') {
    const inputs = ['primary', 'secondary', 'bg', 'card', 'text'];
    inputs.forEach(key => {
      const el = document.getElementById('custom-' + key);
      if (el) {
        el.addEventListener('input', () => {
          const colors = {
            primary: document.getElementById('custom-primary').value,
            secondary: document.getElementById('custom-secondary').value,
            bg: document.getElementById('custom-bg').value,
            card: document.getElementById('custom-card').value,
            text: document.getElementById('custom-text').value
          };
          localStorage.setItem('ingredio_custom_colors', JSON.stringify(colors));
          applyTheme('custom');
        });
      }
    });
  }
}

function handleThemeChange(themeName) {
  applyTheme(themeName);
  renderThemeSelector();
  showToast('success', 'Theme Updated', 'Your appearance preferences have been saved.');
}


/* ============================================================
   11. UI UTILITIES
============================================================ */

/**
 * showLoader — Show the global loading overlay.
 */
function showLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) { loader.classList.add('active'); loader.removeAttribute('aria-hidden'); }
}

/**
 * hideLoader — Hide the global loading overlay.
 */
function hideLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) { loader.classList.remove('active'); loader.setAttribute('aria-hidden', 'true'); }
}

/**
 * showToast — Display a floating notification toast.
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {string} title
 * @param {string} message
 * @param {number} duration  - ms before auto-dismiss (default 4500)
 */
function showToast(type, title, message, duration = 4500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  };
  const icon = icons[type] ?? icons.info;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <div class="toast-body">
      <p class="toast-title">${sanitizeOutput(title)}</p>
      <p class="toast-msg">${sanitizeOutput(message)}</p>
    </div>
    <button class="toast-close" aria-label="Dismiss notification">&times;</button>`;

  container.appendChild(toast);

  // Close button
  toast.querySelector('.toast-close')?.addEventListener('click', () => dismissToast(toast));

  // Auto-dismiss
  const timer = setTimeout(() => dismissToast(toast), duration);
  toast._dismissTimer = timer;
}

function dismissToast(toast) {
  if (!toast || toast._dismissed) return;
  toast._dismissed = true;
  clearTimeout(toast._dismissTimer);
  toast.classList.add('hiding');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

/**
 * openModal — Display the global modal with provided HTML.
 * @param {string} html - Inner HTML for the modal (sanitize before use in data attrs)
 */
function openModal(html) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  if (!overlay || !content) return;
  content.innerHTML = html;
  overlay.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';

  // Focus the first interactive element
  setTimeout(() => {
    const firstInput = overlay.querySelector('input, select, textarea, button:not(.modal-close)');
    firstInput?.focus();
  }, 100);
}

/**
 * closeModal — Hide the global modal.
 */
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  if (!overlay) return;
  overlay.setAttribute('hidden', '');
  document.body.style.overflow = '';
  if (content) content.innerHTML = '';
}

/**
 * sanitizeOutput — Escape HTML to prevent XSS when building dynamic content.
 * Mirrors PHP's htmlspecialchars() on the JS side.
 * @param {string} str
 * @returns {string}
 */
function sanitizeOutput(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/* ============================================================
   12. HELPER UTILITIES
============================================================ */

function markActiveNavLink(view) {
  document.querySelectorAll('[data-view]').forEach(el => el.classList.remove('active'));
  document.querySelectorAll(`[data-view="${view}"]`).forEach(el => el.classList.add('active'));
}

function toggleMobileDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  const hamburger = document.getElementById('hamburger-btn');
  const isOpen = drawer?.classList.contains('open');

  if (drawer) {
    drawer.classList.toggle('open', !isOpen);
    drawer.setAttribute('aria-hidden', String(isOpen));
  }
  if (hamburger) {
    hamburger.classList.toggle('open', !isOpen);
    hamburger.setAttribute('aria-expanded', String(!isOpen));
  }
}

function closeMobileDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  const hamburger = document.getElementById('hamburger-btn');
  if (drawer) { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
  if (hamburger) { hamburger.classList.remove('open'); hamburger.setAttribute('aria-expanded', 'false'); }
}

function setButtonLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn._originalText = btn.innerHTML;
    btn.innerHTML = '<span style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:white;border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle;margin-right:6px;"></span>Loading…';
    btn.disabled = true;
  } else {
    if (btn._originalText) btn.innerHTML = btn._originalText;
    btn.disabled = false;
  }
}

function showFieldError(inputId, errorId, msg) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.add('error');
  if (error) { error.textContent = msg; error.style.display = 'block'; }
}

function clearFieldError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.remove('error');
  if (error) { error.textContent = ''; error.style.display = 'none'; }
}

function showEl(el, text) {
  if (!el) return;
  if (text !== undefined) el.textContent = text;
  el.style.display = 'block';
}

function hideEl(el) {
  if (!el) return;
  el.style.display = 'none';
}

function setInnerText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getCategoryIcon(category) {
  const icons = {
    produce: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12A10 10 0 0 1 12 2z"/><path d="M12 2c0 5.52-2 9-5 11"/><path d="M12 2c0 5.52 2 9 5 11"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
    dairy: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2h8l1 6H7L8 2z"/><path d="M7 8l-2 13h14L17 8"/></svg>',
    protein: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
    grains: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20"/><path d="M6 20V10l6-8 6 8v10"/><path d="M6 14h12"/></svg>',
    spices: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 8v4l3 3"/></svg>',
    beverages: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>',
    other: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  };
  return icons[category] ?? icons.other;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const expiry = new Date(dateStr);
  const now = new Date();
  const diffMs = expiry - now;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}




/* ============================================================
   13. AUTHENTICATION VIEWS
============================================================ */

/** Shared SVG icons for auth UI */
const AUTH_ICONS = {
  eye: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
  user: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  camera: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
};

/** Brand panel HTML shared between login and register */
function renderAuthBrandPanel() {
  return `
    <div class="auth-brand-panel">
        <div class="auth-brand-inner">
            <div class="auth-brand-logo">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9-4.03-9-9s-4.03 9-9 9 4.03 9 9 9z"/><path d="M12 22c-4.97 0-9-4.03-9-9 4.97 0 9-4.03 9-9s4.03 9 9 9-4.03 9-9 9z"/></svg>
            </div>
            <h1 class="auth-brand-title">Ingredio</h1>
            <p class="auth-brand-tagline">Your smart kitchen intelligence platform</p>
            <ul class="auth-feature-list">
                <li><span class="auth-feature-icon">${AUTH_ICONS.check}</span>Track pantry &amp; reduce food waste</li>
                <li><span class="auth-feature-icon">${AUTH_ICONS.check}</span>Discover recipes from your ingredients</li>
                <li><span class="auth-feature-icon">${AUTH_ICONS.check}</span>Monitor your daily nutrition goals</li>
                <li><span class="auth-feature-icon">${AUTH_ICONS.check}</span>Log meals with photos &amp; notes</li>
            </ul>
        </div>
    </div>`;
}

/**
 * renderLogin — Returns HTML for the Login view.
 */
function renderLogin() {
  return `
    <div class="auth-wrapper view-enter">
        ${renderAuthBrandPanel()}
        <div class="auth-form-panel">
            <div class="auth-card">
                <div class="auth-card-header">
                    <h2 class="auth-card-title">Welcome back</h2>
                    <p class="auth-card-sub">Sign in to your Ingredio account</p>
                </div>

                <div id="login-error-banner" class="auth-error-banner" style="display:none;" role="alert" aria-live="polite"></div>

                <form id="login-form" novalidate autocomplete="on">
                    <!-- Email -->
                    <div class="floating-group">
                        <input type="email" id="login-email" class="floating-input" placeholder=" " autocomplete="email" aria-required="true" aria-describedby="login-email-error">
                        <label class="floating-label" for="login-email">Email Address</label>
                        <span class="field-error" id="login-email-error" role="alert"></span>
                    </div>

                    <!-- Password with show/hide -->
                    <div class="floating-group password-group">
                        <input type="password" id="login-password" class="floating-input" placeholder=" " autocomplete="current-password" aria-required="true" aria-describedby="login-password-error">
                        <label class="floating-label" for="login-password">Password</label>
                        <button type="button" class="show-password-btn" id="login-show-pw" aria-label="Toggle password visibility">${AUTH_ICONS.eye}</button>
                        <span class="field-error" id="login-password-error" role="alert"></span>
                    </div>

                    <!-- Remember me + Forgot -->
                    <div class="auth-options-row">
                        <label class="checkbox-label">
                            <input type="checkbox" id="login-remember" autocomplete="off">
                            <span class="checkbox-custom" aria-hidden="true"></span>
                            Remember me
                        </label>
                        <button type="button" class="auth-link-btn" id="forgot-password-btn">Forgot password?</button>
                    </div>

                    <button type="submit" class="btn btn-primary btn-auth" id="login-submit-btn">Sign In</button>
                </form>

                <p class="auth-footer-text">
                    Don&rsquo;t have an account?
                    <button type="button" class="auth-link-btn auth-link-accent" data-view="signup">Create one free</button>
                </p>
            </div>
        </div>
    </div>`;
}

/**
 * renderRegister — Returns HTML for the Register view.
 */
function renderRegister() {
  return `
    <div class="auth-wrapper view-enter">
        ${renderAuthBrandPanel()}
        <div class="auth-form-panel">
            <div class="auth-card auth-card-register">
                <div class="auth-card-header">
                    <h2 class="auth-card-title">Create account</h2>
                    <p class="auth-card-sub">Join Ingredio — it&rsquo;s free</p>
                </div>

                <div id="register-error-banner" class="auth-error-banner" style="display:none;" role="alert" aria-live="polite"></div>

                <form id="register-form" novalidate autocomplete="off">
                    <!-- Avatar upload -->
                    <div class="avatar-upload-group">
                        <button type="button" class="avatar-preview-btn" id="avatar-preview-btn" aria-label="Upload profile photo">
                            <span id="avatar-placeholder">${AUTH_ICONS.user}</span>
                            <img id="avatar-img-preview" src="" alt="Profile preview" style="display:none;">
                            <span class="avatar-camera-badge">${AUTH_ICONS.camera}</span>
                        </button>
                        <input type="file" id="avatar-file-input" accept="image/jpeg,image/png,image/webp" style="display:none;" aria-label="Profile photo">
                        <span class="avatar-upload-hint">Profile photo (optional)</span>
                    </div>

                    <!-- Full name + Username row -->
                    <div class="form-row">
                        <div class="floating-group">
                            <input type="text" id="reg-fullname" class="floating-input" placeholder=" " maxlength="80" aria-required="true" aria-describedby="reg-fullname-error">
                            <label class="floating-label" for="reg-fullname">Full Name</label>
                            <span class="field-error" id="reg-fullname-error" role="alert"></span>
                        </div>
                        <div class="floating-group">
                            <input type="text" id="reg-username" class="floating-input" placeholder=" " maxlength="30" aria-required="true" aria-describedby="reg-username-error">
                            <label class="floating-label" for="reg-username">Username</label>
                            <span class="field-error" id="reg-username-error" role="alert"></span>
                        </div>
                    </div>

                    <!-- Email -->
                    <div class="floating-group">
                        <input type="email" id="reg-email" class="floating-input" placeholder=" " autocomplete="email" aria-required="true" aria-describedby="reg-email-error">
                        <label class="floating-label" for="reg-email">Email Address</label>
                        <span class="field-error" id="reg-email-error" role="alert"></span>
                    </div>

                    <!-- Password -->
                    <div class="floating-group password-group">
                        <input type="password" id="reg-password" class="floating-input" placeholder=" " autocomplete="new-password" aria-required="true" aria-describedby="reg-password-error">
                        <label class="floating-label" for="reg-password">Password</label>
                        <button type="button" class="show-password-btn" id="reg-show-pw" aria-label="Toggle password visibility">${AUTH_ICONS.eye}</button>
                        <span class="field-error" id="reg-password-error" role="alert"></span>
                    </div>
                    <!-- Strength meter -->
                    <div class="password-strength-wrap" id="password-strength-wrap" style="display:none;">
                        <div class="strength-bars">
                            <span class="strength-bar" id="sb1"></span>
                            <span class="strength-bar" id="sb2"></span>
                            <span class="strength-bar" id="sb3"></span>
                            <span class="strength-bar" id="sb4"></span>
                        </div>
                        <span class="strength-label" id="strength-label">Too weak</span>
                    </div>

                    <!-- Confirm Password -->
                    <div class="floating-group password-group">
                        <input type="password" id="reg-confirm-pw" class="floating-input" placeholder=" " autocomplete="new-password" aria-required="true" aria-describedby="reg-confirm-pw-error">
                        <label class="floating-label" for="reg-confirm-pw">Confirm Password</label>
                        <button type="button" class="show-password-btn" id="reg-show-confirm-pw" aria-label="Toggle confirm password visibility">${AUTH_ICONS.eye}</button>
                        <span class="field-error" id="reg-confirm-pw-error" role="alert"></span>
                    </div>

                    <button type="submit" class="btn btn-primary btn-auth" id="register-submit-btn">Create Account</button>
                </form>

                <p class="auth-footer-text">
                    Already have an account?
                    <button type="button" class="auth-link-btn auth-link-accent" data-view="login">Sign in</button>
                </p>
            </div>
        </div>
    </div>`;
}


/* ============================================================
   14. AUTH HANDLERS
============================================================ */

/**
 * handleLogin — Validate and submit login form via Fetch.
 * @param {Event} e
 */
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('login-email')?.value.trim() ?? '';
  const password = document.getElementById('login-password')?.value ?? '';
  const banner = document.getElementById('login-error-banner');

  // Clear previous errors
  hideEl(banner);
  clearFieldError('login-email', 'login-email-error');
  clearFieldError('login-password', 'login-password-error');

  // Client-side validation
  let valid = true;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError('login-email', 'login-email-error', 'Enter a valid email address.');
    valid = false;
  }
  if (!password) {
    showFieldError('login-password', 'login-password-error', 'Password is required.');
    valid = false;
  }
  if (!valid) return;

  const btn = document.getElementById('login-submit-btn');
  setButtonLoading(btn, true);

  try {
    const result = await loginUser(email, password);
    if (result && result.success) {
      showToast('success', 'Welcome back!', 'You have signed in successfully.');
      setTimeout(() => window.location.reload(), 1200);
    } else {
      showEl(banner, result?.message ?? 'Invalid email or password. Please try again.');
    }
  } catch (err) {
    console.error('[handleLogin]', err);
    showEl(banner, 'Connection error. Please check your connection and try again.');
  } finally {
    setButtonLoading(btn, false);
  }
}

/**
 * handleRegister — Validate and submit registration form via Fetch.
 * @param {Event} e
 */
async function handleRegister(e) {
  e.preventDefault();

  const fullname = document.getElementById('reg-fullname')?.value.trim() ?? '';
  const username = document.getElementById('reg-username')?.value.trim() ?? '';
  const email = document.getElementById('reg-email')?.value.trim() ?? '';
  const password = document.getElementById('reg-password')?.value ?? '';
  const confirmPw = document.getElementById('reg-confirm-pw')?.value ?? '';
  const banner = document.getElementById('register-error-banner');

  hideEl(banner);
  ['reg-fullname', 'reg-username', 'reg-email', 'reg-password', 'reg-confirm-pw'].forEach(id =>
    clearFieldError(id, id + '-error'));

  // Validation
  let valid = true;
  if (!fullname || fullname.length < 3) {
    showFieldError('reg-fullname', 'reg-fullname-error', 'Full name must be at least 3 characters.');
    valid = false;
  }
  if (!username || !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    showFieldError('reg-username', 'reg-username-error', 'Username: 3-30 characters, letters, numbers, underscores only.');
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError('reg-email', 'reg-email-error', 'Enter a valid email address.');
    valid = false;
  }
  if (!password || calcPasswordStrength(password) < 2) {
    showFieldError('reg-password', 'reg-password-error', 'Password is too weak. Include uppercase, numbers, and symbols.');
    valid = false;
  }
  if (password !== confirmPw) {
    showFieldError('reg-confirm-pw', 'reg-confirm-pw-error', 'Passwords do not match.');
    valid = false;
  }
  if (!valid) return;

  const btn = document.getElementById('register-submit-btn');
  setButtonLoading(btn, true);

  try {
    // Optional: upload avatar first if selected
    let avatarPath = '';
    const avatarFile = document.getElementById('avatar-file-input')?.files?.[0];
    if (avatarFile) {
      const uploadResult = await uploadMealImage({ file: avatarFile, mealName: username, notes: '', calories: '', date: '' });
      if (uploadResult?.success) avatarPath = uploadResult.image_path ?? '';
    }

    const result = await registerUser({ fullname, username, email, password, avatar: avatarPath });
    if (result && result.success) {
      showToast('success', 'Account Created!', 'Welcome to Ingredio. Please sign in.');
      await sleep(1200);
      AppState.currentView = null;
      loadView('login');
    } else {
      showEl(banner, result?.message ?? 'Registration failed. Please try again.');
    }
  } catch (err) {
    console.error('[handleRegister]', err);
    showEl(banner, 'Connection error. Please try again.');
  } finally {
    setButtonLoading(btn, false);
  }
}

/**
 * togglePasswordVisibility — Switch input type between password and text.
 * @param {string} inputId
 * @param {string} btnId
 */
function togglePasswordVisibility(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (!input || !btn) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.innerHTML = isHidden ? AUTH_ICONS.eyeOff : AUTH_ICONS.eye;
  btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
}

/**
 * calcPasswordStrength — Score password 0–4.
 * @param {string} pw
 * @returns {number}
 */
function calcPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

/**
 * updatePasswordStrength — Update the strength meter UI.
 */
function updatePasswordStrength() {
  const pw = document.getElementById('reg-password')?.value ?? '';
  const wrap = document.getElementById('password-strength-wrap');
  const label = document.getElementById('strength-label');
  if (!wrap) return;

  if (!pw) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';

  const score = calcPasswordStrength(pw);
  const levels = [
    { text: 'Too weak', cls: 'strength-weak' },
    { text: 'Fair', cls: 'strength-fair' },
    { text: 'Good', cls: 'strength-good' },
    { text: 'Strong', cls: 'strength-strong' },
    { text: 'Very strong', cls: 'strength-strong' },
  ];
  const barClasses = ['', 'strength-weak', 'strength-fair', 'strength-good', 'strength-strong'];

  [1, 2, 3, 4].forEach(i => {
    const bar = document.getElementById('sb' + i);
    if (bar) bar.className = 'strength-bar' + (score >= i ? ' ' + barClasses[score] : '');
  });
  if (label) { label.textContent = levels[score]?.text ?? ''; label.className = 'strength-label ' + (levels[score]?.cls ?? ''); }
}

/**
 * validatePasswordMatch — Show inline error if passwords differ.
 */
function validatePasswordMatch() {
  const pw = document.getElementById('reg-password')?.value ?? '';
  const cpw = document.getElementById('reg-confirm-pw')?.value ?? '';
  if (!cpw) return;
  if (pw !== cpw) {
    showFieldError('reg-confirm-pw', 'reg-confirm-pw-error', 'Passwords do not match.');
  } else {
    clearFieldError('reg-confirm-pw', 'reg-confirm-pw-error');
  }
}

/**
 * handleAvatarPreview — Show a circular preview of the selected profile photo.
 * @param {Event} e
 */
function handleAvatarPreview(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    showToast('error', 'Invalid File', 'Only JPG, PNG, and WEBP images are accepted.');
    e.target.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('error', 'File Too Large', 'Profile photo must be under 5 MB.');
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = document.getElementById('avatar-img-preview');
    const ph = document.getElementById('avatar-placeholder');
    if (img) { img.src = ev.target.result; img.style.display = 'block'; }
    if (ph) { ph.style.display = 'none'; }
  };
  reader.readAsDataURL(file);
}


/* ============================================================
   15. BOOTSTRAP
============================================================ */

document.addEventListener('DOMContentLoaded', initApp);
