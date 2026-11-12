<?php
declare(strict_types=1);

/**
 * Multiplayer memorization rooms. The server is authoritative: it owns the turn order, timers, lives and scores.
 * Clients poll GET /rooms/{code}?v=<version> and only get a full state when something changed.
 *
 * Range: the bot plays startAyah as the prompt; players then recite startAyah+1 ... endAyah, one ayah per turn.
 *   chain       - cooperative. The bot plays only the first ayah. A wrong answer gets one retry, then the ayah counts as missed.
 *   elimination - every turn the bot plays the previous ayah first. A wrong answer or a timeout costs a life; at 0 lives you are out.
 *                 Last player standing wins; if the range ends first, the highest score wins (a tie is a draw).
 */
final class Rooms
{
    public const MODES = ['chain', 'elimination'];
    private const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    private const POINTS = 10;

    private Profiles $profiles;

    public function __construct(private PDO $db, private array $cfg, private Auth $auth, private ?Closure $clock = null)
    {
        $this->profiles = new Profiles($db, $clock);
    }

    private function now(): int
    {
        return $this->clock ? ($this->clock)() : time();
    }

    private function conf(string $key, int $default): int
    {
        return (int)($this->cfg[$key] ?? $default);
    }

    private function mysql(): bool
    {
        return $this->db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
    }

    private function tx(callable $fn): mixed
    {
        $this->db->beginTransaction();
        try {
            $result = $fn();
            $this->db->commit();
            return $result;
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    // ------------------------------------------------------------------ public API

    public function create(int $uid, array $in): array
    {
        $bucket = 'roomc:' . $uid;
        $this->auth->guard($bucket, $this->conf('room_create_max_per_hour', 20), 3600);
        $this->auth->record($bucket);

        $mode = $in['mode'] ?? null;
        if (!is_string($mode) || !in_array($mode, self::MODES, true)) {
            throw new ApiError(422, 'invalid_room', 'Unknown game mode.');
        }
        $surah = self::intIn($in['surah'] ?? null, 1, 114, null);
        $verses = Quran::verses($surah) ?? 0;
        if ($verses < 2) {
            throw new ApiError(422, 'invalid_room', 'This surah is too short for a game.');
        }
        $start = self::intIn($in['startAyah'] ?? null, 1, $verses - 1, 1);
        $end = self::intIn($in['endAyah'] ?? null, $start + 1, $verses, min($verses, $start + 10));
        if ($end - $start > $this->conf('room_max_ayahs', 50)) {
            throw new ApiError(422, 'invalid_room', 'The range is too long.');
        }
        $max = self::intIn($in['maxPlayers'] ?? null, 1, $this->conf('room_max_players', 8), 4);
        $lives = $mode === 'elimination' ? self::intIn($in['lives'] ?? null, 1, 5, $this->conf('room_default_lives', 3)) : 0;

        $room = $this->tx(function () use ($uid, $mode, $surah, $start, $end, $max, $lives) {
            $this->leaveOtherRooms($uid, null);
            $now = $this->now();
            $code = null;
            for ($i = 0; $i < 8 && $code === null; $i++) {
                $try = self::randomCode();
                try {
                    $this->db->prepare('INSERT INTO rooms (code, host_id, mode, status, surah, start_ayah, end_ayah, max_players, lives, current_ayah, attempt, version, created_at, updated_at)
                        VALUES (?,?,?,?,?,?,?,?,?,?,1,1,?,?)')
                        ->execute([$try, $uid, $mode, 'lobby', $surah, $start, $end, $max, $lives, $start + 1, $now, $now]);
                    $code = $try;
                } catch (PDOException $e) {
                    // Code collision: pick another one.
                }
            }
            if ($code === null) {
                throw new ApiError(503, 'server_busy', 'Could not create a room. Try again.');
            }
            $room = $this->room($code);
            $this->addPlayer($room, $uid);
            if (random_int(1, 10) === 1) {
                $this->cleanup();
            }
            return $room;
        });

        return $this->buildState($this->room($room['code']), $uid);
    }

    public function join(int $uid, mixed $code): array
    {
        $code = self::normalizeCode($code);
        $bucket = 'roomj:' . $uid;
        $this->auth->guard($bucket, $this->conf('room_join_max_per_hour', 60), 3600);

        $this->room($code, false, $bucket); // a wrong code is counted here, outside the transaction, so it is not rolled back

        $room = $this->tx(function () use ($uid, $code) {
            $room = $this->room($code, true);
            $existing = $this->playerRow((int)$room['id'], $uid);
            if ($existing && $existing['status'] !== 'left') {
                return $room;
            }
            if ($room['status'] !== 'lobby') {
                throw new ApiError(409, 'room_started', 'The game has already started.');
            }
            $count = (int)$this->scalar('SELECT COUNT(*) FROM room_players WHERE room_id = ?', [$room['id']]);
            if ($count >= (int)$room['max_players']) {
                throw new ApiError(409, 'room_full', 'The room is full.');
            }
            $this->leaveOtherRooms($uid, (int)$room['id']);
            $this->addPlayer($room, $uid);
            return $room;
        });

        return $this->buildState($this->room($room['code']), $uid);
    }

    public function leave(int $uid, mixed $code): void
    {
        $code = self::normalizeCode($code);
        $this->tx(function () use ($uid, $code) {
            $room = $this->room($code, true);
            if ($this->playerRow((int)$room['id'], $uid)) {
                $this->doLeave($room, $uid);
            }
        });
    }

    public function start(int $uid, mixed $code): array
    {
        $code = self::normalizeCode($code);
        $this->tx(function () use ($uid, $code) {
            $room = $this->room($code, true);
            if ((int)$room['host_id'] !== $uid) {
                throw new ApiError(403, 'not_host', 'Only the host can start the game.');
            }
            if ($room['status'] !== 'lobby') {
                throw new ApiError(409, 'room_started', 'The game has already started.');
            }
            $players = $this->players((int)$room['id']);
            if (count($players) < 1) {
                throw new ApiError(409, 'not_enough_players', 'No players in the room.');
            }
            $lives = (int)$room['lives'];
            $this->db->prepare('UPDATE room_players SET lives = ?, score = 0, status = ? WHERE room_id = ?')->execute([$lives, 'active', $room['id']]);
            $this->setRoom((int)$room['id'], [
                'status' => 'playing',
                'current_ayah' => (int)$room['start_ayah'] + 1,
                'attempt' => 1,
                'turn_user_id' => (int)$players[0]['user_id'],
                'turn_deadline' => $this->now() + $this->turnSeconds(),
            ]);
        });

        return $this->buildState($this->room($code), $uid);
    }

    /** Full state, or ['changed' => false] when the caller already has this version. */
    public function state(int $uid, mixed $code, ?int $since): array
    {
        $code = self::normalizeCode($code);
        $room = $this->room($code);
        $this->requireActivePlayer($room, $uid);

        if ($room['status'] === 'playing' && $room['turn_deadline'] !== null && $this->now() > (int)$room['turn_deadline']) {
            $this->tx(function () use ($code) {
                $this->tick($this->room($code, true));
            });
            $room = $this->room($code);
        }

        if ($since !== null && $since === (int)$room['version']) {
            return ['changed' => false, 'version' => (int)$room['version'], 'serverTime' => $this->now()];
        }
        return $this->buildState($room, $uid);
    }

    /**
     * Reports the result of the caller's turn.
     * In verify_mode "client" the app sends the similarity it measured; "whisper" (server-side checking) is not wired yet.
     */
    public function submit(int $uid, mixed $code, array $in): array
    {
        $mode = (string)($this->cfg['verify_mode'] ?? 'client');
        if ($mode !== 'client') {
            throw new ApiError(501, 'not_available', 'Server-side recitation checking is not enabled yet.');
        }
        $similarity = self::intIn($in['similarity'] ?? null, 0, 100, null);
        $ayah = isset($in['ayah']) ? self::intIn($in['ayah'], 1, 286, null) : null;
        $code = self::normalizeCode($code);

        $this->tx(function () use ($uid, $code, $similarity, $ayah) {
            $room = $this->room($code, true);
            $this->requireActivePlayer($room, $uid);
            $this->tick($room);
            $room = $this->room($code, true);
            if ($room['status'] !== 'playing') {
                throw new ApiError(409, 'not_playing', 'The game is not running.');
            }
            if ((int)$room['turn_user_id'] !== $uid) {
                throw new ApiError(409, 'not_your_turn', 'It is not your turn.');
            }
            if ($ayah !== null && $ayah !== (int)$room['current_ayah']) {
                throw new ApiError(409, 'stale_turn', 'This turn has already moved on.');
            }
            $ok = $similarity >= $this->conf('room_pass_similarity', 85);
            $this->applyResult($room, $uid, $ok, $similarity, 'answer');
        });

        return $this->buildState($this->room($code), $uid);
    }

    // ------------------------------------------------------------------ game logic (call inside a transaction)

    private function tick(array $room): void
    {
        if ($room['status'] === 'playing' && $room['turn_deadline'] !== null && $this->now() > (int)$room['turn_deadline'] && $room['turn_user_id'] !== null) {
            $this->applyResult($room, (int)$room['turn_user_id'], false, null, 'timeout');
        }
    }

    private function applyResult(array $room, int $uid, bool $ok, ?int $similarity, string $kind): void
    {
        $rid = (int)$room['id'];
        $ayah = (int)$room['current_ayah'];
        $this->db->prepare('INSERT INTO room_turns (room_id, user_id, ayah, ok, similarity, kind, created_at) VALUES (?,?,?,?,?,?,?)')
            ->execute([$rid, $uid, $ayah, $ok ? 1 : 0, $similarity, $kind, $this->now()]);

        if ($ok) {
            $this->db->prepare('UPDATE room_players SET score = score + ? WHERE room_id = ? AND user_id = ?')->execute([self::POINTS, $rid, $uid]);
        } elseif ($room['mode'] === 'chain') {
            if ($kind === 'answer' && (int)$room['attempt'] < 2) {
                $this->setRoom($rid, ['attempt' => 2, 'turn_deadline' => $this->now() + $this->turnSeconds()]);
                return;
            }
        } else {
            $this->db->prepare('UPDATE room_players SET lives = CASE WHEN lives > 0 THEN lives - 1 ELSE 0 END WHERE room_id = ? AND user_id = ?')->execute([$rid, $uid]);
            $this->db->prepare('UPDATE room_players SET status = ? WHERE room_id = ? AND user_id = ? AND lives = 0')->execute(['out', $rid, $uid]);
        }

        $this->advance($room, $uid);
    }

    /** Moves to the next ayah and the next player, or finishes the game. */
    private function advance(array $room, int $fromUid): void
    {
        $rid = (int)$room['id'];
        $players = $this->players($rid);
        $next = (int)$room['current_ayah'] + 1;
        $active = array_values(array_filter($players, static fn(array $p): bool => $p['status'] === 'active'));

        if ($next > (int)$room['end_ayah'] || count($active) === 0
            || ($room['mode'] === 'elimination' && count($active) <= 1 && count($players) >= 2)) {
            $this->finish($room, $players);
            return;
        }

        $nextUser = self::nextActive($players, $fromUid);
        if ($nextUser === null) {
            $this->finish($room, $players);
            return;
        }
        $this->setRoom($rid, [
            'current_ayah' => $next,
            'attempt' => 1,
            'turn_user_id' => $nextUser,
            'turn_deadline' => $this->now() + $this->turnSeconds(),
        ]);
    }

    private function finish(array $room, array $players): void
    {
        $winner = null;
        if ($room['mode'] === 'elimination') {
            $eligible = array_values(array_filter($players, static fn(array $p): bool => $p['status'] === 'active'));
            if (count($eligible) === 1) {
                $winner = (int)$eligible[0]['user_id'];
            } elseif (count($eligible) > 1) {
                usort($eligible, static fn(array $a, array $b): int => (int)$b['score'] <=> (int)$a['score']);
                if ((int)$eligible[0]['score'] > (int)$eligible[1]['score']) {
                    $winner = (int)$eligible[0]['user_id'];
                }
            }
        }
        $this->setRoom((int)$room['id'], ['status' => 'finished', 'turn_user_id' => null, 'turn_deadline' => null, 'winner_id' => $winner]);
    }

    private function doLeave(array $room, int $uid): void
    {
        $rid = (int)$room['id'];
        if ($room['status'] === 'lobby') {
            $this->db->prepare('DELETE FROM room_players WHERE room_id = ? AND user_id = ?')->execute([$rid, $uid]);
            $left = $this->players($rid);
            if (count($left) === 0) {
                $this->db->prepare('DELETE FROM rooms WHERE id = ?')->execute([$rid]);
                return;
            }
            $fields = [];
            if ((int)$room['host_id'] === $uid) {
                $fields['host_id'] = (int)$left[0]['user_id'];
            }
            $this->setRoom($rid, $fields);
            return;
        }

        $this->db->prepare('UPDATE room_players SET status = ? WHERE room_id = ? AND user_id = ?')->execute(['left', $rid, $uid]);
        if ($room['status'] !== 'playing') {
            return;
        }
        $players = $this->players($rid);
        $active = array_values(array_filter($players, static fn(array $p): bool => $p['status'] === 'active'));
        if (count($active) === 0 || ($room['mode'] === 'elimination' && count($active) <= 1 && count($players) >= 2)) {
            $this->finish($room, $players);
            return;
        }
        $fields = [];
        if ((int)$room['host_id'] === $uid) {
            $fields['host_id'] = (int)$active[0]['user_id'];
        }
        if ((int)$room['turn_user_id'] === $uid) {
            // Their turn is passed on; the ayah is not consumed.
            $fields += [
                'attempt' => 1,
                'turn_user_id' => self::nextActive($players, $uid) ?? (int)$active[0]['user_id'],
                'turn_deadline' => $this->now() + $this->turnSeconds(),
            ];
        }
        $this->setRoom($rid, $fields);
    }

    /** A player can only be in one live room: joining or creating another one leaves the old one. */
    private function leaveOtherRooms(int $uid, ?int $exceptRoomId): void
    {
        $st = $this->db->prepare("SELECT r.id FROM rooms r JOIN room_players p ON p.room_id = r.id
            WHERE p.user_id = ? AND p.status != 'left' AND r.status IN ('lobby','playing')");
        $st->execute([$uid]);
        foreach ($st->fetchAll() as $row) {
            if ($exceptRoomId !== null && (int)$row['id'] === $exceptRoomId) {
                continue;
            }
            $sql = 'SELECT * FROM rooms WHERE id = ?' . ($this->mysql() ? ' FOR UPDATE' : '');
            $q = $this->db->prepare($sql);
            $q->execute([$row['id']]);
            $other = $q->fetch();
            if ($other) {
                $this->doLeave($other, $uid);
            }
        }
    }

    private function cleanup(): void
    {
        $now = $this->now();
        $this->db->prepare('DELETE FROM rooms WHERE (status = ? AND updated_at < ?) OR (status = ? AND updated_at < ?) OR (status = ? AND updated_at < ?)')
            ->execute(['lobby', $now - 7200, 'playing', $now - 7200, 'finished', $now - 86400]);
    }

    // ------------------------------------------------------------------ helpers

    private function turnSeconds(): int
    {
        return $this->conf('room_turn_seconds', 60);
    }

    private static function nextActive(array $players, int $fromUid): ?int
    {
        $n = count($players);
        $idx = -1;
        foreach ($players as $i => $p) {
            if ((int)$p['user_id'] === $fromUid) {
                $idx = $i;
            }
        }
        for ($step = 1; $step <= $n; $step++) {
            $p = $players[($idx + $step + $n) % $n];
            if ($p['status'] === 'active') {
                return (int)$p['user_id'];
            }
        }
        return null;
    }

    private function setRoom(int $roomId, array $fields): void
    {
        $sets = [];
        $vals = [];
        foreach ($fields as $col => $val) { // column names come from this class only, never from user input
            $sets[] = $col . ' = ?';
            $vals[] = $val;
        }
        $sets[] = 'version = version + 1';
        $sets[] = 'updated_at = ?';
        $vals[] = $this->now();
        $vals[] = $roomId;
        $this->db->prepare('UPDATE rooms SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
    }

    private function addPlayer(array $room, int $uid): void
    {
        $rid = (int)$room['id'];
        $existing = $this->playerRow($rid, $uid);
        if ($existing) {
            $this->db->prepare('UPDATE room_players SET status = ? WHERE room_id = ? AND user_id = ?')->execute(['active', $rid, $uid]);
        } else {
            $seat = (int)$this->scalar('SELECT COALESCE(MAX(seat), -1) + 1 FROM room_players WHERE room_id = ?', [$rid]);
            $this->db->prepare('INSERT INTO room_players (room_id, user_id, seat, lives, score, status, joined_at) VALUES (?,?,?,?,0,?,?)')
                ->execute([$rid, $uid, $seat, (int)$room['lives'], 'active', $this->now()]);
        }
        $this->setRoom($rid, []);
    }

    private function room(string $code, bool $lock = false, ?string $missBucket = null): array
    {
        $st = $this->db->prepare('SELECT * FROM rooms WHERE code = ?' . ($lock && $this->mysql() ? ' FOR UPDATE' : ''));
        $st->execute([$code]);
        $room = $st->fetch();
        if (!$room) {
            if ($missBucket !== null) {
                $this->auth->record($missBucket); // only wrong codes count, to slow down guessing
            }
            throw new ApiError(404, 'room_not_found', 'Room not found.');
        }
        return $room;
    }

    private function playerRow(int $roomId, int $uid): ?array
    {
        $st = $this->db->prepare('SELECT * FROM room_players WHERE room_id = ? AND user_id = ?');
        $st->execute([$roomId, $uid]);
        return $st->fetch() ?: null;
    }

    private function requireActivePlayer(array $room, int $uid): void
    {
        $p = $this->playerRow((int)$room['id'], $uid);
        if (!$p || $p['status'] === 'left') {
            throw new ApiError(403, 'not_in_room', 'You are not in this room.');
        }
    }

    /** Players in seat order, excluding nobody (left/out players stay for the scoreboard). */
    private function players(int $roomId): array
    {
        $st = $this->db->prepare('SELECT user_id, seat, lives, score, status FROM room_players WHERE room_id = ? ORDER BY seat');
        $st->execute([$roomId]);
        return $st->fetchAll();
    }

    private function scalar(string $sql, array $args): mixed
    {
        $st = $this->db->prepare($sql);
        $st->execute($args);
        return $st->fetchColumn();
    }

    private static function randomCode(): string
    {
        $out = '';
        for ($i = 0; $i < 6; $i++) {
            $out .= self::CODE_ALPHABET[random_int(0, strlen(self::CODE_ALPHABET) - 1)];
        }
        return $out;
    }

    public static function normalizeCode(mixed $code): string
    {
        $c = is_string($code) ? strtoupper(trim($code)) : '';
        if (preg_match('/^[A-Z0-9]{6}$/', $c) !== 1) {
            throw new ApiError(404, 'room_not_found', 'Room not found.');
        }
        return $c;
    }

    private static function intIn(mixed $v, int $min, int $max, ?int $default): int
    {
        if ($v === null && $default !== null) {
            return $default;
        }
        $n = filter_var($v, FILTER_VALIDATE_INT);
        if ($n === false || $n < $min || $n > $max) {
            throw new ApiError(422, 'invalid_room', 'A room setting is out of range.');
        }
        return $n;
    }

    // ------------------------------------------------------------------ state for clients

    private function buildState(array $room, int $uid): array
    {
        $rid = (int)$room['id'];
        $st = $this->db->prepare('SELECT p.user_id, p.seat, p.lives, p.score, p.status, pr.display_name, pr.avatar_json
            FROM room_players p LEFT JOIN profiles pr ON pr.user_id = p.user_id WHERE p.room_id = ? ORDER BY p.seat');
        $st->execute([$rid]);
        $players = [];
        foreach ($st->fetchAll() as $p) {
            $id = (int)$p['user_id'];
            $players[] = [
                'userId' => $id,
                'name' => $p['display_name'] !== null ? (string)$p['display_name'] : Profiles::fallbackName($id),
                'avatar' => Profiles::decodeAvatar($p['avatar_json']),
                'seat' => (int)$p['seat'],
                'lives' => (int)$p['lives'],
                'score' => (int)$p['score'],
                'status' => (string)$p['status'],
                'isHost' => $id === (int)$room['host_id'],
            ];
        }

        $q = $this->db->prepare('SELECT user_id, ayah, ok, similarity, kind, created_at FROM room_turns WHERE room_id = ? ORDER BY id DESC LIMIT 20');
        $q->execute([$rid]);
        $turns = array_reverse(array_map(static fn(array $t): array => [
            'userId' => (int)$t['user_id'],
            'ayah' => (int)$t['ayah'],
            'ok' => (int)$t['ok'] === 1,
            'similarity' => $t['similarity'] === null ? null : (int)$t['similarity'],
            'kind' => (string)$t['kind'],
            'at' => (int)$t['created_at'],
        ], $q->fetchAll()));

        $playing = $room['status'] === 'playing';
        $current = (int)$room['current_ayah'];
        $prompt = null;
        if ($playing) {
            if ($room['mode'] === 'elimination') {
                $prompt = $current - 1;
            } elseif ($current === (int)$room['start_ayah'] + 1 && (int)$room['attempt'] === 1) {
                $prompt = (int)$room['start_ayah'];
            }
        }

        return [
            'changed' => true,
            'version' => (int)$room['version'],
            'serverTime' => $this->now(),
            'code' => (string)$room['code'],
            'mode' => (string)$room['mode'],
            'status' => (string)$room['status'],
            'surah' => (int)$room['surah'],
            'startAyah' => (int)$room['start_ayah'],
            'endAyah' => (int)$room['end_ayah'],
            'maxPlayers' => (int)$room['max_players'],
            'lives' => (int)$room['lives'],
            'hostId' => (int)$room['host_id'],
            'turnSeconds' => $this->turnSeconds(),
            'currentAyah' => $playing ? $current : null,
            'promptAyah' => $prompt,
            'attempt' => (int)$room['attempt'],
            'turnUserId' => $room['turn_user_id'] === null ? null : (int)$room['turn_user_id'],
            'turnDeadline' => $room['turn_deadline'] === null ? null : (int)$room['turn_deadline'],
            'winnerId' => $room['winner_id'] === null ? null : (int)$room['winner_id'],
            'players' => $players,
            'turns' => $turns,
        ];
    }
}
