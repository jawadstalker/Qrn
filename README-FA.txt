رفع خطای: Unable to resolve "expo-print" from "src\features\quran\plan\export\exportPlan.ts"

علت:
فایل exportPlan.ts چهار پکیج را import می‌کند که در package.json نبودند:
  expo-print, expo-sharing, expo-file-system, jszip
(jszip هم توسط xlsx.ts استفاده می‌شود و اگر فقط expo-print اضافه می‌شد، خطای بعدی همان بود.)

روش اعمال:
1) دو فایل package.json و package-lock.json را در ریشه‌ی پروژه جایگزین کنید.
2) در ریشه‌ی پروژه اجرا کنید:
     npm install
3) سپس:
     npx expo start --web -c
   (گزینه‌ی -c کش Metro را پاک می‌کند.)

نسخه‌ها با Expo SDK 53 هماهنگ‌اند:
  expo-file-system ~18.1.11
  expo-print       ~14.1.4
  expo-sharing     ~13.1.5
  jszip            ^3.10.1

تست‌شده: npm ci + expo export --platform web + tsc --noEmit  → بدون خطا
