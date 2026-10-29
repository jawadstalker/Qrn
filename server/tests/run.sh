#!/usr/bin/env bash
# Local API test: PHP built-in server + SQLite. Usage: bash tests/run.sh
set -u
cd "$(dirname "$0")/.."
T=$(mktemp -d)
sqlite3 "$T/t.db" < tests/schema.sqlite.sql 2>/dev/null || php -r '$d=new PDO("sqlite:$argv[1]");$d->exec(file_get_contents("tests/schema.sqlite.sql"));' "$T/t.db"
cat > "$T/config.php" <<PHP
<?php return ['db'=>['dsn'=>'sqlite:$T/t.db','user'=>null,'pass'=>null],'session_days'=>90,'login_max_failures'=>3,'login_window_seconds'=>900,'register_max_per_ip'=>50,'register_window_seconds'=>3600,'sync_max_value_bytes'=>1000,'sync_max_keys'=>5,'debug'=>true];
PHP
QG_CONFIG="$T/config.php" php -S 127.0.0.1:8099 index.php >"$T/server.log" 2>&1 &
PID=$!; sleep 1
U=http://127.0.0.1:8099; PASS=0; FAIL=0
req() { curl -s -o "$T/out" -w '%{http_code}' -X "$1" "$U$2" -H 'Content-Type: application/json' ${4:+-H "Authorization: Bearer $4"} ${3:+-d "$3"}; }
check() { # name expectedStatus actualStatus [grep]
  if [ "$2" = "$3" ] && { [ -z "${4:-}" ] || grep -q -- "$4" "$T/out"; }; then PASS=$((PASS+1)); echo "ok   $1"; else FAIL=$((FAIL+1)); echo "FAIL $1 (got $3, expected $2) $(cat $T/out)"; fi; }

check health 200 "$(req GET /health)"
check "register bad email" 422 "$(req POST /auth/register '{"email":"nope","password":"password1"}')" invalid_email
check "register weak pw" 422 "$(req POST /auth/register '{"email":"a@b.com","password":"123"}')" weak_password
S=$(req POST /auth/register '{"email":"User@Example.com","password":"password1"}'); check register 201 "$S" '"email":"user@example.com"'
TOKEN=$(php -r 'echo json_decode(file_get_contents($argv[1]),true)["token"];' "$T/out")
check "register duplicate" 409 "$(req POST /auth/register '{"email":"user@example.com","password":"password1"}')" email_taken
check "me without token" 401 "$(req GET /me)"
check "me" 200 "$(req GET /me '' "$TOKEN")" user@example.com
check "login wrong pw" 401 "$(req POST /auth/login '{"email":"user@example.com","password":"wrongpass"}')" bad_credentials
check "login unknown email" 401 "$(req POST /auth/login '{"email":"x@example.com","password":"wrongpass"}')" bad_credentials
check "login ok" 200 "$(req POST /auth/login '{"email":"USER@example.com","password":"password1"}')" token
for i in 1 2 3; do req POST /auth/login '{"email":"rl@example.com","password":"wrongpass"}' >/dev/null; done
check "login rate limit" 429 "$(req POST /auth/login '{"email":"rl@example.com","password":"wrongpass"}')" rate_limited
check "sync empty" 200 "$(req GET /sync '' "$TOKEN")" '"items":{}'
check "sync push" 200 "$(req PUT /sync '{"items":{"@quran_garden_plan_v1":{"value":"{\"a\":1}","updatedAt":100}}}' "$TOKEN")" '"accepted":\["@quran_garden_plan_v1"\]'
check "sync older rejected" 200 "$(req PUT /sync '{"items":{"@quran_garden_plan_v1":{"value":"old","updatedAt":50}}}' "$TOKEN")" '"newer":{"@quran_garden_plan_v1"'
check "sync newer wins" 200 "$(req PUT /sync '{"items":{"@quran_garden_plan_v1":{"value":"new","updatedAt":200}}}' "$TOKEN")" '"accepted":\["@quran_garden_plan_v1"\]'
check "sync get" 200 "$(req GET /sync '' "$TOKEN")" '"value":"new"'
check "sync bad key" 422 "$(req PUT /sync '{"items":{"evil":{"value":"x","updatedAt":1}}}' "$TOKEN")" bad_key
check "sync too large" 413 "$(req PUT /sync "{\"items\":{\"@quran_garden_x\":{\"value\":\"$(printf 'a%.0s' $(seq 1 1100))\",\"updatedAt\":1}}}" "$TOKEN")" too_large
check "sync too many keys" 422 "$(req PUT /sync '{"items":{"@quran_garden_a":{"value":"1","updatedAt":1},"@quran_garden_b":{"value":"1","updatedAt":1},"@quran_garden_c":{"value":"1","updatedAt":1},"@quran_garden_d":{"value":"1","updatedAt":1},"@quran_garden_e":{"value":"1","updatedAt":1},"@quran_garden_f":{"value":"1","updatedAt":1}}}' "$TOKEN")" bad_items
check "change pw wrong current" 403 "$(req POST /me/password '{"currentPassword":"nope","newPassword":"newpassword1"}' "$TOKEN")" bad_password
check "change pw" 200 "$(req POST /me/password '{"currentPassword":"password1","newPassword":"newpassword1"}' "$TOKEN")"
check "logout" 200 "$(req POST /auth/logout '' "$TOKEN")"
check "token dead after logout" 401 "$(req GET /me '' "$TOKEN")"
S=$(req POST /auth/login '{"email":"user@example.com","password":"newpassword1"}'); check "login new pw" 200 "$S"
TOKEN=$(php -r 'echo json_decode(file_get_contents($argv[1]),true)["token"];' "$T/out")
check "delete wrong pw" 403 "$(req DELETE /me '{"password":"nope"}' "$TOKEN")" bad_password
check "delete account" 200 "$(req DELETE /me '{"password":"newpassword1"}' "$TOKEN")"
check "token dead after delete" 401 "$(req GET /me '' "$TOKEN")"
ROWS=$(php -r '$d=new PDO("sqlite:$argv[1]");echo (int)$d->query("select count(*) from user_data")->fetchColumn()+(int)$d->query("select count(*) from users")->fetchColumn()+(int)$d->query("select count(*) from sessions")->fetchColumn();' "$T/t.db")
if [ "$ROWS" = "0" ]; then PASS=$((PASS+1)); echo "ok   all user rows removed on delete"; else FAIL=$((FAIL+1)); echo "FAIL rows remain: $ROWS"; fi
check "register again after delete" 201 "$(req POST /auth/register '{"email":"user@example.com","password":"password1"}')"
check "unknown route" 404 "$(req GET /nope)"
kill $PID 2>/dev/null; rm -rf "$T"
echo "passed=$PASS failed=$FAIL"; [ $FAIL -eq 0 ]
