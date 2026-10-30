import type { ConceptQuestion } from "@/features/quran/data/quizConcepts";

/**
 * Meaning questions for the Juz 30 surahs 79-114 (An-Naba, 78, lives in quizConcepts.ts).
 * One source feeds both the in-surah quiz (fa + en) and the per-surah tafsir exam (fa).
 * Each item is based on what the verses themselves say. Have a qualified person review before release.
 *
 * Item = [key, prompt, correct, [wrong x3], explanation], every text is [fa, en].
 */
type P = readonly [fa: string, en: string];
type Item = readonly [
  key: string,
  prompt: P,
  correct: P,
  wrong: readonly [P, P, P],
  explanation: P,
];

const BANK: Readonly<Record<number, readonly Item[]>> = {
  79: [
    [
      "oath",
      ["سورهٔ نازعات با سوگند به چه کسانی آغاز می‌شود؟", "Whom does Surah An-Nazi'at swear by in its opening?"],
      ["گروه‌هایی که فرمان خدا را اجرا می‌کنند (به قول مشهور، فرشتگان)", "Groups that carry out God's command (the angels, by the common view)"],
      [
        ["پادشاهان زمین", "The kings of the earth"],
        ["کوه‌ها و دریاها", "The mountains and the seas"],
        ["پیامبران بنی‌اسرائیل", "The prophets of the Children of Israel"],
      ],
      ["آیه‌های ۱ تا ۵ با سوگندهایی به «نازعات»، «ناشطات» و «سابحات» آغاز می‌شود.", "Verses 1-5 open with oaths by the “nazi'at”, “nashitat” and “sabihat”."],
    ],
    [
      "pharaoh",
      ["فرعون در این سوره چه ادعایی کرد؟", "What did Pharaoh claim in this surah?"],
      ["من پروردگار بزرگ‌تر شما هستم", "“I am your most exalted lord”"],
      [
        ["من فرستادهٔ خدا هستم", "“I am a messenger of God”"],
        ["من پادشاه همهٔ جهانیانم و نیازی به خدا نیست", "“I am king of all worlds and need no god”"],
        ["من فرزند خدا هستم", "“I am the son of God”"],
      ],
      ["آیهٔ ۲۴: «أَنَا رَبُّكُمُ الْأَعْلَىٰ»", "Verse 24: “I am your most exalted lord.”"],
    ],
    [
      "hour",
      ["مردم در این سوره دربارهٔ چه چیزی از پیامبر می‌پرسیدند؟", "What did people ask the Prophet about in this surah?"],
      ["زمان فرارسیدن قیامت", "When the Hour (the Resurrection) would come"],
      [
        ["شمار ستارگان", "The number of the stars"],
        ["زمان آمدن باران", "When the rain would come"],
        ["نام فرشتگان", "The names of the angels"],
      ],
      ["آیهٔ ۴۲: «يَسْأَلُونَكَ عَنِ السَّاعَةِ أَيَّانَ مُرْسَاهَا»", "Verse 42: “They ask you about the Hour: when will it arrive?”"],
    ],
    [
      "fear",
      ["سرانجام کسی که از ایستادن در برابر پروردگارش ترسید و نفس را از هوس بازداشت چیست؟", "What is the end of one who feared standing before his Lord and restrained the self from desire?"],
      ["بهشت جایگاه اوست", "Paradise is his refuge"],
      [
        ["دنیا برای او آسان می‌شود", "The world becomes easy for him"],
        ["او همیشه ثروتمند می‌ماند", "He will always stay rich"],
        ["حسابی بر او نیست", "There is no reckoning for him"],
      ],
      ["آیه‌های ۴۰ و ۴۱: «فَإِنَّ الْجَنَّةَ هِيَ الْمَأْوَىٰ»", "Verses 40-41: “Paradise will be the refuge.”"],
    ],
  ],
  80: [
    [
      "blind",
      ["مرد نابینا در آغاز سورهٔ عبس برای چه آمده بود؟", "Why had the blind man in the opening of Surah 'Abasa come?"],
      ["برای یادگیری و پاک‌شدن (تزکیه)", "To learn and to be purified"],
      [
        ["برای درخواست کمک مالی", "To ask for money"],
        ["برای دعوت به جنگ", "To call for war"],
        ["برای پرسیدن راه شهر", "To ask the way to the city"],
      ],
      ["آیهٔ ۳: «وَمَا يُدْرِيكَ لَعَلَّهُ يَزَّكَّىٰ»", "Verse 3: “What would make you know, perhaps he might be purified?”"],
    ],
    [
      "food",
      ["در این سوره انسان برای اندیشیدن در نعمت‌های خدا به چه چیزی نگاه کند؟", "What is man told to look at in this surah to reflect on God's blessings?"],
      ["غذای خود", "His food"],
      [
        ["شمشیر خود", "His sword"],
        ["خانهٔ خود", "His house"],
        ["لباس خود", "His clothes"],
      ],
      ["آیهٔ ۲۴: «فَلْيَنظُرِ الْإِنسَانُ إِلَىٰ طَعَامِهِ»", "Verse 24: “Let man look at his food.”"],
    ],
    [
      "flee",
      ["در روز قیامت (آیه‌های ۳۴ تا ۳۷) حال انسان چگونه است؟", "What is man's state on the Day (verses 34-37)?"],
      ["از برادر و مادر و پدر و همسر و فرزندانش می‌گریزد و هر کس گرفتار کار خود است", "He flees from his brother, mother, father, spouse and children; each is busy with his own affair"],
      [
        ["همه با خانواده‌شان کنار هم می‌مانند", "Everyone stays together with their families"],
        ["همه در خواب‌اند", "Everyone is asleep"],
        ["همه برای تجارت جمع می‌شوند", "Everyone gathers for trade"],
      ],
      ["آیهٔ ۳۷: «لِكُلِّ امْرِئٍ مِّنْهُمْ يَوْمَئِذٍ شَأْنٌ يُغْنِيهِ»", "Verse 37: “For every person that Day is a matter enough to occupy him.”"],
    ],
    [
      "faces",
      ["چهرهٔ نیکوکاران در آن روز چگونه توصیف شده است؟", "How are the faces of the righteous described on that Day?"],
      ["روشن، خندان و شادمان", "Bright, laughing and joyful"],
      [
        ["گرفته و غمگین", "Gloomy and sad"],
        ["پوشیده از خاک", "Covered with dust"],
        ["زرد و ترسان", "Pale and afraid"],
      ],
      ["آیه‌های ۳۸ و ۳۹؛ چهرهٔ دیگران را غبار و تاریکی می‌پوشاند.", "Verses 38-39; the faces of the others are covered with dust and darkness."],
    ],
  ],
  81: [
    [
      "sun",
      ["سورهٔ تکویر با چه رویدادی آغاز می‌شود؟", "With which event does Surah At-Takwir begin?"],
      ["درهم‌پیچیده‌شدن خورشید", "The sun being wrapped up"],
      [
        ["بارش باران از آسمان", "Rain falling from the sky"],
        ["بالا آمدن آب دریاها بر شهرها", "The seas flooding the cities"],
        ["ظاهرشدن ماه کامل", "The full moon appearing"],
      ],
      ["آیهٔ ۱: «إِذَا الشَّمْسُ كُوِّرَتْ»", "Verse 1: “When the sun is wrapped up.”"],
    ],
    [
      "girl",
      ["از دختر زنده‌به‌گورشده در آن روز چه پرسیده می‌شود؟", "What is the girl who was buried alive asked on that Day?"],
      ["به کدام گناه کشته شد؟", "For what sin was she killed?"],
      [
        ["چرا از خانه بیرون رفتی؟", "Why did you leave the house?"],
        ["چرا نماز نخواندی؟", "Why did you not pray?"],
        ["چرا دروغ گفتی؟", "Why did you lie?"],
      ],
      ["آیه‌های ۸ و ۹: «وَإِذَا الْمَوْءُودَةُ سُئِلَتْ ۝ بِأَيِّ ذَنبٍ قُتِلَتْ»", "Verses 8-9: “When the girl buried alive is asked: for what sin was she killed?”"],
    ],
    [
      "messenger",
      ["طبق آیه‌های ۱۹ تا ۲۱، قرآن گفتار چه کسی است؟", "According to verses 19-21, whose word is the Quran?"],
      ["فرستاده‌ای بزرگوار و امین (فرشتهٔ وحی)", "An honored and trustworthy messenger (the angel of revelation)"],
      [
        ["یک شاعر", "A poet"],
        ["یک کاهن", "A soothsayer"],
        ["یک شیطان", "A devil"],
      ],
      ["آیهٔ ۱۹: «إِنَّهُ لَقَوْلُ رَسُولٍ كَرِيمٍ»", "Verse 19: “Indeed, it is the word of an honored messenger.”"],
    ],
    [
      "companion",
      ["آیهٔ ۲۲ دربارهٔ «همنشین شما» (پیامبر) چه می‌گوید؟", "What does verse 22 say about “your companion” (the Prophet)?"],
      ["او دیوانه نیست", "He is not mad"],
      [
        ["او شاعر است", "He is a poet"],
        ["او ثروتمند است", "He is wealthy"],
        ["او فرشته است", "He is an angel"],
      ],
      ["آیهٔ ۲۲: «وَمَا صَاحِبُكُم بِمَجْنُونٍ»", "Verse 22: “Your companion is not mad.”"],
    ],
  ],
  82: [
    [
      "sky",
      ["سورهٔ انفطار با چه رویدادی آغاز می‌شود؟", "With which event does Surah Al-Infitar begin?"],
      ["شکافته‌شدن آسمان", "The sky being cleft apart"],
      [
        ["لرزیدن کوه‌ها", "The mountains shaking"],
        ["خشک‌شدن چشمه‌ها", "The springs drying up"],
        ["فرو رفتن خورشید در دریا", "The sun sinking into the sea"],
      ],
      ["آیهٔ ۱: «إِذَا السَّمَاءُ انفَطَرَتْ»", "Verse 1: “When the sky is cleft apart.”"],
    ],
    [
      "deceived",
      ["آیهٔ ۶ از انسان چه می‌پرسد؟", "What does verse 6 ask man?"],
      ["چه چیزی تو را دربارهٔ پروردگار کریمت فریفته است؟", "What has deceived you concerning your generous Lord?"],
      [
        ["چرا از مردم دوری کردی؟", "Why did you keep away from people?"],
        ["چرا مال جمع نکردی؟", "Why did you not gather wealth?"],
        ["چرا به سفر نرفتی؟", "Why did you not travel?"],
      ],
      ["آیهٔ ۶: «مَا غَرَّكَ بِرَبِّكَ الْكَرِيمِ»", "Verse 6: “What has deceived you concerning your Lord, the Generous?”"],
    ],
    [
      "recorders",
      ["طبق آیه‌های ۱۰ تا ۱۲، چه کسانی بر انسان نگهبانند؟", "According to verses 10-12, who are watching over man?"],
      ["فرشتگان بزرگواری که کارهایش را می‌نویسند", "Honored angels who record what he does"],
      [
        ["جنیان", "The jinn"],
        ["پیامبران", "The prophets"],
        ["همسایگان", "His neighbours"],
      ],
      ["«كِرَامًا كَاتِبِينَ ۝ يَعْلَمُونَ مَا تَفْعَلُونَ»", "“Noble recorders; they know what you do.”"],
    ],
    [
      "command",
      ["پایان سوره دربارهٔ فرمان در روز قیامت چه می‌گوید؟", "What does the end of the surah say about command on the Day?"],
      ["فرمان در آن روز از آنِ خداست", "The command that Day belongs to God"],
      [
        ["فرمان در دست فرشتگان است", "The command is in the hands of the angels"],
        ["فرمان در دست پیامبران است", "The command is in the hands of the prophets"],
        ["هر کس برای خودش فرمان می‌دهد", "Everyone commands for himself"],
      ],
      ["آیهٔ ۱۹: «وَالْأَمْرُ يَوْمَئِذٍ لِّلَّهِ»", "Verse 19: “And the command that Day is God's.”"],
    ],
  ],
  83: [
    [
      "defrauders",
      ["«وَيْلٌ لِّلْمُطَفِّفِينَ» دربارهٔ چه کسانی است؟", "Who are “the defrauders” (al-mutaffifin) woe is promised to?"],
      ["کم‌فروشان که هنگام گرفتن کامل می‌گیرند و هنگام دادن کم می‌دهند", "Those who take in full but give less when measuring for others"],
      [
        ["کسانی که از زکات می‌گریزند", "Those who avoid zakat"],
        ["کسانی که دروغ می‌گویند", "Those who lie"],
        ["کسانی که سفر نمی‌کنند", "Those who do not travel"],
      ],
      ["آیه‌های ۱ تا ۳ این رفتار را نکوهش می‌کند.", "Verses 1-3 condemn this behaviour."],
    ],
    [
      "sijjin",
      ["نامهٔ عمل بدکاران در کجاست؟", "Where is the record of the wicked?"],
      ["در سِجّین", "In Sijjin"],
      [
        ["در علّیّین", "In 'Illiyyin"],
        ["در لوح محفوظ", "In the Preserved Tablet"],
        ["در دست خودشان در دنیا", "In their own hands in this world"],
      ],
      ["آیهٔ ۷؛ نامهٔ نیکان در «علّیّین» است (آیهٔ ۱۸).", "Verse 7; the record of the righteous is in 'Illiyyin (verse 18)."],
    ],
    [
      "laugh",
      ["مجرمان در دنیا با مؤمنان چه می‌کردند؟", "What did the criminals do to the believers in the world?"],
      ["به آنان می‌خندیدند و با چشمک به هم اشاره می‌کردند", "They laughed at them and winked at one another"],
      [
        ["آنان را کمک می‌کردند", "They helped them"],
        ["از آنان می‌ترسیدند", "They feared them"],
        ["با آنان سفر می‌کردند", "They travelled with them"],
      ],
      ["آیه‌های ۲۹ و ۳۰", "Verses 29-30"],
    ],
    [
      "musk",
      ["مهر نوشیدنیِ بهشتیان چیست؟", "What is the seal of the drink of the people of Paradise?"],
      ["مُشک", "Musk"],
      [
        ["نقره", "Silver"],
        ["عسل", "Honey"],
        ["مروارید", "Pearl"],
      ],
      ["آیهٔ ۲۶: «خِتَامُهُ مِسْكٌ»", "Verse 26: “Its seal is musk.”"],
    ],
  ],
  84: [
    [
      "split",
      ["سورهٔ انشقاق با چه رویدادی آغاز می‌شود؟", "With which event does Surah Al-Inshiqaq begin?"],
      ["شکافته‌شدن آسمان", "The sky splitting open"],
      [
        ["فرو ریختن شهرها", "Cities collapsing"],
        ["خاموش‌شدن ماه", "The moon going out"],
        ["خشک‌شدن دریا", "The sea drying up"],
      ],
      ["آیهٔ ۱: «إِذَا السَّمَاءُ انشَقَّتْ»", "Verse 1: “When the sky splits open.”"],
    ],
    [
      "toil",
      ["آیهٔ ۶ دربارهٔ انسان چه می‌گوید؟", "What does verse 6 say about man?"],
      ["او با تلاش و رنج به سوی پروردگارش می‌رود و او را ملاقات خواهد کرد", "He is striving hard toward his Lord and will meet Him"],
      [
        ["او هرگز مرگ را نمی‌بیند", "He will never see death"],
        ["او فقط برای دنیا آفریده شده است", "He was created only for this world"],
        ["او بدون حساب رها می‌شود", "He is left without reckoning"],
      ],
      ["آیهٔ ۶: «إِنَّكَ كَادِحٌ إِلَىٰ رَبِّكَ كَدْحًا فَمُلَاقِيهِ»", "Verse 6: “You are laboring toward your Lord with great exertion, and you will meet Him.”"],
    ],
    [
      "right",
      ["کسی که نامهٔ عملش به دست راستش داده شود، حسابش چگونه است؟", "How is the reckoning of one given his record in his right hand?"],
      ["حسابی آسان", "An easy reckoning"],
      [
        ["حسابی سخت و طولانی", "A hard and long reckoning"],
        ["بدون هیچ حسابی", "No reckoning at all"],
        ["حساب را فرشتگان می‌دهند", "The angels give the account for him"],
      ],
      ["آیه‌های ۷ و ۸: «فَسَوْفَ يُحَاسَبُ حِسَابًا يَسِيرًا»", "Verses 7-8: “He will be reckoned with an easy reckoning.”"],
    ],
    [
      "stages",
      ["در آیهٔ ۱۹ به چه چیزی اشاره شده است؟", "What does verse 19 point to?"],
      ["انسان مرحله‌ای پس از مرحله‌ای را پشت سر می‌گذارد", "Man will pass from stage to stage"],
      [
        ["انسان همیشه در یک حال می‌ماند", "Man stays in one state forever"],
        ["ستارگان یکی‌یکی می‌افتند", "The stars fall one by one"],
        ["کوه‌ها جابه‌جا می‌شوند", "The mountains move place"],
      ],
      ["آیهٔ ۱۹: «لَتَرْكَبُنَّ طَبَقًا عَن طَبَقٍ»", "Verse 19: “You will surely ride from stage to stage.”"],
    ],
  ],
  85: [
    [
      "oath",
      ["سورهٔ بروج با سوگند به چه چیزی آغاز می‌شود؟", "By what does Surah Al-Buruj begin with an oath?"],
      ["آسمانِ دارای برج‌ها", "The sky with great constellations"],
      [
        ["زمین و کوه‌ها", "The earth and mountains"],
        ["انجیر و زیتون", "The fig and the olive"],
        ["شب و روز", "The night and the day"],
      ],
      ["آیهٔ ۱: «وَالسَّمَاءِ ذَاتِ الْبُرُوجِ»", "Verse 1: “By the sky containing great stars.”"],
    ],
    [
      "ukhdud",
      ["«اصحاب الاُخدود» چه کسانی بودند؟", "Who were “the companions of the ditch” (Ashab al-Ukhdud)?"],
      ["کسانی که مؤمنان را در گودالی پر از آتش انداختند", "Those who threw believers into a ditch of fire"],
      [
        ["مؤمنانی که چاه کندند", "Believers who dug a well"],
        ["قومی که کشتی ساختند", "A people who built a ship"],
        ["نگهبانان کعبه", "The guardians of the Kaaba"],
      ],
      ["آیه‌های ۴ تا ۷", "Verses 4-7"],
    ],
    [
      "reason",
      ["آن ستمگران چرا مؤمنان را شکنجه می‌کردند؟", "Why did those oppressors torture the believers?"],
      ["فقط چون به خدای پیروزمند و ستوده ایمان آورده بودند", "Only because they believed in God, the Mighty, the Praiseworthy"],
      [
        ["چون مالی از آنان دزدیده بودند", "Because they had stolen from them"],
        ["چون در جنگ شرکت نکرده بودند", "Because they had not joined a war"],
        ["چون از مالیات فرار کرده بودند", "Because they had avoided taxes"],
      ],
      ["آیهٔ ۸: «إِلَّا أَن يُؤْمِنُوا بِاللَّهِ الْعَزِيزِ الْحَمِيدِ»", "Verse 8: “Except that they believed in God, the Exalted, the Praiseworthy.”"],
    ],
    [
      "tablet",
      ["طبق پایان سوره، قرآن مجید در کجا نگهداری می‌شود؟", "According to the end of the surah, where is the glorious Quran kept?"],
      ["در لوح محفوظ", "In a Preserved Tablet"],
      [
        ["در کعبه", "In the Kaaba"],
        ["در دست فرشتگان زمین", "In the hands of angels on earth"],
        ["در کوه حرا", "On Mount Hira"],
      ],
      ["آیه‌های ۲۱ و ۲۲: «فِي لَوْحٍ مَّحْفُوظٍ»", "Verses 21-22: “In a Preserved Tablet.”"],
    ],
  ],
  86: [
    [
      "tariq",
      ["«طارق» در این سوره به چه معناست؟", "What does “At-Tariq” refer to in this surah?"],
      ["ستارهٔ شب‌تاب که شبانه می‌آید (و می‌کوبد)", "The piercing star that comes by night"],
      [
        ["کوهی در مکه", "A mountain in Mecca"],
        ["نام یکی از فرشتگان", "The name of an angel"],
        ["باد سخت", "A strong wind"],
      ],
      ["آیه‌های ۱ تا ۳: «وَالسَّمَاءِ وَالطَّارِقِ ... النَّجْمُ الثَّاقِبُ»", "Verses 1-3: “By the sky and the night comer ... the piercing star.”"],
    ],
    [
      "water",
      ["طبق آیه‌های ۵ تا ۷، انسان از چه آفریده شده است؟", "According to verses 5-7, what was man created from?"],
      ["از آبی جهنده", "From a gushing fluid"],
      [
        ["از نور", "From light"],
        ["از آتش", "From fire"],
        ["از باد", "From wind"],
      ],
      ["آیهٔ ۶: «خُلِقَ مِن مَّاءٍ دَافِقٍ»", "Verse 6: “He was created from a fluid, ejected.”"],
    ],
    [
      "secrets",
      ["در روزی که رازها آشکار می‌شود، چه چیزی بررسی می‌شود؟", "On the Day when secrets are exposed, what is examined?"],
      ["رازهای نهان دل‌ها", "The hidden secrets"],
      [
        ["فقط ثروت‌ها", "Only wealth"],
        ["فقط نسب‌ها", "Only lineage"],
        ["فقط خانه‌ها", "Only houses"],
      ],
      ["آیهٔ ۹: «يَوْمَ تُبْلَى السَّرَائِرُ»", "Verse 9: “On the Day when secrets are put on trial.”"],
    ],
    [
      "decisive",
      ["آیه‌های ۱۳ و ۱۴ قرآن را چگونه وصف می‌کنند؟", "How do verses 13-14 describe the Quran?"],
      ["سخنی قاطع و جداکننده، نه شوخی", "A decisive word, not amusement"],
      [
        ["سخنی شاعرانه و زیبا", "A poetic, beautiful speech"],
        ["قصه‌ای برای سرگرمی", "A story for entertainment"],
        ["رازی که فقط برای فرشتگان است", "A secret only for angels"],
      ],
      ["«إِنَّهُ لَقَوْلٌ فَصْلٌ ۝ وَمَا هُوَ بِالْهَزْلِ»", "“Indeed, it is a decisive statement, and it is not amusement.”"],
    ],
  ],
  87: [
    [
      "glorify",
      ["نخستین فرمان سورهٔ اعلی چیست؟", "What is the first command of Surah Al-A'la?"],
      ["نام پروردگار بلندمرتبه‌ات را تسبیح کن", "Glorify the name of your Lord, the Most High"],
      [
        ["به مکه سفر کن", "Travel to Mecca"],
        ["روزه بگیر", "Fast"],
        ["با دشمنان بجنگ", "Fight the enemies"],
      ],
      ["آیهٔ ۱: «سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى»", "Verse 1: “Exalt the name of your Lord, the Most High.”"],
    ],
    [
      "recite",
      ["خداوند در آیه‌های ۶ و ۷ به پیامبر چه وعده‌ای می‌دهد؟", "What does God promise the Prophet in verses 6-7?"],
      ["او را می‌خوانَد (به او می‌آموزد) و او فراموش نمی‌کند", "He will make him recite and he will not forget"],
      [
        ["او را پادشاه می‌کند", "He will make him a king"],
        ["او را از مکه دور می‌کند", "He will take him far from Mecca"],
        ["او را بی‌نیاز از وحی می‌کند", "He will make him needless of revelation"],
      ],
      ["آیهٔ ۶: «سَنُقْرِئُكَ فَلَا تَنسَىٰ»", "Verse 6: “We will make you recite, and you will not forget.”"],
    ],
    [
      "purify",
      ["طبق آیهٔ ۱۴، چه کسی رستگار می‌شود؟", "According to verse 14, who will succeed?"],
      ["کسی که خود را پاک کند (تزکیه)", "The one who purifies himself"],
      [
        ["کسی که مال بیشتر دارد", "The one who has more wealth"],
        ["کسی که زودتر بیدار می‌شود", "The one who wakes earlier"],
        ["کسی که سفر بیشتری دارد", "The one who travels more"],
      ],
      ["آیهٔ ۱۴: «قَدْ أَفْلَحَ مَن تَزَكَّىٰ»", "Verse 14: “He has succeeded who purifies himself.”"],
    ],
    [
      "better",
      ["آیه‌های ۱۶ و ۱۷ آخرت را چگونه توصیف می‌کنند؟", "How do verses 16-17 describe the Hereafter?"],
      ["بهتر و ماندگارتر از دنیا", "Better and more lasting than this world"],
      [
        ["کوتاه‌تر از دنیا", "Shorter than this world"],
        ["مثل دنیا", "The same as this world"],
        ["دور از دسترس", "Out of reach"],
      ],
      ["«وَالْآخِرَةُ خَيْرٌ وَأَبْقَىٰ»", "“While the Hereafter is better and more lasting.”"],
    ],
  ],
  88: [
    [
      "ghashiya",
      ["«غاشیه» در آغاز این سوره به چه اشاره دارد؟", "What does “al-Ghashiyah” at the start of this surah refer to?"],
      ["رویداد فراگیر قیامت", "The overwhelming event, the Resurrection"],
      [
        ["یک طوفان در عرب", "A storm in Arabia"],
        ["یک ماه گرفتگی", "An eclipse"],
        ["یک جنگ بزرگ", "A great war"],
      ],
      ["آیهٔ ۱: «هَلْ أَتَاكَ حَدِيثُ الْغَاشِيَةِ»", "Verse 1: “Has there reached you the report of the Overwhelming Event?”"],
    ],
    [
      "camel",
      ["برای اندیشیدن در آفرینش، نخست به کدام جاندار اشاره می‌شود؟", "Which animal is pointed to first for reflection on creation?"],
      ["شتر", "The camel"],
      [
        ["اسب", "The horse"],
        ["پرنده", "The bird"],
        ["ماهی", "The fish"],
      ],
      ["آیهٔ ۱۷: «أَفَلَا يَنظُرُونَ إِلَى الْإِبِلِ كَيْفَ خُلِقَتْ»", "Verse 17: “Do they not look at the camels, how they are created?”"],
    ],
    [
      "reminder",
      ["وظیفهٔ پیامبر در آیه‌های ۲۱ و ۲۲ چیست؟", "What is the Prophet's task in verses 21-22?"],
      ["یادآوری کردن؛ او بر آنان مسلط نیست", "To remind; he is not a controller over them"],
      [
        ["وادارکردن مردم به ایمان با زور", "To force people to believe"],
        ["جنگ با همهٔ مردم", "To fight everyone"],
        ["جمع‌کردن مال", "To collect wealth"],
      ],
      ["«فَذَكِّرْ إِنَّمَا أَنتَ مُذَكِّرٌ ۝ لَّسْتَ عَلَيْهِم بِمُصَيْطِرٍ»", "“So remind; you are only a reminder. You are not over them a controller.”"],
    ],
    [
      "faces",
      ["چهرهٔ بهشتیان در آیه‌های ۸ تا ۱۰ چگونه است؟", "How are the faces of the people of Paradise in verses 8-10?"],
      ["شاداب و از تلاش خود خشنود", "Joyful and pleased with their effort"],
      [
        ["پوشیده از غبار", "Covered with dust"],
        ["خسته و غمگین", "Tired and sad"],
        ["ترسان و گریان", "Afraid and weeping"],
      ],
      ["«وُجُوهٌ يَوْمَئِذٍ نَّاعِمَةٌ ۝ لِّسَعْيِهَا رَاضِيَةٌ»", "“Faces that Day will be joyful, with their effort satisfied.”"],
    ],
  ],
  89: [
    [
      "oath",
      ["سورهٔ فجر با سوگند به چه چیزهایی آغاز می‌شود؟", "By what does Surah Al-Fajr begin with oaths?"],
      ["سپیده‌دم و ده شب", "The dawn and ten nights"],
      [
        ["خورشید و ماه", "The sun and the moon"],
        ["کوه و دریا", "The mountain and the sea"],
        ["انجیر و زیتون", "The fig and the olive"],
      ],
      ["آیه‌های ۱ و ۲: «وَالْفَجْرِ ۝ وَلَيَالٍ عَشْرٍ»", "Verses 1-2: “By the dawn, and by ten nights.”"],
    ],
    [
      "aad",
      ["قوم عاد در این سوره با چه ویژگی‌ای یاد شده‌اند؟", "With which description is the people of 'Ad mentioned in this surah?"],
      ["ارم، دارای ستون‌های بلند", "Iram, of the lofty pillars"],
      [
        ["ساکنان کوه طور", "The dwellers of Mount Tur"],
        ["صاحبان کشتی", "The owners of the ship"],
        ["مردم سبا", "The people of Saba"],
      ],
      ["آیه‌های ۶ و ۷: «إِرَمَ ذَاتِ الْعِمَادِ»", "Verses 6-7: “Iram, [city] of the pillars.”"],
    ],
    [
      "orphan",
      ["در آیه‌های ۱۷ و ۱۸ چه رفتاری نکوهش شده است؟", "Which behaviour is condemned in verses 17-18?"],
      ["گرامی‌نداشتن یتیم و تشویق‌نکردن به غذا دادن به نیازمند", "Not honoring the orphan and not urging the feeding of the poor"],
      [
        ["زیاد خوابیدن", "Sleeping too much"],
        ["سفر در ماه‌های حرام", "Travelling in the sacred months"],
        ["ساختن خانه‌های بزرگ", "Building large houses"],
      ],
      ["«كَلَّا بَل لَّا تُكْرِمُونَ الْيَتِيمَ ۝ وَلَا تَحَاضُّونَ عَلَىٰ طَعَامِ الْمِسْكِينِ»", "“No! But you do not honor the orphan, and you do not encourage feeding the poor.”"],
    ],
    [
      "soul",
      ["پایان سوره با چه ندایی به پایان می‌رسد؟", "With which call does the surah end?"],
      ["ای نفس آرام‌یافته، خشنود و پسندیده به سوی پروردگارت بازگرد", "O reassured soul, return to your Lord, well-pleased and pleasing"],
      [
        ["ای مردم، بجنگید", "O people, fight"],
        ["ای ثروتمندان، بیشتر جمع کنید", "O rich, gather more"],
        ["ای غافلان، بخوابید", "O heedless, sleep"],
      ],
      ["آیه‌های ۲۷ تا ۳۰: «يَا أَيَّتُهَا النَّفْسُ الْمُطْمَئِنَّةُ»", "Verses 27-30: “O reassured soul.”"],
    ],
  ],
  90: [
    [
      "city",
      ["سورهٔ بلد با سوگند به کدام شهر آغاز می‌شود؟", "By which city does Surah Al-Balad begin with an oath?"],
      ["مکه", "Mecca"],
      [
        ["مدینه", "Medina"],
        ["قدس", "Jerusalem"],
        ["بابل", "Babylon"],
      ],
      ["آیهٔ ۱: «لَا أُقْسِمُ بِهَٰذَا الْبَلَدِ»", "Verse 1: “I swear by this city.”"],
    ],
    [
      "hardship",
      ["آیهٔ ۴ دربارهٔ آفرینش انسان چه می‌گوید؟", "What does verse 4 say about man's creation?"],
      ["انسان در رنج و مشقت آفریده شده است", "Man was created in hardship"],
      [
        ["انسان در آسایش کامل آفریده شده است", "Man was created in complete comfort"],
        ["انسان بی‌نیاز آفریده شده است", "Man was created self-sufficient"],
        ["انسان فقط برای خوردن آفریده شده است", "Man was created only to eat"],
      ],
      ["«لَقَدْ خَلَقْنَا الْإِنسَانَ فِي كَبَدٍ»", "“We have certainly created man in hardship.”"],
    ],
    [
      "paths",
      ["«النجدین» در آیهٔ ۱۰ به چه اشاره دارد؟", "What do “the two ways” (an-najdayn) in verse 10 refer to?"],
      ["دو راه خیر و شر", "The two paths of good and evil"],
      [
        ["دو کوه مکه", "The two mountains of Mecca"],
        ["دو رود", "Two rivers"],
        ["دو چشمهٔ آب", "Two springs"],
      ],
      ["«وَهَدَيْنَاهُ النَّجْدَيْنِ»", "“And We showed him the two ways.”"],
    ],
    [
      "steep",
      ["گذرگاه دشوار (عقبه) در آیه‌های ۱۳ تا ۱۶ با چه کارهایی پیموده می‌شود؟", "By which deeds is the steep path (al-'aqabah) in verses 13-16 climbed?"],
      ["آزادکردن بنده و غذادادن به یتیم و نیازمند در روز گرسنگی", "Freeing a slave and feeding an orphan or a needy person on a day of hunger"],
      [
        ["ساختن مسجد و سفر حج", "Building a mosque and going on pilgrimage"],
        ["جنگیدن و غنیمت‌گرفتن", "Fighting and taking spoils"],
        ["روزه گرفتن و بیدارماندن", "Fasting and staying awake"],
      ],
      ["«فَكُّ رَقَبَةٍ ۝ أَوْ إِطْعَامٌ فِي يَوْمٍ ذِي مَسْغَبَةٍ»", "“The freeing of a slave, or feeding on a day of hunger.”"],
    ],
  ],
  91: [
    [
      "oath",
      ["سورهٔ شمس با سوگند به چه چیزی آغاز می‌شود؟", "By what does Surah Ash-Shams begin with an oath?"],
      ["خورشید و گستردگی نور آن", "The sun and its brightness"],
      [
        ["ستارگان و کهکشان", "The stars and galaxies"],
        ["کوه و رود", "The mountain and the river"],
        ["شب و ماه", "The night and moon"],
      ],
      ["آیهٔ ۱: «وَالشَّمْسِ وَضُحَاهَا»", "Verse 1: “By the sun and its brightness.”"],
    ],
    [
      "soul",
      ["طبق آیه‌های ۹ و ۱۰ چه کسی رستگار و چه کسی زیان‌کار است؟", "According to verses 9-10, who succeeds and who fails?"],
      ["رستگار کسی است که نفس را پاک کند؛ زیان‌کار کسی است که آن را آلوده کند", "He succeeds who purifies the soul; he fails who corrupts it"],
      [
        ["رستگار کسی است که مال جمع کند", "He succeeds who gathers wealth"],
        ["رستگار کسی است که بیشتر بخوابد", "He succeeds who sleeps more"],
        ["هیچ‌کس رستگار نمی‌شود", "No one succeeds"],
      ],
      ["«قَدْ أَفْلَحَ مَن زَكَّاهَا ۝ وَقَدْ خَابَ مَن دَسَّاهَا»", "“He has succeeded who purifies it, and he has failed who instills it [with corruption].”"],
    ],
    [
      "inspired",
      ["طبق آیهٔ ۸، خداوند به نفس چه چیزی را الهام کرد؟", "According to verse 8, what did God inspire to the soul?"],
      ["شناخت بدکاری و پرهیزگاری", "Recognition of its wickedness and its righteousness"],
      [
        ["فقط زبان عربی", "Only the Arabic language"],
        ["شناخت ستارگان", "Knowledge of the stars"],
        ["هنر کشاورزی", "The craft of farming"],
      ],
      ["«فَأَلْهَمَهَا فُجُورَهَا وَتَقْوَاهَا»", "“And inspired it [with discernment of] its wickedness and its righteousness.”"],
    ],
    [
      "thamud",
      ["قوم ثمود با ناقهٔ صالح چه کردند؟", "What did the people of Thamud do to Salih's she-camel?"],
      ["او را پی کردند", "They hamstrung her"],
      [
        ["او را به شهر دیگری بردند", "They took her to another city"],
        ["از او نگهداری کردند", "They looked after her"],
        ["او را آزاد کردند", "They set her free"],
      ],
      ["آیهٔ ۱۴: «فَكَذَّبُوهُ فَعَقَرُوهَا»", "Verse 14: “But they denied him and hamstrung her.”"],
    ],
  ],
  92: [
    [
      "oath",
      ["سورهٔ لیل با سوگند به چه چیزهایی آغاز می‌شود؟", "By what does Surah Al-Layl begin with oaths?"],
      ["شب وقتی همه‌چیز را می‌پوشاند و روز وقتی آشکار می‌شود", "The night when it covers and the day when it appears"],
      [
        ["خورشید و ماه", "The sun and the moon"],
        ["کوه و دریا", "The mountain and the sea"],
        ["انجیر و زیتون", "The fig and the olive"],
      ],
      ["آیه‌های ۱ و ۲", "Verses 1-2"],
    ],
    [
      "ease",
      ["کسی که ببخشد و پروا کند و نیکی را باور کند، خداوند چه می‌کند؟", "What does God do for one who gives, is mindful and believes in the best?"],
      ["راه آسانی را برایش آسان می‌کند", "He eases for him the path to ease"],
      [
        ["او را از کار معاف می‌کند", "He exempts him from work"],
        ["او را از مردم جدا می‌کند", "He separates him from people"],
        ["او را به شهر دیگر می‌برد", "He moves him to another city"],
      ],
      ["آیه‌های ۵ تا ۷: «فَسَنُيَسِّرُهُ لِلْيُسْرَىٰ»", "Verses 5-7: “We will ease him toward ease.”"],
    ],
    [
      "stingy",
      ["کسی که بخل ورزد و خود را بی‌نیاز بپندارد و نیکی را دروغ شمارد، چه سرنوشتی دارد؟", "What is the fate of one who is stingy, thinks himself self-sufficient and denies the best?"],
      ["راه دشواری برایش فراهم می‌شود", "The path to hardship is prepared for him"],
      [
        ["ثروتش دو برابر می‌شود", "His wealth is doubled"],
        ["همه او را دوست می‌دارند", "Everyone loves him"],
        ["به او مهلت داده می‌شود تا همیشه", "He is given respite forever"],
      ],
      ["آیه‌های ۸ تا ۱۰: «فَسَنُيَسِّرُهُ لِلْعُسْرَىٰ»", "Verses 8-10: “We will ease him toward hardship.”"],
    ],
    [
      "pious",
      ["«الأتقی» در آیه‌های ۱۷ و ۱۸ چه کسی است؟", "Who is “the most pious” in verses 17-18?"],
      ["کسی که مالش را می‌دهد تا پاک شود", "The one who gives his wealth to purify himself"],
      [
        ["کسی که مال جمع می‌کند", "The one who accumulates wealth"],
        ["کسی که فقط روزه می‌گیرد", "The one who only fasts"],
        ["کسی که از مردم دوری می‌کند", "The one who avoids people"],
      ],
      ["«الَّذِي يُؤْتِي مَالَهُ يَتَزَكَّىٰ»", "“[He] who gives [from] his wealth to purify himself.”"],
    ],
  ],
  93: [
    [
      "oath",
      ["سورهٔ ضحی با سوگند به چه چیزی آغاز می‌شود؟", "By what does Surah Ad-Duha begin with an oath?"],
      ["روز وقت چاشت و شب وقتی آرام می‌گیرد", "The forenoon and the night when it grows still"],
      [
        ["خورشید و ستارگان", "The sun and the stars"],
        ["انجیر و زیتون", "The fig and the olive"],
        ["کوه و دریا", "The mountain and the sea"],
      ],
      ["«وَالضُّحَىٰ ۝ وَاللَّيْلِ إِذَا سَجَىٰ»", "“By the morning brightness, and by the night when it covers with darkness.”"],
    ],
    [
      "not-left",
      ["آیهٔ ۳ به پیامبر چه می‌گوید؟", "What does verse 3 say to the Prophet?"],
      ["پروردگارت تو را رها نکرده و دشمن نداشته است", "Your Lord has not abandoned you, nor detested you"],
      [
        ["پروردگارت تو را به جنگ می‌فرستد", "Your Lord sends you to war"],
        ["پروردگارت تو را ثروتمند می‌کند", "Your Lord makes you wealthy"],
        ["پروردگارت تو را از مردم جدا می‌کند", "Your Lord separates you from people"],
      ],
      ["«مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ»", "“Your Lord has not taken leave of you, nor has He detested [you].”"],
    ],
    [
      "orphan",
      ["آیه‌های ۹ و ۱۰ دربارهٔ یتیم و سائل چه دستوری می‌دهند؟", "What do verses 9-10 command about the orphan and the beggar?"],
      ["یتیم را میازار و سائل را مران", "Do not oppress the orphan and do not repel the one who asks"],
      [
        ["یتیم را از خود دور کن", "Keep the orphan away"],
        ["به سائل چیزی نده", "Give the beggar nothing"],
        ["فقط به خویشان کمک کن", "Help only relatives"],
      ],
      ["«فَأَمَّا الْيَتِيمَ فَلَا تَقْهَرْ ۝ وَأَمَّا السَّائِلَ فَلَا تَنْهَرْ»", "“So as for the orphan, do not oppress; and as for the petitioner, do not repel.”"],
    ],
    [
      "speak",
      ["آیهٔ ۱۱ دربارهٔ نعمت پروردگار چه دستوری می‌دهد؟", "What does verse 11 command about the favour of your Lord?"],
      ["از آن سخن بگو (و آن را بازگو کن)", "Speak of it (proclaim it)"],
      [
        ["آن را پنهان کن", "Hide it"],
        ["آن را فراموش کن", "Forget it"],
        ["آن را بفروش", "Sell it"],
      ],
      ["«وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ»", "“And as for the favor of your Lord, report [it].”"],
    ],
  ],
  94: [
    [
      "chest",
      ["سورهٔ شرح با چه پرسشی آغاز می‌شود؟", "With which question does Surah Ash-Sharh begin?"],
      ["آیا سینه‌ات را برایت گشاده نکردیم؟", "Did We not expand for you your breast?"],
      [
        ["آیا تو را به مدینه نبردیم؟", "Did We not take you to Medina?"],
        ["آیا تو را ثروتمند نکردیم؟", "Did We not make you rich?"],
        ["آیا کوه‌ها را برایت جابه‌جا نکردیم؟", "Did We not move the mountains for you?"],
      ],
      ["آیهٔ ۱: «أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ»", "Verse 1: “Did We not expand for you your breast?”"],
    ],
    [
      "remembrance",
      ["آیهٔ ۴ دربارهٔ نام پیامبر چه می‌گوید؟", "What does verse 4 say about the Prophet's name?"],
      ["یاد و نام او را بلند کردیم", "We raised high for you your remembrance"],
      [
        ["نام او را پنهان کردیم", "We hid his name"],
        ["نام او را عوض کردیم", "We changed his name"],
        ["نام او را فقط در مدینه گذاشتیم", "We kept his name only in Medina"],
      ],
      ["«وَرَفَعْنَا لَكَ ذِكْرَكَ»", "“And We raised high for you your repute.”"],
    ],
    [
      "ease",
      ["پیام آیه‌های ۵ و ۶ چیست؟", "What is the message of verses 5-6?"],
      ["با هر سختی، آسانی همراه است", "With hardship comes ease"],
      [
        ["سختی همیشه می‌ماند", "Hardship always remains"],
        ["آسانی فقط برای ثروتمندان است", "Ease is only for the rich"],
        ["بعد از آسانی همیشه سختی می‌آید", "After ease only hardship comes"],
      ],
      ["«فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا»", "“For indeed, with hardship [will be] ease. Indeed, with hardship [will be] ease.”"],
    ],
    [
      "turn",
      ["آیه‌های ۷ و ۸ پس از پایان هر کار چه فرمان می‌دهند؟", "What do verses 7-8 command after finishing a task?"],
      ["به عبادت و تلاش بپرداز و تنها به سوی پروردگارت میل کن", "Strive on [in worship] and turn your desire only to your Lord"],
      [
        ["برای همیشه استراحت کن", "Rest forever"],
        ["از مردم دوری کن", "Stay away from people"],
        ["مال جمع کن", "Gather wealth"],
      ],
      ["«فَإِذَا فَرَغْتَ فَانصَبْ ۝ وَإِلَىٰ رَبِّكَ فَارْغَب»", "“So when you have finished, then stand up [for worship]. And to your Lord direct [your] longing.”"],
    ],
  ],
  95: [
    [
      "oath",
      ["سورهٔ تین با سوگند به چه چیزی آغاز می‌شود؟", "By what does Surah At-Tin begin with an oath?"],
      ["انجیر و زیتون", "The fig and the olive"],
      [
        ["خرما و انگور", "The date and the grape"],
        ["خورشید و ماه", "The sun and the moon"],
        ["شب و روز", "The night and the day"],
      ],
      ["آیهٔ ۱: «وَالتِّينِ وَالزَّيْتُونِ»", "Verse 1: “By the fig and the olive.”"],
    ],
    [
      "best",
      ["آیهٔ ۴ دربارهٔ آفرینش انسان چه می‌گوید؟", "What does verse 4 say about man's creation?"],
      ["او را در بهترین ساختار آفریدیم", "We created man in the best of stature"],
      [
        ["او را ضعیف‌ترین آفریدیم", "We created him the weakest"],
        ["او را از نور آفریدیم", "We created him from light"],
        ["او را بی‌نیاز آفریدیم", "We created him self-sufficient"],
      ],
      ["«لَقَدْ خَلَقْنَا الْإِنسَانَ فِي أَحْسَنِ تَقْوِيمٍ»", "“We have certainly created man in the best of stature.”"],
    ],
    [
      "except",
      ["چه کسانی از «پست‌ترین پستی» مستثنا هستند؟", "Who is exempted from being reduced to “the lowest of the low”?"],
      ["کسانی که ایمان آورند و کارهای شایسته کنند", "Those who believe and do righteous deeds"],
      [
        ["ثروتمندان", "The wealthy"],
        ["جوانان", "The young"],
        ["ساکنان مکه", "The people of Mecca"],
      ],
      ["آیه‌های ۵ و ۶؛ پاداش آنان پایان‌ناپذیر است.", "Verses 5-6; their reward never ends."],
    ],
    [
      "judge",
      ["آیهٔ پایانی سوره چه می‌پرسد؟", "What does the last verse ask?"],
      ["آیا خدا بهترین داوران نیست؟", "Is not God the most just of judges?"],
      [
        ["آیا مرگ نزدیک نیست؟", "Is death not near?"],
        ["آیا زمین گسترده نیست؟", "Is the earth not vast?"],
        ["آیا آسمان بلند نیست؟", "Is the sky not high?"],
      ],
      ["آیهٔ ۸: «أَلَيْسَ اللَّهُ بِأَحْكَمِ الْحَاكِمِينَ»", "Verse 8: “Is not God the most just of judges?”"],
    ],
  ],
  96: [
    [
      "read",
      ["نخستین آیه‌های سورهٔ علق با چه فرمانی آغاز می‌شود؟", "With which command do the first verses of Surah Al-'Alaq begin?"],
      ["بخوان به نام پروردگارت که آفرید", "Read in the name of your Lord who created"],
      [
        ["بجنگ به نام پروردگارت", "Fight in the name of your Lord"],
        ["برخیز و هشدار بده", "Arise and warn"],
        ["روزه بگیر", "Fast"],
      ],
      ["آیهٔ ۱: «اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ»", "Verse 1: “Recite in the name of your Lord who created.”"],
    ],
    [
      "clot",
      ["طبق آیهٔ ۲، انسان از چه آفریده شد؟", "According to verse 2, what was man created from?"],
      ["از علق (خونِ بسته/آویزان)", "From a clinging clot ('alaq)"],
      [
        ["از سنگ", "From stone"],
        ["از آتش", "From fire"],
        ["از نور", "From light"],
      ],
      ["«خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ»", "“Created man from a clinging substance.”"],
    ],
    [
      "pen",
      ["آیهٔ ۴ خداوند را با چه ویژگی‌ای معرفی می‌کند؟", "With which attribute does verse 4 describe God?"],
      ["او که با قلم آموخت", "He who taught by the pen"],
      [
        ["او که با شمشیر گشود", "He who opened by the sword"],
        ["او که با باران بخشید", "He who gave through the rain"],
        ["او که با کوه نگه داشت", "He who held by the mountain"],
      ],
      ["«الَّذِي عَلَّمَ بِالْقَلَمِ»", "“Who taught by the pen.”"],
    ],
    [
      "self-sufficient",
      ["آیه‌های ۶ و ۷ دربارهٔ انسان چه هشداری می‌دهند؟", "What warning do verses 6-7 give about man?"],
      ["وقتی خود را بی‌نیاز ببیند سرکشی می‌کند", "He transgresses when he sees himself self-sufficient"],
      [
        ["وقتی فقیر شود از خدا دور می‌شود", "He turns away from God when he becomes poor"],
        ["وقتی بخوابد حساب می‌شود", "He is held to account when he sleeps"],
        ["وقتی سفر کند فراموش می‌کند", "He forgets when he travels"],
      ],
      ["«كَلَّا إِنَّ الْإِنسَانَ لَيَطْغَىٰ ۝ أَن رَّآهُ اسْتَغْنَىٰ»", "“No! Indeed, man transgresses when he sees himself self-sufficient.”"],
    ],
  ],
  97: [
    [
      "better",
      ["شب قدر چه ویژگی‌ای دارد؟", "What is special about the Night of Decree?"],
      ["از هزار ماه بهتر است", "It is better than a thousand months"],
      [
        ["از صد روز بهتر است", "It is better than a hundred days"],
        ["با هزار شب برابر است", "It equals a thousand nights"],
        ["فقط یک ساعت است", "It lasts only one hour"],
      ],
      ["آیهٔ ۳: «لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ»", "Verse 3: “The Night of Decree is better than a thousand months.”"],
    ],
    [
      "quran",
      ["در شب قدر چه چیزی نازل شد؟", "What was sent down in the Night of Decree?"],
      ["قرآن", "The Quran"],
      [
        ["تورات", "The Torah"],
        ["انجیل", "The Gospel"],
        ["باران", "The rain"],
      ],
      ["آیهٔ ۱: «إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ»", "Verse 1: “Indeed, We sent it [the Quran] down during the Night of Decree.”"],
    ],
    [
      "angels",
      ["در آن شب چه کسانی فرود می‌آیند؟", "Who descend in that night?"],
      ["فرشتگان و روح، به اذن پروردگارشان", "The angels and the Spirit, by permission of their Lord"],
      [
        ["فقط پیامبران", "Only the prophets"],
        ["جنیان", "The jinn"],
        ["ستارگان", "The stars"],
      ],
      ["آیهٔ ۴: «تَنَزَّلُ الْمَلَائِكَةُ وَالرُّوحُ فِيهَا»", "Verse 4: “The angels and the Spirit descend therein.”"],
    ],
    [
      "peace",
      ["آیهٔ ۵ آن شب را تا چه زمانی «سلام» می‌داند؟", "Until when does verse 5 call that night “peace”?"],
      ["تا طلوع سپیده‌دم", "Until the emergence of dawn"],
      [
        ["تا نیمه‌شب", "Until midnight"],
        ["تا غروب روز بعد", "Until the next sunset"],
        ["تا ظهر", "Until noon"],
      ],
      ["«سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ»", "“Peace it is until the emergence of dawn.”"],
    ],
  ],
  98: [
    [
      "bayyina",
      ["«بیّنه» (دلیل روشن) در آیهٔ ۱ و ۲ چیست؟", "What is “the clear evidence” (al-bayyinah) in verses 1-2?"],
      ["فرستاده‌ای از جانب خدا که صحیفه‌های پاکیزه را می‌خواند", "A messenger from God reciting purified scriptures"],
      [
        ["یک معجزهٔ آسمانی در شب", "A heavenly miracle by night"],
        ["یک پیمان تجاری", "A trade treaty"],
        ["یک کوه نورانی", "A shining mountain"],
      ],
      ["«رَسُولٌ مِّنَ اللَّهِ يَتْلُو صُحُفًا مُّطَهَّرَةً»", "“A Messenger from God, reciting purified scriptures.”"],
    ],
    [
      "sincere",
      ["آیهٔ ۵ مردم را به چه چیزی فرمان داده است؟", "What does verse 5 say people were commanded?"],
      ["خدا را با اخلاص و یکتاپرستی بپرستند، نماز بخوانند و زکات بدهند", "To worship God alone sincerely, establish prayer and give zakat"],
      [
        ["بتان را بزرگ بدارند", "To honor idols"],
        ["فقط روزه بگیرند", "To only fast"],
        ["از مردم دوری کنند", "To keep away from people"],
      ],
      ["«وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ حُنَفَاءَ»", "“They were not commanded except to worship God, sincere to Him in religion, inclining to truth.”"],
    ],
    [
      "best",
      ["مؤمنانِ نیکوکار در آیهٔ ۷ چگونه توصیف شده‌اند؟", "How are the righteous believers described in verse 7?"],
      ["بهترین آفریدگان", "The best of creatures"],
      [
        ["ثروتمندترین مردم", "The richest of people"],
        ["قوی‌ترین مردم", "The strongest of people"],
        ["برگزیدگان قریش", "The chosen of Quraysh"],
      ],
      ["«أُولَٰئِكَ هُمْ خَيْرُ الْبَرِيَّةِ»", "“Those are the best of creatures.”"],
    ],
    [
      "reward",
      ["پاداش آنان در آیهٔ ۸ چیست؟", "What is their reward in verse 8?"],
      ["باغ‌های جاویدان که خدا از آنان خشنود و آنان از او خشنودند", "Gardens of Eden, God pleased with them and they with Him"],
      [
        ["مال فراوان در دنیا", "Much wealth in this world"],
        ["عمر دراز", "A long life"],
        ["فرمانروایی بر زمین", "Rule over the earth"],
      ],
      ["«رَّضِيَ اللَّهُ عَنْهُمْ وَرَضُوا عَنْهُ»", "“God is pleased with them and they with Him.”"],
    ],
  ],
  99: [
    [
      "quake",
      ["سورهٔ زلزال با چه رویدادی آغاز می‌شود؟", "With which event does Surah Az-Zalzalah begin?"],
      ["لرزیدن سخت زمین", "The earth being shaken with its final quake"],
      [
        ["فرو رفتن خورشید", "The sun setting"],
        ["جاری‌شدن رودها", "Rivers flowing"],
        ["شکستن ماه", "The moon splitting"],
      ],
      ["آیهٔ ۱: «إِذَا زُلْزِلَتِ الْأَرْضُ زِلْزَالَهَا»", "Verse 1: “When the earth is shaken with its [final] earthquake.”"],
    ],
    [
      "burdens",
      ["زمین در آیهٔ ۲ چه چیزی را بیرون می‌ریزد؟", "What does the earth bring forth in verse 2?"],
      ["بارهای سنگین خود", "Its burdens"],
      [
        ["آب‌هایش", "Its waters"],
        ["کوه‌هایش", "Its mountains"],
        ["گیاهانش", "Its plants"],
      ],
      ["«وَأَخْرَجَتِ الْأَرْضُ أَثْقَالَهَا»", "“And the earth discharges its burdens.”"],
    ],
    [
      "news",
      ["طبق آیه‌های ۴ و ۵، زمین در آن روز چه می‌کند؟", "According to verses 4-5, what does the earth do on that Day?"],
      ["خبرهای خود را بازگو می‌کند", "It reports its news"],
      [
        ["سکوت می‌کند", "It stays silent"],
        ["آب می‌شود", "It melts"],
        ["برای همیشه می‌ایستد", "It stands still forever"],
      ],
      ["«يَوْمَئِذٍ تُحَدِّثُ أَخْبَارَهَا»", "“That Day, it will report its news.”"],
    ],
    [
      "atom",
      ["آیه‌های ۷ و ۸ دربارهٔ اعمال چه می‌گویند؟", "What do verses 7-8 say about deeds?"],
      ["هر کس به اندازهٔ ذره‌ای خیر یا شر کند آن را می‌بیند", "Whoever does an atom's weight of good or evil will see it"],
      [
        ["فقط کارهای بزرگ دیده می‌شود", "Only great deeds are seen"],
        ["کارهای کوچک نادیده گرفته می‌شود", "Small deeds are ignored"],
        ["فقط خیر شمرده می‌شود", "Only good is counted"],
      ],
      ["«فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ»", "“So whoever does an atom's weight of good will see it.”"],
    ],
  ],
  100: [
    [
      "oath",
      ["سورهٔ عادیات با سوگند به چه چیزی آغاز می‌شود؟", "By what does Surah Al-'Adiyat begin with an oath?"],
      ["مرکب‌های دونده‌ای که نفس‌زنان می‌تازند", "The racing steeds, panting"],
      [
        ["کشتی‌ها در دریا", "Ships at sea"],
        ["بادهای سخت", "Strong winds"],
        ["کوه‌های بلند", "Tall mountains"],
      ],
      ["آیهٔ ۱: «وَالْعَادِيَاتِ ضَبْحًا»", "Verse 1: “By the racers, panting.”"],
    ],
    [
      "ungrateful",
      ["آیهٔ ۶ انسان را چگونه توصیف می‌کند؟", "How does verse 6 describe man?"],
      ["نسبت به پروردگارش بسیار ناسپاس", "Ungrateful to his Lord"],
      [
        ["بسیار شجاع", "Very brave"],
        ["بسیار آگاه", "Very knowledgeable"],
        ["بسیار فروتن", "Very humble"],
      ],
      ["«إِنَّ الْإِنسَانَ لِرَبِّهِ لَكَنُودٌ»", "“Indeed mankind, to his Lord, is ungrateful.”"],
    ],
    [
      "wealth",
      ["آیهٔ ۸ دربارهٔ دلبستگی انسان چه می‌گوید؟", "What does verse 8 say about man's attachment?"],
      ["او به مال بسیار دلبسته است", "He is intense in the love of wealth"],
      [
        ["او به سفر دلبسته است", "He is attached to travel"],
        ["او به علم دلبسته است", "He is attached to knowledge"],
        ["او از مال بیزار است", "He dislikes wealth"],
      ],
      ["«وَإِنَّهُ لِحُبِّ الْخَيْرِ لَشَدِيدٌ»", "“And indeed he is, in love of wealth, intense.”"],
    ],
    [
      "graves",
      ["آیه‌های ۹ و ۱۰ چه چیزی را یادآوری می‌کنند؟", "What do verses 9-10 remind us of?"],
      ["برانگیخته‌شدن آنچه در قبرهاست و آشکارشدن آنچه در سینه‌هاست", "What is in the graves being scattered and what is in the breasts being brought out"],
      [
        ["پایان‌یافتن جنگ", "The end of war"],
        ["بازگشت بهار", "The return of spring"],
        ["شکافتن دریاها", "The splitting of seas"],
      ],
      ["«أَفَلَا يَعْلَمُ إِذَا بُعْثِرَ مَا فِي الْقُبُورِ»", "“Does he not know that when the contents of the graves are scattered...”"],
    ],
  ],
  101: [
    [
      "qaria",
      ["«القارعه» در این سوره به چه اشاره دارد؟", "What does “al-Qari'ah” refer to in this surah?"],
      ["رستاخیز که دل‌ها را می‌کوبد", "The Resurrection, the Striking Calamity"],
      [
        ["یک زلزلهٔ شهری", "A city earthquake"],
        ["یک جنگ قبیله‌ای", "A tribal war"],
        ["یک ستارهٔ دنباله‌دار", "A comet"],
      ],
      ["آیه‌های ۱ تا ۳", "Verses 1-3"],
    ],
    [
      "moths",
      ["در آن روز مردم به چه چیزی تشبیه شده‌اند؟", "To what are people compared on that Day?"],
      ["پروانه‌های پراکنده", "Scattered moths"],
      [
        ["سنگ‌های روی هم", "Piled stones"],
        ["رودهای جاری", "Flowing rivers"],
        ["ستارگان درخشان", "Shining stars"],
      ],
      ["آیهٔ ۴: «كَالْفَرَاشِ الْمَبْثُوثِ»", "Verse 4: “Like moths, dispersed.”"],
    ],
    [
      "wool",
      ["کوه‌ها در آیهٔ ۵ چگونه می‌شوند؟", "What will the mountains become in verse 5?"],
      ["مثل پشم زده‌شده و پراکنده", "Like fluffed wool"],
      [
        ["مثل طلا", "Like gold"],
        ["مثل آب", "Like water"],
        ["مثل آهن", "Like iron"],
      ],
      ["«وَتَكُونُ الْجِبَالُ كَالْعِهْنِ الْمَنفُوشِ»", "“And the mountains will be like carded wool.”"],
    ],
    [
      "scales",
      ["کسی که ترازوی اعمالش سنگین باشد، چه سرنوشتی دارد؟", "What awaits one whose scales are heavy?"],
      ["زندگی‌ای خوشایند و دلپسند", "A pleasant life"],
      [
        ["حسابی دوباره", "A second reckoning"],
        ["بازگشت به دنیا", "Return to the world"],
        ["جایگاهی در هاویه", "A place in the Hawiyah"],
      ],
      ["آیه‌های ۶ و ۷؛ کسی که ترازویش سبک باشد جایگاهش هاویه است.", "Verses 6-7; whoever's scales are light, his refuge is Hawiyah."],
    ],
  ],
  102: [
    [
      "rivalry",
      ["آیهٔ ۱ و ۲ چه چیزی را نکوهش می‌کند؟", "What do verses 1-2 condemn?"],
      ["رقابت در فزون‌طلبی که تا زیارت قبرها شما را سرگرم می‌کند", "Competition in worldly increase that distracts you until you visit the graves"],
      [
        ["سفر برای دانش", "Travelling for knowledge"],
        ["کار برای خانواده", "Working for family"],
        ["یاری به نیازمندان", "Helping the needy"],
      ],
      ["«أَلْهَاكُمُ التَّكَاثُرُ ۝ حَتَّىٰ زُرْتُمُ الْمَقَابِرَ»", "“Competition in [worldly] increase diverts you until you visit the graveyards.”"],
    ],
    [
      "know",
      ["آیه‌های ۳ و ۴ چه هشداری می‌دهند؟", "What warning do verses 3-4 give?"],
      ["به‌زودی (حقیقت را) خواهید دانست", "You will soon come to know"],
      [
        ["هرگز چیزی نخواهید دانست", "You will never know anything"],
        ["دیگران برایتان خواهند دانست", "Others will know for you"],
        ["همه‌چیز را فراموش می‌کنید", "You will forget everything"],
      ],
      ["«كَلَّا سَوْفَ تَعْلَمُونَ»", "“No! You are going to know.”"],
    ],
    [
      "certainty",
      ["در آیه‌های ۵ تا ۷ جهنم با چه تعبیرهایی دیده می‌شود؟", "With which expressions is Hellfire seen in verses 5-7?"],
      ["علم‌الیقین و عین‌الیقین", "Knowledge of certainty and eye of certainty"],
      [
        ["ظن و گمان", "Suspicion and guess"],
        ["شنیدن و خواب", "Hearsay and dream"],
        ["شعر و افسانه", "Poetry and legend"],
      ],
      ["«لَوْ تَعْلَمُونَ عِلْمَ الْيَقِينِ ... ثُمَّ لَتَرَوُنَّهَا عَيْنَ الْيَقِينِ»", "“If you knew with knowledge of certainty ... then you will surely see it with eye of certainty.”"],
    ],
    [
      "bliss",
      ["آیهٔ ۸ می‌گوید در آن روز دربارهٔ چه چیزی پرسیده می‌شوید؟", "About what does verse 8 say you will be asked that Day?"],
      ["دربارهٔ نعمت‌ها", "About the pleasures (blessings)"],
      [
        ["دربارهٔ شمار ستارگان", "About the number of stars"],
        ["دربارهٔ نام شهرها", "About the names of cities"],
        ["دربارهٔ رنگ‌ها", "About colours"],
      ],
      ["«ثُمَّ لَتُسْأَلُنَّ يَوْمَئِذٍ عَنِ النَّعِيمِ»", "“Then you will surely be asked that Day about pleasure.”"],
    ],
  ],
  103: [
    [
      "oath",
      ["سورهٔ عصر با سوگند به چه چیزی آغاز می‌شود؟", "By what does Surah Al-'Asr begin with an oath?"],
      ["زمان (عصر)", "Time (the age)"],
      [
        ["شب", "The night"],
        ["خورشید", "The sun"],
        ["زمین", "The earth"],
      ],
      ["آیهٔ ۱: «وَالْعَصْرِ»", "Verse 1: “By time.”"],
    ],
    [
      "loss",
      ["آیهٔ ۲ دربارهٔ انسان چه می‌گوید؟", "What does verse 2 say about man?"],
      ["انسان در زیان است", "Man is in loss"],
      [
        ["انسان در سود است", "Man is in profit"],
        ["انسان در خواب است", "Man is asleep"],
        ["انسان در سفر است", "Man is travelling"],
      ],
      ["«إِنَّ الْإِنسَانَ لَفِي خُسْرٍ»", "“Indeed, mankind is in loss.”"],
    ],
    [
      "except",
      ["چه کسانی از زیان مستثنا هستند؟", "Who are exempted from loss?"],
      ["ایمان‌آورندگان نیکوکار که یکدیگر را به حق و صبر سفارش می‌کنند", "Those who believe, do good and advise one another to truth and patience"],
      [
        ["ثروتمندان", "The wealthy"],
        ["دانشمندان فقط", "Scholars only"],
        ["مسافران", "Travellers"],
      ],
      ["آیهٔ ۳", "Verse 3"],
    ],
    [
      "advise",
      ["دو سفارشی که مؤمنان به یکدیگر می‌کنند چیست؟", "What two things do believers advise one another to?"],
      ["حق و صبر", "Truth and patience"],
      [
        ["مال و قدرت", "Wealth and power"],
        ["سفر و تجارت", "Travel and trade"],
        ["جنگ و غنیمت", "War and spoils"],
      ],
      ["«وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ»", "“And advised each other to truth and advised each other to patience.”"],
    ],
  ],
  104: [
    [
      "humaza",
      ["«وَيْلٌ لِّكُلِّ هُمَزَةٍ لُّمَزَةٍ» دربارهٔ چه کسی است؟", "About whom is “Woe to every scorner and backbiter”?"],
      ["کسی که پشت سر مردم عیب‌جویی و آنان را تحقیر می‌کند", "One who slanders and mocks people"],
      [
        ["کسی که زیاد می‌خوابد", "One who sleeps a lot"],
        ["کسی که سفر می‌کند", "One who travels"],
        ["کسی که زیاد روزه می‌گیرد", "One who fasts a lot"],
      ],
      ["آیهٔ ۱", "Verse 1"],
    ],
    [
      "wealth",
      ["آیهٔ ۲ این شخص را چگونه وصف می‌کند؟", "How does verse 2 describe this person?"],
      ["مالی را جمع کرده و آن را شمارش می‌کند", "He gathers wealth and counts it"],
      [
        ["مالش را می‌بخشد", "He gives his wealth away"],
        ["از مال بیزار است", "He dislikes wealth"],
        ["مالش را گم می‌کند", "He loses his wealth"],
      ],
      ["«الَّذِي جَمَعَ مَالًا وَعَدَّدَهُ»", "“Who collects wealth and [continuously] counts it.”"],
    ],
    [
      "immortal",
      ["او دربارهٔ مالش چه گمانی دارد؟", "What does he think about his wealth?"],
      ["گمان می‌کند مالش او را جاودانه می‌کند", "He thinks his wealth will make him immortal"],
      [
        ["گمان می‌کند مال او را فقیر می‌کند", "He thinks it will make him poor"],
        ["گمان می‌کند مال از او دور می‌شود", "He thinks it will leave him"],
        ["گمان می‌کند مال بی‌ارزش است", "He thinks it is worthless"],
      ],
      ["«يَحْسَبُ أَنَّ مَالَهُ أَخْلَدَهُ»", "“He thinks that his wealth will make him immortal.”"],
    ],
    [
      "crusher",
      ["سرانجام او در آیهٔ ۴ چیست؟", "What is his end in verse 4?"],
      ["در «حُطَمه» (درهم‌کوبنده) افکنده می‌شود", "He will be thrown into the Crusher (al-Hutamah)"],
      [
        ["به باغ‌ها می‌رود", "He enters gardens"],
        ["به دنیا بازمی‌گردد", "He returns to the world"],
        ["ثروتش دو برابر می‌شود", "His wealth is doubled"],
      ],
      ["«كَلَّا لَيُنبَذَنَّ فِي الْحُطَمَةِ»", "“No! He will surely be thrown into the Crusher.”"],
    ],
  ],
  105: [
    [
      "elephant",
      ["سورهٔ فیل دربارهٔ چه کسانی است؟", "Who is Surah Al-Fil about?"],
      ["اصحاب فیل", "The companions of the elephant"],
      [
        ["اصحاب کهف", "The companions of the cave"],
        ["قوم عاد", "The people of 'Ad"],
        ["قوم لوط", "The people of Lot"],
      ],
      ["آیهٔ ۱: «أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ»", "Verse 1: “Have you not considered how your Lord dealt with the companions of the elephant?”"],
    ],
    [
      "birds",
      ["خداوند بر آنان چه چیزی فرستاد؟", "What did God send upon them?"],
      ["دسته‌دسته پرندگان", "Flocks of birds"],
      [
        ["طوفان", "A storm"],
        ["سیل", "A flood"],
        ["ملخ", "Locusts"],
      ],
      ["آیهٔ ۳: «وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ»", "Verse 3: “And He sent against them birds in flocks.”"],
    ],
    [
      "stones",
      ["پرندگان به سوی آنان چه می‌افکندند؟", "What did the birds throw at them?"],
      ["سنگ‌هایی از گِل پخته (سجّیل)", "Stones of baked clay (sijjil)"],
      [
        ["آتش", "Fire"],
        ["آب", "Water"],
        ["شنِ دریا", "Sea sand"],
      ],
      ["«تَرْمِيهِم بِحِجَارَةٍ مِّن سِجِّيلٍ»", "“Striking them with stones of hard clay.”"],
    ],
    [
      "straw",
      ["در پایان، خداوند آنان را چگونه ساخت؟", "In the end, what did God make them like?"],
      ["مثل کاه خورده‌شده", "Like eaten straw"],
      [
        ["مثل سنگ سخت", "Like hard stone"],
        ["مثل ابر", "Like clouds"],
        ["مثل ستاره", "Like stars"],
      ],
      ["«فَجَعَلَهُمْ كَعَصْفٍ مَّأْكُولٍ»", "“And He made them like eaten straw.”"],
    ],
  ],
  106: [
    [
      "familiarity",
      ["سورهٔ قریش به چه نعمتی از قریش اشاره می‌کند؟", "To which blessing of Quraysh does Surah Quraysh point?"],
      ["انس و الفتشان با سفرهای تجاری و امنیت", "Their familiarity with trade journeys and security"],
      [
        ["ثروت بی‌پایان", "Endless wealth"],
        ["قدرت نظامی", "Military power"],
        ["دانش ستاره‌شناسی", "Knowledge of astronomy"],
      ],
      ["آیهٔ ۱: «لِإِيلَافِ قُرَيْشٍ»", "Verse 1: “For the accustomed security of the Quraysh.”"],
    ],
    [
      "journeys",
      ["قریش در کدام فصل‌ها سفر تجاری می‌کردند؟", "In which seasons did Quraysh make trade journeys?"],
      ["زمستان و تابستان", "Winter and summer"],
      [
        ["بهار و پاییز", "Spring and autumn"],
        ["فقط تابستان", "Only summer"],
        ["فقط زمستان", "Only winter"],
      ],
      ["آیهٔ ۲: «رِحْلَةَ الشِّتَاءِ وَالصَّيْفِ»", "Verse 2: “Their [caravan] journey in winter and summer.”"],
    ],
    [
      "worship",
      ["آیهٔ ۳ آنان را به چه چیزی فرا می‌خواند؟", "What does verse 3 call them to?"],
      ["پرستش پروردگارِ این خانه (کعبه)", "To worship the Lord of this House (the Kaaba)"],
      [
        ["پرستش بتان کعبه", "To worship the idols of the Kaaba"],
        ["ترک مکه", "To leave Mecca"],
        ["جنگ با همسایگان", "To fight their neighbours"],
      ],
      ["«فَلْيَعْبُدُوا رَبَّ هَٰذَا الْبَيْتِ»", "“Let them worship the Lord of this House.”"],
    ],
    [
      "fed",
      ["خداوند در آیهٔ ۴ چه نعمت‌هایی به آنان داد؟", "What blessings did God give them in verse 4?"],
      ["آنان را از گرسنگی غذا داد و از ترس امنیت بخشید", "He fed them against hunger and secured them from fear"],
      [
        ["آنان را پادشاه کرد", "He made them kings"],
        ["به آنان کتاب داد", "He gave them a book"],
        ["آنان را از مکه بیرون برد", "He took them out of Mecca"],
      ],
      ["«الَّذِي أَطْعَمَهُم مِّن جُوعٍ وَآمَنَهُم مِّنْ خَوْفٍ»", "“Who has fed them, [saving them] from hunger and made them safe, [saving them] from fear.”"],
    ],
  ],
  107: [
    [
      "deny",
      ["سورهٔ ماعون دربارهٔ چه کسی می‌پرسد؟", "About whom does Surah Al-Ma'un ask?"],
      ["کسی که روز جزا را دروغ می‌شمارد", "The one who denies the Recompense"],
      [
        ["کسی که سفر می‌کند", "The one who travels"],
        ["کسی که می‌خوابد", "The one who sleeps"],
        ["کسی که مهمان می‌پذیرد", "The one who hosts guests"],
      ],
      ["آیهٔ ۱: «أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ»", "Verse 1: “Have you seen the one who denies the Recompense?”"],
    ],
    [
      "orphan",
      ["او با یتیم و نیازمند چگونه رفتار می‌کند؟", "How does he treat the orphan and the needy?"],
      ["یتیم را می‌راند و به غذا دادن نیازمند تشویق نمی‌کند", "He drives away the orphan and does not urge feeding the needy"],
      [
        ["به آنان کمک می‌کند", "He helps them"],
        ["برایشان خانه می‌سازد", "He builds them houses"],
        ["با آنان غذا می‌خورد", "He eats with them"],
      ],
      ["«فَذَٰلِكَ الَّذِي يَدُعُّ الْيَتِيمَ ۝ وَلَا يَحُضُّ عَلَىٰ طَعَامِ الْمِسْكِينِ»", "“For that is the one who drives away the orphan and does not encourage feeding the poor.”"],
    ],
    [
      "prayer",
      ["وای بر چه نمازگزارانی؟", "Woe to which worshippers?"],
      ["کسانی که از نمازشان غافل‌اند", "Those who are heedless of their prayer"],
      [
        ["کسانی که زیاد نماز می‌خوانند", "Those who pray much"],
        ["کسانی که نماز را کوتاه می‌کنند در سفر", "Those who shorten prayer in travel"],
        ["کسانی که تنها نماز می‌خوانند", "Those who pray alone"],
      ],
      ["آیه‌های ۴ و ۵: «الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ»", "Verses 4-5: “Who are heedless of their prayer.”"],
    ],
    [
      "maun",
      ["«ماعون» در آیهٔ پایانی چیست که از دیگران دریغ می‌شود؟", "What is “al-ma'un”, which is withheld in the last verse?"],
      ["کمک‌ها و وسایل کوچک روزمره", "Small acts of help and everyday items"],
      [
        ["زمین و باغ", "Land and gardens"],
        ["اسب و شتر", "Horses and camels"],
        ["طلا و نقره", "Gold and silver"],
      ],
      ["«وَيَمْنَعُونَ الْمَاعُونَ»", "“And withhold [simple] assistance.”"],
    ],
  ],
  108: [
    [
      "kawthar",
      ["«کوثر» در آیهٔ ۱ به چه معناست؟", "What does “Kawthar” in verse 1 mean?"],
      ["خیر فراوان", "Abundant good"],
      [
        ["شمشیر تیز", "A sharp sword"],
        ["شهر بزرگ", "A big city"],
        ["سفر طولانی", "A long journey"],
      ],
      ["آیهٔ ۱: «إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ»", "Verse 1: “Indeed, We have granted you al-Kawthar.”"],
    ],
    [
      "pray",
      ["آیهٔ ۲ پس از این بخشش چه فرمانی می‌دهد؟", "What does verse 2 command after this gift?"],
      ["برای پروردگارت نماز بخوان و قربانی کن", "Pray to your Lord and sacrifice"],
      [
        ["بجنگ و غنیمت بگیر", "Fight and take spoils"],
        ["سفر کن و تجارت کن", "Travel and trade"],
        ["بخواب و استراحت کن", "Sleep and rest"],
      ],
      ["«فَصَلِّ لِرَبِّكَ وَانْحَرْ»", "“So pray to your Lord and sacrifice [to Him alone].”"],
    ],
    [
      "abtar",
      ["دشمن پیامبر در آیهٔ ۳ چگونه توصیف می‌شود؟", "How is the Prophet's enemy described in verse 3?"],
      ["او خود بی‌نام‌ونشان و ناپایدار (ابتر) است", "He is the one cut off (abtar)"],
      [
        ["او ثروتمندترین مردم است", "He is the richest of people"],
        ["او در امان است", "He is safe"],
        ["او پیروز است", "He is victorious"],
      ],
      ["«إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ»", "“Indeed, your enemy is the one cut off.”"],
    ],
    [
      "short",
      ["کدام ویژگی دربارهٔ سورهٔ کوثر درست است؟", "Which statement about Surah Al-Kawthar is correct?"],
      ["کوتاه‌ترین سورهٔ قرآن و سه آیه دارد", "It is the shortest surah of the Quran and has three verses"],
      [
        ["بلندترین سورهٔ قرآن است", "It is the longest surah"],
        ["ده آیه دارد", "It has ten verses"],
        ["مدنی و دارای احکام ارث است", "It is Medinan and about inheritance"],
      ],
      ["سه آیه‌ای است که با «إِنَّا أَعْطَيْنَاكَ» آغاز می‌شود.", "A three-verse surah that begins with “Indeed, We have granted you.”"],
    ],
  ],
  109: [
    [
      "say",
      ["سورهٔ کافرون با چه خطابی آغاز می‌شود؟", "With which address does Surah Al-Kafirun begin?"],
      ["بگو: ای کافران", "Say: O disbelievers"],
      [
        ["ای مؤمنان", "O believers"],
        ["ای مردم", "O people"],
        ["ای پیامبران", "O prophets"],
      ],
      ["آیهٔ ۱: «قُلْ يَا أَيُّهَا الْكَافِرُونَ»", "Verse 1: “Say: O disbelievers.”"],
    ],
    [
      "worship",
      ["پیامبر در آیهٔ ۲ چه اعلام می‌کند؟", "What does the Prophet declare in verse 2?"],
      ["آنچه را شما می‌پرستید نمی‌پرستم", "I do not worship what you worship"],
      [
        ["آنچه شما می‌پرستید من هم می‌پرستم", "I worship what you worship"],
        ["من هیچ چیز را نمی‌پرستم", "I worship nothing"],
        ["من با شما می‌پرستم", "I worship together with you"],
      ],
      ["«لَا أَعْبُدُ مَا تَعْبُدُونَ»", "“I do not worship what you worship.”"],
    ],
    [
      "religion",
      ["آیهٔ پایانی سوره چیست؟", "What is the last verse of the surah?"],
      ["دین شما برای خودتان و دین من برای خودم", "For you is your religion, and for me is my religion"],
      [
        ["بجنگید تا پیروز شوید", "Fight until you win"],
        ["همه یک دین داریم", "We all share one religion"],
        ["دین را از مردم پنهان کنید", "Hide religion from people"],
      ],
      ["«لَكُمْ دِينُكُمْ وَلِيَ دِينِ»", "“For you is your religion, and for me is my religion.”"],
    ],
    [
      "stance",
      ["پیام اصلی این سوره چیست؟", "What is the main message of this surah?"],
      ["بیزاری قاطع از شرک و پرستش غیر خدا", "A firm disassociation from polytheism and worship of others than God"],
      [
        ["قصهٔ پیامبران", "Stories of the prophets"],
        ["احکام ارث", "Rules of inheritance"],
        ["توصیف بهشت", "A description of Paradise"],
      ],
      ["جمله‌های سوره بارها این بیزاری را تکرار می‌کند.", "The surah repeats this disassociation several times."],
    ],
  ],
  110: [
    [
      "victory",
      ["سورهٔ نصر با چه رویدادی آغاز می‌شود؟", "With which event does Surah An-Nasr begin?"],
      ["آمدن یاری خدا و پیروزی (فتح)", "The coming of God's help and the conquest"],
      [
        ["آمدن زمستان", "The coming of winter"],
        ["آمدن کاروان", "The coming of a caravan"],
        ["شکافتن دریا", "The splitting of the sea"],
      ],
      ["آیهٔ ۱: «إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ»", "Verse 1: “When the victory of God has come and the conquest.”"],
    ],
    [
      "multitudes",
      ["آیهٔ ۲ چه صحنه‌ای را وصف می‌کند؟", "What scene does verse 2 describe?"],
      ["مردم گروه‌گروه وارد دین خدا می‌شوند", "People entering the religion of God in multitudes"],
      [
        ["مردم از شهر می‌گریزند", "People fleeing the city"],
        ["مردم به جنگ می‌روند", "People going to war"],
        ["مردم بتی می‌سازند", "People making an idol"],
      ],
      ["«وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا»", "“And you see the people entering into God's religion in multitudes.”"],
    ],
    [
      "praise",
      ["پس از پیروزی چه فرمانی داده شده است؟", "What is commanded after the victory?"],
      ["با ستایش پروردگارت تسبیح کن و از او آمرزش بخواه", "Exalt with praise of your Lord and ask His forgiveness"],
      [
        ["جشن بگیر و جنگ کن", "Celebrate and fight"],
        ["مال جمع کن", "Gather wealth"],
        ["شهر را ترک کن", "Leave the city"],
      ],
      ["«فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ»", "“Then exalt [Him] with praise of your Lord and ask forgiveness of Him.”"],
    ],
    [
      "tawwab",
      ["سوره با کدام ویژگی خداوند پایان می‌یابد؟", "With which attribute of God does the surah end?"],
      ["او بسیار توبه‌پذیر است", "He is ever Accepting of repentance"],
      [
        ["او بسیار سخت‌گیر است", "He is ever severe"],
        ["او بسیار دور است", "He is far away"],
        ["او فقط حساب می‌کند", "He only reckons"],
      ],
      ["«إِنَّهُ كَانَ تَوَّابًا»", "“Indeed, He is ever Accepting of repentance.”"],
    ],
  ],
  111: [
    [
      "who",
      ["سورهٔ مسد دربارهٔ چه کسی نازل شد؟", "About whom was Surah Al-Masad revealed?"],
      ["ابولهب، عموی پیامبر که با او دشمنی می‌کرد", "Abu Lahab, the Prophet's uncle who opposed him"],
      [
        ["فرعون", "Pharaoh"],
        ["نمرود", "Nimrod"],
        ["ابوطالب", "Abu Talib"],
      ],
      ["آیهٔ ۱: «تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ»", "Verse 1: “May the hands of Abu Lahab be ruined, and ruined is he.”"],
    ],
    [
      "wealth",
      ["آیهٔ ۲ دربارهٔ مال و دستاوردهای او چه می‌گوید؟", "What does verse 2 say about his wealth and gains?"],
      ["مالش و آنچه به دست آورد او را سودی نمی‌بخشد", "His wealth and what he earned will not benefit him"],
      [
        ["مالش او را نجات می‌دهد", "His wealth will save him"],
        ["مالش بیشتر می‌شود", "His wealth will increase"],
        ["مالش را به فرزندانش می‌دهند", "His wealth will go to his children"],
      ],
      ["«مَا أَغْنَىٰ عَنْهُ مَالُهُ وَمَا كَسَبَ»", "“His wealth will not avail him or that which he gained.”"],
    ],
    [
      "wife",
      ["همسر او در آیهٔ ۴ چگونه توصیف شده است؟", "How is his wife described in verse 4?"],
      ["هیزم‌کش (حمّالة الحطب)", "The carrier of firewood"],
      [
        ["بانوی بخشنده", "A generous lady"],
        ["پرستار بیماران", "A nurse of the sick"],
        ["معلم کودکان", "A teacher of children"],
      ],
      ["«وَامْرَأَتُهُ حَمَّالَةَ الْحَطَبِ»", "“And his wife [as well] — the carrier of firewood.”"],
    ],
    [
      "rope",
      ["آیهٔ پایانی دربارهٔ گردن او چه می‌گوید؟", "What does the last verse say about her neck?"],
      ["ریسمانی از لیف خرما بر گردن اوست", "Around her neck is a rope of palm fiber"],
      [
        ["گردنبندی از طلا", "A necklace of gold"],
        ["زنجیری از آهن", "A chain of iron"],
        ["پارچه‌ای از ابریشم", "A cloth of silk"],
      ],
      ["«فِي جِيدِهَا حَبْلٌ مِّن مَّسَدٍ»", "“Around her neck is a rope of [twisted] fiber.”"],
    ],
  ],
  112: [
    [
      "one",
      ["نخستین آیهٔ اخلاص خدا را چگونه معرفی می‌کند؟", "How does the first verse of Al-Ikhlas introduce God?"],
      ["او الله است، یکتا", "He is God, the One"],
      [
        ["او پادشاه شهر است", "He is the king of the city"],
        ["او یکی از فرشتگان است", "He is one of the angels"],
        ["او سه‌گانه است", "He is a trinity"],
      ],
      ["«قُلْ هُوَ اللَّهُ أَحَدٌ»", "“Say, He is God, [who is] One.”"],
    ],
    [
      "samad",
      ["«صمد» در آیهٔ ۲ یعنی چه؟", "What does “as-Samad” in verse 2 mean?"],
      ["همه به او نیازمندند و او بی‌نیاز است", "The one everyone needs while He needs no one"],
      [
        ["او که می‌خوابد", "The one who sleeps"],
        ["او که زاده شده است", "The one who was born"],
        ["او که فقط در مکه است", "The one who is only in Mecca"],
      ],
      ["«اللَّهُ الصَّمَدُ»", "“God, the Eternal Refuge.”"],
    ],
    [
      "not-born",
      ["آیهٔ ۳ دربارهٔ خدا چه می‌گوید؟", "What does verse 3 say about God?"],
      ["نه فرزندی دارد و نه زاده شده است", "He neither begets nor is born"],
      [
        ["او فرزند دارد", "He has a child"],
        ["او زاده شده است", "He was born"],
        ["او همسر دارد", "He has a spouse"],
      ],
      ["«لَمْ يَلِدْ وَلَمْ يُولَدْ»", "“He neither begets nor is born.”"],
    ],
    [
      "equal",
      ["آیهٔ پایانی سوره چیست؟", "What is the final verse?"],
      ["و هیچ‌کس همتای او نیست", "And there is none comparable to Him"],
      [
        ["و او در آسمان است", "And He is in the heavens"],
        ["و او بر عرش مستقر است", "And He sits on the throne"],
        ["و او در همه‌جا شبیه ماست", "And He is like us"],
      ],
      ["«وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ»", "“Nor is there to Him any equivalent.”"],
    ],
  ],
  113: [
    [
      "refuge",
      ["در سورهٔ فلق به پناه بردن به چه کسی فرمان داده شده است؟", "Whom does Surah Al-Falaq command us to seek refuge with?"],
      ["پروردگار سپیده‌دم (فلق)", "The Lord of daybreak (al-falaq)"],
      [
        ["پادشاه شهر", "The king of the city"],
        ["فرشتگان", "The angels"],
        ["کوه‌ها", "The mountains"],
      ],
      ["آیهٔ ۱: «قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ»", "Verse 1: “Say, I seek refuge in the Lord of daybreak.”"],
    ],
    [
      "darkness",
      ["آیهٔ ۳ از شر چه چیزی پناه می‌برد؟", "From the evil of what does verse 3 seek refuge?"],
      ["تاریکی شب وقتی همه‌جا را فرا می‌گیرد", "Darkness when it settles"],
      [
        ["روشنایی ماه", "The light of the moon"],
        ["باران بهاری", "Spring rain"],
        ["باد ملایم", "A gentle breeze"],
      ],
      ["«وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ»", "“And from the evil of darkness when it settles.”"],
    ],
    [
      "knots",
      ["آیهٔ ۴ از شر چه کسانی پناه می‌برد؟", "From the evil of whom does verse 4 seek refuge?"],
      ["دمندگان در گره‌ها", "Those who blow on knots"],
      [
        ["دانشمندان", "Scholars"],
        ["مسافران", "Travellers"],
        ["کشاورزان", "Farmers"],
      ],
      ["«وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ»", "“And from the evil of the blowers in knots.”"],
    ],
    [
      "envier",
      ["آیهٔ پایانی از شر چه کسی پناه می‌برد؟", "From the evil of whom does the last verse seek refuge?"],
      ["حسودی که حسادت می‌کند", "An envier when he envies"],
      [
        ["بخشنده‌ای که می‌بخشد", "A giver when he gives"],
        ["مسافری که می‌رسد", "A traveller who arrives"],
        ["معلمی که می‌آموزد", "A teacher who teaches"],
      ],
      ["«وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ»", "“And from the evil of an envier when he envies.”"],
    ],
  ],
  114: [
    [
      "three",
      ["سه صفت خدا در آغاز سورهٔ ناس چیست؟", "What are the three attributes of God at the start of Surah An-Nas?"],
      ["پروردگار مردم، پادشاه مردم، معبود مردم", "Lord of mankind, King of mankind, God of mankind"],
      [
        ["بخشنده، بینا، شنوا", "Giver, All-Seeing, All-Hearing"],
        ["آفریننده، روزی‌دهنده، میراننده", "Creator, Provider, Taker of life"],
        ["پیروزمند، توانا، سخت‌گیر", "Mighty, Powerful, Severe"],
      ],
      ["آیه‌های ۱ تا ۳", "Verses 1-3"],
    ],
    [
      "whisperer",
      ["از شر چه کسی پناه برده می‌شود؟", "From the evil of whom is refuge sought?"],
      ["وسوسه‌گرِ پنهان‌شونده", "The retreating whisperer"],
      [
        ["پادشاه شهر", "The king of the city"],
        ["همسایه", "The neighbour"],
        ["مسافر", "The traveller"],
      ],
      ["«مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ»", "“From the evil of the retreating whisperer.”"],
    ],
    [
      "breasts",
      ["آن وسوسه‌گر کجا وسوسه می‌کند؟", "Where does that whisperer whisper?"],
      ["در سینه‌های مردم", "In the breasts of mankind"],
      [
        ["در بازارها", "In the markets"],
        ["در کوه‌ها", "In the mountains"],
        ["در دریا", "In the sea"],
      ],
      ["«الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ»", "“Who whispers [evil] into the breasts of mankind.”"],
    ],
    [
      "jinn",
      ["آیهٔ پایانی وسوسه‌گران را از چه گروه‌هایی می‌داند؟", "From which groups does the last verse say the whisperers come?"],
      ["از جنّ و انسان", "From among the jinn and mankind"],
      [
        ["فقط از جنّ", "Only from the jinn"],
        ["فقط از انسان", "Only from mankind"],
        ["از فرشتگان", "From the angels"],
      ],
      ["«مِنَ الْجِنَّةِ وَالنَّاسِ»", "“From among the jinn and mankind.”"],
    ],
  ],
};

export const JUZ30_CONCEPT_QUESTIONS: readonly ConceptQuestion[] = Object.entries(
  BANK,
).flatMap(([surah, items]) =>
  items.map<ConceptQuestion>(([key, prompt, correct, wrong, explanation]) => ({
    id: `s${surah}-${key}`,
    surahId: Number(surah),
    prompt: { fa: prompt[0], en: prompt[1] },
    correct: { fa: correct[0], en: correct[1] },
    wrong: [
      { fa: wrong[0][0], en: wrong[0][1] },
      { fa: wrong[1][0], en: wrong[1][1] },
      { fa: wrong[2][0], en: wrong[2][1] },
    ],
    explanation: { fa: explanation[0], en: explanation[1] },
  })),
);
