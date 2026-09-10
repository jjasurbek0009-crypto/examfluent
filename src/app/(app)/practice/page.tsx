/**
 * MASHQLAR bosh sahifasi — ko'nikma tanlash.
 *
 * Bu yerda foydalanuvchining har bir ko'nikma bo'yicha oxirgi band
 * ballari ham ko'rsatiladi, shunda qaysi tomon zaifligini darhol ko'radi.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BookOpen, Headphones, PenLine } from "lucide-react";
import { getSessionUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { LevelBadge } from "@/components/ui/LevelBadge";
import type { CefrLevel } from "@/lib/cefr";
import type { Profile } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = { title: "IELTS practice" };
export const dynamic = "force-dynamic";

const SKILL_CARDS = [
  {
    skill: "reading" as const,
    icon: BookOpen,
    titleKey: "practice.reading" as TranslationKey,
    descKey: "practice.reading.desc" as TranslationKey,
  },
  {
    skill: "listening" as const,
    icon: Headphones,
    titleKey: "practice.listening" as TranslationKey,
    descKey: "practice.listening.desc" as TranslationKey,
  },
  {
    skill: "writing" as const,
    icon: PenLine,
    titleKey: "practice.writing" as TranslationKey,
    descKey: "practice.writing.desc" as TranslationKey,
  },
];

export default async function PracticePage() {
  const { t } = getT();
  const { profile, supabase } = await getSessionUser();
  const p = profile as Profile | null;

  // Mashqlar darajaga moslanadi — daraja bo'lmasa avval test
  if (!p?.placement_done) redirect("/placement");

  const level = p.cefr_level as CefrLevel;

  // Har bir ko'nikma bo'yicha oxirgi 20 ta urinishni olamiz va
  // eng so'nggisini ko'rsatamiz. (Bitta so'rov — uch marta emas.)
  const { data: attempts } = await supabase
    .from("exercise_attempts")
    .select("skill, band_score, created_at")
    .not("band_score", "is", null)
    .order("created_at", { ascending: false })
    .limit(60);

  const lastBand = new Map<string, number>();
  for (const row of attempts ?? []) {
    if (!lastBand.has(row.skill as string)) {
      lastBand.set(row.skill as string, Number(row.band_score));
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            {t("practice.title")}
          </h1>
          <p className="mt-1 text-sm text-ink-600">{t("practice.subtitle")}</p>
        </div>
        <LevelBadge level={level} withTitle />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SKILL_CARDS.map(({ skill, icon: Icon, titleKey, descKey }, i) => {
          const band = lastBand.get(skill);

          return (
            <Link
              key={skill}
              href={`/practice/${skill}`}
              className="card-hover group flex animate-fade-up flex-col p-5"
              style={{ animationDelay: `${(i + 1) * 80}ms` }}
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl
                                 bg-brand-50 text-brand-700 transition-all duration-300
                                 group-hover:scale-110 group-hover:bg-brand-100">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>

                {band !== undefined && (
                  <div className="text-right">
                    <div className="text-xl font-bold tabular-nums text-ink-900">
                      {band.toFixed(1)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-ink-400">
                      band
                    </div>
                  </div>
                )}
              </div>

              <h2 className="mt-4 text-base font-semibold text-ink-900">{t(titleKey)}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{t(descKey)}</p>
            </Link>
          );
        })}
      </div>

      {/* Speaking hozircha alohida bo'limda — talaffuz sahifasiga yo'naltiramiz */}
      <div className="card mt-4 flex animate-fade-up flex-wrap items-center justify-between gap-4 p-5 delay-4">
        <div>
          <h2 className="text-base font-semibold text-ink-900">{t("practice.speaking")}</h2>
          <p className="mt-1 text-sm text-ink-600">{t("practice.speaking.desc")}</p>
        </div>
        <Link href="/pronunciation" className="btn-secondary">
          {t("common.start")}
        </Link>
      </div>
    </div>
  );
}
