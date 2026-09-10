/**
 * TALAFFUZNI BAHOLASH (ovoz orqali).
 *
 * NIMA UCHUN ODDIY TRANSKRIPSIYA EMAS?
 *   Avval ovoz matnga aylantirilib, asl jumla bilan so'zma-so'z
 *   solishtirilardi. Bu ikki sababga ko'ra yomon ishlaydi:
 *
 *   1. Gemini matnni MA'NOGA qarab tiklaydi. Siz "thought" ni "tot" deb
 *      talaffuz qilsangiz ham, u kontekstdan tushunib "thought" deb
 *      yozib qo'yadi. Natijada xato ko'rinmaydi va mashq ma'nosini
 *      yo'qotadi.
 *   2. So'zma-so'z solishtirish "qaysi tovushni noto'g'ri aytdingiz"
 *      degan savolga javob bermaydi.
 *
 * SHUNING UCHUN:
 *   Gemini'ga ovoz VA asl jumlani birga beramiz, u esa to'g'ridan-to'g'ri
 *   talaffuzni baholaydi: qaysi so'z qanday eshitildi, nima uchun xato.
 *   Bu haqiqiy o'qituvchi qiladigan ishga ancha yaqin.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGemini, GEMINI_FAST_MODEL, GeminiError, type GeminiSchema } from "@/lib/gemini";
import { isCefrLevel, type CefrLevel } from "@/lib/cefr";
import { normalizeLocale, type Locale } from "@/lib/i18n/dictionaries";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_AUDIO_BYTES = 3 * 1024 * 1024;

const LANG_NAME: Record<Locale, string> = {
  uz: "Uzbek",
  ru: "Russian",
  en: "English",
};

const ASSESS_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    transcript: {
      type: "STRING",
      description:
        "What the speaker ACTUALLY said, written faithfully. If a word was mispronounced, write the word as it sounded, not the word they intended.",
    },
    accuracy: {
      type: "INTEGER",
      description: "Overall pronunciation score from 0 to 100.",
    },
    saidNothing: {
      type: "BOOLEAN",
      description: "True if the recording contains no intelligible speech at all.",
    },
    words: {
      type: "ARRAY",
      description: "One entry per word of the TARGET sentence, in the same order.",
      items: {
        type: "OBJECT",
        properties: {
          word: { type: "STRING", description: "The target word." },
          matched: {
            type: "BOOLEAN",
            description: "True if the speaker pronounced it clearly enough to be understood.",
          },
          heard: {
            type: "STRING",
            description: "How it actually sounded. Empty string if it was correct or missing.",
          },
        },
        required: ["word", "matched", "heard"],
        propertyOrdering: ["word", "matched", "heard"],
      },
    },
    tips: {
      type: "ARRAY",
      description: "Up to 3 short, concrete pronunciation tips in the learner's native language.",
      items: { type: "STRING" },
    },
  },
  required: ["transcript", "accuracy", "saidNothing", "words", "tips"],
  propertyOrdering: ["transcript", "accuracy", "saidNothing", "words", "tips"],
};

interface AssessResult {
  transcript: string;
  accuracy: number;
  saidNothing: boolean;
  words: Array<{ word: string; matched: boolean; heard: string }>;
  tips: string[];
}

export async function POST(request: Request) {
  // ---- 1) Foydalanuvchi ----
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "no_api_key" }, { status: 500 });

  // ---- 2) Ovoz va maqsad jumla ----
  let audio: Buffer;
  let targetText = "";
  let locale: Locale = "uz";

  try {
    const form = await request.formData();
    const file = form.get("audio");
    targetText = String(form.get("targetText") ?? "").trim().slice(0, 400);
    locale = normalizeLocale(form.get("locale"));

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "no_audio" }, { status: 400 });
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "audio_too_large" }, { status: 413 });
    }
    if (!targetText) {
      return NextResponse.json({ error: "no_target" }, { status: 400 });
    }

    audio = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (audio.length < 1000) {
    return NextResponse.json({ error: "no_speech", message: "Ovoz eshitilmadi." }, { status: 400 });
  }

  // ---- 3) Daraja ----
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("cefr_level")
    .eq("id", user.id)
    .single();

  const profile = profileRow as Pick<Profile, "cefr_level"> | null;
  const level: CefrLevel = isCefrLevel(profile?.cefr_level) ? profile.cefr_level : "B1";

  // ---- 4) Gemini baholaydi ----
  try {
    /*
     * TEZ MODEL ishlatiladi — bu ataylab qilingan tanlov.
     *
     * Sifatli model (gemini-3.6-flash) ovoz bilan juda sekin ishlaydi:
     * o'lchov bo'yicha 30 soniyalik yozuv uchun 30+ soniya. Amalda ulanish
     * shuncha kutolmay uzilib ketardi (ECONNRESET) va baholash umuman
     * ishlamasdi. Tez model 6 soniyada javob beradi va sinovda bir xil
     * darajada aniq baho qo'ydi.
     */
    const data = await callGemini(GEMINI_FAST_MODEL, {
      systemInstruction: { parts: [{ text: buildSystemPrompt(level, locale) }] },
      contents: [
        {
          parts: [
            { text: `Target sentence the learner was asked to read aloud:
"${targetText}"` },
            { inlineData: { mimeType: "audio/wav", data: audio.toString("base64") } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1, // baholash barqaror bo'lishi kerak
        maxOutputTokens: 3000,
        responseMimeType: "application/json",
        responseSchema: ASSESS_SCHEMA,
      },
    });

    const raw = (data?.candidates?.[0]?.content?.parts ?? [])
      .filter((p: { thought?: boolean }) => p?.thought !== true)
      .map((p: { text?: string }) => p?.text ?? "")
      .join("")
      .trim();

    let result: AssessResult;
    try {
      result = JSON.parse(raw) as AssessResult;
    } catch {
      console.error("[pronunciation/assess] JSON o'qib bo'lmadi:", raw.slice(0, 200));
      return NextResponse.json({ error: "assess_failed" }, { status: 502 });
    }

    if (result.saidNothing) {
      return NextResponse.json({ error: "no_speech", message: "Ovoz eshitilmadi." }, { status: 400 });
    }

    // AI qaytargan qiymatlarni ishonchli oraliqqa keltiramiz
    const accuracy = Math.max(0, Math.min(100, Math.round(Number(result.accuracy) || 0)));
    const words = (result.words ?? [])
      .filter((w) => w && typeof w.word === "string")
      .map((w) => ({
        word: w.word,
        matched: w.matched === true,
        heard: typeof w.heard === "string" ? w.heard : "",
      }));
    const problemWords = words.filter((w) => !w.matched).map((w) => w.word);
    const tips = (result.tips ?? []).filter((x) => typeof x === "string").slice(0, 3);

    // ---- 5) Bazaga yozamiz ----
    await supabase.from("pronunciation_attempts").insert({
      user_id: user.id,
      target_text: targetText,
      transcript: result.transcript ?? "",
      accuracy,
      feedback: { problemWords, tips, words },
      cefr_level: level,
    });

    await supabase.rpc("record_activity", { p_xp: 5 + Math.round(accuracy / 20), p_minutes: 1 });

    return NextResponse.json({
      transcript: result.transcript ?? "",
      accuracy,
      words,
      problemWords,
      tips,
    });
  } catch (err) {
    console.error("[pronunciation/assess] failed:", err);
    const message =
      err instanceof GeminiError ? err.message : "Talaffuzni baholab bo'lmadi.";
    const status = err instanceof GeminiError && err.status === 429 ? 429 : 502;
    return NextResponse.json({ error: "assess_failed", message }, { status });
  }
}

function buildSystemPrompt(level: CefrLevel, locale: Locale): string {
  return `You are a strict but encouraging English pronunciation coach assessing a CEFR ${level} learner.

You will hear a recording of the learner reading a target sentence aloud. Judge HOW THEY SOUNDED.

## The single most important rule
Do NOT auto-correct what you hear. If the learner said "tot" when the word was "thought", the transcript must say "tot". Your job is to reveal mistakes, not to hide them. Writing down the intended word instead of the spoken one makes this whole exercise useless.

## Scoring
- 90-100: clear and easily understood by any English speaker
- 70-89: understandable, with a noticeable accent or a few unclear sounds
- 50-69: several words hard to understand
- Below 50: most of the sentence is hard to understand
- Judge intelligibility, not accent. A strong accent that is still clear scores well.
- Missing words, or words replaced by different ones, must be marked as not matched.

## The word list
Return one entry for EVERY word of the target sentence, in the original order. Use the exact target spelling in "word". Set "heard" only when the word was wrong or unclear.

## Tips
Write the "tips" in ${LANG_NAME[locale]}. Each tip must name a specific sound or word and say concretely what to do with the mouth or tongue. No vague encouragement.

Return JSON only.`;
}
