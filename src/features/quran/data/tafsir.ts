export interface Localized {
  fa: string;
  en: string;
}

export interface TafsirSection {
  /** First verse covered by this section. */
  from: number;
  /** Last verse covered by this section. */
  to: number;
  title: Localized;
  text: Localized;
}

export interface SurahTafsir {
  surahId: number;
  /** Revelation place as commonly stated. */
  revelation: "meccan" | "medinan";
  intro: Localized;
  sections: readonly TafsirSection[];
  lessons: { fa: readonly string[]; en: readonly string[] };
}

/**
 * Short plain-language summaries written for this app from the widely held views of
 * classical and modern commentators. They are not quotations from any single tafsir.
 * Have a qualified person review them before release.
 */
export const TAFSIR: readonly SurahTafsir[] = [
  {
    surahId: 1,
    revelation: "meccan",
    intro: {
      fa: "سورهٔ حمد نخستین سورهٔ قرآن است و ۷ آیه دارد (بسم‌الله به‌عنوان آیهٔ اول شمرده شده). بنا بر قول مشهور مکی است و در هر نماز خوانده می‌شود. «ام‌الکتاب» و «سبع‌المثانی» از نام‌های دیگر آن است. سوره مثل گفتگوی بنده با پروردگار است: ستایش، اقرار به بندگی و درخواست هدایت.",
      en: "Al-Fatihah is the first surah of the Quran and has 7 verses (the Basmalah is counted as verse 1). By the commonly held view it is Meccan, and it is recited in every prayer. Its other names include “Umm al-Kitab” and “as-Sab‘ al-Mathani”. The surah reads like a conversation between the servant and the Lord: praise, a declaration of servitude, and a request for guidance.",
    },
    sections: [
      {
        from: 1,
        to: 1,
        title: { fa: "آغاز به نام خدا", en: "Beginning in God's name" },
        text: {
          fa: "آغاز هر کار به نام خدا یعنی طلب برکت و یاری از او. «الرحمن» به رحمت گستردهٔ خدا برای همهٔ آفریده‌ها اشاره دارد و «الرحیم» به رحمت ویژه برای مؤمنان؛ این توضیح میان مفسران رایج است.",
          en: "Starting every act in God's name means seeking His blessing and help. “Ar-Rahman” points to His wide mercy that reaches all creation, and “Ar-Rahim” to His special mercy for the believers; this explanation is common among commentators.",
        },
      },
      {
        from: 2,
        to: 3,
        title: { fa: "ستایش پروردگار جهانیان", en: "Praise of the Lord of the worlds" },
        text: {
          fa: "همهٔ ستایش‌ها از آنِ خداست، چون همهٔ نعمت‌ها از اوست. «رب» یعنی مالکی که هر موجود را گام‌به‌گام پرورش می‌دهد و به کمال می‌رساند، و «عالمین» همهٔ جهان‌های هستی را شامل می‌شود. تکرار «الرحمن الرحیم» نشان می‌دهد پروردگاری خدا بر پایهٔ رحمت است.",
          en: "All praise belongs to God because every blessing comes from Him. “Rabb” means the owner who nurtures each being step by step toward its perfection, and “the worlds” covers every realm of existence. Repeating “Ar-Rahman Ar-Rahim” shows that His lordship rests on mercy.",
        },
      },
      {
        from: 4,
        to: 4,
        title: { fa: "فرمانروای روز جزا", en: "Master of the Day of Recompense" },
        text: {
          fa: "«دین» در اینجا به معنای جزا و حساب است. هر دو قرائت «مالک» و «ملک» معنایی نزدیک دارند. این آیه یاد قیامت را کنار رحمت خدا می‌آورد تا امید و احساس مسئولیت هم‌زمان در دل بنده باشد.",
          en: "“Din” here means recompense and reckoning. Both readings (“Mālik”, owner, and “Malik”, king) carry a close meaning. The verse places the remembrance of the Last Day beside God's mercy so that hope and responsibility live together in the heart.",
        },
      },
      {
        from: 5,
        to: 5,
        title: { fa: "پیمان بندگی و یاری‌جویی", en: "The pledge of worship and seeking help" },
        text: {
          fa: "بعد از ستایش، بنده رو به خدا می‌کند و می‌گوید: تنها تو را می‌پرستیم و تنها از تو یاری می‌خواهیم. پیش آمدن «إیاک» بر فعل، معنای انحصار می‌دهد: پرستش و یاری‌خواهی اصیل فقط از آنِ خداست (و این با استفاده از اسباب دنیوی به اذن او منافاتی ندارد).",
          en: "After praise, the servant turns to God and says: You alone we worship and You alone we ask for help. Placing “iyyaka” before the verb gives the sense of exclusivity: true worship and true reliance belong to God alone (which does not contradict using worldly means by His permission).",
        },
      },
      {
        from: 6,
        to: 7,
        title: { fa: "درخواست هدایت", en: "The request for guidance" },
        text: {
          fa: "بزرگ‌ترین نیاز انسان هدایت است. «صراط مستقیم» راه راست و بی‌کجی است که به مقصد می‌رساند، و «اهدنا» یعنی در همین راه ثابت بمانیم و پیش برویم، نه فقط آن را شروع کنیم. آیهٔ ۷ این راه را راه کسانی می‌داند که خدا نعمتشان داده (مانند پیامبران، راستگویان، شهیدان و صالحان؛ اشاره به آیهٔ ۶۹ سورهٔ نساء)، نه راه کسانی که مورد غضب قرار گرفتند و نه گمراهان. مفسران گفته‌اند غضب دربارهٔ ترک آگاهانهٔ حق و گمراهی دربارهٔ بی‌راهه رفتن بدون شناخت راه است.",
          en: "Guidance is the human being's greatest need. The “straight path” is the upright road that reaches the destination, and “ihdina” asks us to stay and advance on it, not merely to begin. Verse 7 describes it as the path of those God has blessed (such as the prophets, the truthful, the martyrs and the righteous, as in verse 4:69), not of those who incurred wrath nor of those who are astray. Commentators note that wrath concerns knowingly abandoning the truth, and straying concerns wandering without knowing the way.",
        },
      },
    ],
    lessons: {
      fa: [
        "پیش از درخواست، ستایش کن؛ دعا با شکرگزاری شروع می‌شود.",
        "رحمت و حساب با هم‌اند: به رحمت خدا امیدوار باش و از جواب‌گویی غافل نشو.",
        "پرستش و یاری‌خواهی را به خدا بسپار.",
        "هدایت را هر روز بخواه؛ ماندن در راه هم به همان اندازهٔ شروع مهم است.",
      ],
      en: [
        "Praise before you ask; supplication begins with gratitude.",
        "Mercy and accountability go together: hope in God's mercy and do not forget the reckoning.",
        "Entrust worship and reliance to God.",
        "Ask for guidance every day; staying on the path matters as much as starting it.",
      ],
    },
  },
  {
    surahId: 78,
    revelation: "meccan",
    intro: {
      fa: "سورهٔ نبأ (شمارهٔ ۷۸) مکی است، ۴۰ آیه دارد و در جزء سی‌ام قرار دارد. نام آن از واژهٔ «النبأ» (خبر بزرگ) در آیهٔ ۲ گرفته شده است. محور سوره رستاخیز است: پرسش منکران دربارهٔ آن، نشانه‌هایی از قدرت خدا در آفرینش که امکان معاد را روشن می‌کند، توصیف روز داوری، سرانجام سرکشان و پایان شادمانهٔ پرهیزگاران.",
      en: "Surah An-Naba (no. 78) is Meccan, has 40 verses and sits in the 30th juz. Its name comes from the word “an-naba’” (the great news) in verse 2. The surah is centered on the Resurrection: the deniers' questions about it, signs of God's power in creation that make resurrection plausible, a description of the Day of Judgment, the end of the transgressors and the happy end of the God-fearing.",
    },
    sections: [
      {
        from: 1,
        to: 5,
        title: { fa: "پرسش از خبر بزرگ", en: "The question about the great news" },
        text: {
          fa: "سوره با پرسشی شروع می‌شود: «دربارهٔ چه چیز از یکدیگر می‌پرسند؟» و پاسخ می‌دهد: «دربارهٔ خبر بزرگ». بیشتر مفسران «النبأ العظیم» را رستاخیز دانسته‌اند؛ برخی قرآن یا رسالت پیامبر را هم یاد کرده‌اند. مردم دربارهٔ آن اختلاف داشتند (انکار یا تردید). آیات ۴ و ۵ هشدار با تأکید است: «به‌زودی خواهند دانست».",
          en: "The surah opens with a question: “About what are they asking one another?” and answers: “About the great news.” Most commentators take “the great news” to be the Resurrection; some also mention the Quran or the Prophet's message. People disagreed about it (denial or doubt). Verses 4 and 5 are an emphatic warning: “They are going to know.”",
        },
      },
      {
        from: 6,
        to: 16,
        title: { fa: "نشانه‌های قدرت خدا در آفرینش", en: "Signs of God's power in creation" },
        text: {
          fa: "این آیات فهرستی از نعمت‌ها و نشانه‌های آفرینش است تا نشان دهد کسی که این جهان را ساخته، بازگرداندن انسان‌ها برایش دشوار نیست: زمین چون بستری آرام (۶)، کوه‌ها همچون میخ‌هایی که زمین را استوار می‌کنند (۷)، آفرینش انسان‌ها به‌صورت جفت (۸)، خواب برای آسایش (۹)، شب مثل پوششی که می‌پوشاند (۱۰)، روز برای تلاش و روزی (۱۱)، هفت آسمان استوار (۱۲)، چراغی فروزان یعنی خورشید (۱۳)، آبی پرریز از ابرها (۱۴) تا دانه و گیاه (۱۵) و باغ‌های درهم‌پیچیده (۱۶) برویاند.",
          en: "These verses list blessings and signs in creation to show that the One who made this world finds it easy to bring people back: the earth as a calm resting place (6), mountains like stakes that steady it (7), people created in pairs (8), sleep for rest (9), night like a covering garment (10), day for livelihood (11), seven strong heavens (12), a blazing lamp, the sun (13), pouring water from the rain clouds (14) to bring forth grain and plants (15) and dense gardens (16).",
        },
      },
      {
        from: 17,
        to: 20,
        title: { fa: "روز داوری", en: "The Day of Decision" },
        text: {
          fa: "«یوم الفصل» روز جدا شدن حق از باطل و داوری میان مردم است و وقتش معین است (۱۷). با دمیدن در صور، مردم گروه‌گروه می‌آیند (۱۸)، آسمان گشوده می‌شود و درهایی پیدا می‌کند (۱۹) و کوه‌ها از جا کنده می‌شوند و مثل سراب می‌گردند (۲۰).",
          en: "“Yawm al-Fasl” is the day when truth is separated from falsehood and people are judged, and its time is fixed (17). When the horn is blown people come forth in crowds (18), the heaven is opened and becomes gateways (19), and the mountains are moved and become like a mirage (20).",
        },
      },
      {
        from: 21,
        to: 30,
        title: { fa: "سرانجام سرکشان", en: "The end of the transgressors" },
        text: {
          fa: "جهنم در کمین است و بازگشتگاه سرکشان (۲۱–۲۲)؛ روزگارانی دراز در آن می‌مانند (۲۳). نه خنکی‌ای می‌چشند و نه نوشیدنی گوارا (۲۴)، جز آب سوزان و چرکاب (۲۵)، پاداشی متناسب با کارشان (۲۶). دلیلش این بود که حساب را باور نداشتند (۲۷) و آیات خدا را سخت دروغ می‌شمردند (۲۸)، در حالی که همه‌چیز نوشته و شمارش شده است (۲۹). پایان این بخش سخنی تکان‌دهنده است: «بچشید؛ جز عذاب بر شما نمی‌افزاییم» (۳۰).",
          en: "Hell lies in wait, a place of return for the transgressors (21–22); they will remain in it for long ages (23). They taste no coolness and no drink (24) except scalding water and foul fluid (25), a recompense that fits their deeds (26). The reason: they did not expect a reckoning (27) and utterly denied God's verses (28), while everything has been counted and recorded (29). The section ends with a stark line: “So taste; We will not increase you except in torment” (30).",
        },
      },
      {
        from: 31,
        to: 36,
        title: { fa: "پاداش پرهیزگاران", en: "The reward of the God-fearing" },
        text: {
          fa: "در برابر، پرهیزگاران به رستگاری می‌رسند (۳۱): باغ‌ها و تاکستان‌ها (۳۲)، همسرانی هم‌سن (۳۳) و جامی لبریز (۳۴). در آنجا نه سخن بیهوده می‌شنوند و نه دروغ (۳۵). همهٔ این‌ها پاداشی از جانب پروردگارت و عطایی کافی است (۳۶).",
          en: "In contrast, the God-fearing attain success (31): gardens and vineyards (32), companions of equal age (33) and an overflowing cup (34). There they hear no idle talk and no lie (35). All this is a reward from your Lord, a sufficient gift (36).",
        },
      },
      {
        from: 37,
        to: 38,
        title: { fa: "ایستادن در برابر خدا", en: "Standing before God" },
        text: {
          fa: "پروردگار آسمان‌ها و زمین و آنچه میان آن‌هاست، رحمان است و هیچ‌کس نمی‌تواند بی‌اجازهٔ او با او سخن بگوید (۳۷). آن روز «روح» و فرشتگان صف‌به‌صف می‌ایستند و کسی سخن نمی‌گوید مگر آنکه رحمان به او اجازه دهد و سخن درست بگوید (۳۸). دربارهٔ «روح» نظرهایی هست: جبرئیل، فرشته‌ای بزرگ، یا آفریده‌ای برتر از فرشتگان.",
          en: "The Lord of the heavens and the earth and what is between them, the Most Merciful: none can address Him without His leave (37). On that day the Spirit and the angels stand in rows, and none speaks except one whom the Most Merciful permits and who says what is right (38). Views differ on “the Spirit”: Gabriel, a great angel, or a creature higher than the angels.",
        },
      },
      {
        from: 39,
        to: 40,
        title: { fa: "هشدار پایانی", en: "The closing warning" },
        text: {
          fa: "آن روز، روز حق است؛ پس هر که بخواهد راهی به سوی پروردگارش برگزیند (۳۹). هشدار پایانی دربارهٔ عذابی نزدیک است، روزی که انسان آنچه را با دستانش پیش فرستاده می‌بیند و کافر آرزو می‌کند: «ای کاش خاک بودم» (۴۰).",
          en: "That is the True Day, so whoever wills may take a way back to his Lord (39). The closing warning speaks of a near punishment, a day when a person sees what his hands sent forward and the disbeliever says, “Oh, I wish I were dust” (40).",
        },
      },
    ],
    lessons: {
      fa: [
        "به آفرینش نگاه کن؛ شب و روز، کوه و باران همه نشانهٔ قدرت و تدبیر خدا هستند.",
        "کارها ثبت می‌شوند؛ امروز را برای فردایی انتخاب کن که با آن روبه‌رو می‌شوی.",
        "ترس و امید با هم: هشدار دربارهٔ سرکشان و بشارت برای پرهیزگاران در یک سوره آمده است.",
        "راه بازگشت به سوی پروردگار باز است؛ هر که بخواهد می‌تواند برگردد.",
      ],
      en: [
        "Look at creation; night and day, mountains and rain are signs of God's power and care.",
        "Deeds are recorded; choose today with the day you will meet in mind.",
        "Fear and hope together: the warning for the transgressors and the good news for the God-fearing share one surah.",
        "The way back to the Lord is open; whoever wills may return.",
      ],
    },
  },
];

export function getTafsir(surahId: number): SurahTafsir | undefined {
  return TAFSIR.find((entry) => entry.surahId === surahId);
}

export const TAFSIR_SURAH_IDS: readonly number[] = TAFSIR.map(
  (entry) => entry.surahId,
);
