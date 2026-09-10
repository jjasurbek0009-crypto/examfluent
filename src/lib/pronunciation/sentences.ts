/**
 * TALAFFUZ MASHQI uchun jumlalar bazasi.
 *
 * AI ishlatilmadi — sabab: har bir mashq uchun so'rov yuborish bepul
 * limitni bekorga sarflaydi, holbuki jumlalar baribir takrorlanadi.
 * Bu ro'yxat bir zumda ishlaydi va internetsiz ham mavjud.
 *
 * Jumlalar ataylab TANLANGAN: har birida o'zbek va rus tilida
 * so'zlashuvchilar uchun qiyin bo'lgan tovushlar bor:
 *   th (/θ/, /ð/) — "think", "the"
 *   w / v         — "west" va "vest"
 *   uzun/qisqa i  — "ship" va "sheep"
 *   r             — inglizcha yumshoq /r/
 *   -ed oxiri     — "worked" (/t/), "played" (/d/), "wanted" (/ɪd/)
 */

import type { CefrLevel } from "@/lib/cefr";

export interface PronunciationSentence {
  text: string;
  /** Qaysi tovushga urg'u berilgan — foydalanuvchiga maslahat sifatida */
  focus: string;
}

export const SENTENCE_BANK: Record<CefrLevel, PronunciationSentence[]> = {
  A1: [
    { text: "My name is Anna and I am a student.", focus: "clear vowels" },
    { text: "This is my brother. He is ten years old.", focus: "th sound" },
    { text: "I have three red books.", focus: "th + r" },
    { text: "She works in a big shop.", focus: "short i" },
    { text: "We live in a small house.", focus: "w sound" },
    { text: "The weather is very cold today.", focus: "th + w" },
    { text: "I want a cup of tea, please.", focus: "w + linking" },
    { text: "They are my friends.", focus: "voiced th" },
  ],
  A2: [
    { text: "Yesterday I walked to the park with my sister.", focus: "-ed ending" },
    { text: "The train arrives at three thirty.", focus: "th + r" },
    { text: "I would like to visit Vienna next winter.", focus: "w and v" },
    { text: "She watched a very interesting film last night.", focus: "-ed + v" },
    { text: "There were thirteen people waiting there.", focus: "th repetition" },
    { text: "This ship is bigger than that sheep.", focus: "short vs long i" },
    { text: "He always thinks before he speaks.", focus: "th + s clusters" },
    { text: "We travelled through the whole country.", focus: "th + r" },
  ],
  B1: [
    { text: "The government should invest more in public transport.", focus: "consonant clusters" },
    { text: "I have been thinking about this problem for weeks.", focus: "th + linking" },
    { text: "Although it was raining, they decided to walk.", focus: "th + -ed" },
    { text: "Vegetables are usually cheaper in the winter months.", focus: "v + th" },
    { text: "She recommended a wonderful restaurant near the river.", focus: "r + v" },
    { text: "The results were completely different from what we expected.", focus: "-ed + th" },
    { text: "Three thousand three hundred and thirty three.", focus: "th mastery" },
    { text: "I would rather work from home than travel every day.", focus: "w + th + r" },
  ],
  B2: [
    {
      text: "Researchers have thoroughly examined the environmental consequences.",
      focus: "th + r clusters",
    },
    {
      text: "The authorities acknowledged that the strategy was unsuccessful.",
      focus: "th + -ed",
    },
    {
      text: "Nevertheless, the vast majority of viewers were satisfied.",
      focus: "v + th",
    },
    {
      text: "Modern technology has fundamentally changed the way we communicate.",
      focus: "word stress",
    },
    {
      text: "The withdrawal of the proposal was widely criticised.",
      focus: "th + w + r",
    },
    {
      text: "Statistical evidence suggests a strong correlation between the two.",
      focus: "s clusters",
    },
    {
      text: "She thoroughly enjoyed the theatrical performance last Thursday.",
      focus: "th repetition",
    },
    {
      text: "World leaders gathered to discuss the worsening situation.",
      focus: "w + r + th",
    },
  ],
  C1: [
    {
      text: "The unprecedented volatility of the market unnerved even seasoned investors.",
      focus: "v + word stress",
    },
    {
      text: "Notwithstanding these reservations, the committee approved the resolution.",
      focus: "th + polysyllables",
    },
    {
      text: "Their thorough investigation revealed a series of systematic failures.",
      focus: "th + r",
    },
    {
      text: "The philosophical underpinnings of the theory remain controversial.",
      focus: "stress shifts",
    },
    {
      text: "Rural regions were disproportionately affected by the withdrawal of funding.",
      focus: "r + th",
    },
    {
      text: "She articulated her objections with remarkable clarity and restraint.",
      focus: "consonant clusters",
    },
  ],
  C2: [
    {
      text: "The juxtaposition of these two seemingly irreconcilable theories is thought-provoking.",
      focus: "complex clusters",
    },
    {
      text: "Notwithstanding the vehemence of the opposition, the measure was passed unanimously.",
      focus: "v + th + stress",
    },
    {
      text: "Their thoroughgoing reappraisal of the methodology proved worthwhile.",
      focus: "th mastery",
    },
    {
      text: "The rhetoric surrounding the referendum obscured rather than clarified the issues.",
      focus: "r + th",
    },
    {
      text: "An overwhelming preponderance of evidence corroborated the initial hypothesis.",
      focus: "polysyllabic stress",
    },
    {
      text: "The withdrawal of the world's third largest manufacturer was scarcely surprising.",
      focus: "w + th + r",
    },
  ],
};

/** Darajaga mos tasodifiy jumla tanlaydi */
export function randomSentence(
  level: CefrLevel,
  exclude?: string,
): PronunciationSentence {
  const pool = SENTENCE_BANK[level];
  const candidates = exclude ? pool.filter((s) => s.text !== exclude) : pool;
  const list = candidates.length > 0 ? candidates : pool;
  return list[Math.floor(Math.random() * list.length)];
}
