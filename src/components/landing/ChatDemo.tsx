"use client";

/**
 * JONLI CHAT DEMOSI — landing sahifasi uchun.
 *
 * Nima uchun kerak? Odam "AI suhbatdosh" degan matnni o'qiganda hech narsa
 * his qilmaydi. Lekin xabar yozilib, AI javob berayotganini KO'RSA —
 * mahsulotni tushunadi. Bu landing sahifadagi eng ishonarli element.
 *
 * Bu haqiqiy AI emas — oldindan yozilgan ssenariy. Sabab:
 *   1. Har bir tashrif buyuruvchi uchun AI chaqirish bepul limitni yeydi
 *   2. Kirmagan odam uchun API ochiq bo'lishi xavfli
 *   3. Demo har doim BIR XIL va mukammal ko'rinishi kerak
 */

import { useEffect, useRef, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

/** Demo ssenariysi — ataylab tipik xatolar bilan */
const USER_TEXT = "Yesterday I go to the cinema with my friend.";
const AI_TEXT =
  "That sounds fun! Which film did you watch, and would you recommend it?";

const CORRECTION = {
  original: "I go",
  corrected: "I went",
};

/** Bosqichlar: yozish → yuborish → AI o'ylayapti → AI yozadi → tuzatish */
type Stage = "typing" | "sent" | "thinking" | "replying" | "corrected";

export function ChatDemo() {
  const { t } = useI18n();
  const [stage, setStage] = useState<Stage>("typing");
  const [typed, setTyped] = useState("");
  const [reply, setReply] = useState("");

  // Barcha taymerlarni saqlaymiz — komponent yopilganda tozalash uchun
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const later = (fn: () => void, ms: number) => {
      timers.current.push(setTimeout(fn, ms));
    };

    /** Matnni harf-harf yozadi, tugagach `done` chaqiriladi */
    function typeText(
      text: string,
      setter: (v: string) => void,
      speed: number,
      done: () => void,
    ) {
      let i = 0;
      const step = () => {
        i += 1;
        setter(text.slice(0, i));
        if (i < text.length) {
          later(step, speed);
        } else {
          done();
        }
      };
      later(step, speed);
    }

    function runCycle() {
      setStage("typing");
      setTyped("");
      setReply("");

      // 1) Foydalanuvchi yozadi
      typeText(USER_TEXT, setTyped, 55, () => {
        later(() => {
          // 2) Yuborildi
          setStage("sent");
          later(() => {
            // 3) AI o'ylayapti
            setStage("thinking");
            later(() => {
              // 4) AI javob yozadi
              setStage("replying");
              typeText(AI_TEXT, setReply, 28, () => {
                // 5) Tuzatish paydo bo'ladi
                later(() => setStage("corrected"), 500);
                // 6) Boshidan takrorlaymiz
                later(runCycle, 6500);
              });
            }, 1100);
          }, 450);
        }, 700);
      });
    }

    runCycle();

    // Komponent yo'q qilinganda barcha taymerlarni to'xtatamiz —
    // aks holda xotira sizib ketadi (memory leak)
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const showBubble = stage !== "typing";
  const showCorrection = stage === "corrected";

  return (
    <div className="card overflow-hidden">
      {/* ---- Oyna sarlavhasi ---- */}
      <div className="flex items-center gap-2 border-b border-ink-200 bg-ink-50/80 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent-400" />
        </span>
        <span className="ml-1 text-xs font-medium text-ink-500">{t("chat.title")}</span>
        <span className="badge ml-auto bg-brand-100 text-brand-800 ring-brand-200">B1</span>
      </div>

      {/* ---- Suhbat ---- */}
      <div className="flex min-h-[290px] flex-col gap-3 p-4 sm:min-h-[300px]">
        {/* Foydalanuvchi xabari */}
        {showBubble && (
          <div className="flex animate-pop-in justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-700 px-3.5 py-2.5">
              <p className="en-text text-[14px] leading-relaxed text-white">{USER_TEXT}</p>
            </div>
          </div>
        )}

        {/* Tuzatish */}
        {showCorrection && (
          <div className="flex animate-fade-up justify-end">
            <div className="max-w-[85%] rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <div className="en-text flex flex-wrap items-center gap-1.5 text-[13px]">
                <span className="text-red-700 line-through">{CORRECTION.original}</span>
                <span className="text-amber-600" aria-hidden>
                  →
                </span>
                <span className="font-semibold text-accent-800">{CORRECTION.corrected}</span>
                <span className="rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-medium
                                 uppercase tracking-wide text-amber-900">
                  grammar
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-amber-900/90">
                {t("landing.demo.explanation")}
              </p>
            </div>
          </div>
        )}

        {/* AI javobi */}
        {(stage === "thinking" || stage === "replying" || stage === "corrected") && (
          <div className="flex animate-fade-up gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center
                             rounded-lg bg-brand-100 text-brand-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
            </span>

            <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-ink-200
                            bg-white px-3.5 py-2.5">
              {stage === "thinking" ? (
                <span className="flex items-center gap-1 py-1" aria-label="AI yozmoqda">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-ink-400"
                      style={{
                        animation: "typing-dot 1.1s ease-in-out infinite",
                        animationDelay: `${i * 0.16}s`,
                      }}
                    />
                  ))}
                </span>
              ) : (
                <p className="en-text text-[14px] leading-relaxed text-ink-900">
                  {reply}
                  {stage === "replying" && (
                    <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-caret
                                     bg-brand-600 align-middle" />
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Xatosiz belgisi */}
        {showCorrection && (
          <div className="flex animate-fade-up items-center gap-1.5 pl-9 text-[12px]
                          font-medium text-accent-700 delay-2">
            <Check className="h-3.5 w-3.5" aria-hidden />
            {t("landing.demo.correctionNote")}
          </div>
        )}
      </div>

      {/* ---- Yozish maydoni ---- */}
      <div className="border-t border-ink-200 p-3">
        <div className="flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-2.5">
          <p className="en-text flex-1 truncate text-[14px] text-ink-700">
            {stage === "typing" ? (
              <>
                {typed}
                <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-caret
                                 bg-brand-600 align-middle" />
              </>
            ) : (
              <span className="text-ink-400">{t("chat.placeholder")}</span>
            )}
          </p>
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                        transition-colors duration-300 ${
                          stage === "typing" ? "bg-brand-700" : "bg-ink-300"
                        }`}
            aria-hidden
          >
            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
              <path
                d="m5 12 14-7-4 7 4 7-14-7Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
