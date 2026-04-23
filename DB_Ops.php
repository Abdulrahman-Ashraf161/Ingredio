<?php
/**
 * Ingredio — DB_Ops.php
 * Database Operations Backend (PDO / MySQL)
 *
 * All actions accept JSON POST body.
 * All responses return JSON.
 * SECURITY: Uses PDO prepared statements exclusively.
 */

session_start();
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

// ── Database Configuration ───────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'ingredio');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// ── Read JSON body ───────────────────────────────────────────
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? '';

// ── Attempt DB connection (graceful fallback to demo mode) ───
$pdo = null;
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    // DB unavailable — demo mode returns plausible sample data
    $pdo = null;
}

// ── Route ────────────────────────────────────────────────────
switch ($action) {

    /* ── Authentication ── */
    case 'login':
        if (!$pdo) {
            demo_login($input);
            break;
        }
        $stmt = $pdo->prepare("SELECT id, name, password_hash FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([trim($input['email'] ?? '')]);
        $user = $stmt->fetch();
        if ($user && password_verify($input['password'] ?? '', $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            echo json_encode(['success' => true, 'user' => ['id' => $user['id'], 'name' => $user['name']]]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        }
        break;

    case 'register':
        if (!$pdo) {
            demo_register($input);
            break;
        }

        $fullname = substr(trim($input['fullname'] ?? ''), 0, 80);
        $username = substr(trim($input['username'] ?? ''), 0, 30);
        $email = substr(trim($input['email'] ?? ''), 0, 200);
        $password = $input['password'] ?? '';
        $avatar = substr($input['avatar'] ?? '', 0, 500);

        // Server-side input validation
        if (strlen($fullname) < 3) {
            echo json_encode(['success' => false, 'message' => 'Full name must be at least 3 characters.']);
            break;
        }
        if (!preg_match('/^[a-zA-Z0-9_]{3,30}$/', $username)) {
            echo json_encode(['success' => false, 'message' => 'Invalid username format.']);
            break;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
            break;
        }
        if (strlen($password) < 8) {
            echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters.']);
            break;
        }

        // Check for duplicate email or username
        $check = $pdo->prepare("SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1");
        $check->execute([$email, $username]);
        if ($check->fetch()) {
            echo json_encode(['success' => false, 'message' => 'That email or username is already registered.']);
            break;
        }

        // Hash password — never store plain text
        $hash = password_hash($password, PASSWORD_DEFAULT);

        $insert = $pdo->prepare(
            "INSERT INTO users (name, username, email, password_hash, avatar_path, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())"
        );
        $insert->execute([$fullname, $username, $email, $hash, $avatar]);

        $newId = (int) $pdo->lastInsertId();
        $_SESSION['user_id'] = $newId;
        $_SESSION['user_name'] = $fullname;

        echo json_encode(['success' => true, 'user' => ['id' => $newId, 'name' => $fullname]]);
        break;

    case 'logout':
        session_destroy();
        echo json_encode(['success' => true]);
        break;

    /* ── Dashboard ── */
    case 'get_dashboard':
        if (!$pdo) {
            demo_dashboard();
            break;
        }
        $uid = $_SESSION['user_id'] ?? 0;


        $dailyStmt = $pdo->prepare("
            SELECT 
                SUM(calories) as total_cal, 
                SUM(protein) as total_prot, 
                SUM(carbs) as total_carb, 
                SUM(fat) as total_fat 
            FROM cooking_log 
            WHERE user_id = ? AND logged_date = CURDATE()
        ");
        $dailyStmt->execute([$uid]);
        $totals = $dailyStmt->fetch();


        $counts = $pdo->prepare("SELECT COUNT(*) FROM ingredients WHERE user_id = ?");
        $counts->execute([$uid]);
        $pantry_count = $counts->fetchColumn();

        $expiring = $pdo->prepare("SELECT COUNT(*) FROM ingredients WHERE user_id = ? AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)");
        $expiring->execute([$uid]);
        $expiring_soon = $expiring->fetchColumn();

        $logC = $pdo->prepare("SELECT COUNT(*) FROM cooking_log WHERE user_id = ?");
        $logC->execute([$uid]);
        $log_count = $logC->fetchColumn();


        $goalsStmt = $pdo->prepare("SELECT calorie_goal, protein_goal, carbs_goal, fat_goal FROM users WHERE id = ? LIMIT 1");
        $goalsStmt->execute([$uid]);
        $goalsRow = $goalsStmt->fetch();

        echo json_encode([
            'success' => true,
            'pantry_count' => (int) $pantry_count,
            'expiring_soon' => (int) $expiring_soon,
            'log_count' => (int) $log_count,
            'calories_today' => (int) ($totals['total_cal'] ?? 0),
            'nutrition_today' => [
                'calories' => (int) ($totals['total_cal'] ?? 0),
                'protein' => (float) ($totals['total_prot'] ?? 0),
                'carbs' => (float) ($totals['total_carb'] ?? 0),
                'fat' => (float) ($totals['total_fat'] ?? 0)
            ],
            'nutrition_goals' => [
                'calories' => (int) ($goalsRow['calorie_goal'] ?? 2000),
                'protein' => (int) ($goalsRow['protein_goal'] ?? 150),
                'carbs' => (int) ($goalsRow['carbs_goal'] ?? 250),
                'fat' => (int) ($goalsRow['fat_goal'] ?? 65)
            ]
        ]);
        break;

    /* ── Pantry CRUD ── */
    case 'get_pantry':
        if (!$pdo) {
            demo_pantry();
            break;
        }
        $uid = $_SESSION['user_id'] ?? 0;
        $stmt = $pdo->prepare("SELECT id, name, quantity, unit, category, expiry_date, notes FROM ingredients WHERE user_id = ? ORDER BY name ASC");
        $stmt->execute([$uid]);
        echo json_encode($stmt->fetchAll());
        break;

    case 'add_ingredient':
        // Check for Demo Mode fallback
        if (!$pdo) {
            echo json_encode(['success' => true, 'id' => rand(100, 999)]);
            break;
        }

        // 1. SESSION VALIDATION: Explicitly check if the user is authenticated
        // Do not default to 0; instead, terminate the request if the ID is missing.
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401); // Set HTTP 401 Unauthorized status
            echo json_encode([
                'success' => false,
                'message' => 'Unauthorized: Please log in to add ingredients.'
            ]);
            break;
        }

        $uid = $_SESSION['user_id'];

        // 2. INPUT VALIDATION: Ensure required fields are not empty 
        $name = trim($input['name'] ?? '');
        $qty = (float) ($input['quantity'] ?? 0);

        if (empty($name) || $qty <= 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid input: Name and positive quantity are required.'
            ]);
            break;
        }

        // 3. DATABASE EXECUTION: Using Prepared Statements [cite: 23]
        try {
            $stmt = $pdo->prepare("INSERT INTO ingredients (user_id, name, quantity, unit, category, expiry_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");

            $expiry = !empty($input['expiry_date']) ? $input['expiry_date'] : null;

            $stmt->execute([
                $uid,
                substr($username, 0, 50),
                substr($name, 0, 100), // Enforce DB column length
                $qty,
                $input['unit'] ?? 'g',
                $input['category'] ?? 'other',
                $expiry,
                substr($input['notes'] ?? '', 0, 200),
            ]);

            echo json_encode([
                'success' => true,
                'id' => (int) $pdo->lastInsertId()
            ]);
        } catch (PDOException $e) {
            // Handle DB errors gracefully without crashing the SPA [cite: 47]
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Database error: Could not save the ingredient.'
            ]);
        }
        break;

    case 'update_ingredient':
        if (!$pdo) {
            echo json_encode(['success' => true]);
            break;
        }
        $uid = $_SESSION['user_id'] ?? 0;
        $stmt = $pdo->prepare("UPDATE ingredients SET name=?, quantity=?, unit=?, category=?, expiry_date=? WHERE id=? AND user_id=?");
        $expiry = !empty($input['expiry_date']) ? $input['expiry_date'] : null;
        $stmt->execute([
            substr(trim($input['name'] ?? ''), 0, 100),
            (float) ($input['quantity'] ?? 0),
            $input['unit'] ?? 'g',
            $input['category'] ?? '',
            $expiry,
            (int) ($input['id'] ?? 0),
            $uid,
        ]);
        echo json_encode(['success' => true]);
        break;

    case 'delete_ingredient':
        if (!$pdo) {
            echo json_encode(['success' => true]);
            break;
        }
        $uid = $_SESSION['user_id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM ingredients WHERE id = ? AND user_id = ?");
        $stmt->execute([(int) ($input['id'] ?? 0), $uid]);
        echo json_encode(['success' => true]);
        break;

    /* ── Cooking Log ── */
    case 'get_cooking_log':
        if (!$pdo) {
            demo_log();
            break;
        }
        $uid = $_SESSION['user_id'] ?? 0;
        $limit = min((int) ($input['limit'] ?? 20), 100);

        // تعديل الـ SELECT ليشمل الماكروز لضمان ظهورها في كروت الوجبات
        $stmt = $pdo->prepare("
            SELECT id, meal_name, image_path, notes, calories, protein, carbs, fat, logged_date 
            FROM cooking_log 
            WHERE user_id = ? 
            ORDER BY logged_date DESC LIMIT ?
        ");
        $stmt->execute([$uid, $limit]);
        echo json_encode($stmt->fetchAll());
        break;

    case 'delete_log_entry':
        if (!$pdo) {
            echo json_encode(['success' => true]);
            break;
        }
        $uid = $_SESSION['user_id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM cooking_log WHERE id = ? AND user_id = ?");
        $stmt->execute([(int) ($input['id'] ?? 0), $uid]);
        echo json_encode(['success' => true]);
        break;

    /* ── Profile ── */
    case 'get_user_info':
        if (!$pdo) {
            // Demo fallback — return placeholder data so the UI doesn't crash
            echo json_encode([
                'success'     => true,
                'name'        => $_SESSION['user_name'] ?? 'Demo User',
                'username'    => $_SESSION['user_name'] ?? 'demo',
                'email'       => $_SESSION['user_email'] ?? 'demo@example.com',
                'avatar_path' => '',
            ]);
            break;
        }
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
            break;
        }
        $uid = $_SESSION['user_id'];
        $stmt = $pdo->prepare(
            "SELECT name, username, email, avatar_path, calorie_goal, protein_goal, carbs_goal, fat_goal FROM users WHERE id = ? LIMIT 1"
        );
        $stmt->execute([$uid]);
        $row = $stmt->fetch();
        if (!$row) {
            echo json_encode(['success' => false, 'message' => 'User not found.']);
            break;
        }
        echo json_encode([
            'success'     => true,
            'name'        => $row['name'],
            'username'    => $row['username'],
            'email'       => $row['email'],
            'avatar_path' => $row['avatar_path'] ?? '',
            'nutrition_goals' => [
                'calories' => (int) ($row['calorie_goal'] ?? 2000),
                'protein' => (int) ($row['protein_goal'] ?? 150),
                'carbs' => (int) ($row['carbs_goal'] ?? 250),
                'fat' => (int) ($row['fat_goal'] ?? 65)
            ]
        ]);
        break;

    case 'update_profile':
        if (!$pdo) {
            echo json_encode(['success' => true]);
            break;
        }
        $uid = $_SESSION['user_id'] ?? 0;
        $name = substr(trim($input['name'] ?? ''), 0, 100);
        $email = substr(trim($input['email'] ?? ''), 0, 200);
        if (!empty($input['password']) && strlen($input['password']) >= 8) {
            $hash = password_hash($input['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET name=?, email=?, password_hash=? WHERE id=?");
            $stmt->execute([$name, $email, $hash, $uid]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET name=?, email=? WHERE id=?");
            $stmt->execute([$name, $email, $uid]);
        }
        $_SESSION['user_name'] = $name;
        echo json_encode(['success' => true]);
        break;

    case 'update_nutrition_goals':
        if (!$pdo) {
            echo json_encode(['success' => true]);
            break;
        }
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
            break;
        }
        $uid = $_SESSION['user_id'];
        $cal = max(0, (int)($input['calories'] ?? 0));
        $pro = max(0, (int)($input['protein'] ?? 0));
        $crb = max(0, (int)($input['carbs'] ?? 0));
        $fat = max(0, (int)($input['fat'] ?? 0));

        try {
            $stmt = $pdo->prepare("UPDATE users SET calorie_goal = ?, protein_goal = ?, carbs_goal = ?, fat_goal = ? WHERE id = ?");
            $stmt->execute([$cal, $pro, $crb, $fat, $uid]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error updating goals.']);
        }
        break;

    /* ── Saved Recipes ── */
    case 'save_recipe':
        if (!$pdo) {
            echo json_encode(['success' => true, 'message' => 'Demo mode: recipe not persisted.']);
            break;
        }
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
            break;
        }

        $uid = $_SESSION['user_id'];
        $apiId = (int) ($input['api_id'] ?? 0);

        // Validate the Spoonacular ID is a real positive integer
        if ($apiId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid recipe api_id.']);
            break;
        }

        $title = substr(htmlspecialchars(trim($input['title'] ?? ''), ENT_QUOTES, 'UTF-8'), 0, 255);
        $imageUrl = substr(trim($input['image_url'] ?? ''), 0, 255);
        $description = substr(trim($input['description'] ?? ''), 0, 200);
        $ingredients = substr(trim($input['ingredients'] ?? ''), 0, 200);
        $instructions = substr(trim($input['instructions'] ?? ''), 0, 200);
        $calories = (int) ($input['calories'] ?? 0);
        $protein = (int) ($input['protein'] ?? 0);
        $carbs = (int) ($input['carbs'] ?? 0);
        $fat = (int) ($input['fat'] ?? 0);

        try {
            // INSERT IGNORE silently skips rows that violate the unique_user_recipe constraint
            $stmt = $pdo->prepare(
                "INSERT IGNORE INTO saved_recipes
                    (user_id, api_id, title, image_url, `Description`, `Ingredients`,
                     instructions, calories, protein, carbs, fat)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $uid,
                $apiId,
                $title,
                $imageUrl,
                $description,
                $ingredients,
                $instructions,
                $calories,
                $protein,
                $carbs,
                $fat,
            ]);

            $affected = $stmt->rowCount();
            if ($affected === 0) {
                // Row already existed — not an error, inform the client
                echo json_encode(['success' => true, 'duplicate' => true, 'message' => 'Recipe already saved.']);
            } else {
                echo json_encode(['success' => true, 'duplicate' => false, 'id' => (int) $pdo->lastInsertId()]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Could not save recipe.']);
        }
        break;

    case 'delete_saved_recipe':
        if (!$pdo) {
            echo json_encode(['success' => true]);
            break;
        }
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
            break;
        }
        $uid = $_SESSION['user_id'];
        $recipe_id = (int)($input['id'] ?? 0);
        
        try {
            $stmt = $pdo->prepare("DELETE FROM saved_recipes WHERE id = ? AND user_id = ?");
            $stmt->execute([$recipe_id, $uid]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Could not delete recipe.']);
        }
        break;

    case 'get_saved_recipes':
        if (!$pdo) {
            echo json_encode([]);
            break;
        }
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
            break;
        }
        $uid = $_SESSION['user_id'];
        $stmt = $pdo->prepare(
            "SELECT id, api_id, title, image_url,
                    `Description` AS description,
                    `Ingredients` AS ingredients,
                    instructions, calories, protein, carbs, fat, created_at
             FROM saved_recipes
             WHERE user_id = ?
             ORDER BY created_at DESC"
        );
        $stmt->execute([$uid]);
        echo json_encode($stmt->fetchAll());
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action.']);
}

// ── Demo Fallbacks (no DB) ───────────────────────────────────

function demo_login(array $input): void
{
    if (($input['email'] ?? '') === 'demo@ingredio.app' && ($input['password'] ?? '') === 'password') {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_name'] = 'Demo User';
        echo json_encode(['success' => true, 'user' => ['id' => 1, 'name' => 'Demo User']]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials. Use demo@ingredio.app / password']);
    }
}

function demo_register(array $input): void
{
    // Demo mode: always succeeds (no real persistence)
    $name = htmlspecialchars(trim($input['fullname'] ?? 'New User'), ENT_QUOTES, 'UTF-8');
    echo json_encode(['success' => true, 'user' => ['id' => 99, 'name' => $name]]);
}

function demo_dashboard(): void
{
    echo json_encode([
        'success' => true,
        'pantry_count' => 12,
        'expiring_soon' => 3,
        'log_count' => 8,
        'calories_today' => 1480,
        'nutrition_today' => ['calories' => 1480, 'protein' => 95, 'carbs' => 180, 'fat' => 42],
        'expiring_items' => [
            ['name' => 'Chicken Breast', 'days_left' => 1],
            ['name' => 'Greek Yogurt', 'days_left' => 2],
            ['name' => 'Baby Spinach', 'days_left' => 3],
        ],
    ]);
}

function demo_pantry(): void
{
    echo json_encode([
        ['id' => 1, 'name' => 'Chicken Breast', 'quantity' => 500, 'unit' => 'g', 'category' => 'protein', 'expiry_date' => date('Y-m-d', strtotime('+1 day')), 'notes' => 'Fresh'],
        ['id' => 2, 'name' => 'Greek Yogurt', 'quantity' => 400, 'unit' => 'g', 'category' => 'dairy', 'expiry_date' => date('Y-m-d', strtotime('+2 days')), 'notes' => ''],
        ['id' => 3, 'name' => 'Spinach', 'quantity' => 200, 'unit' => 'g', 'category' => 'produce', 'expiry_date' => date('Y-m-d', strtotime('+3 days')), 'notes' => 'Organic'],
        ['id' => 4, 'name' => 'Brown Rice', 'quantity' => 1, 'unit' => 'kg', 'category' => 'grains', 'expiry_date' => date('Y-m-d', strtotime('+180 days')), 'notes' => ''],
        ['id' => 5, 'name' => 'Olive Oil', 'quantity' => 500, 'unit' => 'ml', 'category' => 'other', 'expiry_date' => date('Y-m-d', strtotime('+365 days')), 'notes' => 'Extra virgin'],
        ['id' => 6, 'name' => 'Oat Milk', 'quantity' => 1, 'unit' => 'L', 'category' => 'beverages', 'expiry_date' => date('Y-m-d', strtotime('+10 days')), 'notes' => ''],
        ['id' => 7, 'name' => 'Cumin Seeds', 'quantity' => 50, 'unit' => 'g', 'category' => 'spices', 'expiry_date' => null, 'notes' => ''],
        ['id' => 8, 'name' => 'Salmon Fillet', 'quantity' => 300, 'unit' => 'g', 'category' => 'protein', 'expiry_date' => date('Y-m-d', strtotime('+2 days')), 'notes' => 'Wild-caught'],
        ['id' => 9, 'name' => 'Avocado', 'quantity' => 3, 'unit' => 'pcs', 'category' => 'produce', 'expiry_date' => date('Y-m-d', strtotime('+5 days')), 'notes' => ''],
        ['id' => 10, 'name' => 'Whole Eggs', 'quantity' => 12, 'unit' => 'pcs', 'category' => 'protein', 'expiry_date' => date('Y-m-d', strtotime('+14 days')), 'notes' => 'Free-range'],
        ['id' => 11, 'name' => 'Cheddar', 'quantity' => 200, 'unit' => 'g', 'category' => 'dairy', 'expiry_date' => date('Y-m-d', strtotime('+21 days')), 'notes' => ''],
        ['id' => 12, 'name' => 'Quinoa', 'quantity' => 500, 'unit' => 'g', 'category' => 'grains', 'expiry_date' => date('Y-m-d', strtotime('+200 days')), 'notes' => ''],
    ]);
}

function demo_log(): void
{
    echo json_encode([]);
}
