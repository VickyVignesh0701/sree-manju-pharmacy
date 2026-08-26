<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

function handleBatches(array $segments, array $user): never
{
    $pdo = db();
    $medicineId = isset($segments[1]) && ctype_digit($segments[1]) ? (int)$segments[1] : 0;
    if ($medicineId <= 0) {
        jsonResponse(['success' => false, 'message' => 'medicine_id is required.'], 422);
    }
    if (requestMethod() !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Only batch listing is available through this endpoint.'], 405);
    }
    $includeExpired = filter_var($_GET['include_expired'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $where = $includeExpired ? '' : ' AND mb.expiry_date >= CURRENT_DATE';
    $stmt = $pdo->prepare(
        'SELECT mb.id, mb.medicine_id, mb.batch_number, mb.expiry_date, mb.quantity, mb.base_quantity,
                mb.purchase_price, mb.mrp, mb.selling_price, mb.received_at,
                DATEDIFF(mb.expiry_date, CURRENT_DATE) AS days_to_expiry
         FROM medicine_batches mb
         WHERE mb.medicine_id = ? AND mb.quantity > 0' . $where .
         ' ORDER BY mb.expiry_date ASC, mb.received_at ASC'
    );
    $stmt->execute([$medicineId]);
    jsonResponse(['success' => true, 'batches' => $stmt->fetchAll()]);
}
