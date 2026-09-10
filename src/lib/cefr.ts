/**
 * CEFR (Common European Framework of Reference) — butun platformaning
 * "o'lchov birligi". Har bir mashq, har bir AI javobi shu darajaga moslanadi.
 *
 * Bu fayl SOF TypeScript — hech qanday React yoki tashqi kutubxona yo'q.
 * Shuning uchun uni serverda ham, brauzerda ham ishlatish mumkin.
 */

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

/** Berilgan matn haqiqiy CEFR darajasimi? (AI javobini tekshirish uchun) */
export function isCefrLevel(value: unknown): value is CefrLevel {
  return typeof value === "string" && (CEFR_LEVELS as readonly string[]).includes(value);
}

/** Darajani raqamga aylantiradi: A1 → 0, C2 → 5. Solishtirish uchun qulay. */
export function cefrIndex(level: CefrLevel): number {
  return CEFR_LEVELS.indexOf(level);
}

/** Bir pog'ona yuqori daraja (C2 bo'lsa — o'zi qoladi). */
export function nextLevel(level: CefrLevel): CefrLevel {
  return CEFR_LEVELS[Math.min(cefrIndex(level) + 1, CEFR_LEVELS.length - 1)];
}

// ---------------------------------------------------------------------------
//  CEFR ↔ IELTS band moslashuvi
// ---------------------------------------------------------------------------
// Bu British Council / Cambridge tavsiya qilgan taxminiy jadval.
// "min" va "max" — shu CEFR darajasiga mos band oralig'i.
// ---------------------------------------------------------------------------
export const CEFR_TO_IELTS: Record<CefrLevel, { min: number; max: number; typical: number }> = {
  // A1 uchun quyi chegara 2.0 — 0 ga tushirmaymiz. Sabab: IELTS'da 0-1 ball
  // "umuman javob bermagan" degani. Mashqni bajargan, lekin xato qilgan
  // boshlovchiga "band 0.5" ko'rsatish adolatsiz va ruhini tushiradi.
  A1: { min: 2.0, max: 3.0, typical: 2.5 },
  A2: { min: 3.0, max: 4.0, typical: 3.5 },
  B1: { min: 4.0, max: 5.0, typical: 4.5 },
  B2: { min: 5.5, max: 6.5, typical: 6.0 },
  C1: { min: 7.0, max: 8.0, typical: 7.5 },
  C2: { min: 8.5, max: 9.0, typical: 8.5 },
};

/** IELTS band ballidan taxminiy CEFR darajasini chiqaradi. */
export function bandToCefr(band: number): CefrLevel {
  if (band >= 8.5) return "C2";
  if (band >= 7.0) return "C1";
  if (band >= 5.5) return "B2";
  if (band >= 4.0) return "B1";
  if (band >= 3.0) return "A2";
  return "A1";
}

/** IELTS ballari faqat 0.5 qadam bilan bo'ladi (6.0, 6.5, 7.0...). */
export function roundToHalfBand(value: number): number {
  const clamped = Math.max(0, Math.min(9, value));
  return Math.round(clamped * 2) / 2;
}

// ---------------------------------------------------------------------------
//  Har bir daraja haqida ma'lumot (interfeysda ko'rsatish uchun)
// ---------------------------------------------------------------------------
export interface CefrMeta {
  level: CefrLevel;
  /** Rasmiy nomi (ingliz tilida) */
  title: string;
  /** Qisqa tavsif — o'zbekcha */
  uz: string;
  /** Qisqa tavsif — ruscha */
  ru: string;
  /** Tailwind rang klasslari (badge uchun) */
  badge: string;
  /** Progress bar uchun rang */
  bar: string;
}

export const CEFR_META: Record<CefrLevel, CefrMeta> = {
  A1: {
    level: "A1",
    title: "Beginner",
    uz: "Eng sodda so'z va iboralarni tushunasiz, o'zingizni tanishtira olasiz.",
    ru: "Понимаете простейшие слова и фразы, можете представиться.",
    badge: "bg-ink-100 text-ink-700 ring-ink-200",
    bar: "bg-ink-400",
  },
  A2: {
    level: "A2",
    title: "Elementary",
    uz: "Kundalik mavzularda sodda gaplar tuzasiz: oila, xarid, ish.",
    ru: "Строите простые предложения на бытовые темы: семья, покупки, работа.",
    badge: "bg-sky-100 text-sky-800 ring-sky-200",
    bar: "bg-sky-500",
  },
  B1: {
    level: "B1",
    title: "Intermediate",
    uz: "Tanish mavzularda erkin gaplashasiz, fikringizni asoslay olasiz.",
    ru: "Свободно говорите на знакомые темы, можете обосновать мнение.",
    badge: "bg-brand-100 text-brand-800 ring-brand-200",
    bar: "bg-brand-500",
  },
  B2: {
    level: "B2",
    title: "Upper-Intermediate",
    uz: "Murakkab matnlarni tushunasiz, ona tilida so'zlashuvchi bilan bemalol suhbatlashasiz.",
    ru: "Понимаете сложные тексты, свободно общаетесь с носителем языка.",
    badge: "bg-indigo-100 text-indigo-800 ring-indigo-200",
    bar: "bg-indigo-500",
  },
  C1: {
    level: "C1",
    title: "Advanced",
    uz: "Ilmiy va professional matnlarni erkin ishlatasiz, nozik ma'nolarni ilg'aysiz.",
    ru: "Свободно владеете научными и профессиональными текстами, улавливаете нюансы.",
    badge: "bg-accent-100 text-accent-800 ring-accent-200",
    bar: "bg-accent-500",
  },
  C2: {
    level: "C2",
    title: "Proficient",
    uz: "Deyarli ona tilidagidek — har qanday matn va suhbatni erkin boshqarasiz.",
    ru: "Практически как носитель — свободно владеете любым текстом и беседой.",
    badge: "bg-amber-100 text-amber-900 ring-amber-200",
    bar: "bg-amber-500",
  },
};

// ---------------------------------------------------------------------------
//  AI uchun "til qoidalari"
// ---------------------------------------------------------------------------
// Bu matnlar Gemini'ga system prompt sifatida yuboriladi. Ular AI'ni
// foydalanuvchi darajasidan yuqori/past gapirib yubormasligini ta'minlaydi.
// Bu — platformaning eng muhim qismlaridan biri.
// ---------------------------------------------------------------------------
export const CEFR_AI_GUIDE: Record<CefrLevel, string> = {
  A1: `Use ONLY the ~500 most frequent English words. Present simple and "to be" only. Maximum 8 words per sentence. One idea per sentence. No idioms, no phrasal verbs, no passive voice. Ask very short questions.`,
  A2: `Use the ~1000 most frequent words. Present simple/continuous, past simple, "going to" future. Maximum 12 words per sentence. Very common phrasal verbs only (get up, look for). No idioms.`,
  B1: `Use the ~2000 most frequent words. All basic tenses, first and second conditionals, common phrasal verbs. Maximum 18 words per sentence. Occasional very common idioms, explained if used.`,
  B2: `Use ~4000 words including some abstract vocabulary. All tenses, all conditionals, passive voice, relative clauses. Natural sentence length. Idioms and collocations are welcome. Challenge the learner with follow-up questions.`,
  C1: `Use rich, precise vocabulary including low-frequency and academic words. Complex syntax, nuanced modality, hedging. Discuss abstract and specialised topics. Push for register awareness and precision.`,
  C2: `Speak exactly as with an educated native speaker. Use sophisticated register shifts, irony, cultural references, and highly idiomatic language. Critique subtle stylistic choices, not just correctness.`,
};

/** Suhbat mavzulari — har daraja uchun mos ro'yxat. */
export const CEFR_TOPICS: Record<CefrLevel, string[]> = {
  A1: ["Introducing yourself", "My family", "Food and drinks", "Numbers and time", "Colours and clothes"],
  A2: ["Daily routine", "Shopping", "Directions in a city", "Weather", "My last holiday"],
  B1: ["Work and career", "Travel experiences", "Health and fitness", "Technology at home", "Films and books"],
  B2: ["Education systems", "Environment and climate", "Social media effects", "Remote work", "Cultural differences"],
  C1: ["Economic inequality", "Ethics of AI", "Urban planning", "Media bias", "Scientific research"],
  C2: ["Philosophy of language", "Geopolitical strategy", "Literary criticism", "Bioethics", "Monetary policy"],
};

// ---------------------------------------------------------------------------
//  Reading / Listening mashqlari uchun band bahosi
// ---------------------------------------------------------------------------
/**
 * Mashq foydalanuvchining O'Z darajasida yaratilgani uchun, uni to'liq
 * bajarish = shu darajaning yuqori chegarasi degani.
 *
 * Masalan B2 (5.5-6.5):
 *    100% to'g'ri  -> 6.5
 *    50%  to'g'ri  -> 6.0
 *    0%   to'g'ri  -> 5.5
 *
 * Bu usul halol: ballni oshirib yubormaydi va real IELTS jadvaliga mos keladi.
 */
export function estimateBandFromAccuracy(level: CefrLevel, accuracy: number): number {
  const { min, max } = CEFR_TO_IELTS[level];
  const clamped = Math.max(0, Math.min(1, accuracy));
  return roundToHalfBand(min + clamped * (max - min));
}
