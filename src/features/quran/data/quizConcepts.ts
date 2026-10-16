import type { Localized } from "@/features/quran/data/tafsir";

export interface ConceptQuestion {
  id: string;
  surahId: number;
  prompt: Localized;
  correct: Localized;
  wrong: readonly [Localized, Localized, Localized];
  explanation: Localized;
}

/** Meaning questions that mirror the plain-language tafsir pages. */
export const CONCEPT_QUESTIONS: readonly ConceptQuestion[] = [
  {
    id: "naba-theme",
    surahId: 78,
    prompt: {
      fa: "محور اصلی سورهٔ نبأ چیست؟",
      en: "What is the central theme of Surah An-Naba?",
    },
    correct: {
      fa: "رستاخیز و روز داوری",
      en: "The Resurrection and the Day of Judgment",
    },
    wrong: [
      { fa: "احکام ارث و خانواده", en: "Rules of inheritance and family" },
      {
        fa: "داستان پیامبران بنی‌اسرائیل",
        en: "Stories of the prophets of the Children of Israel",
      },
      { fa: "قوانین جنگ و صلح", en: "Laws of war and peace" },
    ],
    explanation: {
      fa: "«النبأ العظیم» در آیات آغازین به رستاخیز اشاره دارد.",
      en: "“The great news” in the opening verses refers to the Resurrection.",
    },
  },
  {
    id: "naba-mountains",
    surahId: 78,
    prompt: {
      fa: "طبق آیهٔ ۷، کوه‌ها چه نقشی دارند؟",
      en: "According to verse 7, what role do the mountains have?",
    },
    correct: {
      fa: "مثل میخ‌هایی زمین را استوار می‌کنند",
      en: "Like stakes, they steady the earth",
    },
    wrong: [
      { fa: "مرز میان کشورها را نشان می‌دهند", en: "They mark the borders between countries" },
      { fa: "جایی برای ساختن خانه‌اند", en: "They are places to build houses" },
      { fa: "باعث بارش باران می‌شوند", en: "They cause the rain to fall" },
    ],
    explanation: {
      fa: "آیهٔ ۷: «و کوه‌ها را میخ‌ها (اوتاد) قرار ندادیم؟»",
      en: "Verse 7: “And the mountains as stakes.”",
    },
  },
  {
    id: "naba-day",
    surahId: 78,
    prompt: {
      fa: "طبق آیهٔ ۱۱، روز برای چه چیزی قرار داده شده است؟",
      en: "According to verse 11, what was the day made for?",
    },
    correct: {
      fa: "برای تلاش و تأمین روزی",
      en: "For livelihood",
    },
    wrong: [
      { fa: "برای استراحت و خواب", en: "For rest and sleep" },
      { fa: "برای پوشاندن مردم مثل لباس", en: "To cover people like clothing" },
      { fa: "برای باریدن باران", en: "For the rain to fall" },
    ],
    explanation: {
      fa: "خواب در آیهٔ ۹ و شب در آیهٔ ۱۰ آمده است؛ روز در آیهٔ ۱۱ برای معاش است.",
      en: "Sleep is in verse 9 and night in verse 10; the day in verse 11 is for livelihood.",
    },
  },
  {
    id: "naba-fasl",
    surahId: 78,
    prompt: {
      fa: "«یوم الفصل» (آیهٔ ۱۷) یعنی چه؟",
      en: "What does “Yawm al-Fasl” (verse 17) mean?",
    },
    correct: {
      fa: "روز جدا شدن حق از باطل و داوری",
      en: "The day truth is separated from falsehood and people are judged",
    },
    wrong: [
      { fa: "روز استراحت و آرامش", en: "A day of rest and calm" },
      { fa: "روز جشن و شادی", en: "A day of festival and joy" },
      { fa: "روز آغاز سال", en: "The first day of the year" },
    ],
    explanation: {
      fa: "«فصل» یعنی جدایی و داوری قاطع.",
      en: "“Fasl” means separation and a decisive judgment.",
    },
  },
  {
    id: "naba-dust",
    surahId: 78,
    prompt: {
      fa: "در آیهٔ ۴۰ کافر چه آرزویی می‌کند؟",
      en: "In verse 40, what does the disbeliever wish?",
    },
    correct: { fa: "ای کاش خاک بودم", en: "“I wish I were dust”" },
    wrong: [
      { fa: "ای کاش فرشته بودم", en: "“I wish I were an angel”" },
      { fa: "ای کاش ثروت بیشتری داشتم", en: "“I wish I had more wealth”" },
      { fa: "ای کاش زودتر به دنیا می‌آمدم", en: "“I wish I had been born earlier”" },
    ],
    explanation: {
      fa: "آیهٔ ۴۰ با آرزوی «یا لیتنی کنت ترابا» پایان می‌یابد.",
      en: "Verse 40 ends with the wish “ya laytani kuntu turaba”.",
    },
  },
  {
    id: "fatiha-rabb",
    surahId: 1,
    prompt: {
      fa: "«رب العالمین» (آیهٔ ۲) یعنی چه؟",
      en: "What does “Rabb al-‘Alamin” (verse 2) mean?",
    },
    correct: {
      fa: "پروردگار و پرورش‌دهندهٔ همهٔ جهان‌ها",
      en: "The Lord and nurturer of all the worlds",
    },
    wrong: [
      { fa: "پادشاه فقط یک سرزمین", en: "The king of only one land" },
      { fa: "نام یکی از فرشتگان", en: "The name of one of the angels" },
      { fa: "نگهبان زمین", en: "The guardian of the earth" },
    ],
    explanation: {
      fa: "«رب» مالک پرورش‌دهنده است و «عالمین» همهٔ جهان‌ها را شامل می‌شود.",
      en: "“Rabb” is the nurturing owner and “al-‘Alamin” covers all the worlds.",
    },
  },
  {
    id: "fatiha-day",
    surahId: 1,
    prompt: {
      fa: "«مالک یوم الدین» (آیهٔ ۴) به کدام روز اشاره دارد؟",
      en: "Which day does “Malik yawm ad-din” (verse 4) refer to?",
    },
    correct: { fa: "روز جزا و رستاخیز", en: "The Day of Recompense and Resurrection" },
    wrong: [
      { fa: "روز عید فطر", en: "The day of Eid al-Fitr" },
      { fa: "روز جمعه", en: "Friday" },
      { fa: "روز آغاز سال", en: "The first day of the year" },
    ],
    explanation: {
      fa: "«دین» در این آیه به معنای جزا و حساب است.",
      en: "“Din” in this verse means recompense and reckoning.",
    },
  },
  {
    id: "fatiha-worship",
    surahId: 1,
    prompt: {
      fa: "در آیهٔ ۵ بنده به خدا چه می‌گوید؟",
      en: "What does the servant say to God in verse 5?",
    },
    correct: {
      fa: "تنها تو را می‌پرستیم و تنها از تو یاری می‌خواهیم",
      en: "You alone we worship and You alone we ask for help",
    },
    wrong: [
      { fa: "تو را می‌ستاییم و از گناهانمان توبه می‌کنیم", en: "We praise You and repent of our sins" },
      { fa: "به تو و فرشتگانت پناه می‌بریم", en: "We take refuge in You and Your angels" },
      { fa: "ما را بر دشمنانمان پیروز کن", en: "Grant us victory over our enemies" },
    ],
    explanation: {
      fa: "مقدم شدن «إیاک» معنای انحصار می‌دهد.",
      en: "Putting “iyyaka” first gives the sense of exclusivity.",
    },
  },
  {
    id: "fatiha-guidance",
    surahId: 1,
    prompt: {
      fa: "درخواست اصلی در آیهٔ ۶ چیست؟",
      en: "What is the main request in verse 6?",
    },
    correct: { fa: "هدایت به راه راست", en: "Guidance to the straight path" },
    wrong: [
      { fa: "ثروت فراوان", en: "Abundant wealth" },
      { fa: "عمر طولانی", en: "A long life" },
      { fa: "پیروزی بر دشمنان", en: "Victory over enemies" },
    ],
    explanation: {
      fa: "«اهدنا الصراط المستقیم» یعنی ما را به راه راست هدایت کن و در آن ثابت بدار.",
      en: "“Ihdina as-sirat al-mustaqim” asks to be guided to, and kept firm on, the straight path.",
    },
  },
];

export function conceptQuestionsFor(surahId: number): ConceptQuestion[] {
  return CONCEPT_QUESTIONS.filter((question) => question.surahId === surahId);
}
