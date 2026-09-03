<?php
declare(strict_types=1);

/**
 * Transactional batch-level inventory API.
 * medicine_batches is the source of truth for stock quantities.
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

function stockLockBatch(PDO $pdo, int $medicineId, string $batchNumber): array
{
    $batchNumber = trim($batchNumber);
    if ($batchNumber === '') {
        throw new InvalidArgumentException('batch_number is required for batch-level stock operations.');
    }
    $stmt = $pdo->prepare('SELECT * FROM medicine_batches WHERE medicine_id = ? AND batch_number = ? LIMIT 1 FOR UPDATE');
    $stmt->execute([$medicineId, $batchNumber]);
    $batch = $stmt->fetch();
    if (!$batch) {
        throw new InvalidArgumentException('Batch not found for this medicine: ' . $batchNumber);
    }
    return $batch;
}

function stockRecalculate(PDO $pdo, int $medicineId): array
{
    $stmt = $pdo->prepare('SELECT COALESCE(SUM(quantity),0) AS quantity, COALESCE(SUM(base_quantity),0) AS base_quantity FROM medicine_batches WHERE medicine_id = ?');
    $stmt->execute([$medicineId]);
    $totals = $stmt->fetch();
    $quantity = (int)$totals['quantity'];
    $baseQuantity = (int)$totals['base_quantity'];
    $stmt = $pdo->prepare('UPDATE medicines SET current_stock_quantity = ?, current_stock_base_units = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute([$quantity, $baseQuantity, $medicineId]);
    return [$quantity, $baseQuantity];
}

function recordMovement(PDO $pdo, int $medicineId, ?string $batch, string $type, int $quantity, string $unit, int $baseQuantity, ?string $referenceType, ?int $referenceId, ?string $reason, array $user): void
{
    $stmt = $pdo->prepare('INSERT INTO stock_movements (medicine_id, batch_number, movement_type, quantity, unit_label, quantity_in_base_units, reference_type, reference_id, reason, performed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$medicineId, $batch, $type, $quantity, $unit, $baseQuantity, $referenceType, $referenceId, $reason, $user['id'] ?? null]);
}

function updateBatchQuantity(PDO $pdo, int $batchId, int $quantityDelta, int $baseDelta): array
{
    $stmt = $pdo->prepare('SELECT quantity, base_quantity FROM medicine_batches WHERE id = ? LIMIT 1 FOR UPDATE');
    $stmt->execute([$batchId]);
    $batch = $stmt->fetch();
    if (!$batch) {
        throw new InvalidArgumentException('Batch no longer exists.');
    }
    $newQuantity = (int)$batch['quantity'] + $quantityDelta;
    $newBase = (int)$batch['base_quantity'] + $baseDelta;
    if ($newQuantity < 0 || $newBase < 0) {
        throw new InvalidArgumentException('Insufficient quantity in the selected batch.');
    }
    $stmt = $pdo->prepare('UPDATE medicine_batches SET quantity = ?, base_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute([$newQuantity, $newBase, $batchId]);
    return [$newQuantity, $newBase];
}

function stockReceive(array $input, array $user): never
{
    $medicineId = (int)($input['medicine_id'] ?? 0);
    $quantity = (int)($input['quantity'] ?? 0);
    $batchNumber = trim((string)($input['batch_number'] ?? ''));
    $expiryDate = trim((string)($input['expiry_date'] ?? ''));
    if ($medicineId <= 0 || $quantity <= 0 || $batchNumber === '' || $expiryDate === '') {
        jsonResponse(['success' => false, 'message' => 'medicine_id, batch_number, expiry_date and positive quantity are required.'], 422);
    }
    if ($expiryDate < date('Y-m-d')) {
        jsonResponse(['success' => false, 'message' => 'Expired stock cannot be received into saleable inventory.'], 422);
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $medicine = lockMedicine($pdo, $medicineId);
        $unit = stockUnitForMedicine($medicine);
        $base = stockBaseQuantity($quantity, $unit, (int)$medicine['tablets_per_strip']);
        $purchasePrice = max((float)($input['purchase_price'] ?? $medicine['strip_purchase_price'] ?? 0), 0);
        $mrp = max((float)($input['mrp'] ?? $medicine['strip_mrp'] ?? 0), 0);
        $sellingPrice = max((float)($input['selling_price'] ?? $medicine['strip_selling_price'] ?? 0), 0);

        $stmt = $pdo->prepare('SELECT * FROM medicine_batches WHERE medicine_id = ? AND batch_number = ? LIMIT 1 FOR UPDATE');
        $stmt->execute([$medicineId, $batchNumber]);
        $batch = $stmt->fetch();
        if ($batch) {
            if ((string)$batch['expiry_date'] !== $expiryDate) {
                throw new InvalidArgumentException('Existing batch expiry date does not match.');
            }
            $newQuantity = (int)$batch['quantity'] + $quantity;
            $newBase = (int)$batch['base_quantity'] + $base;
            $stmt = $pdo->prepare('UPDATE medicine_batches SET quantity = ?, base_quantity = ?, purchase_price = ?, mrp = ?, selling_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
            $stmt->execute([$newQuantity, $newBase, $purchasePrice, $mrp, $sellingPrice, (int)$batch['id']]);
        } else {
            $batchId = random_int(1000000000, 9999999999);
            $stmt = $pdo->prepare('INSERT INTO medicine_batches (id, medicine_id, batch_number, expiry_date, quantity, base_quantity, purchase_price, mrp, selling_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$batchId, $medicineId, $batchNumber, $expiryDate, $quantity, $base, $purchasePrice, $mrp, $sellingPrice]);
            $newQuantity = $quantity;
            $newBase = $base;
        }

        [$aggregateQuantity, $aggregateBase] = stockRecalculate($pdo, $medicineId);
        recordMovement($pdo, $medicineId, $batchNumber, 'purchase_received', $quantity, $unit, $base, 'dealer_order', isset($input['reference_id']) ? (int)$input['reference_id'] : null, trim((string)($input['reason'] ?? 'Stock received')), $user);
        $pdo->commit();
        logActivity('stock_purchase_received', 'medicine', $medicineId, $user, ['quantity' => $quantity, 'unit_label' => $unit, 'batch_number' => $batchNumber, 'aggregate_stock_quantity' => $aggregateQuantity]);
        jsonResponse(['success' => true, 'message' => 'Stock received into batch inventory.', 'stock' => ['medicine_id' => $medicineId, 'medicine_name' => $medicine['name'], 'batch_number' => $batchNumber, 'batch_quantity' => $newQuantity, 'quantity' => $aggregateQuantity, 'base_units' => $aggregateBase, 'unit_label' => $unit]], 201);
    } catch (InvalidArgumentException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => $e->getMessage()], 422);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

function stockSell(array $input, array $user): never
{
    $medicineId = (int)($input['medicine_id'] ?? 0);
    $quantity = (int)($input['quantity'] ?? 0);
    if ($medicineId <= 0 || $quantity <= 0) jsonResponse(['success'=>false,'message'=>'medicine_id and positive quantity are required.'],422);

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $medicine = lockMedicine($pdo, $medicineId);
        $unit = stockUnitForMedicine($medicine);
        $remaining = $quantity;
        $movements = [];
        $stmt = $pdo->prepare('SELECT * FROM medicine_batches WHERE medicine_id = ? AND quantity > 0 AND expiry_date >= CURRENT_DATE ORDER BY expiry_date ASC, received_at ASC FOR UPDATE');
        $stmt->execute([$medicineId]);
        foreach ($stmt->fetchAll() as $batch) {
            if ($remaining <= 0) break;
            $take = min($remaining, (int)$batch['quantity']);
            $base = stockBaseQuantity($take, $unit, (int)$medicine['tablets_per_strip']);
            $result = updateBatchQuantity($pdo, (int)$batch['id'], -$take, -$base);
            $movements[] = ['batch_number'=>$batch['batch_number'],'quantity'=>$take,'base_quantity'=>$base,'batch_quantity'=>$result[0]];
            $remaining -= $take;
            recordMovement($pdo, $medicineId, $batch['batch_number'], 'sale', $take, $unit, $base, 'sale', isset($input['reference_id']) ? (int)$input['reference_id'] : null, 'Stock sold', $user);
        }
        if ($remaining > 0) throw new InvalidArgumentException('Insufficient non-expired stock for ' . $medicine['name'] . '.');
        [$newQty,$newBase] = stockRecalculate($pdo,$medicineId);
        $pdo->commit();
        logActivity('stock_sale', 'medicine', $medicineId, $user, ['quantity'=>$quantity,'unit_label'=>$unit,'batches'=>$movements,'new_stock_quantity'=>$newQty]);
        jsonResponse(['success'=>true,'message'=>'Stock reduced using FEFO.','stock'=>['medicine_id'=>$medicineId,'quantity'=>$newQty,'base_units'=>$newBase,'unit_label'=>$unit,'batches'=>$movements]]);
    } catch (InvalidArgumentException $e) {
        if($pdo->inTransaction())$pdo->rollBack();
        jsonResponse(['success'=>false,'message'=>$e->getMessage()],409);
    } catch (Throwable $e) {
        if($pdo->inTransaction())$pdo->rollBack();
        throw $e;
    }
}

function stockIncomingReturn(array $input, array $user): never
{
    $medicineId=(int)($input['medicine_id']??0);$quantity=(int)($input['quantity']??0);$batchNumber=trim((string)($input['batch_number']??''));
    if($medicineId<=0||$quantity<=0||$batchNumber==='')jsonResponse(['success'=>false,'message'=>'medicine_id, batch_number and positive quantity are required.'],422);
    $pdo=db();$pdo->beginTransaction();
    try{
        $medicine=lockMedicine($pdo,$medicineId);$unit=stockUnitForMedicine($medicine);$base=stockBaseQuantity($quantity,$unit,(int)$medicine['tablets_per_strip']);$batch=stockLockBatch($pdo,$medicineId,$batchNumber);$result=updateBatchQuantity($pdo,(int)$batch['id'],$quantity,$base);[$newQty,$newBase]=stockRecalculate($pdo,$medicineId);
        $referenceId=isset($input['reference_id'])?(int)$input['reference_id']:null;$reason=trim((string)($input['reason']??'Customer return'));
        recordMovement($pdo,$medicineId,$batchNumber,'customer_return',$quantity,$unit,$base,'sales_return',$referenceId,$reason,$user);$pdo->commit();
        logActivity('stock_customer_return','medicine',$medicineId,$user,['quantity'=>$quantity,'batch_number'=>$batchNumber]);jsonResponse(['success'=>true,'message'=>'Customer return added to the selected batch.','stock'=>['medicine_id'=>$medicineId,'batch_number'=>$batchNumber,'batch_quantity'=>$result[0],'quantity'=>$newQty,'base_units'=>$newBase,'unit_label'=>$unit]]);
    }catch(InvalidArgumentException $e){if($pdo->inTransaction())$pdo->rollBack();jsonResponse(['success'=>false,'message'=>$e->getMessage()],422);}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
}

function stockOutgoingBatch(array $input, array $user, string $movementType, string $referenceType, string $defaultReason): never
{
    $medicineId=(int)($input['medicine_id']??0);$quantity=(int)($input['quantity']??0);$batchNumber=trim((string)($input['batch_number']??''));
    if($medicineId<=0||$quantity<=0||$batchNumber==='')jsonResponse(['success'=>false,'message'=>'medicine_id, batch_number and positive quantity are required.'],422);
    $pdo=db();$pdo->beginTransaction();
    try{
        $medicine=lockMedicine($pdo,$medicineId);$unit=stockUnitForMedicine($medicine);$base=stockBaseQuantity($quantity,$unit,(int)$medicine['tablets_per_strip']);$batch=stockLockBatch($pdo,$medicineId,$batchNumber);
        if((int)$batch['quantity']<$quantity || (int)$batch['base_quantity']<$base)throw new InvalidArgumentException('Insufficient quantity in the selected batch.');
        $result=updateBatchQuantity($pdo,(int)$batch['id'],-$quantity,-$base);[$newQty,$newBase]=stockRecalculate($pdo,$medicineId);
        $reason=trim((string)($input['reason']??$defaultReason));$referenceId=isset($input['reference_id'])?(int)$input['reference_id']:null;
        recordMovement($pdo,$medicineId,$batchNumber,$movementType,$quantity,$unit,$base,$referenceType,$referenceId,$reason,$user);$pdo->commit();
        logActivity('stock_'.$movementType,'medicine',$medicineId,$user,['quantity'=>$quantity,'batch_number'=>$batchNumber,'new_stock_quantity'=>$newQty]);jsonResponse(['success'=>true,'message'=>ucwords(str_replace('_',' ',$movementType)).' completed.','stock'=>['medicine_id'=>$medicineId,'batch_number'=>$batchNumber,'batch_quantity'=>$result[0],'quantity'=>$newQty,'base_units'=>$newBase,'unit_label'=>$unit]]);
    }catch(InvalidArgumentException $e){if($pdo->inTransaction())$pdo->rollBack();jsonResponse(['success'=>false,'message'=>$e->getMessage()],422);}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
}

function handleStock(array $segments, array $user): never
{
    $action = $segments[1] ?? '';
    if ($action === 'history' && requestMethod() === 'GET') {
        $medicineId=(int)($_GET['medicine_id']??0);
        if($medicineId<=0)jsonResponse(['success'=>false,'message'=>'medicine_id is required.'],422);
        $pdo=db();$limit=min(max((int)($_GET['limit']??100),1),500);
        $stmt=$pdo->prepare('SELECT sm.*,m.name AS medicine_name FROM stock_movements sm INNER JOIN medicines m ON m.id=sm.medicine_id WHERE sm.medicine_id=? ORDER BY sm.created_at DESC LIMIT '.$limit);$stmt->execute([$medicineId]);
        jsonResponse(['success'=>true,'movements'=>$stmt->fetchAll()]);
    }
    if(requestMethod()!=='POST')jsonResponse(['success'=>false,'message'=>'Only POST is supported.'],405);
    $input=requestBody();
    if($action==='receive'){
        if(!in_array(strtolower((string)$user['role']),array_map('strtolower',['Owner','Co-owner','Staff']),true))jsonResponse(['success'=>false,'message'=>'You do not have permission to receive stock.'],403);
        stockReceive($input,$user);
    }
    if($action==='sell')stockSell($input,$user);
    if($action==='customer-return')stockIncomingReturn($input,$user);
    if($action==='disposal'){requireRole(['Owner','Co-owner']);stockOutgoingBatch($input,$user,'disposal','disposal','Disposed stock');}
    if($action==='dealer-return'){requireRole(['Owner','Co-owner']);stockOutgoingBatch($input,$user,'dealer_return','dealer_return','Returned to dealer');}
    jsonResponse(['success'=>false,'message'=>'Unsupported stock operation.'],405);
}
