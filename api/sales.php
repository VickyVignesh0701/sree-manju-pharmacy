<?php
declare(strict_types=1);

/**
 * Transactional billing API.
 *
 * The server calculates line totals from database prices and reduces stock in
 * the same transaction as the invoice. Client-supplied totals are ignored.
 * Stock quantities remain in the medicine's configured packaging label (for
 * example, strips), never a generic "unit" label.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

function createInvoiceNumber(): string
{
    return 'INV-' . date('Ymd-His') . '-' . strtoupper(bin2hex(random_bytes(3)));
}

function createSale(array $input, array $user): never
{
    $items = $input['items'] ?? null;
    if (!is_array($items) || count($items) === 0) {
        jsonResponse(['success' => false, 'message' => 'At least one medicine is required for billing.'], 422);
    }
    if (count($items) > 100) {
        jsonResponse(['success' => false, 'message' => 'A single bill cannot contain more than 100 line items.'], 422);
    }

    $paymentMode = trim((string)($input['payment_mode'] ?? 'Cash'));
    $allowedPayments = ['Cash', 'UPI', 'Card', 'Credit'];
    if (!in_array($paymentMode, $allowedPayments, true)) {
        jsonResponse(['success' => false, 'message' => 'Invalid payment mode.'], 422);
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $preparedItems = [];
        $subtotal = 0.0;
        $discountTotal = 0.0;
        $taxTotal = 0.0;
        $seenMedicines = [];

        foreach ($items as $item) {
            if (!is_array($item)) {
                throw new InvalidArgumentException('Invalid sale item.');
            }
            $medicineId = (int)($item['medicine_id'] ?? 0);
            $quantity = (int)($item['quantity'] ?? 0);
            if ($medicineId <= 0 || $quantity <= 0) {
                throw new InvalidArgumentException('Each sale item requires a valid medicine_id and positive quantity.');
            }
            if (isset($seenMedicines[$medicineId])) {
                throw new InvalidArgumentException('Do not send the same medicine twice in one bill. Combine its quantity.');
            }
            $seenMedicines[$medicineId] = true;

            $stmt = $pdo->prepare('SELECT * FROM medicines WHERE id = ? LIMIT 1 FOR UPDATE');
            $stmt->execute([$medicineId]);
            $medicine = $stmt->fetch();
            if (!$medicine) {
                throw new InvalidArgumentException('Medicine not found: ' . $medicineId);
            }

            $unit = strtolower(trim((string)$medicine['unit_label']));
            $requestedUnit = strtolower(trim((string)($item['unit_label'] ?? $unit)));
            if ($requestedUnit !== $unit) {
                throw new InvalidArgumentException('Stock unit mismatch for ' . $medicine['name'] . '. Use ' . $unit . '.');
            }

            $available = (int)$medicine['current_stock_quantity'];
            if ($quantity > $available) {
                throw new RuntimeException('Insufficient stock for ' . $medicine['name'] . '. Available: ' . $available . ' ' . $unit . '.');
            }

            $unitPrice = $unit === 'strip'
                ? (float)($medicine['strip_selling_price'] ?? 0)
                : (float)($medicine['strip_selling_price'] ?? 0);
            if ($unitPrice <= 0) {
                throw new InvalidArgumentException('Selling price is not configured for ' . $medicine['name'] . '.');
            }

            $lineSubtotal = round($quantity * $unitPrice, 2);
            $lineDiscount = min(max((float)($item['discount_amount'] ?? 0), 0), $lineSubtotal);
            $taxRate = min(max((float)($item['tax_rate'] ?? 0), 0), 100);
            $lineTax = round(($lineSubtotal - $lineDiscount) * ($taxRate / 100), 2);
            $lineTotal = round($lineSubtotal - $lineDiscount + $lineTax, 2);

            $newStock = $available - $quantity;
            $tabletsPerStrip = max((int)$medicine['tablets_per_strip'], 1);
            $baseDecrease = $unit === 'strip' ? $quantity * $tabletsPerStrip : $quantity;
            $newBaseStock = max((int)$medicine['current_stock_base_units'] - $baseDecrease, 0);

            $preparedItems[] = [
                'medicine' => $medicine,
                'quantity' => $quantity,
                'unit' => $unit,
                'unit_price' => $unitPrice,
                'discount' => $lineDiscount,
                'tax' => $lineTax,
                'line_total' => $lineTotal,
                'new_stock' => $newStock,
                'new_base_stock' => $newBaseStock,
                'base_decrease' => $baseDecrease,
            ];
            $subtotal += $lineSubtotal;
            $discountTotal += $lineDiscount;
            $taxTotal += $lineTax;
        }

        $invoiceNo = createInvoiceNumber();
        $finalAmount = round($subtotal - $discountTotal + $taxTotal, 2);
        $customerName = trim((string)($input['customer_name'] ?? '')) ?: null;
        $customerPhone = trim((string)($input['customer_phone'] ?? '')) ?: null;

        $stmt = $pdo->prepare('INSERT INTO sales_log (invoice_no, customer_name, customer_phone, payment_mode, total_amount, discount_amount, tax_amount, final_amount, status, billed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $invoiceNo,
            $customerName,
            $customerPhone,
            $paymentMode,
            round($subtotal, 2),
            round($discountTotal, 2),
            round($taxTotal, 2),
            $finalAmount,
            'Completed',
            $user['id'] ?? null,
        ]);
        $saleId = (int)$pdo->lastInsertId();

        foreach ($preparedItems as $item) {
            $medicine = $item['medicine'];
            $stmt = $pdo->prepare('INSERT INTO sale_items (sale_id, medicine_id, batch_number, quantity, unit_label, unit_price, discount_amount, tax_amount, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $saleId,
                (int)$medicine['id'],
                $medicine['batch_number'] ?? null,
                $item['quantity'],
                $item['unit'],
                $item['unit_price'],
                $item['discount'],
                $item['tax'],
                $item['line_total'],
            ]);

            $stmt = $pdo->prepare('UPDATE medicines SET current_stock_quantity = ?, current_stock_base_units = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
            $stmt->execute([$item['new_stock'], $item['new_base_stock'], (int)$medicine['id']]);

            $stmt = $pdo->prepare('INSERT INTO stock_movements (medicine_id, batch_number, movement_type, quantity, unit_label, quantity_in_base_units, reference_type, reference_id, reason, performed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                (int)$medicine['id'],
                $medicine['batch_number'] ?? null,
                'sale',
                $item['quantity'],
                $item['unit'],
                $item['base_decrease'],
                'sale',
                $saleId,
                'POS sale ' . $invoiceNo,
                $user['id'] ?? null,
            ]);
        }

        $pdo->commit();
        logActivity('sale_completed', 'sale', $saleId, $user, ['invoice_no' => $invoiceNo, 'final_amount' => $finalAmount]);

        jsonResponse([
            'success' => true,
            'sale' => [
                'id' => $saleId,
                'invoice_no' => $invoiceNo,
                'subtotal' => round($subtotal, 2),
                'discount_amount' => round($discountTotal, 2),
                'tax_amount' => round($taxTotal, 2),
                'final_amount' => $finalAmount,
                'payment_mode' => $paymentMode,
            ],
        ], 201);
    } catch (InvalidArgumentException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => $e->getMessage()], 422);
    } catch (RuntimeException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => $e->getMessage()], 409);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

function handleSales(array $segments, array $user): never
{
    if (($segments[1] ?? '') === '' && requestMethod() === 'POST') {
        createSale(requestBody(), $user);
    }

    if (($segments[1] ?? '') === 'list' && requestMethod() === 'GET') {
        $pdo = db();
        $limit = min(max((int)($_GET['limit'] ?? 100), 1), 500);
        $stmt = $pdo->query('SELECT id, invoice_no, customer_name, customer_phone, payment_mode, total_amount, discount_amount, tax_amount, final_amount, status, billed_by, created_at FROM sales_log ORDER BY created_at DESC LIMIT ' . $limit);
        jsonResponse(['success' => true, 'sales' => $stmt->fetchAll()]);
    }

    jsonResponse(['success' => false, 'message' => 'Unsupported sales operation.'], 405);
}
