# Quran Garden

A standalone Expo app for memorizing Quran verses with low-pressure review. Every verse you learn grows a leaf on a plant, and verses that survive repeated reviews open flowers.

Quran Garden is one of the companion apps of the Neurolia hub. It runs on its own and does not need Neurolia or any backend.

## Features

- Page 1 of the Madinah Mushaf (Al-Fatihah) in its exact 7-line layout, using the King Fahd Complex page font
- Memorization modes: full, half hidden, hidden; tap a blurred word to peek
- A plant that grows with progress, in 3D with an animated SVG fallback
- Spaced review at 1, 3, 7, 14 and 30 days; missed reviews never kill the plant
- Surah library with search and filters
- Persian and English, four themes, optional click sounds, reduce-motion support
- Progress is stored on the device
- Harder memorization: half-hidden mode shows one word in three, a "Challenge" mode hides every word and allows only 3 peeks per verse, and "I remembered" first asks you to hide the text and test yourself
- Final quiz after the last verse: fill the blank, next verse, verse number and meaning questions, with a score, stars and best result per surah
- Tafsir page: plain-language summary, verse groups with the Arabic text, and lessons (Al-Fatihah and An-Naba)
- Recitations page: whole-surah audio for all 114 surahs from 5 reciters, a mini player on every screen, and single-verse audio in the memorize screen and the verse of the day
- More Quranic atmosphere: Basmalah banner, geometric patterns, mosque skyline, lanterns, verse of the day

## Getting started

Requirements: Node.js 20 or newer, JDK 17 and Android Studio with an emulator or a phone with USB debugging.

```bash
npm install --legacy-peer-deps
npx expo run:android
```

`expo-gl` and `expo-audio` include native code, so the first run builds a development app. Afterwards, `npx expo start --clear` is enough.

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` | Build and run on Android |
| `npm run ios` | Build and run on iOS |
| `npm run typecheck` | Type-check the app |
| `npm run format` | Format sources with Prettier |

## Project structure

```
index.ts
src/
  app/                  Expo Router routes (thin wrappers only)
  core/                 theme, language, direction helpers, shared types
  features/quran/
    components/         MushafPage, GrowthPlant, Plant3D, PlantSvg, MiniPlant, PetalRain, QuranTabBar
    data/               mushaf page layout and the 114 surahs
    screens/            garden, memorize, library, growth moment, settings
    state/              progress store
    utils/              growth rules, 3D scene
  shared/               UI building blocks, motion hooks, UI sounds
assets/
  fonts/                Quran fonts and the Persian UI font
  mascot/               character poses
  sounds/ui/            short UI sounds
```

## Tuning

- Growth rules: `src/features/quran/utils/plantGrowth.ts`
- Turn off the 3D plant: `USE_3D_PLANT` in `src/features/quran/config.ts`
- Mushaf line spacing: `LINE_HEIGHT_RATIO` and `GLYPH_LINE_HEIGHT_RATIO` in `src/features/quran/components/MushafPage.tsx`
- Android package name: `android.package` in `app.json`

## Limits

- Only Al-Fatihah (Mushaf page 1) can be memorized. Other pages need their page font and line layout data.
- Recitations are streamed, so playback needs internet. Reciters and URLs are listed in `src/features/quran/data/reciters.ts`.
- Tafsir and quiz meaning questions exist only for Al-Fatihah and An-Naba. Add more in `data/tafsir.ts` and `data/quizConcepts.ts`.

## Fonts and content

- The Quran fonts (`QCF_P001` and `UthmanicHafs`) come from the King Fahd Glorious Quran Printing Complex. Read their [terms of use](http://dm.qurancomplex.gov.sa/copyright-2/) before distributing the app.
- Surah names and the verse text in `data/verseText.ts` come from the [`quran-json`](https://www.npmjs.com/package/quran-json) package (CC BY-SA 4.0). The English translation is Saheeh International via tanzil.net.
- Recitation audio is served by third-party servers (mp3quran.net, cdn.islamic.app). Check their terms before publishing the app.
- The tafsir texts and the Persian renderings of the verse of the day are short summaries written for this app, not quotations from a tafsir.
- Have a qualified person review everything related to the Quran before release.

## License

No license has been chosen yet. Until one is added, all rights are reserved by the repository owner.
