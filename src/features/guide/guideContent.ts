import {
  Bell,
  BookMarked,
  BookOpen,
  BookOpenText,
  Brain,
  CalendarCheck,
  CalendarDays,
  ChevronsUpDown,
  CircleCheck,
  CircleHelp,
  ClipboardCheck,
  Droplets,
  Eye,
  EyeOff,
  FileDown,
  Flower2,
  Gauge,
  Grid3x3,
  Headphones,
  Layers,
  Lightbulb,
  LayoutList,
  ListChecks,
  ListFilter,
  ListOrdered,
  Palette,
  Play,
  Repeat,
  Search,
  Settings,
  SkipForward,
  SlidersHorizontal,
  Sprout,
  Star,
  Target,
  TrendingUp,
  TriangleAlert,
  Trophy,
  UserRound,
  Volume2,
  type LucideIcon,
} from "lucide-react-native";
import type { Language } from "@/core/types/index";

/*
 * First-run guides.
 *
 * Every step points at a real element of the screen: the screen goes dark, the element stays bright,
 * and a short explanation appears next to it. Elements are marked in the screens with
 * <GuideTarget id="page.thing"> (see guideTargets.tsx) and referenced here by that id.
 *
 * Everything the guides say lives in this file, so editing a text, adding a step or adding a guide
 * for a new page never touches the UI code.
 *
 * In the Persian strings "~" stands for the zero-width non-joiner (half space). It is converted
 * to U+200C when the module loads, so the sources stay readable and the characters are never lost.
 *
 * To add a guide for a new page:
 *   1. wrap the elements to point at in <GuideTarget id="page.thing"> in that screen, and call
 *      useGuideScroll() there if the screen scrolls,
 *   2. add its id to GuideId and its steps to GUIDE_LIST,
 *   3. map the route to the id in GUIDE_ROUTES.
 */

export interface Localized {
  fa: string;
  en: string;
}

export interface GuideStep {
  icon: LucideIcon;
  /** Keep it to a few words. */
  title: Localized;
  /** One idea, one or two short sentences. */
  body: Localized;
  /**
   * Element(s) to highlight. Several ids highlight everything around all of them.
   * No target, or a target that is not on screen: the step is shown as a plain centered card.
   */
  target?: string | readonly string[];
  /** Leave the step out entirely when its target is not on screen (empty states, data that is not there yet). */
  optional?: boolean;
  /** Never scroll the screen for this step (the tab bar). */
  fixed?: boolean;
  /** Extra space around the highlighted element. */
  pad?: number;
  /** Corner radius of the highlight. */
  radius?: number;
  /** Label of the main button on the last step (default: "Got it"). */
  doneLabel?: Localized;
  /** Also show a link that turns the page guides off for good. */
  offerDisable?: boolean;
}

export type GuideId =
  | "tour"
  | "garden"
  | "memorize"
  | "tafsir"
  | "listen"
  | "library"
  | "settings"
  | "exam"
  | "scope"
  | "stages"
  | "recall"
  | "mistakes"
  | "report"
  | "session"
  | "plan"
  | "planSetup";

export interface GuideDef {
  id: GuideId;
  steps: readonly GuideStep[];
}

const L = (fa: string, en: string): Localized => ({ fa, en });

const TAB_PAD = 2;
const TAB_RADIUS = 18;

const GUIDE_LIST: readonly GuideDef[] = [
  {
    id: "tour",
    steps: [
      {
        icon: Sprout,
        title: L("به باغ حفظ قرآن خوش آمدی", "Welcome to Quran Garden"),
        body: L(
          "با هر آیه~ای که حفظ می~کنی، گیاهت رشد می~کند. بیا یک دقیقه با بخش~های اصلی برنامه آشنا شویم.",
          "Every verse you memorize makes your plant grow. Let’s take a one-minute look at the main sections.",
        ),
        offerDisable: true,
      },
      {
        icon: Sprout,
        title: L("باغ من", "My garden"),
        body: L(
          "گیاه، آبیاری امروز، برنامهٔ حفظ و آیهٔ روز؛ همه در یک صفحه.",
          "The plant, today’s watering, your plan and the verse of the day, all on one page.",
        ),
        target: "tab./",
        fixed: true,
        pad: TAB_PAD,
        radius: TAB_RADIUS,
      },
      {
        icon: BookOpen,
        title: L("حفظ", "Memorize"),
        body: L(
          "آیه~ها را بخوان، پنهان کن و خودت را امتحان کن. تمرین و آزمون~ها هم از همین~جا شروع می~شوند.",
          "Read verses, hide them and test yourself. Practice and exams start here too.",
        ),
        target: "tab./memorize",
        fixed: true,
        pad: TAB_PAD,
        radius: TAB_RADIUS,
      },
      {
        icon: BookOpenText,
        title: L("تفسیر", "Tafsir"),
        body: L(
          "معنی و پیام سوره~ها را به زبان ساده بخوان.",
          "Read the meaning and lessons of each surah in plain words.",
        ),
        target: "tab./tafsir",
        fixed: true,
        pad: TAB_PAD,
        radius: TAB_RADIUS,
      },
      {
        icon: Headphones,
        title: L("تلاوت", "Listen"),
        body: L(
          "سوره~ها را با صدای پنج قاری بشنو.",
          "Listen to surahs recited by five reciters.",
        ),
        target: "tab./listen",
        fixed: true,
        pad: TAB_PAD,
        radius: TAB_RADIUS,
      },
      {
        icon: ListOrdered,
        title: L("فهرست", "Library"),
        body: L(
          "فهرست سوره~ها؛ سوره~ای را که می~خواهی حفظ کنی از اینجا انتخاب کن.",
          "The list of surahs; pick the one you want to memorize here.",
        ),
        target: "tab./library",
        fixed: true,
        pad: TAB_PAD,
        radius: TAB_RADIUS,
      },
      {
        icon: Settings,
        title: L("تنظیمات", "Settings"),
        body: L(
          "حساب، تم، زبان، صدا، یادآوری روزانه و همین راهنما را اینجا پیدا می~کنی.",
          "Account, theme, language, sound, daily reminders and this guide are all here.",
        ),
        target: "tab./settings",
        fixed: true,
        pad: TAB_PAD,
        radius: TAB_RADIUS,
        doneLabel: L("شروع", "Start"),
        offerDisable: true,
      },
    ],
  },

  {
    id: "garden",
    steps: [
      {
        icon: Sprout,
        title: L("گیاه تو", "Your plant"),
        body: L(
          "با هر آیه~ای که حفظ می~کنی بزرگ~تر می~شود. اگر مرور را فراموش کنی نمی~میرد؛ فقط کمی خم می~شود.",
          "It grows with every verse you learn. If you forget a review it never dies; it just droops a little.",
        ),
        target: "garden.plant",
        radius: 24,
      },
      {
        icon: Star,
        title: L("آیهٔ امروز", "Verse of the day"),
        body: L(
          "هر روز یک آیهٔ تازه برای خواندن؛ با دکمهٔ پخش تلاوتش را هم می~شنوی.",
          "A new verse to read every day; the play button lets you hear it too.",
        ),
        target: "garden.daily",
        radius: 22,
      },
      {
        icon: Trophy,
        title: L("میان~برها", "Shortcuts"),
        body: L(
          "تفسیر، تلاوت و کوییز پایان سوره فقط یک لمس فاصله دارند.",
          "Tafsir, listening and the end-of-surah quiz are one tap away.",
        ),
        target: "garden.shortcuts",
        radius: 22,
      },
      {
        icon: CalendarDays,
        title: L("برنامهٔ حفظ", "Memorization plan"),
        body: L(
          "خلاصهٔ برنامهٔ امروزت اینجاست. با لمس آن به صفحهٔ برنامه می~روی، جایی که مقدار روزانه و تاریخ پایان را مشخص می~کنی.",
          "A summary of today’s plan. Tap it to open the plan page, where you set the daily amount and the finish date.",
        ),
        target: "garden.plan",
        radius: 22,
      },
      {
        icon: Droplets,
        title: L("آبیاری امروز", "Today’s watering"),
        body: L(
          "آیه~هایی که وقت مرورشان رسیده اینجا هستند. مرور به~موقع، بعد از ۱، ۳، ۷، ۱۴ و ۳۰ روز، حفظ را محکم می~کند.",
          "Verses that are due for review show up here. Reviewing on time, after 1, 3, 7, 14 and 30 days, makes memory stick.",
        ),
        target: "garden.water",
        radius: 22,
        optional: true,
      },
      {
        icon: BookOpen,
        title: L("آیات تازه", "New verses"),
        body: L(
          "دکمهٔ «یادگیری» تو را به اولین آیه~ای می~برد که هنوز حفظ نکرده~ای.",
          "The “Learn” button takes you to the first verse you have not learned yet.",
        ),
        target: "garden.learn",
        radius: 22,
        optional: true,
      },
    ],
  },

  {
    id: "memorize",
    steps: [
      {
        icon: Eye,
        title: L("چهار حالت حفظ", "Four ways to memorize"),
        body: L(
          "«کامل» همه را نشان می~دهد، «نیمه~پنهان» یک کلمه از هر سه کلمه، «پنهان» همه را می~پوشاند و «چالشی» در هر آیه فقط سه بار نگاه کردن می~دهد.",
          "“Full” shows everything, “Half hidden” one word in three, “Hidden” covers it all, and “Challenge” allows only three peeks per verse.",
        ),
        target: "memorize.modes",
        radius: 22,
      },
      {
        icon: BookOpen,
        title: L("صفحهٔ مصحف", "The Mushaf page"),
        body: L(
          "آیهٔ فعلی رنگی است. در حالت~های پنهان روی کلمهٔ محو بزن تا همان کلمه نمایان شود.",
          "The current verse is highlighted. In hidden modes, tap a blurred word to reveal it.",
        ),
        target: "memorize.page",
        radius: 24,
      },
      {
        icon: Volume2,
        title: L("شنیدن آیه", "Listen to the verse"),
        body: L(
          "تلاوت همین آیه را بشنو. پخش از اینترنت انجام می~شود.",
          "Hear this verse recited. Playback streams over the internet.",
        ),
        target: "memorize.listen",
        radius: 24,
      },
      {
        icon: Flower2,
        title: L("نقطه~های پیشرفت", "Progress dots"),
        body: L(
          "هر نقطه یک آیه است. هر جا برگ یا شکوفه ببینی، همان~جا گیاهت رشد کرده است.",
          "Each dot is a verse. Wherever you see a leaf or blossom, your plant grew right there.",
        ),
        target: "memorize.dots",
        radius: 20,
      },
      {
        icon: CircleCheck,
        title: L("امتحان و ثبت", "Test and record"),
        body: L(
          "اول «پنهان کن و امتحان بده» را بزن و آیه را از حفظ بگو. بعد «یادم بود» آیه را حفظ~شده ثبت می~کند و «نیاز به مرور» آن را برای مرور علامت می~زند.",
          "First tap “Hide and test me” and recite the verse. Then “I remembered” records it as learned, and “Needs review” marks it for review.",
        ),
        target: "memorize.actions",
        radius: 24,
      },
      {
        icon: ClipboardCheck,
        title: L("آزمون و تمرین", "Exams and practice"),
        body: L(
          "از این دکمه به بخش آزمون و تمرین می~روی: آزمون هر سوره، آزمون مرحله~ای، آزمون از حفظ، تاریخچهٔ خطا و گزارش تسلط.",
          "This button opens exams and practice: the exam of each surah, the staged exam, the recall exam, mistake history and the mastery report.",
        ),
        target: "memorize.exam",
        radius: 22,
      },
      {
        icon: Layers,
        title: L("بخش~های کوتاه", "Short sections"),
        body: L(
          "سوره به بخش~های کوتاه تقسیم شده. هر بخش را با تکرار صوتی تمرین کن؛ با لمس یک بخش، صفحه به همان آیه می~رود.",
          "The surah is split into short sections. Drill each one with repeated audio; tapping a section jumps to its verse.",
        ),
        target: "memorize.sections",
        radius: 22,
        optional: true,
      },
    ],
  },

  {
    id: "tafsir",
    steps: [
      {
        icon: BookOpenText,
        title: L("انتخاب سوره", "Choose a surah"),
        body: L(
          "بین سوره~هایی که تفسیرشان آماده است جابه~جا شو (فعلاً الفاتحه و النبأ).",
          "Switch between the surahs that have a tafsir ready (currently Al-Fatihah and An-Naba).",
        ),
        target: "tafsir.switch",
        radius: 22,
      },
      {
        icon: Play,
        title: L("خلاصه و پخش", "Summary and playback"),
        body: L(
          "خلاصهٔ سوره، تعداد آیه~ها و مکی یا مدنی بودنش اینجاست؛ دکمهٔ پخش، کل سوره را برایت می~خواند.",
          "The surah summary, its verse count and whether it is Meccan or Medinan are here; the play button recites the whole surah.",
        ),
        target: "tafsir.card",
        radius: 24,
        optional: true,
      },
      {
        icon: ChevronsUpDown,
        title: L("گروه~های آیه", "Verse groups"),
        body: L(
          "هر گروه چند آیهٔ پیوسته است. روی گروه بزن تا متن عربی و معنی ساده~اش باز یا بسته شود.",
          "Each group is a run of verses. Tap a group to open or close its Arabic text and plain meaning.",
        ),
        target: "tafsir.group.0",
        radius: 24,
        optional: true,
      },
      {
        icon: Lightbulb,
        title: L("پیام~های سوره", "Lessons of the surah"),
        body: L(
          "درس~های اصلی سوره، در قالب خلاصه~ای ساده. برای مطالعهٔ دقیق به تفسیرهای معتبر مراجعه کن.",
          "The main lessons of the surah, in a simple summary. For detailed study, turn to reliable tafsir books.",
        ),
        target: "tafsir.lessons",
        radius: 24,
        optional: true,
      },
    ],
  },

  {
    id: "listen",
    steps: [
      {
        icon: Headphones,
        title: L("انتخاب قاری", "Choose a reciter"),
        body: L(
          "یکی از پنج قاری را انتخاب کن؛ سوره~ها با صدای او پخش می~شوند.",
          "Pick one of the five reciters; surahs play in his voice.",
        ),
        target: "listen.reciters",
        radius: 20,
      },
      {
        icon: Play,
        title: L("پخش~کننده", "The player"),
        body: L(
          "نوار را بکش تا به هر جای سوره بروی؛ دکمه~ها ده ثانیه جلو و عقب می~روند یا سورهٔ قبل و بعد را باز می~کنند. «تکرار» همین سوره را دوباره می~گذارد و «سورهٔ بعد» پس از پایان، سورهٔ بعدی را خودکار پخش می~کند. پخش اینترنت لازم دارد.",
          "Drag the bar to jump anywhere; the buttons skip 10 seconds or open the previous or next surah. “Repeat” replays this surah and “Next surah” plays the following one automatically when it ends. Playback needs internet.",
        ),
        target: "listen.player",
        radius: 24,
      },
      {
        icon: Repeat,
        title: L("تمرین بخش~ها", "Practice sections"),
        body: L(
          "هر بخش از سوره را جدا و با تکرار بشنو؛ برای حفظ بخش به بخش مناسب است.",
          "Listen to each section of the surah on its own, on repeat; ideal for memorizing section by section.",
        ),
        target: "listen.sections",
        radius: 22,
        optional: true,
      },
      {
        icon: Search,
        title: L("پیدا کردن سوره", "Find a surah"),
        body: L(
          "نام سوره را جستجو کن و در فهرست زیرش بزن تا پخش شود.",
          "Search for a surah, then tap it in the list below to play it.",
        ),
        target: "listen.search",
        radius: 22,
      },
    ],
  },

  {
    id: "library",
    steps: [
      {
        icon: Search,
        title: L("جستجو", "Search"),
        body: L(
          "نام فارسی یا انگلیسی سوره یا شمارهٔ آن را بنویس.",
          "Type a surah’s Persian or English name, or its number.",
        ),
        target: "library.search",
        radius: 22,
      },
      {
        icon: ListFilter,
        title: L("فیلتر", "Filters"),
        body: L(
          "فهرست را با «همه»، «علاقه~مندی»، «در حال حفظ» و «حفظ~شده» محدود کن.",
          "Narrow the list with “All”, “Favorites”, “Learning” and “Memorized”.",
        ),
        target: "library.filters",
        radius: 22,
      },
      {
        icon: Sprout,
        title: L("شروع حفظ", "Start memorizing"),
        body: L(
          "روی هر سوره بزن تا فعال شود و صفحهٔ حفظ از جایی که مانده~ای باز شود. گیاه کوچک و نوار کنارش پیشرفتت را نشان می~دهند.",
          "Tap a surah to make it active; Memorize opens where you left off. The little plant and bar beside it show your progress.",
        ),
        target: "library.first",
        radius: 20,
      },
    ],
  },

  {
    id: "settings",
    steps: [
      {
        icon: UserRound,
        title: L("حساب", "Account"),
        body: L(
          "با ورود به حساب، پیشرفتت روی سرور هم ذخیره می~شود. ورود اختیاری است؛ بدون آن، همه~چیز فقط روی همین دستگاه می~ماند.",
          "Sign in to also keep your progress on the server. Signing in is optional; without it, everything stays on this device only.",
        ),
        target: "settings.account",
        radius: 24,
      },
      {
        icon: Palette,
        title: L("ظاهر و زبان", "Look and language"),
        body: L(
          "تم رنگی (چهار گزینه) و زبان (فارسی یا انگلیسی) را عوض کن؛ فوراً اعمال می~شود.",
          "Change the colour theme (four options) and the language (Persian or English); it applies right away.",
        ),
        target: ["settings.theme", "settings.language"],
        radius: 24,
      },
      {
        icon: Volume2,
        title: L("صدای کلیک", "Click sounds"),
        body: L(
          "صدای کوتاه هنگام لمس دکمه~ها را روشن یا خاموش کن.",
          "Turn the short sound played when you tap buttons on or off.",
        ),
        target: "settings.sound",
        radius: 24,
      },
      {
        icon: Bell,
        title: L("یادآوری روزانه", "Daily reminders"),
        body: L(
          "اگر در طول روز وارد اپ نشوی، ظهر و عصر تسک~های امروزت را یادآوری می~کنیم. اگر اجازهٔ اعلان در گوشی خاموش باشد، باید از تنظیمات گوشی روشنش کنی.",
          "If you have not opened the app during the day, we remind you of your tasks at midday and in the evening. If notifications are blocked, turn them on in your phone settings.",
        ),
        target: "settings.reminders",
        radius: 24,
      },
      {
        icon: CircleHelp,
        title: L("راهنما", "Guide"),
        body: L(
          "معرفی برنامه را دوباره ببین، راهنمای صفحه~ها را روشن یا خاموش کن، یا بخواه راهنمای همهٔ صفحه~ها دوباره نشان داده شود.",
          "Replay the app introduction, switch the page guides on or off, or have every page guide shown again.",
        ),
        target: "settings.guide",
        radius: 24,
      },
    ],
  },

  {
    id: "exam",
    steps: [
      {
        icon: ClipboardCheck,
        title: L("ابزارهای تمرین", "Practice tools"),
        body: L(
          "پنج راه برای محکم~کردن حفظ: «محدوده، تمرین و آزمون»، «آزمون مرحله~ای»، «آزمون از حفظ»، «تاریخچهٔ خطا» و «گزارش تسلط و پیشرفت».",
          "Five ways to firm up your memory: “Range, practice and exam”, “Staged exam”, “Recall exam”, “Mistake history” and “Mastery and progress report”.",
        ),
        target: [
          "exam.link./scope",
          "exam.link./stages",
          "exam.link./recall",
          "exam.link./mistakes",
          "exam.link./report",
        ],
        radius: 24,
      },
      {
        icon: Trophy,
        title: L("آزمون~های آماده", "Ready-made exams"),
        body: L(
          "پایین~تر آزمون~های هر سوره است؛ تعداد پرسش~ها و بهترین نتیجه~ات هم کنارشان نوشته شده.",
          "Further down are the exams for each surah, with their question count and your best result.",
        ),
        target: "exam.item.0",
        radius: 24,
        optional: true,
      },
    ],
  },

  {
    id: "scope",
    steps: [
      {
        icon: Target,
        title: L("محدوده", "Range"),
        body: L(
          "سوره را انتخاب کن و بازهٔ «از آیه» تا «تا آیه» را بنویس، یا «کل سوره» را بزن.",
          "Choose the surah and set the “From verse” and “To verse” range, or tap “Whole surah”.",
        ),
        target: "scope.range",
        radius: 24,
      },
      {
        icon: ListChecks,
        title: L("محفوظات من", "My memorized verses"),
        body: L(
          "روی آیه~هایی که حفظ داری بزن؛ فقط همین~ها در تمرین و آزمون می~آیند. «همه»، «هیچ~کدام» و «حفظ~شده~های برنامه» انتخاب را سریع~تر می~کنند.",
          "Tap the verses you know; only those appear in practice and the exam. “All”, “None” and “Learned in the app” speed up the selection.",
        ),
        target: "scope.verses",
        radius: 24,
      },
      {
        icon: SlidersHorizontal,
        title: L("تنظیم آزمون", "Exam settings"),
        body: L(
          "تعداد پرسش~ها را انتخاب کن. زیر آن خلاصهٔ آزمون و نمرهٔ قبولی نوشته شده است.",
          "Choose the number of questions. The exam summary and the pass mark are written below it.",
        ),
        target: "scope.exam",
        radius: 24,
      },
      {
        icon: Play,
        title: L("شروع", "Start"),
        body: L(
          "«تمرین و سپس آزمون» اول مرور می~کند و بعد امتحان می~گیرد. «فقط تمرین» و «فقط آزمون» هم در دسترس~اند. دست~کم یک آیه باید انتخاب شده باشد.",
          "“Practice, then exam” rehearses first and then tests you. “Practice only” and “Exam only” are also available. At least one verse must be selected.",
        ),
        target: "scope.start",
        radius: 28,
        optional: true,
      },
    ],
  },

  {
    id: "stages",
    steps: [
      {
        icon: Target,
        title: L("سورهٔ فعال", "Active surah"),
        body: L(
          "مرحله~ها برای سوره~ای است که الان در حال حفظش هستی.",
          "The stages are for the surah you are memorizing right now.",
        ),
        target: "stages.surah",
        radius: 20,
        optional: true,
      },
      {
        icon: ListChecks,
        title: L("چهار مرحله", "Four stages"),
        body: L(
          "از آسان به سخت: آشنایی، ترتیب آیه~ها، ترکیبی و از حفظ. نمرهٔ قبولی هر مرحله روی کارتش نوشته شده؛ با قبولی، مرحلهٔ بعد باز می~شود و بهترین نمره~ات ثبت می~ماند.",
          "From easy to hard: Warm-up, Verse order, Mixed and From memory. Each stage’s pass mark is on its card; passing unlocks the next one and your best score is kept.",
        ),
        target: "stages.item.0",
        radius: 24,
      },
    ],
  },

  {
    id: "recall",
    steps: [
      {
        icon: EyeOff,
        title: L("شیوهٔ پنهان~کردن", "How verses are hidden"),
        body: L(
          "«همه پنهان»، «یک در میان»، «فقط کلمهٔ اول» (بقیه پنهان) یا «حرف اول هر کلمه»؛ هر چه کمتر ببینی، سخت~تر است.",
          "“Hide all”, “Every other word”, “First word only” (the rest hidden) or “First letter of each word”; the less you see, the harder it gets.",
        ),
        target: "recall.style",
        radius: 22,
        optional: true,
      },
      {
        icon: Target,
        title: L("چه چیزی آزمون شود؟", "What to test"),
        body: L(
          "همهٔ آیه~ها یا فقط آیه~های ضعیف؛ یعنی آیه~هایی که در تاریخچهٔ خطا هنوز حل نشده~اند.",
          "All verses, or only your weak ones: the verses with unresolved mistakes in your history.",
        ),
        target: "recall.scope",
        radius: 22,
        optional: true,
      },
      {
        icon: Play,
        title: L("شروع", "Start"),
        body: L(
          "تعداد آیه~های آزمون بالای دکمه نوشته شده؛ وقتی آماده شدی شروع کن.",
          "The number of verses is shown above the button; start whenever you are ready.",
        ),
        target: "recall.start",
        radius: 28,
        optional: true,
      },
      {
        icon: Brain,
        title: L("از حفظ بخوان", "Recite from memory"),
        body: L(
          "آیه را از حفظ بگو و اگر گیر کردی روی جای خالی بزن؛ تعداد کمک~ها محدود است. بعد «نمایش آیه» را بزن، با آیهٔ اصلی مقایسه کن و صادقانه «درست گفتم» یا «اشتباه کردم» را انتخاب کن. اشتباه~ها در تاریخچهٔ خطا ثبت می~شوند.",
          "Say the verse from memory and tap a blank if you get stuck; help is limited. Then tap “Show verse”, compare with the original and honestly pick “I got it right” or “I got it wrong”. Misses are saved to your mistake history.",
        ),
      },
    ],
  },

  {
    id: "mistakes",
    steps: [
      {
        icon: ListFilter,
        title: L("فیلتر خطاها", "Mistake filter"),
        body: L(
          "«نیاز به مرور» فقط خطاهای حل~نشده را نشان می~دهد و «همه» کل تاریخچه را. عدد کنار هر کدام تعدادشان است.",
          "“Needs review” shows only unresolved mistakes and “All” shows the whole history. The number beside each is its count.",
        ),
        target: "mistakes.filter",
        radius: 22,
      },
      {
        icon: Brain,
        title: L("تمرین ضعیف~ها", "Practise the weak ones"),
        body: L(
          "همهٔ آیه~های دارای خطا را پشت~سرهم از حفظ می~پرسد.",
          "Quizzes you from memory on every verse that has a mistake, one after another.",
        ),
        target: "mistakes.practice",
        radius: 28,
        optional: true,
      },
      {
        icon: TriangleAlert,
        title: L("هر خطا", "Each mistake"),
        body: L(
          "نوع پرسش، تعداد اشتباه و تاریخ آخرین خطا با پاسخ تو و پاسخ درست اینجاست. با دو پاسخ درست پشت~سرهم خطا خودکار حل می~شود؛ با «حل شد» هم می~توانی خودت ببندی~اش.",
          "The question type, how often you missed it and when you last did, with your answer and the correct one. Two correct answers in a row resolve it; you can also close it yourself with “Mark resolved”.",
        ),
        target: "mistakes.item.0",
        radius: 24,
        optional: true,
      },
      {
        icon: CircleCheck,
        title: L("هنوز خطایی نیست", "No mistakes yet"),
        body: L(
          "هر اشتباهی در آزمون~ها اینجا ثبت می~شود تا بعداً مرورش کنی.",
          "Every mistake you make in an exam is saved here so you can review it later.",
        ),
        target: "mistakes.empty",
        radius: 24,
        optional: true,
      },
    ],
  },

  {
    id: "report",
    steps: [
      {
        icon: Gauge,
        title: L("تسلط کلی", "Overall mastery"),
        body: L(
          "درصد تسلط و تعداد آیه~های حفظ~شده. تسلط هر آیه از مرورهای به~موقع، درستیِ پاسخ~هایت و خطاهای حل~نشده محاسبه می~شود.",
          "Your mastery percentage and the number of learned verses. A verse’s mastery comes from on-time reviews, how accurate your answers are and any unresolved mistakes.",
        ),
        target: "report.mastery",
        radius: 24,
      },
      {
        icon: Grid3x3,
        title: L("نقشهٔ تسلط", "Mastery map"),
        body: L(
          "هر خانه یک آیه است و رنگش سطح تسلط را نشان می~دهد: ضعیف، متوسط، خوب یا مسلط. روی خانه بزن تا همان آیه را مرور کنی.",
          "Each cell is a verse and its colour shows mastery: weak, fair, good or mastered. Tap a cell to review that verse.",
        ),
        target: "report.grid",
        radius: 24,
      },
      {
        icon: TriangleAlert,
        title: L("ضعیف~ترین آیه~ها", "Weakest verses"),
        body: L(
          "این آیه~ها بیشترین مرور را لازم دارند. «تمرین از حفظ» را بزن تا پشت~سرهم تمرینشان کنی.",
          "These verses need the most review. Tap “Recall exam” to drill them one after another.",
        ),
        target: "report.weakest",
        radius: 24,
        optional: true,
      },
      {
        icon: TrendingUp,
        title: L("تحلیل پیشرفت", "Progress analysis"),
        body: L(
          "دقت هفت روز گذشته و مقایسه~اش با هفتهٔ قبل، تعداد روزهای تمرین پشت~سرهم و دقت به تفکیک نوع پرسش.",
          "Accuracy over the last seven days compared with the week before, your practice streak and accuracy by question type.",
        ),
        target: "report.progress",
        radius: 24,
      },
    ],
  },

  {
    id: "session",
    steps: [
      {
        icon: Layers,
        title: L("آیه به آیه", "Verse by verse"),
        body: L(
          "آیه~ها را یکی~یکی بخوان؛ در سطح~های پنهان روی جای خالی بزن تا کلمه نمایان شود.",
          "Read the verses one by one; at hidden levels, tap a blank to reveal the word.",
        ),
        target: "session.card",
        radius: 24,
        optional: true,
      },
      {
        icon: SlidersHorizontal,
        title: L("سطح پنهان~کردن", "Hiding level"),
        body: L(
          "چهار سطح «کامل»، «یک در میان»، «حرف اول» و «پنهان»؛ با «سخت~تر» و «آسان~تر» هر وقت خواستی عوضش کن.",
          "Four levels: Full, Every other, First letter and Hidden. Use “Harder” and “Easier” to change it any time.",
        ),
        target: "session.levels",
        radius: 22,
        optional: true,
      },
      {
        icon: SkipForward,
        title: L("قبلی و بعدی", "Back and next"),
        body: L(
          "با «قبلی» و «بعدی» بین آیه~ها برو. در آخرین آیه، «پایان تمرین» یا «شروع آزمون» ظاهر می~شود.",
          "Use “Back” and “Next” to move between verses. On the last verse, “Finish practice” or “Start exam” appears.",
        ),
        target: "session.nav",
        radius: 22,
        optional: true,
      },
      {
        icon: ClipboardCheck,
        title: L("آزمون", "The exam"),
        body: L(
          "پاسخ~ها خودکار تصحیح می~شوند. در پایان نمره، نمرهٔ قبولی و وضعیت هر آیه را می~بینی و می~توانی آیه~های اشتباه را مرور کنی.",
          "Answers are graded automatically. At the end you see your score, the pass mark and the result of each verse, and can review the ones you missed.",
        ),
      },
    ],
  },

  {
    id: "plan",
    steps: [
      {
        icon: CalendarDays,
        title: L("برنامهٔ حفظ", "Memorization plan"),
        body: L(
          "برنامه مشخص می~کند در هر جلسه چقدر حفظ کنی و چه روزی تمام شود. اگر آن را حذف کنی، پیشرفت باغت تغییری نمی~کند.",
          "A plan decides how much you memorize in each session and when you finish. Deleting it does not change your garden’s progress.",
        ),
      },
      {
        icon: CalendarDays,
        title: L("ساخت برنامه", "Create a plan"),
        body: L(
          "هنوز برنامه~ای نداری؛ مقدار هر جلسه یا تاریخ هدف را مشخص کن تا برنامه ساخته شود.",
          "You do not have a plan yet; set the amount per session or a target date and the plan is built for you.",
        ),
        target: "plan.empty",
        radius: 24,
        optional: true,
      },
      {
        icon: CircleCheck,
        title: L("برنامهٔ امروز", "Today’s plan"),
        body: L(
          "ببین امروز چه چیزی حفظ و چه چیزی مرور کنی، یا روز استراحت است. «شروع حفظ» تو را به صفحهٔ حفظ می~برد، «انجام شد» جلسه را تیک می~زند و «برگرداندن» تیک را برمی~دارد.",
          "See what to memorize and review today, or whether it is a rest day. “Start memorizing” opens Memorize, “Mark as done” ticks the session and “Undo” removes the tick.",
        ),
        target: "plan.today",
        radius: 24,
        optional: true,
      },
      {
        icon: TrendingUp,
        title: L("پیشرفت", "Progress"),
        body: L(
          "تعداد جلسه~ها و آیه~های انجام~شده و تاریخ پایان برنامه اینجاست.",
          "The sessions and verses you have finished, and the plan’s end date, are here.",
        ),
        target: "plan.progress",
        radius: 24,
        optional: true,
      },
      {
        icon: LayoutList,
        title: L("تقویم یا فهرست", "Calendar or list"),
        body: L(
          "بین «تقویم» و «فهرست» جابه~جا شو؛ روز حفظ، روز انجام~شده و امروز رنگ جدا دارند.",
          "Switch between “Calendar” and “List”; study days, finished days and today each have their own colour.",
        ),
        target: "plan.view",
        radius: 22,
        optional: true,
      },
      {
        icon: FileDown,
        title: L("خروجی", "Export"),
        body: L(
          "برنامه را به صورت PDF یا Excel بساز و ذخیره کن یا برای دیگران بفرست.",
          "Create the plan as a PDF or Excel file, then save it or send it to someone.",
        ),
        target: "plan.export",
        radius: 24,
        optional: true,
      },
    ],
  },

  {
    id: "planSetup",
    steps: [
      {
        icon: BookMarked,
        title: L("چه چیزی حفظ می~کنی؟", "What will you memorize?"),
        body: L(
          "سوره~ها، ترتیب حفظ و در صورت نیاز بازهٔ آیه~ها را انتخاب کن.",
          "Choose the surahs, the order and, if you like, a range of verses.",
        ),
        target: "planSetup.what",
        radius: 24,
      },
      {
        icon: SlidersHorizontal,
        title: L("برنامه چطور محاسبه شود؟", "How to calculate it"),
        body: L(
          "«مقدار روزانه»: تعداد آیه در هر جلسه را تو می~گویی و تاریخ پایان محاسبه می~شود. «تاریخ هدف»: تاریخ پایان را تو می~گویی و مقدار هر جلسه محاسبه می~شود.",
          "“Daily amount”: you set the verses per session and the end date is calculated. “Target date”: you set the end date and the amount per session is calculated.",
        ),
        target: "planSetup.how",
        radius: 24,
      },
      {
        icon: CalendarCheck,
        title: L("روزها و مرور", "Days and review"),
        body: L(
          "روزهای حفظ را انتخاب کن؛ روزهای انتخاب~نشده استراحت~اند. با «مرور جلسهٔ قبل»، بخش جلسهٔ قبل هم در هر جلسه برای مرور نوشته می~شود.",
          "Pick your study days; unselected days are rest days. With “Review the previous session”, each session also lists the previous one’s portion for review.",
        ),
        target: "planSetup.days",
        radius: 24,
      },
      {
        icon: Eye,
        title: L("پیش~نمایش", "Preview"),
        body: L(
          "خلاصهٔ برنامه: مجموع آیه~ها، تعداد جلسه~ها، آیه در هر جلسه، روزهای حفظ و تاریخ شروع و پایان.",
          "A summary of the plan: total verses, number of sessions, verses per session, study days and the start and end dates.",
        ),
        target: "planSetup.preview",
        radius: 24,
      },
      {
        icon: CircleCheck,
        title: L("ذخیره", "Save"),
        body: L(
          "اگر پیش~نمایش درست بود، برنامه را ذخیره کن. بعداً هم می~توانی ویرایشش کنی.",
          "If the preview looks right, save the plan. You can edit it later too.",
        ),
        target: "planSetup.save",
        radius: 28,
        optional: true,
      },
    ],
  },
];

/* "~" -> zero-width non-joiner, applied once to every Persian string. */
const ZWNJ = "\u200c";
const withHalfSpaces = (text: string): string => text.split("~").join(ZWNJ);

function localize(value: Localized): Localized {
  return { fa: withHalfSpaces(value.fa), en: value.en };
}

export const GUIDES: Readonly<Record<GuideId, GuideDef>> = Object.fromEntries(
  GUIDE_LIST.map((guide) => [
    guide.id,
    {
      id: guide.id,
      steps: guide.steps.map((step) => ({
        ...step,
        title: localize(step.title),
        body: localize(step.body),
        doneLabel: step.doneLabel ? localize(step.doneLabel) : undefined,
      })),
    },
  ]),
) as unknown as Record<GuideId, GuideDef>;

export const GUIDE_IDS: readonly GuideId[] = GUIDE_LIST.map(
  (guide) => guide.id,
);

/** Guides that open on their own the first time a page is visited (everything except the tour). */
export const PAGE_GUIDE_IDS: readonly GuideId[] = GUIDE_IDS.filter(
  (id) => id !== "tour",
);

export function isGuideId(value: string): value is GuideId {
  return (GUIDE_IDS as readonly string[]).includes(value);
}

/** Route -> guide shown the first time the page is opened. */
export const GUIDE_ROUTES: Readonly<Record<string, GuideId>> = {
  "/": "garden",
  "/memorize": "memorize",
  "/tafsir": "tafsir",
  "/listen": "listen",
  "/library": "library",
  "/settings": "settings",
  "/exam": "exam",
  "/scope": "scope",
  "/stages": "stages",
  "/recall": "recall",
  "/mistakes": "mistakes",
  "/report": "report",
  "/session": "session",
  "/plan": "plan",
  "/plan-setup": "planSetup",
};

/** Buttons and labels of the guide window itself and of its card in Settings. */
export interface GuideUiText {
  next: string;
  prev: string;
  done: string;
  skip: string;
  stepOf: string;
  disablePages: string;
  settingsTitle: string;
  pagesTitle: string;
  pagesHint: string;
  replayTitle: string;
  replayHint: string;
  resetTitle: string;
  resetHint: string;
  resetDone: string;
}

const FA_UI: GuideUiText = {
  next: "بعدی",
  prev: "قبلی",
  done: "فهمیدم",
  skip: "رد کردن",
  stepOf: "{n} از {total}",
  disablePages: "راهنمای صفحه~ها را نشان نده",
  settingsTitle: "راهنمای برنامه",
  pagesTitle: "راهنمای صفحه~ها",
  pagesHint:
    "اولین بار که وارد هر صفحه می~شوی، یک راهنمای کوتاه نشان داده می~شود",
  replayTitle: "مرور معرفی برنامه",
  replayHint: "آشنایی کوتاه با بخش~های اصلی",
  resetTitle: "دیدن دوبارهٔ راهنمای همهٔ صفحه~ها",
  resetHint: "دفعهٔ بعد که وارد هر صفحه شدی، راهنمایش دوباره نشان داده می~شود",
  resetDone: "انجام شد؛ راهنمای هر صفحه دفعهٔ بعد دوباره نشان داده می~شود",
};

const EN_UI: GuideUiText = {
  next: "Next",
  prev: "Back",
  done: "Got it",
  skip: "Skip",
  stepOf: "{n} of {total}",
  disablePages: "Don’t show page guides",
  settingsTitle: "App guide",
  pagesTitle: "Page guides",
  pagesHint: "Show a short guide the first time you open each page",
  replayTitle: "Replay the app introduction",
  replayHint: "A quick tour of the main sections",
  resetTitle: "See every page guide again",
  resetHint: "Each page shows its guide again the next time you open it",
  resetDone: "Done; every page will show its guide again next time",
};

export const GUIDE_UI: Readonly<Record<Language, GuideUiText>> = {
  fa: Object.fromEntries(
    Object.entries(FA_UI).map(([key, value]) => [key, withHalfSpaces(value)]),
  ) as unknown as GuideUiText,
  en: EN_UI,
};
