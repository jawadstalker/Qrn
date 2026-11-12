<?php
// Copy this file to config.php and fill in your values. Never commit config.php.
return [
    'db' => [
        'dsn'  => 'mysql:host=localhost;dbname=CPANELUSER_dbname;charset=utf8mb4',
        'user' => 'CPANELUSER_dbuser',
        'pass' => 'CHANGE_ME',
    ],
    // A long random secret (at least 32 characters) used to protect the emailed codes. Make your own; never share it.
    'app_secret' => 'CHANGE_ME_to_a_long_random_string_of_at_least_32_characters',
    'mail' => [
        'driver' => 'smtp',                       // smtp (recommended) | mail | log (tests only)
        'from_email' => 'noreply@example.com',    // a mailbox you created in cPanel > Email Accounts
        'from_name' => 'باغ قرآن',
        'smtp' => [
            'host' => 'mail.example.com',         // cPanel > Email Accounts > Connect Devices > Outgoing server
            'port' => 465,
            'secure' => 'ssl',                    // ssl for 465, tls for 587
            'user' => 'noreply@example.com',      // the full mailbox address
            'pass' => 'CHANGE_ME',
            'verify_tls' => true,                 // set false only if you get a certificate error
        ],
    ],
    'code_ttl_seconds' => 600,           // how long an emailed code works
    'code_max_attempts' => 5,            // wrong tries before the code is burned
    'resend_cooldown_seconds' => 60,
    'mail_max_per_email_hour' => 6,      // emails per address per hour
    'mail_max_per_ip_hour' => 60,
    // Memorization rooms (multiplayer game).
    'room_turn_seconds' => 60,        // time for one turn (bot audio + recitation)
    'room_pass_similarity' => 85,     // % of the ayah's words that must match to count as correct
    'room_max_players' => 8,
    'room_default_lives' => 3,
    'room_create_max_per_hour' => 20,
    'room_join_max_per_hour' => 60,   // wrong room codes per hour
    // "client": the app sends the similarity it measured (testing only; players could cheat).
    // The server-side Whisper check will use another value; until then keep "client".
    'verify_mode' => 'client',
    // Days a login token stays valid after the last use.
    'session_days' => 90,
    // Limits (per window).
    'login_max_failures' => 8,      // per email+IP
    'login_window_seconds' => 900,
    'register_max_per_ip' => 100,   // mobile carriers put many users behind one IP; 15 would block real people
    'register_window_seconds' => 3600,
    // Max size of one synced value (bytes) and number of keys per user.
    'sync_max_value_bytes' => 1048576,
    'sync_max_keys' => 30,
    // Set true only while testing locally.
    'debug' => false,
];
