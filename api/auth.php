<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

function base64UrlEncode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function base64UrlDecode(string $value): string
{
    return base64_decode(strtr($value . str_repeat('=', (4 - strlen($value) % 4) % 4), '-_', '+/')) ?: '';
}

function issueToken(array $staff): string
{
    $secret = envValue('API_TOKEN_SECRET');
    if (!$secret) {
        throw new RuntimeException('API_TOKEN_SECRET is not configured.');
    }
    $header = base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64UrlEncode(json_encode([
        'sub' => (int)$staff['id'],
        'role' => $staff['role'],
        'email' => $staff['email'],
        'iat' => time(),
        'exp' => time() + (int)envValue('TOKEN_TTL', '28800'),
    ]));
    $signature = base64UrlEncode(hash_hmac('sha256', $header . '.' . $payload, $secret, true));
    return $header . '.' . $payload . '.' . $signature;
}

function authenticatedUser(): array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
        jsonResponse(['success' => false, 'message' => 'Authentication required.'], 401);
    }

    $parts = explode('.', $matches[1]);
    if (count($parts) !== 3) {
        jsonResponse(['success' => false, 'message' => 'Invalid authentication token.'], 401);
    }

    $secret = envValue('API_TOKEN_SECRET');
    if (!$secret) {
        jsonResponse(['success' => false, 'message' => 'API token secret is not configured.'], 500);
    }

    $expected = base64UrlEncode(hash_hmac('sha256', $parts[0] . '.' . $parts[1], $secret, true));
    if (!hash_equals($expected, $parts[2])) {
        jsonResponse(['success' => false, 'message' => 'Invalid authentication token.'], 401);
    }

    $payload = json_decode(base64UrlDecode($parts[1]), true);
    if (!is_array($payload) || empty($payload['sub']) || empty($payload['exp']) || (int)$payload['exp'] < time()) {
        jsonResponse(['success' => false, 'message' => 'Authentication token has expired or is invalid.'], 401);
    }

    $stmt = db()->prepare('SELECT id, name, role, email, phone, status FROM staff_members WHERE id = ? LIMIT 1');
    $stmt->execute([(int)$payload['sub']]);
    $staff = $stmt->fetch();
    if (!$staff || strcasecmp((string)$staff['status'], 'Active') !== 0) {
        jsonResponse(['success' => false, 'message' => 'Account is inactive or unavailable.'], 401);
    }

    return $staff;
}

function requireRole(array $roles): array
{
    $user = authenticatedUser();
    $role = strtolower(trim((string)$user['role']));
    $allowed = array_map(fn($r) => strtolower(trim((string)$r)), $roles);
    if (!in_array($role, $allowed, true)) {
        jsonResponse(['success' => false, 'message' => 'You do not have permission for this action.'], 403);
    }
    return $user;
}

function logActivity(string $action, ?string $entityType, ?int $entityId, array $user, array $details = []): void
{
    $stmt = db()->prepare('INSERT INTO activity_log (action, entity_type, entity_id, user_id, user_name, user_role, user_email, ip_address, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $action,
        $entityType,
        $entityId,
        $user['id'] ?? null,
        $user['name'] ?? null,
        $user['role'] ?? null,
        $user['email'] ?? null,
        $_SERVER['REMOTE_ADDR'] ?? null,
        json_encode($details, JSON_UNESCAPED_UNICODE),
    ]);
}

function handleLogin(): never
{
    if (requestMethod() !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'POST is required.'], 405);
    }

    $input = requestBody();
    $email = strtolower(trim((string)($input['email'] ?? '')));
    $password = (string)($input['password'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
        jsonResponse(['success' => false, 'message' => 'Valid email and password are required.'], 422);
    }

    $stmt = db()->prepare('SELECT * FROM staff_members WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $staff = $stmt->fetch();
    if (!$staff || !password_verify($password, (string)$staff['password_hash'])) {
        jsonResponse(['success' => false, 'message' => 'Invalid email or password.'], 401);
    }
    if (strcasecmp((string)$staff['status'], 'Active') !== 0) {
        jsonResponse(['success' => false, 'message' => 'Account is inactive.'], 403);
    }

    $token = issueToken($staff);
    unset($staff['password_hash']);
    logActivity('login', 'staff', (int)$staff['id'], $staff);
    jsonResponse(['success' => true, 'token' => $token, 'user' => $staff]);
}
