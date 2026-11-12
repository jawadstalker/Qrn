#!/usr/bin/env bash
# Local API test: PHP built-in server + SQLite. Usage: bash tests/run.sh
set -u
cd "$(dirname "$0")/.."
T=$(mktemp -d)
sqlite3 "$T/t.db" < tests/schema.sqlite.sql 2>/dev/null || php -r '$d=new PDO("sqlite:$argv[1]");$d->exec(file_get_contents("tests/schema.sqlite.sql"));' "$T/t.db"
cat > "$T/config.php" <<PHP
<?php return ['db'=>['dsn'=>'sqlite:$T/t.db','user'=>null,'pass'=>null],'session_days'=>90,'login_max_failures'=>3,'login_window_seconds'=>900,'register_max_per_ip'=>50,'register_window_seconds'=>3600,'sync_max_value_bytes'=>1000,'sync_max_keys'=>5,'debug'=>true,'app_secret'=>'test_secret_test_secret_test_secret_123456','mail'=>['driver'=>'log','from_email'=>'noreply@example.com','from_name'=>'QG','log_file'=>'$T/mail.log'],'code_ttl_seconds'=>600,'code_max_attempts'=>5,'resend_cooldown_seconds'=>2,'mail_max_per_email_hour'=>20,'mail_max_per_ip_hour'=>200];
PHP
QG_CONFIG="$T/config.php" php -S 127.0.0.1:8099 index.php >"$T/server.log" 2>&1 &
PID=$!; sleep 1
U=http://127.0.0.1:8099; PASS=0; FAIL=0
req() { curl -s -o "$T/out" -w '%{http_code}' -X "$1" "$U$2" -H 'Content-Type: application/json' ${4:+-H "Authorization: Bearer $4"} ${3:+-d "$3"}; }
check() { # name expectedStatus actualStatus [grep]
  if [ "$2" = "$3" ] && { [ -z "${4:-}" ] || grep -q -- "$4" "$T/out"; }; then PASS=$((PASS+1)); echo "ok   $1"; else FAIL=$((FAIL+1)); echo "FAIL $1 (got $3, expected $2) $(cat $T/out)"; fi; }

mails() { [ -f "$T/mail.log" ] && wc -l < "$T/mail.log" | tr -d ' ' || echo 0; }
code_of() { python3 - "$T/mail.log" "$1" <<'PY'
import json,re,sys
last=None
for line in open(sys.argv[1]):
    m=json.loads(line)
    if m["to"]==sys.argv[2]: last=m
print(re.search(r"\b(\d{6})\b", last["text"]).group(1) if last else "")
PY
}
flip() { # same number differs in the last digit, guaranteed wrong
  python3 -c "import sys;c=sys.argv[1];print(c[:-1]+str((int(c[-1])+1)%10))" "$1"; }
persian() { python3 -c "import sys;print(sys.argv[1].translate(str.maketrans('0123456789','۰۱۲۳۴۵۶۷۸۹')))" "$1"; }
sq() { sqlite3 "$T/t.db" "$1"; }
eq() { # name expected actual
  if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "ok   $1"; else FAIL=$((FAIL+1)); echo "FAIL $1 (got '$3', expected '$2')"; fi; }

check health 200 "$(req GET /health)"
PRE=$(curl -s -o /dev/null -D "$T/hdr" -w '%{http_code}' -X OPTIONS "$U/auth/register" -H 'Origin: http://localhost:8081' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type')
eq "cors preflight status" 204 "$PRE"
if grep -qi '^access-control-allow-origin: \*' "$T/hdr" && grep -qi '^access-control-allow-headers:.*authorization' "$T/hdr"; then PASS=$((PASS+1)); echo "ok   cors preflight headers"; else FAIL=$((FAIL+1)); echo "FAIL cors preflight headers"; fi
curl -s -o /dev/null -D "$T/hdr" -X POST "$U/auth/login" -H 'Content-Type: application/json' -d '{}'
if grep -qi '^access-control-allow-origin: \*' "$T/hdr"; then PASS=$((PASS+1)); echo "ok   cors on error responses"; else FAIL=$((FAIL+1)); echo "FAIL cors on error responses"; fi
check "register bad email" 422 "$(req POST /auth/register '{"email":"nope","password":"password1"}')" invalid_email
check "register weak pw" 422 "$(req POST /auth/register '{"email":"a@b.com","password":"123"}')" weak_password
check register 201 "$(req POST /auth/register '{"email":"User@Example.com","password":"password1","lang":"en"}')" '"verificationRequired":true'
if grep -q '"token"' "$T/out"; then FAIL=$((FAIL+1)); echo "FAIL register must not return a token"; else PASS=$((PASS+1)); echo "ok   register returns no token"; fi
eq "register sent one mail" 1 "$(mails)"
CODE=$(code_of user@example.com)
check "login before verify" 403 "$(req POST /auth/login '{"email":"user@example.com","password":"password1"}')" email_not_verified
check "me without token" 401 "$(req GET /me)"
check "verify wrong code" 422 "$(req POST /auth/verify "{\"email\":\"user@example.com\",\"code\":\"$(flip $CODE)\"}")" bad_code
check "verify non-numeric code" 422 "$(req POST /auth/verify '{"email":"user@example.com","code":"abcdef"}')" bad_code
check "verify unknown email" 422 "$(req POST /auth/verify '{"email":"ghost@example.com","code":"123456"}')" code_expired
check "verify ok" 200 "$(req POST /auth/verify "{\"email\":\"user@example.com\",\"code\":\"$CODE\"}")" token
TOKEN=$(php -r 'echo json_decode(file_get_contents($argv[1]),true)["token"];' "$T/out")
check "verify code is single use" 422 "$(req POST /auth/verify "{\"email\":\"user@example.com\",\"code\":\"$CODE\"}")" code_expired
check "register duplicate" 409 "$(req POST /auth/register '{"email":"user@example.com","password":"password1"}')" email_taken
check "me" 200 "$(req GET /me '' "$TOKEN")" user@example.com
check "login wrong pw" 401 "$(req POST /auth/login '{"email":"user@example.com","password":"wrongpass"}')" bad_credentials
check "login unknown email" 401 "$(req POST /auth/login '{"email":"x@example.com","password":"wrongpass"}')" bad_credentials
check "login ok" 200 "$(req POST /auth/login '{"email":"USER@example.com","password":"password1"}')" token
eq "last_login_at stored" 1 "$(sq "select count(*) from users where email='user@example.com' and last_login_at is not null and email_verified=1 and email_verified_at is not null")"
# code is stored hashed, never in clear
eq "code not stored in clear" 0 "$(sq "select count(*) from email_codes where code_hash='$CODE'")"

# --- unverified account re-registration, resend, persian digits
M0=$(mails)
check "register u2" 201 "$(req POST /auth/register '{"email":"u2@example.com","password":"firstpass1"}')"
eq "u2 mail sent" $((M0+1)) "$(mails)"
check "resend inside cooldown still ok" 200 "$(req POST /auth/resend '{"email":"u2@example.com"}')"
eq "no extra mail inside cooldown" $((M0+1)) "$(mails)"
sleep 3
check "resend after cooldown" 200 "$(req POST /auth/resend '{"email":"u2@example.com"}')"
eq "resend sent a mail" $((M0+2)) "$(mails)"
check "resend unknown email looks the same" 200 "$(req POST /auth/resend '{"email":"nobody@example.com"}')"
check "resend for verified user looks the same" 200 "$(req POST /auth/resend '{"email":"user@example.com"}')"
eq "no mail for unknown or verified" $((M0+2)) "$(mails)"
sleep 3
check "re-register unverified with new password" 201 "$(req POST /auth/register '{"email":"u2@example.com","password":"secondpass2"}')"
C2=$(code_of u2@example.com)
check "old code replaced" 422 "$(req POST /auth/verify "{\"email\":\"u2@example.com\",\"code\":\"$(flip $C2)\"}")" bad_code
check "verify with persian digits" 200 "$(req POST /auth/verify "{\"email\":\"u2@example.com\",\"code\":\"$(persian $C2)\"}")" token
check "u2 old password dead" 401 "$(req POST /auth/login '{"email":"u2@example.com","password":"firstpass1"}')" bad_credentials
check "u2 new password works" 200 "$(req POST /auth/login '{"email":"u2@example.com","password":"secondpass2"}')" token

# --- expired code
sleep 3
req POST /auth/register '{"email":"u3@example.com","password":"password3"}' >/dev/null
C3=$(code_of u3@example.com)
sq "update email_codes set expires_at=1 where user_id=(select id from users where email='u3@example.com')"
check "expired code" 422 "$(req POST /auth/verify "{\"email\":\"u3@example.com\",\"code\":\"$C3\"}")" code_expired

# --- attempt limit burns the code
sleep 3
req POST /auth/resend '{"email":"u3@example.com"}' >/dev/null
C3=$(code_of u3@example.com)
for i in 1 2 3 4 5; do req POST /auth/verify "{\"email\":\"u3@example.com\",\"code\":\"$(flip $C3)\"}" >/dev/null; done
check "correct code refused after 5 misses" 422 "$(req POST /auth/verify "{\"email\":\"u3@example.com\",\"code\":\"$C3\"}")" code_expired

# --- password recovery
M0=$(mails)
check "forgot unknown email looks the same" 200 "$(req POST /auth/forgot '{"email":"nobody@example.com"}')"
eq "forgot unknown sent nothing" "$M0" "$(mails)"
check "forgot invalid email" 422 "$(req POST /auth/forgot '{"email":"nope"}')" invalid_email
check "forgot ok" 200 "$(req POST /auth/forgot '{"email":"user@example.com","lang":"fa"}')"
eq "forgot sent a mail" $((M0+1)) "$(mails)"
CR=$(code_of user@example.com)
check "reset wrong code" 422 "$(req POST /auth/reset "{\"email\":\"user@example.com\",\"code\":\"$(flip $CR)\",\"newPassword\":\"brandnew99\"}")" bad_code
check "reset weak password" 422 "$(req POST /auth/reset "{\"email\":\"user@example.com\",\"code\":\"$CR\",\"newPassword\":\"123\"}")" weak_password
check "verify code cannot reset" 422 "$(req POST /auth/reset "{\"email\":\"user@example.com\",\"code\":\"000000\",\"newPassword\":\"brandnew99\"}")"
check "reset ok" 200 "$(req POST /auth/reset "{\"email\":\"user@example.com\",\"code\":\"$CR\",\"newPassword\":\"brandnew99\"}")"
check "reset code single use" 422 "$(req POST /auth/reset "{\"email\":\"user@example.com\",\"code\":\"$CR\",\"newPassword\":\"another999\"}")" code_expired
check "old session dead after reset" 401 "$(req GET /me '' "$TOKEN")"
check "login old password after reset" 401 "$(req POST /auth/login '{"email":"user@example.com","password":"password1"}')" bad_credentials
S=$(req POST /auth/login '{"email":"user@example.com","password":"brandnew99"}'); check "login after reset" 200 "$S" token
TOKEN=$(php -r 'echo json_decode(file_get_contents($argv[1]),true)["token"];' "$T/out")

# reset also confirms an unverified mailbox
sleep 3
req POST /auth/register '{"email":"u4@example.com","password":"password4"}' >/dev/null
sleep 3
req POST /auth/forgot '{"email":"u4@example.com"}' >/dev/null
C4=$(code_of u4@example.com)
check "reset on unverified account" 200 "$(req POST /auth/reset "{\"email\":\"u4@example.com\",\"code\":\"$C4\",\"newPassword\":\"password44\"}")"
check "u4 can log in (counts as verified)" 200 "$(req POST /auth/login '{"email":"u4@example.com","password":"password44"}')" token
T4=$(php -r 'echo json_decode(file_get_contents($argv[1]),true)["token"];' "$T/out")

# --- profile + memorization rooms over HTTP
check "profile needs auth" 401 "$(req GET /profile)"
check "rooms need auth" 401 "$(req POST /rooms '{"mode":"chain","surah":78}')"
check "profile default" 200 "$(req GET /profile '' "$TOKEN")" '"hasProfile":false'
check "profile save" 200 "$(req PUT /profile '{"displayName":"Ali","avatar":{"skin":2,"hair":"short"}}' "$TOKEN")" '"displayName":"Ali"'
check "profile invalid" 422 "$(req PUT /profile '{"displayName":"A"}' "$TOKEN")" invalid_name
req POST /auth/login '{"email":"u2@example.com","password":"secondpass2"}' >/dev/null
T2=$(php -r 'echo json_decode(file_get_contents($argv[1]),true)["token"];' "$T/out")
check "create room bad mode" 422 "$(req POST /rooms '{"mode":"x","surah":78}' "$TOKEN")" invalid_room
check "create room" 201 "$(req POST /rooms '{"mode":"chain","surah":78,"startAyah":1,"endAyah":4,"maxPlayers":2}' "$TOKEN")" '"status":"lobby"'
RC=$(php -r 'echo json_decode(file_get_contents($argv[1]),true)["code"];' "$T/out")
check "join room" 200 "$(req POST /rooms/join "{\"code\":\"$RC\"}" "$T2")" '"players"'
check "no email in room state" 0 "$(grep -c '@example.com' "$T/out" | sed 's/^0$/0/')" 
check "outsider cannot read room" 403 "$(req GET /rooms/$RC '' "$T4")" not_in_room
check "start by non-host" 403 "$(req POST /rooms/$RC/start '' "$T2")" not_host
check "start" 200 "$(req POST /rooms/$RC/start '' "$TOKEN")" '"status":"playing"'
VER=$(php -r 'echo json_decode(file_get_contents($argv[1]),true)["version"];' "$T/out")
check "poll unchanged" 200 "$(req GET "/rooms/$RC?v=$VER" '' "$T2")" '"changed":false'
check "turn by wrong player" 409 "$(req POST /rooms/$RC/turn '{"similarity":90}' "$T2")" not_your_turn
check "turn" 200 "$(req POST /rooms/$RC/turn '{"similarity":90,"ayah":2}' "$TOKEN")" '"currentAyah":3'
check "poll after change" 200 "$(req GET "/rooms/$RC?v=$VER" '' "$T2")" '"changed":true'
check "malformed room path" 404 "$(req GET /rooms/ABC '' "$TOKEN")"
check "leave room" 200 "$(req POST /rooms/$RC/leave '' "$T2")" '"ok":true'
check "left player cannot read" 403 "$(req GET /rooms/$RC '' "$T2")" not_in_room


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
check "change pw" 200 "$(req POST /me/password '{"currentPassword":"brandnew99","newPassword":"newpassword1"}' "$TOKEN")"
check "logout" 200 "$(req POST /auth/logout '' "$TOKEN")"
check "token dead after logout" 401 "$(req GET /me '' "$TOKEN")"
S=$(req POST /auth/login '{"email":"user@example.com","password":"newpassword1"}'); check "login new pw" 200 "$S"
TOKEN=$(php -r 'echo json_decode(file_get_contents($argv[1]),true)["token"];' "$T/out")
USERID=$(sq "select id from users where email='user@example.com'")
check "delete wrong pw" 403 "$(req DELETE /me '{"password":"nope"}' "$TOKEN")" bad_password
check "delete account" 200 "$(req DELETE /me '{"password":"newpassword1"}' "$TOKEN")"
check "token dead after delete" 401 "$(req GET /me '' "$TOKEN")"
ROWS=$(sq "select (select count(*) from users where id=$USERID)+(select count(*) from user_data where user_id=$USERID)+(select count(*) from sessions where user_id=$USERID)+(select count(*) from email_codes where user_id=$USERID)")
eq "all user rows removed on delete" 0 "$ROWS"
sleep 3
check "register again after delete" 201 "$(req POST /auth/register '{"email":"user@example.com","password":"password1"}')" verificationRequired
check "unknown route" 404 "$(req GET /nope)"
kill $PID 2>/dev/null; rm -rf "$T"
echo "passed=$PASS failed=$FAIL"; [ $FAIL -eq 0 ]
