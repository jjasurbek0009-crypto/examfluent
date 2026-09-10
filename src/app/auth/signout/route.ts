/**
 * Tizimdan chiqish. Faqat POST orqali — bu xavfsizlik talabi:
 * agar GET bo'lsa, boshqa saytdagi rasm ham sizni chiqarib yuborishi mumkin edi.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", request.url), {
    status: 303, // POST'dan keyin GET bilan yo'naltirish uchun to'g'ri kod
  });
}
