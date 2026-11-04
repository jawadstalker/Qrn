import {
  BarChart3,
  BookMarked,
  BookOpen,
  BookOpenText,
  Brain,
  CalendarCheck,
  CalendarDays,
  CheckCheck,
  CircleCheck,
  CircleHelp,
  ChevronsUpDown,
  ClipboardCheck,
  Compass,
  Droplets,
  Eye,
  EyeOff,
  FileDown,
  Flame,
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
  Lock,
  MousePointerClick,
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
  Trash2,
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
 * Everything the guides say lives in this file, so editing a text, adding a step or adding a
 * guide for a new page never touches the UI code.
 *
 * In the Persian strings "~" stands for the zero-width non-joiner (half space). It is converted
 * to U+200C when the module loads, so the sources stay readable and the characters are never lost.
 *
 * To add a guide for a new page:
 *   1. add its id to GuideId and its steps to GUIDES,
 *   2. map the route to the id in GUIDE_ROUTES.
 */

export interface Localized {
  fa: string;
  en: string;
}

export interface GuideItem {
  icon: LucideIcon;
  text: Localized;
}

export interface GuideStep {
  icon: LucideIcon;
  title: Localized;
  body: Localized;
  /** Short rows with an icon, used to list the controls of a page. */
  items?: readonly GuideItem[];
  /** Dim the whole screen except the bottom tab bar. */
  spotlight?: "tabBar";
  /** Label of the main button on the last step (default: "Got it"). */
  doneLabel?: Localized;
  /** Last step only: also show a link that turns the page guides off for good. */
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

const GUIDE_LIST: readonly GuideDef[] = [
  {
    id: "tour",
    steps: [
      {
        icon: Sprout,
        title: L("به باغ حفظ قرآن خوش آمدی", "Welcome to Quran Garden"),
        body: L(
          "اینجا آیه~ها را آرام و با مرور منظم حفظ می~کنی و گیاهت با هر آیه بزرگ~تر می~شود. بیا در چند قدم کوتاه با برنامه آشنا شویم.",
          "Memorize verses calmly with regular review, and watch your plant grow with every verse. Let’s take a quick look around.",
        ),
      },
      {
        icon: Compass,
        title: L("شش بخش اصلی", "The six main sections"),
        body: L(
          "با نوار پایین صفحه بین بخش~ها جابه~جا می~شوی. این نوار الان روشن شده است:",
          "Use the bar at the bottom to move between sections. It is highlighted right now:",
        ),
        spotlight: "tabBar",
        items: [
          {
            icon: Sprout,
            text: L(
              "باغ من: رشد گیاه، آبیاری و آیه~های تازه",
              "My garden: your plant, watering and new verses",
            ),
          },
          {
            icon: BookOpen,
            text: L(
              "حفظ: خواندن، پنهان~کردن و سنجش آیه~ها",
              "Memorize: read, hide and test verses",
            ),
          },
          {
            icon: BookOpenText,
            text: L(
              "تفسیر: معنی و پیام سوره~ها به زبان ساده",
              "Tafsir: the meaning of each surah in plain words",
            ),
          },
          {
            icon: Headphones,
            text: L(
              "تلاوت: شنیدن سوره~ها با صدای قاری~ها",
              "Listen: surahs recited by different reciters",
            ),
          },
          {
            icon: ListOrdered,
            text: L(
              "فهرست: انتخاب سوره برای حفظ",
              "Library: pick a surah to memorize",
            ),
          },
          {
            icon: Settings,
            text: L(
              "تنظیمات: حساب، تم، زبان و صدا",
              "Settings: account, theme, language and sound",
            ),
          },
        ],
      },
      {
        icon: CircleHelp,
        title: L("یک راهنما برای هر صفحه", "A short guide for every page"),
        body: L(
          "اولین بار که وارد هر صفحه می~شوی، یک راهنمای کوتاه می~بینی. هر وقت خواستی از «تنظیمات» می~توانی راهنماها را دوباره ببینی.",
          "The first time you open a page you will see a short guide. You can bring the guides back any time from Settings.",
        ),
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
          "با هر آیه~ای که حفظ می~کنی گیاهت بزرگ~تر می~شود: دانه، جوانه، نهال، غنچه و گل. نوار زیر گیاه نشان می~دهد چند آیه تا مرحلهٔ بعد مانده است. اگر چند روز مرور نکنی، گیاه نمی~میرد؛ فقط کمی خم می~شود.",
          "Every verse you learn makes your plant grow: seed, sprout, sapling, bud and flower. The bar under the plant shows how many verses are left until the next stage. If you skip a few days of review the plant never dies; it just droops a little.",
        ),
      },
      {
        icon: Flower2,
        title: L("برگ و شکوفه", "Leaves and blossoms"),
        body: L(
          "با حفظ سه آیهٔ اول، سه برگ روی گیاه درمی~آید. بعد از آن هر شکوفه یعنی یک~سوم سوره را حفظ کرده~ای و وقتی سه شکوفه باز شود، گلت کامل است. عددهای پایین صفحه آیه~های حفظ~شده، گل~ها و برگ~هایت را نشان می~دهند.",
          "Learning your first three verses grows three leaves. After that, each blossom means you have memorized a third of the surah, and three blossoms make a complete flower. The numbers at the bottom count your learned verses, blossoms and leaves.",
        ),
      },
      {
        icon: Droplets,
        title: L("آبیاری و آیه~های تازه", "Watering and new verses"),
        body: L(
          "مرور منظم حفظ را محکم می~کند و برنامه آن را برایت زمان~بندی می~کند.",
          "Regular review makes memory stick, and the app schedules it for you.",
        ),
        items: [
          {
            icon: Droplets,
            text: L(
              "«آبیاری امروز»: آیه~هایی که وقت مرورشان رسیده؛ دکمهٔ آبیاری مستقیم به مرورشان می~برد",
              "“Today’s watering”: verses due for review; the button takes you straight to them",
            ),
          },
          {
            icon: BookOpen,
            text: L(
              "«آیات تازه»: دکمهٔ یادگیری تو را به اولین آیه~ای می~برد که هنوز حفظ نکرده~ای",
              "“New verses”: the button opens the first verse you have not learned yet",
            ),
          },
        ],
      },
      {
        icon: Star,
        title: L("آیهٔ امروز و میان~برها", "Verse of the day and shortcuts"),
        body: L(
          "بالای صفحه آیهٔ امروز را می~خوانی و با دکمهٔ پخش می~شنوی. کارت~های زیر آن تو را سریع به بخش~های دیگر می~برند:",
          "Near the top you can read the verse of the day and play it. The cards below take you straight to other parts of the app:",
        ),
        items: [
          {
            icon: Play,
            text: L(
              "دکمهٔ پخش: شنیدن آیهٔ امروز",
              "Play button: listen to the verse of the day",
            ),
          },
          {
            icon: BookOpenText,
            text: L(
              "تفسیر سوره: معنی و پیام آیه~ها",
              "Surah tafsir: meaning and message",
            ),
          },
          {
            icon: Headphones,
            text: L(
              "شنیدن تلاوت: سوره~ها با صدای قاری",
              "Listen: surahs by reciters",
            ),
          },
          {
            icon: Trophy,
            text: L(
              "کوییز: سنجش سوره و بهترین نمرهٔ تو",
              "Quiz: test yourself and see your best score",
            ),
          },
          {
            icon: CalendarDays,
            text: L(
              "برنامهٔ حفظ: مقدار روزانه و تقویم",
              "Memorization plan: daily amount and calendar",
            ),
          },
        ],
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
          "نوار بالای صفحه حالت نمایش آیه را عوض می~کند. در حالت~های پنهان، روی کلمهٔ محو بزن تا ببینی~اش.",
          "The bar at the top changes how the verse is shown. In the hidden modes, tap a blurred word to peek at it.",
        ),
        items: [
          {
            icon: BookOpen,
            text: L("کامل: اول با دقت بخوان", "Full: read it carefully first"),
          },
          {
            icon: Eye,
            text: L(
              "نیمه~پنهان: از هر سه کلمه فقط یکی دیده می~شود",
              "Half hidden: only one word in three is visible",
            ),
          },
          {
            icon: EyeOff,
            text: L(
              "پنهان: همهٔ کلمه~ها محو می~شوند",
              "Hidden: every word is blurred",
            ),
          },
          {
            icon: Flame,
            text: L(
              "چالشی: همه پنهان است و برای هر آیه فقط سه بار می~توانی نگاه کنی",
              "Challenge: everything is hidden and you get only three peeks per verse",
            ),
          },
        ],
      },
      {
        icon: Volume2,
        title: L("شنیدن آیه", "Listen to the verse"),
        body: L(
          "دکمهٔ «شنیدن این آیه» همین آیه را با صدای قاری پخش می~کند. آیهٔ فعلی روی صفحهٔ مصحف رنگی می~شود تا بدانی کجا هستی. برای پخش، اینترنت لازم است.",
          "“Listen to this verse” plays the current verse. The verse you are on is highlighted on the Mushaf page so you always know where you are. Playback needs an internet connection.",
        ),
      },
      {
        icon: CircleCheck,
        title: L("یادم بود یا نیاز به مرور", "I remembered or needs review"),
        body: L(
          "در حالت کامل، اول «پنهان کن و امتحان بده» را بزن تا خودت را بسنجی. بعد از آن «یادم بود» آیه را حفظ~شده ثبت می~کند و گیاهت رشد می~کند. اگر آیه هنوز محکم نیست، «نیاز به مرور» را بزن تا برای مرور برگردد.",
          "In Full mode, tap “Hide and test me” first to check yourself. After that, “I remembered” marks the verse as learned and your plant grows. If the verse is not solid yet, tap “Needs review” and it comes back for review.",
        ),
      },
      {
        icon: Flower2,
        title: L("نقطه~های پیشرفت", "Progress dots"),
        body: L(
          "ردیف نقطه~ها وضعیت هر آیه از این سوره را نشان می~دهد. برگ و شکوفه~های بالای آن~ها همان~هایی هستند که با حفظ این آیه~ها به گلت اضافه می~شوند.",
          "The row of dots shows the status of each verse in the surah. The leaves and blossoms above them are the ones you will add to your plant by learning those verses.",
        ),
      },
      {
        icon: ClipboardCheck,
        title: L("آزمون و بخش~های کوتاه", "Exams and short sections"),
        body: L(
          "دکمهٔ آزمون در بالای صفحه به آزمون~های حفظ و تفسیر می~رود. پایین صفحه، سوره به بخش~های کوتاه تقسیم شده؛ رنگ هر بخش با میزان تمرین عوض می~شود و می~توانی هر بخش را با صدای تکراری تمرین کنی.",
          "The exam button at the top opens the memorization and tafsir exams. At the bottom the surah is split into short sections; each changes colour with your practice, and you can drill a section with repeated audio.",
        ),
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
          "با دکمه~های بالای صفحه بین سوره~هایی که تفسیرشان آماده است جابه~جا شو. زیر آن~ها نام سوره، تعداد آیه~ها و مکی یا مدنی بودنش آمده است.",
          "Use the buttons at the top to switch between the surahs that have a tafsir ready. Below them you see the surah name, its number of verses and whether it is Meccan or Medinan.",
        ),
      },
      {
        icon: Play,
        title: L("شنیدن سوره", "Listen to the surah"),
        body: L(
          "دکمهٔ پخش کنار نام سوره، کل سوره را برایت پخش می~کند؛ هم~زمان می~توانی خلاصهٔ سوره را بخوانی.",
          "The play button next to the surah name plays the whole surah while you read its summary.",
        ),
      },
      {
        icon: ChevronsUpDown,
        title: L("گروه~های آیه", "Verse groups"),
        body: L(
          "آیه~ها در گروه~های کوتاه آمده~اند. روی هر گروه بزن تا متن عربی و معنی ساده~اش باز یا بسته شود.",
          "Verses come in short groups. Tap a group to open or close its Arabic text and plain-language meaning.",
        ),
      },
      {
        icon: Lightbulb,
        title: L("پیام~های سوره", "Lessons of the surah"),
        body: L(
          "پایین صفحه درس~ها و پیام~های اصلی سوره را می~خوانی. این متن~ها خلاصه~ای ساده بر پایهٔ دیدگاه~های رایج مفسران هستند؛ برای مطالعهٔ دقیق به تفاسیر معتبر مراجعه کن.",
          "At the bottom you read the main lessons of the surah. These texts are simple summaries of common views, so check reliable tafsir books for detailed study.",
        ),
      },
    ],
  },

  {
    id: "listen",
    steps: [
      {
        icon: Headphones,
        title: L("قاری و سوره", "Reciter and surah"),
        body: L(
          "از نوار قاری~ها یکی را انتخاب کن. پایین صفحه فهرست سوره~هاست؛ روی هر سوره بزن تا پخش شود و دوباره بزن تا متوقف شود. با کادر جستجو می~توانی سوره را سریع پیدا کنی.",
          "Pick a reciter from the strip at the top. The list of surahs is further down: tap one to play it and tap again to pause. Use the search box to find a surah quickly.",
        ),
      },
      {
        icon: SkipForward,
        title: L("کنترل پخش", "Player controls"),
        body: L(
          "نوار پیشرفت را لمس کن تا به هر جای سوره بروی. کنارش دکمه~های ده ثانیه جلو و عقب و سورهٔ قبل و بعد قرار دارند.",
          "Tap the progress bar to jump anywhere in the surah. Next to the play button are 10-second back and forward buttons and previous and next surah.",
        ),
      },
      {
        icon: Repeat,
        title: L("تکرار و سورهٔ بعد", "Repeat and next surah"),
        body: L(
          "«تکرار» همین سوره را دوباره پخش می~کند و «سورهٔ بعد» پس از پایان، خودکار سورهٔ بعدی را می~آورد. وقتی چیزی در حال پخش نیست، دکمهٔ «سوره~ای که حفظ می~کنی» سورهٔ فعلی~ات را یک~جا پخش می~کند.",
          "“Repeat” plays the same surah again and “Next surah” continues with the following one when it ends. When nothing is playing, a button lets you play the surah you are memorizing in one tap.",
        ),
      },
      {
        icon: Play,
        title: L("پخش در همهٔ صفحه~ها", "Playback everywhere"),
        body: L(
          "اگر به صفحهٔ دیگری بروی پخش ادامه دارد و یک پخش~کنندهٔ کوچک بالای نوار پایین می~بینی. برای پخش، اینترنت لازم است.",
          "If you go to another page playback continues, and a small player appears above the bottom bar. Playback needs an internet connection.",
        ),
      },
    ],
  },

  {
    id: "library",
    steps: [
      {
        icon: Search,
        title: L("جستجو و فیلتر", "Search and filters"),
        body: L(
          "نام سوره (فارسی یا انگلیسی) یا شمارهٔ آن را جستجو کن. با فیلترها فقط سوره~های «در حال حفظ» یا «حفظ~شده» را ببین.",
          "Search by surah name (Persian or English) or by its number. Use the filters to see only the surahs you are learning or have finished.",
        ),
      },
      {
        icon: Sprout,
        title: L("وضعیت هر سوره", "Status of each surah"),
        body: L(
          "گیاه کوچک کنار هر سوره (دانه، جوانه، برگ~دار یا گل~داده) و نوار زیر نامش، پیشرفت تو را در همان سوره نشان می~دهد.",
          "The little plant beside each surah (seed, sprout, leafy or in flower) and the bar under its name show your progress in that surah.",
        ),
      },
      {
        icon: MousePointerClick,
        title: L("شروع حفظ", "Start memorizing"),
        body: L(
          "روی یک سوره بزن تا همان سوره فعال شود و صفحهٔ حفظ از جایی که مانده~ای باز شود. سوره~هایی که «به~زودی» نوشته شده، هنوز آماده نیستند.",
          "Tap a surah to make it your active one; the Memorize page opens where you left off. Surahs marked “Soon” are not ready yet.",
        ),
      },
    ],
  },

  {
    id: "settings",
    steps: [
      {
        icon: UserRound,
        title: L("حساب و همگام~سازی", "Account and sync"),
        body: L(
          "با ورود به حساب، برنامه و پیشرفت حفظت روی سرور هم ذخیره می~شود و روی دستگاه~های دیگر هم داری~شان. ورود اختیاری است و بدون حساب هم می~توانی از برنامه استفاده کنی.",
          "Sign in to also store your plan and progress on the server and use them on other devices. Signing in is optional; the app works without an account.",
        ),
      },
      {
        icon: Palette,
        title: L("تم و زبان", "Theme and language"),
        body: L(
          "از بین چهار تم رنگی و دو زبان فارسی و انگلیسی هر کدام را بخواهی انتخاب کن؛ فوراً اعمال می~شود.",
          "Choose one of four colour themes and either Persian or English. The change applies right away.",
        ),
      },
      {
        icon: Volume2,
        title: L("صدای کلیک", "Click sounds"),
        body: L(
          "صداهای خیلی کوتاه هنگام لمس گزینه~ها را با این کلید روشن یا خاموش کن.",
          "Turn the very short sounds that play when you tap things on or off with this switch.",
        ),
      },
      {
        icon: CircleHelp,
        title: L("راهنمای برنامه", "App guide"),
        body: L(
          "پایین همین صفحه می~توانی معرفی برنامه را دوباره ببینی، راهنمای صفحه~ها را از نو فعال کنی یا کلاً خاموششان کنی.",
          "At the bottom of this page you can replay the app introduction, bring the page guides back, or switch them off completely.",
        ),
      },
    ],
  },

  {
    id: "exam",
    steps: [
      {
        icon: ClipboardCheck,
        title: L("مرکز تمرین و آزمون", "Practice and exam hub"),
        body: L(
          "از این صفحه به همهٔ ابزارهای تمرین و سنجش می~روی:",
          "From this page you reach all the practice and assessment tools:",
        ),
        items: [
          {
            icon: Target,
            text: L(
              "محدوده، تمرین و آزمون: بازهٔ آیه~ها را انتخاب کن؛ آزمون خودکار تصحیح می~شود",
              "Range, practice and exam: choose the verses; the exam is graded automatically",
            ),
          },
          {
            icon: ListChecks,
            text: L(
              "آزمون مرحله~ای: چهار مرحله؛ قبولی در هر مرحله، مرحلهٔ بعد را باز می~کند",
              "Staged exam: four stages; passing one unlocks the next",
            ),
          },
          {
            icon: Brain,
            text: L(
              "آزمون از حفظ: آیه پنهان است و از حافظه می~خوانی",
              "Recall exam: the verse is hidden and you recite from memory",
            ),
          },
          {
            icon: TriangleAlert,
            text: L(
              "تاریخچهٔ خطا: اشتباهاتت را ببین و مرور کن",
              "Mistake history: see and review your mistakes",
            ),
          },
          {
            icon: BarChart3,
            text: L(
              "گزارش تسلط: تسلط هر آیه و روند هفتگی",
              "Mastery report: per-verse mastery and weekly trend",
            ),
          },
        ],
      },
      {
        icon: Trophy,
        title: L("آزمون~های آماده", "Ready-made exams"),
        body: L(
          "زیر ابزارها، آزمون~های آماده را می~بینی؛ روی هر کدام تعداد پرسش و بهترین نتیجهٔ تو نوشته شده است. بزن تا شروع شود. دکمهٔ بالای صفحه تو را به صفحهٔ حفظ برمی~گرداند.",
          "Below the tools you will find ready-made exams, each showing its number of questions and your best result. Tap one to begin. The button at the top takes you back to Memorize.",
        ),
      },
    ],
  },

  {
    id: "scope",
    steps: [
      {
        icon: Target,
        title: L("محدوده را مشخص کن", "Set your range"),
        body: L(
          "سوره و بازهٔ آیه~ها (از کدام آیه تا کدام آیه) را انتخاب کن، یا کل سوره را بگذار.",
          "Choose the surah and the range of verses (from… to…), or use the whole surah.",
        ),
      },
      {
        icon: ListChecks,
        title: L("محفوظات من", "My memorized verses"),
        body: L(
          "روی آیه~هایی که حفظ داری بزن؛ فقط همین~ها آزمون می~شوند. با «حفظ~شده~های برنامه» آیه~هایی را که برنامه ثبت کرده یک~جا انتخاب می~کنی.",
          "Tap the verses you know; only those will be tested. “Learned in the app” selects everything the app has recorded in one go.",
        ),
      },
      {
        icon: SlidersHorizontal,
        title: L("تنظیم آزمون", "Exam settings"),
        body: L(
          "تعداد پرسش~ها و نمرهٔ قبولی را تعیین کن. پاسخ~ها خودکار تصحیح می~شود و توضیح آزمون همه~چیز را خلاصه می~کند.",
          "Set the number of questions and the pass mark. Answers are graded automatically and the exam description sums everything up.",
        ),
      },
      {
        icon: Play,
        title: L("شروع", "Start"),
        body: L(
          "«تمرین و سپس آزمون» اول آیه~ها را با هم تمرین می~کند و بعد امتحانت می~گیرد. اگر بخواهی، فقط تمرین یا فقط آزمون را هم می~توانی انتخاب کنی.",
          "“Practice, then exam” rehearses the verses first and then tests you. You can also pick practice only or exam only.",
        ),
      },
    ],
  },

  {
    id: "stages",
    steps: [
      {
        icon: ListChecks,
        title: L("چهار مرحله", "Four stages"),
        body: L(
          "مرحله~ها از آسان به سخت~اند: آشنایی، ترتیب آیه~ها، ترکیبی و از حفظ. آزمون برای سوره~ای است که الان حفظ می~کنی و نامش بالای صفحه نوشته شده.",
          "Stages go from easy to hard: warm-up, verse order, mixed and from memory. The exam is for the surah you are currently learning, whose name is shown at the top.",
        ),
      },
      {
        icon: Lock,
        title: L("قفل و قبولی", "Locks and passing"),
        body: L(
          "هر مرحله با رسیدن به نمرهٔ قبولی باز می~شود. مرحلهٔ کم~رنگ با قفل هنوز بسته است و تیک سبز یعنی قبول شده~ای. بهترین نمره~ات هم ثبت می~شود و می~توانی هر وقت خواستی دوباره تلاش کنی.",
          "A stage unlocks when you reach the pass mark. A faded stage with a lock is still closed, and a green tick means you passed. Your best score is saved and you can retry any time.",
        ),
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
          "انتخاب کن آیه~ها چطور پنهان شوند: همه پنهان، یک در میان، فقط کلمهٔ اول یا حرف اول هر کلمه. می~توانی همهٔ آیه~ها یا فقط آیه~های ضعیف را آزمون کنی.",
          "Choose how verses are hidden: everything, every other word, the first word only or the first letter of each word. You can test all verses or only your weak ones.",
        ),
      },
      {
        icon: Brain,
        title: L("از حافظه بخوان", "Recite from memory"),
        body: L(
          "آیه را از حفظ بخوان. اگر گیر کردی روی جای خالی بزن تا کمک بگیری؛ تعداد کمک~ها محدود است.",
          "Recite the verse from memory. If you get stuck, tap a blank for help; the number of helps is limited.",
        ),
      },
      {
        icon: CheckCheck,
        title: L("صادقانه ارزیابی کن", "Grade yourself honestly"),
        body: L(
          "با «نمایش آیه» متن اصلی را ببین و بعد «درست گفتم» یا «اشتباه کردم» را بزن. آیه~های اشتباه در تاریخچهٔ خطا ثبت می~شوند و در پایان فهرست~شان را برای مرور می~بینی.",
          "Use “Show verse” to see the original, then tap “I got it right” or “I got it wrong”. Missed verses go to your mistake history and are listed at the end for review.",
        ),
      },
    ],
  },

  {
    id: "mistakes",
    steps: [
      {
        icon: ListFilter,
        title: L("خطاهایت", "Your mistakes"),
        body: L(
          "هر آیه با تعداد دفعات اشتباه و تاریخ آخرین خطا آمده است. فیلتر بالا بین «نیاز به مرور» و «همه» جابه~جا می~شود.",
          "Each verse shows how many times you missed it and when you last did. The filter at the top switches between “Needs review” and “All”.",
        ),
      },
      {
        icon: CircleCheck,
        title: L("حل شد", "Resolved"),
        body: L(
          "با دو پاسخ درست پشت~سرهم، خطا خودکار حل می~شود. اگر خودت مطمئنی، می~توانی خودت هم «حل شد» را بزنی. برای مرور هر آیه از «تمرین از حفظ» استفاده کن.",
          "Two correct answers in a row resolve a mistake automatically. If you are sure, you can mark it resolved yourself. Use the recall button to practise any verse.",
        ),
      },
      {
        icon: Trash2,
        title: L("تمرین همه و پاک~کردن", "Practise all and clear"),
        body: L(
          "«تمرین همهٔ آیه~های ضعیف» همه را پشت~سرهم می~آورد. «پاک~کردن تاریخچه» هم فهرست خطاها و آمار آیه~ها را پاک می~کند، پس قبل از آن یک بار فکر کن.",
          "“Practice all weak verses” runs through all of them. “Clear history” erases the mistake list and the verse statistics, so think twice before using it.",
        ),
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
          "بالای صفحه درصد تسلط کلی و تعداد آیه~های حفظ~شده را می~بینی. سطح هر آیه از ضعیف تا مسلط است.",
          "At the top you see your overall mastery and how many verses you have learned. Each verse has a level from weak to mastered.",
        ),
      },
      {
        icon: Grid3x3,
        title: L("نقشهٔ تسلط", "Mastery map"),
        body: L(
          "هر خانه یک آیه است و رنگش سطح تسلط را نشان می~دهد. روی هر آیه بزن تا مرورش کنی. زیر آن، ضعیف~ترین آیه~ها برای تمرین بیشتر آمده~اند.",
          "Each cell is a verse and its colour shows your mastery. Tap a verse to review it. Below, your weakest verses are listed for extra practice.",
        ),
      },
      {
        icon: TrendingUp,
        title: L("تحلیل پیشرفت", "Progress analysis"),
        body: L(
          "دقت هفت روز گذشته، مقایسه با هفتهٔ قبل، دقت به تفکیک نوع پرسش و تعداد روزهای تمرین پشت~سرهم را می~بینی. برای ساخته شدن گزارش، اول یک آزمون بده.",
          "You can see your accuracy over the last seven days, the comparison with the week before, accuracy by question type and your practice streak. Take an exam first to build the report.",
        ),
      },
    ],
  },

  {
    id: "session",
    steps: [
      {
        icon: Layers,
        title: L("تمرین آیه به آیه", "Verse by verse practice"),
        body: L(
          "آیه~ها را یکی~یکی با دکمه~های قبلی و بعدی مرور کن. برای دیدن کلمهٔ پنهان روی جای خالی بزن.",
          "Go through the verses one by one with the previous and next buttons. Tap a blank to reveal the hidden word.",
        ),
      },
      {
        icon: SlidersHorizontal,
        title: L("سخت~تر یا آسان~تر", "Harder or easier"),
        body: L(
          "هر وقت خواستی سطح پنهان~کردن را عوض کن: کامل، یک در میان، حرف اول یا پنهان.",
          "Change the hiding level whenever you like: full, every other word, first letter or hidden.",
        ),
      },
      {
        icon: ClipboardCheck,
        title: L("شروع آزمون", "Start the exam"),
        body: L(
          "وقتی آماده شدی «شروع آزمون» را بزن. پاسخ~ها خودکار تصحیح می~شود و نمره و وضعیت هر آیه را می~بینی.",
          "When you are ready, tap “Start exam”. Answers are graded automatically and you see your score and the result for each verse.",
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
          "با ساخت برنامه، مقدار حفظ هر روز و تاریخ پایان مشخص می~شود. اگر هنوز برنامه~ای نداری، دکمهٔ «ساخت برنامه» را بزن.",
          "A plan decides how much you memorize each day and when you finish. If you do not have one yet, tap “Create a plan”.",
        ),
      },
      {
        icon: CircleCheck,
        title: L("برنامهٔ امروز", "Today’s plan"),
        body: L(
          "کارت امروز نشان می~دهد چه آیه~هایی را حفظ و چه بخشی را مرور کنی. «شروع حفظ» تو را به صفحهٔ حفظ می~برد و «انجام شد» آن روز را تیک می~زند.",
          "Today’s card shows what to memorize and what to review. “Start memorizing” opens the Memorize page and “Mark as done” ticks the day off.",
        ),
      },
      {
        icon: LayoutList,
        title: L("تقویم و فهرست", "Calendar and list"),
        body: L(
          "با دکمه~های «تقویم» و «فهرست» نمای برنامه را عوض کن. روز~های حفظ، انجام~شده و امروز رنگ~های جدا دارند.",
          "Switch between the “Calendar” and “List” views. Study days, finished days and today each have their own colour.",
        ),
      },
      {
        icon: FileDown,
        title: L("خروجی و ویرایش", "Export and edit"),
        body: L(
          "برنامه را به صورت PDF یا Excel ذخیره کن یا برای دیگران بفرست. با «ویرایش» می~توانی آن را عوض کنی، ولی تیک روزهای انجام~شده پاک می~شود.",
          "Save the plan as a PDF or Excel file, or send it to others. “Edit” lets you change it, but the ticks on finished days are cleared.",
        ),
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
          "سوره~ها را انتخاب کن؛ می~توانی «سورهٔ فعلی» یا «جزء ۳۰» را یک~جا بزنی. ترتیب حفظ را تعیین کن و اگر خواستی بازهٔ آیه~ها را محدود کن.",
          "Pick the surahs; you can choose “Current surah” or “Juz 30” in one tap. Set the memorization order and, if you want, narrow the range of verses.",
        ),
      },
      {
        icon: SlidersHorizontal,
        title: L("برنامه چطور محاسبه شود؟", "How should it be calculated?"),
        body: L(
          "با «مقدار روزانه»، تعداد آیه در هر جلسه را تو تعیین می~کنی و تاریخ پایان محاسبه می~شود. با «تاریخ هدف»، تاریخ پایان را تو می~گذاری و مقدار هر جلسه محاسبه می~شود.",
          "With “Daily amount” you choose the verses per session and the end date is calculated. With “Target date” you choose the end date and the amount per session is calculated.",
        ),
      },
      {
        icon: CalendarCheck,
        title: L("روزها و مرور", "Days and review"),
        body: L(
          "تاریخ شروع و روزهای هفته~ای که حفظ می~کنی را انتخاب کن؛ بقیه روز استراحت هستند. می~توانی بخش جلسهٔ قبل را هم برای مرور در برنامه بیاوری.",
          "Choose the start date and the weekdays you will study; the rest are rest days. You can also add the previous session’s portion to each session for review.",
        ),
      },
      {
        icon: Eye,
        title: L("پیش~نمایش و ذخیره", "Preview and save"),
        body: L(
          "بخش «پیش~نمایش برنامه» خلاصه~ای از مجموع آیه~ها، تعداد جلسه~ها و تاریخ پایان را نشان می~دهد. اگر درست بود، برنامه را ذخیره کن.",
          "The “Plan preview” section shows the total verses, the number of sessions and the end date. If it looks right, save the plan.",
        ),
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
        items: step.items?.map((item) => ({
          icon: item.icon,
          text: localize(item.text),
        })),
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
  skip: "بستن راهنما",
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
  skip: "Close guide",
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
