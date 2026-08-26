<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/stock.php';

cors();
if (requestMethod() === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $path = preg_replace('#^/api#', '', $path);
    $path = trim($path, '/');
    $segments = $path === '' ? [] : explode('/', $path);

    if (($segments[0] ?? '') === 'auth' && ($segments[1] ?? '') === 'login') {
        handleLogin();
    }

    $user = authenticatedUser();

    if (($segments[0] ?? '') === 'me' && requestMethod() === 'GET') {
        jsonResponse(['success' => true, 'user' => $user]);
    }

    if (($segments[0] ?? '') === 'medicines') {
        handleMedicines($segments, $user);
    }

    if (($segments[0] ?? '') === 'stock') {
        handleStock($segments, $user);
    }

    jsonResponse(['success' => false, 'message' => 'API endpoint not found.'], 404);
} catch (Throwable $e) {
    error_log('Sree Manju Pharmacy API: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'An internal server error occurred.'], 500);
}

function handleMedicines(array $segments, array $user): never
{
    $pdo = db();
    $id = isset($segments[1]) && ctype_digit($segments[1]) ? (int)$segments[1] : null;

    if (requestMethod() === 'GET') {
        if ($id !== null) {
            $stmt = $pdo->prepare('SELECT * FROM medicines WHERE id = ? LIMIT 1');
            $stmt->execute([$id]);
            $medicine = $stmt->fetch();
            if (!$medicine) {
                jsonResponse(['success' => false, 'message' => 'Medicine not found.'], 404);
            }
            jsonResponse(['success' => true, 'medicine' => $medicine]);
        }

        $search = trim((string)($_GET['search'] ?? ''));
        $limit = min(max((int)($_GET['limit'] ?? 50), 1), 200);
        if ($search !== '') {
            $like = '%' . $search . '%';
            $stmt = $pdo->prepare('SELECT * FROM medicines WHERE name LIKE ? OR generic_name LIKE ? OR barcode LIKE ? ORDER BY name LIMIT ' . $limit);
            $stmt->execute([$like, $like, $like]);
        } else {
            $stmt = $pdo->query('SELECT * FROM medicines ORDER BY name LIMIT ' . $limit);
        }
        jsonResponse(['success' => true, 'medicines' => $stmt->fetchAll()]);
    }

    if (requestMethod() === 'POST') {
        $input = requestBody();
        $name = trim((string)($input['name'] ?? ''));
        if ($name === '') {
            jsonResponse(['success' => false, 'message' => 'Medicine name is required.'], 422);
        }

        $allowedUnits = ['strip', 'bottle', 'vial', 'tube', 'inhaler', 'sachet', 'ampoule', 'piece'];
        $unit = strtolower(trim((string)($input['unit_label'] ?? 'strip')));
        if (!in_array($unit, $allowedUnits, true)) {
            jsonResponse(['success' => false, 'message' => 'Invalid stock unit.'], 422);
        }

        $medicineId = (int)($input['id'] ?? 0);
        if ($medicineId <= 0) {
            $medicineId = random_int(1000000000, 9999999999);
        }

        $stmt = $pdo->prepare('INSERT INTO medicines (id, name, generic_name, category, formulation, manufacturer, barcode, batch_number, expiry_date, tablets_per_strip, strip_purchase_price, strip_mrp, strip_selling_price, tablet_selling_price, unit_label, dealer_id, location, minimum_stock, prescription_required) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $medicineId,
            $name,
            trim((string)($input['generic_name'] ?? '')) ?: null,
            trim((string)($input['category'] ?? '')) ?: null,
            trim((string)($input['formulation'] ?? '')) ?: null,
            trim((string)($input['manufacturer'] ?? '')) ?: null,
            trim((string)($input['barcode'] ?? '')) ?: null,
            trim((string)($input['batch_number'] ?? '')) ?: null,
            $input['expiry_date'] ?? null,
            max((int)($input['tablets_per_strip'] ?? 10), 1),
            $input['strip_purchase_price'] ?? null,
            $input['strip_mrp'] ?? null,
            $input['strip_selling_price'] ?? null,
            $input['tablet_selling_price'] ?? null,
            $unit,
            !empty($input['dealer_id']) ? (int)$input['dealer_id'] : null,
            trim((string)($input['location'] ?? '')) ?: null,
            max((int)($input['minimum_stock'] ?? 0), 0),
            !empty($input['prescription_required']),
        ]);
        logActivity('medicine_created', 'medicine', $medicineId, $user, ['name' => $name, 'unit_label' => $unit]);
        jsonResponse(['success' => true, 'medicine_id' => $medicineId], 201);
    }

    if (requestMethod() === 'DELETE' && $id !== null) {
        requireRole(['Owner']);
        $stmt = $pdo->prepare('DELETE FROM medicines WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) {
            jsonResponse(['success' => false, 'message' => 'Medicine not found.'], 404);
        }
        logActivity('medicine_deleted', 'medicine', $id, $user);
        jsonResponse(['success' => true]);
    }

    jsonResponse(['success' => false, 'message' => 'Unsupported medicines operation.'], 405);
}
