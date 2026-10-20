Qrn 3D fix
==========
Extract this zip INTO the root of the Qrn project (the folder that contains package.json),
and choose "Replace" when asked. It overwrites 4 files:

  src/features/quran/screens/QuranGardenScreen.tsx
  src/features/quran/components/Plant3D.tsx
  src/features/quran/components/Sun3D.tsx
  src/features/quran/components/SplashIntro.tsx

Then rebuild the native app (expo-gl has native code, Expo Go will not work):

  npx expo run:android
