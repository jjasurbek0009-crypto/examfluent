"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { CEFR_TO_IELTS } from "@/lib/cefr";
import type { Profile } from "@/lib/types";

/** Tanlash mumkin bo'lgan IELTS maqsad ballari */
const BAND_OPTIONS = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5];
const GOAL_OPTIONS = [10, 15, 30, 45, 60];

export function SettingsForm({ profile }: { profile: Profile }) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [targetBand, setTargetBand] = useState<number>(
    profile.target_band ?? (profile.cefr_level ? CEFR_TO_IELTS[profile.cefr_level].typical : 6.5),
  );
  const [dailyGoal, setDailyGoal] = useState<number>(profile.daily_goal_min);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          ui_lang: locale,
          target_band: targetBand,
          daily_goal_min: dailyGoal,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setSaved(true);
      router.refresh();
      // Xabar 2 soniyadan keyin o'chadi
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError(t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ---- Daraja ---- */}
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">{t("settings.level")}</h2>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <LevelBadge level={profile.cefr_level} withTitle />
          <Link href="/placement" className="btn-secondary">
            <RotateCcw className="h-4 w-4" aria-hidden />
            {t("placement.result.retake")}
          </Link>
        </div>
      </section>

      {/* ---- Til ---- */}
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">{t("settings.language")}</h2>
        <LanguageSwitcher />
      </section>

      {/* ---- Ism ---- */}
      <section className="card p-5">
        <label htmlFor="fullName" className="label">
          {t("auth.fullName")}
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input"
          maxLength={80}
        />
      </section>

      {/* ---- Maqsadli band ---- */}
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">{t("settings.targetBand")}</h2>
        <div className="flex flex-wrap gap-2">
          {BAND_OPTIONS.map((band) => (
            <button
              key={band}
              type="button"
              onClick={() => setTargetBand(band)}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold tabular-nums
                          transition-colors ${
                            targetBand === band
                              ? "bg-brand-700 text-white"
                              : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                          }`}
            >
              {band.toFixed(1)}
            </button>
          ))}
        </div>
      </section>

      {/* ---- Kunlik maqsad ---- */}
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">{t("settings.dailyGoal")}</h2>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => setDailyGoal(min)}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                dailyGoal === min
                  ? "bg-brand-700 text-white"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200"
              }`}
            >
              {min} {t("common.minutes")}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm
                     text-red-800 ring-1 ring-inset ring-red-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      <button type="button" onClick={save} disabled={saving} className="btn-primary btn-lg w-full">
        {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {saved && <Check className="h-4 w-4" aria-hidden />}
        {saved ? t("settings.saved") : t("common.save")}
      </button>

      {/* ---- Chiqish ---- */}
      <form action="/auth/signout" method="post">
        <button type="submit" className="btn-ghost w-full text-red-600 hover:bg-red-50">
          {t("nav.logout")}
        </button>
      </form>
    </div>
  );
}
