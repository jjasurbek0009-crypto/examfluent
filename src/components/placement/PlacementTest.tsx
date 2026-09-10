"use client";

/**
 * Daraja aniqlash testining interfeysi.
 *
 * Bosqichlar:  intro → savollar → tahlil → natija
 *
 * Muhim: to'g'ri javoblar bu yerda YO'Q. Har bir javob serverga
 * yuboriladi va server keyingi savolni qaytaradi.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  HelpCircle,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { CEFR_LEVELS, CEFR_META, type CefrLevel } from "@/lib/cefr";

/** Serverdan keladigan savol (to'g'ri javobsiz) */
interface SafeQuestion {
  id: string;
  level: CefrLevel;
  skill: "grammar" | "vocabulary" | "reading";
  passage?: string;
  prompt: string;
  options: string[];
}

interface FinalResult {
  level: CefrLevel;
  rawScore: number;
  total: number;
  breakdown: Record<string, number | null>;
  estimatedBand: number;
  ai: { summary: string; strengths: string[]; focus: string[] } | null;
}

type Phase = "intro" | "question" | "analyzing" | "result";

export function PlacementTest({ alreadyDone }: { alreadyDone: boolean }) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("intro");
  const [question, setQuestion] = useState<SafeQuestion | null>(null);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(20);
  const [answers, setAnswers] = useState<Array<{ questionId: string; chosen: number | null }>>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FinalResult | null>(null);

  /**
   * Serverga javoblarni yuborib, keyingi savolni (yoki natijani) oladi.
   * `nextAnswers` — yangilangan javoblar ro'yxati.
   */
  const advance = useCallback(
    async (nextAnswers: Array<{ questionId: string; chosen: number | null }>) => {
      setBusy(true);
      setError(null);

      try {
        const res = await fetch("/api/placement/next", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ answers: nextAnswers, locale }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.done) {
          setResult(data as FinalResult);
          setPhase("result");
          // Dashboard'dagi profil ma'lumotini yangilaymiz
          router.refresh();
        } else {
          setQuestion(data.question);
          setIndex(data.index);
          setTotal(data.total);
          setSelected(null);
          setPhase("question");
        }
      } catch {
        setError(t("common.error"));
      } finally {
        setBusy(false);
      }
    },
    [locale, router, t],
  );

  /** Javobni qayd etib, keyingisiga o'tadi. chosen = null → "Bilmayman" */
  function submitAnswer(chosen: number | null) {
    if (!question || busy) return;

    const next = [...answers, { questionId: question.id, chosen }];
    setAnswers(next);

    if (next.length >= total) setPhase("analyzing");
    void advance(next);
  }

  // Klaviatura bilan javob berish: 1-4 raqamlari (tezlik uchun)
  useEffect(() => {
    if (phase !== "question" || !question) return;

    function onKey(e: KeyboardEvent) {
      const n = Number(e.key);
      if (n >= 1 && n <= (question?.options.length ?? 0)) {
        setSelected(n - 1);
      } else if (e.key === "Enter" && selected !== null) {
        submitAnswer(selected);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, question, selected, busy]);

  // =========================================================================
  //  INTRO
  // =========================================================================
  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-xl animate-fade-up">
        <div className="card p-7 text-center sm:p-9">
          <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center
                          rounded-2xl bg-brand-50 text-brand-700">
            <Target className="h-7 w-7" aria-hidden />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            {t("placement.intro.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-600">
            {t("placement.intro.body")}
          </p>

          <ul className="mx-auto mt-6 max-w-sm space-y-2.5 text-left">
            {[t("placement.intro.rule1"), t("placement.intro.rule2"), t("placement.intro.rule3")].map(
              (rule) => (
                <li key={rule} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" aria-hidden />
                  {rule}
                </li>
              ),
            )}
          </ul>

          {alreadyDone && (
            <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-900
                          ring-1 ring-inset ring-amber-200">
              {t("placement.result.retake")}
            </p>
          )}

          <button
            onClick={() => advance([])}
            disabled={busy}
            className="btn-primary btn-lg mt-7 w-full"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("common.start")}
            {!busy && <ArrowRight className="h-4 w-4" aria-hidden />}
          </button>

          {error && <ErrorLine text={error} />}
        </div>
      </div>
    );
  }

  // =========================================================================
  //  TAHLIL
  // =========================================================================
  if (phase === "analyzing") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden />
        <p className="mt-5 text-sm font-medium text-ink-700">{t("placement.analyzing")}</p>
      </div>
    );
  }

  // =========================================================================
  //  NATIJA
  // =========================================================================
  if (phase === "result" && result) {
    return <ResultView result={result} />;
  }

  // =========================================================================
  //  SAVOL
  // =========================================================================
  if (!question) return null;

  const progress = (index / total) * 100;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink-500">
          <span>
            {t("placement.progress")} {index + 1} {t("common.of")} {total}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <SkillIcon skill={question.skill} />
            {question.skill}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink-200">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div key={question.id} className="card animate-fade-up p-6 sm:p-7">
        {question.passage && (
          <div className="mb-5 rounded-xl border-l-[3px] border-brand-400 bg-ink-50 p-4">
            <p className="en-text text-[15px] leading-relaxed text-ink-700">
              {question.passage}
            </p>
          </div>
        )}

        <p className="en-text text-lg font-medium leading-relaxed text-ink-900">
          {question.prompt}
        </p>

        <div className="mt-5 space-y-2.5">
          {question.options.map((option, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                disabled={busy}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3
                            text-left transition-all ${
                              isSelected
                                ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                                : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50"
                            }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md
                              text-xs font-bold ${
                                isSelected
                                  ? "bg-brand-600 text-white"
                                  : "bg-ink-100 text-ink-500"
                              }`}
                >
                  {i + 1}
                </span>
                <span className="en-text text-[15px] text-ink-900">{option}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => submitAnswer(null)}
            disabled={busy}
            className="btn-ghost text-xs"
          >
            <HelpCircle className="h-3.5 w-3.5" aria-hidden />
            {t("placement.dontKnow")}
          </button>

          <button
            type="button"
            onClick={() => submitAnswer(selected)}
            disabled={selected === null || busy}
            className="btn-primary"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t("common.next")}
            {!busy && <ArrowRight className="h-4 w-4" aria-hidden />}
          </button>
        </div>

        {error && <ErrorLine text={error} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Natija ekrani
// ---------------------------------------------------------------------------

function ResultView({ result }: { result: FinalResult }) {
  const { t, locale } = useI18n();
  const meta = CEFR_META[result.level];
  const levelIndex = CEFR_LEVELS.indexOf(result.level);

  return (
    <div className="mx-auto max-w-2xl animate-fade-up space-y-5">
      {/* ---- Asosiy natija ---- */}
      <div className="card overflow-hidden">
        <div className="bg-brand-700 px-6 py-9 text-center">
          <p className="text-sm font-medium text-brand-200">{t("placement.result.title")}</p>
          <div className="mt-2 animate-pop-in text-6xl font-bold tracking-tight text-white">
            {result.level}
          </div>
          <p className="mt-1.5 text-base font-medium text-brand-100">{meta.title}</p>

          {/* CEFR shkalasidagi o'rni */}
          <div className="mx-auto mt-7 flex max-w-sm gap-1.5">
            {CEFR_LEVELS.map((lvl, i) => (
              <div key={lvl} className="flex-1 text-center">
                <div
                  className={`h-1.5 rounded-full ${
                    i <= levelIndex ? "bg-white" : "bg-white/25"
                  }`}
                />
                <span
                  className={`mt-1.5 block text-[10px] font-semibold ${
                    i === levelIndex ? "text-white" : "text-brand-300"
                  }`}
                >
                  {lvl}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-ink-200 sm:grid-cols-3">
          <Stat label={t("placement.result.bandLabel")} value={`~${result.estimatedBand.toFixed(1)}`} />
          <Stat label={t("practice.correct")} value={`${result.rawScore}/${result.total}`} />
          <div className="col-span-2 border-t border-ink-200 px-4 py-4 sm:col-span-1 sm:border-t-0">
            <p className="text-xs text-ink-500">CEFR</p>
            <p className="mt-1 text-sm leading-snug text-ink-800">
              {locale === "ru" ? meta.ru : meta.uz}
            </p>
          </div>
        </div>
      </div>

      {/* ---- Ko'nikmalar ---- */}
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-900">CEFR breakdown</h2>
        <div className="space-y-3">
          {Object.entries(result.breakdown)
            .filter(([, v]) => v !== null)
            .map(([skill, value]) => (
              <div key={skill}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium capitalize text-ink-700">{skill}</span>
                  <span className="font-semibold text-ink-900">
                    {Math.round((value as number) * 100)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full animate-grow-x rounded-full bg-brand-600"
                    style={{ width: `${(value as number) * 100}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ---- AI izohi ---- */}
      {result.ai && (
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600" aria-hidden />
            <h2 className="text-sm font-semibold text-ink-900">AI</h2>
          </div>

          <p className="text-sm leading-relaxed text-ink-700">{result.ai.summary}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FeedbackList
              title={t("practice.strengths")}
              items={result.ai.strengths}
              tone="accent"
              icon={<Check className="h-3.5 w-3.5" />}
            />
            <FeedbackList
              title={t("practice.improvements")}
              items={result.ai.focus}
              tone="brand"
              icon={<TrendingUp className="h-3.5 w-3.5" />}
            />
          </div>
        </div>
      )}

      <a href="/dashboard" className="btn-primary btn-lg w-full">
        {t("placement.result.cta")}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Kichik komponentlar
// ---------------------------------------------------------------------------

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-4">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink-900">{value}</p>
    </div>
  );
}

function FeedbackList({
  title,
  items,
  tone,
  icon,
}: {
  title: string;
  items: string[];
  tone: "accent" | "brand";
  icon: React.ReactNode;
}) {
  const colors = {
    accent: "bg-accent-50 text-accent-700",
    brand: "bg-brand-50 text-brand-700",
  };

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
            <span
              className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center
                          justify-center rounded-md ${colors[tone]}`}
            >
              {icon}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SkillIcon({ skill }: { skill: string }) {
  if (skill === "reading") return <BookOpen className="h-3.5 w-3.5" aria-hidden />;
  return <Target className="h-3.5 w-3.5" aria-hidden />;
}

function ErrorLine({ text }: { text: string }) {
  return (
    <div
      role="alert"
      className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-red-50 p-3
                 text-sm text-red-800 ring-1 ring-inset ring-red-200"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
      {text}
    </div>
  );
}
