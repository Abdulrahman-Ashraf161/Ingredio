<?php
/**
 * Ingredio — API_Ops.php
 * Recipe API Proxy (Spoonacular)
 *
 * The API key NEVER touches the client.
 * All recipe requests are proxied through this file.
 */

session_start();
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

// ── Spoonacular API Key (server-side only) ───────────────────
define('SPOONACULAR_API_KEY', '86f701d2ce974a469b71f681d8e26bd4');   // <-- Insert your key here

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? '';

switch ($action) {

    case 'search_recipes':
        $search_type = $input['search_type'] ?? 'ingredients';
        $query = preg_replace('/[^a-zA-Z0-9, ]/', '', $input['query'] ?? ($input['ingredients'] ?? ''));
        $number = min((int) ($input['number'] ?? 12), 24);

        if (empty(SPOONACULAR_API_KEY)) {
            // Return demo recipes when no key configured
            echo json_encode(demo_recipes($query));
            break;
        }

        $url = "https://api.spoonacular.com/recipes/complexSearch?number={$number}&addRecipeNutrition=true&addRecipeInformation=true&apiKey=" . SPOONACULAR_API_KEY;

        if ($search_type === 'name') {
            $url .= "&query=" . urlencode($query);
        } else {
            $url .= "&includeIngredients=" . urlencode($query);
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $json = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        
        if ($json === false || $err) {
            http_response_code(502);
            echo json_encode(['success' => false, 'message' => 'Could not reach Spoonacular API.']);
            break;
        }

        $data = json_decode($json, true) ?? [];
        
        // Fallback to demo recipes if API quota is reached
        if ($httpCode === 402 || (isset($data['code']) && $data['code'] === 402)) {
            echo json_encode(demo_recipes($query));
            break;
        }

        $recipes = $data['results'] ?? [];

        // Map to our schema
        $results = array_map(function ($r) {
            $nutrients = $r['nutrition']['nutrients'] ?? [];

            foreach ($nutrients as $n) {
                if ($n['name'] === 'Calories')
                    $calories = round($n['amount']);
                if ($n['name'] === 'Protein')
                    $protein = round($n['amount']);
                if ($n['name'] === 'Fat')
                    $fat = round($n['amount']);
            }
            return [
                'id' => $r['id'],
                'title' => $r['title'],
                'image' => $r['image'] ?? '',
                'readyInMinutes' => $r['readyInMinutes'] ?? null,
                'servings' => $r['servings'] ?? null,
                'calories' => $calories,
                'protein' => $protein,
                'fat' => $fat,
            ];
        }, $recipes);

        echo json_encode($results);
        break;

    case 'get_recipe_details':
        $recipeId = (int) ($input['recipe_id'] ?? 0);
        if ($recipeId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid recipe_id: must be a positive integer.']);
            break;
        }

        if (empty(SPOONACULAR_API_KEY)) {
            echo json_encode(['success' => false, 'message' => 'API key not configured.']);
            break;
        }

        // includeNutrition=true fetches full macro breakdown
        $url = "https://api.spoonacular.com/recipes/{$recipeId}/information"
            . "?includeNutrition=true"
            . "&apiKey=" . SPOONACULAR_API_KEY;

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_USERAGENT => 'Ingredio/1.0',
        ]);
        $json = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($json === false || $err) {
            http_response_code(502);
            echo json_encode(['success' => false, 'message' => 'Could not reach Spoonacular API.']);
            break;
        }
        if ($httpCode !== 200 && $httpCode !== 402) {
            http_response_code($httpCode);
            echo json_encode(['success' => false, 'message' => "Spoonacular returned HTTP {$httpCode}."]);
            break;
        }

        $r = json_decode($json, true) ?? [];
        
        // Handle Spoonacular error (e.g. 402 Payment Required)
        if ($httpCode === 402 || (isset($r['code']) && $r['code'] === 402) || (isset($r['status']) && $r['status'] === 'failure')) {
            // Fallback to dummy data
            echo json_encode([
                'success' => true,
                'id' => $recipeId,
                'title' => 'Demo Recipe Details',
                'image' => '',
                'readyInMinutes' => 30,
                'servings' => 2,
                'summary' => 'This is a demo recipe description because the Spoonacular API quota has been reached. It provides dummy details so you can test the application UI.',
                'extendedIngredients' => [
                    ['id' => 1, 'name' => 'chicken breast', 'amount' => 1, 'unit' => 'lb', 'image' => ''],
                    ['id' => 2, 'name' => 'salt', 'amount' => 1, 'unit' => 'tsp', 'image' => ''],
                ],
                'analyzedInstructions' => [
                    ['name' => '', 'steps' => [
                        ['number' => 1, 'step' => 'Preheat oven to 400F.'],
                        ['number' => 2, 'step' => 'Season chicken and bake for 25 minutes.'],
                    ]]
                ],
                'nutrition' => ['calories' => 500, 'protein' => 45, 'carbs' => 5, 'fat' => 15],
            ]);
            break;
        }

        // ── Extract macros from nutrition.nutrients ───────────
        $nutrients = $r['nutrition']['nutrients'] ?? [];
        $macros = ['calories' => 0, 'protein' => 0, 'carbs' => 0, 'fat' => 0];
        $nutrientMap = [
            'Calories' => 'calories',
            'Protein' => 'protein',
            'Carbohydrates' => 'carbs',
            'Fat' => 'fat',
        ];
        foreach ($nutrients as $n) {
            $key = $nutrientMap[$n['name']] ?? null;
            if ($key)
                $macros[$key] = (int) round($n['amount'] ?? 0);
        }

        // ── Map ingredients to a clean array ─────────────────
        $ingredients = array_map(fn($i) => [
            'id' => (int) ($i['id'] ?? 0),
            'name' => htmlspecialchars($i['name'] ?? '', ENT_QUOTES, 'UTF-8'),
            'amount' => round((float) ($i['amount'] ?? 0), 2),
            'unit' => htmlspecialchars($i['unit'] ?? '', ENT_QUOTES, 'UTF-8'),
            'image' => $i['image'] ?? '',
        ], $r['extendedIngredients'] ?? []);

        // ── Map step-by-step instructions ────────────────────
        $instructions = array_map(fn($section) => [
            'name' => htmlspecialchars($section['name'] ?? '', ENT_QUOTES, 'UTF-8'),
            'steps' => array_map(fn($s) => [
                'number' => (int) ($s['number'] ?? 0),
                'step' => htmlspecialchars($s['step'] ?? '', ENT_QUOTES, 'UTF-8'),
            ], $section['steps'] ?? []),
        ], $r['analyzedInstructions'] ?? []);

        // ── Strip HTML from summary safely ───────────────────
        $rawSummary = $r['summary'] ?? '';
        $cleanSummary = htmlspecialchars(strip_tags($rawSummary), ENT_QUOTES, 'UTF-8');

        echo json_encode([
            'success' => true,
            'id' => (int) ($r['id'] ?? 0),
            'title' => htmlspecialchars($r['title'] ?? '', ENT_QUOTES, 'UTF-8'),
            'image' => $r['image'] ?? '',
            'readyInMinutes' => (int) ($r['readyInMinutes'] ?? 0),
            'servings' => (int) ($r['servings'] ?? 0),
            'summary' => $cleanSummary,
            'extendedIngredients' => $ingredients,
            'analyzedInstructions' => $instructions,
            'nutrition' => $macros,
        ]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action.']);
}

// ── Demo Recipe Data ─────────────────────────────────────────
function demo_recipes(string $ingredients): array
{
    return [
        ['id' => 1001, 'title' => 'Grilled Chicken & Quinoa Bowl', 'image' => '', 'readyInMinutes' => 30, 'servings' => 2, 'calories' => 520, 'protein' => 45, 'fat' => 14],
        ['id' => 1002, 'title' => 'Spinach & Feta Omelette', 'image' => '', 'readyInMinutes' => 15, 'servings' => 1, 'calories' => 340, 'protein' => 28, 'fat' => 22],
        ['id' => 1003, 'title' => 'Salmon with Avocado Salsa', 'image' => '', 'readyInMinutes' => 25, 'servings' => 2, 'calories' => 480, 'protein' => 38, 'fat' => 28],
        ['id' => 1004, 'title' => 'Brown Rice Stir-Fry', 'image' => '', 'readyInMinutes' => 20, 'servings' => 2, 'calories' => 390, 'protein' => 18, 'fat' => 10],
        ['id' => 1005, 'title' => 'Greek Yogurt Parfait', 'image' => '', 'readyInMinutes' => 10, 'servings' => 1, 'calories' => 280, 'protein' => 16, 'fat' => 6],
        ['id' => 1006, 'title' => 'Cumin-Spiced Chicken Skewers', 'image' => '', 'readyInMinutes' => 35, 'servings' => 4, 'calories' => 310, 'protein' => 40, 'fat' => 12],
        ['id' => 1007, 'title' => 'Cheddar Egg Muffins', 'image' => '', 'readyInMinutes' => 25, 'servings' => 6, 'calories' => 180, 'protein' => 14, 'fat' => 12],
        ['id' => 1008, 'title' => 'Avocado Toast with Eggs', 'image' => '', 'readyInMinutes' => 10, 'servings' => 1, 'calories' => 420, 'protein' => 18, 'fat' => 26],
    ];
}