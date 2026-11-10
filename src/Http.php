<?php
declare(strict_types=1);

final class ApiError extends Exception
{
    public function __construct(public int $status, public string $errorCode, string $message)
    {
        parent::__construct($message);
    }
}

final class Http
{
    public static function json(int $status, array $body): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /** Request body decoded as a JSON object (empty array when there is no body). */
    public static function body(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || $raw === '') {
            return [];
        }
        if (strlen($raw) > 4 * 1048576) {
            throw new ApiError(413, 'too_large', 'Request body is too large.');
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            throw new ApiError(400, 'bad_json', 'Body must be a JSON object.');
        }
        return $data;
    }

    public static function bearer(): ?string
    {
        $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if ($h === '' && function_exists('getallheaders')) {
            foreach (getallheaders() as $k => $v) {
                if (strtolower($k) === 'authorization') {
                    $h = $v;
                }
            }
        }
        if (preg_match('/^Bearer\s+([A-Za-z0-9_\-]{20,128})$/', $h, $m)) {
            return $m[1];
        }
        $x = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
        return preg_match('/^[A-Za-z0-9_\-]{20,128}$/', $x) ? $x : null;
    }

    public static function ip(): string
    {
        return substr((string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 0, 64);
    }
}
