<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/stock.php';

function handleReconciliation(array $segments, array $user): never
{
    requireRole(['Owner', 'Co-owner']);
    $pdo = db();

    if (requestMethod() === 'POST') {
        $input = requestBody();
        $medicineId = (int)($input['medicine_id'] ?? 0);
        if ($medicineId > 0) {
            stockRecalculate($pdo, $medicineId);
            logActivity('reconciliation_fixed', 'medicine', $medicineId, $user);
            jsonResponse(['success' => true, 'fixed' => 1]);
        }

        // No medicine_id means "fix everything currently mismatched."
        $mismatched = $pdo->query('SELECT m.id FROM medicines m
            LEFT JOIN medicine_batches mb ON mb.medicine_id = m.id
            GROUP BY m.id, m.current_stock_quantity, m.current_stock_base_units
            HAVING COALESCE(m.current_stock_quantity,0) <> COALESCE(SUM(mb.quantity),0)
                OR COALESCE(m.current_stock_base_units,0) <> COALESCE(SUM(mb.base_quantity),0)')->fetchAll();
        foreach ($mismatched as $row) {
            stockRecalculate($pdo, (int)$row['id']);
        }
        logActivity('reconciliation_fixed_all', null, null, $user, ['count' => count($mismatched)]);
        jsonResponse(['success' => true, 'fixed' => count($mismatched)]);
    }

    if (requestMethod() !== 'GET') jsonResponse(['success' => false, 'message' => 'Only GET/POST are supported.'], 405);
    $sql = 'SELECT m.id AS medicine_id, m.name, COALESCE(m.current_stock_quantity,0) AS aggregate_quantity,
                   COALESCE(SUM(mb.quantity),0) AS batch_quantity,
                   COALESCE(m.current_stock_base_units,0) AS aggregate_base_quantity,
                   COALESCE(SUM(mb.base_quantity),0) AS batch_base_quantity
            FROM medicines m
            LEFT JOIN medicine_batches mb ON mb.medicine_id = m.id
            GROUP BY m.id, m.name, m.current_stock_quantity, m.current_stock_base_units
            HAVING aggregate_quantity <> batch_quantity OR aggregate_base_quantity <> batch_base_quantity
            ORDER BY m.name';
    $rows = $pdo->query($sql)->fetchAll();
    jsonResponse(['success' => true, 'count' => count($rows), 'mismatches' => $rows]);
}
