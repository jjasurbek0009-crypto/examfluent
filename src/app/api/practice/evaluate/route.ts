/**
 * IELTS MASHQINI BAHOLASH.
 *
 * Ikki xil yo'l bor:
 *
 *   Reading / Listening → AI KERAK EMAS. Javoblar shifrlangan token ichida
 *     turadi, server ularni solishtiradi. Natija bir zumda chiqadi va
 *     Gemini limiti sarflanmaydi.
 *
 *   Writing → AI IELTS ekspert-baholovchisi rolida 4 ta rasmiy mezon
 *     bo'yicha ball qo'yadi.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON, GeminiError } from "@/lib/gemini";
import { open } from "@/lib/crypto";
import type { SealedTask } from "@/lib/practice/types";
import {
  buildWritingEvalPrompt,
  buildWritingEvalSystemPrompt,
  WRITING_EVAL_SCHEMA,
} from "@/lib/prompts/practice";
import { estimateBandFromAccuracy, roundToHalfBand } from "@/lib/cefr";
import { normalizeLocale } from "@/lib/i18n/dictionaries";
import type { BandCriteria, Correction } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** Token shuncha vaqtdan keyin eskiradi (2 soat) */
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

const MAX_ESSAY_LENGTH = 8000;

interface WritingEval {
  criteria: BandCriteria;
  summary: string;
  strengths: string[];
  improvements: string[];
  corrections: Correction[];
}

export async function POST(request: Request) {
  // ---- 1) Foydalanuvchi ----
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // ---- 2) So'rov ----
  let body: {
    token?: string;
    answers?: number[];
    essay?: string;
    durationSec?: number;
    locale?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const locale = normalizeLocale(body.locale);
  const durationSec =
    Number.isFinite(body.durationSec) && body.durationSec! > 0
      ? Math.min(Math.round(body.durationSec!), 60 * 60 * 3)
      : null;

  // ---- 3) Tokenni ochamiz ----
  const sealed = body.token ? open<SealedTask>(body.token) : null;

  if (!sealed || typeof sealed.at !== "number") {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }
  if (Date.now() - sealed.at > TOKEN_TTL_MS) {
    return NextResponse.json({ error: "expired_token" }, { status: 400 });
  }

  // =======================================================================
  //  READING / LISTENING
  // =======================================================================
  if (sealed.comprehension) {
    const { task, answers: key, explanations } = sealed.comprehension;
    const given = Array.isArray(body.answers) ? body.answers : [];

    const results = key.map((correctIndex, i) => {
      const chosen = Number.isInteger(given[i]) ? given[i] : null;
      return {
        question: task.questions[i]?.question ?? "",
        options: task.questions[i]?.options ?? [],
        chosen,
        correctIndex,
        correct: chosen === correctIndex,
        explanation: explanations[i] ?? "",
      };
    });

    const correctCount = results.filter((r) => r.correct).length;
    const accuracy = results.length > 0 ? correctCount / results.length : 0;
    const band = estimateBandFromAccuracy(sealed.level, accuracy);

    // ---- Bazaga yozamiz ----
    await supabase.from("exercise_attempts").insert({
      user_id: user.id,
      skill: sealed.skill,
      task_type: "multiple_choice",
      cefr_level: sealed.level,
      prompt: { title: task.title, passage: task.passage, questions: task.questions },
      user_response: { answers: given },
      band_score: band,
      criteria: null,
      feedback: { correctCount, total: results.length },
      duration_sec: durationSec,
    });

    // To'g'ri javob soniga qarab XP
    await supabase.rpc("record_activity", {
      p_xp: 10 + correctCount * 3,
      p_minutes: durationSec ? Math.max(1, Math.round(durationSec / 60)) : 3,
      p_exercises: 1,
    });

    return NextResponse.json({
      skill: sealed.skill,
      level: sealed.level,
      band,
      correctCount,
      total: results.length,
      results,
    });
  }

  // =======================================================================
  //  WRITING
  // =======================================================================
  if (sealed.writing) {
    const essay = (body.essay ?? "").trim().slice(0, MAX_ESSAY_LENGTH);

    if (essay.length < 20) {
      return NextResponse.json({ error: "essay_too_short" }, { status: 400 });
    }

    const wordCount = countWords(essay);

    try {
      const evaluation = await generateJSON<WritingEval>({
        system: buildWritingEvalSystemPrompt(locale),
        prompt: buildWritingEvalPrompt(sealed.writing, essay, wordCount),
        schema: WRITING_EVAL_SCHEMA,
        temperature: 0.2, // baholash barqaror bo'lishi kerak
        maxOutputTokens: 2000,
      });

      // AI ballari ishonchli oraliqda ekanini tekshiramiz
      const criteria: BandCriteria = {
        task: safeBand(evaluation.criteria?.task),
        coherence: safeBand(evaluation.criteria?.coherence),
        lexical: safeBand(evaluation.criteria?.lexical),
        grammar: safeBand(evaluation.criteria?.grammar),
      };

      // IELTS umumiy balli — 4 mezonning o'rtachasi, 0.5 gacha yaxlitlanadi
      const band = roundToHalfBand(
        (criteria.task + criteria.coherence + criteria.lexical + criteria.grammar) / 4,
      );

      // Faqat esse ichida haqiqatan mavjud tuzatishlarni qoldiramiz
      const corrections = (evaluation.corrections ?? [])
        .filter(
          (c) =>
            c &&
            typeof c.original === "string" &&
            typeof c.corrected === "string" &&
            c.original !== c.corrected &&
            essay.includes(c.original),
        )
        .slice(0, 6);

      const feedback = {
        summary: evaluation.summary ?? "",
        strengths: (evaluation.strengths ?? []).slice(0, 3),
        improvements: (evaluation.improvements ?? []).slice(0, 4),
        corrections,
      };

      await supabase.from("exercise_attempts").insert({
        user_id: user.id,
        skill: "writing",
        task_type: sealed.writing.taskType,
        cefr_level: sealed.level,
        prompt: sealed.writing,
        user_response: { essay, wordCount },
        band_score: band,
        criteria,
        feedback,
        duration_sec: durationSec,
      });

      await supabase.rpc("record_activity", {
        p_xp: 30,
        p_minutes: durationSec ? Math.max(1, Math.round(durationSec / 60)) : 15,
        p_exercises: 1,
      });

      return NextResponse.json({
        skill: "writing",
        level: sealed.level,
        band,
        criteria,
        wordCount,
        minWords: sealed.writing.minWords,
        feedback,
      });
    } catch (err) {
      console.error("[practice/evaluate] writing failed:", err);
      const message =
        err instanceof GeminiError ? err.message : "Baholab bo'lmadi. Qayta urinib ko'ring.";
      return NextResponse.json({ error: "evaluation_failed", message }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "invalid_token" }, { status: 400 });
}

/** So'zlarni sanaydi (IELTS ham shunday sanaydi: bo'shliq bilan ajratilgan bo'laklar) */
function countWords(text: string): number {
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

/** AI qaytargan ballni 0-9 oralig'iga va 0.5 qadamga keltiradi */
function safeBand(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 5;
  return roundToHalfBand(n);
}
