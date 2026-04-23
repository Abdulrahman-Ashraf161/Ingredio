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
        $ingredients = preg_replace('/[^a-zA-Z0-9, ]/', '', $input['ingredients'] ?? '');
        $number = min((int) ($input['number'] ?? 12), 24);

        if (empty(SPOONACULAR_API_KEY)) {
            // Return demo recipes when no key configured
            echo json_encode(demo_recipes($ingredients));
            break;
        }

        // $url = "https://api.spoonacular.com/recipes/findByIngredients"
        //     . "?ingredients=" . urlencode($ingredients)
        //     . "&number={$number}&ranking=1&ignorePantry=true"
        //     . "&apiKey=" . SPOONACULAR_API_KEY;

        $url = "https://api.spoonacular.com/recipes/complexSearch"
            . "?includeIngredients=" . urlencode($ingredients)
            . "&number={$number}"
            . "&addRecipeNutrition=true"
            . "&addRecipeInformation=true"
            . "&apiKey=" . SPOONACULAR_API_KEY;

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $json = curl_exec($ch);
        $err  = curl_error($ch);
        if ($json === false || $err) {
            http_response_code(502);
            echo json_encode(['success' => false, 'message' => 'Could not reach Spoonacular API.']);
            break;
        }
        
        $data = json_decode($json, true) ?? [];
        $recipes = $data['results'] ?? [];

        // Map to our schema
        $results = array_map(function ($r) {
            $nutrients = $r['nutrition']['nutrients'] ?? [];

            foreach ($nutrients as $n) {
                if ($n['name'] === 'Calories') $calories = round($n['amount']);
                if ($n['name'] === 'Protein')  $protein  = round($n['amount']);
                if ($n['name'] === 'Fat')      $fat      = round($n['amount']);
            }
            return [
                'id' => $r['id'],
                'title' => $r['title'],
                'image' => $r['image'] ?? '',
                'readyInMinutes' => $r['readyInMinutes'] ?? null,
                'servings' => $r['servings'] ?? null,
                'calories' => $calories,
                'protein'  => $protein,
                'fat'      => $fat,
            ];
        }, $recipes);

        echo json_encode($results);
        break;

    case 'get_recipe_details':
        $recipeId = (int) ($input['recipe_id'] ?? 0);
        if (!$recipeId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing recipe_id.']);
            break;
        }

        if (empty(SPOONACULAR_API_KEY)) {
            echo json_encode(['success' => false, 'message' => 'API key not configured.']);
            break;
        }

        $url = "https://api.spoonacular.com/recipes/{$recipeId}/information?apiKey=" . SPOONACULAR_API_KEY;
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $json = curl_exec($ch);
        $err  = curl_error($ch);
        if ($json === false || $err) {
            http_response_code(502);
            echo json_encode(['success' => false, 'message' => 'Could not reach Spoonacular API.']);
            break;
        }
        echo $json; // pass through directly
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
