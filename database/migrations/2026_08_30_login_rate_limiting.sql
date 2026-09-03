-- ============================================================
-- Phase 2 hardening: login rate limiting.
-- ============================================================

-- Tracks failed login attempts per identifier (IP + attempted email combined)
-- so a lockout survives across separate PHP requests, which don't share
-- memory of their own between calls.
CREATE TABLE IF NOT EXISTS login_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_identifier_time (identifier, attempted_at)
);
