/**
 * DARAJA ANIQLASH TESTI — savollar bazasi.
 *
 * NIMA UCHUN SAVOLLAR AI TOMONIDAN YARATILMAYDI?
 *   1. Tezlik: savollar bir zumda chiqadi, AI'ni kutish shart emas.
 *   2. Ishonchlilik: AI ba'zan noto'g'ri javobli savol yozib qo'yishi mumkin —
 *      daraja aniqlashda bu kechirilmas xato.
 *   3. Bepul limit: har bir foydalanuvchi uchun 20 ta AI so'rovi ketmaydi.
 *   AI faqat OXIRIDA — natijani izohlash uchun bir marta chaqiriladi.
 *
 * Har bir savol qat'iy bitta to'g'ri javobga ega bo'lishi shart.
 */

import type { CefrLevel } from "@/lib/cefr";

export type QuestionSkill = "grammar" | "vocabulary" | "reading";

export interface PlacementQuestion {
  id: string;
  level: CefrLevel;
  skill: QuestionSkill;
  /** Ixtiyoriy o'qish matni (reading savollari uchun) */
  passage?: string;
  prompt: string;
  options: string[];
  /** To'g'ri javobning `options` massividagi tartib raqami (0 dan) */
  answer: number;
}

export const QUESTION_BANK: PlacementQuestion[] = [
  // ======================= A1 =======================
  {
    id: "a1-1", level: "A1", skill: "grammar",
    prompt: "She ___ a doctor.",
    options: ["is", "are", "am", "be"], answer: 0,
  },
  {
    id: "a1-2", level: "A1", skill: "grammar",
    prompt: "I ___ coffee every morning.",
    options: ["drink", "drinks", "drinking", "am drink"], answer: 0,
  },
  {
    id: "a1-3", level: "A1", skill: "vocabulary",
    prompt: "The opposite of \"big\" is ___.",
    options: ["small", "tall", "long", "wide"], answer: 0,
  },
  {
    id: "a1-4", level: "A1", skill: "grammar",
    prompt: "___ is your name?",
    options: ["What", "Who", "Where", "When"], answer: 0,
  },
  {
    id: "a1-5", level: "A1", skill: "vocabulary",
    prompt: "You wear shoes on your ___.",
    options: ["feet", "hands", "head", "ears"], answer: 0,
  },
  {
    id: "a1-6", level: "A1", skill: "grammar",
    prompt: "There ___ two books on the table.",
    options: ["are", "is", "be", "am"], answer: 0,
  },
  {
    id: "a1-7", level: "A1", skill: "reading",
    passage: "Anna is from Spain. She is 22 years old. She is a student.",
    prompt: "How old is Anna?",
    options: ["22", "12", "32", "We don't know"], answer: 0,
  },

  // ======================= A2 =======================
  {
    id: "a2-1", level: "A2", skill: "grammar",
    prompt: "Yesterday I ___ to the cinema with my friends.",
    options: ["went", "go", "going", "have gone"], answer: 0,
  },
  {
    id: "a2-2", level: "A2", skill: "grammar",
    prompt: "My brother is ___ than me.",
    options: ["taller", "tall", "tallest", "more tall"], answer: 0,
  },
  {
    id: "a2-3", level: "A2", skill: "vocabulary",
    prompt: "I need to ___ money before I can buy a car.",
    options: ["save", "spend", "waste", "lose"], answer: 0,
  },
  {
    id: "a2-4", level: "A2", skill: "grammar",
    prompt: "The train leaves ___ 6 o'clock.",
    options: ["at", "in", "on", "by"], answer: 0,
  },
  {
    id: "a2-5", level: "A2", skill: "grammar",
    prompt: "We are going to ___ a party next Saturday.",
    options: ["have", "has", "having", "had"], answer: 0,
  },
  {
    id: "a2-6", level: "A2", skill: "reading",
    passage:
      "Tom gets up at seven o'clock. He has breakfast at home and then goes to work by bus. He works in a bank in the city centre.",
    prompt: "How does Tom travel to work?",
    options: ["By bus", "By car", "On foot", "By train"], answer: 0,
  },
  {
    id: "a2-7", level: "A2", skill: "vocabulary",
    prompt: "It's very cold today. You should wear a ___.",
    options: ["coat", "skirt", "sandal", "swimsuit"], answer: 0,
  },

  // ======================= B1 =======================
  {
    id: "b1-1", level: "B1", skill: "grammar",
    prompt: "If it ___ tomorrow, we will stay at home.",
    options: ["rains", "will rain", "rained", "would rain"], answer: 0,
  },
  {
    id: "b1-2", level: "B1", skill: "grammar",
    prompt: "I have lived in this city ___ 2015.",
    options: ["since", "for", "from", "during"], answer: 0,
  },
  {
    id: "b1-3", level: "B1", skill: "vocabulary",
    prompt: "She ___ up smoking two years ago.",
    options: ["gave", "took", "put", "got"], answer: 0,
  },
  {
    id: "b1-4", level: "B1", skill: "grammar",
    prompt: "The letter ___ yesterday afternoon.",
    options: ["was sent", "sent", "is sent", "has sent"], answer: 0,
  },
  {
    id: "b1-5", level: "B1", skill: "grammar",
    prompt: "He asked me where I ___ from.",
    options: ["came", "come", "am coming", "have come"], answer: 0,
  },
  {
    id: "b1-6", level: "B1", skill: "vocabulary",
    prompt: "Despite the heavy rain, they ___ with the football match.",
    options: ["carried on", "carried out", "took on", "put up"], answer: 0,
  },
  {
    id: "b1-7", level: "B1", skill: "reading",
    passage:
      "The village library opened in 1958 and was run by volunteers for almost fifty years. In 2007 the council took over its funding, but visitor numbers had already begun to fall.",
    prompt: "What does the text suggest about the library?",
    options: [
      "Its decline started before the council took over.",
      "The council closed the library in 2007.",
      "Volunteers stopped working there in 1958.",
      "Visitor numbers rose after 2007.",
    ],
    answer: 0,
  },

  // ======================= B2 =======================
  {
    id: "b2-1", level: "B2", skill: "grammar",
    prompt: "I wish I ___ more time to travel.",
    options: ["had", "have", "will have", "would have"], answer: 0,
  },
  {
    id: "b2-2", level: "B2", skill: "grammar",
    prompt: "By the time we arrived, the film ___.",
    options: ["had already started", "already started", "has already started", "was already start"],
    answer: 0,
  },
  {
    id: "b2-3", level: "B2", skill: "vocabulary",
    prompt: "Her argument was ___ — nobody could find a single flaw in it.",
    options: ["compelling", "repetitive", "trivial", "vague"], answer: 0,
  },
  {
    id: "b2-4", level: "B2", skill: "grammar",
    prompt: "Not only ___ late, but he also forgot the documents.",
    options: ["was he", "he was", "he is", "he did be"], answer: 0,
  },
  {
    id: "b2-5", level: "B2", skill: "vocabulary",
    prompt: "The company had to ___ its workforce during the recession.",
    options: ["downsize", "downgrade", "downplay", "download"], answer: 0,
  },
  {
    id: "b2-6", level: "B2", skill: "grammar",
    prompt: "You ___ have told me earlier — I could have helped.",
    options: ["should", "must", "can", "would"], answer: 0,
  },
  {
    id: "b2-7", level: "B2", skill: "reading",
    passage:
      "While the study found a correlation between screen time and poor sleep, the authors were careful to note that the direction of the relationship remains unclear.",
    prompt: "What are the authors saying?",
    options: [
      "It is not certain which factor causes the other.",
      "Screen time definitely causes poor sleep.",
      "Poor sleep definitely causes more screen time.",
      "There is no relationship between the two.",
    ],
    answer: 0,
  },

  // ======================= C1 =======================
  {
    id: "c1-1", level: "C1", skill: "grammar",
    prompt: "Had I known about the delay, I ___ differently.",
    options: ["would have acted", "would act", "had acted", "will act"], answer: 0,
  },
  {
    id: "c1-2", level: "C1", skill: "vocabulary",
    prompt: "His explanation was ___, leaving the committee more confused than before.",
    options: ["convoluted", "concise", "lucid", "succinct"], answer: 0,
  },
  {
    id: "c1-3", level: "C1", skill: "vocabulary",
    prompt: "The new evidence ___ serious doubt on the original verdict.",
    options: ["cast", "made", "put", "gave"], answer: 0,
  },
  {
    id: "c1-4", level: "C1", skill: "grammar",
    prompt: "Little ___ that the decision would change everything.",
    options: ["did she realise", "she realised", "she did realise", "realised she"], answer: 0,
  },
  {
    id: "c1-5", level: "C1", skill: "vocabulary",
    prompt: "The proposal was met with ___ opposition from the unions.",
    options: ["fierce", "heavy", "wide", "large"], answer: 0,
  },
  {
    id: "c1-6", level: "C1", skill: "grammar",
    prompt: "It is essential that every application ___ by Friday.",
    options: ["be submitted", "is submitting", "will be submitted", "submits"], answer: 0,
  },
  {
    id: "c1-7", level: "C1", skill: "reading",
    passage:
      "The minister conceded that mistakes had been made — a formulation that acknowledged failure while carefully avoiding any admission of personal responsibility.",
    prompt: "What is the writer's attitude to the minister's words?",
    options: [
      "Sceptical of how the admission was worded",
      "Impressed by the minister's honesty",
      "Neutral and purely factual",
      "Sympathetic to the minister's position",
    ],
    answer: 0,
  },

  // ======================= C2 =======================
  {
    id: "c2-1", level: "C2", skill: "vocabulary",
    prompt: "The remarks were widely seen as a ___ attempt to deflect criticism.",
    options: ["transparent", "translucent", "transient", "transcendent"], answer: 0,
  },
  {
    id: "c2-2", level: "C2", skill: "vocabulary",
    prompt: "He accepted the committee's criticism with good ___.",
    options: ["grace", "manner", "will", "heart"], answer: 0,
  },
  {
    id: "c2-3", level: "C2", skill: "grammar",
    prompt: "___ the committee's reservations, the proposal was approved unanimously.",
    options: ["Notwithstanding", "Nevertheless", "However", "Albeit"], answer: 0,
  },
  {
    id: "c2-4", level: "C2", skill: "vocabulary",
    prompt: "After months of wrangling, the negotiations finally ___ fruit.",
    options: ["bore", "made", "took", "gave"], answer: 0,
  },
  {
    id: "c2-5", level: "C2", skill: "vocabulary",
    prompt: "The report was dismissed as a ___ of half-truths and speculation.",
    options: ["farrago", "plethora", "myriad", "surfeit"], answer: 0,
  },
  {
    id: "c2-6", level: "C2", skill: "grammar",
    prompt: "So ___ was the evidence that the defence withdrew its case.",
    options: ["overwhelming", "overwhelmingly", "overwhelmed", "to overwhelm"], answer: 0,
  },
  {
    id: "c2-7", level: "C2", skill: "reading",
    passage:
      "That the policy was well-intentioned is not in dispute; that it achieved anything approaching its stated aims is another matter entirely.",
    prompt: "What is the writer claiming?",
    options: [
      "The policy meant well but probably failed.",
      "The policy was both well-meant and successful.",
      "The policy was deliberately harmful.",
      "The policy's aims were never stated.",
    ],
    answer: 0,
  },
];

/** Testda beriladigan savollar soni */
export const PLACEMENT_LENGTH = 20;

/** Bazadan tez qidirish uchun ko'rinish: daraja → savollar */
export const BANK_BY_LEVEL = QUESTION_BANK.reduce<Record<string, PlacementQuestion[]>>(
  (acc, q) => {
    (acc[q.level] ??= []).push(q);
    return acc;
  },
  {},
);
