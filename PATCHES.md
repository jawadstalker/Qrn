# اتصال اپ قرآن به پروژه

پیش‌نیاز: بستهٔ `sound-update` (برای `SoundPressable`) و ساختار فعلی پروژه.

## ۱. وابستگی‌ها
npm install expo-gl@~15.1.7 three@0.128.0 --legacy-peer-deps
npm install -D @types/three@0.128.0 --legacy-peer-deps

چون `expo-gl` بخش native دارد، بعدش دوباره بساز: `npx expo run:android`

## ۲. src/app/_layout.tsx
داخل `useFonts({ ... })` این دو خط را کنار `EstedadMedium` اضافه کن:

    QCF_P001: require('../../assets/fonts/QCF_P001.ttf'),
    UthmanicHafs: require('../../assets/fonts/UthmanicHafs.ttf'),

## ۳. src/core/shell/AppShell.tsx
خط تعریف مسیرهای بدون نوار را این‌طور کن:

    const NAV_HIDDEN_ROUTES = ['/stage-complete', '/quran'];

و شرط `isNavHidden` را این‌طور:

    const currentRoute = normalizeRoute(pathname || '/');
    const isNavHidden = NAV_HIDDEN_ROUTES.some((route) => currentRoute.startsWith(route));

## ۴. src/features/discover/screens/DiscoverScreen.tsx
- `import { useRouter } from 'expo-router';` و آیکون `BookOpen` از lucide-react-native را import کن.
- `ToolKey` را `'mood' | 'breath' | 'focus' | 'quran'` کن.
- به انتهای `TOOLS` اضافه کن:
  `{ key: 'quran', icon: BookOpen, pose: 'calm', minutes: 5, status: 'available' },`
- داخل `DiscoverScreen`: `const router = useRouter();` و در `handleOpenTool` بعد از بررسی `status`:

      if (tool.key === 'quran') {
        router.push('/quran');
      }

  و وابستگی `useCallback` را `[router]` کن.

کلیدهای ترجمهٔ `quran_*` و `app_quran*` را از `translations.ts` پروژهٔ نمونه‌ام اضافه کن (فایل `translations-quran.txt` کنار همین فایل).
