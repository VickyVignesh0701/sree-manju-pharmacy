<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

function createInvoiceNumber(): string { return 'INV-'.date('Ymd-His').'-'.strtoupper(bin2hex(random_bytes(3))); }

function createSale(array $input,array $user):never {
    $items=$input['items']??null;
    if(!is_array($items)||count($items)===0)jsonResponse(['success'=>false,'message'=>'At least one medicine is required for billing.'],422);
    $paymentMode=trim((string)($input['payment_mode']??'Cash'));
    if(!in_array($paymentMode,['Cash','UPI','Card','Credit'],true))jsonResponse(['success'=>false,'message'=>'Invalid payment mode.'],422);
    $pdo=db();$pdo->beginTransaction();
    try{
        $prepared=[];$subtotal=0.0;$discountTotal=0.0;$taxTotal=0.0;$seen=[];
        foreach($items as $item){
            if(!is_array($item))throw new InvalidArgumentException('Invalid sale item.');
            $medicineId=(int)($item['medicine_id']??0);$requestedQty=(int)($item['quantity']??0);
            if($medicineId<=0||$requestedQty<=0)throw new InvalidArgumentException('Each sale item requires a valid medicine_id and positive quantity.');
            if(isset($seen[$medicineId]))throw new InvalidArgumentException('Do not send the same medicine twice in one bill. Combine its quantity.');$seen[$medicineId]=true;
            $stmt=$pdo->prepare('SELECT * FROM medicines WHERE id=? LIMIT 1 FOR UPDATE');$stmt->execute([$medicineId]);$medicine=$stmt->fetch();
            if(!$medicine)throw new InvalidArgumentException('Medicine not found: '.$medicineId);
            $unit=strtolower(trim((string)$medicine['unit_label']));$requestedUnit=strtolower(trim((string)($item['unit_label']??$unit)));
            if($requestedUnit!==$unit)throw new InvalidArgumentException('Stock unit mismatch for '.$medicine['name'].'. Use '.$unit.'.');
            $batchStmt=$pdo->prepare('SELECT * FROM medicine_batches WHERE medicine_id=? AND quantity>0 AND expiry_date>=CURRENT_DATE ORDER BY expiry_date ASC,received_at ASC FOR UPDATE');$batchStmt->execute([$medicineId]);$batches=$batchStmt->fetchAll();
            if(!$batches)throw new RuntimeException('No non-expired stock is available for '.$medicine['name'].'.');
            $remaining=$requestedQty;$requestedDiscount=max((float)($item['discount_amount']??0),0);$taxRate=min(max((float)($item['tax_rate']??0),0),100);
            foreach($batches as $batch){
                if($remaining<=0)break;$take=min($remaining,(int)$batch['quantity']);$price=(float)$batch['selling_price'];
                if($price<=0)throw new InvalidArgumentException('Selling price is not configured for batch '.$batch['batch_number'].'.');
                $lineSubtotal=round($take*$price,2);$discount=min($requestedDiscount,$lineSubtotal);$requestedDiscount-=$discount;$tax=round(($lineSubtotal-$discount)*($taxRate/100),2);$baseDecrease=$unit==='strip'?$take*max((int)$medicine['tablets_per_strip'],1):$take;
                $newBatchQty=(int)$batch['quantity']-$take;$newBatchBase=(int)$batch['base_quantity']-$baseDecrease;if($newBatchBase<0)throw new RuntimeException('Insufficient base stock for batch '.$batch['batch_number'].'.');
                $prepared[]=['medicine'=>$medicine,'batch'=>$batch,'quantity'=>$take,'unit'=>$unit,'unit_price'=>$price,'discount'=>$discount,'tax'=>$tax,'line_total'=>round($lineSubtotal-$discount+$tax,2),'base_decrease'=>$baseDecrease,'new_batch_qty'=>$newBatchQty,'new_batch_base'=>$newBatchBase];
                $remaining-=$take;$subtotal+=$lineSubtotal;$discountTotal+=$discount;$taxTotal+=$tax;
            }
            if($remaining>0)throw new RuntimeException('Insufficient non-expired stock for '.$medicine['name'].'. Requested '.$requestedQty.' '.$unit.'.');
        }
        $invoiceNo=createInvoiceNumber();$saleId=random_int(1000000000,9999999999);$rawFinalAmount=$subtotal-$discountTotal+$taxTotal;$finalAmount=(float)ceil($rawFinalAmount);$customerName=trim((string)($input['customer_name']??''))?:null;$customerPhone=trim((string)($input['customer_phone']??''))?:null;
        $stmt=$pdo->prepare('INSERT INTO sales_log (id,invoice_no,customer_name,customer_phone,payment_mode,total_amount,discount_amount,tax_amount,final_amount,status,billed_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)');$stmt->execute([$saleId,$invoiceNo,$customerName,$customerPhone,$paymentMode,round($subtotal,2),round($discountTotal,2),round($taxTotal,2),$finalAmount,'Completed',$user['id']??null]);
        foreach($prepared as $item){$m=$item['medicine'];$b=$item['batch'];
            $stmt=$pdo->prepare('INSERT INTO sale_items (sale_id,medicine_id,batch_number,quantity,unit_label,unit_price,discount_amount,tax_amount,line_total) VALUES (?,?,?,?,?,?,?,?,?)');$stmt->execute([$saleId,(int)$m['id'],$b['batch_number'],$item['quantity'],$item['unit'],$item['unit_price'],$item['discount'],$item['tax'],$item['line_total']]);
            $stmt=$pdo->prepare('UPDATE medicine_batches SET quantity=?,base_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE id=?');$stmt->execute([$item['new_batch_qty'],$item['new_batch_base'],(int)$b['id']]);
            $stmt=$pdo->prepare('INSERT INTO stock_movements (medicine_id,batch_number,movement_type,quantity,unit_label,quantity_in_base_units,reference_type,reference_id,reason,performed_by) VALUES (?,?,?,?,?,?,?,?,?,?)');$stmt->execute([(int)$m['id'],$b['batch_number'],'sale',$item['quantity'],$item['unit'],$item['base_decrease'],'sale',$saleId,'POS sale '.$invoiceNo,$user['id']??null]);
        }
        $ids=array_values(array_unique(array_map(fn($x)=>(int)$x['medicine']['id'],$prepared)));
        foreach($ids as $medicineId){$stmt=$pdo->prepare('SELECT COALESCE(SUM(quantity),0) q,COALESCE(SUM(base_quantity),0) b FROM medicine_batches WHERE medicine_id=?');$stmt->execute([$medicineId]);$t=$stmt->fetch();$stmt=$pdo->prepare('UPDATE medicines SET current_stock_quantity=?,current_stock_base_units=?,updated_at=CURRENT_TIMESTAMP WHERE id=?');$stmt->execute([(int)$t['q'],(int)$t['b'],$medicineId]);}
        $pdo->commit();logActivity('sale_completed','sale',$saleId,$user,['invoice_no'=>$invoiceNo,'final_amount'=>$finalAmount]);jsonResponse(['success'=>true,'sale'=>['id'=>$saleId,'invoice_no'=>$invoiceNo,'subtotal'=>round($subtotal,2),'discount_amount'=>round($discountTotal,2),'tax_amount'=>round($taxTotal,2),'final_amount'=>$finalAmount,'payment_mode'=>$paymentMode]],201);
    }catch(InvalidArgumentException $e){if($pdo->inTransaction())$pdo->rollBack();jsonResponse(['success'=>false,'message'=>$e->getMessage()],422);}catch(RuntimeException $e){if($pdo->inTransaction())$pdo->rollBack();jsonResponse(['success'=>false,'message'=>$e->getMessage()],409);}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
}
function handleSales(array $segments,array $user):never{if(($segments[1]??'')===''&&requestMethod()==='POST')createSale(requestBody(),$user);if(($segments[1]??'')==='list'&&requestMethod()==='GET'){$pdo=db();$limit=min(max((int)($_GET['limit']??100),1),500);$stmt=$pdo->query('SELECT id,invoice_no,customer_name,customer_phone,payment_mode,total_amount,discount_amount,tax_amount,final_amount,status,billed_by,created_at FROM sales_log ORDER BY created_at DESC LIMIT '.$limit);jsonResponse(['success'=>true,'sales'=>$stmt->fetchAll()]);}jsonResponse(['success'=>false,'message'=>'Unsupported sales operation.'],405);}
