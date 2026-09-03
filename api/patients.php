<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

// GET /patients, GET /patients/{id}/sales, GET/POST /regular-patients.
// Patient records themselves are created automatically from real sales (see
// upsertPatientFromSale in sales.php) - there's no manual "add patient" form
// in the app, matching how it worked before this was wired to the API.

function handlePatients(array $segments, array $user): never
{
    $pdo = db();
    $id = isset($segments[1]) && ctype_digit($segments[1]) ? (int)$segments[1] : null;

    if ($id !== null && ($segments[2] ?? '') === 'sales' && requestMethod() === 'GET') {
        $patientStmt = $pdo->prepare('SELECT phone, name FROM patients WHERE id = ? LIMIT 1');
        $patientStmt->execute([$id]);
        $patient = $patientStmt->fetch();
        if (!$patient) {
            jsonResponse(['success' => false, 'message' => 'Patient not found.'], 404);
        }

        // Matches how patients were identified before: by phone when
        // available, else by exact name.
        if (!empty($patient['phone'])) {
            $salesStmt = $pdo->prepare('SELECT * FROM sales_log WHERE customer_phone = ? ORDER BY created_at DESC LIMIT 100');
            $salesStmt->execute([$patient['phone']]);
        } else {
            $salesStmt = $pdo->prepare('SELECT * FROM sales_log WHERE customer_name = ? ORDER BY created_at DESC LIMIT 100');
            $salesStmt->execute([$patient['name']]);
        }
        $sales = $salesStmt->fetchAll();

        if ($sales) {
            $saleIds = array_column($sales, 'id');
            $placeholders = implode(',', array_fill(0, count($saleIds), '?'));
            $itemsStmt = $pdo->prepare("SELECT si.*, m.name AS medicine_name FROM sale_items si INNER JOIN medicines m ON m.id = si.medicine_id WHERE si.sale_id IN ({$placeholders})");
            $itemsStmt->execute($saleIds);
            $itemsBySale = [];
            foreach ($itemsStmt->fetchAll() as $item) {
                $itemsBySale[$item['sale_id']][] = $item;
            }
            foreach ($sales as &$sale) {
                $sale['items'] = $itemsBySale[$sale['id']] ?? [];
            }
            unset($sale);
        }

        jsonResponse(['success' => true, 'sales' => $sales]);
    }

    if (requestMethod() === 'GET') {
        $stmt = $pdo->query('SELECT id, name, phone, age, gender, address, visits, email, last_visit, created_at FROM patients ORDER BY last_visit DESC LIMIT 500');
        jsonResponse(['success' => true, 'patients' => $stmt->fetchAll()]);
    }

    jsonResponse(['success' => false, 'message' => 'Unsupported patients operation.'], 405);
}

function handleRegularPatients(array $segments, array $user): never
{
    $pdo = db();

    if (requestMethod() === 'GET') {
        $stmt = $pdo->query('SELECT * FROM regular_patients ORDER BY last_purchase_date DESC');
        jsonResponse(['success' => true, 'regular_patients' => $stmt->fetchAll()]);
    }

    if (requestMethod() === 'POST') {
        requireRole(['Owner', 'Co-owner', 'Staff']);
        $input = requestBody();
        $name = trim((string)($input['name'] ?? ''));
        $phone = trim((string)($input['phone'] ?? ''));
        if ($name === '' || $phone === '') {
            jsonResponse(['success' => false, 'message' => 'Name and phone are required.'], 422);
        }

        $medicines = $input['regular_medicines'] ?? [];
        $medicinesText = is_array($medicines) ? implode(', ', $medicines) : (string)$medicines;

        // An id in the payload means "update this existing record" (matches
        // the frontend's edit flow), otherwise create a new one.
        $existingId = (int)($input['id'] ?? 0);
        if ($existingId > 0) {
            $check = $pdo->prepare('SELECT id FROM regular_patients WHERE id = ? LIMIT 1');
            $check->execute([$existingId]);
        }

        if ($existingId > 0 && $check->fetch()) {
            $stmt = $pdo->prepare('UPDATE regular_patients SET name=?, phone=?, email=?, condition_name=?, regular_medicines=?, refill_cycle_days=?, reminder_days_before=?, notes=? WHERE id=?');
            $stmt->execute([
                $name, $phone, trim((string)($input['email'] ?? '')) ?: null,
                trim((string)($input['condition'] ?? '')) ?: null, $medicinesText,
                max((int)($input['courseDays'] ?? 30), 1), max((int)($input['reminderDays'] ?? 25), 1),
                trim((string)($input['notes'] ?? '')) ?: null, $existingId
            ]);
            $id = $existingId;
        } else {
            $id = random_int(1000000000, 9999999999);
            $stmt = $pdo->prepare('INSERT INTO regular_patients (id, name, phone, email, condition_name, regular_medicines, refill_cycle_days, reminder_days_before, notes, last_purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $id, $name, $phone, trim((string)($input['email'] ?? '')) ?: null,
                trim((string)($input['condition'] ?? '')) ?: null, $medicinesText,
                max((int)($input['courseDays'] ?? 30), 1), max((int)($input['reminderDays'] ?? 25), 1),
                trim((string)($input['notes'] ?? '')) ?: null,
                trim((string)($input['lastPurchaseDate'] ?? '')) ?: date('Y-m-d')
            ]);
        }

        logActivity($existingId > 0 ? 'regular_patient_updated' : 'regular_patient_created', 'regular_patient', $id, $user, ['name' => $name]);
        jsonResponse(['success' => true, 'regular_patient_id' => $id], $existingId > 0 ? 200 : 201);
    }

    jsonResponse(['success' => false, 'message' => 'Unsupported regular-patient operation.'], 405);
}

// Called from sales.php right after a sale is committed. A "visit" is a real
// sale, so this is the one correct place to track it - not a separate
// manual form the way the old client-only version worked.
function upsertPatientFromSale(PDO $pdo, ?string $name, ?string $phone): void
{
    if ($name === null && $phone === null) return;
    $name = $name ?: 'Walk-in Customer';

    if ($phone) {
        $stmt = $pdo->prepare('SELECT id FROM patients WHERE phone = ? LIMIT 1');
        $stmt->execute([$phone]);
    } else {
        $stmt = $pdo->prepare('SELECT id FROM patients WHERE phone IS NULL AND name = ? LIMIT 1');
        $stmt->execute([$name]);
    }
    $existing = $stmt->fetch();

    if ($existing) {
        $pdo->prepare('UPDATE patients SET visits = visits + 1, last_visit = CURRENT_TIMESTAMP, name = ? WHERE id = ?')
            ->execute([$name, $existing['id']]);
    } else {
        $id = random_int(1000000000, 9999999999);
        $pdo->prepare('INSERT INTO patients (id, name, phone, visits, last_visit) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)')
            ->execute([$id, $name, $phone]);
    }
}
