/**
 * INTERFEYS TILLARI (i18n).
 *
 * Yondashuv ataylab sodda tanlandi: URL'da /uz/, /ru/ kabi prefikslar YO'Q.
 * Til tanlovi cookie'da saqlanadi. Sabab — SEO uchun bitta manzil qulay va
 * boshlang'ich dasturchi uchun tushunarli.
 *
 * Yangi matn qo'shish: pastdagi `uz` obyektiga kalit qo'shing, keyin
 * TypeScript sizdan `ru` va `en` uchun ham tarjima so'raydi. Ya'ni
 * tarjimani unutib qo'yish MUMKIN EMAS.
 */

export const LOCALES = ["uz", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "uz";

export const LOCALE_LABELS: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};

/** Cookie nomi — server ham, brauzer ham shu nomdan foydalanadi */
export const LOCALE_COOKIE = "ef_lang";

const uz = {
  // --- Umumiy ---
  "app.name": "ExamFluent",
  "app.tagline": "Ishonch bilan gapir, natija bilan tasdiqla",
  "common.continue": "Davom etish",
  "common.back": "Orqaga",
  "common.next": "Keyingi",
  "common.finish": "Yakunlash",
  "common.cancel": "Bekor qilish",
  "common.save": "Saqlash",
  "common.loading": "Yuklanmoqda...",
  "common.error": "Xatolik yuz berdi",
  "common.retry": "Qayta urinish",
  "common.close": "Yopish",
  "common.start": "Boshlash",
  "common.minutes": "daqiqa",
  "common.questions": "savol",
  "common.of": "/",

  // --- Navigatsiya ---
  "nav.dashboard": "Bosh sahifa",
  "nav.chat": "AI suhbatdosh",
  "nav.practice": "IELTS mashqlar",
  "nav.vocab": "So'zlar",
  "nav.pronunciation": "Talaffuz",
  "nav.settings": "Sozlamalar",
  "nav.logout": "Chiqish",

  // --- Landing (bosh sahifa) ---
  "landing.hero.title": "Ingliz tilini AI bilan o'rganing",
  "landing.hero.subtitle":
    "CEFR darajangizni aniqlang, AI bilan suhbatlashing va IELTS ballingizni real baholashda kuzatib boring.",
  "landing.hero.cta": "Bepul boshlash",
  "landing.hero.login": "Kirish",
  "landing.hero.note": "Karta talab qilinmaydi · 2 daqiqada boshlaysiz",
  "landing.feature.placement.title": "Darajani aniqlash testi",
  "landing.feature.placement.body":
    "20 ta savol — va siz A1 dan C2 gacha bo'lgan aniq darajangizni bilasiz.",
  "landing.feature.chat.title": "AI suhbatdosh",
  "landing.feature.chat.body":
    "Sizning darajangizda gapiradi, har bir xatoni tushuntirib tuzatadi.",
  "landing.feature.ielts.title": "IELTS baholash",
  "landing.feature.ielts.body":
    "Writing, Reading va Listening mashqlari — har biri band score bilan.",
  "landing.feature.progress.title": "Progress kuzatuvi",
  "landing.feature.progress.body":
    "Streak, o'rganilgan so'zlar va band score tarixi bitta ekranda.",

  "landing.feature.vocab.title": "So'z kartochkalari",
  "landing.feature.vocab.body":
    "Intervalli takrorlash: so'zni unutishga yaqin qolganda ko'rsatadi.",
  "landing.feature.pron.title": "Talaffuz mashqi",
  "landing.feature.pron.body":
    "Mikrofonga gapiring — har bir so'z to'g'ri eshitilganini ko'rasiz.",

  "landing.scale.note": "Har bir mashq sizning darajangizga moslanadi",
  "landing.features.title": "Bir platformada to'liq tayyorgarlik",
  "landing.skills.title": "IELTS ning to'rt qismi",
  "landing.demo.correctionNote": "Qolgan gap to'g'ri yozilgan",
  "landing.demo.explanation": "\"Yesterday\" — o'tgan zamon, shuning uchun \"went\".",

  // --- Chat: til va ovoz ---
  "chat.lang.label": "Tushuntirish tili",
  "chat.lang.englishOnly": "Faqat ingliz",
  "chat.lang.bilingual": "Tilimda ham",
  "chat.lang.hint": "O'zbekcha yozsangiz — o'zbekcha javob olasiz",
  "chat.voice.autoOn": "Ovoz yoqilgan",
  "chat.voice.autoOff": "Ovoz o'chirilgan",
  "chat.voice.speak": "Eshitish",
  "chat.voice.stop": "To'xtatish",
  "chat.voice.mic": "Gapirish",
  "chat.voice.listening": "Yozilmoqda",
  "chat.voice.notSupported": "Brauzeringiz mikrofonni qo'llamaydi",
  "chat.voice.denied": "Mikrofonga ruxsat berilmadi",
  "chat.translation": "Tarjima",
  "chat.voice.startTalking": "Ovoz bilan gapirish",
  "chat.voice.micLang": "Mikrofon tili",
  "chat.voice.transcribing": "Ovoz matnga aylantirilmoqda...",
  "chat.voice.stopRecording": "Yozishni tugatish",
  "chat.voice.pressToStop": "tugatish uchun bosing",
  "chat.voice.noSpeech": "Ovoz eshitilmadi. Balandroq gapiring.",
  "chat.voice.silent":
    "Mikrofon umuman ovoz olmadi. Boshqa mikrofon tanlangan yoki o'chirilgan bo'lishi mumkin — /voice-test sahifasida tekshiring.",
  "chat.voice.convertFailed":
    "Mikrofon ovoz oldi, lekin fayl jim chiqdi — bu dastur xatosi. /voice-test sahifasida tekshiring.",
  "chat.voice.noMic": "Mikrofon topilmadi.",
  "chat.voice.serverVoice":
    "Kompyuteringizda inglizcha ovoz yo'q, shuning uchun Gemini ovozi ishlatilmoqda (biroz sekinroq).",
  "chat.voice.preparing": "Tayyorlanmoqda...",
  "chat.voice.noEnglishVoice":
    "Kompyuteringizda inglizcha ovoz yo'q — talaffuz noto'g'ri eshitiladi.",
  "chat.voice.noVoice":
    "Kompyuteringizda ovoz topilmadi — AI gapira olmaydi.",
  "chat.voice.diagnose": "Tekshirish",
  "chat.voice.howItWorks":
    "Tugmani bosing, gapiring, yana bosing. Ovozingiz matnga aylanadi va AI ovoz bilan javob beradi.",

  // --- Auth ---
  "auth.signup.title": "Ro'yxatdan o'tish",
  "auth.signup.subtitle": "Bepul akkaunt oching va darajangizni aniqlang",
  "auth.login.title": "Xush kelibsiz",
  "auth.login.subtitle": "Akkauntingizga kiring",
  "auth.email": "Email",
  "auth.password": "Parol",
  "auth.fullName": "Ismingiz",
  "auth.google": "Google orqali davom etish",
  "auth.or": "yoki",
  "auth.haveAccount": "Akkauntingiz bormi?",
  "auth.noAccount": "Akkauntingiz yo'qmi?",
  "auth.signupLink": "Ro'yxatdan o'tish",
  "auth.loginLink": "Kirish",
  "auth.submitSignup": "Akkaunt yaratish",
  "auth.submitLogin": "Kirish",
  "auth.passwordHint": "Kamida 8 ta belgi",
  "auth.checkEmail.title": "Emailingizni tekshiring",
  "auth.checkEmail.body":
    "Tasdiqlash havolasini yubordik. Havolani bosgach, akkauntingiz faollashadi.",
  "auth.error.invalidCredentials": "Email yoki parol noto'g'ri",
  "auth.error.emailInUse": "Bu email allaqachon ro'yxatdan o'tgan",
  "auth.error.weakPassword": "Parol juda sodda — kamida 8 ta belgi kiriting",
  "auth.error.generic": "Kirishda xatolik. Qayta urinib ko'ring.",

  // --- Placement test ---
  "placement.intro.title": "Darajangizni aniqlaymiz",
  "placement.intro.body":
    "20 ta savol, taxminan 10 daqiqa. Bilmasangiz taxmin qilmang — 'Bilmayman' tugmasini bosing, shunda natija aniqroq chiqadi.",
  "placement.intro.rule1": "Lug'at yoki tarjimondan foydalanmang",
  "placement.intro.rule2": "Savollar javobingizga qarab qiyinlashadi",
  "placement.intro.rule3": "Testni istalgan vaqt qayta topshirishingiz mumkin",
  "placement.dontKnow": "Bilmayman",
  "placement.progress": "Savol",
  "placement.analyzing": "Javoblaringiz tahlil qilinmoqda...",
  "placement.result.title": "Sizning darajangiz",
  "placement.result.bandLabel": "Taxminiy IELTS band",
  "placement.result.cta": "O'rganishni boshlash",
  "placement.result.retake": "Testni qayta topshirish",

  // --- Dashboard ---
  "dash.greeting": "Salom",
  "dash.yourLevel": "Darajangiz",
  "dash.streak": "Ketma-ket kunlar",
  "dash.words": "O'rganilgan so'zlar",
  "dash.band": "Oxirgi band",
  "dash.noBand": "Hali yo'q",
  "dash.days": "kun",
  "dash.startPlacement.title": "Avval darajangizni aniqlang",
  "dash.startPlacement.body":
    "Platformaning barcha mashqlari sizning CEFR darajangizga moslanadi. Shuning uchun birinchi qadam — qisqa test.",
  "dash.startPlacement.cta": "Testni boshlash",
  "dash.continue.title": "Bugungi mashq",
  "dash.weeklyActivity": "Haftalik faollik",
  "dash.bandHistory": "Band score tarixi",
  "dash.noData": "Ma'lumot yig'ilmoqda — bir nechta mashq bajaring",
  "dash.quickChat": "AI bilan suhbat",
  "dash.quickPractice": "IELTS mashq",
  "dash.quickVocab": "So'z takrorlash",
  "dash.quickPron": "Talaffuz",
  "dash.dueCards": "takrorlash kutmoqda",

  // --- Chat ---
  "chat.title": "AI suhbatdosh",
  "chat.placeholder": "Ingliz tilida yozing...",
  "chat.send": "Yuborish",
  "chat.newSession": "Yangi suhbat",
  "chat.scenario": "Mavzu",
  "chat.corrections": "Tuzatishlar",
  "chat.noCorrections": "Xatosiz! Ajoyib.",
  "chat.thinking": "AI yozmoqda...",
  "chat.empty.title": "Suhbatni boshlang",
  "chat.empty.body":
    "Ingliz tilida yozing. Men sizning darajangizda javob beraman va har bir xatoni tushuntirib tuzataman.",
  "chat.scenario.free_talk": "Erkin suhbat",
  "chat.scenario.ielts_speaking_p1": "IELTS Speaking Part 1",
  "chat.scenario.ielts_speaking_p3": "IELTS Speaking Part 3",
  "chat.scenario.job_interview": "Ish suhbati",
  "chat.scenario.travel": "Sayohat",
  "chat.scenario.daily_life": "Kundalik hayot",

  // --- Practice / IELTS ---
  "practice.title": "IELTS mashqlari",
  "practice.subtitle": "Har bir mashq real IELTS mezonlari bo'yicha baholanadi",
  "practice.reading": "Reading",
  "practice.writing": "Writing",
  "practice.listening": "Listening",
  "practice.speaking": "Speaking",
  "practice.reading.desc": "Matnni o'qing va savollarga javob bering",
  "practice.writing.desc": "Esse yozing — 4 mezon bo'yicha baholanadi",
  "practice.listening.desc": "Matnni tinglang va savollarga javob bering",
  "practice.speaking.desc": "Mikrofonga gapiring, talaffuzingiz baholanadi",
  "practice.generating": "Mashq tayyorlanmoqda...",
  "practice.evaluating": "Javobingiz baholanmoqda...",
  "practice.submit": "Javobni yuborish",
  "practice.words": "so'z",
  "practice.minWords": "Kamida {n} so'z yozing",
  "practice.yourBand": "Sizning ballingiz",
  "practice.criteria.task": "Task Achievement",
  "practice.criteria.coherence": "Coherence & Cohesion",
  "practice.criteria.lexical": "Lexical Resource",
  "practice.criteria.grammar": "Grammatical Range",
  "practice.strengths": "Kuchli tomonlar",
  "practice.improvements": "Nimani yaxshilash kerak",
  "practice.tryAgain": "Yangi mashq",
  "practice.correct": "To'g'ri",
  "practice.incorrect": "Noto'g'ri",
  "practice.playAudio": "Tinglash",
  "practice.replay": "Qayta eshitish",

  // --- Vocabulary ---
  "vocab.title": "So'z kartochkalari",
  "vocab.due": "Bugun takrorlash",
  "vocab.total": "Jami so'zlar",
  "vocab.learned": "O'zlashtirilgan",
  "vocab.showAnswer": "Javobni ko'rsatish",
  "vocab.again": "Qaytadan",
  "vocab.hard": "Qiyin",
  "vocab.good": "Yaxshi",
  "vocab.easy": "Oson",
  "vocab.empty.title": "Kartochkalar yo'q",
  "vocab.empty.body": "Darajangizga mos yangi so'zlar to'plamini yarating.",
  "vocab.generate": "Yangi so'zlar qo'shish",
  "vocab.allDone.title": "Bugungi takrorlash tugadi",
  "vocab.allDone.body": "Ertaga yangi kartochkalar tayyor bo'ladi.",

  // --- Pronunciation ---
  "pron.title": "Talaffuz mashqi",
  "pron.readAloud": "Quyidagi jumlani ovoz chiqarib o'qing",
  "pron.start": "Gapirish uchun bosing",
  "pron.stop": "To'xtatish",
  "pron.listening": "Yozilmoqda",
  "pron.heard": "Men eshitgan matn",
  "pron.accuracy": "Aniqlik",
  "pron.assessing": "Talaffuz baholanmoqda...",
  "pron.newSentence": "Yangi jumla",
  "pron.notSupported":
    "Brauzeringiz mikrofonni qo'llab-quvvatlamaydi.",
  "pron.permissionDenied": "Mikrofonga ruxsat berilmadi.",

  // --- Settings ---
  "settings.title": "Sozlamalar",
  "settings.language": "Interfeys tili",
  "settings.level": "CEFR darajasi",
  "settings.targetBand": "Maqsadli IELTS band",
  "settings.dailyGoal": "Kunlik maqsad",
  "settings.saved": "Saqlandi",
} as const;

/** Barcha kalitlar ro'yxati — TypeScript uchun */
export type TranslationKey = keyof typeof uz;

const ru: Record<TranslationKey, string> = {
  "app.name": "ExamFluent",
  "app.tagline": "Говори уверенно, подтверждай результатом",
  "common.continue": "Продолжить",
  "common.back": "Назад",
  "common.next": "Далее",
  "common.finish": "Завершить",
  "common.cancel": "Отмена",
  "common.save": "Сохранить",
  "common.loading": "Загрузка...",
  "common.error": "Произошла ошибка",
  "common.retry": "Повторить",
  "common.close": "Закрыть",
  "common.start": "Начать",
  "common.minutes": "мин",
  "common.questions": "вопросов",
  "common.of": "из",

  "nav.dashboard": "Главная",
  "nav.chat": "AI собеседник",
  "nav.practice": "IELTS задания",
  "nav.vocab": "Слова",
  "nav.pronunciation": "Произношение",
  "nav.settings": "Настройки",
  "nav.logout": "Выйти",

  "landing.hero.title": "Учите английский с AI",
  "landing.hero.subtitle":
    "Определите свой уровень CEFR, общайтесь с AI и отслеживайте свой балл IELTS в реальной оценке.",
  "landing.hero.cta": "Начать бесплатно",
  "landing.hero.login": "Войти",
  "landing.hero.note": "Без карты · Начнёте за 2 минуты",
  "landing.feature.placement.title": "Тест на определение уровня",
  "landing.feature.placement.body":
    "20 вопросов — и вы знаете свой точный уровень от A1 до C2.",
  "landing.feature.chat.title": "AI собеседник",
  "landing.feature.chat.body":
    "Говорит на вашем уровне и объясняет каждую ошибку.",
  "landing.feature.ielts.title": "Оценка IELTS",
  "landing.feature.ielts.body":
    "Задания Writing, Reading и Listening — каждое с band score.",
  "landing.feature.progress.title": "Отслеживание прогресса",
  "landing.feature.progress.body":
    "Серия дней, выученные слова и история band score на одном экране.",

  "landing.feature.vocab.title": "Карточки слов",
  "landing.feature.vocab.body":
    "Интервальное повторение: слово показывается, когда вы почти его забыли.",
  "landing.feature.pron.title": "Практика произношения",
  "landing.feature.pron.body":
    "Говорите в микрофон — увидите, какие слова распознаны верно.",

  "landing.scale.note": "Каждое задание подстраивается под ваш уровень",
  "landing.features.title": "Полная подготовка на одной платформе",
  "landing.skills.title": "Четыре части IELTS",
  "landing.demo.correctionNote": "Остальное написано верно",
  "landing.demo.explanation": "\"Yesterday\" — прошедшее время, поэтому \"went\".",

  "chat.lang.label": "Язык объяснений",
  "chat.lang.englishOnly": "Только английский",
  "chat.lang.bilingual": "И на моём языке",
  "chat.lang.hint": "Напишете по-русски — получите ответ по-русски",
  "chat.voice.autoOn": "Звук включён",
  "chat.voice.autoOff": "Звук выключен",
  "chat.voice.speak": "Прослушать",
  "chat.voice.stop": "Остановить",
  "chat.voice.mic": "Говорить",
  "chat.voice.listening": "Идёт запись",
  "chat.voice.notSupported": "Ваш браузер не поддерживает микрофон",
  "chat.voice.denied": "Доступ к микрофону не разрешён",
  "chat.translation": "Перевод",
  "chat.voice.startTalking": "Говорить голосом",
  "chat.voice.micLang": "Язык микрофона",
  "chat.voice.transcribing": "Распознаём речь...",
  "chat.voice.stopRecording": "Закончить запись",
  "chat.voice.pressToStop": "нажмите, чтобы закончить",
  "chat.voice.noSpeech": "Речь не распознана. Говорите громче.",
  "chat.voice.silent":
    "Микрофон не уловил звук. Возможно, выбран другой микрофон или он отключён — проверьте на /voice-test.",
  "chat.voice.convertFailed":
    "Микрофон уловил звук, но файл оказался тихим — это ошибка программы. Проверьте на /voice-test.",
  "chat.voice.noMic": "Микрофон не найден.",
  "chat.voice.serverVoice":
    "На компьютере нет английского голоса, используется голос Gemini (чуть медленнее).",
  "chat.voice.preparing": "Готовится...",
  "chat.voice.noEnglishVoice":
    "На компьютере нет английского голоса — произношение будет неверным.",
  "chat.voice.noVoice":
    "На компьютере не найден голос — AI не сможет говорить.",
  "chat.voice.diagnose": "Проверить",
  "chat.voice.howItWorks":
    "Нажмите кнопку, говорите, нажмите снова. Речь станет текстом, а AI ответит голосом.",

  "auth.signup.title": "Регистрация",
  "auth.signup.subtitle": "Создайте бесплатный аккаунт и определите уровень",
  "auth.login.title": "С возвращением",
  "auth.login.subtitle": "Войдите в свой аккаунт",
  "auth.email": "Email",
  "auth.password": "Пароль",
  "auth.fullName": "Ваше имя",
  "auth.google": "Продолжить с Google",
  "auth.or": "или",
  "auth.haveAccount": "Уже есть аккаунт?",
  "auth.noAccount": "Нет аккаунта?",
  "auth.signupLink": "Зарегистрироваться",
  "auth.loginLink": "Войти",
  "auth.submitSignup": "Создать аккаунт",
  "auth.submitLogin": "Войти",
  "auth.passwordHint": "Минимум 8 символов",
  "auth.checkEmail.title": "Проверьте почту",
  "auth.checkEmail.body":
    "Мы отправили ссылку для подтверждения. Перейдите по ней, чтобы активировать аккаунт.",
  "auth.error.invalidCredentials": "Неверный email или пароль",
  "auth.error.emailInUse": "Этот email уже зарегистрирован",
  "auth.error.weakPassword": "Слишком простой пароль — минимум 8 символов",
  "auth.error.generic": "Ошибка входа. Попробуйте ещё раз.",

  "placement.intro.title": "Определим ваш уровень",
  "placement.intro.body":
    "20 вопросов, около 10 минут. Не угадывайте — нажимайте «Не знаю», так результат будет точнее.",
  "placement.intro.rule1": "Не пользуйтесь словарём или переводчиком",
  "placement.intro.rule2": "Вопросы усложняются по вашим ответам",
  "placement.intro.rule3": "Тест можно пройти повторно в любое время",
  "placement.dontKnow": "Не знаю",
  "placement.progress": "Вопрос",
  "placement.analyzing": "Анализируем ваши ответы...",
  "placement.result.title": "Ваш уровень",
  "placement.result.bandLabel": "Примерный IELTS band",
  "placement.result.cta": "Начать обучение",
  "placement.result.retake": "Пройти тест заново",

  "dash.greeting": "Привет",
  "dash.yourLevel": "Ваш уровень",
  "dash.streak": "Дней подряд",
  "dash.words": "Выучено слов",
  "dash.band": "Последний band",
  "dash.noBand": "Пока нет",
  "dash.days": "дн.",
  "dash.startPlacement.title": "Сначала определите уровень",
  "dash.startPlacement.body":
    "Все задания подстраиваются под ваш уровень CEFR. Поэтому первый шаг — короткий тест.",
  "dash.startPlacement.cta": "Начать тест",
  "dash.continue.title": "Задание на сегодня",
  "dash.weeklyActivity": "Активность за неделю",
  "dash.bandHistory": "История band score",
  "dash.noData": "Данные собираются — выполните несколько заданий",
  "dash.quickChat": "Чат с AI",
  "dash.quickPractice": "Задание IELTS",
  "dash.quickVocab": "Повтор слов",
  "dash.quickPron": "Произношение",
  "dash.dueCards": "ждут повторения",

  "chat.title": "AI собеседник",
  "chat.placeholder": "Пишите по-английски...",
  "chat.send": "Отправить",
  "chat.newSession": "Новый диалог",
  "chat.scenario": "Тема",
  "chat.corrections": "Исправления",
  "chat.noCorrections": "Без ошибок! Отлично.",
  "chat.thinking": "AI печатает...",
  "chat.empty.title": "Начните диалог",
  "chat.empty.body":
    "Пишите по-английски. Я отвечу на вашем уровне и объясню каждую ошибку.",
  "chat.scenario.free_talk": "Свободный разговор",
  "chat.scenario.ielts_speaking_p1": "IELTS Speaking Part 1",
  "chat.scenario.ielts_speaking_p3": "IELTS Speaking Part 3",
  "chat.scenario.job_interview": "Собеседование",
  "chat.scenario.travel": "Путешествия",
  "chat.scenario.daily_life": "Повседневная жизнь",

  "practice.title": "Задания IELTS",
  "practice.subtitle": "Каждое задание оценивается по реальным критериям IELTS",
  "practice.reading": "Reading",
  "practice.writing": "Writing",
  "practice.listening": "Listening",
  "practice.speaking": "Speaking",
  "practice.reading.desc": "Прочитайте текст и ответьте на вопросы",
  "practice.writing.desc": "Напишите эссе — оценка по 4 критериям",
  "practice.listening.desc": "Прослушайте текст и ответьте на вопросы",
  "practice.speaking.desc": "Говорите в микрофон, произношение будет оценено",
  "practice.generating": "Готовим задание...",
  "practice.evaluating": "Оцениваем ваш ответ...",
  "practice.submit": "Отправить ответ",
  "practice.words": "слов",
  "practice.minWords": "Напишите минимум {n} слов",
  "practice.yourBand": "Ваш балл",
  "practice.criteria.task": "Task Achievement",
  "practice.criteria.coherence": "Coherence & Cohesion",
  "practice.criteria.lexical": "Lexical Resource",
  "practice.criteria.grammar": "Grammatical Range",
  "practice.strengths": "Сильные стороны",
  "practice.improvements": "Что улучшить",
  "practice.tryAgain": "Новое задание",
  "practice.correct": "Верно",
  "practice.incorrect": "Неверно",
  "practice.playAudio": "Прослушать",
  "practice.replay": "Ещё раз",

  "vocab.title": "Карточки слов",
  "vocab.due": "Повторить сегодня",
  "vocab.total": "Всего слов",
  "vocab.learned": "Освоено",
  "vocab.showAnswer": "Показать ответ",
  "vocab.again": "Заново",
  "vocab.hard": "Трудно",
  "vocab.good": "Хорошо",
  "vocab.easy": "Легко",
  "vocab.empty.title": "Карточек нет",
  "vocab.empty.body": "Создайте набор новых слов для вашего уровня.",
  "vocab.generate": "Добавить новые слова",
  "vocab.allDone.title": "Повторение на сегодня завершено",
  "vocab.allDone.body": "Завтра будут готовы новые карточки.",

  "pron.title": "Практика произношения",
  "pron.readAloud": "Прочитайте предложение вслух",
  "pron.start": "Нажмите, чтобы говорить",
  "pron.stop": "Остановить",
  "pron.listening": "Идёт запись",
  "pron.heard": "Что я услышал",
  "pron.accuracy": "Точность",
  "pron.assessing": "Оцениваем произношение...",
  "pron.newSentence": "Новое предложение",
  "pron.notSupported": "Ваш браузер не поддерживает микрофон.",
  "pron.permissionDenied": "Доступ к микрофону не разрешён.",

  "settings.title": "Настройки",
  "settings.language": "Язык интерфейса",
  "settings.level": "Уровень CEFR",
  "settings.targetBand": "Целевой IELTS band",
  "settings.dailyGoal": "Дневная цель",
  "settings.saved": "Сохранено",
};

const en: Record<TranslationKey, string> = {
  "app.name": "ExamFluent",
  "app.tagline": "Speak with confidence. Test with results.",
  "common.continue": "Continue",
  "common.back": "Back",
  "common.next": "Next",
  "common.finish": "Finish",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.loading": "Loading...",
  "common.error": "Something went wrong",
  "common.retry": "Try again",
  "common.close": "Close",
  "common.start": "Start",
  "common.minutes": "min",
  "common.questions": "questions",
  "common.of": "of",

  "nav.dashboard": "Dashboard",
  "nav.chat": "AI Tutor",
  "nav.practice": "IELTS Practice",
  "nav.vocab": "Vocabulary",
  "nav.pronunciation": "Pronunciation",
  "nav.settings": "Settings",
  "nav.logout": "Log out",

  "landing.hero.title": "Learn English with AI",
  "landing.hero.subtitle":
    "Find your CEFR level, talk with an AI tutor, and track your IELTS band with real assessment.",
  "landing.hero.cta": "Start free",
  "landing.hero.login": "Log in",
  "landing.hero.note": "No card required · Start in 2 minutes",
  "landing.feature.placement.title": "Placement test",
  "landing.feature.placement.body":
    "20 questions — and you know your exact level from A1 to C2.",
  "landing.feature.chat.title": "AI conversation tutor",
  "landing.feature.chat.body":
    "Speaks at your level and explains every mistake you make.",
  "landing.feature.ielts.title": "IELTS scoring",
  "landing.feature.ielts.body":
    "Writing, Reading and Listening tasks — each with a band score.",
  "landing.feature.progress.title": "Progress tracking",
  "landing.feature.progress.body":
    "Streak, learned words and band score history on a single screen.",

  "landing.feature.vocab.title": "Flashcards",
  "landing.feature.vocab.body":
    "Spaced repetition: a word comes back just before you would forget it.",
  "landing.feature.pron.title": "Pronunciation practice",
  "landing.feature.pron.body":
    "Speak into the mic and see exactly which words were understood.",

  "landing.scale.note": "Every exercise adapts to your level",
  "landing.features.title": "Everything you need in one place",
  "landing.skills.title": "The four IELTS papers",
  "landing.demo.correctionNote": "The rest of the sentence is correct",
  "landing.demo.explanation": "\"Yesterday\" means past tense, so use \"went\".",

  "chat.lang.label": "Explanation language",
  "chat.lang.englishOnly": "English only",
  "chat.lang.bilingual": "My language too",
  "chat.lang.hint": "Write in your language and get an answer in it",
  "chat.voice.autoOn": "Voice on",
  "chat.voice.autoOff": "Voice off",
  "chat.voice.speak": "Play",
  "chat.voice.stop": "Stop",
  "chat.voice.mic": "Speak",
  "chat.voice.listening": "Recording",
  "chat.voice.notSupported": "Your browser does not support the microphone",
  "chat.voice.denied": "Microphone access was denied",
  "chat.translation": "Translation",
  "chat.voice.startTalking": "Talk with your voice",
  "chat.voice.micLang": "Microphone language",
  "chat.voice.transcribing": "Turning your speech into text...",
  "chat.voice.stopRecording": "Finish recording",
  "chat.voice.pressToStop": "press to finish",
  "chat.voice.noSpeech": "No speech detected. Please speak louder.",
  "chat.voice.silent":
    "The microphone picked up no sound at all. A different mic may be selected or muted — check /voice-test.",
  "chat.voice.convertFailed":
    "The microphone picked up sound but the file came out silent — that is a bug. Check /voice-test.",
  "chat.voice.noMic": "No microphone found.",
  "chat.voice.serverVoice":
    "No English voice on your computer, so the Gemini voice is used (slightly slower).",
  "chat.voice.preparing": "Preparing...",
  "chat.voice.noEnglishVoice":
    "No English voice on your computer — pronunciation will be wrong.",
  "chat.voice.noVoice":
    "No voice found on your computer — the AI cannot speak.",
  "chat.voice.diagnose": "Check",
  "chat.voice.howItWorks":
    "Press the button, speak, press again. Your speech becomes text and the AI answers out loud.",

  "auth.signup.title": "Create account",
  "auth.signup.subtitle": "Sign up free and find your level",
  "auth.login.title": "Welcome back",
  "auth.login.subtitle": "Log in to your account",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.fullName": "Your name",
  "auth.google": "Continue with Google",
  "auth.or": "or",
  "auth.haveAccount": "Already have an account?",
  "auth.noAccount": "Don't have an account?",
  "auth.signupLink": "Sign up",
  "auth.loginLink": "Log in",
  "auth.submitSignup": "Create account",
  "auth.submitLogin": "Log in",
  "auth.passwordHint": "At least 8 characters",
  "auth.checkEmail.title": "Check your email",
  "auth.checkEmail.body":
    "We sent you a confirmation link. Click it to activate your account.",
  "auth.error.invalidCredentials": "Invalid email or password",
  "auth.error.emailInUse": "This email is already registered",
  "auth.error.weakPassword": "Password too weak — use at least 8 characters",
  "auth.error.generic": "Sign-in failed. Please try again.",

  "placement.intro.title": "Let's find your level",
  "placement.intro.body":
    "20 questions, about 10 minutes. Don't guess — press \"I don't know\" for a more accurate result.",
  "placement.intro.rule1": "Do not use a dictionary or translator",
  "placement.intro.rule2": "Questions adapt to your answers",
  "placement.intro.rule3": "You can retake the test any time",
  "placement.dontKnow": "I don't know",
  "placement.progress": "Question",
  "placement.analyzing": "Analysing your answers...",
  "placement.result.title": "Your level",
  "placement.result.bandLabel": "Estimated IELTS band",
  "placement.result.cta": "Start learning",
  "placement.result.retake": "Retake the test",

  "dash.greeting": "Hi",
  "dash.yourLevel": "Your level",
  "dash.streak": "Day streak",
  "dash.words": "Words learned",
  "dash.band": "Latest band",
  "dash.noBand": "Not yet",
  "dash.days": "days",
  "dash.startPlacement.title": "First, find your level",
  "dash.startPlacement.body":
    "Every exercise adapts to your CEFR level. So step one is a short test.",
  "dash.startPlacement.cta": "Start the test",
  "dash.continue.title": "Today's practice",
  "dash.weeklyActivity": "Weekly activity",
  "dash.bandHistory": "Band score history",
  "dash.noData": "Collecting data — complete a few exercises",
  "dash.quickChat": "Chat with AI",
  "dash.quickPractice": "IELTS task",
  "dash.quickVocab": "Review words",
  "dash.quickPron": "Pronunciation",
  "dash.dueCards": "due for review",

  "chat.title": "AI Tutor",
  "chat.placeholder": "Write in English...",
  "chat.send": "Send",
  "chat.newSession": "New conversation",
  "chat.scenario": "Topic",
  "chat.corrections": "Corrections",
  "chat.noCorrections": "No mistakes! Excellent.",
  "chat.thinking": "AI is typing...",
  "chat.empty.title": "Start the conversation",
  "chat.empty.body":
    "Write in English. I'll reply at your level and explain every mistake.",
  "chat.scenario.free_talk": "Free talk",
  "chat.scenario.ielts_speaking_p1": "IELTS Speaking Part 1",
  "chat.scenario.ielts_speaking_p3": "IELTS Speaking Part 3",
  "chat.scenario.job_interview": "Job interview",
  "chat.scenario.travel": "Travel",
  "chat.scenario.daily_life": "Daily life",

  "practice.title": "IELTS practice",
  "practice.subtitle": "Every task is scored against real IELTS criteria",
  "practice.reading": "Reading",
  "practice.writing": "Writing",
  "practice.listening": "Listening",
  "practice.speaking": "Speaking",
  "practice.reading.desc": "Read the passage and answer the questions",
  "practice.writing.desc": "Write an essay — scored on 4 criteria",
  "practice.listening.desc": "Listen to the passage and answer the questions",
  "practice.speaking.desc": "Speak into the mic and get pronunciation feedback",
  "practice.generating": "Preparing your task...",
  "practice.evaluating": "Scoring your answer...",
  "practice.submit": "Submit answer",
  "practice.words": "words",
  "practice.minWords": "Write at least {n} words",
  "practice.yourBand": "Your band",
  "practice.criteria.task": "Task Achievement",
  "practice.criteria.coherence": "Coherence & Cohesion",
  "practice.criteria.lexical": "Lexical Resource",
  "practice.criteria.grammar": "Grammatical Range",
  "practice.strengths": "Strengths",
  "practice.improvements": "What to improve",
  "practice.tryAgain": "New task",
  "practice.correct": "Correct",
  "practice.incorrect": "Incorrect",
  "practice.playAudio": "Play",
  "practice.replay": "Replay",

  "vocab.title": "Flashcards",
  "vocab.due": "Due today",
  "vocab.total": "Total words",
  "vocab.learned": "Mastered",
  "vocab.showAnswer": "Show answer",
  "vocab.again": "Again",
  "vocab.hard": "Hard",
  "vocab.good": "Good",
  "vocab.easy": "Easy",
  "vocab.empty.title": "No flashcards yet",
  "vocab.empty.body": "Generate a new set of words for your level.",
  "vocab.generate": "Add new words",
  "vocab.allDone.title": "Review complete for today",
  "vocab.allDone.body": "New cards will be ready tomorrow.",

  "pron.title": "Pronunciation practice",
  "pron.readAloud": "Read this sentence aloud",
  "pron.start": "Press to speak",
  "pron.stop": "Stop",
  "pron.listening": "Recording",
  "pron.heard": "What I heard",
  "pron.accuracy": "Accuracy",
  "pron.assessing": "Assessing your pronunciation...",
  "pron.newSentence": "New sentence",
  "pron.notSupported": "Your browser does not support the microphone.",
  "pron.permissionDenied": "Microphone access was denied.",

  "settings.title": "Settings",
  "settings.language": "Interface language",
  "settings.level": "CEFR level",
  "settings.targetBand": "Target IELTS band",
  "settings.dailyGoal": "Daily goal",
  "settings.saved": "Saved",
};

export const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  uz,
  ru,
  en,
};

/**
 * Tarjimani oladi. `vars` bilan {n} kabi o'rinbosarlarni almashtirish mumkin:
 *   translate('uz', 'practice.minWords', { n: 250 })  →  "Kamida 250 so'z yozing"
 */
export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  let text = dictionaries[locale]?.[key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

/** Noma'lum qiymatni xavfsiz Locale'ga aylantiradi */
export function normalizeLocale(value: unknown): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}
