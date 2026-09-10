"use client";

/**
 * MASHQ IJROCHISI — bitta komponent uch xil mashqni boshqaradi.
 *
 * Bosqichlar:  yaratish → bajarish → baholash → natija
 *
 * Nima uchun bitta komponent? Chunki uchala mashqning "hayot sikli" bir xil:
 * AI mashq yaratadi → foydalanuvchi javob beradi → server baholaydi.
 * Faqat o'rtadagi qism farq qiladi, u alohida komponentlarga ajratilgan.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import type { CefrLevel } from "@/lib/cefr";
import type { PracticeSkill, ComprehensionTask, WritingTask } from "@/lib/prompts/practice";
import type { QuestionResult } from "@/lib/practice/types";
import type { BandCriteria, Correction } from "@/lib/types";
import { ComprehensionView } from "./ComprehensionView";
import { WritingView } from "./WritingView";
import { ResultPanel } from "./ResultPanel";

export interface ComprehensionResult {
  skill: PracticeSkill;
  level: CefrLevel;
  band: number;
  correctCount: number;
  total: number;
  results: QuestionResult[];
}

export interface WritingResult {
  skill: "writing";
  level: CefrLevel;
  band: number;
  criteria: BandCriteria;
  wordCount: number;
  minWords: number;
  feedback: {
    summary: string;
    strengths: string[];
    improvements: string[];
    corrections: Correction[];
  };
}

export type EvalResult = ComprehensionResult | WritingResult;

type Phase = "generating" | "working" | "evaluating" | "result";

export function PracticeRunner({ skill, level }: { skill: PracticeSkill; level: CefrLevel }) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("generating");
  const [token, setToken] = useState<string | null>(null);
  const [comprehension, setComprehension] = useState<ComprehensionTask | null>(null);
  const [writing, setWriting] = useState<WritingTask | null>(null);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mashqqa sarflangan vaqtni o'lchaymiz (statistika uchun)
  const startedAtRef = useRef<number>(Date.now());

  // Strict Mode'da effekt ikki marta ishlaydi — bu esa ikkita AI so'rovi
  // degani. Shu bayroq bilan takroriy so'rovning oldini olamiz.
  const requestedRef = useRef(false);

  // -------------------------------------------------------------------------
  //  Mashq yaratish
  // -------------------------------------------------------------------------
  const generate = useCallback(async () => {
    setPhase("generating");
    setError(null);
    setResult(null);
    setComprehension(null);
    setWriting(null);

    try {
      const res = await fetch("/api/practice/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ skill, locale }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      setToken(data.token);
      if (skill === "writing") {
        setWriting(data.task as WritingTask);
      } else {
        setComprehension(data.task as ComprehensionTask);
      }

      startedAtRef.current = Date.now();
      setPhase("working");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
      setPhase("working"); // xato ekranini ko'rsatish uchun
    }
  }, [skill, locale, t]);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    void generate();
  }, [generate]);

  // -------------------------------------------------------------------------
  //  Javobni baholashga yuborish
  // -------------------------------------------------------------------------
  const submit = useCallback(
    async (payload: { answers?: number[]; essay?: string }) => {
      if (!token) return;

      setPhase("evaluating");
      setError(null);

      try {
        const res = await fetch("/api/practice/evaluate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token,
            ...payload,
            durationSec: Math.round((Date.now() - startedAtRef.current) / 1000),
            locale,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

        setResult(data as EvalResult);
        setPhase("result");
        // Dashboard statistikasi (streak, band tarixi) yangilansin
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("common.error"));
        setPhase("working");
      }
    },
    [token, locale, router, t],
  );

  /** Yangi mashq boshlash */
  function restart() {
    requestedRef.current = true;
    void generate();
  }

  // =========================================================================
  //  Ekranlar
  // =========================================================================

  const heading = t(`practice.${skill}` as "practice.reading");

  return (
    <div className="mx-auto max-w-3xl">
      {/* ---- Sarlavha ---- */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/practice" className="btn-ghost px-2" aria-label={t("common.back")}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink-900">{heading}</h1>
            <p className="text-xs text-ink-500">CEFR {level}</p>
          </div>
        </div>

        {phase === "result" && (
          <button type="button" onClick={restart} className="btn-secondary">
            <RefreshCw className="h-4 w-4" aria-hidden />
            {t("practice.tryAgain")}
          </button>
        )}
      </div>

      {/* ---- Yuklanish ---- */}
      {phase === "generating" && <Busy label={t("practice.generating")} />}
      {phase === "evaluating" && <Busy label={t("practice.evaluating")} />}

      {/* ---- Xato ---- */}
      {error && phase === "working" && (
        <div className="card p-6 text-center">
          <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center
                          rounded-xl bg-red-50 text-red-600">
            <AlertCircle className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-sm text-ink-700">{error}</p>
          <button type="button" onClick={restart} className="btn-primary mt-5">
            <RefreshCw className="h-4 w-4" aria-hidden />
            {t("common.retry")}
          </button>
        </div>
      )}

      {/* ---- Mashq ---- */}
      {phase === "working" && !error && comprehension && (
        <ComprehensionView
          skill={skill as "reading" | "listening"}
          task={comprehension}
          onSubmit={(answers) => submit({ answers })}
        />
      )}

      {phase === "working" && !error && writing && (
        <WritingView task={writing} onSubmit={(essay) => submit({ essay })} />
      )}

      {/* ---- Natija ---- */}
      {phase === "result" && result && <ResultPanel result={result} onRestart={restart} />}
    </div>
  );
}

function Busy({ label }: { label: string }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-4 px-6 py-20">
      <Loader2 className="h-7 w-7 animate-spin text-brand-600" aria-hidden />
      <p className="text-sm font-medium text-ink-600">{label}</p>
    </div>
  );
}
