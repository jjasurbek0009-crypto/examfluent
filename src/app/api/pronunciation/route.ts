/**
 * TALAFFUZ URINISHINI SAQLASH.
 *
 * Solishtirish brauzerda bajariladi (tez va bepul), bu yerda esa
 * natija bazaga yoziladi va XP beriladi.
 *
 * Nima uchun serverda qayta hisoblaymiz? Chunki brauzerdan kelgan
 * "accuracy: 100" degan raqamga ishonib bo'lmaydi — uni o'zgartirish
 * mumkin. Shuning uchun asl jumla va eshitilgan matndan foizni
 * SERVER qayta hisoblaydi.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { comparePronunciation } from "@/lib/pronunciation/compare";
import { isCefrLevel, type CefrLevel } from "@/lib/cefr";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_TEXT_LENGTH = 500;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { targetText?: string; transcript?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const targetText = (body.targetText ?? "").trim().slice(0, MAX_TEXT_LENGTH);
  const transcript = (body.transcript ?? "").trim().slice(0, MAX_TEXT_LENGTH);

  if (!targetText) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  // ---- Serverda qayta hisoblaymiz ----
  const comparison = comparePronunciation(targetText, transcript);

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("cefr_level")
    .eq("id", user.id)
    .single();

  const profile = profileRow as Pick<Profile, "cefr_level"> | null;
  const level: CefrLevel | null = isCefrLevel(profile?.cefr_level) ? profile.cefr_level : null;

  await supabase.from("pronunciation_attempts").insert({
    user_id: user.id,
    target_text: targetText,
    transcript,
    accuracy: comparison.accuracy,
    feedback: { problemWords: comparison.problemWords },
    cefr_level: level,
  });

  // Aniqlikka mutanosib XP (maksimal 10)
  await supabase.rpc("record_activity", {
    p_xp: Math.max(2, Math.round(comparison.accuracy / 10)),
    p_exercises: 1,
  });

  return NextResponse.json({
    accuracy: comparison.accuracy,
    words: comparison.words,
    problemWords: comparison.problemWords,
  });
}
