<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

function verificationBaseQuantity(int $quantity, string $unit, int $tabletsPerStrip): int
{
    if ($quantity < 0) throw new InvalidArgumentException('Quantity cannot be negative.');
    return $unit === 'strip' ? $quantity * max($tabletsPerStrip, 1) : $quantity;
}

function recalculateMedicineStock(PDO $pdo, int $medicineId): void
{
    $stmt = $pdo->prepare('SELECT COALESCE(SUM(quantity),0) AS q, COALESCE(SUM(base_quantity),0) AS b FROM medicine_batches WHERE medicine_id = ?');
    $stmt->execute([$medicineId]);
    $totals = $stmt->fetch();
    $stmt = $pdo->prepare('UPDATE medicines SET current_stock_quantity = ?, current_stock_base_units = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute([(int)$totals['q'], (int)$totals['b'], $medicineId]);
}

function verifyPurchaseReceipt(array $input, array $user): never
{
    requireRole(['Owner', 'Co-owner', 'Staff']);
    $orderId = (int)($input['purchase_order_id'] ?? 0);
    $items = $input['items'] ?? null;
    if ($orderId <= 0 || !is_array($items) || !$items) {
        jsonResponse(['success' => false, 'message' => 'Purchase order and received items are required.'], 422);
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT * FROM purchase_orders WHERE id = ? FOR UPDATE');
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();
        if (!$order) throw new InvalidArgumentException('Purchase order not found.');
        if (in_array(($order['status'] ?? ''), ['Received', 'Cancelled'], true)) {
            throw new InvalidArgumentException('This purchase order has already been processed.');
        }

        $verificationId = random_int(1000000000, 9999999999);
        $acceptedAny = false;
        $rejectedAny = false;
        $affectedMedicines = [];

        $stmt = $pdo->prepare('INSERT INTO purchase_receipt_verifications (id, purchase_order_id, dealer_id, status, verified_by) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$verificationId, $orderId, $order['dealer_id'] ?? null, 'Pending', $user['id'] ?? null]);

        foreach ($items as $item) {
            if (!is_array($item)) throw new InvalidArgumentException('Invalid purchase verification item.');

            $purchaseItemId = (int)($item['purchase_item_id'] ?? 0);
            if ($purchaseItemId <= 0) throw new InvalidArgumentException('purchase_item_id is required for every received item.');

            $stmt = $pdo->prepare('SELECT * FROM purchase_items WHERE id = ? AND purchase_id = ? FOR UPDATE');
            $stmt->execute([$purchaseItemId, $orderId]);
            $purchaseItem = $stmt->fetch();
            if (!$purchaseItem) throw new InvalidArgumentException('Purchase item does not belong to this purchase order.');
            if ((int)$purchaseItem['received_quantity'] > 0) throw new InvalidArgumentException('A purchase item has already been received.');

            $expectedMedicineId = (int)$purchaseItem['medicine_id'];
            $receivedMedicineId = (int)($item['medicine_id'] ?? $expectedMedicineId);
            $ordered = max((int)$purchaseItem['quantity'], 0);
            $received = max((int)($item['received_quantity'] ?? 0), 0);
            $accepted = max((int)($item['accepted_quantity'] ?? 0), 0);
            $rejected = max((int)($item['rejected_quantity'] ?? ($received - $accepted)), 0);
            $unit = strtolower(trim((string)($item['unit_label'] ?? $purchaseItem['unit_label'])));
            $batchNumber = trim((string)($item['batch_number'] ?? ''));
            $expiryDate = trim((string)($item['expiry_date'] ?? ''));
            $reason = trim((string)($item['rejection_reason'] ?? ''));
            $notes = trim((string)($item['rejection_notes'] ?? '')) ?: null;

            if ($received <= 0) throw new InvalidArgumentException('Received quantity must be greater than zero.');
            if ($received !== $accepted + $rejected || $accepted > $received) throw new InvalidArgumentException('Invalid received/accepted/rejected quantity.');
            if ($accepted > $ordered) throw new InvalidArgumentException('Accepted quantity cannot exceed ordered quantity.');
            if ($received > $ordered && $rejected < ($received - $ordered)) throw new InvalidArgumentException('Quantity above the ordered amount must be rejected as Extra Item.');
            if ($receivedMedicineId <= 0) throw new InvalidArgumentException('A valid received medicine is required.');
            if ($unit !== strtolower(trim((string)$purchaseItem['unit_label']))) throw new InvalidArgumentException('Stock unit does not match the purchase item.');

            $isWrongProduct = $receivedMedicineId !== $expectedMedicineId;
            if ($isWrongProduct && $accepted > 0) throw new InvalidArgumentException('Wrong Product cannot be accepted into stock.');
            if ($rejected > 0 && $reason === '') $reason = $isWrongProduct ? 'Wrong Product' : (($received > $ordered) ? 'Extra Item' : 'Other');
            if ($rejected > 0 && $reason === '') throw new InvalidArgumentException('A rejection reason is required for rejected stock.');

            if ($accepted > 0) {
                if ($batchNumber === '' || $expiryDate === '') throw new InvalidArgumentException('Batch number and expiry date are required for accepted stock.');
                if ($expiryDate < date('Y-m-d')) throw new InvalidArgumentException('Expired stock cannot be accepted.');
            }

            $stmt = $pdo->prepare('SELECT * FROM medicines WHERE id = ? FOR UPDATE');
            $stmt->execute([$receivedMedicineId]);
            $medicine = $stmt->fetch();
            if (!$medicine) throw new InvalidArgumentException('Received medicine not found: ' . $receivedMedicineId);

            $stmt = $pdo->prepare('INSERT INTO purchase_receipt_verification_items (verification_id, purchase_item_id, expected_medicine_id, medicine_id, ordered_quantity, received_quantity, accepted_quantity, rejected_quantity, rejection_reason, rejection_notes, batch_number, expiry_date, unit_label) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$verificationId, $purchaseItemId, $expectedMedicineId, $receivedMedicineId, $ordered, $received, $accepted, $rejected, $rejected > 0 ? $reason : null, $notes, $batchNumber ?: null, $expiryDate ?: null, $unit]);

            if ($accepted > 0) {
                $tabletsPerStrip = (int)($purchaseItem['tablets_per_strip'] ?? $medicine['tablets_per_strip'] ?? 10);
                $baseQuantity = verificationBaseQuantity($accepted, $unit, $tabletsPerStrip);
                $purchasePrice = (float)($item['purchase_price'] ?? $purchaseItem['purchase_price'] ?? 0);
                $mrp = (float)($item['mrp'] ?? $purchaseItem['mrp'] ?? $medicine['strip_mrp'] ?? 0);
                $sellingPrice = (float)($item['selling_price'] ?? $purchaseItem['selling_price'] ?? $medicine['strip_selling_price'] ?? 0);
                if ($purchasePrice < 0 || $mrp < 0 || $sellingPrice < 0) throw new InvalidArgumentException('Batch prices cannot be negative.');

                $stmt = $pdo->prepare('SELECT * FROM medicine_batches WHERE medicine_id = ? AND batch_number = ? FOR UPDATE');
                $stmt->execute([$expectedMedicineId, $batchNumber]);
                $batch = $stmt->fetch();
                if ($batch) {
                    if ($batch['expiry_date'] !== $expiryDate || strtolower((string)$medicine['unit_label']) !== $unit) throw new InvalidArgumentException('Existing batch details do not match.');
                    $newQuantity = (int)$batch['quantity'] + $accepted;
                    $newBase = (int)$batch['base_quantity'] + $baseQuantity;
                    $stmt = $pdo->prepare('UPDATE medicine_batches SET quantity = ?, base_quantity = ?, purchase_price = ?, mrp = ?, selling_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
                    $stmt->execute([$newQuantity, $newBase, $purchasePrice, $mrp, $sellingPrice, (int)$batch['id']]);
                } else {
                    $batchId = random_int(1000000000, 9999999999);
                    $stmt = $pdo->prepare('INSERT INTO medicine_batches (id, medicine_id, batch_number, expiry_date, quantity, base_quantity, purchase_price, mrp, selling_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
                    $stmt->execute([$batchId, $expectedMedicineId, $batchNumber, $expiryDate, $accepted, $baseQuantity, $purchasePrice, $mrp, $sellingPrice]);
                }

                $stmt = $pdo->prepare('INSERT INTO stock_movements (medicine_id, batch_number, movement_type, quantity, unit_label, quantity_in_base_units, reference_type, reference_id, reason, performed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([$expectedMedicineId, $batchNumber, 'purchase_received', $accepted, $unit, $baseQuantity, 'purchase_order', $orderId, 'Accepted purchase receipt', $user['id'] ?? null]);
                $stmt = $pdo->prepare('UPDATE purchase_items SET received_quantity = ? WHERE id = ?');
                $stmt->execute([$accepted, $purchaseItemId]);
                $affectedMedicines[$expectedMedicineId] = true;
                $acceptedAny = true;
            } else {
                $stmt = $pdo->prepare('UPDATE purchase_items SET received_quantity = 0 WHERE id = ?');
                $stmt->execute([$purchaseItemId]);
            }

            $rejectedAny = $rejectedAny || $rejected > 0;
        }

        foreach (array_keys($affectedMedicines) as $medicineId) recalculateMedicineStock($pdo, (int)$medicineId);

        $status = $acceptedAny && $rejectedAny ? 'Partially Accepted' : ($acceptedAny ? 'Accepted' : 'Rejected');
        $stmt = $pdo->prepare('UPDATE purchase_receipt_verifications SET status = ?, verified_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$status, $verificationId]);
        $orderStatus = $acceptedAny ? 'Received' : 'Cancelled';
        $stmt = $pdo->prepare('UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$orderStatus, $orderId]);

        $pdo->commit();
        logActivity('purchase_receipt_verified', 'purchase_order', $orderId, $user, ['verification_id' => $verificationId, 'status' => $status]);
        jsonResponse(['success' => true, 'verification_id' => $verificationId, 'status' => $status], 201);
    } catch (InvalidArgumentException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => $e->getMessage()], 422);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

function handlePurchaseVerification(array $segments, array $user): never
{
    if (requestMethod() === 'POST') verifyPurchaseReceipt(requestBody(), $user);
    jsonResponse(['success' => false, 'message' => 'Unsupported purchase verification operation.'], 405);
}
