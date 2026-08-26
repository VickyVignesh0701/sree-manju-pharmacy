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
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_medicine_batch (medicine_id, batch_number),
    INDEX idx_batch_expiry (expiry_date),
    INDEX idx_batch_medicine_stock (medicine_id, quantity),
    CONSTRAINT fk_batch_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

CREATE TABLE IF NOT EXISTS purchase_receipts (
    id BIGINT PRIMARY KEY,
    receipt_no VARCHAR(100) UNIQUE NOT NULL,
    dealer_id BIGINT,
    purchase_order_id BIGINT,
    invoice_number VARCHAR(100),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    received_by BIGINT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_receipt_dealer (dealer_id),
    INDEX idx_receipt_date (received_at)
);

CREATE TABLE IF NOT EXISTS purchase_receipt_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    receipt_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    batch_id BIGINT,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT NOT NULL,
    unit_label VARCHAR(50) NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    INDEX idx_receipt_items_receipt (receipt_id),
    INDEX idx_receipt_items_batch (batch_id)
);
