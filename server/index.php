<?php
declare(strict_types=1);

require __DIR__ . '/src/Http.php';
require __DIR__ . '/src/Db.php';
require __DIR__ . '/src/Auth.php';
require __DIR__ . '/src/Sync.php';

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

    switch ($route) {
        case 'POST /auth/register':
            $b = Http::body();
            $r = $auth->register(Auth::normalizeEmail($b['email'] ?? null), Auth::checkPassword($b['password'] ?? null), is_string($b['device'] ?? null) ? $b['device'] : null);
            Http::json(201, $r);

        case 'POST /auth/login':
            $b = Http::body();
            $pw = $b['password'] ?? null;
            if (!is_string($pw) || $pw === '' || strlen($pw) > 200) {
                throw new ApiError(401, 'bad_credentials', 'Email or password is incorrect.');
            }
            Http::json(200, $auth->login(Auth::normalizeEmail($b['email'] ?? null), $pw, is_string($b['device'] ?? null) ? $b['device'] : null));

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

        default:
            throw new ApiError(404, 'not_found', 'Unknown endpoint.');
    }
} catch (ApiError $e) {
    Http::json($e->status, ['error' => ['code' => $e->errorCode, 'message' => $e->getMessage()]]);
} catch (Throwable $e) {
    error_log('[quran-garden-api] ' . $e);
    Http::json(500, ['error' => ['code' => 'server_error', 'message' => !empty($cfg['debug']) ? $e->getMessage() : 'Server error.']]);
}
