<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

function verifyPurchaseReceipt(array $input, array $user): never
{
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
        if (($order['status'] ?? '') === 'Received') throw new InvalidArgumentException('This purchase order has already been received.');

        $verificationId = random_int(1000000000, 9999999999);
        $acceptedAny = false;
        $rejectedAny = false;
        $stmt = $pdo->prepare('INSERT INTO purchase_receipt_verifications (id, purchase_order_id, dealer_id, status, verified_by) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$verificationId, $orderId, $order['dealer_id'] ?? null, 'Pending', $user['id'] ?? null]);

        foreach ($items as $item) {
            $medicineId = (int)($item['medicine_id'] ?? 0);
            $ordered = max((int)($item['ordered_quantity'] ?? 0), 0);
            $received = max((int)($item['received_quantity'] ?? 0), 0);
            $accepted = max((int)($item['accepted_quantity'] ?? 0), 0);
            $rejected = max((int)($item['rejected_quantity'] ?? ($received - $accepted)), 0);
            $unit = strtolower(trim((string)($item['unit_label'] ?? 'strip')));

            if ($medicineId <= 0 || $received !== $accepted + $rejected || $accepted > $received) {
                throw new InvalidArgumentException('Invalid received/accepted/rejected quantity for an item.');
            }
            if ($rejected > 0 && empty($item['rejection_reason'])) {
                throw new InvalidArgumentException('A rejection reason is required for rejected stock.');
            }
            $acceptedAny = $acceptedAny || $accepted > 0;
            $rejectedAny = $rejectedAny || $rejected > 0;

            $stmt = $pdo->prepare('INSERT INTO purchase_receipt_verification_items (verification_id, medicine_id, ordered_quantity, received_quantity, accepted_quantity, rejected_quantity, rejection_reason, rejection_notes, batch_number, expiry_date, unit_label) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$verificationId, $medicineId, $ordered, $received, $accepted, $rejected, $rejected > 0 ? $item['rejection_reason'] : null, trim((string)($item['rejection_notes'] ?? '')) ?: null, trim((string)($item['batch_number'] ?? '')) ?: null, $item['expiry_date'] ?? null, $unit]);
        }

        $status = $acceptedAny && $rejectedAny ? 'Partially Accepted' : ($acceptedAny ? 'Accepted' : 'Rejected');
        $stmt = $pdo->prepare('UPDATE purchase_receipt_verifications SET status = ?, verified_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$status, $verificationId]);
        $orderStatus = $acceptedAny ? 'Received' : 'Cancelled';
        $stmt = $pdo->prepare("UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
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
