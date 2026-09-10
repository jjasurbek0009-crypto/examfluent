/**
 * Mashq tokeni ichidagi ma'lumot turi.
 *
 * Alohida faylda turibdi, chunki uni IKKI marshrut ham ishlatadi:
 *   - /api/practice/generate  (yozadi)
 *   - /api/practice/evaluate  (o'qiydi)
 *
 * Route fayllaridan import qilish tavsiya etilmaydi, shuning uchun
 * umumiy turlar shu yerda saqlanadi.
 */

import type { CefrLevel } from "@/lib/cefr";
import type { ComprehensionTask, PracticeSkill, WritingTask } from "@/lib/prompts/practice";

export interface SealedTask {
  skill: PracticeSkill;
  level: CefrLevel;
  /** Yaratilgan vaqt (ms) — eski tokenlarni rad etish uchun */
  at: number;

  /** Reading va Listening uchun */
  comprehension?: {
    task: ComprehensionTask;
    answers: number[];
    explanations: string[];
  };

  /** Writing uchun */
  writing?: WritingTask;
}

/** Baholangan bitta savol (brauzerga natija sifatida qaytadi) */
export interface QuestionResult {
  question: string;
  options: string[];
  chosen: number | null;
  correctIndex: number;
  correct: boolean;
  explanation: string;
}
