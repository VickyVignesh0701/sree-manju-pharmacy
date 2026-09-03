USE sree_manju_pharmacy;

-- Link each verification row to the purchase item it is verifying.
ALTER TABLE purchase_receipt_verification_items
    ADD COLUMN purchase_item_id BIGINT NULL AFTER verification_id,
    ADD COLUMN expected_medicine_id BIGINT NULL AFTER medicine_id,
    ADD INDEX idx_prvi_purchase_item (purchase_item_id);

-- A purchase item can only be received once through the verification workflow.
ALTER TABLE purchase_items
    ADD INDEX idx_purchase_items_purchase_medicine (purchase_id, medicine_id);
