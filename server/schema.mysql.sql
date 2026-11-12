-- Import this file once in phpMyAdmin (select your database first).
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  email_verified_at INT UNSIGNED NULL,
  last_login_at INT UNSIGNED NULL,
  created_at INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  device VARCHAR(100) NULL,
  created_at INT UNSIGNED NOT NULL,
  last_used INT UNSIGNED NOT NULL,
  expires_at INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_sessions_token (token_hash),
  KEY idx_sessions_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_data (
  user_id BIGINT UNSIGNED NOT NULL,
  k VARCHAR(64) NOT NULL,
  v MEDIUMTEXT NOT NULL,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, k),
  CONSTRAINT fk_data_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  bucket VARCHAR(190) NOT NULL,
  ts INT UNSIGNED NOT NULL,
  KEY idx_rate_bucket (bucket, ts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One live code per user and purpose ('verify' = email confirmation, 'reset' = password recovery).
-- Only an HMAC of the code is stored, never the code itself.
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

-- ---------------------------------------------------------------------------
-- Memorization rooms (multiplayer game)
-- ---------------------------------------------------------------------------

-- Public name + 3D avatar parameters (small JSON). The email is never shown to other players.
CREATE TABLE IF NOT EXISTS profiles (
  user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  display_name VARCHAR(40) NOT NULL,
  avatar_json TEXT NULL,
  updated_at INT UNSIGNED NOT NULL,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rooms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code CHAR(6) NOT NULL,
  host_id BIGINT UNSIGNED NOT NULL,
  mode VARCHAR(16) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'lobby',
  surah SMALLINT UNSIGNED NOT NULL,
  start_ayah SMALLINT UNSIGNED NOT NULL,
  end_ayah SMALLINT UNSIGNED NOT NULL,
  max_players TINYINT UNSIGNED NOT NULL,
  lives TINYINT UNSIGNED NOT NULL DEFAULT 0,
  current_ayah SMALLINT UNSIGNED NOT NULL,
  turn_user_id BIGINT UNSIGNED NULL,
  attempt TINYINT UNSIGNED NOT NULL DEFAULT 1,
  turn_deadline INT UNSIGNED NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  winner_id BIGINT UNSIGNED NULL,
  created_at INT UNSIGNED NOT NULL,
  updated_at INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_rooms_code (code),
  KEY idx_rooms_updated (updated_at),
  CONSTRAINT fk_rooms_host FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS room_players (
  room_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  seat TINYINT UNSIGNED NOT NULL,
  lives TINYINT UNSIGNED NOT NULL DEFAULT 0,
  score INT UNSIGNED NOT NULL DEFAULT 0,
  status VARCHAR(8) NOT NULL DEFAULT 'active',
  joined_at INT UNSIGNED NOT NULL,
  PRIMARY KEY (room_id, user_id),
  KEY idx_room_players_user (user_id),
  CONSTRAINT fk_rp_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS room_turns (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  room_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  ayah SMALLINT UNSIGNED NOT NULL,
  ok TINYINT(1) NOT NULL,
  similarity TINYINT UNSIGNED NULL,
  kind VARCHAR(8) NOT NULL,
  created_at INT UNSIGNED NOT NULL,
  KEY idx_room_turns_room (room_id, id),
  CONSTRAINT fk_rt_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
