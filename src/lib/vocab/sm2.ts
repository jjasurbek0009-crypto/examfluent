/**
 * SM-2 — INTERVALLI TAKRORLASH ALGORITMI.
 *
 * G'oyasi: so'zni unutishga yaqin qolganda takrorlash eng samarali.
 * Shuning uchun oson so'zlar kamdan-kam, qiyinlari esa tez-tez ko'rsatiladi.
 *
 * Bu algoritm 1987-yilda SuperMemo uchun yaratilgan va bugungacha
 * Anki, Duolingo va boshqa platformalarda asos bo'lib xizmat qiladi.
 *
 * Uchta raqam bilan ishlaydi:
 *   repetitions  — ketma-ket nechta marta to'g'ri eslandi
 *   interval     — necha kundan keyin qayta ko'rsatilsin
 *   easeFactor   — so'zning "osonlik koeffitsienti" (1.3 dan 2.5+ gacha)
 */

/** Foydalanuvchi bosadigan tugmalar */
export const GRADES = ["again", "hard", "good", "easy"] as const;
export type Grade = (typeof GRADES)[number];

/**
 * Tugmalarni SM-2 ning 0-5 shkalasiga o'girish.
 * 3 dan kichik bo'lsa — "eslay olmadi" hisoblanadi.
 */
const GRADE_QUALITY: Record<Grade, number> = {
  again: 2, // eslay olmadi
  hard: 3, // qiynalib esladi
  good: 4, // normal esladi
  easy: 5, // darhol esladi
};

export function isGrade(value: unknown): value is Grade {
  return typeof value === "string" && (GRADES as readonly string[]).includes(value);
}

export interface CardSchedule {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
}

export interface ScheduleResult extends CardSchedule {
  /** Keyingi takrorlash sanasi (YYYY-MM-DD) */
  dueDate: string;
}

/** Minimal osonlik koeffitsienti — SM-2 mualliflari tavsiyasi */
const MIN_EASE = 1.3;

export function schedule(current: CardSchedule, grade: Grade): ScheduleResult {
  const q = GRADE_QUALITY[grade];

  let { easeFactor, intervalDays, repetitions, lapses } = current;

  if (q < 3) {
    // ---- Eslay olmadi: hammasi qaytadan boshlanadi ----
    repetitions = 0;
    intervalDays = 1; // ertaga yana ko'rsatamiz
    lapses += 1;
  } else {
    // ---- Esladi ----
    repetitions += 1;

    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }

    // "Qiyin" deb belgilansa, oraliqni qisqartiramiz
    if (grade === "hard") {
      intervalDays = Math.max(1, Math.round(intervalDays * 0.6));
    }
  }

  // ---- Osonlik koeffitsientini yangilaymiz (SM-2 ning asosiy formulasi) ----
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < MIN_EASE) easeFactor = MIN_EASE;

  // Juda uzoq oraliqlar ma'nosiz — 1 yil bilan cheklaymiz
  intervalDays = Math.min(intervalDays, 365);

  const due = new Date();
  due.setDate(due.getDate() + intervalDays);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    intervalDays,
    repetitions,
    lapses,
    dueDate: due.toISOString().slice(0, 10),
  };
}

/**
 * So'z "o'zlashtirilgan" hisoblanadimi?
 * Oraliq 21 kundan oshgan bo'lsa — uzoq muddatli xotiraga o'tgan deb hisoblanadi.
 */
export const MASTERED_INTERVAL_DAYS = 21;

export function isMastered(intervalDays: number): boolean {
  return intervalDays >= MASTERED_INTERVAL_DAYS;
}
