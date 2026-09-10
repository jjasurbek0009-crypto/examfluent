/**
 * SERVER uchun Supabase mijozi.
 *
 * Qachon ishlatiladi: Server Component'lar, API route'lar, Server Action'lar.
 *
 * Farqi nimada? Serverda "kim kirgan" degan ma'lumot cookie'da keladi.
 * Shu sababli Supabase'ga cookie'larni o'qish/yozish usulini ko'rsatamiz.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Supabase yozmoqchi bo'lgan bitta cookie */
type CookieToSet = { name: string; value: string; options: CookieOptions };

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component ichidan cookie yozib bo'lmaydi — bu normal.
            // Sessiyani middleware.ts yangilab turadi, shuning uchun xavfsiz.
          }
        },
      },
    },
  );
}

/**
 * Joriy foydalanuvchi + uning profilini bitta joyda oladi.
 * Sahifalarda takror-takror yozmaslik uchun qulay yordamchi.
 */
export async function getSessionUser() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile, supabase };
}
