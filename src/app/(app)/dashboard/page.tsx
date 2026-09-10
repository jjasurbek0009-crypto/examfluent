/**
 * DASHBOARD — kirgan foydalanuvchining bosh sahifasi.
 *
 * Bu Server Component: barcha ma'lumot serverda yig'iladi va tayyor
 * HTML yuboriladi. Natijada sahifa "sakramasdan" darhol to'liq ko'rinadi.
 */

import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  Flame,
  MessageSquareText,
  Mic,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { BandHistoryChart, WeeklyActivityChart } from "@/components/dashboard/ActivityChart";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { getSessionUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { CEFR_META, CEFR_TO_IELTS, type CefrLevel } from "@/lib/cefr";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

// Har safar yangi ma'lumot ko'rsatilishi uchun keshni o'chiramiz
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { t, locale } = getT();
  const { user, profile, supabase } = await getSessionUser();
  const p = profile as Profile | null;

  // -------------------------------------------------------------------
  // Ma'lumotlarni PARALLEL yuklaymiz (Promise.all) — ketma-ket emas.
  // Bu sahifa ochilish vaqtini 3 barobar tezlashtiradi.
  // -------------------------------------------------------------------
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [activityRes, bandRes, vocabTotalRes, vocabDueRes] = await Promise.all([
    supabase
      .from("daily_activity")
      .select("activity_date, xp")
      .gte("activity_date", sevenDaysAgoStr)
      .order("activity_date", { ascending: true }),
    supabase
      .from("exercise_attempts")
      .select("band_score, created_at")
      .not("band_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("vocab_cards").select("id", { count: "exact", head: true }),
    supabase
      .from("vocab_cards")
      .select("id", { count: "exact", head: true })
      .lte("due_date", today),
  ]);

  // ---- Haftalik grafik uchun 7 kunni to'ldiramiz (bo'sh kunlar ham ko'rinsin) ----
  const activityMap = new Map(
    (activityRes.data ?? []).map((r) => [r.activity_date as string, r.xp as number]),
  );
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return {
      label: d.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", { weekday: "short" }),
      xp: activityMap.get(key) ?? 0,
    };
  });

  // ---- Band score tarixi (eskisidan yangisiga qarab chizamiz) ----
  const bandHistory = (bandRes.data ?? [])
    .slice()
    .reverse()
    .map((r) => ({
      label: new Date(r.created_at as string).toLocaleDateString(
        locale === "ru" ? "ru-RU" : "en-GB",
        { day: "2-digit", month: "short" },
      ),
      band: Number(r.band_score),
    }));

  const latestBand = bandRes.data?.[0]?.band_score ?? null;
  const vocabTotal = vocabTotalRes.count ?? 0;
  const vocabDue = vocabDueRes.count ?? 0;

  const firstName =
    p?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "";

  // -------------------------------------------------------------------
  //  Placement testi topshirilmagan bo'lsa — hamma narsadan oldin shu
  // -------------------------------------------------------------------
  if (!p?.placement_done) {
    return (
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          {t("dash.greeting")}, {firstName} 👋
        </h1>

        <div className="card mt-6 overflow-hidden">
          <div className="bg-brand-700 px-6 py-8 text-center sm:px-10 sm:py-10">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center
                            rounded-2xl bg-white/15 text-white">
              <Target className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              {t("dash.startPlacement.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-brand-100">
              {t("dash.startPlacement.body")}
            </p>
            <Link
              href="/placement"
              className="btn btn-lg mt-6 bg-white text-brand-800 hover:bg-brand-50"
            >
              {t("dash.startPlacement.cta")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-3 divide-x divide-ink-200 text-center">
            <Info value="20" label={t("common.questions")} />
            <Info value="10" label={t("common.minutes")} />
            <Info value="A1–C2" label="CEFR" />
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  //  Asosiy dashboard
  // -------------------------------------------------------------------
  const level = p.cefr_level as CefrLevel;
  const targetBand = CEFR_TO_IELTS[level].typical;

  return (
    <div className="animate-fade-up space-y-6">
      {/* ---- Sarlavha ---- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            {t("dash.greeting")}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-ink-600">{CEFR_META[level][locale === "ru" ? "ru" : "uz"]}</p>
        </div>
        <LevelBadge level={level} withTitle />
      </div>

      {/* ---- Statistika kartochkalari ---- */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Target className="h-4 w-4" />}
          delay={1}
          label={t("dash.yourLevel")}
          value={level}
          hint={CEFR_META[level].title}
          tone="brand"
        />
        <StatCard
          icon={<Flame className="h-4 w-4" />}
          delay={2}
          label={t("dash.streak")}
          value={String(p.streak_count)}
          hint={t("dash.days")}
          tone="orange"
        />
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          delay={3}
          label={t("dash.words")}
          value={String(vocabTotal)}
          hint={vocabDue > 0 ? `${vocabDue} ${t("dash.dueCards")}` : undefined}
          tone="ink"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          delay={4}
          label={t("dash.band")}
          value={latestBand ? Number(latestBand).toFixed(1) : t("dash.noBand")}
          hint={`→ ${targetBand.toFixed(1)}`}
          tone="accent"
        />
      </div>

      {/* ---- Tezkor harakatlar ---- */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <QuickAction
          href="/chat"
          icon={<MessageSquareText className="h-5 w-5" />}
          delay={1}
          label={t("dash.quickChat")}
        />
        <QuickAction
          href="/practice"
          icon={<Target className="h-5 w-5" />}
          delay={2}
          label={t("dash.quickPractice")}
        />
        <QuickAction
          href="/vocab"
          icon={<BookOpen className="h-5 w-5" />}
          delay={3}
          label={t("dash.quickVocab")}
          badge={vocabDue > 0 ? vocabDue : undefined}
        />
        <QuickAction
          href="/pronunciation"
          icon={<Mic className="h-5 w-5" />}
          delay={4}
          label={t("dash.quickPron")}
        />
      </div>

      {/* ---- Grafiklar ---- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card animate-fade-up p-5 delay-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">
            {t("dash.weeklyActivity")}
          </h2>
          <WeeklyActivityChart data={weekly} />
        </div>

        <div className="card animate-fade-up p-5 delay-6">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">{t("dash.bandHistory")}</h2>
          {bandHistory.length >= 2 ? (
            <BandHistoryChart data={bandHistory} />
          ) : (
            <EmptyChart text={t("dash.noData")} />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Kichik yordamchi komponentlar
// ---------------------------------------------------------------------------

function Info({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4 py-4">
      <div className="text-lg font-bold text-ink-900">{value}</div>
      <div className="text-xs text-ink-500">{label}</div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone: "brand" | "accent" | "orange" | "ink";
  /** Ketma-ket paydo bo'lish uchun kechikish qadami (1-4) */
  delay?: number;
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    accent: "bg-accent-50 text-accent-700",
    orange: "bg-orange-50 text-orange-600",
    ink: "bg-ink-100 text-ink-600",
  };

  return (
    <div className="card animate-fade-up p-4" style={{ animationDelay: `${delay * 70}ms` }}>
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${tones[tone]}`}>
          {icon}
        </span>
        <span className="text-xs font-medium text-ink-500">{label}</span>
      </div>
      <div className="mt-2.5 text-2xl font-bold tracking-tight text-ink-900">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-500">{hint}</div>}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  badge,
  delay = 0,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  delay?: number;
}) {
  return (
    <Link
      href={href}
      className="card-hover group relative flex animate-fade-up flex-col items-start gap-3 p-4"
      style={{ animationDelay: `${delay * 70}ms` }}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl
                       bg-brand-50 text-brand-700 transition-all duration-300
                       group-hover:scale-110 group-hover:bg-brand-100">
        {icon}
      </span>
      <span className="text-sm font-semibold text-ink-900">{label}</span>
      {badge !== undefined && (
        <span className="absolute right-3 top-3 inline-flex min-w-[20px] items-center
                         justify-center rounded-full bg-accent-500 px-1.5 py-0.5
                         text-[11px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-[180px] flex-col items-center justify-center gap-2 text-center">
      <Sparkles className="h-5 w-5 text-ink-300" aria-hidden />
      <p className="max-w-[220px] text-xs text-ink-500">{text}</p>
    </div>
  );
}
