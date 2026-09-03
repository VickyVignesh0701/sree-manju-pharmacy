-- Sree Manju Pharmacy - inventory transaction foundation
-- Run once against an existing database after sree_manju_pharmacy.sql.
-- Stock is stored in the medicine's configured selling/purchase unit and also
-- in base units for strip-aware validation. No dummy stock is inserted.

USE sree_manju_pharmacy;

ALTER TABLE medicines
    ADD COLUMN IF NOT EXISTS current_stock_quantity INT NOT NULL DEFAULT 0 AFTER minimum_stock,
    ADD COLUMN IF NOT EXISTS current_stock_base_units INT NOT NULL DEFAULT 0 AFTER current_stock_quantity;

ALTER TABLE stock_movements
    ADD INDEX IF NOT EXISTS idx_stock_medicine_type (medicine_id, movement_type, created_at);

ALTER TABLE sales_returns
    ADD INDEX IF NOT EXISTS idx_sales_return_invoice (invoice_no),
    ADD INDEX IF NOT EXISTS idx_sales_return_medicine (medicine_id, created_at);

ALTER TABLE disposals
    ADD INDEX IF NOT EXISTS idx_disposal_medicine (medicine_id, created_at);
