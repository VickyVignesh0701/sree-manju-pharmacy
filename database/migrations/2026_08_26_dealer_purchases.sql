-- Dealer purchasing and receiving workflow.
-- Apply after the base schema.

CREATE TABLE IF NOT EXISTS purchase_orders (
    id BIGINT PRIMARY KEY,
    order_no VARCHAR(100) UNIQUE NOT NULL,
    dealer_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_date DATE NULL,
    total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_purchase_dealer (dealer_id),
    INDEX idx_purchase_status (status)
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    purchase_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT NOT NULL,
    unit_label VARCHAR(50) NOT NULL,
    tablets_per_strip INT NOT NULL DEFAULT 10,
    purchase_price DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2) NULL,
    selling_price DECIMAL(10,2) NULL,
    received_quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_purchase_items_purchase (purchase_id),
    INDEX idx_purchase_items_medicine (medicine_id)
);

CREATE TABLE IF NOT EXISTS purchase_receipts (
    id BIGINT PRIMARY KEY,
    receipt_no VARCHAR(100) UNIQUE NOT NULL,
    purchase_id BIGINT NOT NULL,
    dealer_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Received',
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_by BIGINT NULL,
    total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    INDEX idx_receipt_purchase (purchase_id),
    INDEX idx_receipt_dealer (dealer_id)
);

CREATE TABLE IF NOT EXISTS purchase_receipt_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    receipt_id BIGINT NOT NULL,
    purchase_item_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT NOT NULL,
    unit_label VARCHAR(50) NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_receipt_items_receipt (receipt_id),
    INDEX idx_receipt_items_medicine (medicine_id)
);
