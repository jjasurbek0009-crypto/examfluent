"use client";

/**
 * SO'Z KARTOCHKALARI.
 *
 * Ishlash tartibi:
 *   1. Kartochkaning old tomoni ko'rinadi (faqat so'z)
 *   2. Foydalanuvchi o'zini sinaydi, keyin "Javobni ko'rsatish" bosadi
 *   3. Orqa tomon ochiladi: ta'rif, misol, tarjima
 *   4. "Qaytadan / Qiyin / Yaxshi / Oson" dan birini tanlaydi
 *   5. SM-2 keyingi takrorlash sanasini hisoblaydi
 *
 * Muhim tafsilot: baho serverga yuboriladi, LEKIN interfeys javobni
 * kutmaydi — keyingi kartochka darhol ochiladi. Bu takrorlashni
 * juda tez va yoqimli qiladi.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Eye,
  Loader2,
  RotateCcw,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { GRADES, type Grade } from "@/lib/vocab/sm2";
import type { VocabCard } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

/** Tugmalar: rang va yorliq */
const GRADE_STYLES: Record<Grade, { label: TranslationKey; className: string }> = {
  again: { label: "vocab.again", className: "bg-red-50 text-red-700 hover:bg-red-100" },
  hard: { label: "vocab.hard", className: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
  good: { label: "vocab.good", className: "bg-brand-50 text-brand-700 hover:bg-brand-100" },
  easy: { label: "vocab.easy", className: "bg-accent-50 text-accent-700 hover:bg-accent-100" },
};

export function FlashcardDeck({
  initialCards,
  totalCards,
  masteredCards,
}: {
  initialCards: VocabCard[];
  totalCards: number;
  masteredCards: number;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const speech = useSpeech();

  const [queue, setQueue] = useState<VocabCard[]>(initialCards);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const card = queue[index] ?? null;
  const finished = !card;

  // -------------------------------------------------------------------------
  //  Baho berish
  // -------------------------------------------------------------------------
  const grade = useCallback(
    (value: Grade) => {
      if (!card) return;

      // Serverga yuboramiz, lekin KUTMAYMIZ — interfeys darhol o'tadi
      void fetch("/api/vocab/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cardId: card.id, grade: value }),
      }).catch(() => {
        /* tarmoq xatosi takrorlashni to'xtatmasin */
      });

      // "Qaytadan" bosilsa — kartochka shu sessiyada yana chiqadi
      if (value === "again") {
        setQueue((prev) => [...prev, card]);
      }

      setRevealed(false);
      setIndex((i) => i + 1);
      speech.stop();
    },
    [card, speech],
  );

  // -------------------------------------------------------------------------
  //  Klaviatura: Space — ochish, 1-4 — baholash
  // -------------------------------------------------------------------------
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!card) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (!revealed) setRevealed(true);
        return;
      }

      if (revealed) {
        const n = Number(e.key);
        if (n >= 1 && n <= 4) grade(GRADES[n - 1]);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, revealed, grade]);

  // -------------------------------------------------------------------------
  //  Yangi so'zlar yaratish
  // -------------------------------------------------------------------------
  async function generateMore() {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/vocab/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      // Sahifani qayta yuklaymiz — yangi kartochkalar serverdan keladi
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setGenerating(false);
    }
  }

  // =========================================================================
  //  Statistika paneli
  // =========================================================================
  const stats = (
    <div className="mb-5 grid grid-cols-3 gap-3">
      <MiniStat label={t("vocab.due")} value={Math.max(0, queue.length - index)} />
      <MiniStat label={t("vocab.total")} value={totalCards} />
      <MiniStat label={t("vocab.learned")} value={masteredCards} />
    </div>
  );

  // =========================================================================
  //  Kartochkalar tugadi / umuman yo'q
  // =========================================================================
  if (finished) {
    const neverHadCards = totalCards === 0;

    return (
      <div>
        {stats}

        <div className="card p-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center
                          rounded-2xl bg-accent-50 text-accent-600">
            {neverHadCards ? (
              <Sparkles className="h-6 w-6" aria-hidden />
            ) : (
              <Check className="h-6 w-6" aria-hidden />
            )}
          </div>

          <h2 className="text-lg font-semibold text-ink-900">
            {t(neverHadCards ? "vocab.empty.title" : "vocab.allDone.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-600">
            {t(neverHadCards ? "vocab.empty.body" : "vocab.allDone.body")}
          </p>

          <button
            type="button"
            onClick={generateMore}
            disabled={generating}
            className="btn-primary mt-6"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            {t("vocab.generate")}
          </button>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-red-50 p-3
                         text-sm text-red-800 ring-1 ring-inset ring-red-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  //  Kartochka
  // =========================================================================
  const translation = locale === "ru" ? card.translation_ru : card.translation_uz;
  const progress = ((index + 1) / queue.length) * 100;

  return (
    <div>
      {stats}

      {/* Progress */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-ink-200">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="card min-h-[320px] p-7 sm:p-9">
        {/* ---- Old tomon: so'z ---- */}
        <div className="text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <LevelBadge level={card.cefr_level} size="sm" />
            {card.part_of_speech && (
              <span className="text-xs italic text-ink-500">{card.part_of_speech}</span>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            <h2 className="en-text text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              {card.word}
            </h2>
            {speech.supported && (
              <button
                type="button"
                onClick={() => speech.speak(card.word)}
                className="btn-ghost px-2"
                aria-label="Play pronunciation"
              >
                <Volume2 className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>

        {/* ---- Orqa tomon ---- */}
        {revealed ? (
          <div className="mt-7 animate-fade-up space-y-4 border-t border-ink-200 pt-6">
            {card.definition_en && (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  Definition
                </p>
                <p className="en-text text-[15px] leading-relaxed text-ink-800">
                  {card.definition_en}
                </p>
              </div>
            )}

            {card.example_en && (
              <div className="rounded-xl border-l-[3px] border-brand-400 bg-ink-50 p-3.5">
                <p className="en-text text-[15px] italic leading-relaxed text-ink-700">
                  {card.example_en}
                </p>
              </div>
            )}

            {translation && (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  {locale === "ru" ? "Перевод" : "Tarjima"}
                </p>
                <p className="text-[15px] font-medium text-ink-900">{translation}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-10 flex justify-center">
            <button type="button" onClick={() => setRevealed(true)} className="btn-primary btn-lg">
              <Eye className="h-4 w-4" aria-hidden />
              {t("vocab.showAnswer")}
            </button>
          </div>
        )}
      </div>

      {/* ---- Baholash tugmalari ---- */}
      {revealed && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {GRADES.map((g, i) => (
            <button
              key={g}
              type="button"
              onClick={() => grade(g)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-3
                          text-sm font-semibold transition-colors ${GRADE_STYLES[g].className}`}
            >
              {t(GRADE_STYLES[g].label)}
              <span className="text-[10px] font-normal opacity-60">{i + 1}</span>
            </button>
          ))}
        </div>
      )}

      {!revealed && (
        <p className="mt-4 text-center text-xs text-ink-400">
          <RotateCcw className="mr-1 inline h-3 w-3" aria-hidden />
          Space
        </p>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card px-3 py-2.5 text-center">
      <div className="text-lg font-bold tabular-nums text-ink-900">{value}</div>
      <div className="text-[11px] leading-tight text-ink-500">{label}</div>
    </div>
  );
}
