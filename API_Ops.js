/**
 * ============================================================
 * Ingredio — API_Ops.js
 * Backend Communication Layer
 *
 * All external API calls are PROXIED through PHP backend files.
 * API keys are NEVER exposed in JavaScript.
 *
 * PHP backend files expected:
 *   DB_Ops.php   — MySQL CRUD via PDO / Prepared Statements
 *   API_Ops.php  — Proxy for Spoonacular (or other) recipe API
 *   Upload.php   — Handles file uploads with server-side validation
 *
 * Conventions:
 *   - All functions are async
 *   - All functions return parsed JSON or null on failure
 *   - Errors are thrown so callers can catch and show toasts
 * ============================================================
 */

'use strict';

/* ============================================================
   CONFIGURATION
   Base endpoint paths — adjust if your PHP files live in
   a subdirectory.
============================================================ */

const ENDPOINTS = {
    DB: 'DB_Ops.php',
    API: 'API_Ops.php',
    UPLOAD: 'Upload.php',
};

/* ============================================================
   CORE FETCH WRAPPER
============================================================ */

/**
 * apiFetch — Generic wrapper around the Fetch API.
 * Sends a POST request with JSON body, returns parsed response.
 *
 * @param {string} endpoint  - One of ENDPOINTS.*
 * @param {Object} payload   - Request body (serialized to JSON)
 * @returns {Promise<Object>} Parsed JSON response
 * @throws Error on network failure or non-OK HTTP status
 */
async function apiFetch(endpoint, payload = {}) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} — ${endpoint}`);
    }

    const data = await response.json();
    return data;
}

/**
 * apiFetchForm — Sends a multipart/form-data POST (for file uploads).
 * Does NOT set Content-Type header; let the browser handle boundary.
 *
 * @param {string}   endpoint - ENDPOINTS.UPLOAD
 * @param {FormData} formData
 * @returns {Promise<Object>} Parsed JSON response
 * @throws Error on network failure or non-OK HTTP status
 */
async function apiFetchForm(endpoint, formData) {
    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        // No Content-Type: browser sets multipart/form-data with boundary
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} — ${endpoint}`);
    }

    const data = await response.json();
    return data;
}


/* ============================================================
   AUTHENTICATION
   Endpoints: DB_Ops.php?action=login | logout
============================================================ */

/**
 * loginUser — Authenticate a user.
 * PHP side: validates credentials via PDO prepared statement.
 * NEVER passes plain password in URL params.
 *
 * @param {string} email
 * @param {string} password  - Sent over POST body only (HTTPS required in production)
 * @returns {Promise<{success: boolean, user?: Object, message?: string}>}
 */
async function loginUser(email, password) {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'login',
        email: email,
        password: password, // Hashed server-side with password_hash() / password_verify()
    });
}

/**
 * logoutUser — Destroy the server-side session.
 * @returns {Promise<{success: boolean}>}
 */
async function logoutUser() {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'logout',
    });
}

/**
 * registerUser — Create a new user account.
 * All data is sent over POST body. Password is hashed server-side.
 *
 * @param {Object} data
 * @param {string} data.fullname
 * @param {string} data.username
 * @param {string} data.email
 * @param {string} data.password   - Plain text; PHP hashes with password_hash()
 * @param {string} [data.avatar]   - Path from Upload.php (optional)
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function registerUser({ fullname, username, email, password, avatar = '' }) {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'register',
        fullname: fullname,
        username: username,
        email: email,
        password: password,
        avatar: avatar,
    });
}


/**
 * fetchUserInfo — Retrieve the logged-in user's profile data.
 * @returns {Promise<{success: boolean, name, username, email, avatar_path}>}
 */
async function fetchUserInfo() {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'get_user_info',
    });
}

/**
 * updateProfile — Persist profile changes (name, email, optional password).
 * Password is only sent if the user typed a new one; server skips update if blank.
 *
 * @param {Object} data - { name: string, email: string, password?: string }
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function updateProfile({ name, email, password = '' }) {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'update_profile',
        name: name,
        email: email,
        password: password,
    });
}


/* ============================================================
   DASHBOARD
   Endpoint: DB_Ops.php?action=get_dashboard
============================================================ */

/**
 * fetchDashboard — Fetch aggregated stats for the Dashboard.
 * Returns pantry count, expiring items, today's nutrition totals, and log count.
 *
 * @returns {Promise<{
 *   pantry_count:    number,
 *   expiring_soon:   number,
 *   log_count:       number,
 *   calories_today:  number,
 *   nutrition_today: {calories, protein, carbs, fat},
 *   expiring_items:  Array<{name, days_left}>
 * }>}
 */
async function fetchDashboard() {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'get_dashboard',
    });
}


/* ============================================================
   PANTRY — CRUD
   Endpoint: DB_Ops.php
   
   PHP (DB_Ops.php) must use:
     PDO with prepared statements — NEVER raw SQL concatenation.
   
   Example PHP pattern:
     $stmt = $pdo->prepare("SELECT * FROM ingredients WHERE user_id = ?");
     $stmt->execute([$user_id]);
============================================================ */

/**
 * fetchPantry — Read all ingredients for the current user.
 * @returns {Promise<Array<Ingredient>>}
 */
async function fetchPantry() {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'get_pantry',
    });
}

/**
 * addIngredient — Create a new ingredient record (INSERT).
 * @param {Object} ingredient - { name, quantity, unit, category, expiry_date, notes }
 * @returns {Promise<{success: boolean, id?: number, message?: string}>}
 */
async function addIngredient(ingredient) {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'add_ingredient',
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        category: ingredient.category,
        expiry_date: ingredient.expiry_date,
        notes: ingredient.notes ?? '',
    });
}

/**
 * updateIngredient — Update an existing ingredient (UPDATE).
 * @param {Object} ingredient - { id, name, quantity, unit, category, expiry_date }
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function updateIngredient(ingredient) {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'update_ingredient',
        id: ingredient.id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        category: ingredient.category,
        expiry_date: ingredient.expiry_date,
    });
}

/**
 * deleteIngredient — Remove an ingredient from the pantry (DELETE).
 * @param {number|string} id - Ingredient ID
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function deleteIngredient(id) {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'delete_ingredient',
        id: id,
    });
}


/* ============================================================
   RECIPE SEARCH
   Endpoint: API_Ops.php
   
   SECURITY RULE:
     The Spoonacular API key is stored ONLY in API_Ops.php.
     JavaScript never touches the API key directly.
     All recipe API requests are proxied through API_Ops.php.
   
   PHP (API_Ops.php) pattern:
     define('SPOONACULAR_API_KEY', 'YOUR_KEY_HERE'); // server-side only
     $url = "https://api.spoonacular.com/recipes/findByIngredients?..."
             . "&apiKey=" . SPOONACULAR_API_KEY;
     $response = file_get_contents($url) or curl_exec($ch);
============================================================ */

/**
 * searchRecipes — Find recipes by available ingredients or name.
 * Sends request to API_Ops.php which proxies to Spoonacular.
 *
 * @param {string} query - Comma-separated ingredient names or meal name
 * @param {string} searchType - 'ingredients' or 'name'
 * @param {number} number - Max results (default 12)
 * @returns {Promise<Array<{
 *   id, title, image, readyInMinutes, servings,
 *   calories, protein, fat
 * }>>}
 */
async function searchRecipes(query, searchType = 'ingredients', number = 12) {
    return await apiFetch(ENDPOINTS.API, {
        action: 'search_recipes',
        query: query,
        search_type: searchType,
        number: number,
    });
}

/**
 * getRecipeDetails — Get full nutritional details for a single recipe.
 * Validates recipeId client-side before hitting the server.
 *
 * @param {number} recipeId - Spoonacular recipe ID (positive integer)
 * @returns {Promise<{
 *   success: boolean,
 *   id: number, title: string, image: string,
 *   readyInMinutes: number, servings: number, summary: string,
 *   extendedIngredients: Array<{id, name, amount, unit, image}>,
 *   analyzedInstructions: Array<{name, steps: Array<{number, step}>}>,
 *   nutrition: {calories, protein, carbs, fat}
 * }>}
 */
async function getRecipeDetails(recipeId) {
    const id = parseInt(recipeId, 10);
    if (!id || id <= 0) throw new Error('getRecipeDetails: recipeId must be a positive integer.');
    return await apiFetch(ENDPOINTS.API, {
        action: 'get_recipe_details',
        recipe_id: id,
    });
}


/**
 * saveRecipe — Persist a recipe to the user's saved_recipes table.
 * Handles the unique_user_recipe constraint gracefully (duplicate = not an error).
 *
 * @param {Object} recipe - Full recipe object from getRecipeDetails()
 * @returns {Promise<{success: boolean, message?: string, duplicate?: boolean}>}
 */
async function saveRecipe(recipe) {
    const id = parseInt(recipe.id, 10);
    if (!id || id <= 0) throw new Error('saveRecipe: invalid recipe id.');

    // Summarise long arrays into JSON strings for the VARCHAR columns
    const ingredientsSummary = (recipe.extendedIngredients ?? [])
        .map(i => `${i.amount} ${i.unit} ${i.name}`.trim())
        .join(', ')
        .substring(0, 198); // DB column is VARCHAR(200)

    const instructionsSummary = (recipe.analyzedInstructions ?? [])
        .flatMap(s => s.steps ?? [])
        .map(s => s.step)
        .join(' ')
        .substring(0, 198);

    const descriptionSummary = (recipe.summary ?? '').substring(0, 198);

    return await apiFetch(ENDPOINTS.DB, {
        action: 'save_recipe',
        api_id: id,
        title: recipe.title ?? '',
        image_url: recipe.image ?? '',
        description: descriptionSummary,
        ingredients: ingredientsSummary,
        instructions: instructionsSummary,
        calories: recipe.nutrition?.calories ?? 0,
        protein: recipe.nutrition?.protein ?? 0,
        carbs: recipe.nutrition?.carbs ?? 0,
        fat: recipe.nutrition?.fat ?? 0,
    });
}

/**
 * fetchSavedRecipes — Retrieve all recipes saved by the current user.
 * @returns {Promise<Array<{id, api_id, title, image_url, calories, protein, carbs, fat}>>}
 */
async function fetchSavedRecipes() {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'get_saved_recipes',
    });
}

/**
 * deleteSavedRecipe — Remove a recipe from the user's saved_recipes table.
 * @param {number|string} id - The internal saved_recipes database ID
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function deleteSavedRecipe(id) {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'delete_saved_recipe',
        id: id,
    });
}


/* ============================================================
   MEAL PHOTO UPLOAD
   Endpoint: Upload.php
   
   SECURITY RULES (enforced in Upload.php):
     1. Validate MIME type via finfo / mime_content_type()
     2. Validate file extension whitelist
     3. Validate file size (max 5 MB)
     4. Generate a unique filename (uniqid() + extension)
     5. Store file on server filesystem
     6. Store ONLY the relative file path in the database
     7. Never trust client-provided filenames
============================================================ */

/**
 * uploadMealImage — Upload a meal photo with metadata.
 * Uses FormData for multipart upload.
 *
 * @param {Object} mealData - { file: File, mealName, notes, calories, date }
 * @returns {Promise<{success: boolean, image_path?: string, log_id?: number, message?: string}>}
 */
async function uploadMealImage(mealData) {
    const formData = new FormData();

    // Append the file (PHP will validate type, size, extension)
    formData.append('meal_image', mealData.file);

    // Append metadata fields
    formData.append('action', 'upload_meal');
    formData.append('meal_name', mealData.mealName ?? '');
    formData.append('notes', mealData.notes ?? '');
    formData.append('calories', mealData.calories ?? 0);
    formData.append('protein', mealData.protein ?? 0);
    formData.append('carbs', mealData.carbs ?? 0);
    formData.append('fat', mealData.fat ?? 0);
    formData.append('log_date', mealData.date ?? '');

    return await apiFetchForm(ENDPOINTS.UPLOAD, formData);
}

/**
 * uploadAvatar — Upload a new profile photo for the logged-in user.
 * Sends the file as multipart/form-data to Upload.php with action=upload_avatar.
 * Upload.php will validate type, size, store the file, and update avatar_path in users table.
 *
 * @param {File} file - The image file selected by the user
 * @returns {Promise<{success: boolean, avatar_path?: string, message?: string}>}
 */
async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar_image', file);  // distinct field name from meal uploads
    formData.append('action', 'upload_avatar');
    return await apiFetchForm(ENDPOINTS.UPLOAD, formData);
}


/* ============================================================
   COOKING LOG
   Endpoint: DB_Ops.php
============================================================ */

/**
 * fetchCookingLog — Retrieve all meal log entries for the user.
 * @param {number} limit  - Max entries to return (default 20)
 * @returns {Promise<Array<{id, meal_name, image_path, notes, calories, logged_date}>>}
 */
async function fetchCookingLog(limit = 20) {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'get_cooking_log',
        limit: limit,
    });
}

/**
 * deleteLogEntry — Remove a meal log entry.
 * @param {number|string} id - Log entry ID
 * @returns {Promise<{success: boolean}>}
 */
async function deleteLogEntry(id) {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'delete_log_entry',
        id: id,
    });
}


/* ============================================================
   USER PROFILE
   Endpoint: DB_Ops.php
============================================================ */

/**
 * fetchUserInfo — Retrieve the logged-in user's profile data.
 * Calls the get_user_info action which reads name, email, and avatar_path
 * from the users table using a PDO prepared statement.
 *
 * @returns {Promise<{success: boolean, username: string, email: string, avatar_path: string}>}
 */
async function fetchUserInfo() {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'get_user_info',
    });
}

/**
 * updateProfile — Save changes to user profile.
 * @param {Object} data - { name, email, password? }
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function updateProfile(data) {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'update_profile',
        name: data.name,
        email: data.email,
        password: data.password ?? '', // Only passed if user wants to change it
    });
}

/**
 * updateNutritionGoals — Save user's daily nutrition targets.
 * @param {Object} goals - { calories, protein, carbs, fat }
 * @returns {Promise<{success: boolean}>}
 */
async function updateNutritionGoals(goals) {
    return await apiFetch(ENDPOINTS.DB, {
        action: 'update_nutrition_goals',
        calories: goals.calories,
        protein: goals.protein,
        carbs: goals.carbs,
        fat: goals.fat,
    });
}
