"use client";

/**
 * OVOZ DIAGNOSTIKASI.
 *
 * Ovoz ishlamaganda sabab uchta joydan biri bo'ladi:
 *   1. Brauzer qo'llab-quvvatlamaydi (Firefox)
 *   2. Tizimda ovoz o'rnatilmagan (Windows til paketi yo'q)
 *   3. Mikrofonga ruxsat berilmagan
 *
 * Bu sahifa uchalasini ham aniq ko'rsatadi — taxmin qilish shart emas.
 */

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Loader2,
  Mic,
  Square,
  Volume2,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";

const TEST_SENTENCE =
  "Hello. This is ExamFluent. If you can hear this sentence, the voice is working correctly.";

/** Mikrofon uchun tanlanadigan tillar */
const MIC_LANGS = [
  { code: "en-GB", label: "English (UK)" },
  { code: "en-US", label: "English (US)" },
  { code: "uz-UZ", label: "O'zbekcha" },
  { code: "ru-RU", label: "Русский" },
];

export function VoiceDiagnostics() {
  const [micLang, setMicLang] = useState("en-GB");
  const speech = useSpeech();
  const recorder = useAudioRecorder();
  const [transcript, setTranscript] = useState("");
  const [busy, setBusy] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  /*
   * Yozilgan ovozni SAQLAB QO'YAMIZ va qaytarib eshittiramiz.
   *
   * Bu diagnostikadagi eng muhim narsa: agar o'zingizni eshitsangiz —
   * mikrofon ishlayapti, muammo tanishda. Eshitmasangiz — mikrofon
   * umuman ovoz olmagan va tanish qanchalik yaxshi bo'lsa ham foyda yo'q.
   */
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedInfo, setRecordedInfo] = useState<{
    kb: number;
    seconds: number;
    micPeak: number;
    filePeak: number;
  } | null>(null);

  /*
   * Mikrofon sinovi ilovaning HAQIQIY yo'lini tekshiradi:
   * ovoz yozib olinadi -> serverga yuboriladi -> Gemini matnga aylantiradi.
   * Ilgari bu yerda brauzerning o'z nutq xizmati sinalardi, lekin ilova
   * endi undan foydalanmaydi — ya'ni sinov noto'g'ri narsani o'lchardi.
   */
  async function toggleMic() {
    setMicError(null);

    if (!recorder.recording) {
      setTranscript("");
      await recorder.start();
      return;
    }

    const micPeak = recorder.peakLevel;
    const rec = await recorder.stop();
    if (!rec) return;

    // Yozuvni eshitish uchun saqlaymiz
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(URL.createObjectURL(rec.blob));
    setRecordedInfo({
      kb: Math.round(rec.blob.size / 1024),
      seconds: rec.seconds,
      micPeak: Math.round(micPeak * 100),
      filePeak: Math.round(rec.peak * 100),
    });

    if (rec.silent) {
      setMicError(
        micPeak >= 0.04
          ? "Mikrofon ovoz oldi, lekin faylga jimlik yozildi — bu dastur xatosi. " +
            "Yuqoridagi o'lchovlarni menga yuboring."
          : "Mikrofon umuman ovoz olmadi. Windows sozlamalarida to'g'ri mikrofon " +
            "tanlanganini va ovoz darajasi nolda emasligini tekshiring.",
      );
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("audio", rec.blob, "test.wav");
      form.append("lang", micLang);
      const res = await fetch("/api/speech/transcribe", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) setMicError(data?.message ?? "Xatolik yuz berdi.");
      else if (!data.text) setMicError("Ovoz eshitilmadi.");
      else setTranscript(data.text);
    } catch {
      setMicError("Xatolik yuz berdi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Logo href="/" size="sm" />
        <Link href="/chat" className="btn-ghost text-xs">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Chatga qaytish
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-ink-900">
        Ovoz diagnostikasi
      </h1>
      <p className="text-sm text-ink-600">
        Ovoz ishlamayotgan bo'lsa, quyidagi tekshiruvlar sababni ko'rsatadi.
      </p>

      {/* ============ 1. Brauzer qo'llab-quvvatlashi ============ */}
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">1. Brauzer</h2>
        <ul className="space-y-2">
          <Row
            ok={speech.supported}
            label="Ovoz chiqarish (Text-to-Speech)"
            bad="Brauzeringiz qo'llamaydi — Chrome yoki Edge ishlating"
          />
          <Row
            ok={recorder.supported}
            label="Mikrofon yozib olish"
            bad="Brauzeringiz mikrofonni qo'llamaydi"
          />
        </ul>
      </section>

      {/* ============ 2. Tizimdagi ovozlar ============ */}
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">
          2. Kompyuteringizdagi ovozlar
        </h2>

        <ul className="space-y-2">
          <Row
            ok={speech.hasAnyVoice}
            label={`Jami ovozlar: ${speech.voices.length}`}
            bad="Hech qanday ovoz topilmadi — shuning uchun hech narsa eshitilmaydi"
          />
          <Row
            ok={speech.hasEnglishVoice}
            label="Inglizcha ovoz mavjud"
            bad="Inglizcha ovoz yo'q — talaffuz noto'g'ri bo'ladi"
            warn
          />
        </ul>

        <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-700">
          Ovoz manbai:{" "}
          <strong>
            {speech.usingServerVoice
              ? "Gemini (server)"
              : (speech.voiceName ?? "aniqlanmadi")}
          </strong>
        </p>

        {!speech.hasEnglishVoice && (
          <>
            <div className="mt-3 rounded-xl bg-brand-50 p-3 text-xs leading-relaxed
                            text-brand-900 ring-1 ring-inset ring-brand-200">
              <p className="mb-1 flex items-center gap-1.5 font-semibold">
                <Volume2 className="h-3.5 w-3.5" aria-hidden />
                Muammo emas — Gemini ovozi ishlatiladi
              </p>
              <p>
                Kompyuteringizda inglizcha ovoz yo&apos;q, shuning uchun ovoz
                serverdan olinadi. Talaffuz to&apos;g&apos;ri bo&apos;ladi, faqat
                birinchi marta 3-6 soniya kutiladi (keyin keshdan darhol chiqadi).
              </p>
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-ink-500">
                Tezroq bo&apos;lishi uchun: Windows&apos;ga inglizcha ovoz o&apos;rnatish
              </summary>
              <div className="mt-2 rounded-xl bg-ink-50 p-3 text-xs leading-relaxed text-ink-700">
                <p className="mb-1.5 flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  Windows 11
                </p>
                <ol className="ml-4 list-decimal space-y-1">
                  <li>Sozlamalar → Vaqt va til → Til va mintaqa</li>
                  <li>
                    &quot;Til qo&apos;shish&quot; →{" "}
                    <strong>English (United States)</strong>
                  </li>
                  <li>
                    Qo&apos;shimcha imkoniyatlarda <strong>Nutq (Text-to-speech)</strong>{" "}
                    ni belgilang
                  </li>
                  <li>O&apos;rnatgach Chrome&apos;ni butunlay yoping va qayta oching</li>
                </ol>
                <p className="mt-2 text-ink-500">
                  Shundan keyin ovoz brauzerning o&apos;zida, kutishsiz ishlaydi.
                </p>
              </div>
            </details>
          </>
        )}

        {speech.voices.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-ink-500">
              Barcha ovozlar ro&apos;yxati
            </summary>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-ink-600">
              {speech.voices.map((v) => (
                <li key={v.name + v.lang} className="flex justify-between gap-3">
                  <span className="truncate">{v.name}</span>
                  <span className="shrink-0 font-mono text-ink-400">{v.lang}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* ============ 3. Ovozni eshitish sinovi ============ */}
      <section className="card p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink-900">3. Eshitish sinovi</h2>
        <p className="mb-3 text-xs text-ink-500">
          Tugmani bosing. Quyidagi jumla ovoz bilan o&apos;qilishi kerak.
        </p>
        <p className="en-text mb-3 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-800">
          {TEST_SENTENCE}
        </p>

        <button
          type="button"
          onClick={() => (speech.speaking ? speech.stop() : speech.speak(TEST_SENTENCE))}
          disabled={!speech.supported}
          className="btn-primary"
        >
          {speech.loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Ovoz tayyorlanmoqda...
            </>
          ) : speech.speaking ? (
            <>
              <Square className="h-4 w-4 fill-current" aria-hidden />
              To&apos;xtatish
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4" aria-hidden />
              Eshitib ko&apos;rish
            </>
          )}
        </button>

        {speech.speaking && (
          <p className="mt-2 text-xs font-medium text-accent-700">O&apos;qilmoqda...</p>
        )}
      </section>

      {/* ============ 4. Mikrofon sinovi ============ */}
      <section className="card p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink-900">4. Mikrofon sinovi</h2>
        <p className="mb-3 text-xs text-ink-500">
          Tilni tanlang, tugmani bosing va gapiring. Yana bosing — eshitilgan
          matn pastda chiqadi.
        </p>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {MIC_LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setMicLang(l.code)}
              disabled={recorder.recording || busy}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                micLang === l.code
                  ? "bg-brand-700 text-white"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleMic}
          disabled={!recorder.supported || busy}
          className={recorder.recording ? "btn bg-red-600 text-white" : "btn-primary"}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Aniqlanmoqda...
            </>
          ) : recorder.recording ? (
            <>
              <Square className="h-4 w-4 fill-current" aria-hidden />
              To&apos;xtatish
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" aria-hidden />
              Gapirish
            </>
          )}
        </button>

        {recorder.recording && (
          <div className="mt-3">
            <p className="flex items-center gap-2 text-xs font-medium text-red-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
              Yozilmoqda... {recorder.seconds}s
            </p>

            {/* Jonli ovoz darajasi — gapirganda harakatlanishi kerak */}
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink-200">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  recorder.level > 0.04 ? "bg-accent-500" : "bg-ink-300"
                }`}
                style={{ width: `${Math.round(recorder.level * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-ink-500">
              Gapiring — bu chiziq harakatlanishi kerak. Qimirlamasa, mikrofon
              ovoz olmayapti.
            </p>
          </div>
        )}

        {/* Yozilgan ovozni qaytarib eshitish */}
        {recordedUrl && !recorder.recording && (
          <div className="mt-3 rounded-lg bg-ink-50 p-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              Yozilgan ovoz
              {recordedInfo && (
                <span className="ml-1 font-normal normal-case text-ink-400">
                  ({recordedInfo.seconds}s · {recordedInfo.kb} KB · mikrofon:{" "}
                  {recordedInfo.micPeak}% · faylda: {recordedInfo.filePeak}%)
                </span>
              )}
            </p>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio src={recordedUrl} controls className="w-full" />
            <p className="mt-1.5 text-[11px] text-ink-500">
              O&apos;zingizni eshitsangiz — mikrofon ishlayapti.
            </p>
          </div>
        )}

        {transcript && (
          <div className="mt-3 rounded-lg bg-accent-50 px-3 py-2 ring-1 ring-inset ring-accent-200">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-700">
              Eshitilgan matn
            </p>
            <p className="en-text text-sm text-ink-900">{transcript}</p>
          </div>
        )}

        {(micError || recorder.error) && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800
                          ring-1 ring-inset ring-red-200">
            {recorder.error === "denied"
              ? "Mikrofonga ruxsat berilmadi. Manzil satridagi qulf belgisini bosing -> Mikrofon -> Ruxsat berish."
              : recorder.error === "no-mic"
                ? "Mikrofon topilmadi. Ulanganini tekshiring."
                : micError}
          </div>
        )}
      </section>

      <p className="pb-8 text-center text-xs text-ink-400">
        Muammo davom etsa — shu sahifaning skrinshotini yuboring.
      </p>
    </div>
  );
}

function Row({
  ok,
  label,
  bad,
  warn = false,
}: {
  ok: boolean;
  label: string;
  bad: string;
  /** Xato emas, ogohlantirish (sariq) */
  warn?: boolean;
}) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
          ok
            ? "bg-accent-100 text-accent-700"
            : warn
              ? "bg-amber-100 text-amber-700"
              : "bg-red-100 text-red-700"
        }`}
      >
        {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </span>
      <span className={ok ? "text-ink-800" : "text-ink-600"}>
        {label}
        {!ok && <span className="mt-0.5 block text-xs text-ink-500">{bad}</span>}
      </span>
    </li>
  );
}
