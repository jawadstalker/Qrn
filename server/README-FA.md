# بک‌اند باغ قرآن (PHP + MySQL، مناسب cPanel)

بدون composer و بدون Node. فقط PHP 8.1 به بالا و MySQL/MariaDB.
ثبت‌نام با کد تأیید ایمیل، ورود، بازیابی رمز عبور با کد ایمیل، و ذخیرهٔ داده‌های کاربر در دیتابیس.

## نصب روی هاست cPanel (قدم به قدم)

### ۱) دیتابیس
1. cPanel ← **MySQL® Database Wizard**.
2. نام دیتابیس را بنویس (مثلاً `qg`) ← Next Step. cPanel خودش پیشوند اضافه می‌کند و نام کامل چیزی مثل `cpuser_qg` می‌شود؛ آن را یادداشت کن.
3. یک نام کاربری (مثلاً `qg`) و یک رمز قوی بساز (نام کامل `cpuser_qg`)؛ رمز را یادداشت کن ← Create User.
4. تیک **ALL PRIVILEGES** را بزن ← Next Step.

### ۲) ساخت جدول‌ها
1. cPanel ← **phpMyAdmin**، دیتابیس خودت را از ستون چپ انتخاب کن.
2. تب **Import** ← Choose File ← فایل `schema.mysql.sql` ← Go پایین صفحه.
3. باید پنج جدول ببینی: `users`, `sessions`, `user_data`, `rate_limits`, `email_codes`.
   (اگر قبلاً نسخهٔ قدیمی schema را import کرده‌ای، به‌جای این مرحله فقط یک‌بار `upgrade-email-codes.sql` را import کن.)

### ۳) ساخت ایمیل ارسال‌کننده
1. cPanel ← **Email Accounts** ← Create.
2. مثلاً `noreply@دامنه‌ی‌تو` با یک رمز قوی. رمز را یادداشت کن.
3. کنار همان ایمیل روی **Connect Devices** بزن؛ زیر «Secure SSL/TLS Settings» آدرس **Outgoing Server** (مثلاً `mail.دامنه‌ی‌تو`) و پورت **SMTP 465** را می‌بینی.

### ۴) آپلود فایل‌ها
1. cPanel ← **File Manager** ← پوشهٔ `public_html` ← **+ Folder** ← نام `api`.
2. وارد `api` شو ← **Upload** ← فایل `qrn-api-host.zip` ← بعد روی فایل راست‌کلیک ← **Extract**، و فایل zip را پاک کن.
3. بالا-راست File Manager روی **Settings** بزن و **Show Hidden Files (dotfiles)** را روشن کن تا `.htaccess` دیده شود.
4. باید داخل `public_html/api/` این‌ها را ببینی: `index.php`, `.htaccess`, `config.sample.php`, پوشهٔ `src`.

### ۵) تنظیمات (`config.php`)
1. فایل `config.sample.php` را **Rename** کن به `config.php` و **Edit** بزن.
2. این مقدارها را عوض کن:
   - `dsn`: همان `dbname=` را با نام کامل دیتابیس بنویس (مثلاً `cpuser_qg`)؛ `host=localhost` بماند.
   - `user` و `pass` دیتابیس: نام کامل کاربر و رمزش.
   - `app_secret`: یک رشتهٔ تصادفی **حداقل ۳۲ نویسه** (با یک password generator بساز، مثلاً ۴۰ تا ۶۴ نویسه). مثل رمز نگهش دار؛ اگر عوضش کنی کدهای ایمیل‌شده‌ای که هنوز استفاده نشده‌اند باطل می‌شوند.
   - `mail.from_email` و `mail.smtp.user`: ایمیل مرحلهٔ ۳ (آدرس کامل).
   - `mail.smtp.host`: آدرس Outgoing Server مرحلهٔ ۳. `pass`: رمز آن ایمیل.
   - `port` و `secure`: `465` و `ssl` (یا `587` و `tls`).
3. Save.

### ۶) نسخهٔ PHP و HTTPS
- cPanel ← **MultiPHP Manager** (یا Select PHP Version) ← دامنه را روی **PHP 8.1 یا بالاتر** بگذار.
- دامنه باید HTTPS داشته باشد (cPanel ← SSL/TLS Status ← Run AutoSSL).

### ۷) تست
- مرورگر: `https://دامنه‌ی‌تو/api/health` باید `{"ok":true}` نشان دهد.
- در اپ ثبت‌نام کن؛ کد ۶ رقمی باید به ایمیل برسد (پوشهٔ اسپم را هم نگاه کن).

### ۸) وصل کردن اپ
آدرس `https://دامنه‌ی‌تو/api` (بدون `/` آخر) را به‌عنوان `API_URL` در GitHub (Variables) یا در `DEFAULT_API_URL` فایل `src/features/auth/config.ts` بگذار. جزئیات: `ACCOUNT-SETUP-FA.md`.

## عیب‌یابی

| نشانه | علت و راه‌حل |
|---|---|
| `/api/health` صفحهٔ ۵۰۰ یا خالی می‌دهد | نسخهٔ PHP پایین‌تر از 8.1 است، یا `config.php` نیست. فایل `error_log` کنار `index.php` علت را می‌نویسد. |
| `not_configured` | `app_secret` عوض نشده یا کوتاه‌تر از ۳۲ نویسه است. |
| `mail_failed` در اپ | اتصال SMTP یا رمز اشتباه است. متن دقیق در فایل `error_log` پوشهٔ `api` است. اگر نوشته بود خطای certificate، موقتاً `verify_tls` را `false` کن (اتصال همچنان رمز‌شده می‌ماند). اگر باز نشد: `driver` را `mail` بگذار. |
| ایمیل به اسپم می‌رود | در cPanel ← **Email Deliverability** باید SPF و DKIM دامنه سبز باشد؛ اگر نبود Repair بزن. |
| خطای دیتابیس (`server_error`) | نام دیتابیس/کاربر/رمز در `dsn` درست نیست یا کاربر به دیتابیس وصل نشده (مرحلهٔ ۱ بند ۴). |
| بعد از ورود، اپ می‌گوید نشست تمام شده | هدر Authorization حذف می‌شود؛ مطمئن شو `.htaccess` کنار `index.php` هست. |

## API

همهٔ پاسخ‌ها JSON هستند. خطاها: `{"error":{"code":"...","message":"..."}}`.
برای مسیرهای محافظت‌شده هدر `Authorization: Bearer <token>` بفرستید. `lang` (`fa` یا `en`) زبان ایمیل را تعیین می‌کند (پیش‌فرض `fa`).

| متد و مسیر | بدنه | توضیح |
|---|---|---|
| `POST /auth/register` | `{email, password, lang?}` | حساب تأییدنشده می‌سازد و کد ایمیل می‌کند؛ `{verificationRequired:true, email}`. توکن نمی‌دهد. |
| `POST /auth/verify` | `{email, code, device?}` | تأیید ایمیل و ورود؛ `{token, user}` |
| `POST /auth/resend` | `{email, lang?}` | ارسال دوبارهٔ کد تأیید (همیشه `{ok:true}`) |
| `POST /auth/login` | `{email, password, device?, lang?}` | ورود. اگر ایمیل تأیید نشده باشد `403 email_not_verified` و یک کد تازه ایمیل می‌شود |
| `POST /auth/forgot` | `{email, lang?}` | کد بازیابی رمز ایمیل می‌کند (همیشه `{ok:true}`، حتی اگر ایمیل ثبت نشده باشد) |
| `POST /auth/reset` | `{email, code, newPassword}` | رمز جدید؛ همهٔ دستگاه‌ها خارج می‌شوند |
| `POST /auth/logout` | — | خروج |
| `GET /me` | — | اطلاعات کاربر |
| `POST /me/password` | `{currentPassword, newPassword}` | تغییر رمز؛ سایر دستگاه‌ها خارج می‌شوند |
| `DELETE /me` | `{password}` | حذف حساب و همهٔ داده‌ها |
| `GET /sync` | — | همهٔ داده‌های ذخیره‌شده: `{items:{key:{value,updatedAt}}}` |
| `PUT /sync` | `{items:{key:{value,updatedAt}}}` | ارسال تغییرات؛ نسخهٔ جدیدتر برنده است |

کلیدهای مجاز sync همان کلیدهای AsyncStorage اپ‌اند و با `@quran_garden_` شروع می‌شوند.

## چه چیزی کجا ذخیره می‌شود

- `users`: ایمیل، هش رمز (bcrypt/argon، نه خود رمز)، وضعیت و زمان تأیید ایمیل، زمان ساخت حساب، زمان آخرین ورود.
- `sessions`: هش توکن هر دستگاه، نام دستگاه، زمان ساخت/آخرین استفاده/انقضا.
- `user_data`: برنامهٔ حفظ، پیشرفت، آزمون‌ها، اشتباهات و آمار، بخش‌ها، محدوده (هر کلید یک ردیف).
- `email_codes`: فقط HMAC کد ۶ رقمی، تعداد تلاش و زمان انقضا (کد خام هیچ‌جا ذخیره نمی‌شود).
- `rate_limits`: شمارندهٔ تلاش‌ها (خودش پاک می‌شود).

## امنیت و محدودیت‌ها

- کد ۶ رقمی: ۱۰ دقیقه اعتبار، یک‌بارمصرف، حداکثر ۵ حدس اشتباه (بعد کد می‌سوزد)، و ۱۰ تلاش در ۱۵ دقیقه برای هر ایمیل و IP.
- ارسال دوبارهٔ کد: فاصلهٔ حداقل ۶۰ ثانیه؛ حداکثر ۶ ایمیل در ساعت برای هر آدرس (قابل تنظیم در config.php).
- پاسخ «فراموشی رمز» و «ارسال دوباره» هرگز نشان نمی‌دهد ایمیلی ثبت شده یا نه.
- بعد از بازیابی رمز همهٔ نشست‌ها بسته می‌شوند. دریافت کد بازیابی، ایمیل را هم تأییدشده می‌کند.
- هشت تلاش ناموفق ورود در ۱۵ دقیقه برای هر ایمیل و IP؛ ثبت‌نام حداکثر ۱۰۰ بار در ساعت برای هر IP.
- حساب تأییدنشده می‌تواند دوباره ثبت‌نام شود (آخرین رمز معتبر است) تا کسی ایمیل دیگری را برای همیشه اشغال نکند.

## تست محلی (برای توسعه، نه برای هاست)

```bash
bash tests/run.sh          # API کامل؛ به php و sqlite3 نیاز دارد، ایمیل‌ها در فایل لاگ نوشته می‌شوند
python3 tests/smtp_test.py # درایور SMTP روی سرور جعلی (pip install aiosmtpd)
```
