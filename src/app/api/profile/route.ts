/**
 * PROFIL SOZLAMALARINI YANGILASH.
 *
 * Faqat ruxsat etilgan maydonlar o'zgartiriladi. Masalan foydalanuvchi
 * o'zining `total_xp` yoki `streak_count` ini o'zgartira olmaydi —
 * ular faqat record_activity() funksiyasi orqali oshadi.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LOCALES, type Locale } from "@/lib/i18n/dictionaries";
import { roundToHalfBand } from "@/lib/cefr";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: {
    full_name?: string;
    ui_lang?: string;
    target_band?: number;
    daily_goal_min?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // ---- Faqat ruxsat etilgan maydonlarni yig'amiz ----
  const updates: Record<string, unknown> = {};

  if (typeof body.full_name === "string") {
    const name = body.full_name.trim().slice(0, 80);
    if (name.length > 0) updates.full_name = name;
  }

  if (typeof body.ui_lang === "string" && LOCALES.includes(body.ui_lang as Locale)) {
    updates.ui_lang = body.ui_lang;
  }

  if (typeof body.target_band === "number" && Number.isFinite(body.target_band)) {
    updates.target_band = roundToHalfBand(Math.max(4, Math.min(9, body.target_band)));
  }

  if (typeof body.daily_goal_min === "number" && Number.isFinite(body.daily_goal_min)) {
    updates.daily_goal_min = Math.max(5, Math.min(180, Math.round(body.daily_goal_min)));
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    console.error("[profile] update failed:", error.message);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
