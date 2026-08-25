-- ============================================================
-- Sree Manju Pharmacy Management System - MySQL Database Schema
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

-- 5. Inventory / Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(150),
    formulation VARCHAR(150),
    batch_number VARCHAR(100),
    expiry_date DATE,
    mrp DECIMAL(10,2),
    purchase_price DECIMAL(10,2),
    strips_count INT DEFAULT 0,
    pack_size INT DEFAULT 10,
    loose_units INT DEFAULT 0,
    dealer_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Dealers / Suppliers Table
CREATE TABLE IF NOT EXISTS dealers (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(150),
    gstin VARCHAR(100),
    dl_number VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Patients / Regular Customers Table
CREATE TABLE IF NOT EXISTS patients (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    age INT,
    gender VARCHAR(20),
    chronic_conditions TEXT,
    reminder_days INT DEFAULT 25,
    last_purchase_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Sales Log Table
CREATE TABLE IF NOT EXISTS sales_log (
    id BIGINT PRIMARY KEY,
    bill_number VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    total_amount DECIMAL(10,2),
    payment_mode VARCHAR(50),
    sales_person VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. System Activity Audit Logs Table
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action TEXT NOT NULL,
    user VARCHAR(150),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Seed Initial Category Names
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
-- Seed Initial Formulation Types
-- ============================================================
INSERT IGNORE INTO formulations (id, name, description) VALUES
(1, 'Tablet', 'Solid oral dosage form in compressed strip packs'),
(2, 'Capsule', 'Gelatin or HPMC encapsulated powder/pellets'),
(3, 'Syrup / Oral Liquid', 'Liquid oral solution, suspension or elixir'),
(4, 'Injection / Vial', 'Sterile injectable solution or lyophilized vial'),
(5, 'Ointment / Cream / Gel', 'Topical application cream or ointment'),
(6, 'Eye / Ear Drops', 'Sterile ophthalmic or otic drop solution'),
(7, 'Inhaler / Respule', 'Metered dose inhaler or nebulizer solution');
