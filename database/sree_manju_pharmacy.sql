-- ============================================================
-- Sree Manju Pharmacy Management System - Full MySQL Database Schema
-- Database Name: sree_manju_pharmacy
-- Host: localhost:3306
-- ============================================================

CREATE DATABASE IF NOT EXISTS sree_manju_pharmacy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sree_manju_pharmacy;

-- 1. Business & Pharmacy Settings Table
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

-- 2. Staff Members & User Accounts Table (Stores Staff, Owners, Passwords & Join Dates)
CREATE TABLE IF NOT EXISTS staff_members (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    shift VARCHAR(100) DEFAULT 'General Shift',
    status VARCHAR(50) DEFAULT 'Active',
    join_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Medicine Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Formulation Types Table
CREATE TABLE IF NOT EXISTS formulations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Inventory / Medicines Table (Overall Stock, Expiry & Tablet Tracking)
CREATE TABLE IF NOT EXISTS medicines (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    category VARCHAR(150),
    formulation VARCHAR(150),
    manufacturer VARCHAR(255),
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Dealers / Wholesale Suppliers Table
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

-- 7. Dealer Purchase Orders Table
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

-- 8. Dealer Stock Returns Table
CREATE TABLE IF NOT EXISTS dealer_returns (
    id BIGINT PRIMARY KEY,
    return_no VARCHAR(100) UNIQUE NOT NULL,
    dealer_name VARCHAR(255),
    medicine_name VARCHAR(255),
    quantity INT,
    unit_label VARCHAR(50) DEFAULT 'strip',
    reason TEXT,
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Returned'
);

-- 9. General Patients / Customer Visits Table
CREATE TABLE IF NOT EXISTS patients (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    age INT,
    gender VARCHAR(20),
    address TEXT,
    visits INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Regular Chronic Care Patients (25-Day Auto Refill Alerts)
CREATE TABLE IF NOT EXISTS regular_patients (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150),
    condition_name TEXT,
    doctor_name VARCHAR(150),
    hospital_name VARCHAR(200),
    last_purchase_date DATE,
    regular_medicines TEXT,
    refill_cycle_days INT DEFAULT 30,
    discount_percent DECIMAL(5,2) DEFAULT 10.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Sales Billing Header Log Table
CREATE TABLE IF NOT EXISTS sales_log (
    id BIGINT PRIMARY KEY,
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    payment_mode VARCHAR(50),
    total_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0.0,
    final_amount DECIMAL(10,2),
    billed_by VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. System Audit Trail Logs Table
CREATE TABLE IF NOT EXISTS activity_log (
    id BIGINT PRIMARY KEY,
    action TEXT NOT NULL,
    user_name VARCHAR(150),
    user_role VARCHAR(100),
    user_email VARCHAR(150),
    ip_address VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Seed Initial Categories (Pre-loaded)
-- ============================================================
INSERT IGNORE INTO categories (id, name, description) VALUES
(1, 'Antibiotics', 'Antibacterial and anti-infective medications'),
(2, 'Analgesics & Pain Relievers', 'Pain control, anti-inflammatory and fever reduction'),
(3, 'Cardiovascular & Cardiac Care', 'Blood pressure, heart health and cholesterol regulation'),
(4, 'Diabetic Care & Insulin', 'Blood sugar control and diabetes management'),
(5, 'Gastrointestinal & Antacids', 'Stomach care, antacids and digestive health'),
(6, 'Respiratory & Allergy Care', 'Asthma, cough, cold and antihistamines'),
(7, 'Vitamins & Dietary Supplements', 'Multivitamins, calcium, minerals and immunity boosters'),
(8, 'Dermatology & Skin Care', 'Topical creams, ointments and skincare treatments');

-- ============================================================
-- Seed Initial Formulations (Pre-loaded)
-- ============================================================
INSERT IGNORE INTO formulations (id, name, description) VALUES
(1, 'Tablet', 'Solid oral dosage form in compressed strip packs'),
(2, 'Capsule', 'Gelatin or HPMC encapsulated powder/pellets'),
(3, 'Syrup / Oral Liquid', 'Liquid oral solution, suspension or elixir'),
(4, 'Injection / Vial', 'Sterile injectable solution or lyophilized vial'),
(5, 'Ointment / Cream / Gel', 'Topical application cream or ointment'),
(6, 'Eye / Ear Drops', 'Sterile ophthalmic or otic drop solution'),
(7, 'Inhaler / Respule', 'Metered dose inhaler or nebulizer solution');
