/**
 * OVOZNI MATNGA AYLANTIRISH (Gemini orqali).
 *
 * NIMA UCHUN BRAUZERNIKI EMAS?
 *   Chrome'ning Web Speech API'si o'zbek tilini juda yomon taniydi.
 *   O'lchov (bir xil ovoz namunasida):
 *
 *     Chrome Web Speech  ->  "Ssvning nima"          (tushunarsiz)
 *     Gemini flash-lite  ->  "Isming nima?"          (2.4 soniya)
 *
 *   Bundan tashqari Gemini usuli Firefox va Safari'da ham ishlaydi,
 *   Web Speech esa faqat Chrome/Edge'da bor.
 *
 * Ovoz brauzerda 16 kHz mono WAV ga aylantirilgan holda keladi —
 * bu format Gemini uchun aniq ishlaydi va hajmi kichik.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGemini, GEMINI_FAST_MODEL, GeminiError } from "@/lib/gemini";
import { languageNameFromCode } from "@/lib/prompts/speech";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** 30 soniyalik 16 kHz mono WAV ~1 MB. Undan kattasini rad etamiz. */
const MAX_AUDIO_BYTES = 3 * 1024 * 1024;

export async function POST(request: Request) {
  // ---- 1) Faqat kirgan foydalanuvchi ----
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "no_api_key" }, { status: 500 });

  // ---- 2) Ovoz faylini olamiz ----
  let audio: Buffer;
  let lang = "en-GB";

  try {
    const form = await request.formData();
    const file = form.get("audio");
    const langValue = form.get("lang");

    if (typeof langValue === "string") lang = langValue;
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "no_audio" }, { status: 400 });
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "audio_too_large" }, { status: 413 });
    }

    audio = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (audio.length < 1000) {
    // Juda qisqa — foydalanuvchi hech narsa aytmagan
    return NextResponse.json({ text: "", empty: true });
  }

  const languageName = languageNameFromCode(lang);

  // ---- 3) Gemini'ga yuboramiz ----
  try {
    const data = await callGemini(GEMINI_FAST_MODEL, {
      contents: [
        {
          parts: [
            { text: buildTranscribePrompt(languageName) },
            {
              inlineData: {
                mimeType: "audio/wav",
                data: audio.toString("base64"),
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0, // transkripsiya ijodiy bo'lmasligi kerak
        maxOutputTokens: 2200,
      },
    });

    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const raw = parts
      .filter((p: { thought?: boolean }) => p?.thought !== true)
      .map((p: { text?: string }) => p?.text ?? "")
      .join("")
      .trim();

    const text = cleanTranscript(raw);

    return NextResponse.json({ text, empty: text.length === 0 });
  } catch (err) {
    console.error("[transcribe] failed:", err);
    const message =
      err instanceof GeminiError ? err.message : "Ovozni matnga aylantirib bo'lmadi.";
    const status = err instanceof GeminiError && err.status === 429 ? 429 : 502;
    return NextResponse.json({ error: "transcribe_failed", message }, { status });
  }
}

function buildTranscribePrompt(languageName: string): string {
  return `Transcribe this audio recording exactly as spoken.

The speaker is a learner using ExamFluent, an English-learning app. They are most likely ${languageName === "English" ? "practising English" : `speaking ${languageName}`}, and they typically greet the tutor, introduce themselves, ask the tutor's name, ask about grammar or vocabulary, or talk about IELTS, study, work and daily life.

Rules:
- Output ONLY the transcript. No quotes, no labels, no explanation, no translation.
- Write it in the language actually spoken. For Uzbek, use the Latin alphabet with normal apostrophes (o', g').
- Add normal punctuation and capitalisation.
- Do not answer the speaker and do not add anything they did not say.
- If the recording contains no speech at all, output exactly: (no speech)`;
}

/**
 * Model qoidani buzib qo'shimcha matn yozib yuborishi mumkin —
 * eng keng tarqalgan holatlarni tozalaymiz.
 */
function cleanTranscript(raw: string): string {
  let text = raw.trim();

  // "(no speech)" — nutq yo'q
  if (/^\(?\s*no speech\s*\)?\.?$/i.test(text)) return "";

  // Ba'zan javobni qo'shtirnoq ichida beradi
  const quoted = text.match(/^"([\s\S]+)"$/);
  if (quoted) text = quoted[1].trim();

  // "Transcript:" kabi yorliqlarni olib tashlaymiz
  text = text.replace(/^(transcript|transcription)\s*:\s*/i, "").trim();

  return text;
}
