/**
 * YANGI SO'Z KARTOCHKALARINI YARATISH.
 *
 * AI foydalanuvchi darajasiga mos 10 ta so'z tanlaydi va har biri uchun
 * ta'rif, misol jumla va tarjima yozadi.
 *
 * Takrorlanishning oldini olish: foydalanuvchida allaqachon bor so'zlar
 * ro'yxati AI'ga yuboriladi, u boshqa so'z tanlaydi. Bundan tashqari
 * bazadagi (user_id, word) unique cheklovi ham himoya qiladi.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON, GeminiError, type GeminiSchema } from "@/lib/gemini";
import { CEFR_AI_GUIDE, isCefrLevel, type CefrLevel } from "@/lib/cefr";
import { normalizeLocale, type Locale } from "@/lib/i18n/dictionaries";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** Bir marta nechta so'z yaratiladi */
const BATCH_SIZE = 10;

const VOCAB_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    words: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          word: { type: "STRING", description: "The English word or fixed phrase, lowercase." },
          partOfSpeech: {
            type: "STRING",
            enum: ["noun", "verb", "adjective", "adverb", "phrase", "phrasal verb"],
          },
          definitionEn: {
            type: "STRING",
            description: "A short definition in simple English, below the learner's level.",
          },
          exampleEn: {
            type: "STRING",
            description: "One natural example sentence using the word.",
          },
          translationUz: { type: "STRING", description: "Uzbek translation." },
          translationRu: { type: "STRING", description: "Russian translation." },
        },
        required: [
          "word",
          "partOfSpeech",
          "definitionEn",
          "exampleEn",
          "translationUz",
          "translationRu",
        ],
        propertyOrdering: [
          "word",
          "partOfSpeech",
          "definitionEn",
          "exampleEn",
          "translationUz",
          "translationRu",
        ],
      },
    },
  },
  required: ["words"],
};

interface GeneratedWord {
  word: string;
  partOfSpeech: string;
  definitionEn: string;
  exampleEn: string;
  translationUz: string;
  translationRu: string;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { locale?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Bo'sh so'rov ham qabul qilinadi
  }
  const locale: Locale = normalizeLocale(body.locale);

  // ---- Daraja ----
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("cefr_level")
    .eq("id", user.id)
    .single();

  const profile = profileRow as Pick<Profile, "cefr_level"> | null;
  const level: CefrLevel = isCefrLevel(profile?.cefr_level) ? profile.cefr_level : "B1";

  // ---- Mavjud so'zlar (takrorlanmasligi uchun) ----
  const { data: existingRows } = await supabase
    .from("vocab_cards")
    .select("word")
    .order("created_at", { ascending: false })
    .limit(200);

  const existing = (existingRows ?? []).map((r) => r.word as string);

  try {
    const generated = await generateJSON<{ words: GeneratedWord[] }>({
      system: `You are a CEFR vocabulary specialist building flashcards for an English learner on the ExamFluent platform.

Choose words that are genuinely useful at the learner's level and common in IELTS materials. Never choose obscure or archaic words.

Definitions must be SIMPLER than the target word — a learner should understand the definition without a dictionary.
${CEFR_AI_GUIDE[level]}`,
      prompt: `Generate exactly ${BATCH_SIZE} English vocabulary items for a CEFR ${level} learner.

Rules:
- Mix parts of speech: include some verbs, some adjectives, and at least 2 collocations or phrasal verbs.
- Every example sentence must show the word in a realistic, everyday context.
- Uzbek and Russian translations must be accurate and natural, not word-by-word.

Do NOT use any of these words, the learner already has them:
${existing.length > 0 ? existing.join(", ") : "(none yet)"}

Return JSON only.`,
      schema: VOCAB_SCHEMA,
      temperature: 1.0, // xilma-xillik uchun
      maxOutputTokens: 2500,
    });

    // ---- Tozalash ----
    const existingSet = new Set(existing.map((w) => w.toLowerCase()));
    const seen = new Set<string>();

    const rows = (generated.words ?? [])
      .filter((w) => w && typeof w.word === "string" && w.word.trim().length > 0)
      .map((w) => ({ ...w, word: w.word.trim().toLowerCase() }))
      .filter((w) => {
        if (existingSet.has(w.word) || seen.has(w.word)) return false;
        seen.add(w.word);
        return true;
      })
      .slice(0, BATCH_SIZE)
      .map((w) => ({
        user_id: user.id,
        word: w.word,
        part_of_speech: w.partOfSpeech ?? null,
        definition_en: w.definitionEn ?? null,
        example_en: w.exampleEn ?? null,
        translation_uz: w.translationUz ?? null,
        translation_ru: w.translationRu ?? null,
        cefr_level: level,
        source: "ai",
        // Yangi kartochkalar darhol takrorlashga tayyor
        due_date: new Date().toISOString().slice(0, 10),
      }));

    if (rows.length === 0) {
      return NextResponse.json({ error: "no_new_words", added: 0 }, { status: 502 });
    }

    // onConflict — bir vaqtda ikki marta bosilsa xato bermasin
    const { data: inserted, error } = await supabase
      .from("vocab_cards")
      .upsert(rows, { onConflict: "user_id,word", ignoreDuplicates: true })
      .select("id");

    if (error) {
      console.error("[vocab/generate] insert failed:", error.message);
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }

    return NextResponse.json({ added: inserted?.length ?? rows.length, level, locale });
  } catch (err) {
    console.error("[vocab/generate] failed:", err);
    const message =
      err instanceof GeminiError ? err.message : "So'zlarni yaratib bo'lmadi.";
    return NextResponse.json({ error: "generation_failed", message }, { status: 502 });
  }
}
