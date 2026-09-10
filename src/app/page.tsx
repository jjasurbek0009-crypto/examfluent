/**
 * Landing (bosh) sahifa.
 *
 * Server Component — brauzerga deyarli JS yuborilmaydi, shuning uchun
 * juda tez ochiladi. Faqat animatsiya kerak bo'lgan qismlar (ChatDemo,
 * Reveal, LanguageSwitcher) client komponent.
 *
 * Animatsiya falsafasi: NOZIK va MAQSADLI.
 * Imtihon tayyorgarligi platformasi jiddiy ko'rinishi kerak — sakrab
 * turgan rangli elementlar ishonchni yo'qotadi. Shuning uchun:
 *   - faqat pastdan suzib chiqish va yumshoq ko'tarilish
 *   - ketma-ket (stagger) kechikish bilan
 *   - fon nurlari juda sekin harakatlanadi (18 soniya)
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  GraduationCap,
  Headphones,
  Layers,
  MessageSquareText,
  Mic,
  Target,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Reveal } from "@/components/ui/Reveal";
import { ChatDemo } from "@/components/landing/ChatDemo";
import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { CEFR_LEVELS, CEFR_META } from "@/lib/cefr";

export default async function HomePage() {
  const { t } = getT();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const features = [
    {
      icon: Target,
      title: t("landing.feature.placement.title"),
      body: t("landing.feature.placement.body"),
    },
    {
      icon: MessageSquareText,
      title: t("landing.feature.chat.title"),
      body: t("landing.feature.chat.body"),
    },
    {
      icon: GraduationCap,
      title: t("landing.feature.ielts.title"),
      body: t("landing.feature.ielts.body"),
    },
    {
      icon: Layers,
      title: t("landing.feature.vocab.title"),
      body: t("landing.feature.vocab.body"),
    },
    {
      icon: Mic,
      title: t("landing.feature.pron.title"),
      body: t("landing.feature.pron.body"),
    },
    {
      icon: BarChart3,
      title: t("landing.feature.progress.title"),
      body: t("landing.feature.progress.body"),
    },
  ];

  const skills = [
    { icon: BookOpen, label: "Reading" },
    { icon: Headphones, label: "Listening" },
    { icon: GraduationCap, label: "Writing" },
    { icon: Mic, label: "Speaking" },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* ================= Yuqori panel ================= */}
      <header
        className="sticky top-0 z-30 border-b border-ink-200/60 bg-white/80 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo href={null} />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <LanguageSwitcher compact />
            </div>
            <Link href="/login" className="btn-ghost">
              {t("landing.hero.login")}
            </Link>
            <Link href="/signup" className="btn-primary btn-shine">
              {t("landing.hero.cta")}
            </Link>
          </div>
        </div>
      </header>

      {/* ================= Hero ================= */}
      <section className="relative">
        {/* Fon nurlari — juda sekin suzadi, e'tiborni tortmaydi */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-40 left-1/4 h-[26rem] w-[26rem] animate-float-slow
                       rounded-full bg-brand-300/25 blur-3xl"
          />
          <div
            className="absolute -top-24 right-1/4 h-[22rem] w-[22rem] animate-float-slow
                       rounded-full bg-accent-300/20 blur-3xl"
            style={{ animationDelay: "-7s" }}
          />
          {/* Nozik to'r naqshi — chuqurlik beradi */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "radial-gradient(ellipse 70% 55% at 50% 30%, black, transparent)",
              WebkitMaskImage:
                "radial-gradient(ellipse 70% 55% at 50% 30%, black, transparent)",
            }}
          />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14
                        lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-20">
          {/* ---- Chap: matn ---- */}
          <div className="text-center lg:text-left">
            <span
              className="animate-fade-up inline-flex items-center gap-2 rounded-full border
                         border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-800"
            >
              <span className="relative flex h-1.5 w-1.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-600" />
              </span>
              CEFR A1–C2 · IELTS
            </span>

            <h1
              className="animate-fade-up delay-1 mt-6 text-4xl font-bold leading-[1.08]
                         tracking-tight text-ink-900 sm:text-5xl lg:text-[3.4rem]"
            >
              {t("landing.hero.title")}
            </h1>

            <p
              className="animate-fade-up delay-2 mx-auto mt-5 max-w-xl text-lg leading-relaxed
                         text-ink-600 lg:mx-0"
            >
              {t("landing.hero.subtitle")}
            </p>

            <div
              className="animate-fade-up delay-3 mt-8 flex flex-col items-center gap-3
                         sm:flex-row lg:justify-start"
            >
              <Link href="/signup" className="btn-primary btn-shine btn-lg w-full sm:w-auto">
                {t("landing.hero.cta")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link href="/login" className="btn-secondary btn-lg w-full sm:w-auto">
                {t("landing.hero.login")}
              </Link>
            </div>

            <p className="animate-fade-up delay-4 mt-4 flex items-center justify-center gap-1.5
                          text-sm text-ink-500 lg:justify-start">
              <Check className="h-3.5 w-3.5 text-accent-600" aria-hidden />
              {t("landing.hero.note")}
            </p>
          </div>

          {/* ---- O'ng: jonli demo ---- */}
          <div className="animate-fade-up delay-4 lg:pl-4">
            <ChatDemo />
          </div>
        </div>
      </section>

      {/* ================= CEFR shkalasi ================= */}
      <section className="border-y border-ink-200 bg-ink-50/60">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <Reveal>
            <p className="mb-7 text-center text-sm font-medium text-ink-500">
              {t("landing.scale.note")}
            </p>
          </Reveal>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
            {CEFR_LEVELS.map((level, i) => (
              <Reveal key={level} delay={i}>
                <div className="group text-center">
                  <div className="mb-2.5 h-1.5 overflow-hidden rounded-full bg-ink-200">
                    <div
                      className={`h-1.5 animate-grow-x rounded-full ${CEFR_META[level].bar}`}
                      style={{
                        width: `${((i + 1) / CEFR_LEVELS.length) * 100}%`,
                        animationDelay: `${i * 90}ms`,
                      }}
                    />
                  </div>
                  <div className="text-base font-bold text-ink-900 transition-colors
                                  group-hover:text-brand-700">
                    {level}
                  </div>
                  <div className="text-[11px] leading-tight text-ink-500">
                    {CEFR_META[level].title}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Imkoniyatlar ================= */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight
                         text-ink-900 sm:text-4xl">
            {t("landing.features.title")}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i}>
              <div className="card-hover group h-full p-6">
                <div
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl
                             bg-brand-50 text-brand-700 transition-all duration-300
                             group-hover:scale-110 group-hover:bg-brand-100"
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-ink-900">{title}</h3>
                <p className="text-sm leading-relaxed text-ink-600">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= To'rt ko'nikma ================= */}
      <section className="border-t border-ink-200 bg-ink-50/60">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <Reveal>
            <h2 className="text-center text-2xl font-bold tracking-tight text-ink-900">
              {t("landing.skills.title")}
            </h2>
          </Reveal>

          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {skills.map(({ icon: Icon, label }, i) => (
              <Reveal key={label} delay={i}>
                <div className="card-hover group flex flex-col items-center gap-3 p-6 text-center">
                  <span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl
                               bg-white text-brand-700 shadow-card transition-all duration-300
                               group-hover:-translate-y-0.5 group-hover:bg-brand-700 group-hover:text-white"
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-ink-900">{label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Yakuniy chaqiriq ================= */}
      <section className="mx-auto max-w-4xl px-5 py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-brand-800 px-6 py-14 text-center">
            {/* Sekin harakatlanuvchi gradient */}
            <div
              aria-hidden
              className="animate-drift absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "linear-gradient(120deg, #1c2eaf 0%, #2044ed 35%, #1a34d9 65%, #151d54 100%)",
              }}
            />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t("landing.hero.cta")}
              </h2>
              <p className="mx-auto mt-4 max-w-md text-brand-100">
                {t("landing.hero.note")}
              </p>
              <Link
                href="/signup"
                className="btn btn-lg mt-8 bg-white text-brand-800 shadow-lift
                           hover:-translate-y-0.5 hover:bg-brand-50"
              >
                {t("dash.startPlacement.cta")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= Pastki panel ================= */}
      <footer className="border-t border-ink-200 bg-ink-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4
                        px-5 py-8 sm:flex-row">
          <Logo href={null} size="sm" />
          <p className="text-sm text-ink-500">{t("app.tagline")}</p>
          <LanguageSwitcher compact />
        </div>
      </footer>
    </div>
  );
}
