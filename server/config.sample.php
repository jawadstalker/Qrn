<?php
// Copy this file to config.php and fill in your values. Never commit config.php.
return [
    'db' => [
        'dsn'  => 'mysql:host=localhost;dbname=CPANELUSER_dbname;charset=utf8mb4',
        'user' => 'CPANELUSER_dbuser',
        'pass' => 'CHANGE_ME',
    ],
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
