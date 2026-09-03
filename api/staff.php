<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

// GET/POST /staff, PATCH /staff/{id}/status, POST /staff/{id}/password.
// Everything here is Owner/Co-owner only - it lists and edits every staff
// member's contact details and can change credentials, so it's the most
// sensitive endpoint in the app after auth itself.

function handleStaff(array $segments, array $user): never
{
    requireRole(['Owner', 'Co-owner']);
    $pdo = db();
    $id = isset($segments[1]) && ctype_digit($segments[1]) ? (int)$segments[1] : null;

    if ($id !== null && ($segments[2] ?? '') === 'status' && requestMethod() === 'PATCH') {
        $stmt = $pdo->prepare('SELECT id, status FROM staff_members WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $staff = $stmt->fetch();
        if (!$staff) {
            jsonResponse(['success' => false, 'message' => 'Staff member not found.'], 404);
        }
        $newStatus = strcasecmp((string)$staff['status'], 'Active') === 0 ? 'Inactive' : 'Active';
        $pdo->prepare('UPDATE staff_members SET status = ? WHERE id = ?')->execute([$newStatus, $id]);
        logActivity('staff_status_changed', 'staff', $id, $user, ['status' => $newStatus]);
        jsonResponse(['success' => true, 'status' => $newStatus]);
    }

    if ($id !== null && ($segments[2] ?? '') === 'password' && requestMethod() === 'POST') {
        $input = requestBody();
        $password = (string)($input['password'] ?? '');
        $pwdError = validatePasswordComplexityServer($password);
        if ($pwdError !== null) {
            jsonResponse(['success' => false, 'message' => $pwdError], 422);
        }
        $stmt = $pdo->prepare('SELECT id FROM staff_members WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            jsonResponse(['success' => false, 'message' => 'Staff member not found.'], 404);
        }
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $pdo->prepare('UPDATE staff_members SET password_hash = ? WHERE id = ?')->execute([$hash, $id]);
        logActivity('staff_password_reset', 'staff', $id, $user);
        jsonResponse(['success' => true]);
    }

    if (requestMethod() === 'GET') {
        $stmt = $pdo->query("SELECT id, name, COALESCE(role_label, role) AS role, email, phone, shift, status, join_date FROM staff_members ORDER BY join_date DESC, id DESC");
        jsonResponse(['success' => true, 'staff' => $stmt->fetchAll()]);
    }

    if (requestMethod() === 'POST') {
        $input = requestBody();
        $name = trim((string)($input['name'] ?? ''));
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $phone = trim((string)($input['phone'] ?? ''));
        $roleLabel = trim((string)($input['role'] ?? 'Staff Pharmacist'));
        $shift = trim((string)($input['shift'] ?? 'General Shift'));
        $password = (string)($input['tempPassword'] ?? '');

        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['success' => false, 'message' => 'A name and a valid email are required.'], 422);
        }
        $pwdError = validatePasswordComplexityServer($password);
        if ($pwdError !== null) {
            jsonResponse(['success' => false, 'message' => $pwdError], 422);
        }

        $dup = $pdo->prepare('SELECT id FROM staff_members WHERE email = ? LIMIT 1');
        $dup->execute([$email]);
        if ($dup->fetch()) {
            jsonResponse(['success' => false, 'message' => 'A staff member with that email already exists.'], 409);
        }

        // "Owner"/"Co-owner" role labels aren't offered by this form (the
        // Login page's self-registration flow is the only path to those,
        // capped at one each) - anything created here is a working Staff
        // account with whatever display title the Owner gives it.
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $staffId = random_int(1000000000, 9999999999);
        $stmt = $pdo->prepare('INSERT INTO staff_members (id, name, role, email, phone, password_hash, shift, status, join_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)');
        $stmt->execute([$staffId, $name, 'Staff', $email, $phone ?: null, $hash, $shift, 'Active']);

        // role_label carries the display title shown in the UI (e.g.
        // "Pharmacist"); role stays the coarse 'Staff' permission tier.
        $pdo->prepare('UPDATE staff_members SET role_label = ? WHERE id = ?')->execute([$roleLabel, $staffId]);

        logActivity('staff_registered', 'staff', $staffId, $user, ['name' => $name, 'role' => $roleLabel, 'email' => $email]);
        jsonResponse(['success' => true, 'staff_id' => $staffId], 201);
    }

    jsonResponse(['success' => false, 'message' => 'Unsupported staff operation.'], 405);
}
