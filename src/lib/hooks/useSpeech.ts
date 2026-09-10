"use client";

/**
 * MATNNI OVOZGA AYLANTIRISH (Text-to-Speech).
 *
 * Brauzerning o'z imkoniyati — Web Speech API. Bu:
 *   - mutlaqo bepul (hech qanday API kalit kerak emas)
 *   - internetsiz ham ishlaydi
 *   - Chrome, Edge, Safari'da mavjud
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface SpeechState {
  supported: boolean;
  speaking: boolean;
  /** Tanlangan ovoz nomi (diagnostika va ogohlantirish uchun) */
  voiceName: string | null;
  /** Brauzerda umuman ovoz bormi? Yo'q bo'lsa hech narsa eshitilmaydi. */
  hasAnyVoice: boolean;
  /** Inglizcha ovoz bormi? Yo'q bo'lsa talaffuz g'alati bo'ladi. */
  hasEnglishVoice: boolean;
  /** Barcha mavjud ovozlar — diagnostika sahifasi uchun */
  voices: Array<{ name: string; lang: string; local: boolean }>;
  /** Ovoz serverdan (Gemini) olinyaptimi? Brauzerda inglizcha ovoz yo'q degani. */
  usingServerVoice: boolean;
  /** Server ovozini kutish holati */
  loading: boolean;
  /** Ovozning tezligi: 0.6 = sekin, 1 = normal */
  rate: number;
  setRate: (rate: number) => void;
  speak: (text: string) => void;
  stop: () => void;
}

/**
 * CHROME NUQSONI: bitta uzun jumlani o'qiyotganda ~15 soniyadan keyin
 * ovoz sababsiz uzilib qoladi. Yechim — matnni qisqa bo'laklarga bo'lib,
 * navbat bilan o'qitish. Bu Chrome'da yillar davomida mavjud bo'lgan
 * mashhur muammo va standart chorasi aynan shu.
 */
const MAX_CHUNK = 170;

/** Matnni jumlalar chegarasida bo'laklarga ajratadi */
function splitIntoChunks(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= MAX_CHUNK) return [clean];

  // Avval jumlalarga bo'lamiz (nuqta, savol, undov belgisidan keyin)
  const sentences = clean.match(/[^.!?]+[.!?]*\s*/g) ?? [clean];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > MAX_CHUNK && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }

    // Bitta jumla ham juda uzun bo'lsa: avval vergul, bo'lmasa bo'shliq
    // bo'yicha kesamiz. So'z o'rtasidan kesish MUMKIN EMAS — aks holda
    // sintezator "n othing" deb g'alati talaffuz qiladi.
    while (current.length > MAX_CHUNK) {
      const comma = current.lastIndexOf(",", MAX_CHUNK);
      const space = current.lastIndexOf(" ", MAX_CHUNK);

      let at: number;
      if (comma > 40) at = comma + 1;
      else if (space > 20) at = space + 1;
      else at = MAX_CHUNK; // umuman bo'shliq yo'q (juda kam uchraydi)

      chunks.push(current.slice(0, at).trim());
      current = current.slice(at);
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}

export function useSpeech(): SpeechState {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState(0.95);

  const [voices, setVoices] = useState<Array<{ name: string; lang: string; local: boolean }>>([]);
  const [hasEnglishVoice, setHasEnglishVoice] = useState(false);
  const [voiceName, setVoiceName] = useState<string | null>(null);

  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const rateRef = useRef(rate);
  rateRef.current = rate;

  /** Hozirgi o'qish navbatining raqami — eskisini bekor qilish uchun */
  const runIdRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);

    /**
     * Ingliz tilidagi eng yaxshi ovozni tanlaymiz.
     * Britaniya talaffuzi (en-GB) IELTS uchun eng mos.
     */
    function pickVoice() {
      const all = window.speechSynthesis.getVoices();
      if (all.length === 0) return;

      const english =
        all.find((v) => v.lang === "en-GB" && !v.localService) ||
        all.find((v) => v.lang === "en-GB") ||
        all.find((v) => v.lang.startsWith("en-US")) ||
        all.find((v) => v.lang.startsWith("en")) ||
        null;

      /*
       * ZAXIRA: inglizcha ovoz topilmasa, mavjud BIRINCHI ovozni olamiz.
       *
       * Sabab: Windows'da faqat o'zbek yoki rus til paketi o'rnatilgan
       * bo'lsa, inglizcha ovoz umuman bo'lmaydi. Avval bunday holda kod
       * `null` qaytarardi va Chrome JIMGINA hech narsa o'qimasdi —
       * foydalanuvchi "ovoz ishlamayapti" deb o'ylardi.
       * Talaffuz mukammal bo'lmasa ham, jimlikdan ko'ra yaxshiroq.
       */
      voiceRef.current = english ?? all[0] ?? null;

      setHasEnglishVoice(Boolean(english));
      setVoiceName(voiceRef.current?.name ?? null);
      setVoices(all.map((v) => ({ name: v.name, lang: v.lang, local: v.localService })));
    }

    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
      window.speechSynthesis.cancel();
    };
  }, []);

  /** Server ovozi uchun audio elementi va kesh */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const hasEnglishRef = useRef(false);
  hasEnglishRef.current = hasEnglishVoice;

  const stop = useCallback(() => {
    runIdRef.current += 1; // davom etayotgan navbatni bekor qilamiz

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSpeaking(false);
    setLoading(false);
  }, []);

  /**
   * ZAXIRA YO'L: ovozni serverdan olamiz.
   * Brauzerda inglizcha ovoz bo'lmaganda ishlatiladi.
   */
  const speakViaServer = useCallback(async (text: string, runId: number) => {
    setLoading(true);

    try {
      // Bir xil matn qayta so'ralsa — limitni tejaymiz
      let url = cacheRef.current.get(text);

      if (!url) {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        cacheRef.current.set(text, url);

        // Kesh cheksiz o'smasin
        if (cacheRef.current.size > 20) {
          const oldest = cacheRef.current.keys().next().value;
          if (oldest) {
            URL.revokeObjectURL(cacheRef.current.get(oldest)!);
            cacheRef.current.delete(oldest);
          }
        }
      }

      // Kutayotganimizda foydalanuvchi to'xtatgan bo'lishi mumkin
      if (runId !== runIdRef.current) return;

      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.src = url;
      audio.onended = () => {
        if (runId === runIdRef.current) setSpeaking(false);
      };
      audio.onerror = () => {
        if (runId === runIdRef.current) setSpeaking(false);
      };

      setLoading(false);
      setSpeaking(true);
      await audio.play();
    } catch {
      if (runId === runIdRef.current) {
        setLoading(false);
        setSpeaking(false);
      }
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const chunks = splitIntoChunks(text);
    if (chunks.length === 0) return;

    const runId = ++runIdRef.current;

    /*
     * Qaysi yo'l bilan o'qiymiz?
     *
     * Brauzerda inglizcha ovoz BOR   -> brauzernikisi (bir zumda, limitsiz)
     * Inglizcha ovoz YO'Q            -> Gemini (to'g'ri talaffuz, lekin sekinroq)
     *
     * Bu tartib ataylab shunday: server ovozi har chaqiruvda bepul limitni
     * yeydi, shuning uchun u faqat zarur bo'lganda ishlatiladi.
     */
    if (!hasEnglishRef.current) {
      void speakViaServer(text, runId);
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();
    setSpeaking(true);

    /** Bo'laklarni ketma-ket o'qiydi */
    const speakChunk = (index: number) => {
      // Boshqa o'qish boshlangan bo'lsa — bu navbatni tashlab yuboramiz
      if (runId !== runIdRef.current) return;

      if (index >= chunks.length) {
        setSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.lang = voiceRef.current?.lang || "en-GB";
      utterance.rate = rateRef.current;
      utterance.pitch = 1;
      if (voiceRef.current) utterance.voice = voiceRef.current;

      utterance.onend = () => speakChunk(index + 1);
      utterance.onerror = () => {
        if (runId === runIdRef.current) setSpeaking(false);
      };

      synth.speak(utterance);
    };

    /**
     * Ovozlar ro'yxati hali yuklanmagan bo'lishi mumkin (Chrome'da sahifa
     * ochilganda bo'sh keladi). Bunday holda biroz kutib, keyin boshlaymiz —
     * aks holda ovoz umuman chiqmaydi.
     */
    if (synth.getVoices().length === 0) {
      setTimeout(() => speakChunk(0), 250);
    } else {
      speakChunk(0);
    }
  }, [speakViaServer]);

  /**
   * CHROME NUQSONI 2: uzoq o'qishda sintezator o'zi "pauza" holatiga
   * tushib qoladi va jim bo'lib qoladi. Har yarim soniyada uyg'otib turamiz.
   */
  useEffect(() => {
    if (!speaking || !hasEnglishRef.current || typeof window === "undefined") return;

    const timer = setInterval(() => {
      const synth = window.speechSynthesis;
      if (synth.paused) synth.resume();
      // Sintezator tugagan, lekin holat yangilanmagan bo'lsa — tuzatamiz
      if (!synth.speaking && !synth.pending) setSpeaking(false);
    }, 500);

    return () => clearInterval(timer);
  }, [speaking]);

  return {
    supported,
    speaking,
    voiceName,
    hasAnyVoice: voices.length > 0,
    hasEnglishVoice,
    voices,
    usingServerVoice: supported && voices.length > 0 && !hasEnglishVoice,
    loading,
    rate,
    setRate,
    speak,
    stop,
  };
}
