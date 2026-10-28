# برنامه حفظ (مقدار روزانه، تقویم، خروجی، تاریخ هدف)

پایه: کامیت `74fb09f` (آخرین `main` در زمان کار).

## نصب
1. محتوای این زیپ را روی ریشهٔ پروژه کپی کنید (فایل‌های هم‌نام جایگزین می‌شوند)، یا `git apply memorization-plan.patch`.
2. `npm install` (چهار وابستگی جدید: expo-print, expo-sharing, expo-file-system, jszip).
3. اگر از Dev Build استفاده می‌کنید، چون ماژول‌های native جدید اضافه شده‌اند آن را دوباره بسازید (`npx expo run:android` / `run:ios` یا EAS). در Expo Go هر سه ماژول (expo-print، expo-sharing، expo-file-system) موجودند و نیازی به بیلد مجدد نیست.

## فایل‌های جدید
- `src/features/quran/plan/` : تقویم شمسی/میلادی، موتور ساخت برنامه، خروجی PDF/Excel، کامپوننت‌ها
- `src/features/quran/screens/PlanScreen.tsx` و `PlanSetupScreen.tsx`
- `src/features/quran/state/MemorizationPlanContext.tsx`
- `src/features/quran/components/PlanShortcutCard.tsx`
- `src/app/plan.tsx` و `src/app/plan-setup.tsx`

## فایل‌های تغییرکرده
`src/app/_layout.tsx` (Provider)، `QuranTabBar.tsx` (مخفی‌کردن نوار در /plan-setup)، `QuranGardenScreen.tsx` (کارت میان‌بر)، `translations.ts` (کلیدهای plan_*)، `package.json`.
