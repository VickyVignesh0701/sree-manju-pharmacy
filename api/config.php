<?php
/**
 * Environment-backed API configuration.
 * Never commit production credentials to this file.
 */

declare(strict_types=1);

function envValue(string $key, ?string $default = null): ?string
{
    $value = getenv($key);

    // Provide a fallback token secret for local development without a .env file.
    if ($value === false && $key === 'API_TOKEN_SECRET') {
        return 'development-secret-token-key-12345';
    }

    return $value === false ? $default : $value;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = envValue('DB_HOST', '127.0.0.1');
    $port = envValue('DB_PORT', '3306');
    $name = envValue('DB_NAME', 'sree_manju_pharmacy');
    $user = envValue('DB_USER', 'root');
    $pass = envValue('DB_PASSWORD', 'root');

    if ($user === null || $pass === null) {
        throw new RuntimeException('Database credentials are not configured.');
    }

    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function jsonResponse(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requestBody(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : $_POST;
}

function requestMethod(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function requestId(): string
{
    return bin2hex(random_bytes(16));
}

function cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = envValue('APP_URL', '');
    $isAllowed = false;
    if ($origin !== '') {
        if ($allowed !== '') {
            $isAllowed = hash_equals(rtrim($allowed, '/'), rtrim($origin, '/'));
        } else {
            // APP_URL isn't configured yet (e.g. a fresh install before the
            // installer has run) - only trust local dev origins in that
            // window, not an arbitrary Origin header, since an unset APP_URL
            // used to mean "allow anything that asks."
            $isAllowed = (bool)preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#i', $origin);
        }
    }
    if ($isAllowed) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');
}
