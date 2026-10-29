# بک‌اند باغ قرآن (PHP + MySQL، مناسب cPanel)

بدون composer و بدون نیاز به Node. فقط PHP 8.1 به بالا و MySQL/MariaDB.

## نصب روی هاست cPanel

1. در cPanel یک دیتابیس MySQL و یک کاربر برایش بسازید (کاربر را با همهٔ دسترسی‌ها به دیتابیس وصل کنید).
2. در phpMyAdmin دیتابیس را انتخاب کنید و فایل `schema.mysql.sql` را Import کنید.
3. پوشهٔ `server` را (به‌جز `tests` و `README-FA.md`) در `public_html/api/` آپلود کنید.
4. فایل `config.sample.php` را به `config.php` تغییر نام دهید و مشخصات دیتابیس را بنویسید.
5. در cPanel نسخهٔ PHP دامنه را روی 8.1 یا بالاتر بگذارید (Select PHP Version / MultiPHP Manager).
6. آدرس `https://دامنه‌ی‌شما/api/health` باید `{"ok":true}` برگرداند. حتماً دامنه روی HTTPS باشد (AutoSSL در cPanel).

## صفحهٔ دانلود APK

پوشهٔ `download` را در `public_html/` (یا هر زیرپوشه) آپلود کنید و فایل APK را با نام `quran-garden.apk` کنار `index.html` بگذارید.

## API

همهٔ پاسخ‌ها JSON هستند. خطاها به این شکل‌اند: `{"error":{"code":"...","message":"..."}}`.
برای مسیرهای محافظت‌شده هدر `Authorization: Bearer <token>` بفرستید.

| متد و مسیر | بدنه | توضیح |
|---|---|---|
| `POST /auth/register` | `{email, password, device?}` | ثبت‌نام و ورود هم‌زمان؛ `{token, user}` برمی‌گرداند |
| `POST /auth/login` | `{email, password, device?}` | ورود |
| `POST /auth/logout` | — | خروج (حذف توکن فعلی) |
| `GET /me` | — | اطلاعات کاربر |
| `POST /me/password` | `{currentPassword, newPassword}` | تغییر رمز؛ سایر دستگاه‌ها خارج می‌شوند |
| `DELETE /me` | `{password}` | حذف حساب و همهٔ داده‌ها |
| `GET /sync` | — | همهٔ داده‌های ذخیره‌شده: `{items:{key:{value,updatedAt}}}` |
| `PUT /sync` | `{items:{key:{value,updatedAt}}}` | ارسال تغییرات؛ نسخهٔ جدیدتر برنده است. اگر سرور نسخهٔ جدیدتری داشته باشد در `newer` برمی‌گردد |

کلیدهای مجاز sync همان کلیدهای AsyncStorage اپ هستند و باید با `@quran_garden_` شروع شوند (مثل `@quran_garden_plan_v1`). مقدار هر کلید رشتهٔ JSON است و `updatedAt` زمان آخرین تغییر روی گوشی (میلی‌ثانیه).

## محدودیت‌ها

- هشت تلاش ناموفق ورود در ۱۵ دقیقه برای هر ایمیل و IP (قابل تنظیم در config.php).
- ثبت‌نام: حداکثر ۱۵ بار در ساعت برای هر IP.
- بازیابی رمز و تأیید ایمیل هنوز نیست چون SMTP تنظیم نشده. وقتی SMTP داشتید، اضافه می‌شود.

## تست محلی

```bash
bash tests/run.sh   # به php و sqlite3 یا pdo_sqlite نیاز دارد
```
