"use client";

/**
 * WRITING mashqi — IELTS Task 2 esse.
 *
 * Real imtihon sharoitiga yaqinlashtirilgan:
 *   - taymer ishlaydi (40 daqiqa)
 *   - so'zlar soni jonli hisoblanadi
 *   - minimal so'z sonidan kam bo'lsa ogohlantiriladi
 *
 * Taymer TUGAGANDA mashq majburan to'xtatilmaydi — chunki bu o'quv
 * mashqi, jazolash emas. Lekin vaqt qizil rangda ko'rsatiladi.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Clock, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import type { WritingTask } from "@/lib/prompts/practice";

export function WritingView({
  task,
  onSubmit,
}: {
  task: WritingTask;
  onSubmit: (essay: string) => void;
}) {
  const { t } = useI18n();
  const [essay, setEssay] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(task.timeMinutes * 60);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Taymer — har soniyada bir marta yangilanadi
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // So'zlarni sanaymiz. useMemo — har harf yozilganda qayta hisoblamaslik uchun
  const wordCount = useMemo(() => {
    const matches = essay.trim().match(/\S+/g);
    return matches ? matches.length : 0;
  }, [essay]);

  const enough = wordCount >= task.minWords;
  const timeUp = secondsLeft === 0;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="space-y-4">
      {/* =============== Savol =============== */}
      <div className="card p-6">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase
                        tracking-wide text-brand-700">
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Writing Task 2
        </div>
        <p className="en-text whitespace-pre-wrap text-[15px] leading-relaxed text-ink-900">
          {task.prompt}
        </p>
      </div>

      {/* =============== Yozish maydoni =============== */}
      <div className="card overflow-hidden">
        {/* Yuqori panel: taymer va so'zlar soni */}
        <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50 px-4 py-2.5">
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums ${
              timeUp ? "text-red-600" : secondsLeft < 300 ? "text-orange-600" : "text-ink-600"
            }`}
          >
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {minutes}:{String(seconds).padStart(2, "0")}
          </span>

          <span
            className={`text-sm font-semibold tabular-nums ${
              enough ? "text-accent-700" : "text-ink-500"
            }`}
          >
            {wordCount} / {task.minWords} {t("practice.words")}
          </span>
        </div>

        <textarea
          ref={textareaRef}
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          placeholder="Write your essay here..."
          spellCheck={false}
          className="en-text min-h-[380px] w-full resize-y border-0 px-5 py-4 text-[15px]
                     leading-[1.8] text-ink-900 outline-none placeholder:text-ink-400"
        />
      </div>

      {/* So'z soni yetarli emasligi haqida ogohlantirish */}
      {!enough && wordCount > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-3 text-sm
                        text-amber-900 ring-1 ring-inset ring-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{t("practice.minWords", { n: task.minWords })}</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => onSubmit(essay)}
        disabled={wordCount < 20}
        className="btn-primary btn-lg w-full"
      >
        {t("practice.submit")}
      </button>
    </div>
  );
}
