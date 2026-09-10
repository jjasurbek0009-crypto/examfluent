/**
 * BRAUZER uchun Supabase mijozi.
 *
 * Qachon ishlatiladi: "use client" yozilgan komponentlar ichida
 * (masalan login formasi, chat oynasi).
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
