<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/stock.php';

function dealerId(): int
{
    $id = (int)($_POST['id'] ?? 0);
    return $id;
}

function handleDealers(array $segments, array $user): never
{
    $pdo = db();
    $action = $segments[1] ?? '';

    if ($action === '' && requestMethod() === 'GET') {
        $stmt = $pdo->query('SELECT id, name, representative_name, contact_number, email, address, gstin, drug_license, pending_orders, created_at FROM dealers ORDER BY name');
        jsonResponse(['success' => true, 'dealers' => $stmt->fetchAll()]);
    }

    if ($action === '' && requestMethod() === 'POST') {
        requireRole(['Owner', 'Co-owner']);
        $input = requestBody();
        $name = trim((string)($input['name'] ?? ''));
        if ($name === '') {
            jsonResponse(['success' => false, 'message' => 'Dealer name is required.'], 422);
        }
        $id = random_int(1000000000, 9999999999);
        $stmt = $pdo->prepare('INSERT INTO dealers (id, name, representative_name, contact_number, email, address, gstin, drug_license) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$id, $name, trim((string)($input['representative_name'] ?? '')) ?: null, trim((string)($input['contact_number'] ?? '')) ?: null, trim((string)($input['email'] ?? '')) ?: null, trim((string)($input['address'] ?? '')) ?: null, trim((string)($input['gstin'] ?? '')) ?: null, trim((string)($input['drug_license'] ?? '')) ?: null]);
        logActivity('dealer_created', 'dealer', $id, $user, ['name' => $name]);
        jsonResponse(['success' => true, 'dealer_id' => $id], 201);
    }

    if ($action === 'purchases' && requestMethod() === 'POST') {
        createPurchase(requestBody(), $user);
    }

    if ($action === 'purchases' && requestMethod() === 'GET') {
        $stmt = $pdo->query('SELECT po.*, d.name AS dealer_name FROM purchase_orders po INNER JOIN dealers d ON d.id = po.dealer_id ORDER BY po.created_at DESC LIMIT 200');
        jsonResponse(['success' => true, 'purchases' => $stmt->fetchAll()]);
    }

    if ($action === 'receive' && requestMethod() === 'POST') {
        receivePurchase(requestBody(), $user);
    }

    jsonResponse(['success' => false, 'message' => 'Unsupported dealer operation.'], 405);
}

function createPurchase(array $input, array $user): never
{
    requireRole(['Owner', 'Co-owner', 'Staff']);
    $dealerId = (int)($input['dealer_id'] ?? 0);
    $items = $input['items'] ?? null;
    if ($dealerId <= 0 || !is_array($items) || count($items) === 0) {
        jsonResponse(['success' => false, 'message' => 'dealer_id and at least one purchase item are required.'], 422);
    }

    $pdo = db();
    $stmt = $pdo->prepare('SELECT id FROM dealers WHERE id = ? LIMIT 1');
    $stmt->execute([$dealerId]);
    if (!$stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => 'Dealer not found.'], 404);
    }

    $pdo->beginTransaction();
    try {
        $purchaseId = random_int(1000000000, 9999999999);
        $orderNo = 'PO-' . date('Ymd-His') . '-' . strtoupper(bin2hex(random_bytes(3)));
        $total = 0.0;
        $validated = [];

        foreach ($items as $item) {
            $medicineId = (int)($item['medicine_id'] ?? 0);
            $quantity = (int)($item['quantity'] ?? 0);
            $unit = strtolower(trim((string)($item['unit_label'] ?? 'strip')));
            $batch = trim((string)($item['batch_number'] ?? ''));
            $expiry = (string)($item['expiry_date'] ?? '');
            $price = (float)($item['purchase_price'] ?? 0);
            if ($medicineId <= 0 || $quantity <= 0 || $batch === '' || $expiry === '' || $price <= 0) {
                throw new InvalidArgumentException('Each purchase item requires medicine, positive quantity, batch, expiry date and purchase price.');
            }
            if (!in_array($unit, stockAllowedUnits(), true)) {
                throw new InvalidArgumentException('Invalid purchase stock unit.');
            }
            if ($expiry < date('Y-m-d')) {
                throw new InvalidArgumentException('Expired stock cannot be received.');
            }
            $tabletsPerStrip = max((int)($item['tablets_per_strip'] ?? 10), 1);
            $validated[] = [$medicineId, $batch, $expiry, $quantity, $unit, $tabletsPerStrip, $price, isset($item['mrp']) ? (float)$item['mrp'] : null, isset($item['selling_price']) ? (float)$item['selling_price'] : null];
            $total += $quantity * $price;
        }

        $stmt = $pdo->prepare('INSERT INTO purchase_orders (id, order_no, dealer_id, status, total_cost, created_by) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$purchaseId, $orderNo, $dealerId, 'Ordered', round($total, 2), $user['id'] ?? null]);
        foreach ($validated as $item) {
            $stmt = $pdo->prepare('INSERT INTO purchase_items (purchase_id, medicine_id, batch_number, expiry_date, quantity, unit_label, tablets_per_strip, purchase_price, mrp, selling_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$purchaseId, ...$item]);
        }
        $pdo->commit();
        logActivity('purchase_created', 'purchase_order', $purchaseId, $user, ['order_no' => $orderNo, 'dealer_id' => $dealerId]);
        jsonResponse(['success' => true, 'purchase_id' => $purchaseId, 'order_no' => $orderNo, 'total_cost' => round($total, 2)], 201);
    } catch (InvalidArgumentException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => $e->getMessage()], 422);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

function receivePurchase(array $input, array $user): never
{
    requireRole(['Owner', 'Co-owner', 'Staff']);
    $purchaseId = (int)($input['purchase_id'] ?? 0);
    if ($purchaseId <= 0) {
        jsonResponse(['success' => false, 'message' => 'purchase_id is required.'], 422);
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT po.*, d.name AS dealer_name FROM purchase_orders po INNER JOIN dealers d ON d.id = po.dealer_id WHERE po.id = ? LIMIT 1 FOR UPDATE');
        $stmt->execute([$purchaseId]);
        $purchase = $stmt->fetch();
        if (!$purchase) {
            throw new InvalidArgumentException('Purchase order not found.');
        }
        if ($purchase['status'] === 'Received') {
            throw new InvalidArgumentException('This purchase order has already been received.');
        }

        $stmt = $pdo->prepare('SELECT * FROM purchase_items WHERE purchase_id = ? ORDER BY id FOR UPDATE');
        $stmt->execute([$purchaseId]);
        $items = $stmt->fetchAll();
        if (!$items) {
            throw new InvalidArgumentException('Purchase order contains no items.');
        }

        $receiptId = random_int(1000000000, 9999999999);
        $receiptNo = 'GRN-' . date('Ymd-His') . '-' . strtoupper(bin2hex(random_bytes(3)));
        $stmt = $pdo->prepare('INSERT INTO purchase_receipts (id, receipt_no, purchase_id, dealer_id, received_by, total_cost) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$receiptId, $receiptNo, $purchaseId, $purchase['dealer_id'], $user['id'] ?? null, $purchase['total_cost']]);

        foreach ($items as $item) {
            $medicineStmt = $pdo->prepare('SELECT * FROM medicines WHERE id = ? LIMIT 1 FOR UPDATE');
            $medicineStmt->execute([(int)$item['medicine_id']]);
            $medicine = $medicineStmt->fetch();
            if (!$medicine) {
                throw new InvalidArgumentException('Medicine not found for purchase item ' . $item['medicine_id']);
            }
            if (strtolower($medicine['unit_label']) !== strtolower($item['unit_label'])) {
                throw new InvalidArgumentException('Stock unit mismatch for ' . $medicine['name'] . '. Expected ' . $medicine['unit_label'] . '.');
            }

            $qty = (int)$item['quantity'];
            $base = stockBaseQuantity($qty, strtolower($item['unit_label']), (int)$item['tablets_per_strip']);
            $newQty = (int)$medicine['current_stock_quantity'] + $qty;
            $newBase = (int)$medicine['current_stock_base_units'] + $base;

            $stmt = $pdo->prepare('UPDATE medicines SET current_stock_quantity = ?, current_stock_base_units = ?, batch_number = ?, expiry_date = ?, tablets_per_strip = ?, strip_purchase_price = ?, strip_mrp = COALESCE(?, strip_mrp), strip_selling_price = COALESCE(?, strip_selling_price), dealer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
            $stmt->execute([$newQty, $newBase, $item['batch_number'], $item['expiry_date'], $item['tablets_per_strip'], $item['purchase_price'], $item['mrp'], $item['selling_price'], $purchase['dealer_id'], $medicine['id']]);

            recordMovement($pdo, (int)$medicine['id'], $item['batch_number'], 'purchase_received', $qty, strtolower($item['unit_label']), $base, 'purchase_receipt', $receiptId, 'Goods received ' . $receiptNo, $user);

            $stmt = $pdo->prepare('INSERT INTO purchase_receipt_items (receipt_id, purchase_item_id, medicine_id, batch_number, expiry_date, quantity, unit_label, purchase_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$receiptId, $item['id'], $medicine['id'], $item['batch_number'], $item['expiry_date'], $qty, $item['unit_label'], $item['purchase_price']]);
        }

        $stmt = $pdo->prepare("UPDATE purchase_orders SET status = 'Received', updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$purchaseId]);
        $pdo->commit();
        logActivity('purchase_received', 'purchase_order', $purchaseId, $user, ['receipt_no' => $receiptNo]);
        jsonResponse(['success' => true, 'receipt_id' => $receiptId, 'receipt_no' => $receiptNo], 201);
    } catch (InvalidArgumentException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => $e->getMessage()], 422);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}
