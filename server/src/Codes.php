<?php
declare(strict_types=1);

/** Six-digit email codes for 'verify' (email confirmation) and 'reset' (password recovery). */
final class Codes
{
    public function __construct(private PDO $db, private array $cfg) {}

    private function secret(): string
    {
        $s = (string)($this->cfg['app_secret'] ?? '');
        if (strlen($s) < 32 || str_contains($s, 'CHANGE_ME')) {
            error_log('[quran-garden-api] app_secret in config.php is missing or too short (min 32 chars).');
            throw new ApiError(500, 'not_configured', 'Server is not configured.');
        }
        return $s;
    }

    private function hash(int $userId, string $purpose, string $code): string
    {
        return hash_hmac('sha256', $userId . '|' . $purpose . '|' . $code, $this->secret());
    }

    /** Same limits for every email address, existing or not, so responses never reveal who has an account. */
    public function guardSend(Auth $auth, string $email): void
    {
        $perEmail = 'mail:' . $email;
        $perIp = 'mailip:' . Http::ip();
        $auth->guard($perEmail, (int)($this->cfg['mail_max_per_email_hour'] ?? 6), 3600);
        $auth->guard($perIp, (int)($this->cfg['mail_max_per_ip_hour'] ?? 60), 3600);
        $auth->record($perEmail);
        $auth->record($perIp);
    }

    /**
     * Creates a fresh code (replacing the old one) and emails it.
     * Silently does nothing while the resend cooldown of the previous code is running.
     * When $strict is false, mail failures are only logged.
     */
    public function issue(int $userId, string $email, string $purpose, string $lang, bool $strict): void
    {
        $this->secret(); // fail early when the server is not configured

        $now = time();
        $st = $this->db->prepare('SELECT created_at FROM email_codes WHERE user_id = ? AND purpose = ?');
        $st->execute([$userId, $purpose]);
        $last = $st->fetchColumn();
        if ($last !== false && $now - (int)$last < (int)($this->cfg['resend_cooldown_seconds'] ?? 60)) {
            return;
        }

        $ttl = (int)($this->cfg['code_ttl_seconds'] ?? 600);
        $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $this->db->beginTransaction();
        try {
            $this->db->prepare('DELETE FROM email_codes WHERE user_id = ? AND purpose = ?')->execute([$userId, $purpose]);
            $this->db->prepare('INSERT INTO email_codes (user_id, purpose, code_hash, attempts, created_at, expires_at) VALUES (?,?,?,0,?,?)')
                ->execute([$userId, $purpose, $this->hash($userId, $purpose, $code), $now, $now + $ttl]);
            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }

        try {
            [$subject, $text, $html] = Mailer::template($purpose, $lang, $code, max(1, intdiv($ttl, 60)));
            Mailer::send($this->cfg, $email, $subject, $text, $html);
        } catch (Throwable $e) {
            error_log('[quran-garden-api] ' . $e->getMessage());
            // Drop the unsent code so the cooldown does not block a retry.
            $this->db->prepare('DELETE FROM email_codes WHERE user_id = ? AND purpose = ?')->execute([$userId, $purpose]);
            if ($strict) {
                throw new ApiError(503, 'mail_failed', 'Could not send the email.');
            }
        }
    }

    /** Consumes the code on success. Throws code_expired or bad_code otherwise. */
    public function verify(int $userId, string $purpose, mixed $code): void
    {
        $st = $this->db->prepare('SELECT attempts, code_hash, expires_at FROM email_codes WHERE user_id = ? AND purpose = ?');
        $st->execute([$userId, $purpose]);
        $row = $st->fetch();
        $max = (int)($this->cfg['code_max_attempts'] ?? 5);

        if (!$row || (int)$row['expires_at'] <= time() || (int)$row['attempts'] >= $max) {
            if ($row) {
                $this->db->prepare('DELETE FROM email_codes WHERE user_id = ? AND purpose = ?')->execute([$userId, $purpose]);
            }
            throw new ApiError(422, 'code_expired', 'The code has expired. Request a new one.');
        }

        $given = is_string($code) ? self::latinDigits(trim($code)) : '';
        if (!preg_match('/^\d{6}$/', $given) || !hash_equals((string)$row['code_hash'], $this->hash($userId, $purpose, $given))) {
            $this->db->prepare('UPDATE email_codes SET attempts = attempts + 1 WHERE user_id = ? AND purpose = ?')->execute([$userId, $purpose]);
            throw new ApiError(422, 'bad_code', 'The code is not correct.');
        }

        $this->db->prepare('DELETE FROM email_codes WHERE user_id = ? AND purpose = ?')->execute([$userId, $purpose]);
    }

    /** Accepts Persian and Arabic-Indic digits typed on phone keyboards. */
    private static function latinDigits(string $s): string
    {
        return strtr($s, [
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4', '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
            '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
        ]);
    }
}
