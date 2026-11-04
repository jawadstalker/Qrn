import {
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
          "با هر آیه~ای که حفظ می~کنی، گیاهت رشد می~کند. بیا یک دقیقه با بخش~های برنامه آشنا شویم.",
          "Every verse you memorize makes your plant grow. Let’s take a one-minute look around.",
        ),
        offerDisable: true,
      },
      {
        icon: Sprout,
        title: L("باغ من", "My garden"),
        body: L(
          "پیشرفتت اینجاست: گیاه، آبیاری روزانه و آیه~های تازه.",
          "Your progress lives here: the plant, daily watering and new verses.",
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
          "آیه~ها را بخوان، پنهان کن و خودت را بسنج.",
          "Read verses, hide them and test yourself.",
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
          "معنی و پیام هر سوره را به زبان ساده بخوان.",
          "Read the meaning of each surah in plain words.",
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
          "سوره~ها را با صدای قاری~های مختلف بشنو.",
          "Listen to surahs recited by different reciters.",
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
          "سوره~ای را که می~خواهی حفظ کنی از اینجا انتخاب کن.",
          "Pick the surah you want to memorize here.",
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
          "حساب، تم، زبان، صدا و همین راهنما را اینجا پیدا می~کنی.",
          "Account, theme, language, sound and this guide are all here.",
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
          "هر روز یک آیه بخوان و با دکمهٔ پخش بشنو.",
          "Read a new verse every day and play it with the button.",
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
          "مقدار حفظ روزانه و تاریخ پایان را مشخص کن.",
          "Set how much to memorize each day and when to finish.",
        ),
        target: "garden.plan",
        radius: 22,
      },
      {
        icon: Droplets,
        title: L("آبیاری امروز", "Today’s watering"),
        body: L(
          "آیه~هایی که وقت مرورشان رسیده اینجا هستند. مرور به~موقع حفظ را محکم می~کند.",
          "Verses that are due for review show up here. Reviewing on time makes memory stick.",
        ),
        target: "garden.water",
        radius: 22,
        optional: true,
      },
      {
        icon: BookOpen,
        title: L("آیات تازه", "New verses"),
        body: L(
          "این دکمه تو را به اولین آیه~ای می~برد که هنوز حفظ نکرده~ای.",
          "This button takes you to the first verse you have not learned yet.",
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
          "از کامل تا چالشی؛ هر چه جلوتر بروی، کلمه~های بیشتری پنهان می~شوند.",
          "From Full to Challenge: the further you go, the more words are hidden.",
        ),
        target: "memorize.modes",
        radius: 22,
      },
      {
        icon: BookOpen,
        title: L("صفحهٔ مصحف", "The Mushaf page"),
        body: L(
          "آیهٔ فعلی رنگی است. در حالت پنهان روی کلمهٔ محو بزن تا ببینی~اش.",
          "The current verse is highlighted. In hidden modes, tap a blurred word to peek.",
        ),
        target: "memorize.page",
        radius: 24,
      },
      {
        icon: Volume2,
        title: L("شنیدن آیه", "Listen to the verse"),
        body: L(
          "تلاوت همین آیه را بشنو (اینترنت لازم است).",
          "Hear this verse recited (needs an internet connection).",
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
        title: L("یادم بود یا نیاز به مرور", "I remembered or needs review"),
        body: L(
          "اول خودت را بسنج؛ بعد آیه را حفظ~شده ثبت کن یا برای مرور برگردان.",
          "Test yourself first, then mark the verse as learned or send it back for review.",
        ),
        target: "memorize.actions",
        radius: 24,
      },
      {
        icon: ClipboardCheck,
        title: L("آزمون", "Exams"),
        body: L(
          "آزمون~های حفظ و تفسیر از این دکمه شروع می~شوند.",
          "The memorization and tafsir exams start from this button.",
        ),
        target: "memorize.exam",
        radius: 22,
      },
      {
        icon: Layers,
        title: L("بخش~های کوتاه", "Short sections"),
        body: L(
          "سوره به بخش~های کوتاه تقسیم شده؛ هر بخش را با تکرار صوتی تمرین کن.",
          "The surah is split into short sections; drill each one with repeated audio.",
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
          "بین سوره~هایی که تفسیرشان آماده است جابه~جا شو.",
          "Switch between the surahs that have a tafsir ready.",
        ),
        target: "tafsir.switch",
        radius: 22,
      },
      {
        icon: Play,
        title: L("خلاصه و پخش", "Summary and playback"),
        body: L(
          "خلاصهٔ سوره اینجاست؛ با دکمهٔ پخش کل سوره را هم می~شنوی.",
          "The surah summary is here; the play button reads the whole surah to you.",
        ),
        target: "tafsir.card",
        radius: 24,
        optional: true,
      },
      {
        icon: ChevronsUpDown,
        title: L("گروه~های آیه", "Verse groups"),
        body: L(
          "روی هر گروه بزن تا متن عربی و معنی ساده~اش باز یا بسته شود.",
          "Tap a group to open or close its Arabic text and plain meaning.",
        ),
        target: "tafsir.group.0",
        radius: 24,
        optional: true,
      },
      {
        icon: Lightbulb,
        title: L("پیام~های سوره", "Lessons of the surah"),
        body: L(
          "درس~های اصلی سوره؛ برای مطالعهٔ دقیق به تفاسیر معتبر هم مراجعه کن.",
          "The main lessons of the surah. For detailed study, check reliable tafsir books too.",
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
        body: L("یکی از قاری~ها را انتخاب کن.", "Pick one of the reciters."),
        target: "listen.reciters",
        radius: 20,
      },
      {
        icon: Play,
        title: L("پخش~کننده", "The player"),
        body: L(
          "نوار را بکش تا به هر جای سوره بروی. ده ثانیه جلو و عقب، تکرار و سورهٔ بعد هم اینجاست. پخش اینترنت لازم دارد.",
          "Drag the bar to jump anywhere. 10-second skips, repeat and next surah are here too. Playback needs internet.",
        ),
        target: "listen.player",
        radius: 24,
      },
      {
        icon: Repeat,
        title: L("تمرین بخش~ها", "Practice sections"),
        body: L(
          "هر بخش از سوره را جدا و با تکرار بشنو.",
          "Listen to each section of the surah on its own, on repeat.",
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
          "نام فارسی یا انگلیسی یا شمارهٔ سوره را بنویس.",
          "Type a surah’s Persian or English name, or its number.",
        ),
        target: "library.search",
        radius: 22,
      },
      {
        icon: ListFilter,
        title: L("فیلتر", "Filters"),
        body: L(
          "فقط سوره~های در حال حفظ یا حفظ~شده را ببین.",
          "See only the surahs you are learning or have finished.",
        ),
        target: "library.filters",
        radius: 22,
      },
      {
        icon: Sprout,
        title: L("شروع حفظ", "Start memorizing"),
        body: L(
          "روی هر سوره بزن تا فعال شود و صفحهٔ حفظ از جایی که مانده~ای باز شود. گیاه کوچک و نوارش پیشرفتت را نشان می~دهند.",
          "Tap a surah to make it active; Memorize opens where you left off. The little plant and bar show your progress.",
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
          "با ورود به حساب، پیشرفتت روی سرور هم ذخیره می~شود. ورود اختیاری است.",
          "Sign in to also keep your progress on the server. Signing in is optional.",
        ),
        target: "settings.account",
        radius: 24,
      },
      {
        icon: Palette,
        title: L("ظاهر و زبان", "Look and language"),
        body: L(
          "تم رنگی و زبان (فارسی یا انگلیسی) را عوض کن؛ فوراً اعمال می~شود.",
          "Change the colour theme and the language (Persian or English); it applies right away.",
        ),
        target: ["settings.theme", "settings.language"],
        radius: 24,
      },
      {
        icon: Volume2,
        title: L("صدای کلیک", "Click sounds"),
        body: L(
          "صداهای کوتاه هنگام لمس را روشن یا خاموش کن.",
          "Turn the short tap sounds on or off.",
        ),
        target: "settings.sound",
        radius: 24,
      },
      {
        icon: CircleHelp,
        title: L("راهنما", "Guide"),
        body: L(
          "معرفی برنامه را دوباره ببین یا راهنمای صفحه~ها را روشن و خاموش کن.",
          "Replay the app introduction or switch the page guides on and off.",
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
          "محدوده و آزمون، مرحله~ها، از حفظ، تاریخچهٔ خطا و گزارش تسلط؛ پنج راه برای محکم~کردن حفظ.",
          "Range and exam, stages, recall, mistake history and mastery report: five ways to firm up your memory.",
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
          "پایین~تر آزمون~های هر سوره است؛ تعداد پرسش و بهترین نتیجه~ات هم نوشته شده.",
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
          "سوره و بازهٔ آیه~ها را انتخاب کن، یا کل سوره را بگذار.",
          "Choose the surah and the verse range, or use the whole surah.",
        ),
        target: "scope.range",
        radius: 24,
      },
      {
        icon: ListChecks,
        title: L("محفوظات من", "My memorized verses"),
        body: L(
          "روی آیه~هایی که حفظ داری بزن؛ فقط همین~ها آزمون می~شوند.",
          "Tap the verses you know; only those get tested.",
        ),
        target: "scope.verses",
        radius: 24,
      },
      {
        icon: SlidersHorizontal,
        title: L("تنظیم آزمون", "Exam settings"),
        body: L(
          "تعداد پرسش~ها و نمرهٔ قبولی را تعیین کن.",
          "Set the number of questions and the pass mark.",
        ),
        target: "scope.exam",
        radius: 24,
      },
      {
        icon: Play,
        title: L("شروع", "Start"),
        body: L(
          "«تمرین و سپس آزمون» اول مرور می~کند و بعد امتحان می~گیرد. فقط تمرین یا فقط آزمون هم ممکن است.",
          "“Practice, then exam” rehearses first and then tests you. Practice only or exam only also work.",
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
          "آزمون~ها برای سوره~ای است که الان حفظ می~کنی.",
          "The exams are for the surah you are learning right now.",
        ),
        target: "stages.surah",
        radius: 20,
        optional: true,
      },
      {
        icon: ListChecks,
        title: L("چهار مرحله", "Four stages"),
        body: L(
          "از آسان به سخت. با قبولی در هر مرحله، مرحلهٔ بعد باز می~شود و بهترین نمره~ات ثبت می~شود.",
          "From easy to hard. Passing a stage unlocks the next one and your best score is saved.",
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
          "همه پنهان، یک در میان، فقط کلمهٔ اول یا حرف اول هر کلمه.",
          "Everything hidden, every other word, the first word only, or the first letter of each word.",
        ),
        target: "recall.style",
        radius: 22,
        optional: true,
      },
      {
        icon: Target,
        title: L("چه چیزی آزمون شود؟", "What to test"),
        body: L(
          "همهٔ آیه~ها یا فقط آیه~های ضعیفت.",
          "All verses, or only your weak ones.",
        ),
        target: "recall.scope",
        radius: 22,
        optional: true,
      },
      {
        icon: Play,
        title: L("شروع", "Start"),
        body: L("وقتی آماده شدی شروع کن.", "Start whenever you are ready."),
        target: "recall.start",
        radius: 28,
        optional: true,
      },
      {
        icon: Brain,
        title: L("از حفظ بخوان", "Recite from memory"),
        body: L(
          "آیه را از حفظ بگو و اگر گیر کردی کمک بگیر. بعد با «نمایش آیه» بسنج و صادقانه «درست گفتم» یا «اشتباه کردم» را بزن؛ اشتباه~ها در تاریخچهٔ خطا ثبت می~شوند.",
          "Say the verse from memory and ask for help if you get stuck. Then check with “Show verse” and honestly pick right or wrong; misses are saved to your mistake history.",
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
          "بین خطاهای حل~نشده و همهٔ خطاها جابه~جا شو.",
          "Switch between unresolved mistakes and all mistakes.",
        ),
        target: "mistakes.filter",
        radius: 22,
      },
      {
        icon: Brain,
        title: L("تمرین ضعیف~ها", "Practise the weak ones"),
        body: L(
          "همهٔ آیه~های ضعیف را پشت~سرهم از حفظ بخوان.",
          "Recite all your weak verses one after another.",
        ),
        target: "mistakes.practice",
        radius: 28,
        optional: true,
      },
      {
        icon: TriangleAlert,
        title: L("هر خطا", "Each mistake"),
        body: L(
          "تعداد اشتباه و تاریخ آخرین خطا اینجاست. با دو پاسخ درست پشت~سرهم، خطا خودکار حل می~شود.",
          "How often you missed it and when you last did. Two correct answers in a row resolve it.",
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
          "درصد تسلط و تعداد آیه~های حفظ~شده را اینجا می~بینی.",
          "See your mastery percentage and the number of learned verses here.",
        ),
        target: "report.mastery",
        radius: 24,
      },
      {
        icon: Grid3x3,
        title: L("نقشهٔ تسلط", "Mastery map"),
        body: L(
          "هر خانه یک آیه است؛ رنگش سطح تسلط را نشان می~دهد و با لمس آن، آیه را مرور می~کنی.",
          "Each cell is a verse; its colour shows mastery, and tapping it reviews that verse.",
        ),
        target: "report.grid",
        radius: 24,
      },
      {
        icon: TriangleAlert,
        title: L("ضعیف~ترین آیه~ها", "Weakest verses"),
        body: L(
          "برای تمرین بیشتر از همین~جا شروع کن.",
          "Start here for extra practice.",
        ),
        target: "report.weakest",
        radius: 24,
        optional: true,
      },
      {
        icon: TrendingUp,
        title: L("تحلیل پیشرفت", "Progress analysis"),
        body: L(
          "دقت هفتهٔ گذشته، روزهای تمرین پشت~سرهم و دقت به تفکیک نوع پرسش.",
          "Last week’s accuracy, your practice streak and accuracy by question type.",
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
          "هر آیه را بخوان؛ در سطح~های پنهان روی جای خالی بزن تا کلمه را ببینی.",
          "Read each verse; at hidden levels, tap a blank to reveal the word.",
        ),
        target: "session.card",
        radius: 24,
        optional: true,
      },
      {
        icon: SlidersHorizontal,
        title: L("سطح پنهان~کردن", "Hiding level"),
        body: L(
          "هر وقت خواستی سخت~تر یا آسان~تر کن.",
          "Make it harder or easier whenever you like.",
        ),
        target: "session.levels",
        radius: 22,
        optional: true,
      },
      {
        icon: SkipForward,
        title: L("قبلی و بعدی", "Back and next"),
        body: L(
          "بین آیه~ها جابه~جا شو؛ در آخر می~توانی آزمون را شروع کنی.",
          "Move between verses; at the end you can start the exam.",
        ),
        target: "session.nav",
        radius: 22,
        optional: true,
      },
      {
        icon: ClipboardCheck,
        title: L("آزمون", "The exam"),
        body: L(
          "پاسخ~ها خودکار تصحیح می~شود و در پایان نمره و وضعیت هر آیه را می~بینی.",
          "Answers are graded automatically, and at the end you see your score and the result of each verse.",
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
          "برنامه مشخص می~کند هر روز چقدر حفظ کنی و چه روزی تمام شود.",
          "A plan decides how much you memorize each day and when you finish.",
        ),
      },
      {
        icon: CalendarDays,
        title: L("ساخت برنامه", "Create a plan"),
        body: L(
          "هنوز برنامه~ای نداری؛ مقدار روزانه و تاریخ هدف را مشخص کن.",
          "You do not have a plan yet; set a daily amount and a target date.",
        ),
        target: "plan.empty",
        radius: 24,
        optional: true,
      },
      {
        icon: CircleCheck,
        title: L("برنامهٔ امروز", "Today’s plan"),
        body: L(
          "ببین امروز چه چیزی حفظ و چه چیزی مرور کنی. «شروع حفظ» تو را به صفحهٔ حفظ می~برد و «انجام شد» روز را تیک می~زند.",
          "See what to memorize and review today. “Start memorizing” opens Memorize and “Mark as done” ticks the day.",
        ),
        target: "plan.today",
        radius: 24,
        optional: true,
      },
      {
        icon: TrendingUp,
        title: L("پیشرفت", "Progress"),
        body: L(
          "پیشرفت کل برنامه و تاریخ پایان اینجاست.",
          "Your overall progress and the finish date are here.",
        ),
        target: "plan.progress",
        radius: 24,
        optional: true,
      },
      {
        icon: LayoutList,
        title: L("تقویم یا فهرست", "Calendar or list"),
        body: L(
          "نمای برنامه را عوض کن؛ روزهای انجام~شده و امروز رنگ جدا دارند.",
          "Switch the view; finished days and today have their own colours.",
        ),
        target: "plan.view",
        radius: 22,
        optional: true,
      },
      {
        icon: FileDown,
        title: L("خروجی", "Export"),
        body: L(
          "برنامه را به صورت PDF یا Excel ذخیره کن یا برای دیگران بفرست.",
          "Save the plan as a PDF or Excel file, or send it to someone.",
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
          "با «مقدار روزانه»، تاریخ پایان محاسبه می~شود؛ با «تاریخ هدف»، مقدار هر جلسه.",
          "With “Daily amount” the end date is calculated; with “Target date” the amount per session is.",
        ),
        target: "planSetup.how",
        radius: 24,
      },
      {
        icon: CalendarCheck,
        title: L("روزها و مرور", "Days and review"),
        body: L(
          "روزهای حفظ را انتخاب کن؛ بقیه استراحت~اند. می~توانی مرور جلسهٔ قبل را هم اضافه کنی.",
          "Pick your study days; the rest are rest days. You can also add a review of the previous session.",
        ),
        target: "planSetup.days",
        radius: 24,
      },
      {
        icon: Eye,
        title: L("پیش~نمایش", "Preview"),
        body: L(
          "خلاصهٔ برنامه: مجموع آیه~ها، تعداد جلسه~ها و تاریخ پایان.",
          "A summary of the plan: total verses, number of sessions and end date.",
        ),
        target: "planSetup.preview",
        radius: 24,
      },
      {
        icon: CircleCheck,
        title: L("ذخیره", "Save"),
        body: L(
          "اگر پیش~نمایش درست بود، برنامه را ذخیره کن.",
          "If the preview looks right, save the plan.",
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
