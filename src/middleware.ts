/**
 * MIDDLEWARE — har bir so'rovdan OLDIN ishlaydigan kod.
 *
 * Ikki vazifasi bor:
 *   1. Supabase sessiyasini yangilab turish (token muddati tugamasligi uchun).
 *      Busiz foydalanuvchi bir soatdan keyin o'zi tushib qolardi.
 *   2. Himoyalangan sahifalarni qo'riqlash: kirmagan odam /dashboard'ga
 *      kirmoqchi bo'lsa — /login'ga yuboriladi.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Supabase yozmoqchi bo'lgan bitta cookie */
type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Faqat tizimga kirgan odam ko'ra oladigan sahifalar */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/chat",
  "/placement",
  "/practice",
  "/vocab",
  "/pronunciation",
  "/settings",
];

/** Kirgan odam bu sahifalarga qaytishi shart emas — dashboard'ga yuboramiz */
const AUTH_PAGES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // MUHIM: getUser() ni chaqirish shart — aynan shu sessiyani yangilaydi.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 1) Himoyalangan sahifa, lekin foydalanuvchi kirmagan → login'ga
  if (!user && PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Kirgandan keyin qayerga qaytishni eslab qolamiz
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // 2) Allaqachon kirgan odam login/signup sahifasida → dashboard'ga
  if (user && AUTH_PAGES.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  /**
   * Middleware rasmlar, favicon va statik fayllar uchun ishlamasin —
   * bu tezlikni sezilarli oshiradi.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
