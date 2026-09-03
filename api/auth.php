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

const AUTH_COOKIE_NAME = 'pharmacy_token';

function setAuthCookie(string $token): void
{
    $ttl = (int)envValue('TOKEN_TTL', '28800');
    $isHttps = (($_SERVER['HTTPS'] ?? '') !== '' && ($_SERVER['HTTPS'] ?? '') !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    setcookie(AUTH_COOKIE_NAME, $token, [
        'expires' => time() + $ttl,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function clearAuthCookie(): void
{
    setcookie(AUTH_COOKIE_NAME, '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
}

// Prefers an Authorization header (useful for non-browser/API clients) and
// falls back to the HttpOnly cookie the browser sends automatically - this
// keeps the token out of localStorage/JS reach for the web app while not
// hard-requiring the cookie path for every possible client.
function resolveAuthToken(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
        return $matches[1];
    }
    return $_COOKIE[AUTH_COOKIE_NAME] ?? null;
}

function handleLogout(): never
{
    clearAuthCookie();
    jsonResponse(['success' => true]);
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
    $token = resolveAuthToken();
    if (!$token) {
        jsonResponse(['success' => false, 'message' => 'Authentication required.'], 401);
    }

    $parts = explode('.', $token);
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

function handleActivityLog(array $segments, array $user): never
{
    requireRole(['Owner', 'Co-owner']);
    if (requestMethod() !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Only GET is supported.'], 405);
    }
    $limit = min(max((int)($_GET['limit'] ?? 300), 1), 1000);
    $stmt = db()->query("SELECT id, action, entity_type, entity_id, user_name, user_role, ip_address, details, timestamp FROM activity_log ORDER BY timestamp DESC LIMIT {$limit}");
    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) {
        $row['details'] = $row['details'] ? json_decode((string)$row['details'], true) : null;
    }
    unset($row);
    jsonResponse(['success' => true, 'logs' => $rows]);
}
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

function loginRateLimitIdentifier(string $email): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    return $ip . '|' . $email;
}

function checkLoginRateLimit(string $identifier): void
{
    $windowMinutes = 15;
    $maxAttempts = 5;
    // $windowMinutes is a fixed constant, never user input, so inlining it
    // avoids relying on a bound placeholder inside INTERVAL, which behaves
    // inconsistently across MySQL/MariaDB versions with real (non-emulated) prepares.
    $stmt = db()->prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE identifier = ? AND attempted_at > (NOW() - INTERVAL {$windowMinutes} MINUTE)");
    $stmt->execute([$identifier]);
    $count = (int)$stmt->fetch()['n'];
    if ($count >= $maxAttempts) {
        jsonResponse(['success' => false, 'message' => "Too many failed login attempts. Please try again in {$windowMinutes} minutes."], 429);
    }
}

function recordFailedLogin(string $identifier): void
{
    db()->prepare('INSERT INTO login_attempts (identifier) VALUES (?)')->execute([$identifier]);
}

function clearLoginAttempts(string $identifier): void
{
    db()->prepare('DELETE FROM login_attempts WHERE identifier = ?')->execute([$identifier]);
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

    $identifier = loginRateLimitIdentifier($email);
    checkLoginRateLimit($identifier);

    $stmt = db()->prepare('SELECT * FROM staff_members WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $staff = $stmt->fetch();
    if (!$staff || !password_verify($password, (string)$staff['password_hash'])) {
        recordFailedLogin($identifier);
        jsonResponse(['success' => false, 'message' => 'Invalid email or password.'], 401);
    }
    if (strcasecmp((string)$staff['status'], 'Active') !== 0) {
        jsonResponse(['success' => false, 'message' => 'Account is inactive.'], 403);
    }

    clearLoginAttempts($identifier);
    $token = issueToken($staff);
    setAuthCookie($token);
    unset($staff['password_hash']);
    logActivity('login', 'staff', (int)$staff['id'], $staff);
    jsonResponse(['success' => true, 'token' => $token, 'user' => $staff]);
}

function validatePasswordComplexityServer(string $password): ?string
{
    $len = strlen($password);
    if ($len < 8 || $len > 16) {
        return "Password length must be 8 to 16 characters (current: {$len}).";
    }
    if (!preg_match('/[A-Z]/', $password)) return 'Password needs at least one uppercase letter.';
    if (!preg_match('/[a-z]/', $password)) return 'Password needs at least one lowercase letter.';
    if (!preg_match('/[0-9]/', $password)) return 'Password needs at least one number.';
    if (!preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\\\|,.<>?]/', $password)) return 'Password needs at least one special character.';
    return null;
}

function handleRegister(): never
{
    if (requestMethod() !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'POST is required.'], 405);
    }

    $input = requestBody();
    $role = (string)($input['role'] ?? 'staff');
    $firstName = trim((string)($input['firstName'] ?? ''));
    $lastName = trim((string)($input['lastName'] ?? ''));
    $email = strtolower(trim((string)($input['email'] ?? '')));
    $mobile = trim((string)($input['mobile'] ?? ''));
    $password = (string)($input['password'] ?? '');

    if ($firstName === '' || $lastName === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'message' => 'First name, last name, and a valid email are required.'], 422);
    }
    $pwdError = validatePasswordComplexityServer($password);
    if ($pwdError !== null) {
        jsonResponse(['success' => false, 'message' => $pwdError], 422);
    }

    // Business role labels map onto the two permission tiers the API currently checks.
    $roleMap = ['primary_owner' => 'Owner', 'co_owner' => 'Owner', 'staff' => 'Staff'];
    $dbRole = $roleMap[$role] ?? 'Staff';

    $pdo = db();
    $pdo->beginTransaction();
    try {
        if (in_array($role, ['primary_owner', 'co_owner'], true)) {
            // Only one primary owner and one co-owner account are allowed.
            $label = $role === 'primary_owner' ? 'Primary Owner' : 'Co-Owner';
            $stmt = $pdo->prepare('SELECT id FROM staff_members WHERE role = ? AND role_label = ? LIMIT 1 FOR UPDATE');
            $stmt->execute([$dbRole, $label]);
            if ($stmt->fetch()) {
                $pdo->rollBack();
                jsonResponse(['success' => false, 'message' => "Only one {$label} account is allowed."], 409);
            }
        }

        $stmt = $pdo->prepare('SELECT id FROM staff_members WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'An account with that email is already registered.'], 409);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $label = ['primary_owner' => 'Primary Owner', 'co_owner' => 'Co-Owner', 'staff' => 'Staff Pharmacist'][$role] ?? 'Staff Pharmacist';
        $staffId = random_int(1000000000, 9999999999);
        $stmt = $pdo->prepare('INSERT INTO staff_members (id, name, first_name, last_name, role, role_label, email, phone, password_hash, status, join_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)');
        $stmt->execute([$staffId, "{$firstName} {$lastName}", $firstName, $lastName, $dbRole, $label, $email, $mobile ?: null, $hash, 'Active']);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Registration failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Registration failed. Please try again.'], 500);
    }

    logActivity('staff_registered', 'staff', $staffId, ['id' => $staffId, 'name' => "{$firstName} {$lastName}", 'role' => $dbRole, 'email' => $email]);
    jsonResponse(['success' => true, 'message' => 'Account created. Sign in with the password you set.'], 201);
}

function handlePasswordResetRequest(): never
{
    if (requestMethod() !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'POST is required.'], 405);
    }
    $input = requestBody();
    $email = strtolower(trim((string)($input['email'] ?? '')));
    $generic = ['success' => true, 'message' => 'If that email is registered, a reset link has been sent to it.'];

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse($generic);
    }

    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, name, email FROM staff_members WHERE email = ? AND status = \'Active\' LIMIT 1');
    $stmt->execute([$email]);
    $staff = $stmt->fetch();

    if ($staff) {
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $expiresAt = date('Y-m-d H:i:s', time() + 1800);

        $pdo->prepare('DELETE FROM password_reset_tokens WHERE staff_id = ?')->execute([$staff['id']]);
        $pdo->prepare('INSERT INTO password_reset_tokens (staff_id, token_hash, expires_at) VALUES (?, ?, ?)')
            ->execute([$staff['id'], $tokenHash, $expiresAt]);

        $resetUrl = rtrim((string)envValue('APP_URL', ''), '/') . '/?reset_token=' . $token;
        // TODO: wire this to a transactional mail sender once one exists. smtp_mailer.php
        // is a UI-driven test/send endpoint that takes credentials per request, not a
        // reusable "send with configured SMTP" function, so it isn't called from here.
        // Until that's built, the reset link is logged server-side so an operator can
        // relay it manually.
        error_log("Password reset requested for staff #{$staff['id']} ({$staff['email']}): {$resetUrl}");
        logActivity('password_reset_requested', 'staff', (int)$staff['id'], $staff);
    }

    // Always return the same message so the endpoint can't be used to test which emails exist.
    jsonResponse($generic);
}

function handlePasswordResetConfirm(): never
{
    if (requestMethod() !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'POST is required.'], 405);
    }
    $input = requestBody();
    $token = (string)($input['token'] ?? '');
    $password = (string)($input['password'] ?? '');
    if ($token === '') {
        jsonResponse(['success' => false, 'message' => 'Reset link is invalid or expired.'], 422);
    }
    $pwdError = validatePasswordComplexityServer($password);
    if ($pwdError !== null) {
        jsonResponse(['success' => false, 'message' => $pwdError], 422);
    }

    $tokenHash = hash('sha256', $token);
    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, staff_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ? LIMIT 1');
    $stmt->execute([$tokenHash]);
    $row = $stmt->fetch();

    if (!$row || $row['used_at'] !== null || strtotime((string)$row['expires_at']) < time()) {
        jsonResponse(['success' => false, 'message' => 'Reset link is invalid or expired.'], 400);
    }

    $pdo->beginTransaction();
    try {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $pdo->prepare('UPDATE staff_members SET password_hash = ? WHERE id = ?')->execute([$hash, $row['staff_id']]);
        $pdo->prepare('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([$row['id']]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        error_log('Password reset confirm failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Could not reset password. Please try again.'], 500);
    }

    logActivity('password_reset_completed', 'staff', (int)$row['staff_id'], ['staff_id' => $row['staff_id']]);
    jsonResponse(['success' => true, 'message' => 'Password updated. Sign in with your new password.']);
}
