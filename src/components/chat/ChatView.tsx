"use client";

/**
 * AI SUHBATDOSH interfeysi.
 *
 * Uchta muhim imkoniyat:
 *
 *  1. OQIM (stream) — javob harf-harf keladi, kutish sezilmaydi.
 *
 *  2. OVOZ — mikrofonga gapirasiz, AI javobini ovoz bilan o'qib beradi.
 *     Ya'ni haqiqiy odam bilan gaplashgandek. Ikkalasi ham brauzerning
 *     o'z imkoniyati (Web Speech API) — bepul, tashqi xizmat kerak emas.
 *
 *  3. IKKI TILLILIK — AI javobidan keyin o'zbekcha/ruscha qisqa tarjima.
 *     Boshlang'ich darajadagilar uchun juda muhim: aks holda ular
 *     javobni tushunmay, suhbatni tashlab ketadi.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Languages,
  Loader2,
  MessageSquarePlus,
  Mic,
  Send,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { LOCALE_LABELS, type TranslationKey } from "@/lib/i18n/dictionaries";
import {
  SCENARIOS,
  TRANSLATION_MARKER,
  type ChatMode,
  type Scenario,
} from "@/lib/prompts/chat";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { useAudioRecorder, MAX_RECORDING_SECONDS } from "@/lib/hooks/useAudioRecorder";
import type { CefrLevel } from "@/lib/cefr";
import type { ChatMessage, ChatSession, Correction } from "@/lib/types";

/** Mikrofon uchun tillar */
const MIC_LANGS = [
  { code: "en-GB", label: "English" },
  { code: "uz-UZ", label: "O'zbek" },
  { code: "ru-RU", label: "Русский" },
];

interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  corrections: Correction[] | null;
  streaming?: boolean;
}

/**
 * AI javobini ingliz qismi va tarjimaga ajratadi.
 * Ajratuvchi belgi topilmasa — hammasi ingliz deb hisoblanadi.
 */
function splitReply(content: string): { english: string; translation: string | null } {
  const index = content.indexOf(TRANSLATION_MARKER);
  if (index === -1) return { english: content, translation: null };

  return {
    english: content.slice(0, index).trim(),
    translation: content.slice(index + TRANSLATION_MARKER.length).trim() || null,
  };
}

export function ChatView({
  level,
  sessions,
  activeSessionId,
  initialMessages,
  initialScenario,
}: {
  level: CefrLevel;
  sessions: ChatSession[];
  activeSessionId: string | null;
  initialMessages: ChatMessage[];
  initialScenario: Scenario;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const speech = useSpeech();

  /*
   * Mikrofon tili.
   *
   * Standart holatda ingliz tili — bu ingliz tilini o'rganish platformasi
   * va mikrofon avvalo gapirish mashqi uchun. Lekin foydalanuvchi savolini
   * o'z tilida aytishni xohlashi mumkin, shuning uchun tanlov qoldirilgan.
   * Noto'g'ri til tanlansa, tanib olish umuman ishlamaydi.
   */
  const [micLang, setMicLang] = useState("en-GB");
  const recorder = useAudioRecorder();

  const [sessionId, setSessionId] = useState<string | null>(activeSessionId);
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  /*
   * Standart rejim.
   *
   * O'zbek/rus interfeysida "Tilimda ham" rejimi yoqilgan holda boshlanadi:
   * foydalanuvchi o'z tilida savol bersa, darhol o'z tilida javob oladi.
   * Immersion (faqat ingliz) xohlaganlar bir bosishda o'tishi mumkin.
   *
   * Ingliz interfeysida tarjimaning ma'nosi yo'q — o'chirilgan.
   */
  const [mode, setMode] = useState<ChatMode>(locale === "en" ? "english" : "bilingual");
  const [voiceOn, setVoiceOn] = useState(false);

  /*
   * voiceOn ni ref'da ham saqlaymiz.
   *
   * Sabab: mikrofon bosilganda voiceOn darhol `true` bo'lmaydi — React
   * holatni keyingi render'da yangilaydi. Javob kelganda esa `send`
   * funksiyasi eski qiymatni ("false") ushlab qolishi mumkin va ovoz
   * umuman chiqmaydi. Ref har doim eng so'nggi qiymatni beradi.
   */
  const voiceOnRef = useRef(false);
  function enableVoice(on: boolean) {
    voiceOnRef.current = on;
    setVoiceOn(on);
  }

  const [messages, setMessages] = useState<UiMessage[]>(() =>
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      corrections: m.corrections,
    })),
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // -------------------------------------------------------------------------
  //  Xabar yuborish
  // -------------------------------------------------------------------------
  const send = useCallback(
    async (textOverride?: string, opts?: { fromVoice?: boolean }) => {
      const text = (textOverride ?? input).trim();
      if (!text || sending) return;

      setError(null);
      setInput("");
      setSending(true);
      speech.stop(); // oldingi o'qishni to'xtatamiz

      const tempUserId = `u-${Date.now()}`;
      const tempAiId = `a-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        { id: tempUserId, role: "user", content: text, corrections: null },
        { id: tempAiId, role: "assistant", content: "", corrections: null, streaming: true },
      ]);

      let fullReply = "";

      try {
        const res = await fetch("/api/chat/message", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId,
            content: text,
            scenario,
            locale,
            mode,
            // Mikrofondan kelgan matnda tanish xatolari bo'lishi mumkin —
            // ular foydalanuvchining grammatik xatosi sifatida hisoblanmasin
            fromVoice: opts?.fromVoice === true,
          }),
        });

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;

            let event: any;
            try {
              event = JSON.parse(line);
            } catch {
              continue;
            }

            if (event.type === "meta" && event.sessionId) {
              if (!sessionId) {
                setSessionId(event.sessionId);
                window.history.replaceState(null, "", `/chat/${event.sessionId}`);
              }
            } else if (event.type === "delta") {
              fullReply += event.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempAiId ? { ...m, content: m.content + event.text } : m,
                ),
              );
            } else if (event.type === "corrections") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempUserId ? { ...m, corrections: event.items ?? [] } : m,
                ),
              );
            } else if (event.type === "error") {
              setError(event.message || t("common.error"));
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === tempAiId ? { ...m, streaming: false } : m)),
        );

        // Ovoz yoqilgan bo'lsa — javobni o'qib beramiz.
        // FAQAT inglizcha qismini: ingliz ovozi o'zbekcha matnni buzib o'qiydi.
        if (voiceOnRef.current && fullReply) {
          const { english } = splitReply(fullReply);
          if (english) speech.speak(english);
        }

        router.refresh();
      } catch {
        setError(t("common.error"));
        setMessages((prev) => prev.filter((m) => m.id !== tempAiId));
      } finally {
        setSending(false);
        inputRef.current?.focus();
      }
    },
    [input, sending, sessionId, scenario, locale, mode, speech, t, router],
  );

  // -------------------------------------------------------------------------
  //  Mikrofon
  // -------------------------------------------------------------------------
  /*
   * QANDAY ISHLAYDI:
   *   1. Tugma bosiladi -> ovoz yozila boshlaydi
   *   2. Yana bosiladi  -> yozuv to'xtaydi va serverga yuboriladi
   *   3. Gemini ovozni matnga aylantiradi (~3 soniya)
   *   4. Matn avtomatik yuboriladi, AI ovoz bilan javob beradi
   *
   * NIMA UCHUN BRAUZERNING O'Z NUTQ TANISH XIZMATI EMAS?
   *   U o'zbek tilini juda yomon taniydi. Bir xil ovozda o'lchadik:
   *     Chrome  -> "Ssvning nima"   (tushunarsiz)
   *     Gemini  -> "Isming nima?"   (to'g'ri)
   *   Qo'shimcha yutuq: bu usul Firefox va Safari'da ham ishlaydi.
   */
  const [transcribing, setTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  async function toggleMic() {
    setMicError(null);

    // --- Yozuvni boshlash ---
    if (!recorder.recording) {
      enableVoice(true); // ovozli suhbat — javobni ham o'qiymiz
      speech.stop();
      await recorder.start();
      return;
    }

    // --- Yozuvni tugatib, matnga aylantirish ---
    /*
     * IKKI XIL JIMLIK — ularni AJRATISH kerak, chunki sabablari boshqa:
     *
     *   mikrofon ovoz olmagan   -> qurilma muammosi (boshqa mikrofon, o'chirilgan)
     *   mikrofon oldi, WAV jim  -> formatni o'girishda ovoz yo'qolgan (dastur xatosi)
     *
     * Ilgari ikkalasiga ham "balandroq gapiring" deyilardi — bu chalg'ituvchi:
     * foydalanuvchi baland gapirgan bo'lsa ham shu xabarni olardi.
     */
    const micHeardSound = recorder.peakLevel >= 0.04;
    const rec = await recorder.stop();
    if (!rec) return;

    if (rec.silent) {
      setMicError(micHeardSound ? t("chat.voice.convertFailed") : t("chat.voice.silent"));
      return;
    }

    setTranscribing(true);
    try {
      const form = new FormData();
      form.append("audio", rec.blob, "speech.wav");
      form.append("lang", micLang);

      const res = await fetch("/api/speech/transcribe", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setMicError(data?.message ?? t("common.error"));
        return;
      }
      if (!data.text) {
        setMicError(t("chat.voice.noSpeech"));
        return;
      }

      void send(data.text, { fromVoice: true });
    } catch {
      setMicError(t("common.error"));
    } finally {
      setTranscribing(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  const isEmpty = messages.length === 0;
  const voiceSupported = recorder.supported && speech.supported;

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
      {/* ============ Suhbatlar ro'yxati ============ */}
      <aside className="hidden lg:block">
        <Link href="/chat" className="btn-secondary mb-3 w-full">
          <MessageSquarePlus className="h-4 w-4" aria-hidden />
          {t("chat.newSession")}
        </Link>

        <nav className="space-y-1">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/chat/${s.id}`}
              className={`block truncate rounded-xl px-3 py-2 text-sm transition-colors ${
                s.id === sessionId
                  ? "bg-brand-50 font-medium text-brand-800"
                  : "text-ink-600 hover:bg-ink-100"
              }`}
              title={s.title}
            >
              {s.title}
            </Link>
          ))}
        </nav>
      </aside>

      {/* ============ Suhbat oynasi ============ */}
      <div className="flex min-h-[calc(100vh-8rem)] flex-col">
        {/* --- Sarlavha --- */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold tracking-tight text-ink-900">{t("chat.title")}</h1>

          <div className="flex items-center gap-1.5">
            <Link href="/chat" className="btn-ghost px-2 lg:hidden" aria-label={t("chat.newSession")}>
              <MessageSquarePlus className="h-4 w-4" aria-hidden />
            </Link>

            {/* Ovoz yoqish/o'chirish */}
            {voiceSupported && (
              <button
                type="button"
                onClick={() => {
                  if (voiceOn) speech.stop();
                  enableVoice(!voiceOn);
                }}
                aria-pressed={voiceOn}
                title={t(voiceOn ? "chat.voice.autoOn" : "chat.voice.autoOff")}
                className={`btn px-2.5 py-2 ${
                  voiceOn
                    ? "bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200"
                    : "text-ink-500 hover:bg-ink-100"
                }`}
              >
                {voiceOn ? (
                  <Volume2 className="h-4 w-4" aria-hidden />
                ) : (
                  <VolumeX className="h-4 w-4" aria-hidden />
                )}
              </button>
            )}

            {/* Mavzu */}
            <div className="relative">
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value as Scenario)}
                disabled={messages.length > 0}
                className="input appearance-none py-2 pr-8 text-sm disabled:opacity-70"
                aria-label={t("chat.scenario")}
              >
                {SCENARIOS.map((s) => (
                  <option key={s} value={s}>
                    {t(`chat.scenario.${s}` as TranslationKey)}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4
                           -translate-y-1/2 text-ink-400"
                aria-hidden
              />
            </div>
          </div>
        </div>

        {/* --- Tushuntirish tili (ingliz interfeysida kerak emas) --- */}
        {locale !== "en" && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Languages className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
            <span className="text-xs font-medium text-ink-500">{t("chat.lang.label")}:</span>

            <div className="inline-flex rounded-lg bg-ink-100 p-0.5">
              {(["english", "bilingual"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    mode === m
                      ? "bg-white text-ink-900 shadow-sm"
                      : "text-ink-500 hover:text-ink-800"
                  }`}
                >
                  {t(m === "english" ? "chat.lang.englishOnly" : "chat.lang.bilingual")}
                </button>
              ))}
            </div>

            {mode === "bilingual" && (
              <span className="text-[11px] text-ink-400">{t("chat.lang.hint")}</span>
            )}
          </div>
        )}

        {/* --- Mikrofon tili --- */}
        {voiceSupported && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Mic className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
            <span className="text-xs font-medium text-ink-500">{t("chat.voice.micLang")}:</span>
            <div className="inline-flex rounded-lg bg-ink-100 p-0.5">
              {MIC_LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setMicLang(l.code)}
                  disabled={recorder.recording || transcribing}
                  aria-pressed={micLang === l.code}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    micLang === l.code
                      ? "bg-white text-ink-900 shadow-sm"
                      : "text-ink-500 hover:text-ink-800"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/*
          Ovoz haqida ogohlantirish.

          Ikki xil holat bor va ular BOSHQACHA:
            - umuman ovoz yo'q      -> hech narsa eshitilmaydi
            - inglizcha ovoz yo'q   -> eshitiladi, lekin talaffuz noto'g'ri
                                       (masalan rus ovozi inglizcha matnni o'qiydi)
          Ilgari faqat birinchisi tekshirilardi, shuning uchun ikkinchi holatda
          foydalanuvchi nima uchun g'alati eshitilayotganini bilmasdi.
        */}
        {speech.supported && !speech.hasEnglishVoice && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-xs
                          text-brand-900 ring-1 ring-inset ring-brand-200">
            <Volume2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              {speech.usingServerVoice
                ? t("chat.voice.serverVoice")
                : t("chat.voice.noVoice")}{" "}
              <a href="/voice-test" className="font-semibold underline">
                {t("chat.voice.diagnose")}
              </a>
            </span>
          </div>
        )}

        {/* --- Xabarlar --- */}
        <div className="thin-scroll flex-1 space-y-4 overflow-y-auto pb-4">
          {isEmpty ? (
            <EmptyState
              level={level}
              voiceSupported={voiceSupported}
              onStartVoice={toggleMic}
            />
          ) : (
            messages.map((m) =>
              m.role === "user" ? (
                <UserMessage key={m.id} message={m} />
              ) : (
                <AssistantMessage
                  key={m.id}
                  message={m}
                  onSpeak={(text) => speech.speak(text)}
                  onStop={() => speech.stop()}
                  speaking={speech.speaking}
                  loading={speech.loading}
                  canSpeak={speech.supported}
                  nativeLabel={LOCALE_LABELS[locale]}
                />
              ),
            )
          )}
          <div ref={bottomRef} />
        </div>

        {/* --- Xatolar --- */}
        {(error || micError || recorder.error) && (
          <div
            role="alert"
            className="mb-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm
                       text-red-800 ring-1 ring-inset ring-red-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {recorder.error === "denied"
              ? t("chat.voice.denied")
              : recorder.error === "no-mic"
                ? t("chat.voice.noMic")
                : micError || error || t("common.error")}
          </div>
        )}

        {/* --- Yozish maydoni --- */}
        <div className="sticky bottom-0 bg-ink-50 pt-2">
          {/* Ovoz matnga aylantirilmoqda */}
          {transcribing && (
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2
                            text-sm ring-1 ring-inset ring-brand-200">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-600" aria-hidden />
              <span className="font-medium text-brand-800">{t("chat.voice.transcribing")}</span>
            </div>
          )}

          {/* Gapirayotgan paytdagi jonli matn */}
          {recorder.recording && (
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2
                            text-sm ring-1 ring-inset ring-red-200">
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-600" />
              <span className="font-medium text-red-700">{t("chat.voice.listening")}</span>

              {/*
                JONLI OVOZ DARAJASI.
                Mikrofon ovoz olayotganini KO'RSATADI. Busiz foydalanuvchi
                gapirib bo'lgach "ovoz eshitilmadi" xabarini oladi va nima
                uchunligini tushunmaydi.
              */}
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

              <span className="tabular-nums text-ink-600">
                {Math.floor(recorder.seconds / 60)}:
                {String(recorder.seconds % 60).padStart(2, "0")} /{" "}
                {Math.floor(MAX_RECORDING_SECONDS / 60)}:
                {String(MAX_RECORDING_SECONDS % 60).padStart(2, "0")}
              </span>
              <span className="ml-auto text-xs text-ink-500">{t("chat.voice.pressToStop")}</span>
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-ink-200 bg-white p-2 shadow-card">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              disabled={recorder.recording}
              placeholder={t("chat.placeholder")}
              className="en-text max-h-40 min-h-[42px] flex-1 resize-none border-0 bg-transparent
                         px-2 py-2.5 text-[15px] text-ink-900 outline-none
                         placeholder:text-ink-400 disabled:opacity-50"
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              }}
            />

            {/* Mikrofon */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleMic}
                disabled={sending || transcribing}
                aria-label={t(recorder.recording ? "chat.voice.stopRecording" : "chat.voice.mic")}
                className={`btn h-[42px] w-[42px] shrink-0 px-0 ${
                  recorder.recording
                    ? "bg-red-600 text-white ring-4 ring-red-200 hover:bg-red-700"
                    : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                }`}
              >
                {recorder.recording ? (
                  <Square className="h-3.5 w-3.5 fill-current" aria-hidden />
                ) : (
                  <Mic className="h-4 w-4" aria-hidden />
                )}
              </button>
            )}

            {/* Yuborish */}
            <button
              type="button"
              onClick={() => void send()}
              disabled={!input.trim() || sending || recorder.recording || transcribing}
              className="btn-primary h-[42px] w-[42px] shrink-0 px-0"
              aria-label={t("chat.send")}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>

          <p className="mt-1.5 px-1 text-[11px] text-ink-400">
            {voiceSupported ? (
              <>
                Enter — {t("chat.send")} · <Mic className="inline h-3 w-3" aria-hidden />{" "}
                {t("chat.voice.mic")}
              </>
            ) : (
              t("chat.voice.notSupported")
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Xabar komponentlari
// ---------------------------------------------------------------------------

function UserMessage({ message }: { message: UiMessage }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const corrections = message.corrections;

  return (
    <div className="flex animate-fade-up flex-col items-end gap-1.5">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-700 px-4 py-2.5">
        <p className="en-text whitespace-pre-wrap text-[15px] leading-relaxed text-white">
          {message.content}
        </p>
      </div>

      {corrections !== null && (
        <div className="max-w-[85%]">
          {corrections.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-700">
              <Check className="h-3.5 w-3.5" aria-hidden />
              {t("chat.noCorrections")}
            </span>
          ) : (
            <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2
                           text-xs font-semibold text-amber-900"
                aria-expanded={open}
              >
                <span>
                  {t("chat.corrections")} · {corrections.length}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              {open && (
                <ul className="space-y-2.5 border-t border-amber-200 px-3 py-2.5">
                  {corrections.map((c, i) => (
                    <li key={i} className="text-xs">
                      <div className="en-text flex flex-wrap items-center gap-1.5">
                        <span className="text-red-700 line-through">{c.original}</span>
                        <span className="text-amber-700" aria-hidden>
                          →
                        </span>
                        <span className="font-semibold text-accent-800">{c.corrected}</span>
                        <span className="rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px]
                                         font-medium uppercase tracking-wide text-amber-900">
                          {c.type}
                        </span>
                      </div>
                      <p className="mt-1 leading-relaxed text-amber-900/90">{c.explanation}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AssistantMessage({
  message,
  onSpeak,
  onStop,
  speaking,
  loading,
  canSpeak,
  nativeLabel,
}: {
  message: UiMessage;
  onSpeak: (text: string) => void;
  onStop: () => void;
  speaking: boolean;
  loading: boolean;
  canSpeak: boolean;
  /** Ona til nomi — "O'zbekcha" / "Русский" */
  nativeLabel: string;
}) {
  const { t } = useI18n();
  const empty = message.content.length === 0;
  const { english, translation } = splitReply(message.content);

  return (
    <div className="flex animate-fade-up gap-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center
                      rounded-lg bg-brand-100 text-brand-700">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
      </div>

      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-tl-md border border-ink-200 bg-white px-4 py-2.5">
          {empty && message.streaming ? (
            <span className="flex items-center gap-1.5 py-1" aria-label={t("chat.thinking")}>
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
            <>
              <p className="en-text whitespace-pre-wrap text-[15px] leading-relaxed text-ink-900">
                {english}
                {message.streaming && (
                  <span className="ml-0.5 inline-block h-4 w-[2px] animate-caret
                                   bg-brand-600 align-middle" />
                )}
              </p>

              {/*
                Ona tilidagi qism.
                DIQQAT: bu shunchaki tarjima emas — foydalanuvchi o'z tilida
                savol bergan bo'lsa, TO'LIQ javob aynan shu yerda bo'ladi.
                Shuning uchun matn xiralashtirilmaydi, to'liq o'qiladi.
              */}
              {translation && (
                <div className="mt-3 rounded-lg bg-ink-50 px-3 py-2.5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                    {nativeLabel}
                  </p>
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink-800">
                    {translation}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Eshitish tugmasi */}
        {canSpeak && !empty && !message.streaming && english && (
          <button
            type="button"
            onClick={() => (speaking ? onStop() : onSpeak(english))}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1
                       text-[11px] font-medium text-ink-500 transition-colors
                       hover:bg-ink-100 hover:text-ink-800"
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                {t("chat.voice.preparing")}
              </>
            ) : speaking ? (
              <>
                <Square className="h-3 w-3 fill-current" aria-hidden />
                {t("chat.voice.stop")}
              </>
            ) : (
              <>
                <Volume2 className="h-3 w-3" aria-hidden />
                {t("chat.voice.speak")}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  level,
  voiceSupported,
  onStartVoice,
}: {
  level: CefrLevel;
  voiceSupported: boolean;
  onStartVoice: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex h-full animate-fade-up flex-col items-center justify-center py-14 text-center">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center
                      rounded-2xl bg-brand-50 text-brand-700">
        <Sparkles className="h-6 w-6" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-ink-900">{t("chat.empty.title")}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-600">
        {t("chat.empty.body")}
      </p>

      {/*
        Ovozli suhbat — asosiy taklif.
        Foydalanuvchi pastdagi kichik mikrofon tugmasini sezmasligi mumkin,
        shuning uchun bu yerda katta va aniq tugma turadi.
      */}
      {voiceSupported && (
        <>
          <button type="button" onClick={onStartVoice} className="btn-primary btn-lg mt-6">
            <Mic className="h-4 w-4" aria-hidden />
            {t("chat.voice.startTalking")}
          </button>
          <p className="mt-2.5 max-w-xs text-xs leading-relaxed text-ink-500">
            {t("chat.voice.howItWorks")}
          </p>
        </>
      )}

      <span className="badge mt-5 bg-brand-50 text-brand-800 ring-brand-200">{level}</span>
    </div>
  );
}
