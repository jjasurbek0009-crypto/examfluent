"use client";

/**
 * READING va LISTENING mashqlarining interfeysi.
 *
 * Farqi bitta: Reading'da matn ko'rinadi, Listening'da esa matn
 * YASHIRIN — u faqat ovoz orqali eshitiladi (brauzerning o'z
 * ovoz sintezatori bilan, bepul).
 */

import { useState } from "react";
import { Headphones, Pause, Play, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useSpeech } from "@/lib/hooks/useSpeech";
import type { ComprehensionTask } from "@/lib/prompts/practice";

export function ComprehensionView({
  skill,
  task,
  onSubmit,
}: {
  skill: "reading" | "listening";
  task: ComprehensionTask;
  onSubmit: (answers: number[]) => void;
}) {
  const { t } = useI18n();
  const speech = useSpeech();

  // Har bir savol uchun tanlangan variant (-1 = tanlanmagan)
  const [answers, setAnswers] = useState<number[]>(() => task.questions.map(() => -1));
  const [playedOnce, setPlayedOnce] = useState(false);

  const allAnswered = answers.every((a) => a >= 0);
  const isListening = skill === "listening";

  function choose(questionIndex: number, optionIndex: number) {
    setAnswers((prev) => prev.map((v, i) => (i === questionIndex ? optionIndex : v)));
  }

  function togglePlay() {
    if (speech.speaking) {
      speech.stop();
    } else {
      speech.speak(task.passage);
      setPlayedOnce(true);
    }
  }

  return (
    <div className="space-y-4">
      {/* =============== Matn yoki ovoz =============== */}
      {isListening ? (
        <div className="card p-6 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center
                          rounded-2xl bg-brand-50 text-brand-700">
            <Headphones className="h-6 w-6" aria-hidden />
          </div>

          <h2 className="text-base font-semibold text-ink-900">{task.title}</h2>

          {speech.supported ? (
            <>
              <button type="button" onClick={togglePlay} className="btn-primary btn-lg mt-5">
                {speech.speaking ? (
                  <>
                    <Pause className="h-4 w-4" aria-hidden />
                    {t("pron.stop")}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" aria-hidden />
                    {playedOnce ? t("practice.replay") : t("practice.playAudio")}
                  </>
                )}
              </button>

              {/* Tezlikni sozlash — boshlang'ich darajadagilar uchun muhim */}
              <div className="mx-auto mt-5 flex max-w-xs items-center gap-3">
                <Volume2 className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
                <input
                  type="range"
                  min={0.6}
                  max={1.2}
                  step={0.05}
                  value={speech.rate}
                  onChange={(e) => speech.setRate(Number(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ink-200
                             accent-brand-600"
                  aria-label="Speed"
                />
                <span className="w-10 text-right text-xs font-medium text-ink-500">
                  {speech.rate.toFixed(2)}×
                </span>
              </div>
            </>
          ) : (
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900
                          ring-1 ring-inset ring-amber-200">
              {t("pron.notSupported")}
            </p>
          )}
        </div>
      ) : (
        <div className="card p-6">
          <h2 className="mb-3 text-base font-semibold text-ink-900">{task.title}</h2>
          <p className="en-text whitespace-pre-wrap text-[15px] leading-[1.75] text-ink-800">
            {task.passage}
          </p>
        </div>
      )}

      {/* =============== Savollar =============== */}
      <div className="card divide-y divide-ink-200">
        {task.questions.map((q, qi) => (
          <fieldset key={qi} className="p-5">
            <legend className="sr-only">
              {t("common.questions")} {qi + 1}
            </legend>

            <p className="en-text mb-3 flex gap-2.5 text-[15px] font-medium text-ink-900">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md
                               bg-ink-100 text-xs font-bold text-ink-600">
                {qi + 1}
              </span>
              {q.question}
            </p>

            <div className="ml-[34px] space-y-2">
              {q.options.map((option, oi) => {
                const checked = answers[qi] === oi;
                return (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-2.5
                                transition-all ${
                                  checked
                                    ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                                    : "border-ink-200 hover:border-ink-300 hover:bg-ink-50"
                                }`}
                  >
                    <input
                      type="radio"
                      name={`q-${qi}`}
                      checked={checked}
                      onChange={() => choose(qi, oi)}
                      className="mt-1 h-4 w-4 shrink-0 accent-brand-600"
                    />
                    <span className="en-text text-[15px] text-ink-900">{option}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {/* =============== Yuborish =============== */}
      <button
        type="button"
        onClick={() => onSubmit(answers)}
        disabled={!allAnswered}
        className="btn-primary btn-lg w-full"
      >
        {t("practice.submit")}
      </button>

      {!allAnswered && (
        <p className="text-center text-xs text-ink-500">
          {answers.filter((a) => a >= 0).length} / {answers.length}
        </p>
      )}
    </div>
  );
}
