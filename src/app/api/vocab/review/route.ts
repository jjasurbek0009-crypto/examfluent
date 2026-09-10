/**
 * KARTOCHKANI TAKRORLASH NATIJASINI SAQLASH.
 *
 * Foydalanuvchi "Oson / Yaxshi / Qiyin / Qaytadan" tugmalaridan birini
 * bosganda chaqiriladi. SM-2 algoritmi keyingi takrorlash sanasini
 * hisoblaydi va bazaga yozadi.
 *
 * AI ishlatilmaydi — shuning uchun bir zumda javob beradi.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isGrade, schedule } from "@/lib/vocab/sm2";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { cardId?: string; grade?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!body.cardId || !isGrade(body.grade)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // ---- Kartochkaning joriy holatini olamiz ----
  // .eq("user_id") — RLS ustiga qo'shimcha himoya
  const { data: card, error: readError } = await supabase
    .from("vocab_cards")
    .select("id, ease_factor, interval_days, repetitions, lapses")
    .eq("id", body.cardId)
    .eq("user_id", user.id)
    .single();

  if (readError || !card) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // ---- SM-2 hisob-kitobi ----
  const next = schedule(
    {
      easeFactor: Number(card.ease_factor),
      intervalDays: Number(card.interval_days),
      repetitions: Number(card.repetitions),
      lapses: Number(card.lapses),
    },
    body.grade,
  );

  const { error: updateError } = await supabase
    .from("vocab_cards")
    .update({
      ease_factor: next.easeFactor,
      interval_days: next.intervalDays,
      repetitions: next.repetitions,
      lapses: next.lapses,
      due_date: next.dueDate,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq("id", card.id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("[vocab/review] update failed:", updateError.message);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  // Faollik: har bir kartochka uchun 2 XP
  await supabase.rpc("record_activity", { p_xp: 2, p_cards_reviewed: 1 });

  return NextResponse.json({
    ok: true,
    dueDate: next.dueDate,
    intervalDays: next.intervalDays,
  });
}
