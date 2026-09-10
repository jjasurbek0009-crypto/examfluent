/**
 * OAuth va email tasdiqlash uchun "qaytish nuqtasi".
 *
 * Google'ga o'tgan foydalanuvchi shu manzilga qaytadi. Manzilda "code"
 * parametri bo'ladi — uni haqiqiy sessiyaga almashtiramiz va cookie'ga yozamiz.
 *
 * Bu "route handler" — sahifa emas, oddiy server funksiyasi.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  // Google yoki Supabase xato qaytargan bo'lsa
  const authError = searchParams.get("error_description") || searchParams.get("error");
  if (authError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(authError)}`,
    );
  }

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Ochiq redirect (open redirect) hujumidan himoya:
      // faqat o'z saytimiz ichidagi manzilga yo'naltiramiz.
      const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
      return NextResponse.redirect(`${origin}${safeNext}`);
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/login`);
}
