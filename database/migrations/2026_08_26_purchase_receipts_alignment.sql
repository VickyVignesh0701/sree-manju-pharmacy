USE sree_manju_pharmacy;

-- Keep purchase_receipts compatible regardless of which earlier migration created it first.
ALTER TABLE purchase_receipts
    ADD COLUMN IF NOT EXISTS purchase_order_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS purchase_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS dealer_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'Received',
    ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS received_by BIGINT NULL,
    ADD COLUMN IF NOT EXISTS received_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS notes TEXT NULL;

-- Keep receipt line items compatible with both batch-inventory and dealer-purchase flows.
ALTER TABLE purchase_receipt_items
    ADD COLUMN IF NOT EXISTS purchase_item_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS receipt_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS batch_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS medicine_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS expiry_date DATE NULL,
    ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unit_label VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2) NULL,
    ADD COLUMN IF NOT EXISTS mrp DECIMAL(10,2) NULL,
    ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2) NULL,
    ADD COLUMN IF NOT EXISTS line_total DECIMAL(12,2) NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_receipts_purchase_order ON purchase_receipts (purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_purchase ON purchase_receipts (purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_purchase_item ON purchase_receipt_items (purchase_item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_batch ON purchase_receipt_items (batch_id);
