"use client";

/**
 * Kirish va ro'yxatdan o'tish formasi (bitta komponent — ikkala holat uchun).
 *
 * Nima uchun "use client"? Chunki bu yerda foydalanuvchi yozgan matnni
 * kuzatish (useState) va tugma bosilishiga javob berish kerak — bular
 * faqat brauzerda ishlaydi.
 */

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Middleware "?next=/chat" qo'shib yuborishi mumkin — kirgandan keyin
  // foydalanuvchini aynan o'sha sahifaga qaytaramiz.
  const nextPath = searchParams.get("next") || "/dashboard";

  /** Supabase xato matnini tarjima qilingan tushunarli matnga aylantiradi */
  function friendlyError(message: string): string {
    const m = message.toLowerCase();
    let key: TranslationKey = "auth.error.generic";
    if (m.includes("invalid login") || m.includes("invalid credentials")) {
      key = "auth.error.invalidCredentials";
    } else if (m.includes("already registered") || m.includes("already been registered")) {
      key = "auth.error.emailInUse";
    } else if (m.includes("password") && (m.includes("6 characters") || m.includes("weak"))) {
      key = "auth.error.weakPassword";
    }
    return t(key);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && password.length < 8) {
      setError(t("auth.error.weakPassword"));
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Bu ma'lumot auth.users.raw_user_meta_data ichiga tushadi,
            // keyin schema.sql'dagi trigger uni profiles jadvaliga ko'chiradi.
            data: { full_name: fullName || email.split("@")[0], ui_lang: locale },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        });

        if (signUpError) throw signUpError;

        // Supabase'da "Confirm email" yoqilgan bo'lsa — sessiya darhol
        // berilmaydi, foydalanuvchi pochtasini tekshirishi kerak.
        if (!data.session) {
          setEmailSent(true);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      // router.refresh() — server tomonidagi sessiyani yangilaydi.
      // Busiz middleware hali ham "kirmagan" deb o'ylashi mumkin.
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const supabase = createClient();

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (oauthError) {
      setError(friendlyError(oauthError.message));
      setGoogleLoading(false);
    }
    // Muvaffaqiyatli bo'lsa brauzer Google'ga o'tib ketadi — bu yerga qaytmaydi.
  }

  // ---- Email tasdiqlash kutilmoqda ----
  if (emailSent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center
                        rounded-2xl bg-accent-50 text-accent-600">
          <MailCheck className="h-7 w-7" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold text-ink-900">{t("auth.checkEmail.title")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{t("auth.checkEmail.body")}</p>
        <p className="mt-4 text-sm font-medium text-ink-900">{email}</p>
      </div>
    );
  }

  const isSignup = mode === "signup";

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">
        {t(isSignup ? "auth.signup.title" : "auth.login.title")}
      </h1>
      <p className="mt-1.5 text-sm text-ink-600">
        {t(isSignup ? "auth.signup.subtitle" : "auth.login.subtitle")}
      </p>

      {/* ---- Google ---- */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="btn-secondary mt-6 w-full"
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <GoogleIcon />
        )}
        {t("auth.google")}
      </button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-ink-200" />
        <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
          {t("auth.or")}
        </span>
        <span className="h-px flex-1 bg-ink-200" />
      </div>

      {/* ---- Email + parol ---- */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <div>
            <label htmlFor="fullName" className="label">
              {t("auth.fullName")}
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              placeholder="Aziz Karimov"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="label">
            {t("auth.email")}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            {t("auth.password")}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={isSignup ? 8 : undefined}
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pr-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center
                         text-ink-400 hover:text-ink-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {isSignup && <p className="mt-1.5 text-xs text-ink-500">{t("auth.passwordHint")}</p>}
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3
                       text-sm text-red-800 ring-1 ring-inset ring-red-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={loading || googleLoading} className="btn-primary w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t(isSignup ? "auth.submitSignup" : "auth.submitLogin")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600">
        {t(isSignup ? "auth.haveAccount" : "auth.noAccount")}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-semibold text-brand-700 hover:text-brand-800"
        >
          {t(isSignup ? "auth.loginLink" : "auth.signupLink")}
        </Link>
      </p>
    </div>
  );
}

/** Google'ning rasmiy rangli logotipi */
function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51Z"
      />
    </svg>
  );
}
