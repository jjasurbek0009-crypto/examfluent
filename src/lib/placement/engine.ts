/**
 * ADAPTIV TEST MOTORI va BAHOLASH.
 *
 * Adaptiv degani: savollar sizning javoblaringizga qarab tanlanadi.
 *   - Ketma-ket 2 ta to'g'ri  → daraja bir pog'ona ko'tariladi
 *   - Ketma-ket 2 ta noto'g'ri → daraja bir pog'ona tushadi
 *
 * Nima uchun shunday? Chunki C1 darajadagi odamdan 20 ta A1 savoli
 * so'rash ma'nosiz — vaqtni behuda sarflaydi va natija ham aniq bo'lmaydi.
 * Adaptiv usul bilan 20 ta savol 40 ta savolcha ma'lumot beradi.
 *
 * Bu fayl sof funksiyalardan iborat — hech qanday React yoki baza yo'q.
 * Shu sabab uni brauzerda ham, serverda ham ishonchli ishlatish mumkin.
 */

import { CEFR_LEVELS, type CefrLevel } from "@/lib/cefr";
import {
  BANK_BY_LEVEL,
  PLACEMENT_LENGTH,
  type PlacementQuestion,
  type QuestionSkill,
} from "./questions";

/** Test qaysi darajadan boshlanadi (B1 — o'rtacha nuqta) */
const START_LEVEL_INDEX = 2;

/** Foydalanuvchining bitta savolga bergan javobi */
export interface AnswerRecord {
  questionId: string;
  level: CefrLevel;
  skill: QuestionSkill;
  /** Tanlangan variant raqami; "Bilmayman" bo'lsa — null */
  chosen: number | null;
  correct: boolean;
}

/** Testning joriy holati */
export interface TestState {
  askedIds: string[];
  currentLevelIndex: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
}

export function createInitialState(): TestState {
  return {
    askedIds: [],
    currentLevelIndex: START_LEVEL_INDEX,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
  };
}

/**
 * Berilgan darajadan hali so'ralmagan savolni tanlaydi.
 * Agar o'sha darajada savol qolmagan bo'lsa — eng yaqin darajaga o'tadi.
 */
export function pickNextQuestion(state: TestState): PlacementQuestion | null {
  const asked = new Set(state.askedIds);

  // Joriy darajadan boshlab, chapga-o'ngga kengayib qidiramiz:
  // masalan B1 bo'lsa: B1 → A2 → B2 → A1 → C1 → ...
  for (let distance = 0; distance < CEFR_LEVELS.length; distance++) {
    for (const direction of distance === 0 ? [0] : [-1, 1]) {
      const index = state.currentLevelIndex + direction * distance;
      if (index < 0 || index >= CEFR_LEVELS.length) continue;

      const pool = (BANK_BY_LEVEL[CEFR_LEVELS[index]] ?? []).filter(
        (q) => !asked.has(q.id),
      );
      if (pool.length > 0) {
        // Tasodifiy tanlaymiz — har safar bir xil test bo'lib qolmasin
        return pool[Math.floor(Math.random() * pool.length)];
      }
    }
  }

  return null; // Bazadagi barcha savollar tugadi
}

/** Javobdan keyin holatni yangilaydi (daraja ko'tarish/tushirish) */
export function applyAnswer(
  state: TestState,
  question: PlacementQuestion,
  correct: boolean,
): TestState {
  let { currentLevelIndex, consecutiveCorrect, consecutiveWrong } = state;

  if (correct) {
    consecutiveCorrect += 1;
    consecutiveWrong = 0;
    if (consecutiveCorrect >= 2) {
      currentLevelIndex = Math.min(currentLevelIndex + 1, CEFR_LEVELS.length - 1);
      consecutiveCorrect = 0;
    }
  } else {
    consecutiveWrong += 1;
    consecutiveCorrect = 0;
    if (consecutiveWrong >= 2) {
      currentLevelIndex = Math.max(currentLevelIndex - 1, 0);
      consecutiveWrong = 0;
    }
  }

  return {
    askedIds: [...state.askedIds, question.id],
    currentLevelIndex,
    consecutiveCorrect,
    consecutiveWrong,
  };
}

export function isFinished(state: TestState): boolean {
  return state.askedIds.length >= PLACEMENT_LENGTH;
}

// ---------------------------------------------------------------------------
//  BAHOLASH
// ---------------------------------------------------------------------------

export interface PlacementResult {
  level: CefrLevel;
  rawScore: number;
  total: number;
  /** Ko'nikma bo'yicha aniqlik: {grammar: 0.75, vocabulary: 0.6, reading: 1} */
  breakdown: Record<QuestionSkill, number | null>;
  /** Har bir daraja bo'yicha natija — natijani tushuntirish uchun */
  perLevel: Array<{ level: CefrLevel; asked: number; correct: number; passed: boolean }>;
}

/**
 * Daraja "o'zlashtirilgan" hisoblanishi uchun kerakli aniqlik.
 * 0.6 — ya'ni shu darajadagi savollarning kamida 60% i to'g'ri.
 * Bu Cambridge/Pearson placement testlarida qo'llaniladigan odatiy chegara.
 */
const PASS_THRESHOLD = 0.6;

/** Daraja hisoblanishi uchun kamida shuncha savol so'ralgan bo'lishi kerak */
const MIN_QUESTIONS_PER_LEVEL = 2;

export function scoreTest(answers: AnswerRecord[]): PlacementResult {
  const rawScore = answers.filter((a) => a.correct).length;

  // ---- 1) Daraja bo'yicha guruhlash ----
  const perLevel = CEFR_LEVELS.map((level) => {
    const at = answers.filter((a) => a.level === level);
    const correct = at.filter((a) => a.correct).length;
    const passed =
      at.length >= MIN_QUESTIONS_PER_LEVEL && correct / at.length >= PASS_THRESHOLD;
    return { level, asked: at.length, correct, passed };
  });

  // ---- 2) Eng yuqori "o'zlashtirilgan" daraja ----
  let level: CefrLevel = "A1";
  for (const row of perLevel) {
    if (row.passed) level = row.level;
  }

  // ---- 3) Ehtiyot chorasi ----
  // Agar umumiy natija juda past bo'lsa (30% dan kam), yuqori daraja
  // qo'yish adolatsiz bo'ladi — A1 ga tushiramiz.
  if (answers.length > 0 && rawScore / answers.length < 0.3) {
    level = "A1";
  }

  // ---- 4) Ko'nikmalar bo'yicha tafsilot ----
  const skills: QuestionSkill[] = ["grammar", "vocabulary", "reading"];
  const breakdown = skills.reduce(
    (acc, skill) => {
      const at = answers.filter((a) => a.skill === skill);
      acc[skill] = at.length === 0
        ? null
        : Math.round((at.filter((a) => a.correct).length / at.length) * 100) / 100;
      return acc;
    },
    {} as Record<QuestionSkill, number | null>,
  );

  return { level, rawScore, total: answers.length, breakdown, perLevel };
}

// ---------------------------------------------------------------------------
//  VARIANTLARNI ARALASHTIRISH
// ---------------------------------------------------------------------------
/**
 * MUAMMO: savollar bazasida to'g'ri javob har doim birinchi o'rinda turadi
 * (`answer: 0`). Agar shundayligicha ko'rsatsak, foydalanuvchi naqshni sezib
 * qoladi va test ma'nosini yo'qotadi.
 *
 * YECHIM: variantlarni har bir foydalanuvchi uchun aralashtiramiz.
 *
 * Lekin aralashtirish TASODIFIY bo'lsa bo'lmaydi: server holatni saqlamaydi,
 * ya'ni baholash paytida savol qayta aralashtiriladi. Agar tartib har safar
 * boshqacha chiqsa, javoblar mos kelmay qoladi.
 *
 * Shuning uchun "urug'" (seed) — foydalanuvchi id'si + savol id'si. Bu
 * juftlik uchun tartib HAR DOIM bir xil chiqadi, lekin har bir foydalanuvchida
 * boshqacha bo'ladi.
 */

/** Matnni barqaror songa aylantiradi (FNV-1a hash algoritmi) */
function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Urug'dan barqaror tasodifiy sonlar ketma-ketligi (mulberry32) */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ShuffledQuestion {
  options: string[];
  /** To'g'ri javobning YANGI tartibdagi o'rni */
  answerIndex: number;
}

/**
 * Savol variantlarini barqaror tartibda aralashtiradi.
 * Bir xil `seed` har doim bir xil natija beradi.
 */
export function shuffleOptions(
  question: PlacementQuestion,
  seed: string,
): ShuffledQuestion {
  const random = seededRandom(hashSeed(seed));

  // Har bir variantni asl o'rni bilan birga saqlaymiz
  const indexed = question.options.map((option, index) => ({ option, index }));

  // Fisher-Yates aralashtirish
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }

  return {
    options: indexed.map((x) => x.option),
    answerIndex: indexed.findIndex((x) => x.index === question.answer),
  };
}
