<?php
declare(strict_types=1);

final class Auth
{
    private Codes $codes;

    public function __construct(private PDO $db, private array $cfg)
    {
        $this->codes = new Codes($db, $cfg);
    }

    public static function lang(mixed $v): string
    {
        return $v === 'en' ? 'en' : 'fa';
    }

    /** @return array{id:int,email:string,password_hash:string,email_verified:int}|null */
    private function findUser(string $email): ?array
    {
        $st = $this->db->prepare('SELECT id, email, password_hash, email_verified FROM users WHERE email = ?');
        $st->execute([$email]);
        $u = $st->fetch();
        return $u ?: null;
    }

    public static function normalizeEmail(mixed $email): string
    {
        $e = is_string($email) ? strtolower(trim($email)) : '';
        if ($e === '' || strlen($e) > 190 || !filter_var($e, FILTER_VALIDATE_EMAIL)) {
            throw new ApiError(422, 'invalid_email', 'Email address is not valid.');
        }
        return $e;
    }

    public static function checkPassword(mixed $pw): string
    {
        if (!is_string($pw) || mb_strlen($pw) < 8) {
            throw new ApiError(422, 'weak_password', 'Password must be at least 8 characters.');
        }
        if (strlen($pw) > 200) {
            throw new ApiError(422, 'weak_password', 'Password is too long.');
        }
        return $pw;
    }

    /** Counts events in a bucket during the window; throws 429 when over the limit. */
    public function guard(string $bucket, int $max, int $window): void
    {
        $now = time();
        $st = $this->db->prepare('SELECT COUNT(*) FROM rate_limits WHERE bucket = ? AND ts > ?');
        $st->execute([$bucket, $now - $window]);
        if ((int)$st->fetchColumn() >= $max) {
            throw new ApiError(429, 'rate_limited', 'Too many attempts. Try again later.');
        }
    }

    public function record(string $bucket): void
    {
        $now = time();
        $this->db->prepare('INSERT INTO rate_limits (bucket, ts) VALUES (?, ?)')->execute([$bucket, $now]);
        if (random_int(1, 50) === 1) {
            $this->db->prepare('DELETE FROM rate_limits WHERE ts < ?')->execute([$now - 86400]);
        }
    }

    /** Creates (or re-arms) an unverified account and emails a code. No session until the email is verified. */
    public function register(string $email, string $password, string $lang): array
    {
        $this->guard('reg:' . Http::ip(), $this->cfg['register_max_per_ip'], $this->cfg['register_window_seconds']);
        $this->record('reg:' . Http::ip());
        $this->codes->guardSend($this, $email);

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $u = $this->findUser($email);
        if ($u) {
            if ((int)$u['email_verified'] === 1) {
                throw new ApiError(409, 'email_taken', 'This email is already registered.');
            }
            // Never verified: whoever holds the mailbox may claim it, so the latest password wins.
            $this->db->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $u['id']]);
            $id = (int)$u['id'];
        } else {
            try {
                $this->db->prepare('INSERT INTO users (email, password_hash, email_verified, created_at) VALUES (?, ?, 0, ?)')
                    ->execute([$email, $hash, time()]);
            } catch (PDOException $e) {
                throw new ApiError(409, 'email_taken', 'This email is already registered.');
            }
            $id = (int)$this->db->lastInsertId();
        }

        $this->codes->issue($id, $email, 'verify', $lang, true);
        return ['verificationRequired' => true, 'email' => $email];
    }

    /** Confirms the email with the code, then signs the user in. */
    public function verifyEmail(string $email, mixed $code, ?string $device): array
    {
        $bucket = 'verify:' . $email . '|' . Http::ip();
        $this->guard($bucket, 10, 900);

        $u = $this->findUser($email);
        try {
            if (!$u) {
                throw new ApiError(422, 'code_expired', 'The code has expired. Request a new one.');
            }
            $this->codes->verify((int)$u['id'], 'verify', $code);
        } catch (ApiError $e) {
            $this->record($bucket);
            throw $e;
        }

        $now = time();
        $this->db->prepare('UPDATE users SET email_verified = 1, email_verified_at = COALESCE(email_verified_at, ?), last_login_at = ? WHERE id = ?')
            ->execute([$now, $now, $u['id']]);
        return ['token' => $this->newSession((int)$u['id'], $device), 'user' => ['id' => (int)$u['id'], 'email' => $u['email']]];
    }

    /** Always succeeds from the caller's point of view, so it cannot be used to probe for accounts. */
    public function resendVerification(string $email, string $lang): void
    {
        $this->codes->guardSend($this, $email);
        $u = $this->findUser($email);
        if ($u && (int)$u['email_verified'] === 0) {
            $this->codes->issue((int)$u['id'], $email, 'verify', $lang, false);
        }
    }

    public function forgotPassword(string $email, string $lang): void
    {
        $this->codes->guardSend($this, $email);
        $u = $this->findUser($email);
        if ($u) {
            $this->codes->issue((int)$u['id'], $email, 'reset', $lang, false);
        }
    }

    /** Sets a new password with a recovery code; every existing session is signed out. */
    public function resetPassword(string $email, mixed $code, string $newPassword): void
    {
        $bucket = 'reset:' . $email . '|' . Http::ip();
        $this->guard($bucket, 10, 900);

        $u = $this->findUser($email);
        try {
            if (!$u) {
                throw new ApiError(422, 'code_expired', 'The code has expired. Request a new one.');
            }
            $this->codes->verify((int)$u['id'], 'reset', $code);
        } catch (ApiError $e) {
            $this->record($bucket);
            throw $e;
        }

        $now = time();
        $this->db->beginTransaction();
        try {
            // Receiving the code proves the mailbox is theirs, so the email counts as verified too.
            $this->db->prepare('UPDATE users SET password_hash = ?, email_verified = 1, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?')
                ->execute([password_hash($newPassword, PASSWORD_DEFAULT), $now, $u['id']]);
            $this->db->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$u['id']]);
            $this->db->prepare('DELETE FROM email_codes WHERE user_id = ?')->execute([$u['id']]);
            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    public function login(string $email, string $password, ?string $device, string $lang): array
    {
        $bucket = 'login:' . $email . '|' . Http::ip();
        $this->guard($bucket, $this->cfg['login_max_failures'], $this->cfg['login_window_seconds']);

        $u = $this->findUser($email);
        // Always run a hash check so timing does not reveal whether the email exists.
        $hash = $u['password_hash'] ?? '$2y$10$usesomesillystringforsaltOe5nQy0mC5h3bq9n8mP8wF3m6yZ2e';
        $ok = password_verify($password, $hash);
        if (!$u || !$ok) {
            $this->record($bucket);
            throw new ApiError(401, 'bad_credentials', 'Email or password is incorrect.');
        }
        if (password_needs_rehash($u['password_hash'], PASSWORD_DEFAULT)) {
            $this->db->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
                ->execute([password_hash($password, PASSWORD_DEFAULT), $u['id']]);
        }
        if ((int)$u['email_verified'] !== 1) {
            // Correct password but unconfirmed email: send a fresh code (best effort) and let the app show the code screen.
            $this->codes->issue((int)$u['id'], $u['email'], 'verify', $lang, false);
            throw new ApiError(403, 'email_not_verified', 'Please verify your email first.');
        }
        $this->db->prepare('UPDATE users SET last_login_at = ? WHERE id = ?')->execute([time(), $u['id']]);
        return ['token' => $this->newSession((int)$u['id'], $device), 'user' => ['id' => (int)$u['id'], 'email' => $u['email']]];
    }

    private function newSession(int $userId, ?string $device): string
    {
        $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $now = time();
        $this->db->prepare('INSERT INTO sessions (user_id, token_hash, device, created_at, last_used, expires_at) VALUES (?,?,?,?,?,?)')
            ->execute([$userId, hash('sha256', $token), $device ? mb_substr($device, 0, 100) : null, $now, $now, $now + 86400 * $this->cfg['session_days']]);
        return $token;
    }

    /** @return array{id:int,email:string,session_id:int} */
    public function authenticate(): array
    {
        $token = Http::bearer();
        if ($token === null) {
            throw new ApiError(401, 'unauthorized', 'Login required.');
        }
        $st = $this->db->prepare(
            'SELECT s.id AS sid, s.last_used, u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id
             WHERE s.token_hash = ? AND s.expires_at > ?'
        );
        $st->execute([hash('sha256', $token), time()]);
        $r = $st->fetch();
        if (!$r) {
            throw new ApiError(401, 'unauthorized', 'Session expired. Please log in again.');
        }
        if (time() - (int)$r['last_used'] > 86400) {
            $now = time();
            $this->db->prepare('UPDATE sessions SET last_used = ?, expires_at = ? WHERE id = ?')
                ->execute([$now, $now + 86400 * $this->cfg['session_days'], $r['sid']]);
        }
        return ['id' => (int)$r['id'], 'email' => $r['email'], 'session_id' => (int)$r['sid']];
    }

    public function verifyPassword(int $userId, mixed $password): void
    {
        $st = $this->db->prepare('SELECT password_hash FROM users WHERE id = ?');
        $st->execute([$userId]);
        $h = $st->fetchColumn();
        if (!is_string($password) || !$h || !password_verify($password, $h)) {
            throw new ApiError(403, 'bad_password', 'Password is incorrect.');
        }
    }

    public function changePassword(int $userId, int $keepSession, string $new): void
    {
        $this->db->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($new, PASSWORD_DEFAULT), $userId]);
        $this->db->prepare('DELETE FROM sessions WHERE user_id = ? AND id <> ?')->execute([$userId, $keepSession]);
    }

    public function deleteAccount(int $userId): void
    {
        $this->db->beginTransaction();
        foreach (['user_data', 'sessions', 'email_codes'] as $t) {
            $this->db->prepare("DELETE FROM $t WHERE user_id = ?")->execute([$userId]);
        }
        $this->db->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);
        $this->db->commit();
    }

    public function logout(int $sessionId): void
    {
        $this->db->prepare('DELETE FROM sessions WHERE id = ?')->execute([$sessionId]);
    }
}
