"""SMTP driver test: runs a fake SMTP server (needs `pip install aiosmtpd`) and sends one mail per mode (none / ssl / starttls).
Usage: python3 tests/smtp_test.py   (from the server folder, with php on PATH)"""
import base64, email, os, ssl, subprocess, sys, tempfile, time
from aiosmtpd.controller import Controller
from aiosmtpd.smtp import AuthResult, LoginPassword

got = []
class H:
    async def handle_DATA(self, server, session, envelope):
        got.append((envelope.mail_from, envelope.rcpt_tos, envelope.content))
        return "250 OK"

def auth(server, session, envelope, mechanism, data):
    ok = isinstance(data, LoginPassword) and data.login == b"noreply@example.com" and data.password == b"s3cret"
    return AuthResult(success=ok)

d = tempfile.mkdtemp()
subprocess.run(["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", d + "/k.pem", "-out", d + "/c.pem",
                "-days", "2", "-subj", "/CN=localhost"], check=True, capture_output=True)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER); ctx.load_cert_chain(d + "/c.pem", d + "/k.pem")

PHP = r'''<?php require "src/Mailer.php";
[$s,$t,$h] = Mailer::template($argv[3], $argv[4], "482913", 10);
Mailer::send(["mail"=>["driver"=>"smtp","from_email"=>"noreply@example.com","from_name"=>"باغ قرآن",
 "smtp"=>["host"=>"127.0.0.1","port"=>(int)$argv[1],"secure"=>$argv[2],"user"=>"noreply@example.com","pass"=>$argv[5],"verify_tls"=>false]]],
 "someone@example.org", $s, $t, $h);'''
open(d + "/send.php", "w").write(PHP)

def run(port, secure, purpose="verify", lang="fa", pw="s3cret"):
    return subprocess.run(["php", d + "/send.php", str(port), secure, purpose, lang, pw], capture_output=True, text=True,
                          cwd=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

fails = 0
def check(name, cond, extra=""):
    global fails
    print(("ok   " if cond else "FAIL ") + name + ("" if cond else " " + extra)); fails += 0 if cond else 1

cases = [
    ("plain+AUTH", dict(auth_required=True, auth_require_tls=False), 18025, "none"),
    ("implicit TLS (465)", dict(auth_required=True, ssl_context=ctx), 18465, "ssl"),
    ("STARTTLS (587)", dict(auth_required=True, tls_context=ctx, require_starttls=True), 18587, "tls"),
]
for name, kw, port, secure in cases:
    c = Controller(H(), hostname="127.0.0.1", port=port, authenticator=auth, auth_require_tls=(secure == "tls"), **{k: v for k, v in kw.items() if k != "auth_require_tls"})
    c.start(); time.sleep(0.3); got.clear()
    r = run(port, secure)
    check(name + " sent", r.returncode == 0 and len(got) == 1, r.stdout + r.stderr)
    if got:
        msg = email.message_from_string(got[0][2].decode() if isinstance(got[0][2], bytes) else got[0][2])
        text = [p for p in msg.walk() if p.get_content_type() == "text/plain"][0].get_payload(decode=True).decode()
        html = [p for p in msg.walk() if p.get_content_type() == "text/html"][0].get_payload(decode=True).decode()
        subj = email.header.make_header(email.header.decode_header(msg["Subject"]))
        check(name + " content", "482913" in text and "482913" in html and str(subj) == "کد تأیید ایمیل باغ قرآن" and got[0][1] == ["someone@example.org"], str(subj))
    if secure == "ssl":
        got.clear(); r = run(port, secure, "reset", "en")
        msg = email.message_from_string(got[0][2].decode() if isinstance(got[0][2], bytes) else got[0][2])
        check("english reset subject", str(email.header.make_header(email.header.decode_header(msg["Subject"]))) == "Quran Garden password reset code")
        got.clear(); r = run(port, secure, pw="wrong")
        check("wrong SMTP password fails cleanly", r.returncode != 0 and not got and "wrong" not in (r.stdout + r.stderr), r.stdout + r.stderr)
    c.stop()
print("failed=%d" % fails); sys.exit(1 if fails else 0)
