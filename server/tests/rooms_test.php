<?php
declare(strict_types=1);

/**
 * Game-logic tests for rooms/profiles (no HTTP): php tests/rooms_test.php
 * Uses SQLite by default; set QG_TEST_DSN / QG_TEST_USER / QG_TEST_PASS (and QG_TEST_SCHEMA) to run against MySQL/MariaDB.
 */
require __DIR__ . '/../src/Http.php';
require __DIR__ . '/../src/Db.php';
require __DIR__ . '/../src/Mailer.php';
require __DIR__ . '/../src/Codes.php';
require __DIR__ . '/../src/Auth.php';
require __DIR__ . '/../src/Quran.php';
require __DIR__ . '/../src/Profiles.php';
require __DIR__ . '/../src/Rooms.php';

$dsn = getenv('QG_TEST_DSN') ?: 'sqlite::memory:';
$isSqlite = str_starts_with($dsn, 'sqlite');
$cfg = [
    'db' => ['dsn' => $dsn, 'user' => getenv('QG_TEST_USER') ?: null, 'pass' => getenv('QG_TEST_PASS') ?: null],
    'app_secret' => 'test_secret_test_secret_test_secret_123456',
    'session_days' => 90, 'login_max_failures' => 8, 'login_window_seconds' => 900,
    'register_max_per_ip' => 100, 'register_window_seconds' => 3600,
    'room_turn_seconds' => 60, 'room_pass_similarity' => 85,
];

$db = Db::pdo($cfg);
if ($isSqlite) {
    $db->exec((string)file_get_contents(__DIR__ . '/schema.sqlite.sql'));
} else {
    foreach (['room_turns', 'room_players', 'rooms', 'profiles', 'email_codes', 'rate_limits', 'user_data', 'sessions', 'users'] as $t) {
        $db->exec("DROP TABLE IF EXISTS $t");
    }
    $schema = (string)file_get_contents(getenv('QG_TEST_SCHEMA') ?: __DIR__ . '/../schema.mysql.sql');
    foreach (array_filter(array_map('trim', preg_split('/;\s*\n/', $schema))) as $stmt) {
        if (!preg_match('/^(--[^\n]*\n?)*$/', $stmt)) {
            $db->exec($stmt);
        }
    }
}

$t = 1_000_000;
$clock = static function () use (&$t): int {
    return $t;
};
$auth = new Auth($db, $cfg);
$rooms = new Rooms($db, $cfg, $auth, $clock);
$profiles = new Profiles($db, $clock);

foreach ([1, 2, 3, 4, 5] as $id) {
    $db->prepare('INSERT INTO users (id, email, password_hash, email_verified, created_at) VALUES (?,?,?,1,?)')
        ->execute([$id, "u$id@example.com", 'x', $t]);
}

$pass = 0;
$fail = 0;
function ok(string $name, bool $cond, string $extra = ''): void
{
    global $pass, $fail;
    if ($cond) {
        $pass++;
        echo "ok   $name\n";
    } else {
        $fail++;
        echo "FAIL $name $extra\n";
    }
}
function throwsCode(callable $fn): string
{
    try {
        $fn();
    } catch (ApiError $e) {
        return $e->errorCode;
    }
    return 'no_error';
}
function eq(string $name, mixed $expected, mixed $actual): void
{
    ok($name, $expected === $actual, '(expected ' . json_encode($expected) . ', got ' . json_encode($actual) . ')');
}
function player(array $state, int $uid): array
{
    foreach ($state['players'] as $p) {
        if ($p['userId'] === $uid) {
            return $p;
        }
    }
    return [];
}

// ---------------------------------------------------------------- profiles
eq('profile fallback name', 'Player 1', $profiles->get(1)['displayName']);
$p = $profiles->save(1, '  Ali  ', ['skin' => 2, 'hair' => 'short', 'hairColor' => '#334455', 'glasses' => true]);
eq('profile saved + trimmed', 'Ali', $p['displayName']);
eq('profile avatar kept', 'short', $p['avatar']['hair']);
$p = $profiles->save(1, 'Ali Reza', null);
eq('profile updated (no duplicate row)', 'Ali Reza', $p['displayName']);
eq('profile row count', 1, (int)$db->query('SELECT COUNT(*) FROM profiles')->fetchColumn());
eq('name too short', 'invalid_name', throwsCode(fn() => $profiles->save(1, 'A', null)));
eq('name not string', 'invalid_name', throwsCode(fn() => $profiles->save(1, ['x'], null)));
eq('avatar nested', 'invalid_avatar', throwsCode(fn() => $profiles->save(1, 'Ali', ['a' => ['b' => 1]])));
eq('avatar bad key', 'invalid_avatar', throwsCode(fn() => $profiles->save(1, 'Ali', ['bad key' => 1])));
eq('avatar long string', 'invalid_avatar', throwsCode(fn() => $profiles->save(1, 'Ali', ['a' => str_repeat('x', 40)])));
eq('avatar too many keys', 'invalid_avatar', throwsCode(fn() => $profiles->save(1, 'Ali', array_fill_keys(array_map(fn($i) => "k$i", range(1, 30)), 1))));
$profiles->save(2, 'Sara', ['skin' => 1]);

// ---------------------------------------------------------------- create validation
$base = ['mode' => 'chain', 'surah' => 78, 'startAyah' => 1, 'endAyah' => 5, 'maxPlayers' => 3];
eq('bad mode', 'invalid_room', throwsCode(fn() => $rooms->create(1, ['mode' => 'x'] + $base)));
eq('bad surah', 'invalid_room', throwsCode(fn() => $rooms->create(1, ['surah' => 115] + $base)));
eq('end <= start', 'invalid_room', throwsCode(fn() => $rooms->create(1, ['endAyah' => 1] + $base)));
eq('end past surah', 'invalid_room', throwsCode(fn() => $rooms->create(1, ['endAyah' => 41] + $base)));
eq('maxPlayers 0', 'invalid_room', throwsCode(fn() => $rooms->create(1, ['maxPlayers' => 0] + $base)));
eq('range too long', 'invalid_room', throwsCode(fn() => $rooms->create(1, ['surah' => 2, 'startAyah' => 1, 'endAyah' => 100] + $base)));
eq('string numbers rejected when not numeric', 'invalid_room', throwsCode(fn() => $rooms->create(1, ['surah' => 'abc'] + $base)));

// ---------------------------------------------------------------- lobby
$s = $rooms->create(1, $base);
$code = $s['code'];
ok('code format', preg_match('/^[A-HJKMNP-Z2-9]{6}$/', $code) === 1, $code);
eq('lobby status', 'lobby', $s['status']);
eq('host is player 1', 1, $s['hostId']);
eq('host seat 0', 0, $s['players'][0]['seat']);
eq('names from profile', 'Ali Reza', $s['players'][0]['name']);
ok('no email leaked', !str_contains(json_encode($s), '@example.com'));

$s = $rooms->join(2, strtolower($code));
eq('join is case-insensitive, 2 players', 2, count($s['players']));
eq('join again is idempotent', 2, count($rooms->join(2, $code)['players']));
eq('unknown code', 'room_not_found', throwsCode(fn() => $rooms->join(3, 'ZZZZZZ')));
eq('malformed code', 'room_not_found', throwsCode(fn() => $rooms->join(3, 'abc')));
$rooms->join(3, $code);
eq('room full (max 3)', 'room_full', throwsCode(fn() => $rooms->join(4, $code)));
eq('outsider cannot see state', 'not_in_room', throwsCode(fn() => $rooms->state(4, $code, null)));
eq('only host starts', 'not_host', throwsCode(fn() => $rooms->start(2, $code)));
eq('turn before start', 'not_playing', throwsCode(fn() => $rooms->submit(1, $code, ['similarity' => 90])));
$rooms->leave(3, $code);
eq('leaving lobby frees the seat', 2, count($rooms->state(1, $code, null)['players']));

// ---------------------------------------------------------------- chain mode
$s = $rooms->start(1, $code);
eq('playing', 'playing', $s['status']);
eq('first turn is host', 1, $s['turnUserId']);
eq('current ayah = start+1', 2, $s['currentAyah']);
eq('chain prompt = start ayah', 1, $s['promptAyah']);
eq('deadline set', $t + 60, $s['turnDeadline']);
eq('join after start', 'room_started', throwsCode(fn() => $rooms->join(4, $code)));
eq('B cannot play on A turn', 'not_your_turn', throwsCode(fn() => $rooms->submit(2, $code, ['similarity' => 99])));
eq('stale ayah', 'stale_turn', throwsCode(fn() => $rooms->submit(1, $code, ['similarity' => 99, 'ayah' => 7])));
eq('similarity required', 'invalid_room', throwsCode(fn() => $rooms->submit(1, $code, [])));
eq('similarity range', 'invalid_room', throwsCode(fn() => $rooms->submit(1, $code, ['similarity' => 101])));

$v0 = $s['version'];
$s = $rooms->submit(1, $code, ['similarity' => 90, 'ayah' => 2]);
eq('A correct -> B turn', 2, $s['turnUserId']);
eq('ayah advanced', 3, $s['currentAyah']);
eq('chain prompt gone after first turn', null, $s['promptAyah']);
eq('A score 10', 10, player($s, 1)['score']);
ok('version bumped', $s['version'] > $v0);
eq('poll unchanged', ['changed' => false, 'version' => $s['version'], 'serverTime' => $t], $rooms->state(2, $code, $s['version']));

$s = $rooms->submit(2, $code, ['similarity' => 50]);
eq('wrong once: B retries', 2, $s['turnUserId']);
eq('same ayah on retry', 3, $s['currentAyah']);
eq('attempt 2', 2, $s['attempt']);
$s = $rooms->submit(2, $code, ['similarity' => 10]);
eq('wrong twice: ayah missed, A turn', 1, $s['turnUserId']);
eq('moved to ayah 4', 4, $s['currentAyah']);
eq('B score unchanged', 0, player($s, 2)['score']);
$s = $rooms->submit(1, $code, ['similarity' => 85]);
eq('threshold is inclusive', 10 + 10, player($s, 1)['score']);
$s = $rooms->submit(2, $code, ['similarity' => 100]);
eq('range complete -> finished', 'finished', $s['status']);
eq('chain has no winner', null, $s['winnerId']);
eq('no turn after finish', null, $s['turnUserId']);
eq('B score 10', 10, player($s, 2)['score']);
eq('turn log length', 5, count($s['turns']));
eq('play after finish', 'not_playing', throwsCode(fn() => $rooms->submit(1, $code, ['similarity' => 99])));

// ---------------------------------------------------------------- solo chain
$s = $rooms->create(1, ['maxPlayers' => 1] + $base);
$solo = $s['code'];
$s = $rooms->start(1, $solo);
foreach ([2, 3, 4, 5] as $a) {
    $s = $rooms->submit(1, $solo, ['similarity' => 100, 'ayah' => $a]);
}
eq('solo chain finishes alone', 'finished', $s['status']);
eq('solo score', 40, player($s, 1)['score']);

// ---------------------------------------------------------------- timeout (elimination)
$el = ['mode' => 'elimination', 'surah' => 78, 'startAyah' => 1, 'endAyah' => 10, 'maxPlayers' => 4, 'lives' => 2];
$s = $rooms->create(1, $el);
$ecode = $s['code'];
$rooms->join(2, $ecode);
$s = $rooms->start(1, $ecode);
eq('elimination prompt = previous ayah', 1, $s['promptAyah']);
eq('lives set at start', 2, player($s, 2)['lives']);
$t += 61;
$s = $rooms->state(2, $ecode, null);
eq('timeout: A lost a life', 1, player($s, 1)['lives']);
eq('timeout: B now', 2, $s['turnUserId']);
eq('timeout logged', 'timeout', end($s['turns'])['kind']);
eq('timeout: prompt follows ayah', 2, $s['promptAyah']);
eq('A cannot play on B turn', 'not_your_turn', throwsCode(fn() => $rooms->submit(1, $ecode, ['similarity' => 99])));
$t += 61;
$s = $rooms->submit(1, $ecode, ['similarity' => 99]); // B timed out first, which makes it A's turn
eq('B timed out when A acted', 1, player($s, 2)['lives']);
eq('A scored after that', 10, player($s, 1)['score']);
eq('turn passes to B', 2, $s['turnUserId']);

// ---------------------------------------------------------------- elimination knock-out
$s = $rooms->submit(2, $ecode, ['similarity' => 0]);
eq('B out at 0 lives', 'out', player($s, 2)['status']);
eq('last standing wins immediately', 'finished', $s['status']);
eq('winner is A', 1, $s['winnerId']);

// ---------------------------------------------------------------- elimination: range ends
$s = $rooms->create(1, ['endAyah' => 3, 'maxPlayers' => 2] + $el);
$rc = $s['code'];
$rooms->join(2, $rc);
$rooms->start(1, $rc);
$rooms->submit(1, $rc, ['similarity' => 100]);
$s = $rooms->submit(2, $rc, ['similarity' => 100]);
eq('range end with equal scores -> draw', 'finished', $s['status']);
eq('draw has no winner', null, $s['winnerId']);

$s = $rooms->create(1, ['endAyah' => 4, 'maxPlayers' => 2] + $el);
$rc = $s['code'];
$rooms->join(2, $rc);
$rooms->start(1, $rc);
$rooms->submit(1, $rc, ['similarity' => 100]); // A 10
$rooms->submit(2, $rc, ['similarity' => 10]);  // B -1 life
$s = $rooms->submit(1, $rc, ['similarity' => 100]); // A 20, range ends
eq('range end: higher score wins', 1, $s['winnerId']);

// ---------------------------------------------------------------- leaving
$s = $rooms->create(1, ['maxPlayers' => 3] + $base);
$lc = $s['code'];
$rooms->join(2, $lc);
$rooms->leave(1, $lc);
$s = $rooms->state(2, $lc, null);
eq('host leaves lobby -> host moves', 2, $s['hostId']);
$rooms->leave(2, $lc);
eq('empty lobby room deleted', 0, (int)$db->query("SELECT COUNT(*) FROM rooms WHERE code = '$lc'")->fetchColumn());

$s = $rooms->create(1, ['maxPlayers' => 3] + $base);
$lc = $s['code'];
$rooms->join(2, $lc);
$rooms->join(3, $lc);
$rooms->start(1, $lc);
$rooms->submit(1, $lc, ['similarity' => 100]); // B's turn on ayah 3
$rooms->leave(2, $lc);
$s = $rooms->state(1, $lc, null);
eq('player leaves on their turn: next player', 3, $s['turnUserId']);
eq('ayah not consumed', 3, $s['currentAyah']);
eq('left status', 'left', player($s, 2)['status']);
eq('left player cannot poll', 'not_in_room', throwsCode(fn() => $rooms->state(2, $lc, null)));
$rooms->leave(3, $lc);
$rooms->leave(1, $lc);
eq('everyone left -> finished', 'finished', (string)$db->query("SELECT status FROM rooms WHERE code = '$lc'")->fetchColumn());

// ---------------------------------------------------------------- one live room per player
$a = $rooms->create(3, $base);
$b = $rooms->create(3, $base);
eq('creating a new room leaves the old lobby', 0, (int)$db->query("SELECT COUNT(*) FROM rooms WHERE code = '{$a['code']}'")->fetchColumn());
$rooms->join(4, $b['code']);
$c = $rooms->create(4, $base);
eq('joined room kept the host', 1, count($rooms->state(3, $b['code'], null)['players']));

// ---------------------------------------------------------------- limits and modes
$limited = new Rooms($db, ['room_create_max_per_hour' => 2] + $cfg, $auth, $clock);
$limited->create(5, $base);
$limited->create(5, $base);
eq('create rate limit', 'rate_limited', throwsCode(fn() => $limited->create(5, $base)));

$whisper = new Rooms($db, ['verify_mode' => 'whisper'] + $cfg, $auth, $clock);
eq('server-side verify not wired yet', 'not_available', throwsCode(fn() => $whisper->submit(2, $b['code'], ['similarity' => 100])));

// ---------------------------------------------------------------- cleanup and cascade
$old = $rooms->create(2, $base);
$t += 7300;
$db->prepare('UPDATE rooms SET updated_at = ? WHERE code = ?')->execute([$t - 7300, $old['code']]);
$ref = new ReflectionMethod($rooms, 'cleanup');
$ref->setAccessible(true);
$ref->invoke($rooms);
eq('stale lobby cleaned up', 0, (int)$db->query("SELECT COUNT(*) FROM rooms WHERE code = '{$old['code']}'")->fetchColumn());
$db->exec('DELETE FROM users WHERE id = 1');
eq('deleting a user removes profile and seats', 0, (int)$db->query('SELECT (SELECT COUNT(*) FROM profiles WHERE user_id = 1) + (SELECT COUNT(*) FROM room_players WHERE user_id = 1) + (SELECT COUNT(*) FROM room_turns WHERE user_id = 1)')->fetchColumn());

echo "passed=$pass failed=$fail\n";
exit($fail === 0 ? 0 : 1);
