/**
 * Baza jadvallariga mos TypeScript turlari.
 *
 * Nima uchun kerak? TypeScript "profile.cefr_lvl" deb xato yozsangiz,
 * kodni yozish paytidayoq ogohlantiradi — dastur ishga tushgandan keyin emas.
 */

import type { CefrLevel } from "./cefr";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  ui_lang: "uz" | "ru" | "en";
  cefr_level: CefrLevel | null;
  placement_done: boolean;
  target_exam: "ielts" | "general" | "toefl";
  target_band: number | null;
  daily_goal_min: number;
  streak_count: number;
  longest_streak: number;
  last_active_date: string | null;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

/** AI topgan bitta xato */
export interface Correction {
  original: string;
  corrected: string;
  type: "grammar" | "vocabulary" | "spelling" | "word-order" | "article" | "preposition" | "style";
  explanation: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  scenario: string;
  cefr_level: CefrLevel | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  corrections: Correction[] | null;
  created_at: string;
}

export type Skill = "reading" | "writing" | "listening" | "speaking";

/** IELTS Writing'ning 4 rasmiy mezoni */
export interface BandCriteria {
  task: number;
  coherence: number;
  lexical: number;
  grammar: number;
}

export interface ExerciseFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  corrections: Correction[];
}

export interface ExerciseAttempt {
  id: string;
  user_id: string;
  skill: Skill;
  task_type: string | null;
  cefr_level: CefrLevel | null;
  prompt: unknown;
  user_response: unknown;
  band_score: number | null;
  criteria: BandCriteria | null;
  feedback: ExerciseFeedback | null;
  duration_sec: number | null;
  created_at: string;
}

export interface VocabCard {
  id: string;
  user_id: string;
  word: string;
  part_of_speech: string | null;
  definition_en: string | null;
  example_en: string | null;
  translation_uz: string | null;
  translation_ru: string | null;
  cefr_level: CefrLevel | null;
  source: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  due_date: string;
  last_reviewed_at: string | null;
  created_at: string;
}

export interface DailyActivity {
  user_id: string;
  activity_date: string;
  xp: number;
  minutes: number;
  chat_messages: number;
  exercises: number;
  cards_reviewed: number;
}
