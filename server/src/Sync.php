<?php
declare(strict_types=1);

/** Stores the app's local-storage values per user. Last write wins, decided by the client's updatedAt. */
final class Sync
{
    public function __construct(private PDO $db, private array $cfg) {}

    private static function checkKey(string $k): void
    {
        if (!preg_match('/^@quran_garden_[a-z0-9_]{1,40}$/', $k)) {
            throw new ApiError(422, 'bad_key', "Key not allowed: $k");
        }
    }

    public function all(int $userId): array
    {
        $st = $this->db->prepare('SELECT k, v, updated_at FROM user_data WHERE user_id = ?');
        $st->execute([$userId]);
        $items = [];
        foreach ($st->fetchAll() as $r) {
            $items[$r['k']] = ['value' => $r['v'], 'updatedAt' => (int)$r['updated_at']];
        }
        return $items;
    }

    /** @return array{accepted:string[], newer:array} */
    public function push(int $userId, mixed $items): array
    {
        if (!is_array($items) || count($items) > $this->cfg['sync_max_keys']) {
            throw new ApiError(422, 'bad_items', 'items must be an object with a limited number of keys.');
        }
        $accepted = [];
        $newer = [];
        $this->db->beginTransaction();
        try {
            $sel = $this->db->prepare('SELECT v, updated_at FROM user_data WHERE user_id = ? AND k = ?');
            $ins = $this->db->prepare('INSERT INTO user_data (user_id, k, v, updated_at) VALUES (?,?,?,?)');
            $upd = $this->db->prepare('UPDATE user_data SET v = ?, updated_at = ? WHERE user_id = ? AND k = ?');
            foreach ($items as $k => $item) {
                $k = (string)$k;
                self::checkKey($k);
                if (!is_array($item) || !is_string($item['value'] ?? null) || !is_int($item['updatedAt'] ?? null) || $item['updatedAt'] < 0) {
                    throw new ApiError(422, 'bad_item', "Item $k needs string value and integer updatedAt.");
                }
                if (strlen($item['value']) > $this->cfg['sync_max_value_bytes']) {
                    throw new ApiError(413, 'too_large', "Value for $k is too large.");
                }
                $sel->execute([$userId, $k]);
                $row = $sel->fetch();
                if (!$row) {
                    $ins->execute([$userId, $k, $item['value'], $item['updatedAt']]);
                    $accepted[] = $k;
                } elseif ($item['updatedAt'] > (int)$row['updated_at']) {
                    $upd->execute([$item['value'], $item['updatedAt'], $userId, $k]);
                    $accepted[] = $k;
                } elseif ($item['updatedAt'] < (int)$row['updated_at']) {
                    $newer[$k] = ['value' => $row['v'], 'updatedAt' => (int)$row['updated_at']];
                } else {
                    $accepted[] = $k; // same version, nothing to do
                }
            }
            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
        return ['accepted' => $accepted, 'newer' => $newer];
    }
}
