<?php
declare(strict_types=1);

/**
 * Transactional inventory API.
 *
 * All quantity changes lock the medicine row, validate the configured stock
 * unit, update current stock, and write stock_movements in the same DB
 * transaction. Strips are converted to base tablet units only for validation;
 * the user-facing quantity remains strips.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

function stockAllowedUnits(): array
{
    return ['strip', 'bottle', 'vial', 'tube', 'inhaler', 'sachet', 'ampoule', 'piece'];
}

function stockUnitForMedicine(array $medicine): string
{
    return strtolower(trim((string)$medicine['unit_label'])) ?: 'strip';
}

function stockBaseQuantity(int $quantity, string $unit, int $tabletsPerStrip): int
{
    if ($quantity <= 0) {
        jsonResponse(['success' => false, 'message' => 'Quantity must be greater than zero.'], 422);
    }
    return $unit === 'strip' ? $quantity * max($tabletsPerStrip, 1) : $quantity;
}

function lockMedicine(PDO $pdo, int $medicineId): array
{
    $stmt = $pdo->prepare('SELECT * FROM medicines WHERE id = ? LIMIT 1 FOR UPDATE');
    $stmt->execute([$medicineId]);
    $medicine = $stmt->fetch();
    if (!$medicine) {
        jsonResponse(['success' => false, 'message' => 'Medicine not found.'], 404);
    }
    $unit = stockUnitForMedicine($medicine);
    if (!in_array($unit, stockAllowedUnits(), true)) {
        jsonResponse(['success' => false, 'message' => 'Medicine has an invalid stock unit.'], 422);
    }
    return $medicine;
}

function recordMovement(PDO $pdo, int $medicineId, ?string $batch, string $type, int $quantity, string $unit, int $baseQuantity, ?string $referenceType, ?int $referenceId, ?string $reason, array $user): void
{
    $stmt = $pdo->prepare('INSERT INTO stock_movements (medicine_id, batch_number, movement_type, quantity, unit_label, quantity_in_base_units, reference_type, reference_id, reason, performed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $medicineId,
        $batch,
        $type,
        $quantity,
        $unit,
        $baseQuantity,
        $referenceType,
        $referenceId,
        $reason,
        $user['id'] ?? null,
    ]);
}

function changeStock(int $medicineId, int $quantity, string $movementType, array $user, ?string $referenceType = null, ?int $referenceId = null, ?string $reason = null, bool $allowNegative = false): array
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $medicine = lockMedicine($pdo, $medicineId);
        $unit = stockUnitForMedicine($medicine);
        $base = stockBaseQuantity($quantity, $unit, (int)$medicine['tablets_per_strip']);
        $current = (int)$medicine['current_stock_quantity'];
        $currentBase = (int)$medicine['current_stock_base_units'];

        $incomingTypes = ['purchase_received', 'customer_return'];
        $isIncoming = in_array($movementType, $incomingTypes, true);
        $newQuantity = $isIncoming ? $current + $quantity : $current - $quantity;
        $newBase = $isIncoming ? $currentBase + $base : $currentBase - $base;

        if (!$allowNegative && ($newQuantity < 0 || $newBase < 0)) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => 'Insufficient stock. Sale/return/disposal cannot reduce stock below zero.',
                'available_quantity' => $current,
                'unit_label' => $unit,
            ], 409);
        }

        $stmt = $pdo->prepare('UPDATE medicines SET current_stock_quantity = ?, current_stock_base_units = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$newQuantity, $newBase, $medicineId]);

        recordMovement($pdo, $medicineId, $medicine['batch_number'] ?? null, $movementType, $quantity, $unit, $base, $referenceType, $referenceId, $reason, $user);
        $pdo->commit();

        logActivity('stock_' . $movementType, 'medicine', $medicineId, $user, [
            'quantity' => $quantity,
            'unit_label' => $unit,
            'base_quantity' => $base,
            'new_stock_quantity' => $newQuantity,
        ]);

        return [
            'medicine_id' => $medicineId,
            'medicine_name' => $medicine['name'],
            'quantity' => $newQuantity,
            'unit_label' => $unit,
            'base_units' => $newBase,
        ];
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function handleStock(array $segments, array $user): never
{
    $action = $segments[1] ?? '';
    $input = requestBody();
    $medicineId = (int)($input['medicine_id'] ?? 0);
    $quantity = (int)($input['quantity'] ?? 0);

    if ($medicineId <= 0) {
        jsonResponse(['success' => false, 'message' => 'medicine_id is required.'], 422);
    }

    $rolesAllStock = ['Owner', 'Co-owner', 'Staff'];

    if ($action === 'receive' && requestMethod() === 'POST') {
        if (!in_array(strtolower((string)$user['role']), array_map('strtolower', $rolesAllStock), true)) {
            jsonResponse(['success' => false, 'message' => 'You do not have permission to receive stock.'], 403);
        }
        $result = changeStock($medicineId, $quantity, 'purchase_received', $user, 'dealer_order', isset($input['reference_id']) ? (int)$input['reference_id'] : null, trim((string)($input['reason'] ?? 'Stock received')));
        jsonResponse(['success' => true, 'message' => 'Stock received successfully.', 'stock' => $result], 201);
    }

    if ($action === 'sell' && requestMethod() === 'POST') {
        $result = changeStock($medicineId, $quantity, 'sale', $user, 'sale', isset($input['reference_id']) ? (int)$input['reference_id'] : null, 'Stock sold');
        jsonResponse(['success' => true, 'message' => 'Stock reduced for sale.', 'stock' => $result]);
    }

    if ($action === 'customer-return' && requestMethod() === 'POST') {
        $result = changeStock($medicineId, $quantity, 'customer_return', $user, 'sales_return', isset($input['reference_id']) ? (int)$input['reference_id'] : null, trim((string)($input['reason'] ?? 'Customer return')));
        jsonResponse(['success' => true, 'message' => 'Customer return added back to stock.', 'stock' => $result]);
    }

    if ($action === 'disposal' && requestMethod() === 'POST') {
        requireRole(['Owner', 'Co-owner']);
        $result = changeStock($medicineId, $quantity, 'disposal', $user, 'disposal', isset($input['reference_id']) ? (int)$input['reference_id'] : null, trim((string)($input['reason'] ?? 'Disposed stock')));
        jsonResponse(['success' => true, 'message' => 'Stock disposed successfully.', 'stock' => $result]);
    }

    if ($action === 'dealer-return' && requestMethod() === 'POST') {
        requireRole(['Owner', 'Co-owner']);
        $result = changeStock($medicineId, $quantity, 'dealer_return', $user, 'dealer_return', isset($input['reference_id']) ? (int)$input['reference_id'] : null, trim((string)($input['reason'] ?? 'Returned to dealer')));
        jsonResponse(['success' => true, 'message' => 'Stock returned to dealer.', 'stock' => $result]);
    }

    if ($action === 'history' && requestMethod() === 'GET') {
        $pdo = db();
        $limit = min(max((int)($_GET['limit'] ?? 100), 1), 500);
        $stmt = $pdo->prepare('SELECT sm.*, m.name AS medicine_name FROM stock_movements sm INNER JOIN medicines m ON m.id = sm.medicine_id WHERE sm.medicine_id = ? ORDER BY sm.created_at DESC LIMIT ' . $limit);
        $stmt->execute([$medicineId]);
        jsonResponse(['success' => true, 'movements' => $stmt->fetchAll()]);
    }

    jsonResponse(['success' => false, 'message' => 'Unsupported stock operation.'], 405);
}
