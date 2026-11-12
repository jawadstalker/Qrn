-- Only for databases that already imported an earlier schema.mysql.sql (before the memorization rooms existed).
-- Fresh installs must NOT import this file. Import it ONCE in phpMyAdmin (select your database first).

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
