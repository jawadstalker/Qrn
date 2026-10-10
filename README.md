# Neurolia

A psychology-themed mobile app that works as a hub for small, focused companion apps. Users open Neurolia, discover an experience such as mood check-ins, breathing or Quran memorization, and see what they do across all of them in one place: **My growth**.

Built with React Native, Expo SDK 53 and TypeScript. A Node.js backend lives in [`backend/`](backend/).

> **Status: prototype.** The base app, the growth path and the Quran Garden sub-app run end to end on local storage. The sub-app catalog, install flow and event sync exist in the backend but are not yet connected to the mobile app. See [Roadmap](#roadmap).

## Features

**Base app**

- Authentication
- **Discover**: a catalog of companion apps with duration, category and the data each one shares
- **My growth**: a stepped path with stages, a gentle weekly rhythm (rest days count, no streak loss), a step sheet with a breathing guide, and a stage-complete celebration
- **Profile**: theme picker, language switch, click-sound switch, privacy controls, data export and deletion, consultation
- Persian and English with manual RTL mirroring
- Four themes: Mindful, Calm, Restore, Night
- Very short UI sounds, off in silent mode and optional in Profile
- Motion built on Reanimated; everything respects the system "reduce motion" setting

**Quran Garden (companion app)**

- Page 1 of the Madinah Mushaf (Al-Fatihah) in its exact 7-line layout, using the King Fahd Complex page font
- Memorization modes: full, half hidden, hidden; tap a blurred word to peek
- A plant that grows with progress: every learned verse is a leaf, and verses that survive repeated reviews open flowers
- Low-pressure spaced review (1, 3, 7, 14 and 30 days); missed reviews never kill the plant
- 3D plant with `expo-gl` and `three`, with an automatic animated SVG fallback

## Tech stack

| Area | Choice |
| --- | --- |
| App | React Native 0.79, Expo SDK 53, Expo Router, TypeScript (strict) |
| Animation | `react-native-reanimated`, `react-native-svg` |
| 3D | `expo-gl`, `three` 0.128 |
| Audio | `expo-audio` |
| Backend | Node.js 22, Express 5, PostgreSQL, Drizzle ORM, Zod, Vitest |

## Getting started

Requirements: Node.js 20 or newer and the Android or iOS toolchain for Expo.

```bash
npm install
npx expo run:android
```

`expo-gl` and `expo-audio` include native code, so a development build is required after installing or updating them (`npx expo start` alone is not enough).

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` | Build and run on Android |
| `npm run ios` | Build and run on iOS |
| `npm run web` | Start the web target |
| `npm run typecheck` | Type-check the app |
| `npm run format` | Format sources with Prettier |

### Backend

```bash
cd backend
cp .env.example .env
docker compose up -d db
npm install
npm run migrate
npm run seed
npm run dev
```

Details, the full API table and the architecture are in [`backend/README.md`](backend/README.md).

## Project structure

```
index.ts
src/
  app/                  Expo Router routes (thin wrappers only)
    (tabs)/             Discover, My growth, Profile
    quran/              Quran Garden routes and layout
  core/
    i18n/               language context, translations, direction and number helpers
    navigation/         route helpers
    platform/           platform-specific helpers
    providers/          composed application providers
    shell/              authenticated shell and tab bar host
    theme/              theme context and palettes
    types/              shared types
  features/
    auth/
    consultation/
    discover/           companion app catalog
    growth/             stages, path, step sheet, progress store
    profile/
    quran/              Quran Garden: screens, mushaf page, plant, progress store
    splash/
  shared/
    audio/              UI sound provider
    components/         navigation and UI building blocks
    motion/             rise, pop, float, breathe and pulse hooks
assets/
  fonts/                UI font and Quran fonts
  mascot/               character poses
  sounds/ui/            short UI sounds
backend/                REST API, migrations and tests
```

## Conventions

- Routes under `src/app` only re-export screens from `src/features`.
- Feature code does not import another feature's internals. Shared code goes in `src/shared` or `src/core`.
- Imports use the `@/` alias for `src/`.
- No code comments; names carry the meaning.
- Every user-facing string lives in `src/core/i18n/translations.ts`, in both languages.

## Roadmap

- Connect Discover to `GET /apps`, and the install button to `POST /apps/:slug/install`
- Send companion app events to `POST /events` and sync growth progress to the backend
- More Mushaf pages (each page needs its page font and line layout data)
- Verse audio for Quran Garden
- More companion apps

## Fonts and content

- The Quran fonts (`QCF_P001` and `UthmanicHafs`) come from the King Fahd Glorious Quran Printing Complex. Read their [terms of use](http://dm.qurancomplex.gov.sa/copyright-2/) before distributing the app.
- Quran text for the surah list and names comes from the [`quran-json`](https://www.npmjs.com/package/quran-json) package.
- Anything related to the Quran should be reviewed by a qualified person before release.
- Neurolia is a wellbeing tool, not a medical device. It does not diagnose or treat any condition, and it should point users to professional help when needed.

## License

No license has been chosen yet. Until one is added, all rights are reserved by the repository owner.
