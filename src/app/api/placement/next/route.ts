/**
 * DARAJA ANIQLASH TESTI — server tomoni.
 *
 * Bitta manzil ikkala vazifani bajaradi:
 *   1. Keyingi savolni beradi (adaptiv tanlov bilan)
 *   2. 20 ta savol tugagach — natijani hisoblaydi, AI izohini oladi,
 *      bazaga yozadi va profilni yangilaydi.
 *
 * MUHIM XAVFSIZLIK QARORI:
 *   To'g'ri javoblar (answer key) BRAUZERGA HECH QACHON yuborilmaydi.
 *   Savol yuborilganda `answer` maydoni olib tashlanadi. Baholash faqat
 *   shu yerda — serverda — bo'ladi. Aks holda test ma'nosini yo'qotardi.
 *
 * Yondashuv "stateless": brauzer har safar butun javoblar ro'yxatini
 * yuboradi, server esa holatni qaytadan hisoblab chiqadi. Bu — sessiya
 * saqlash muammosini butunlay yo'q qiladi.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { QUESTION_BANK, PLACEMENT_LENGTH } from "@/lib/placement/questions";
import {
  applyAnswer,
  createInitialState,
  pickNextQuestion,
  scoreTest,
  shuffleOptions,
  type AnswerRecord,
} from "@/lib/placement/engine";
import { CEFR_META, CEFR_TO_IELTS } from "@/lib/cefr";
import { generateJSON, GeminiError, type GeminiSchema } from "@/lib/gemini";
import { normalizeLocale } from "@/lib/i18n/dictionaries";

/** Bu marshrut har doim serverda, kesh (cache) siz ishlasin */
export const dynamic = "force-dynamic";

/** Savolni id bo'yicha topish uchun tez lug'at */
const BY_ID = new Map(QUESTION_BANK.map((q) => [q.id, q]));

interface ClientAnswer {
  questionId: string;
  chosen: number | null;
}

// ---------------------------------------------------------------------------
//  AI izohi uchun javob sxemasi
// ---------------------------------------------------------------------------
const SUMMARY_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    summary: {
      type: "STRING",
      description: "2-3 sentences summarising the learner's current level, warm but honest.",
    },
    strengths: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Exactly 2 short points about what the learner already does well.",
    },
    focus: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Exactly 3 short, concrete things to work on next.",
    },
  },
  required: ["summary", "strengths", "focus"],
  propertyOrdering: ["summary", "strengths", "focus"],
};

interface AiSummary {
  summary: string;
  strengths: string[];
  focus: string[];
}

export async function POST(request: Request) {
  // ---- 1) Foydalanuvchini tekshiramiz ----
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // ---- 2) So'rovni o'qiymiz ----
  let body: { answers?: ClientAnswer[]; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const clientAnswers = Array.isArray(body.answers) ? body.answers.slice(0, PLACEMENT_LENGTH) : [];
  const locale = normalizeLocale(body.locale);

  // ---- 3) Javoblarni baholaymiz va holatni qayta tiklaymiz ----
  const answers: AnswerRecord[] = [];
  let state = createInitialState();

  for (const item of clientAnswers) {
    const question = BY_ID.get(item.questionId);
    if (!question) continue; // Noma'lum id — e'tiborsiz qoldiramiz

    // Foydalanuvchi ARALASHTIRILGAN variantlarni ko'rgan, shuning uchun
    // to'g'ri javobning o'rnini ham xuddi shu tartibda qayta hisoblaymiz.
    // Urug' bir xil bo'lgani uchun tartib aynan o'sha chiqadi.
    const shuffled = shuffleOptions(question, `${user.id}:${question.id}`);
    const correct = item.chosen !== null && item.chosen === shuffled.answerIndex;

    answers.push({
      questionId: question.id,
      level: question.level,
      skill: question.skill,
      chosen: item.chosen,
      correct,
    });

    state = applyAnswer(state, question, correct);
  }

  // ---- 4) Test hali tugamagan bo'lsa — keyingi savolni beramiz ----
  if (answers.length < PLACEMENT_LENGTH) {
    const question = pickNextQuestion(state);

    if (question) {
      // DIQQAT: `answer` maydoni olib tashlanadi va variantlar aralashtiriladi!
      const { answer: _hidden, options: _original, ...safeQuestion } = question;
      const shuffled = shuffleOptions(question, `${user.id}:${question.id}`);

      return NextResponse.json({
        done: false,
        index: answers.length,
        total: PLACEMENT_LENGTH,
        question: { ...safeQuestion, options: shuffled.options },
      });
    }
    // Savollar tugab qolsa — mavjudlari bo'yicha yakunlaymiz
  }

  // ---- 5) Yakuniy natija ----
  const result = scoreTest(answers);
  const band = CEFR_TO_IELTS[result.level];

  // ---- 6) AI izohi (xato bo'lsa ham test buzilmaydi) ----
  let ai: AiSummary | null = null;
  try {
    ai = await aiSummary(result, locale);
  } catch (err) {
    // Gemini limiti tugagan bo'lishi mumkin — bu natijani bekor qilmaydi.
    console.error("[placement] AI summary failed:", err instanceof GeminiError ? err.message : err);
  }

  // ---- 7) Bazaga yozamiz ----
  const { error: insertError } = await supabase.from("placement_attempts").insert({
    user_id: user.id,
    answers: answers,
    raw_score: result.rawScore,
    total_questions: result.total,
    cefr_level: result.level,
    breakdown: result.breakdown,
    ai_summary: ai?.summary ?? null,
  });

  if (insertError) {
    console.error("[placement] insert failed:", insertError.message);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      cefr_level: result.level,
      placement_done: true,
      target_band: band.typical,
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("[placement] profile update failed:", profileError.message);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  // Testni tugatgani uchun XP va streak
  await supabase.rpc("record_activity", { p_xp: 50, p_minutes: 10 });

  return NextResponse.json({
    done: true,
    level: result.level,
    rawScore: result.rawScore,
    total: result.total,
    breakdown: result.breakdown,
    estimatedBand: band.typical,
    bandRange: { min: band.min, max: band.max },
    ai,
  });
}

// ---------------------------------------------------------------------------
//  AI izohi
// ---------------------------------------------------------------------------

async function aiSummary(
  result: ReturnType<typeof scoreTest>,
  locale: "uz" | "ru" | "en",
): Promise<AiSummary> {
  const langName = { uz: "Uzbek", ru: "Russian", en: "English" }[locale];

  const skillLines = Object.entries(result.breakdown)
    .filter(([, v]) => v !== null)
    .map(([skill, v]) => `- ${skill}: ${Math.round((v as number) * 100)}% correct`)
    .join("\n");

  return generateJSON<AiSummary>({
    system: `You are a CEFR assessment specialist writing feedback for an English learner on the ExamFluent platform.

Write ALL output in ${langName}. Be warm but professional and honest — this is an exam-preparation product, not a game. Never invent scores that were not given to you. Keep every bullet under 15 words.`,
    prompt: `A learner has just completed an adaptive placement test.

Result: CEFR ${result.level} (${CEFR_META[result.level].title})
Score: ${result.rawScore} out of ${result.total} correct
Estimated IELTS band: ${CEFR_TO_IELTS[result.level].typical}

Skill breakdown:
${skillLines || "- no breakdown available"}

Write:
1. "summary": 2-3 sentences explaining what level ${result.level} means in practice for this learner.
2. "strengths": exactly 2 short points, based on the skill breakdown above.
3. "focus": exactly 3 concrete next steps appropriate for moving beyond ${result.level}.`,
    schema: SUMMARY_SCHEMA,
    temperature: 0.4,
    maxOutputTokens: 700,
  });
}
