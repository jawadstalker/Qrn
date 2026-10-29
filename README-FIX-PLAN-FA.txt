رفع مشکل: با زدن روی کارت «برنامهٔ حفظ» صفحه‌ای باز نمی‌شد

علت:
exportPlan.ts سه ماژول native (expo-print, expo-sharing, expo-file-system) را بالای فایل import می‌کرد.
اگر APK / Dev Build روی گوشی قبل از اضافه‌شدن این ماژول‌ها ساخته شده باشد، همان لحظهٔ باز شدن /plan
خطا می‌دهد و صفحه باز نمی‌شود (روی وب این مشکل دیده نمی‌شود).

تغییرات:
- exportPlan.ts: ماژول‌های native فقط هنگام زدن دکمهٔ PDF/Excel لود می‌شوند؛ اگر نباشند پیام «اشتراک‌گذاری ممکن نیست» می‌آید.
- PlanScreen.tsx: exportPlan با import پویا و فقط هنگام خروجی گرفتن لود می‌شود.
- plan.tsx و plan-setup.tsx: ErrorBoundary اضافه شد؛ اگر خطایی رخ دهد به‌جای صفحهٔ خالی، متن خطا و دکمه نمایش داده می‌شود.
- PlanErrorFallback.tsx (جدید) و ۳ کلید ترجمه (plan_open_error, plan_retry, plan_back_home).

اعمال:
1) محتوای زیپ را روی ریشهٔ پروژه استخراج کنید (Replace).
2) git add . && git commit && git push  (بیلد GitHub Actions خودکار APK جدید می‌سازد)
   برای خروجی PDF/Excel حتماً APK جدید نصب شود (ماژول‌های native باید داخل بیلد باشند).
