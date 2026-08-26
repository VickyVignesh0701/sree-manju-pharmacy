USE sree_manju_pharmacy;

CREATE TABLE IF NOT EXISTS purchase_receipt_verifications (
    id BIGINT PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL,
    dealer_id BIGINT,
    status ENUM('Pending','Partially Accepted','Accepted','Rejected') NOT NULL DEFAULT 'Pending',
    verified_by BIGINT,
    verified_at TIMESTAMP NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_prv_order (purchase_order_id),
    INDEX idx_prv_status (status)
);

CREATE TABLE IF NOT EXISTS purchase_receipt_verification_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    verification_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    ordered_quantity INT NOT NULL DEFAULT 0,
    received_quantity INT NOT NULL DEFAULT 0,
    accepted_quantity INT NOT NULL DEFAULT 0,
    rejected_quantity INT NOT NULL DEFAULT 0,
    rejection_reason ENUM('Wrong Product','Wrong Strength','Wrong Quantity','Damaged','Expired','Near Expiry','Wrong Batch','Extra Item','Other') NULL,
    rejection_notes TEXT NULL,
    batch_number VARCHAR(100) NULL,
    expiry_date DATE NULL,
    unit_label VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prvi_verification (verification_id),
    INDEX idx_prvi_medicine (medicine_id)
);
