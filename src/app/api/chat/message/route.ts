/**
 * AI SUHBATDOSH — server tomoni.
 *
 * QANDAY ISHLAYDI (eng muhim qism):
 *
 *   1. Foydalanuvchi xabari bazaga yoziladi.
 *   2. IKKI TA Gemini so'rovi BIR VAQTDA boshlanadi:
 *        a) suhbat javobi — oqim (stream) sifatida, harf-harf keladi
 *        b) xatolar tahlili — JSON sifatida
 *      Ular parallel ketgani uchun (b) qo'shimcha vaqt olmaydi:
 *      umumiy kutish = eng uzunining vaqti, ikkalasining yig'indisi emas.
 *   3. Brauzerga NDJSON oqimi yuboriladi: har qatorda bitta hodisa.
 *   4. Oxirida AI javobi va tuzatishlar bazaga saqlanadi.
 *
 * NDJSON hodisalari:
 *   {"type":"meta","sessionId":"..."}
 *   {"type":"delta","text":"Hel"}
 *   {"type":"corrections","items":[...]}
 *   {"type":"done"}
 *   {"type":"error","message":"..."}
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateJSON,
  GEMINI_FAST_MODEL,
  GeminiError,
  streamText,
  type GeminiTurn,
} from "@/lib/gemini";
import {
  buildChatSystemPrompt,
  buildCorrectionsSystemPrompt,
  CORRECTIONS_SCHEMA,
  isChatMode,
  isScenario,
  type ChatMode,
  type Scenario,
} from "@/lib/prompts/chat";
import { isCefrLevel, type CefrLevel } from "@/lib/cefr";
import { normalizeLocale, type Locale } from "@/lib/i18n/dictionaries";
import type { Correction, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
/** Streaming uchun Node muhiti kerak (Vercel'da bepul tarifda ham ishlaydi) */
export const runtime = "nodejs";
/** Uzoq javoblar uzilib qolmasligi uchun (Vercel bepul tarif chegarasi 60s) */
export const maxDuration = 60;

/** AI'ga yuboriladigan suhbat tarixi uzunligi. Ko'p bo'lsa — token isrof bo'ladi. */
const HISTORY_LIMIT = 12;
const MAX_MESSAGE_LENGTH = 2000;

export async function POST(request: Request) {
  // ---- 1) Kim so'rayapti? ----
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // ---- 2) So'rov ma'lumotlari ----
  let body: {
    sessionId?: string;
    content?: string;
    scenario?: string;
    locale?: string;
    mode?: string;
    fromVoice?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const content = (body.content ?? "").trim().slice(0, MAX_MESSAGE_LENGTH);
  const locale: Locale = normalizeLocale(body.locale);
  const scenario: Scenario = isScenario(body.scenario) ? body.scenario : "free_talk";
  // Javob rejimi: faqat ingliz tilida yoki tarjima bilan
  const mode: ChatMode = isChatMode(body.mode) ? body.mode : "english";
  // Mikrofondan kelgan matnda tanish xatolari bo'lishi mumkin
  const fromVoice = body.fromVoice === true;

  if (!content) return NextResponse.json({ error: "empty_message" }, { status: 400 });

  // ---- 3) Profil (daraja kerak) ----
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("cefr_level")
    .eq("id", user.id)
    .single();

  const profile = profileRow as Pick<Profile, "cefr_level"> | null;
  const level: CefrLevel = isCefrLevel(profile?.cefr_level) ? profile.cefr_level : "B1";

  // ---- 4) Sessiyani topamiz yoki yaratamiz ----
  let sessionId = body.sessionId ?? null;

  if (sessionId) {
    // Bu sessiya haqiqatan shu foydalanuvchiniki ekanini tekshiramiz.
    // (RLS ham himoya qiladi, lekin ikkinchi qatlam zarar qilmaydi.)
    const { data: existing } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) sessionId = null;
  }

  if (!sessionId) {
    const { data: created, error: createError } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        scenario,
        cefr_level: level,
        // Sarlavha — birinchi xabardan olingan qisqa parcha
        title: content.slice(0, 60) + (content.length > 60 ? "…" : ""),
      })
      .select("id")
      .single();

    if (createError || !created) {
      return NextResponse.json({ error: "session_create_failed" }, { status: 500 });
    }
    sessionId = created.id as string;
  }

  // ---- 5) Suhbat tarixini olamiz ----
  const { data: historyRows } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  // Bazadan yangidan-eskiga keldi — AI uchun eskidan-yangiga aylantiramiz
  const history: GeminiTurn[] = (historyRows ?? [])
    .slice()
    .reverse()
    .map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      text: m.content as string,
    }));

  // ---- 6) Foydalanuvchi xabarini saqlaymiz ----
  await supabase.from("chat_messages").insert({
    session_id: sessionId,
    user_id: user.id,
    role: "user",
    content,
  });

  // ---- 7) Ikkala AI so'rovini BIR VAQTDA boshlaymiz ----

  // (a) Xatolar tahlili — hozir boshlanadi, natijasi keyinroq kerak bo'ladi
  const correctionsPromise = analyseCorrections(content, level, locale, fromVoice);

  // (b) Suhbat javobi — oqim
  const replyStream = streamText({
    // Suhbatda TEZLIK sifatdan muhimroq — foydalanuvchi javobni kutib turadi
    model: GEMINI_FAST_MODEL,
    system: buildChatSystemPrompt(level, scenario, locale, mode),
    history,
    prompt: content,
    temperature: 0.85, // suhbat jonli bo'lishi uchun yuqoriroq
    /*
     * Token zaxirasi.
     *
     * Ikki tilli rejimda javob ikki marta uzun bo'ladi, ustiga o'zbek va
     * rus matni ingliz matniga qaraganda token bo'yicha ~2 barobar "og'ir"
     * (lotin bo'lmagan harflar va o'ziga xos qo'shimchalar sababli).
     * Kam berilsa — javob yarim so'zda uzilib qoladi.
     */
    maxOutputTokens: mode === "bilingual" ? 1500 : 600,
  });

  // ---- 8) Brauzerga oqim qaytaramiz ----
  const encoder = new TextEncoder();
  const finalSessionId = sessionId;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      let fullReply = "";

      try {
        send({ type: "meta", sessionId: finalSessionId });

        for await (const chunk of replyStream) {
          fullReply += chunk;
          send({ type: "delta", text: chunk });
        }

        // Javob tugadi — endi tahlil natijasini kutamiz (odatda allaqachon tayyor)
        const corrections = await correctionsPromise;
        send({ type: "corrections", items: corrections });

        // ---- 9) Saqlash ----
        await supabase.from("chat_messages").insert({
          session_id: finalSessionId,
          user_id: user.id,
          role: "assistant",
          content: fullReply,
          corrections: corrections.length > 0 ? corrections : null,
        });

        // Sessiya hisoblagichini oshiramiz (+2: foydalanuvchi va AI xabari).
        // Funksiya schema.sql ichida yozilgan.
        await supabase.rpc("bump_chat_session", {
          p_session_id: finalSessionId,
          p_delta: 2,
        });

        // Faollik: har xabar uchun 5 XP
        await supabase.rpc("record_activity", { p_xp: 5, p_chat_messages: 1 });

        send({ type: "done" });
      } catch (err) {
        const message =
          err instanceof GeminiError
            ? err.message
            : "AI javob bera olmadi. Qayta urinib ko'ring.";
        console.error("[chat] stream failed:", err);
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      // Ba'zi proxy'lar oqimni bufer qilib qo'yadi — bu uni o'chiradi
      "x-accel-buffering": "no",
    },
  });
}

/**
 * Foydalanuvchi xabaridagi xatolarni topadi.
 * Xato yuz bersa — bo'sh ro'yxat qaytaradi, ya'ni suhbat baribir davom etadi.
 */
async function analyseCorrections(
  content: string,
  level: CefrLevel,
  locale: Locale,
  fromVoice = false,
): Promise<Correction[]> {
  try {
    const result = await generateJSON<{ corrections: Correction[] }>({
      // Suhbat javobi bilan BIR VAQTDA tugashi kerak — shuning uchun tez model
      model: GEMINI_FAST_MODEL,
      system: buildCorrectionsSystemPrompt(level, locale, fromVoice),
      // Xabarni aniq chegaralaymiz — ichidagi matn ko'rsatma emas, ma'lumot
      prompt: `Learner's message to mark:\n<message>\n${content}\n</message>`,
      schema: CORRECTIONS_SCHEMA,
      temperature: 0.2,
      maxOutputTokens: 800,
    });

    if (!Array.isArray(result?.corrections)) return [];

    // AI ba'zan mavjud bo'lmagan matnni "original" deb ko'rsatishi mumkin —
    // bunday tuzatishlarni tashlab yuboramiz, aks holda interfeys chalg'itadi.
    return result.corrections
      .filter(
        (c) =>
          c &&
          typeof c.original === "string" &&
          typeof c.corrected === "string" &&
          c.original.trim().length > 0 &&
          c.original !== c.corrected &&
          content.includes(c.original),
      )
      .slice(0, 4);
  } catch (err) {
    console.error("[chat] corrections failed:", err);
    return [];
  }
}
