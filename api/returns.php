<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

function returnNumber(string $prefix): string {
    return $prefix . '-' . date('Ymd-His') . '-' . strtoupper(bin2hex(random_bytes(3)));
}

function lockReturnMedicine(PDO $pdo, int $medicineId): array {
    $stmt = $pdo->prepare('SELECT * FROM medicines WHERE id = ? LIMIT 1 FOR UPDATE');
    $stmt->execute([$medicineId]);
    $medicine = $stmt->fetch();
    if (!$medicine) throw new InvalidArgumentException('Medicine not found.');
    $unit = strtolower(trim((string)$medicine['unit_label']));
    $allowed = ['strip','bottle','vial','tube','inhaler','sachet','ampoule','piece'];
    if (!in_array($unit, $allowed, true)) throw new InvalidArgumentException('Invalid stock unit configured for medicine.');
    return $medicine;
}

function returnBaseQty(array $medicine, int $quantity): int {
    if ($quantity <= 0) throw new InvalidArgumentException('Quantity must be greater than zero.');
    return strtolower((string)$medicine['unit_label']) === 'strip'
        ? $quantity * max((int)$medicine['tablets_per_strip'], 1)
        : $quantity;
}

function customerReturn(array $input, array $user): never {
    $invoice = trim((string)($input['invoice_no'] ?? ''));
    $medicineId = (int)($input['medicine_id'] ?? 0);
    $quantity = (int)($input['quantity'] ?? 0);
    $reason = trim((string)($input['reason'] ?? 'Customer return'));
    if ($invoice === '' || $medicineId <= 0 || $quantity <= 0) jsonResponse(['success'=>false,'message'=>'invoice_no, medicine_id and positive quantity are required.'],422);

    $pdo = db(); $pdo->beginTransaction();
    try {
        $stmt=$pdo->prepare('SELECT * FROM sales_log WHERE invoice_no = ? LIMIT 1 FOR UPDATE'); $stmt->execute([$invoice]); $sale=$stmt->fetch();
        if (!$sale) throw new InvalidArgumentException('Invoice not found.');
        $stmt=$pdo->prepare('SELECT COALESCE(SUM(quantity),0) sold_quantity, MAX(unit_price) unit_price, MAX(batch_number) batch_number FROM sale_items WHERE sale_id=? AND medicine_id=? GROUP BY medicine_id');
        $stmt->execute([(int)$sale['id'],$medicineId]); $sold=$stmt->fetch();
        if (!$sold) throw new InvalidArgumentException('This medicine is not present on the invoice.');
        $stmt=$pdo->prepare('SELECT COALESCE(SUM(quantity),0) FROM sales_returns WHERE invoice_no=? AND medicine_id=? AND status=?');
        $stmt->execute([$invoice,$medicineId,'Returned']); $already=(int)$stmt->fetchColumn();
        if ($quantity > ((int)$sold['sold_quantity']-$already)) throw new InvalidArgumentException('Return quantity exceeds the quantity still eligible for return.');

        $medicine=lockReturnMedicine($pdo,$medicineId); $unit=strtolower((string)$medicine['unit_label']); $base=returnBaseQty($medicine,$quantity);
        $newQty=(int)$medicine['current_stock_quantity']+$quantity; $newBase=(int)$medicine['current_stock_base_units']+$base;
        $refund=round($quantity*(float)$sold['unit_price'],2); $returnNo=returnNumber('SR');
        $stmt=$pdo->prepare('INSERT INTO sales_returns (return_no,invoice_no,medicine_id,batch_number,quantity,unit_label,refund_amount,reason,status,returned_by) VALUES (?,?,?,?,?,?,?,?,?,?)');
        $stmt->execute([$returnNo,$invoice,$medicineId,$sold['batch_number'] ?? $medicine['batch_number'] ?? null,$quantity,$unit,$refund,$reason,'Returned',$user['id'] ?? null]); $returnId=(int)$pdo->lastInsertId();
        $stmt=$pdo->prepare('UPDATE medicines SET current_stock_quantity=?,current_stock_base_units=?,updated_at=CURRENT_TIMESTAMP WHERE id=?'); $stmt->execute([$newQty,$newBase,$medicineId]);
        $stmt=$pdo->prepare('INSERT INTO stock_movements (medicine_id,batch_number,movement_type,quantity,unit_label,quantity_in_base_units,reference_type,reference_id,reason,performed_by) VALUES (?,?,?,?,?,?,?,?,?,?)');
        $stmt->execute([$medicineId,$sold['batch_number'] ?? $medicine['batch_number'] ?? null,'customer_return',$quantity,$unit,$base,'sales_return',$returnId,$reason,$user['id'] ?? null]);
        $stmt=$pdo->prepare('UPDATE sales_log SET return_amount=COALESCE(return_amount,0)+?, final_amount=GREATEST(COALESCE(total_amount,0)-COALESCE(discount_amount,0)+COALESCE(tax_amount,0)-(COALESCE(return_amount,0)+?),0) WHERE id=?'); $stmt->execute([$refund,$refund,(int)$sale['id']]);
        $pdo->commit(); logActivity('customer_return_completed','sales_return',$returnId,$user,['invoice_no'=>$invoice,'medicine_id'=>$medicineId,'quantity'=>$quantity,'refund_amount'=>$refund]);
        jsonResponse(['success'=>true,'return_no'=>$returnNo,'refund_amount'=>$refund,'stock_quantity'=>$newQty,'unit_label'=>$unit],201);
    } catch (InvalidArgumentException $e) { if($pdo->inTransaction())$pdo->rollBack(); jsonResponse(['success'=>false,'message'=>$e->getMessage()],422); }
      catch (Throwable $e) { if($pdo->inTransaction())$pdo->rollBack(); throw $e; }
}

function dealerReturn(array $input, array $user): never {
    requireRole(['Owner','Co-owner']); $medicineId=(int)($input['medicine_id']??0); $quantity=(int)($input['quantity']??0); $dealerId=!empty($input['dealer_id'])?(int)$input['dealer_id']:null; $reason=trim((string)($input['reason']??'Returned to dealer'));
    if($medicineId<=0||$quantity<=0)jsonResponse(['success'=>false,'message'=>'medicine_id and positive quantity are required.'],422);
    $pdo=db();$pdo->beginTransaction();
    try{
        $medicine=lockReturnMedicine($pdo,$medicineId);$unit=strtolower((string)$medicine['unit_label']);$base=returnBaseQty($medicine,$quantity);$newQty=(int)$medicine['current_stock_quantity']-$quantity;$newBase=(int)$medicine['current_stock_base_units']-$base;
        if($newQty<0||$newBase<0)throw new InvalidArgumentException('Cannot return more stock to dealer than currently available.');
        $dealerName=null;if($dealerId!==null){$stmt=$pdo->prepare('SELECT name FROM dealers WHERE id=? LIMIT 1 FOR UPDATE');$stmt->execute([$dealerId]);$dealerName=$stmt->fetchColumn();if($dealerName===false)throw new InvalidArgumentException('Dealer not found.');}
        $returnNo=returnNumber('DR');$returnId=random_int(1000000000,9999999999);
        $stmt=$pdo->prepare('INSERT INTO dealer_returns (id,return_no,dealer_id,dealer_name,medicine_name,batch_number,quantity,unit_label,reason,status) VALUES (?,?,?,?,?,?,?,?,?,?)');$stmt->execute([$returnId,$returnNo,$dealerId,$dealerName,$medicine['name'],$medicine['batch_number']??null,$quantity,$unit,$reason,'Returned']);
        $stmt=$pdo->prepare('UPDATE medicines SET current_stock_quantity=?,current_stock_base_units=?,updated_at=CURRENT_TIMESTAMP WHERE id=?');$stmt->execute([$newQty,$newBase,$medicineId]);
        $stmt=$pdo->prepare('INSERT INTO stock_movements (medicine_id,batch_number,movement_type,quantity,unit_label,quantity_in_base_units,reference_type,reference_id,reason,performed_by) VALUES (?,?,?,?,?,?,?,?,?,?)');$stmt->execute([$medicineId,$medicine['batch_number']??null,'dealer_return',$quantity,$unit,$base,'dealer_return',$returnId,$reason,$user['id']??null]);
        $pdo->commit();logActivity('dealer_return_completed','dealer_return',$returnId,$user,['return_no'=>$returnNo,'medicine_id'=>$medicineId,'quantity'=>$quantity]);jsonResponse(['success'=>true,'return_no'=>$returnNo,'stock_quantity'=>$newQty,'unit_label'=>$unit],201);
    }catch(InvalidArgumentException $e){if($pdo->inTransaction())$pdo->rollBack();jsonResponse(['success'=>false,'message'=>$e->getMessage()],422);}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
}

function disposeStock(array $input,array $user):never{
    requireRole(['Owner','Co-owner']);$medicineId=(int)($input['medicine_id']??0);$quantity=(int)($input['quantity']??0);$reason=trim((string)($input['reason']??'Expired/damaged stock'));$notes=trim((string)($input['notes']??''))?:null;
    if($medicineId<=0||$quantity<=0||$reason==='')jsonResponse(['success'=>false,'message'=>'medicine_id, positive quantity and reason are required.'],422);
    $pdo=db();$pdo->beginTransaction();
    try{$medicine=lockReturnMedicine($pdo,$medicineId);$unit=strtolower((string)$medicine['unit_label']);$base=returnBaseQty($medicine,$quantity);$newQty=(int)$medicine['current_stock_quantity']-$quantity;$newBase=(int)$medicine['current_stock_base_units']-$base;if($newQty<0||$newBase<0)throw new InvalidArgumentException('Cannot dispose more stock than currently available.');
        $stmt=$pdo->prepare('INSERT INTO disposals (medicine_id,batch_number,quantity,unit_label,reason,notes,disposed_by) VALUES (?,?,?,?,?,?,?)');$stmt->execute([$medicineId,$medicine['batch_number']??null,$quantity,$unit,$reason,$notes,$user['id']??null]);$disposalId=(int)$pdo->lastInsertId();
        $stmt=$pdo->prepare('UPDATE medicines SET current_stock_quantity=?,current_stock_base_units=?,updated_at=CURRENT_TIMESTAMP WHERE id=?');$stmt->execute([$newQty,$newBase,$medicineId]);
        $stmt=$pdo->prepare('INSERT INTO stock_movements (medicine_id,batch_number,movement_type,quantity,unit_label,quantity_in_base_units,reference_type,reference_id,reason,performed_by) VALUES (?,?,?,?,?,?,?,?,?,?)');$stmt->execute([$medicineId,$medicine['batch_number']??null,'disposal',$quantity,$unit,$base,'disposal',$disposalId,$reason,$user['id']??null]);
        $pdo->commit();logActivity('stock_disposed','disposal',$disposalId,$user,['medicine_id'=>$medicineId,'quantity'=>$quantity,'reason'=>$reason]);jsonResponse(['success'=>true,'disposal_id'=>$disposalId,'stock_quantity'=>$newQty,'unit_label'=>$unit],201);
    }catch(InvalidArgumentException $e){if($pdo->inTransaction())$pdo->rollBack();jsonResponse(['success'=>false,'message'=>$e->getMessage()],422);}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
}

function handleReturns(array $segments,array $user):never{
    if(requestMethod()!=='POST')jsonResponse(['success'=>false,'message'=>'Only POST is supported.'],405);
    $input=requestBody();$action=$segments[1]??'';
    if($action==='customer')customerReturn($input,$user);if($action==='dealer')dealerReturn($input,$user);if($action==='disposal')disposeStock($input,$user);
    jsonResponse(['success'=>false,'message'=>'Unsupported return operation.'],404);
}
