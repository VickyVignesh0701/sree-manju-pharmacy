-- ============================================================
-- Auth hardening: server-side registration, password hashing,
-- and token-based password reset.
-- ============================================================

-- role_label carries the display role ('Primary Owner', 'Co-Owner',
-- 'Staff Pharmacist') separately from `role`, which stays a coarse
-- permission tier ('Owner' / 'Staff') that requireRole() checks against.
ALTER TABLE staff_members
    ADD COLUMN IF NOT EXISTS role_label VARCHAR(100) NULL AFTER role;

UPDATE staff_members SET role_label = role WHERE role_label IS NULL;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_id BIGINT NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_token_hash (token_hash),
    KEY idx_staff_id (staff_id),
    CONSTRAINT fk_reset_token_staff FOREIGN KEY (staff_id) REFERENCES staff_members(id) ON DELETE CASCADE
);
