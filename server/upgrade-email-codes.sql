-- Only for databases that already imported the OLD schema.mysql.sql (before email verification existed).
-- Fresh installs must NOT import this file; schema.mysql.sql already contains everything.
-- Import it ONCE in phpMyAdmin (select your database first).
ALTER TABLE users
  ADD COLUMN email_verified_at INT UNSIGNED NULL AFTER email_verified,
  ADD COLUMN last_login_at INT UNSIGNED NULL AFTER email_verified_at;

CREATE TABLE IF NOT EXISTS email_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  purpose VARCHAR(16) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at INT UNSIGNED NOT NULL,
  expires_at INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_codes_user_purpose (user_id, purpose),
  CONSTRAINT fk_codes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
