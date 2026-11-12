<?php
declare(strict_types=1);

require __DIR__ . '/src/Http.php';
require __DIR__ . '/src/Db.php';
require __DIR__ . '/src/Mailer.php';
require __DIR__ . '/src/Codes.php';
require __DIR__ . '/src/Auth.php';
require __DIR__ . '/src/Sync.php';
require __DIR__ . '/src/Quran.php';
require __DIR__ . '/src/Profiles.php';
require __DIR__ . '/src/Rooms.php';

// CORS: lets the app's web build (browser) call this API. The API uses Bearer tokens, not cookies, so '*' is safe.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');
header('Access-Control-Max-Age: 86400');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$configFile = getenv('QG_CONFIG') ?: __DIR__ . '/config.php';
if (!is_file($configFile)) {
    Http::json(500, ['error' => ['code' => 'not_configured', 'message' => 'config.php is missing.']]);
}
$cfg = require $configFile;

try {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
    if ($base !== '' && str_starts_with($path, $base)) {
        $path = substr($path, strlen($base));
    }
    $path = '/' . trim($path, '/');
    if ($path === '/index.php') {
        $path = '/';
    }
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $route = $method . ' ' . $path;

    if ($route === 'GET /health') {
        Http::json(200, ['ok' => true]);
    }

    $db = Db::pdo($cfg);
    $auth = new Auth($db, $cfg);
    $sync = new Sync($db, $cfg);
    $profiles = new Profiles($db);
    $rooms = new Rooms($db, $cfg, $auth);

    // Routes with a room code in the path: /rooms/ABC234, /rooms/ABC234/start, /leave, /turn
    if (preg_match('#^/rooms/([A-Za-z0-9]{6})(?:/(start|leave|turn))?$#', $path, $m)) {
        $u = $auth->authenticate();
        $action = $m[2] ?? '';
        if ($method === 'GET' && $action === '') {
            $since = isset($_GET['v']) && ctype_digit((string)$_GET['v']) ? (int)$_GET['v'] : null;
            Http::json(200, $rooms->state($u['id'], $m[1], $since));
        }
        if ($method === 'POST' && $action === 'start') {
            Http::json(200, $rooms->start($u['id'], $m[1]));
        }
        if ($method === 'POST' && $action === 'leave') {
            $rooms->leave($u['id'], $m[1]);
            Http::json(200, ['ok' => true]);
        }
        if ($method === 'POST' && $action === 'turn') {
            Http::json(200, $rooms->submit($u['id'], $m[1], Http::body()));
        }
        throw new ApiError(404, 'not_found', 'Unknown endpoint.');
    }

    switch ($route) {
        case 'POST /auth/register':
            $b = Http::body();
            $r = $auth->register(Auth::normalizeEmail($b['email'] ?? null), Auth::checkPassword($b['password'] ?? null), Auth::lang($b['lang'] ?? null));
            Http::json(201, $r);

        case 'POST /auth/verify':
            $b = Http::body();
            Http::json(200, $auth->verifyEmail(Auth::normalizeEmail($b['email'] ?? null), $b['code'] ?? null, is_string($b['device'] ?? null) ? $b['device'] : null));

        case 'POST /auth/resend':
            $b = Http::body();
            $auth->resendVerification(Auth::normalizeEmail($b['email'] ?? null), Auth::lang($b['lang'] ?? null));
            Http::json(200, ['ok' => true]);

        case 'POST /auth/forgot':
            $b = Http::body();
            $auth->forgotPassword(Auth::normalizeEmail($b['email'] ?? null), Auth::lang($b['lang'] ?? null));
            Http::json(200, ['ok' => true]);

        case 'POST /auth/reset':
            $b = Http::body();
            $auth->resetPassword(Auth::normalizeEmail($b['email'] ?? null), $b['code'] ?? null, Auth::checkPassword($b['newPassword'] ?? null));
            Http::json(200, ['ok' => true]);

        case 'POST /auth/login':
            $b = Http::body();
            $pw = $b['password'] ?? null;
            if (!is_string($pw) || $pw === '' || strlen($pw) > 200) {
                throw new ApiError(401, 'bad_credentials', 'Email or password is incorrect.');
            }
            Http::json(200, $auth->login(Auth::normalizeEmail($b['email'] ?? null), $pw, is_string($b['device'] ?? null) ? $b['device'] : null, Auth::lang($b['lang'] ?? null)));

        case 'POST /auth/logout':
            $u = $auth->authenticate();
            $auth->logout($u['session_id']);
            Http::json(200, ['ok' => true]);

        case 'GET /me':
            $u = $auth->authenticate();
            Http::json(200, ['user' => ['id' => $u['id'], 'email' => $u['email']]]);

        case 'POST /me/password':
            $u = $auth->authenticate();
            $b = Http::body();
            $auth->verifyPassword($u['id'], $b['currentPassword'] ?? null);
            $auth->changePassword($u['id'], $u['session_id'], Auth::checkPassword($b['newPassword'] ?? null));
            Http::json(200, ['ok' => true]);

        case 'DELETE /me':
            $u = $auth->authenticate();
            $b = Http::body();
            $auth->verifyPassword($u['id'], $b['password'] ?? null);
            $auth->deleteAccount($u['id']);
            Http::json(200, ['ok' => true]);

        case 'GET /sync':
            $u = $auth->authenticate();
            Http::json(200, ['items' => (object)$sync->all($u['id']), 'serverTime' => time()]);

        case 'PUT /sync':
            $u = $auth->authenticate();
            $b = Http::body();
            $r = $sync->push($u['id'], $b['items'] ?? null);
            Http::json(200, ['accepted' => $r['accepted'], 'newer' => (object)$r['newer'], 'serverTime' => time()]);

        case 'GET /profile':
            $u = $auth->authenticate();
            Http::json(200, ['profile' => $profiles->get($u['id'])]);

        case 'PUT /profile':
            $u = $auth->authenticate();
            $b = Http::body();
            Http::json(200, ['profile' => $profiles->save($u['id'], $b['displayName'] ?? null, $b['avatar'] ?? null)]);

        case 'POST /rooms':
            $u = $auth->authenticate();
            Http::json(201, $rooms->create($u['id'], Http::body()));

        case 'POST /rooms/join':
            $u = $auth->authenticate();
            $b = Http::body();
            Http::json(200, $rooms->join($u['id'], $b['code'] ?? null));

        default:
            throw new ApiError(404, 'not_found', 'Unknown endpoint.');
    }
} catch (ApiError $e) {
    Http::json($e->status, ['error' => ['code' => $e->errorCode, 'message' => $e->getMessage()]]);
} catch (Throwable $e) {
    error_log('[quran-garden-api] ' . $e);
    Http::json(500, ['error' => ['code' => 'server_error', 'message' => !empty($cfg['debug']) ? $e->getMessage() : 'Server error.']]);
}
