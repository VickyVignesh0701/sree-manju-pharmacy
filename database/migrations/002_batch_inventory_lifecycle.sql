USE sree_manju_pharmacy;

CREATE TABLE IF NOT EXISTS medicine_batches (
    id BIGINT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    base_quantity INT NOT NULL DEFAULT 0,
    purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    mrp DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_medicine_batch (medicine_id, batch_number),
    INDEX idx_batch_fefo (medicine_id, expiry_date, status),
    INDEX idx_batch_expiry (expiry_date)
);

ALTER TABLE medicine_batches ADD COLUMN IF NOT EXISTS received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status;
ALTER TABLE purchase_receipt_verification_items ADD COLUMN IF NOT EXISTS purchase_item_id BIGINT NULL AFTER verification_id;
ALTER TABLE purchase_receipt_verification_items ADD COLUMN IF NOT EXISTS expected_medicine_id BIGINT NULL AFTER purchase_item_id;
ALTER TABLE purchase_receipt_verification_items ADD INDEX IF NOT EXISTS idx_prvi_purchase_item (purchase_item_id);
ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS received_quantity INT NOT NULL DEFAULT 0;
ALTER TABLE stock_movements ADD INDEX IF NOT EXISTS idx_stock_batch (medicine_id, batch_number, created_at);
ALTER TABLE sales_returns ADD INDEX IF NOT EXISTS idx_sales_return_batch (medicine_id, batch_number, created_at);
ALTER TABLE dealer_returns ADD INDEX IF NOT EXISTS idx_dealer_return_batch (medicine_name, batch_number, return_date);
ALTER TABLE disposals ADD INDEX IF NOT EXISTS idx_disposal_batch (medicine_id, batch_number, created_at);
