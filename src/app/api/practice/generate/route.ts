/**
 * IELTS MASHQI YARATISH.
 *
 * Foydalanuvchi "Reading" tugmasini bosganda shu manzil chaqiriladi.
 * AI mashqni yaratadi, server esa uni ikkiga ajratadi:
 *
 *   1. `task`  — brauzerga yuboriladigan qism (matn va savollar)
 *   2. `token` — SHIFRLANGAN qism (to'g'ri javoblar + izohlar)
 *
 * Token brauzerda ochilmaydi. Javob berilganda u qaytib keladi va
 * /api/practice/evaluate uni ochib, baholaydi.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON, GeminiError } from "@/lib/gemini";
import { seal } from "@/lib/crypto";
import {
  buildComprehensionPrompt,
  buildWritingTaskPrompt,
  COMPREHENSION_SCHEMA,
  isPracticeSkill,
  randomTopic,
  WRITING_TASK_SCHEMA,
  type ComprehensionTask,
  type RawComprehension,
  type WritingTask,
} from "@/lib/prompts/practice";
import { isCefrLevel, type CefrLevel } from "@/lib/cefr";
import type { SealedTask } from "@/lib/practice/types";
import { normalizeLocale } from "@/lib/i18n/dictionaries";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** Writing uchun minimal so'z soni — darajaga moslashtirilgan */
const MIN_WORDS: Record<CefrLevel, number> = {
  A1: 60,
  A2: 100,
  B1: 150,
  B2: 250, // real IELTS talabi
  C1: 250,
  C2: 250,
};

export async function POST(request: Request) {
  // ---- 1) Foydalanuvchi ----
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // ---- 2) So'rov ----
  let body: { skill?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!isPracticeSkill(body.skill)) {
    return NextResponse.json({ error: "unknown_skill" }, { status: 400 });
  }

  const skill = body.skill;
  const locale = normalizeLocale(body.locale);

  // ---- 3) Daraja ----
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("cefr_level")
    .eq("id", user.id)
    .single();

  const profile = profileRow as Pick<Profile, "cefr_level"> | null;
  const level: CefrLevel = isCefrLevel(profile?.cefr_level) ? profile.cefr_level : "B1";

  try {
    // =====================================================================
    //  WRITING
    // =====================================================================
    if (skill === "writing") {
      const generated = await generateJSON<{ prompt: string }>({
        prompt: buildWritingTaskPrompt(level),
        schema: WRITING_TASK_SCHEMA,
        temperature: 1.0, // har safar yangi mavzu chiqsin
        maxOutputTokens: 400,
      });

      const task: WritingTask = {
        taskType: "task2",
        prompt: generated.prompt.trim(),
        minWords: MIN_WORDS[level],
        timeMinutes: 40,
      };

      return NextResponse.json({
        skill,
        level,
        task,
        token: seal({ skill, level, at: Date.now(), writing: task } satisfies SealedTask),
      });
    }

    // =====================================================================
    //  READING / LISTENING
    // =====================================================================
    const raw = await generateJSON<RawComprehension>({
      prompt: buildComprehensionPrompt(skill, level, locale, randomTopic()),
      schema: COMPREHENSION_SCHEMA,
      temperature: 1.0,
      maxOutputTokens: 2400,
    });

    // AI xato qilishi mumkin — natijani tozalaymiz va tekshiramiz
    const questions = (raw.questions ?? [])
      .filter(
        (q) =>
          q &&
          typeof q.question === "string" &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          Number.isInteger(q.answerIndex) &&
          q.answerIndex >= 0 &&
          q.answerIndex < 4,
      )
      .slice(0, 5);

    if (!raw.passage || questions.length < 3) {
      return NextResponse.json({ error: "generation_failed" }, { status: 502 });
    }

    const task: ComprehensionTask = {
      title: (raw.title || "Practice").trim(),
      passage: raw.passage.trim(),
      // DIQQAT: `answerIndex` va `explanation` bu yerda YO'Q
      questions: questions.map((q) => ({ question: q.question, options: q.options })),
    };

    const sealed: SealedTask = {
      skill,
      level,
      at: Date.now(),
      comprehension: {
        task,
        answers: questions.map((q) => q.answerIndex),
        explanations: questions.map((q) => q.explanation ?? ""),
      },
    };

    return NextResponse.json({ skill, level, task, token: seal(sealed) });
  } catch (err) {
    console.error("[practice/generate] failed:", err);

    const message =
      err instanceof GeminiError
        ? err.message
        : "Mashq yaratib bo'lmadi. Qayta urinib ko'ring.";

    return NextResponse.json(
      { error: "generation_failed", message },
      { status: err instanceof GeminiError ? err.status : 500 },
    );
  }
}
