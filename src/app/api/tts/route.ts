/**
 * SERVER TOMONIDA OVOZ YARATISH (Text-to-Speech).
 *
 * NIMA UCHUN KERAK?
 *   Odatda ovoz brauzerning o'zida yaratiladi — bepul va bir zumda.
 *   Lekin Windows'da inglizcha ovoz paketi o'rnatilmagan bo'lsa, Chrome
 *   inglizcha ovozni umuman ko'rmaydi. Natijada AI javobi ya jim qoladi,
 *   ya rus/boshqa ovoz bilan noto'g'ri talaffuz qilinadi.
 *
 *   Shunday hollarda Gemini'ning ovoz modeli ishga tushadi. U to'g'ri
 *   inglizcha talaffuz beradi va foydalanuvchi kompyuteriga hech narsa
 *   o'rnatishi shart emas.
 *
 * NIMA UCHUN ASOSIY USUL EMAS?
 *   Har bir javob uchun API so'rovi ketadi (bepul limitni yeydi) va
 *   ~2-4 soniya kutish qo'shiladi. Brauzernikisi esa bir zumda ishlaydi.
 *   Shuning uchun bu faqat ZAXIRA.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGemini, GeminiError } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** Ovoz modeli. Oddiy matn modellaridan alohida. */
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

/**
 * Ovoz turi. Gemini'da bir nechta tayyor ovoz bor;
 * "Kore" — sokin va aniq, o'qituvchi ohangiga mos.
 */
const VOICE_NAME = "Kore";

/** Bir marta o'qiladigan matnning eng katta uzunligi */
const MAX_TEXT = 1200;

export async function POST(request: Request) {
  // ---- 1) Faqat kirgan foydalanuvchi ----
  // Aks holda begonalar API kalitimizni ovoz yaratishga sarflab yuborardi.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // ---- 2) Matn ----
  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const text = (body.text ?? "").trim().slice(0, MAX_TEXT);
  if (!text) return NextResponse.json({ error: "empty_text" }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "no_api_key" }, { status: 500 });

  // ---- 3) Gemini'dan ovoz so'raymiz ----
  try {
    const data = await callGemini(TTS_MODEL, {
      contents: [
        {
          parts: [
            {
              // Ohangni ko'rsatamiz — quruq o'qishdan ko'ra jonli chiqadi
              text: `Read this out loud in a warm, clear, friendly English teacher's voice at a natural pace:

${text}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } },
        },
      },
    });

    const part = data?.candidates?.[0]?.content?.parts?.[0];
    const inline = part?.inlineData ?? part?.inline_data;

    if (!inline?.data) {
      console.error("[tts] javobda audio yo'q");
      return NextResponse.json({ error: "no_audio" }, { status: 502 });
    }

    // ---- 4) PCM ni WAV ga o'raymiz ----
    // Gemini xom PCM qaytaradi (audio/L16). Brauzerlar uni to'g'ridan-to'g'ri
    // o'ynata olmaydi — 44 baytlik WAV sarlavhasi qo'shish kifoya.
    const pcm = Buffer.from(inline.data as string, "base64");
    const sampleRate = parseRate(inline.mimeType as string | undefined);
    const wav = pcmToWav(pcm, sampleRate);

    return new Response(new Uint8Array(wav), {
      headers: {
        "content-type": "audio/wav",
        "content-length": String(wav.length),
        // Bir xil matn qayta so'ralsa brauzer keshdan oladi — limit tejaladi
        "cache-control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[tts] failed:", err);
    const message =
      err instanceof GeminiError ? err.message : "Ovoz yaratib bo'lmadi.";
    const status = err instanceof GeminiError && err.status === 429 ? 429 : 502;
    return NextResponse.json({ error: "tts_failed", message }, { status });
  }
}

/** "audio/L16;codec=pcm;rate=24000" dan namuna chastotasini ajratib oladi */
function parseRate(mimeType: string | undefined): number {
  const match = mimeType?.match(/rate=(\d+)/);
  return match ? Number(match[1]) : 24000;
}

/**
 * Xom PCM ma'lumotiga WAV sarlavhasini qo'shadi.
 *
 * WAV — bu shunchaki 44 baytlik sarlavha + xom ovoz ma'lumoti.
 * Sarlavhada brauzerga "bu 16-bitli, 24000 Hz, bitta kanal" deb aytiladi.
 */
function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4); // fayl hajmi - 8
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt bo'limi uzunligi
  header.writeUInt16LE(1, 20); // 1 = siqilmagan PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}
