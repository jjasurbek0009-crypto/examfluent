"use client";

/**
 * TALAFFUZ MASHQI.
 *
 * 1. Ekranda jumla chiqadi
 * 2. "Tinglash" bosilsa — jumla to'g'ri talaffuz bilan o'qib beriladi
 * 3. Mikrofon bosiladi, foydalanuvchi jumlani o'qiydi, yana bosadi
 * 4. Ovoz Gemini'ga yuboriladi va u talaffuzni baholaydi
 * 5. Har bir so'z rangli ko'rsatiladi + aniq maslahatlar chiqadi
 *
 * NIMA UCHUN BRAUZERNING NUTQ TANISH XIZMATI EMAS?
 *   Ilgari ovoz matnga aylantirilib, asl jumla bilan so'zma-so'z
 *   solishtirilardi. Ikki muammo bor edi:
 *     - faqat Chrome/Edge'da ishlardi
 *     - "qaysi tovushni noto'g'ri aytdingiz" degan savolga javob bermasdi
 *   Endi Gemini ovozni VA asl jumlani birga ko'rib baho beradi.
 */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Lightbulb,
  Loader2,
  Mic,
  RefreshCw,
  Square,
  Volume2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { useAudioRecorder, MAX_RECORDING_SECONDS } from "@/lib/hooks/useAudioRecorder";
import { accuracyTone } from "@/lib/pronunciation/compare";
import { randomSentence, type PronunciationSentence } from "@/lib/pronunciation/sentences";
import type { CefrLevel } from "@/lib/cefr";

interface WordScore {
  word: string;
  matched: boolean;
  /** Qanday eshitilgani (xato bo'lsa) */
  heard: string;
}

interface Feedback {
  transcript: string;
  accuracy: number;
  words: WordScore[];
  problemWords: string[];
  tips: string[];
}

export function PronunciationTrainer({ level }: { level: CefrLevel }) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const speech = useSpeech();
  const recorder = useAudioRecorder();

  const [sentence, setSentence] = useState<PronunciationSentence>(() => randomSentence(level));
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [assessing, setAssessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  //  Mikrofon
  // -------------------------------------------------------------------------
  async function toggleRecording() {
    setError(null);

    // --- Boshlash ---
    if (!recorder.recording) {
      setFeedback(null);
      speech.stop();
      await recorder.start();
      return;
    }

    // --- Tugatish va baholash ---
    const micHeardSound = recorder.peakLevel >= 0.04;
    const rec = await recorder.stop();
    if (!rec) return;

    // Jim yozuvni serverga yubormaymiz — limit behuda sarflanadi
    if (rec.silent) {
      setError(micHeardSound ? t("chat.voice.convertFailed") : t("chat.voice.silent"));
      return;
    }

    setAssessing(true);
    try {
      const form = new FormData();
      form.append("audio", rec.blob, "speech.wav");
      form.append("targetText", sentence.text);
      form.append("locale", locale);

      const res = await fetch("/api/pronunciation/assess", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.message ?? t("common.error"));
        return;
      }

      setFeedback(data as Feedback);
      router.refresh(); // dashboard statistikasi yangilansin
    } catch {
      setError(t("common.error"));
    } finally {
      setAssessing(false);
    }
  }

  const nextSentence = useCallback(() => {
    speech.stop();
    setFeedback(null);
    setError(null);
    setSentence(randomSentence(level, sentence.text));
  }, [level, sentence.text, speech]);

  // -------------------------------------------------------------------------
  //  Brauzer mikrofonni qo'llamasa
  // -------------------------------------------------------------------------
  if (!recorder.supported) {
    return (
      <div className="card p-7 text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center
                        rounded-2xl bg-amber-50 text-amber-600">
          <AlertCircle className="h-6 w-6" aria-hidden />
        </div>
        <p className="text-sm leading-relaxed text-ink-700">{t("pron.notSupported")}</p>
      </div>
    );
  }

  const tone = feedback ? accuracyTone(feedback.accuracy) : null;
  const busy = recorder.recording || assessing;

  return (
    <div className="space-y-4">
      {/* =============== Jumla =============== */}
      <div className="card p-6 sm:p-7">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-ink-500">{t("pron.readAloud")}</p>
          <span className="rounded-lg bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">
            {sentence.focus}
          </span>
        </div>

        {/* Natija kelganda so'zlar rangli ko'rsatiladi */}
        <p className="en-text text-xl leading-relaxed text-ink-900 sm:text-2xl">
          {feedback && feedback.words.length > 0 ? (
            feedback.words.map((w, i) => (
              <span
                key={i}
                title={w.heard ? `eshitildi: ${w.heard}` : undefined}
                className={
                  w.matched
                    ? "text-accent-700"
                    : "rounded bg-red-50 px-0.5 text-red-700 underline decoration-red-300 decoration-wavy"
                }
              >
                {w.word}
                {i < feedback.words.length - 1 ? " " : ""}
              </span>
            ))
          ) : (
            <>{sentence.text}</>
          )}
        </p>

        {speech.supported && (
          <button
            type="button"
            onClick={() => speech.speak(sentence.text)}
            disabled={busy}
            className="btn-secondary mt-5"
          >
            {speech.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Volume2 className="h-4 w-4" aria-hidden />
            )}
            {t("practice.playAudio")}
          </button>
        )}
      </div>

      {/* =============== Yozib olish =============== */}
      <div className="card p-6 text-center">
        <button
          type="button"
          onClick={toggleRecording}
          disabled={assessing}
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full
                      transition-all disabled:opacity-60 ${
                        recorder.recording
                          ? "bg-red-600 text-white shadow-lg ring-4 ring-red-200"
                          : "bg-brand-700 text-white hover:bg-brand-800 active:scale-95"
                      }`}
          aria-label={recorder.recording ? t("pron.stop") : t("pron.start")}
        >
          {assessing ? (
            <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
          ) : recorder.recording ? (
            <Square className="h-7 w-7 fill-current" aria-hidden />
          ) : (
            <Mic className="h-8 w-8" aria-hidden />
          )}
        </button>

        <p className="mt-4 text-sm font-medium text-ink-700">
          {assessing ? (
            <span className="text-brand-700">{t("pron.assessing")}</span>
          ) : recorder.recording ? (
            <span className="inline-flex items-center gap-2 text-red-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
              {t("pron.listening")}
              <span className="flex items-center gap-0.5" aria-hidden>
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      recorder.level * 7 > i ? "bg-red-600" : "bg-red-200"
                    }`}
                    style={{ height: `${6 + i * 2}px` }}
                  />
                ))}
              </span>
              <span className="tabular-nums">
                {Math.floor(recorder.seconds / 60)}:
                {String(recorder.seconds % 60).padStart(2, "0")} /{" "}
                {Math.floor(MAX_RECORDING_SECONDS / 60)}:
                {String(MAX_RECORDING_SECONDS % 60).padStart(2, "0")}
              </span>
            </span>
          ) : (
            t("pron.start")
          )}
        </p>

        {(error || recorder.error) && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800
                        ring-1 ring-inset ring-red-200">
            {recorder.error === "denied"
              ? t("pron.permissionDenied")
              : recorder.error === "no-mic"
                ? t("chat.voice.noMic")
                : error || t("common.error")}
          </p>
        )}
      </div>

      {/* =============== Natija =============== */}
      {feedback && (
        <div className="card animate-fade-up p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-ink-500">{t("pron.accuracy")}</p>
              <p
                className={`mt-1 animate-pop-in text-4xl font-bold tabular-nums ${
                  tone === "good"
                    ? "text-accent-600"
                    : tone === "ok"
                      ? "text-orange-500"
                      : "text-red-600"
                }`}
              >
                {feedback.accuracy}%
              </p>
            </div>

            {tone === "good" && (
              <span className="inline-flex h-11 w-11 items-center justify-center
                               rounded-2xl bg-accent-50 text-accent-600">
                <Check className="h-6 w-6" aria-hidden />
              </span>
            )}
          </div>

          {/* Nima eshitilgani */}
          <div className="mt-5 border-t border-ink-200 pt-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              {t("pron.heard")}
            </p>
            <p className="en-text text-sm italic text-ink-600">{feedback.transcript || "—"}</p>
          </div>

          {/* Muammoli so'zlar — bosilsa to'g'ri talaffuzi eshitiladi */}
          {feedback.problemWords.length > 0 && (
            <div className="mt-4 rounded-xl bg-amber-50 p-3.5 ring-1 ring-inset ring-amber-200">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                {t("practice.improvements")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {feedback.problemWords.map((word, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => speech.speak(word)}
                    className="en-text inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1
                               text-sm font-medium text-amber-900 ring-1 ring-inset ring-amber-200
                               hover:bg-amber-100"
                  >
                    <Volume2 className="h-3 w-3" aria-hidden />
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI maslahatlari — ona tilida */}
          {feedback.tips.length > 0 && (
            <ul className="mt-4 space-y-2">
              {feedback.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-700">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center
                                   justify-center rounded-md bg-brand-50 text-brand-700">
                    <Lightbulb className="h-3 w-3" aria-hidden />
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={nextSentence}
        disabled={busy}
        className="btn-secondary btn-lg w-full"
      >
        <RefreshCw className="h-4 w-4" aria-hidden />
        {t("pron.newSentence")}
      </button>
    </div>
  );
}
