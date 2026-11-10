<?php
declare(strict_types=1);

/**
 * Sends the verification / recovery emails. No composer needed.
 *
 * Drivers (config 'mail' => ['driver' => ...]):
 *   smtp - recommended on cPanel: log in with a real mailbox you created in cPanel.
 *   mail - PHP's mail(); works without credentials on most hosts, but deliverability is worse.
 *   log  - appends the message to a file. Only for local tests, never in production.
 */
final class Mailer
{
    /** @return array{0:string,1:string,2:string} subject, plain text, html */
    public static function template(string $purpose, string $lang, string $code, int $ttlMinutes): array
    {
        $e = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        if ($lang === 'en') {
            $isReset = $purpose === 'reset';
            $subject = $isReset ? 'Quran Garden password reset code' : 'Quran Garden email verification code';
            $intro = $isReset ? 'Use this code to reset your password:' : 'Use this code to verify your email address:';
            $outro = "The code is valid for $ttlMinutes minutes. If you did not request it, you can ignore this email; nothing will change.";
            $dir = 'ltr';
        } else {
            $isReset = $purpose === 'reset';
            $subject = $isReset ? 'کد بازیابی رمز عبور باغ قرآن' : 'کد تأیید ایمیل باغ قرآن';
            $intro = $isReset ? 'برای تعیین رمز عبور جدید این کد را وارد کن:' : 'برای تأیید ایمیلت این کد را وارد کن:';
            $outro = "این کد $ttlMinutes دقیقه اعتبار دارد. اگر خودت درخواست نداده‌ای این ایمیل را نادیده بگیر؛ هیچ تغییری ایجاد نمی‌شود.";
            $dir = 'rtl';
        }

        $text = "$intro\n\n$code\n\n$outro\n";
        $html = '<!doctype html><html dir="' . $dir . '"><head><meta charset="utf-8"></head>'
            . '<body style="margin:0;padding:24px;background:#f4f6f5;font-family:Tahoma,Arial,sans-serif;color:#1f2933">'
            . '<div style="max-width:420px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px;text-align:center">'
            . '<p style="font-size:16px;line-height:1.8;margin:0 0 16px">' . $e($intro) . '</p>'
            . '<p dir="ltr" style="font-size:34px;letter-spacing:8px;font-weight:700;margin:0 0 16px;font-family:Consolas,monospace">' . $e($code) . '</p>'
            . '<p style="font-size:13px;line-height:1.8;color:#667085;margin:0">' . $e($outro) . '</p>'
            . '</div></body></html>';

        return [$subject, $text, $html];
    }

    public static function send(array $cfg, string $to, string $subject, string $text, string $html): void
    {
        $m = $cfg['mail'] ?? [];
        $driver = (string)($m['driver'] ?? 'smtp');
        $fromEmail = (string)($m['from_email'] ?? '');
        if (!filter_var($fromEmail, FILTER_VALIDATE_EMAIL) || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Mail: invalid from_email or recipient.');
        }
        $fromName = (string)($m['from_name'] ?? '');

        if ($driver === 'log') {
            $file = (string)($m['log_file'] ?? '');
            if ($file === '') {
                throw new RuntimeException('Mail: log driver needs mail.log_file.');
            }
            file_put_contents($file, json_encode(['to' => $to, 'subject' => $subject, 'text' => $text], JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
            return;
        }

        [$headers, $body] = self::build($fromEmail, $fromName, $text, $html);

        if ($driver === 'mail') {
            $ok = mail($to, self::encodeHeader($subject), $body, implode("\r\n", $headers), '-f' . $fromEmail);
            if (!$ok) {
                throw new RuntimeException('Mail: mail() returned false.');
            }
            return;
        }

        if ($driver !== 'smtp') {
            throw new RuntimeException("Mail: unknown driver '$driver'.");
        }
        $headers[] = 'To: <' . $to . '>';
        $headers[] = 'Subject: ' . self::encodeHeader($subject);
        self::smtp((array)($m['smtp'] ?? []), $fromEmail, $to, implode("\r\n", $headers) . "\r\n\r\n" . $body);
    }

    /** @return array{0:string[],1:string} headers (without To/Subject) and body */
    private static function build(string $fromEmail, string $fromName, string $text, string $html): array
    {
        $boundary = '=_qg_' . bin2hex(random_bytes(12));
        $domain = substr(strrchr($fromEmail, '@') ?: '@localhost', 1);
        $from = $fromName !== ''
            ? self::encodeHeader(str_replace(['"', "\r", "\n"], '', $fromName)) . ' <' . $fromEmail . '>'
            : '<' . $fromEmail . '>';

        $headers = [
            'From: ' . $from,
            'Date: ' . date('r'),
            'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $domain . '>',
            'MIME-Version: 1.0',
            'Auto-Submitted: auto-generated',
            'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
        ];

        $part = static fn(string $type, string $content): string =>
            "--$boundary\r\nContent-Type: $type; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($content), 76, "\r\n");

        $body = $part('text/plain', $text) . $part('text/html', $html) . "--$boundary--\r\n";

        return [$headers, $body];
    }

    private static function encodeHeader(string $value): string
    {
        $value = str_replace(["\r", "\n"], ' ', $value);
        return preg_match('/^[\x20-\x7E]*$/', $value) ? $value : '=?UTF-8?B?' . base64_encode($value) . '?=';
    }

    private static function smtp(array $s, string $fromEmail, string $to, string $data): void
    {
        $host = (string)($s['host'] ?? '');
        $port = (int)($s['port'] ?? 465);
        $secure = (string)($s['secure'] ?? 'ssl'); // ssl (465) | tls = STARTTLS (587) | none (25, local only)
        $verify = ($s['verify_tls'] ?? true) !== false;
        if ($host === '') {
            throw new RuntimeException('Mail: smtp.host is empty.');
        }

        $ctx = stream_context_create(['ssl' => [
            'verify_peer' => $verify,
            'verify_peer_name' => $verify,
            'allow_self_signed' => !$verify,
            'peer_name' => $host,
            'SNI_enabled' => true,
        ]]);
        $remote = ($secure === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
        $fp = @stream_socket_client($remote, $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $ctx);
        if (!$fp) {
            throw new RuntimeException("Mail: cannot connect to $remote: $errstr ($errno)");
        }
        stream_set_timeout($fp, 15);

        try {
            $helo = gethostname() ?: 'localhost';
            self::expect($fp, [220]);
            self::cmd($fp, "EHLO $helo", [250]);
            if ($secure === 'tls') {
                self::cmd($fp, 'STARTTLS', [220]);
                if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    throw new RuntimeException('Mail: STARTTLS handshake failed.');
                }
                self::cmd($fp, "EHLO $helo", [250]);
            }
            $user = (string)($s['user'] ?? '');
            if ($user !== '') {
                self::cmd($fp, 'AUTH LOGIN', [334]);
                self::cmd($fp, base64_encode($user), [334]);
                self::cmd($fp, base64_encode((string)($s['pass'] ?? '')), [235], true);
            }
            self::cmd($fp, "MAIL FROM:<$fromEmail>", [250]);
            self::cmd($fp, "RCPT TO:<$to>", [250, 251]);
            self::cmd($fp, 'DATA', [354]);
            $data = preg_replace('/^\./m', '..', str_replace(["\r\n", "\r"], "\n", $data));
            fwrite($fp, str_replace("\n", "\r\n", (string)$data) . "\r\n.\r\n");
            self::expect($fp, [250]);
            try {
                self::cmd($fp, 'QUIT', [221]);
            } catch (Throwable) {
                // The message is already accepted; a rough goodbye is harmless.
            }
        } finally {
            fclose($fp);
        }
    }

    /** @param resource $fp */
    private static function cmd($fp, string $line, array $ok, bool $secret = false): void
    {
        if (fwrite($fp, $line . "\r\n") === false) {
            throw new RuntimeException('Mail: connection closed while writing.');
        }
        self::expect($fp, $ok, $secret ? 'AUTH' : $line);
    }

    /** @param resource $fp */
    private static function expect($fp, array $ok, string $after = 'connect'): void
    {
        $code = 0;
        $reply = '';
        for ($i = 0; $i < 50; $i++) {
            $line = fgets($fp, 1024);
            if ($line === false) {
                throw new RuntimeException("Mail: server closed the connection after '$after'.");
            }
            $reply .= $line;
            $code = (int)substr($line, 0, 3);
            if (strlen($line) < 4 || $line[3] !== '-') {
                break;
            }
        }
        if (!in_array($code, $ok, true)) {
            throw new RuntimeException("Mail: unexpected reply after '$after': " . trim($reply));
        }
    }
}
