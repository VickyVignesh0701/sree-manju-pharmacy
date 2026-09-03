-- ============================================================
-- Fixes a pre-existing schema conflict: purchase_receipts and
-- purchase_receipt_items are each defined twice, with different
-- columns, in 2026_08_26_batch_inventory.sql and
-- 2026_08_26_dealer_purchases.sql. Both use CREATE TABLE IF NOT
-- EXISTS, so whichever migration ran first silently "wins" and the
-- other's columns are never created. The actual PHP code
-- (api/dealers.php) was written against the dealer_purchases.sql
-- version - on an install where batch_inventory.sql applied first
-- (likely, since it sorts first alphabetically), receiving a
-- purchase order would fail with a missing-column SQL error the
-- first time anyone used it.
--
-- This migration is idempotent and safe to run regardless of which
-- version is currently in place.
-- ============================================================

ALTER TABLE purchase_receipts
    ADD COLUMN IF NOT EXISTS purchase_id BIGINT NULL AFTER receipt_no,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'Received' AFTER dealer_id,
    ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS notes TEXT NULL;

ALTER TABLE purchase_receipt_items
    ADD COLUMN IF NOT EXISTS purchase_item_id BIGINT NULL AFTER receipt_id;
