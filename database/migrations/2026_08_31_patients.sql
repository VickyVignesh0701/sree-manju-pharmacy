-- ============================================================
-- Phase 1: Patients / Regular Customers migration support.
-- ============================================================

-- The frontend patient card shows a "last visit" date; track it explicitly
-- rather than relying on created_at, since a patient's most recent visit
-- updates on every sale, not just their first one.
ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS last_visit TIMESTAMP NULL DEFAULT NULL AFTER visits;

UPDATE patients SET last_visit = created_at WHERE last_visit IS NULL;

-- The Regular Customers form collects free-text notes with no column to hold them.
ALTER TABLE regular_patients
    ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER discount_percent;
