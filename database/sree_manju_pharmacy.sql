-- ============================================================
-- Sree Manju Pharmacy Management System - MySQL Database Schema
-- Database Name: sree_manju_pharmacy
-- ============================================================

CREATE DATABASE IF NOT EXISTS sree_manju_pharmacy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sree_manju_pharmacy;

CREATE TABLE IF NOT EXISTS business_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pharmacy_name VARCHAR(255) NOT NULL,
    dl_number VARCHAR(100),
    gstin VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(150),
    address TEXT,
    pharmacist_reg_no VARCHAR(100),
    receipt_footer TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Authentication: only a password hash is stored. Plaintext passwords are never stored.
CREATE TABLE IF NOT EXISTS staff_members (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    shift VARCHAR(100) DEFAULT 'General Shift',
    status VARCHAR(50) DEFAULT 'Active',
    join_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS formulations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    default_unit_label VARCHAR(50) DEFAULT 'strip',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Packaging/stock unit is explicit so the system does not label every medicine as a strip.
CREATE TABLE IF NOT EXISTS stock_units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    plural_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicines (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    category VARCHAR(150),
    formulation VARCHAR(150),
    manufacturer VARCHAR(255),
    barcode VARCHAR(100) UNIQUE,
    batch_number VARCHAR(100),
    expiry_date DATE,
    tablets_per_strip INT DEFAULT 10,
    total_strips_purchased INT DEFAULT 0,
    total_tablets INT DEFAULT 0,
    total_purchased_tablets INT DEFAULT 0,
    strip_purchase_price DECIMAL(10,2),
    strip_mrp DECIMAL(10,2),
    strip_selling_price DECIMAL(10,2),
    tablet_selling_price DECIMAL(10,2),
    unit_label VARCHAR(50) DEFAULT 'strip',
    dealer_id BIGINT,
    location VARCHAR(150),
    minimum_stock INT DEFAULT 0,
    prescription_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dealers (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    representative_name VARCHAR(150),
    contact_number VARCHAR(20),
    email VARCHAR(150),
    address TEXT,
    gstin VARCHAR(100),
    drug_license VARCHAR(100),
    pending_orders INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dealer_orders (
    id BIGINT PRIMARY KEY,
    order_no VARCHAR(100) UNIQUE NOT NULL,
    dealer_id BIGINT,
    dealer_name VARCHAR(255),
    dealer_email VARCHAR(150),
    medicine_name VARCHAR(255),
    quantity INT,
    unit_label VARCHAR(50) DEFAULT 'strip',
    expected_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    ordered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_cost DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS dealer_returns (
    id BIGINT PRIMARY KEY,
    return_no VARCHAR(100) UNIQUE NOT NULL,
    dealer_id BIGINT,
    dealer_name VARCHAR(255),
    medicine_name VARCHAR(255),
    batch_number VARCHAR(100),
    quantity INT,
    unit_label VARCHAR(50) DEFAULT 'strip',
    reason TEXT,
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Returned'
);

CREATE TABLE IF NOT EXISTS patients (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    age INT,
    gender VARCHAR(20),
    address TEXT,
    visits INT DEFAULT 1,
    email VARCHAR(150),
    email_consent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regular_patients (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150),
    email_consent BOOLEAN NOT NULL DEFAULT FALSE,
    condition_name TEXT,
    doctor_name VARCHAR(150),
    hospital_name VARCHAR(200),
    last_purchase_date DATE,
    regular_medicines TEXT,
    refill_cycle_days INT DEFAULT 30,
    reminder_days_before INT DEFAULT 5,
    discount_percent DECIMAL(5,2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_log (
    id BIGINT PRIMARY KEY,
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    payment_mode VARCHAR(50),
    total_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0.0,
    tax_amount DECIMAL(10,2) DEFAULT 0.0,
    return_amount DECIMAL(10,2) DEFAULT 0.0,
    final_amount DECIMAL(10,2),
    status VARCHAR(50) NOT NULL DEFAULT 'Completed',
    billed_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    batch_number VARCHAR(100),
    quantity INT NOT NULL,
    unit_label VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.0,
    tax_amount DECIMAL(10,2) DEFAULT 0.0,
    line_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sale_items_sale (sale_id),
    INDEX idx_sale_items_medicine (medicine_id)
);

-- Every stock change is recorded. The API must update inventory and movement in one transaction.
CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,
    batch_number VARCHAR(100),
    movement_type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    unit_label VARCHAR(50) NOT NULL,
    quantity_in_base_units INT DEFAULT NULL,
    reference_type VARCHAR(50),
    reference_id BIGINT,
    reason TEXT,
    performed_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_stock_medicine_date (medicine_id, created_at),
    INDEX idx_stock_reference (reference_type, reference_id)
);

CREATE TABLE IF NOT EXISTS sales_returns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    return_no VARCHAR(100) UNIQUE NOT NULL,
    invoice_no VARCHAR(100) NOT NULL,
    medicine_id BIGINT NOT NULL,
    batch_number VARCHAR(100),
    quantity INT NOT NULL,
    unit_label VARCHAR(50) NOT NULL,
    refund_amount DECIMAL(10,2) DEFAULT 0.0,
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Returned',
    returned_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS disposals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,
    batch_number VARCHAR(100),
    quantity INT NOT NULL,
    unit_label VARCHAR(50) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    notes TEXT,
    disposed_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(150) NOT NULL,
    entity_type VARCHAR(100),
    entity_id BIGINT,
    user_id BIGINT,
    user_name VARCHAR(150),
    user_role VARCHAR(100),
    user_email VARCHAR(150),
    ip_address VARCHAR(50),
    details JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activity_date (timestamp)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reset_staff (staff_id),
    INDEX idx_reset_expiry (expires_at)
);

CREATE TABLE IF NOT EXISTS email_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Queued',
    provider_message_id VARCHAR(255),
    error_message TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    related_type VARCHAR(100),
    related_id BIGINT,
    queued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    failed_at TIMESTAMP NULL,
    INDEX idx_email_status (status),
    INDEX idx_email_date (queued_at)
);

CREATE TABLE IF NOT EXISTS backup_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    backup_type VARCHAR(30) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    status VARCHAR(30) NOT NULL DEFAULT 'Started',
    checksum VARCHAR(128),
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    initiated_by BIGINT,
    INDEX idx_backup_date (started_at)
);

CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(150) PRIMARY KEY,
    setting_value TEXT,
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default catalog values only; no people, credentials, sales, or stock are seeded.
INSERT IGNORE INTO stock_units (id, name, plural_name) VALUES
(1, 'strip', 'strips'),
(2, 'bottle', 'bottles'),
(3, 'vial', 'vials'),
(4, 'tube', 'tubes'),
(5, 'inhaler', 'inhalers'),
(6, 'sachet', 'sachets'),
(7, 'ampoule', 'ampoules'),
(8, 'piece', 'pieces');

INSERT IGNORE INTO categories (id, name, description) VALUES
(1, 'Antibiotics', 'Antibacterial and anti-infective medications'),
(2, 'Analgesics & Pain Relievers', 'Pain control, anti-inflammatory and fever reduction'),
(3, 'Cardiovascular & Cardiac Care', 'Blood pressure, heart health and cholesterol regulation'),
(4, 'Diabetic Care & Insulin', 'Blood sugar control and diabetes management'),
(5, 'Gastrointestinal & Antacids', 'Stomach care, antacids and digestive health'),
(6, 'Respiratory & Allergy Care', 'Asthma, cough, cold and antihistamines'),
(7, 'Vitamins & Dietary Supplements', 'Multivitamins, calcium, minerals and immunity boosters'),
(8, 'Dermatology & Skin Care', 'Topical creams, ointments and skincare treatments');

INSERT IGNORE INTO formulations (id, name, description, default_unit_label) VALUES
(1, 'Tablet', 'Solid oral dosage form in compressed strip packs', 'strip'),
(2, 'Capsule', 'Gelatin or HPMC encapsulated powder/pellets', 'strip'),
(3, 'Syrup / Oral Liquid', 'Liquid oral solution, suspension or elixir', 'bottle'),
(4, 'Injection / Vial', 'Sterile injectable solution or lyophilized vial', 'vial'),
(5, 'Ointment / Cream / Gel', 'Topical application cream or ointment', 'tube'),
(6, 'Eye / Ear Drops', 'Sterile ophthalmic or otic drop solution', 'bottle'),
(7, 'Inhaler / Respule', 'Metered dose inhaler or nebulizer solution', 'inhaler');
