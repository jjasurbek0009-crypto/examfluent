"use client";

/**
 * OVOZ YOZIB OLISH (mikrofondan).
 *
 * NIMA UCHUN BRAUZERNING NUTQ TANISH XIZMATI EMAS?
 *   Chrome'ning Web Speech API'si o'zbek tilini juda yomon taniydi —
 *   "isming nima" o'rniga "Ssvning nima" chiqaradi. Bundan tashqari u
 *   Firefox va Safari'da umuman yo'q.
 *
 *   Shuning uchun ovozni yozib olib, Gemini'ga yuboramiz. Sinov natijasi:
 *   Chrome tanimagan jumlani Gemini 2 soniyada to'liq to'g'ri tanidi.
 *
 * FORMAT HAQIDA:
 *   MediaRecorder har bir brauzerda har xil format beradi (webm, mp4, ogg).
 *   Gemini esa hammasini qabul qilmaydi. Shuning uchun yozilgan ovozni
 *   brauzerning o'zida WAV ga aylantiramiz — bu format aniq ishlaydi.
 *   Ayni paytda 16 kHz mono ga tushiramiz: nutq uchun bu yetarli va
 *   fayl hajmi 6 barobar kichrayadi.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/** Gemini nutqni baribir 16 kHz da qayta ishlaydi — ko'proq berish isrof */
const TARGET_SAMPLE_RATE = 16000;

/** Eng uzun yozuv. Uzunroq bo'lsa fayl katta bo'lib, limit tez tugaydi. */
export const MAX_RECORDING_SECONDS = 30;

/**
 * Shundan past bo'lsa — haqiqiy jimlik deb hisoblaymiz.
 * Ataylab juda past qo'yilgan: sekin mikrofonni "jim" deb rad etmaslik uchun.
 */
const SILENCE_THRESHOLD = 0.005;

export type RecorderError = "denied" | "no-mic" | "unsupported" | "generic" | null;

/** Yozuv natijasi va uning o'lchovlari */
export interface RecordingResult {
  blob: Blob;
  /** Sekundlarda */
  seconds: number;
  /**
   * Tayyor WAV ichidagi eng baland nuqta (0-1).
   *
   * NIMA UCHUN KERAK? Mikrofon o'lchagichi ovozni ko'rishi mumkin, lekin
   * formatni o'girishda ovoz yo'qolib qolsa, serverga JIMLIK ketadi va
   * "ovoz eshitilmadi" degan chalg'ituvchi xato chiqadi. Bu qiymat
   * muammo qayerdaligini aniq ko'rsatadi.
   */
  peak: number;
  /** Yakuniy fayl jim chiqdimi? */
  silent: boolean;
}

export interface AudioRecorderState {
  supported: boolean;
  recording: boolean;
  /** Yozuv boshlanganidan beri o'tgan soniyalar */
  seconds: number;
  /**
   * Mikrofondagi joriy ovoz balandligi (0 dan 1 gacha).
   *
   * Nima uchun kerak? Foydalanuvchi gapiryapti, lekin mikrofon
   * boshqa qurilmaga ulangan yoki o'chirilgan bo'lishi mumkin.
   * Bu ko'rsatkichsiz u buni faqat "ovoz eshitilmadi" xatosidan
   * keyin biladi — ya'ni kech.
   */
  level: number;
  /** Yozuv davomida eng baland nuqta — jimlikni aniqlash uchun */
  peakLevel: number;
  error: RecorderError;
  start: () => Promise<void>;
  /** Yozishni tugatib, WAV faylni va o'lchovlarni qaytaradi */
  stop: () => Promise<RecordingResult | null>;
  cancel: () => void;
}

export function useAudioRecorder(): AudioRecorderState {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<RecorderError>(null);

  const [level, setLevel] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelledRef = useRef(false);

  // Ovoz balandligini o'lchash uchun
  const meterCtxRef = useRef<AudioContext | null>(null);
  const meterFrameRef = useRef<number | null>(null);
  const peakRef = useRef(0);

  /** Mikrofondagi ovoz balandligini kuzatib boradi */
  const startMeter = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      meterCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteTimeDomainData(data);

        // O'rtacha kvadratik qiymat (RMS) — ovoz balandligining o'lchovi
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);

        // Ko'z uchun qulay bo'lishi uchun biroz kuchaytiramiz
        const value = Math.min(1, rms * 4);
        setLevel(value);
        if (value > peakRef.current) {
          peakRef.current = value;
          setPeakLevel(value);
        }

        meterFrameRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch {
      // O'lchagich ishlamasa ham yozuv davom etadi
    }
  }, []);

  const stopMeter = useCallback(() => {
    if (meterFrameRef.current !== null) {
      cancelAnimationFrame(meterFrameRef.current);
      meterFrameRef.current = null;
    }
    meterCtxRef.current?.close().catch(() => {});
    meterCtxRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        typeof MediaRecorder !== "undefined" &&
        Boolean(navigator.mediaDevices?.getUserMedia),
    );
  }, []);

  // Yozuv davomiyligini sanaymiz
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  /** Mikrofonni yopamiz — aks holda brauzerda qizil nuqta yonib turadi */
  const releaseStream = useCallback(() => {
    stopMeter();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, [stopMeter]);

  const start = useCallback(async () => {
    setError(null);
    setSeconds(0);
    cancelledRef.current = false;
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Nutq uchun foydali: shovqin va aks-sadoni kamaytiradi
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      peakRef.current = 0;
      setPeakLevel(0);
      startMeter(stream);

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      // Har 250 ms da bo'lak olamiz. Bitta katta blobni oxirida kutishdan
      // ko'ra ishonchliroq: brauzer to'satdan to'xtasa ham yozilgani qoladi.
      recorder.start(250);
      setRecording(true);
    } catch (err) {
      releaseStream();
      const name = (err as Error)?.name ?? "";
      if (name === "NotAllowedError" || name === "SecurityError") setError("denied");
      else if (name === "NotFoundError") setError("no-mic");
      else setError("generic");
    }
  }, [releaseStream, startMeter]);

  const stop = useCallback(async (): Promise<RecordingResult | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setRecording(false);
      return null;
    }

    // Yozuv to'liq tugashini kutamiz
    const finished = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    recorder.stop();
    await finished;

    releaseStream();
    setRecording(false);
    recorderRef.current = null;

    if (cancelledRef.current || chunksRef.current.length === 0) return null;

    const raw = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
    chunksRef.current = [];

    try {
      const { blob, peak, seconds } = await toWav(raw);
      return { blob, peak, seconds, silent: peak < SILENCE_THRESHOLD };
    } catch {
      setError("generic");
      return null;
    }
  }, [releaseStream]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    releaseStream();
    recorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    setSeconds(0);
  }, [releaseStream]);

  // Komponent yopilganda mikrofon ochiq qolmasin
  useEffect(() => () => releaseStream(), [releaseStream]);

  return { supported, recording, seconds, level, peakLevel, error, start, stop, cancel };
}

// ---------------------------------------------------------------------------
//  Formatni WAV ga aylantirish
// ---------------------------------------------------------------------------

/**
 * Yozilgan ovozni 16 kHz mono WAV ga aylantiradi.
 *
 * Brauzer ovozni o'zi qulay formatda yozadi (Chrome — webm/opus,
 * Safari — mp4/aac). Gemini bularning hammasini qabul qilavermaydi,
 * WAV esa har doim ishlaydi.
 */
async function toWav(blob: Blob): Promise<{ blob: Blob; peak: number; seconds: number }> {
  const arrayBuffer = await blob.arrayBuffer();

  // Dekodlash uchun vaqtinchalik kontekst
  const decodeCtx = new AudioContext();
  const decoded = await decodeCtx.decodeAudioData(arrayBuffer);
  await decodeCtx.close();

  /*
   * 16 kHz mono ga qayta hisoblaymiz.
   *
   * DIQQAT: uzunlikni `decoded.duration` dan HISOBLAMAYMIZ.
   * MediaRecorder yaratgan webm fayllarida davomiylik sarlavhasi ko'pincha
   * yozilmaydi va `duration` 0 yoki Infinity bo'lib chiqadi. Bunday holda
   * OfflineAudioContext bo'sh (jim) natija beradi va serverga jimlik ketadi —
   * foydalanuvchi esa "ovoz eshitilmadi" degan chalg'ituvchi xato oladi.
   *
   * `decoded.length` — haqiqiy namunalar soni, u har doim to'g'ri.
   */
  const length = Math.max(
    1,
    Math.ceil((decoded.length * TARGET_SAMPLE_RATE) / decoded.sampleRate),
  );
  const offline = new OfflineAudioContext(1, length, TARGET_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();

  const rendered = await offline.startRendering();
  const samples = rendered.getChannelData(0);

  // Eng baland nuqtani o'lchaymiz — jimlikni aniqlash uchun
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
  }

  /*
   * OVOZ BALANDLIGINI NORMALLASHTIRISH.
   *
   * Ko'p noutbuk mikrofonlari juda sekin yozadi — ovoz bor, lekin darajasi
   * 5-10% atrofida. Bunday yozuvni tanish xizmati "jimlik" deb hisoblaydi
   * va foydalanuvchi "balandroq gapiring" degan xabar oladi. U esa
   * balandroq gapiradi va baribir ishlamaydi, chunki muammo ovozida emas —
   * mikrofonning sezgirligida.
   *
   * Shuning uchun eng baland nuqtani 0.95 ga ko'taramiz. Bu ovozni
   * buzmaydi (faqat bir xil songa ko'paytiriladi), lekin tanish sifatini
   * sezilarli oshiradi.
   */
  const NORMALISE_TARGET = 0.95;
  let output = samples;

  if (peak > SILENCE_THRESHOLD && peak < NORMALISE_TARGET) {
    const gain = NORMALISE_TARGET / peak;
    output = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      output[i] = samples[i] * gain;
    }
  }

  return {
    blob: encodeWav(output, TARGET_SAMPLE_RATE),
    // `peak` — normallashtirishdan OLDINGI qiymat. Aynan shu mikrofon
    // qanchalik sekin yozayotganini ko'rsatadi, shuning uchun shuni beramiz.
    peak,
    seconds: Math.round((samples.length / TARGET_SAMPLE_RATE) * 10) / 10,
  };
}

/** Float namunalarni 16-bitli WAV faylga o'raydi */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, samples.length * 2, true);

  // Float (-1..1) dan 16-bitli butun songa
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}
