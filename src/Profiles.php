<?php
declare(strict_types=1);

/** Public player profile: a display name and a few 3D-avatar parameters. Emails are never exposed to other players. */
final class Profiles
{
    private const AVATAR_MAX_BYTES = 1500;
    private const AVATAR_MAX_KEYS = 24;

    public function __construct(private PDO $db, private ?Closure $clock = null) {}

    private function now(): int
    {
        return $this->clock ? ($this->clock)() : time();
    }

    /** @return array{displayName:string,avatar:?array,hasProfile:bool} */
    public function get(int $userId): array
    {
        $st = $this->db->prepare('SELECT display_name, avatar_json FROM profiles WHERE user_id = ?');
        $st->execute([$userId]);
        $row = $st->fetch();
        if (!$row) {
            return ['displayName' => self::fallbackName($userId), 'avatar' => null, 'hasProfile' => false];
        }
        return ['displayName' => (string)$row['display_name'], 'avatar' => self::decodeAvatar($row['avatar_json']), 'hasProfile' => true];
    }

    /** @return array{displayName:string,avatar:?array,hasProfile:bool} */
    public function save(int $userId, mixed $displayName, mixed $avatar): array
    {
        $name = self::cleanName($displayName);
        $json = self::encodeAvatar($avatar);
        $now = $this->now();

        $st = $this->db->prepare('UPDATE profiles SET display_name = ?, avatar_json = ?, updated_at = ? WHERE user_id = ?');
        $st->execute([$name, $json, $now, $userId]);
        if ($st->rowCount() === 0) {
            $exists = $this->db->prepare('SELECT 1 FROM profiles WHERE user_id = ?');
            $exists->execute([$userId]);
            if (!$exists->fetchColumn()) {
                $this->db->prepare('INSERT INTO profiles (user_id, display_name, avatar_json, updated_at) VALUES (?,?,?,?)')
                    ->execute([$userId, $name, $json, $now]);
            }
        }
        return $this->get($userId);
    }

    public static function fallbackName(int $userId): string
    {
        return 'Player ' . $userId;
    }

    private static function cleanName(mixed $v): string
    {
        if (!is_string($v)) {
            throw new ApiError(422, 'invalid_name', 'Display name is required.');
        }
        $v = trim((string)preg_replace('/[\p{C}\p{Zl}\p{Zp}]+/u', ' ', $v));
        $v = (string)preg_replace('/\s+/u', ' ', $v);
        $len = mb_strlen($v, 'UTF-8');
        if ($len < 2 || $len > 24) {
            throw new ApiError(422, 'invalid_name', 'Display name must be 2 to 24 characters.');
        }
        return $v;
    }

    /** Avatars are flat key/value parameters (skin, hair, outfit ...), never code or nested data. */
    private static function encodeAvatar(mixed $avatar): ?string
    {
        if ($avatar === null) {
            return null;
        }
        if (!is_array($avatar) || count($avatar) > self::AVATAR_MAX_KEYS) {
            throw new ApiError(422, 'invalid_avatar', 'Avatar must be a flat object.');
        }
        foreach ($avatar as $k => $val) {
            $okKey = is_string($k) && preg_match('/^[A-Za-z][A-Za-z0-9_]{0,23}$/', $k) === 1;
            $okVal = is_int($val) || is_float($val) || is_bool($val) || $val === null
                || (is_string($val) && mb_strlen($val, 'UTF-8') <= 32 && preg_match('/[\p{C}]/u', $val) !== 1);
            if (!$okKey || !$okVal) {
                throw new ApiError(422, 'invalid_avatar', 'Avatar contains an invalid value.');
            }
        }
        $json = json_encode($avatar, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false || strlen($json) > self::AVATAR_MAX_BYTES) {
            throw new ApiError(422, 'invalid_avatar', 'Avatar is too large.');
        }
        return $json;
    }

    public static function decodeAvatar(mixed $json): ?array
    {
        if (!is_string($json) || $json === '') {
            return null;
        }
        $a = json_decode($json, true);
        return is_array($a) ? $a : null;
    }
}
