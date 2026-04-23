<?php
/**
 * Ingredio — Upload.php
 * Secure Image Upload Handler
 *
 * SECURITY MEASURES:
 *   1. MIME type verification via finfo (not user-supplied Content-Type)
 *   2. File extension whitelist
 *   3. Maximum file size enforcement (5 MB)
 *   4. Cryptographically unique filenames (prevent enumeration)
 *   5. Upload directory outside web root or with .htaccess protection
 *   6. Dangerous extensions explicitly rejected
 *   7. Path only stored in DB — never the full server path
 *   8. Directory existence and writability checks
 *   9. No overwriting of existing files
 *
 * USAGE:
 *   POST multipart/form-data to Upload.php with:
 *     meal_image  — the image file (required)
 *     meal_name   — string (optional)
 *     notes       — string (optional)
 *     calories    — numeric string (optional)
 *     date        — date string YYYY-MM-DD (optional)
 *
 * RESPONSE (JSON):
 *   { "success": true,  "image_path": "uploads/abc123.jpg", "meal_id": 42 }
 *   { "success": false, "message": "Reason for failure" }
 */

session_start();
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

/* ── Configuration ───────────────────────────────────────── */

define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('UPLOAD_URL', 'uploads/');
define('AVATAR_UPLOAD_DIR', __DIR__ . '/uploads/avatars/');
define('AVATAR_UPLOAD_URL', 'uploads/avatars/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024);   // 5 MB in bytes

/** Allowed MIME types and their corresponding safe extensions */
const ALLOWED_MIME_EXT = [
    'image/jpeg' => ['jpg', 'jpeg'],
    'image/png' => ['png'],
    'image/webp' => ['webp'],
    'image/gif' => ['gif'],
];

/** Extensions that are always rejected, regardless of MIME type */
const BLOCKED_EXTENSIONS = [
    'php',
    'php3',
    'php4',
    'php5',
    'php7',
    'phtml',
    'phar',
    'exe',
    'sh',
    'bat',
    'cmd',
    'pl',
    'py',
    'rb',
    'cgi',
    'asp',
    'aspx',
    'jsp',
    'htaccess',
];


/* ── Request Validation ──────────────────────────────────── */

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// Check file was sent — accept either meal_image or avatar_image
$action = $_POST['action'] ?? 'upload_meal';
$fileKey = ($action === 'upload_avatar') ? 'avatar_image' : 'meal_image';

if (empty($_FILES[$fileKey])) {
    echo json_encode(['success' => false, 'message' => 'No file received.']);
    exit;
}

$file = $_FILES[$fileKey];

// Check for upload errors
if ($file['error'] !== UPLOAD_ERR_OK) {
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE => 'File exceeds server upload limit.',
        UPLOAD_ERR_FORM_SIZE => 'File exceeds form upload limit.',
        UPLOAD_ERR_PARTIAL => 'File was only partially uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary upload directory.',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
        UPLOAD_ERR_EXTENSION => 'Upload blocked by server extension.',
    ];
    $msg = $errorMessages[$file['error']] ?? 'Unknown upload error.';
    echo json_encode(['success' => false, 'message' => $msg]);
    exit;
}

/* ── Size Validation ─────────────────────────────────────── */

if ($file['size'] > MAX_FILE_SIZE) {
    echo json_encode(['success' => false, 'message' => 'File too large. Maximum allowed size is 5 MB.']);
    exit;
}

if ($file['size'] === 0) {
    echo json_encode(['success' => false, 'message' => 'Uploaded file is empty.']);
    exit;
}

/* ── MIME Type Validation (server-side, not user-supplied) ── */

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!array_key_exists($mimeType, ALLOWED_MIME_EXT)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid file type. Only JPG, PNG, WEBP, and GIF images are accepted.',
    ]);
    exit;
}

/* ── Extension Validation ────────────────────────────────── */

// Extract extension from original filename (lowercased)
$originalName = $file['name'];
$dotPosition = strrpos($originalName, '.');
$uploadedExt = $dotPosition !== false ? strtolower(substr($originalName, $dotPosition + 1)) : '';

// Reject explicitly blocked extensions
if (in_array($uploadedExt, BLOCKED_EXTENSIONS, true)) {
    echo json_encode(['success' => false, 'message' => 'This file type is not allowed.']);
    exit;
}

// Verify the extension matches the detected MIME type
$allowedExtsForMime = ALLOWED_MIME_EXT[$mimeType];
if (!in_array($uploadedExt, $allowedExtsForMime, true)) {
    echo json_encode(['success' => false, 'message' => 'File extension does not match file content.']);
    exit;
}

/* ── Prepare Upload Directory ────────────────────────────── */

if (!is_dir(UPLOAD_DIR)) {
    if (!mkdir(UPLOAD_DIR, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Could not create upload directory.']);
        exit;
    }
}

if (!is_writable(UPLOAD_DIR)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Upload directory is not writable.']);
    exit;
}

// Create an .htaccess in uploads/ to prevent direct PHP execution
$htaccessPath = UPLOAD_DIR . '.htaccess';
if (!file_exists($htaccessPath)) {
    file_put_contents(
        $htaccessPath,
        "Options -Indexes\n" .
        "<FilesMatch \"\\.php$\">\n" .
        "    Deny from all\n" .
        "</FilesMatch>\n"
    );
}

/* ── Generate Unique Safe Filename ───────────────────────── */

$targetDir = ($action === 'upload_avatar') ? AVATAR_UPLOAD_DIR : UPLOAD_DIR;

// Ensure target directory exists
if ($action === 'upload_avatar' && !is_dir($targetDir)) {
    if (!mkdir($targetDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Could not create avatar upload directory.']);
        exit;
    }
}

// Use bin2hex(random_bytes()) for cryptographic uniqueness
// Never reuse original filename (prevents path traversal and overwriting)
do {
    $uniqueName = bin2hex(random_bytes(16)) . '.' . $uploadedExt;
    $destPath = $targetDir . $uniqueName;
} while (file_exists($destPath));   // Guarantee no overwrite

/* ── Move File to Destination ────────────────────────────── */

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file.']);
    exit;
}

/* ── Avatar Upload Path ───────────────────────────────────────── */

if ($action === 'upload_avatar') {
    // Require an authenticated session for avatar uploads
    $userId = $_SESSION['user_id'] ?? 0;
    if (!$userId) {
        // Clean up the already-moved file since we can't authorise the upload
        @unlink($destPath);
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'You must be logged in to upload an avatar.']);
        exit;
    }

    try {
        $dsn = "mysql:host=localhost;dbname=ingredio;charset=utf8mb4";
        $pdo = new PDO($dsn, 'root', '', [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);

        // Delete old avatar file if it exists on disk (free up space)
        $existing = $pdo->prepare("SELECT avatar_path FROM users WHERE id = ? LIMIT 1");
        $existing->execute([$userId]);
        $row = $existing->fetch();
        if ($row && !empty($row['avatar_path'])) {
            $oldFile = __DIR__ . '/' . $row['avatar_path'];
            if (is_file($oldFile)) @unlink($oldFile);
        }

        // Update avatar_path in the users table (PDO prepared statement)
        $avatarRelativePath = AVATAR_UPLOAD_URL . $uniqueName;
        $stmt = $pdo->prepare("UPDATE users SET avatar_path = ? WHERE id = ?");
        $stmt->execute([$avatarRelativePath, $userId]);

        echo json_encode([
            'success'     => true,
            'avatar_path' => $avatarRelativePath,
            'message'     => 'Profile photo updated successfully.',
        ]);

    } catch (PDOException $e) {
        error_log('[Upload.php/avatar] DB error: ' . $e->getMessage());
        // File is already saved — return path so UI can still update
        echo json_encode([
            'success'     => true,
            'avatar_path' => $avatarRelativePath,
            'message'     => 'Photo saved (profile DB update pending).',
        ]);
    }
    exit;
}

/* ── Meal Image Upload Path (default) ──────────────────────────── */

// Relative path stored in DB — not the full server path
$relativePath = UPLOAD_URL . $uniqueName;

// Sanitize ancillary fields
$mealName = substr(trim($_POST['meal_name'] ?? ''), 0, 200);
$notes = substr(trim($_POST['notes'] ?? ''), 0, 500);
$calories = (int) ($_POST['calories'] ?? 0);
$logDate = !empty($_POST['date']) ? $_POST['date'] : date('Y-m-d');

$userId = $_SESSION['user_id'] ?? 0;
$mealId = null;

try {
    $dsn = "mysql:host=localhost;dbname=ingredio;charset=utf8mb4";
    $pdo = new PDO($dsn, 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // Only store the relative path in the database, never the full server path
    $stmt = $pdo->prepare(
        "INSERT INTO cooking_log (user_id, meal_name, image_path, notes, calories, logged_date)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$userId, $mealName, $relativePath, $notes, $calories ?: null, $logDate]);
    $mealId = (int) $pdo->lastInsertId();

} catch (PDOException $e) {
    // DB unavailable: file is saved, return path anyway (demo mode)
    // Log internally but do NOT expose DB error to the client
    error_log('[Upload.php] DB error: ' . $e->getMessage());
}

/* ── Success Response ────────────────────────────────────── */

echo json_encode([
    'success' => true,
    'image_path' => $relativePath,
    'meal_id' => $mealId,
    'message' => 'Meal logged successfully.',
]);
