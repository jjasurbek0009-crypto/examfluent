"use client";

/**
 * NATIJA EKRANI — mashq bahosi.
 *
 * Ikki xil ko'rinish:
 *   - Reading/Listening : nechta to'g'ri + har bir savolning izohi
 *   - Writing           : IELTS band + 4 mezon + batafsil fikr-mulohaza
 *
 * Band score ataylab yirik va markazda ko'rsatilgan — bu foydalanuvchi
 * uchun eng muhim raqam.
 */

import { Check, RefreshCw, ThumbsUp, TrendingUp, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { EvalResult, WritingResult } from "./PracticeRunner";

export function ResultPanel({
  result,
  onRestart,
}: {
  result: EvalResult;
  onRestart: () => void;
}) {
  const { t } = useI18n();
  const isWriting = result.skill === "writing";

  return (
    <div className="animate-fade-up space-y-4">
      {/* =============== Asosiy ball =============== */}
      <div className="card overflow-hidden">
        <div className="bg-brand-700 px-6 py-8 text-center">
          <p className="text-sm font-medium text-brand-200">{t("practice.yourBand")}</p>
          <div className="mt-1 animate-pop-in text-6xl font-bold tracking-tight text-white tabular-nums">
            {result.band.toFixed(1)}
          </div>
          <p className="mt-2 text-xs text-brand-200">IELTS · CEFR {result.level}</p>
        </div>

        {!isWriting && (
          <div className="px-6 py-4 text-center">
            <span className="text-sm text-ink-600">
              <strong className="text-ink-900">{result.correctCount}</strong> / {result.total}{" "}
              {t("practice.correct").toLowerCase()}
            </span>
          </div>
        )}
      </div>

      {isWriting ? (
        <WritingFeedback result={result as WritingResult} />
      ) : (
        <QuestionReview result={result} />
      )}

      <button type="button" onClick={onRestart} className="btn-secondary btn-lg w-full">
        <RefreshCw className="h-4 w-4" aria-hidden />
        {t("practice.tryAgain")}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Reading / Listening — savollarni ko'rib chiqish
// ---------------------------------------------------------------------------

function QuestionReview({ result }: { result: Extract<EvalResult, { results: unknown[] }> }) {
  const { t } = useI18n();

  return (
    <div className="card divide-y divide-ink-200">
      {result.results.map((r, i) => (
        <div key={i} className="p-5">
          <div className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                r.correct ? "bg-accent-100 text-accent-700" : "bg-red-100 text-red-700"
              }`}
            >
              {r.correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            </span>
            <p className="en-text text-[15px] font-medium text-ink-900">{r.question}</p>
          </div>

          <div className="ml-[34px] mt-3 space-y-1.5">
            {r.options.map((option, oi) => {
              const isCorrect = oi === r.correctIndex;
              const isChosen = oi === r.chosen;

              return (
                <div
                  key={oi}
                  className={`en-text flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    isCorrect
                      ? "bg-accent-50 font-medium text-accent-900 ring-1 ring-inset ring-accent-200"
                      : isChosen
                        ? "bg-red-50 text-red-900 ring-1 ring-inset ring-red-200"
                        : "text-ink-500"
                  }`}
                >
                  {isCorrect && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                  {isChosen && !isCorrect && <X className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                  {option}
                </div>
              );
            })}
          </div>

          {r.explanation && (
            <p className="ml-[34px] mt-2.5 rounded-lg bg-ink-50 px-3 py-2 text-xs
                          leading-relaxed text-ink-600">
              {r.explanation}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Writing — batafsil baholash
// ---------------------------------------------------------------------------

const CRITERIA_KEYS: Array<{ key: keyof WritingResult["criteria"]; label: TranslationKey }> = [
  { key: "task", label: "practice.criteria.task" },
  { key: "coherence", label: "practice.criteria.coherence" },
  { key: "lexical", label: "practice.criteria.lexical" },
  { key: "grammar", label: "practice.criteria.grammar" },
];

function WritingFeedback({ result }: { result: WritingResult }) {
  const { t } = useI18n();
  const { criteria, feedback } = result;

  return (
    <>
      {/* ---- 4 ta IELTS mezoni ---- */}
      <div className="card p-5">
        <div className="space-y-3.5">
          {CRITERIA_KEYS.map(({ key, label }) => {
            const value = criteria[key];
            return (
              <div key={key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-700">{t(label)}</span>
                  <span className="text-sm font-bold tabular-nums text-ink-900">
                    {value.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full animate-grow-x rounded-full bg-brand-600"
                    style={{ width: `${(value / 9) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 border-t border-ink-200 pt-4 text-xs text-ink-500">
          {result.wordCount} / {result.minWords} {t("practice.words")}
        </p>
      </div>

      {/* ---- Umumiy izoh ---- */}
      {feedback.summary && (
        <div className="card p-5">
          <p className="text-sm leading-relaxed text-ink-700">{feedback.summary}</p>
        </div>
      )}

      {/* ---- Kuchli tomonlar / yaxshilash ---- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FeedbackCard
          title={t("practice.strengths")}
          items={feedback.strengths}
          tone="accent"
          icon={<ThumbsUp className="h-3.5 w-3.5" />}
        />
        <FeedbackCard
          title={t("practice.improvements")}
          items={feedback.improvements}
          tone="brand"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
      </div>

      {/* ---- Xatolar ---- */}
      {feedback.corrections.length > 0 && (
        <div className="card p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
            {t("chat.corrections")}
          </h3>
          <ul className="space-y-3">
            {feedback.corrections.map((c, i) => (
              <li key={i} className="border-l-2 border-amber-300 pl-3">
                <div className="en-text flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="text-red-700 line-through">{c.original}</span>
                  <span className="text-ink-400" aria-hidden>
                    →
                  </span>
                  <span className="font-semibold text-accent-800">{c.corrected}</span>
                  <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium
                                   uppercase tracking-wide text-ink-600">
                    {c.type}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-600">{c.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function FeedbackCard({
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
  if (items.length === 0) return null;

  const colors = {
    accent: "bg-accent-50 text-accent-700",
    brand: "bg-brand-50 text-brand-700",
  };

  return (
    <div className="card p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-700">
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
