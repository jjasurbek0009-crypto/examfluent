/**
 * Google Gemini bilan ishlash qatlami.
 *
 * NIMA UCHUN SDK EMAS, TO'G'RIDAN-TO'G'RI fetch?
 *   1. Bitta ham qo'shimcha paket o'rnatilmaydi → loyiha yengil, build tez.
 *   2. Google SDK'lari tez-tez o'zgaradi (eskisi "deprecated" bo'lib qoladi),
 *      REST manzil esa barqaror turadi.
 *   3. Vercel'ning bepul tarifida har bir megabayt ahamiyatli.
 *
 * MUHIM: bu fayl FAQAT serverda ishlaydi (API route'lar ichida).
 * GEMINI_API_KEY hech qachon brauzerga yuborilmasligi kerak.
 */

import "server-only";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * IKKITA MODEL — nima uchun?
 *
 * Gemini 3.x modellari javob berishdan oldin "o'ylaydi" (thinking). Bu sifatni
 * oshiradi, lekin sekinlashtiradi va tokenlarni yeydi. O'lchov natijalari:
 *
 *   gemini-3.6-flash        →  ~710 o'ylash tokeni,  ~10 soniya
 *   gemini-flash-lite-latest →  o'ylash yo'q,         ~1 soniya
 *
 * Suhbatda 10 soniya kutish qabul qilib bo'lmas — shuning uchun chat TEZ
 * modelda ishlaydi. Baholash va mashq yaratishda esa sifat muhimroq va
 * foydalanuvchi baribir "yuklanmoqda" ekranini ko'rib turadi.
 */

/** Sifatli model: baholash, mashq yaratish, tahlil */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

/** Tez model: suhbat va xatolarni tuzatish */
export const GEMINI_FAST_MODEL =
  process.env.GEMINI_FAST_MODEL || "gemini-flash-lite-latest";

/**
 * O'ylash tokenlari uchun qo'shimcha zaxira.
 *
 * MUAMMO: `maxOutputTokens` o'ylash tokenlarini HAM o'z ichiga oladi.
 * Ya'ni 700 deb qo'ysak, model 690 tokenni o'ylashga sarflab, javobga
 * atigi 10 ta qoldirishi mumkin — natijada javob yarim uzilib qoladi
 * (finishReason: MAX_TOKENS) va JSON buziladi.
 *
 * YECHIM: so'ralgan miqdorga zaxira qo'shamiz. Shunda `maxOutputTokens`
 * parametri "ko'rinadigan javob uzunligi" degan ma'noni anglatadi.
 */
const THINKING_HEADROOM = 2000;

// ---------------------------------------------------------------------------
//  Turlar (types)
// ---------------------------------------------------------------------------

export type GeminiRole = "user" | "model";

export interface GeminiTurn {
  role: GeminiRole;
  text: string;
}

/**
 * Gemini "responseSchema" uchun sxema turi.
 * Bu OpenAPI sxemasining soddalashtirilgan ko'rinishi — Google shuni qabul qiladi.
 */
export interface GeminiSchema {
  type: "OBJECT" | "ARRAY" | "STRING" | "NUMBER" | "INTEGER" | "BOOLEAN";
  description?: string;
  properties?: Record<string, GeminiSchema>;
  items?: GeminiSchema;
  required?: string[];
  enum?: string[];
  nullable?: boolean;
  /** Javobdagi maydonlar tartibi — barqaror natija uchun foydali */
  propertyOrdering?: string[];
}

interface GenerateOptions {
  /** AI'ga "sen kimsan va nima qilishing kerak" degan ko'rsatma */
  system?: string;
  /** Suhbat tarixi. Faqat bitta savol bo'lsa — `prompt` ishlating. */
  history?: GeminiTurn[];
  /** Bitta savol (history bilan birga ham ishlatish mumkin — oxiriga qo'shiladi) */
  prompt?: string;
  /** 0 = qat'iy va bir xil javob, 1 = ijodiy. Baholash uchun past qiymat yaxshi. */
  temperature?: number;
  maxOutputTokens?: number;
  /** JSON javob talab qilinsa — sxemani shu yerga bering */
  schema?: GeminiSchema;
  model?: string;
  signal?: AbortSignal;
}

/** Gemini bilan bog'liq xatolar uchun maxsus class — API route'da tutib olamiz. */
export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

// ---------------------------------------------------------------------------
//  Ichki yordamchilar
// ---------------------------------------------------------------------------

function requireApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new GeminiError(
      "GEMINI_API_KEY topilmadi. .env.local fayliga qo'shing va serverni qayta ishga tushiring.",
      500,
      false,
    );
  }
  return key;
}

function buildBody(opts: GenerateOptions) {
  const contents: Array<{ role: GeminiRole; parts: Array<{ text: string }> }> = [];

  for (const turn of opts.history ?? []) {
    // Bo'sh xabarlarni yubormaymiz — Gemini ularni rad etadi
    if (turn.text.trim()) {
      contents.push({ role: turn.role, parts: [{ text: turn.text }] });
    }
  }
  if (opts.prompt?.trim()) {
    contents.push({ role: "user", parts: [{ text: opts.prompt }] });
  }

  if (contents.length === 0) {
    throw new GeminiError("Gemini'ga yuborish uchun matn yo'q.", 400, false);
  }

  return {
    contents,
    ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      // Zaxira qo'shamiz — yuqoridagi THINKING_HEADROOM izohiga qarang
      maxOutputTokens: (opts.maxOutputTokens ?? 2048) + THINKING_HEADROOM,
      ...(opts.schema
        ? { responseMimeType: "application/json", responseSchema: opts.schema }
        : {}),
    },
    // Ta'lim platformasi uchun filtrlarni biroz bo'shatamiz: aks holda
    // "war", "alcohol" kabi oddiy IELTS mavzulari bloklanib qolishi mumkin.
    safetySettings: [
      "HARM_CATEGORY_HARASSMENT",
      "HARM_CATEGORY_HATE_SPEECH",
      "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      "HARM_CATEGORY_DANGEROUS_CONTENT",
    ].map((category) => ({ category, threshold: "BLOCK_ONLY_HIGH" })),
  };
}

/** Xato bo'lganda qayta urinib ko'rish kerakmi? (limit / vaqtinchalik nosozlik) */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 503 || status === 504;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
//  1) generateText — oddiy matnli javob
// ---------------------------------------------------------------------------

export async function generateText(opts: GenerateOptions): Promise<string> {
  const model = opts.model || GEMINI_MODEL;
  const body = buildBody(opts);

  // Bepul tarifda 429 (limit) tez-tez uchraydi — 3 marta urinib ko'ramiz.
  let lastError: GeminiError | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(600 * attempt); // 0.6s, keyin 1.2s kutamiz

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/${model}:generateContent`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": requireApiKey(),
        },
        body: JSON.stringify(body),
        signal: opts.signal,
      });
    } catch (err) {
      lastError = new GeminiError("Tarmoq xatosi: Gemini'ga ulanib bo'lmadi.", 503, true);
      continue;
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      const retryable = isRetryableStatus(res.status);
      lastError = new GeminiError(
        res.status === 429
          ? "Gemini bepul limiti vaqtincha tugadi. Bir daqiqadan so'ng qayta urining."
          : `Gemini xatosi (${res.status}): ${detail.slice(0, 300)}`,
        res.status,
        retryable,
      );
      if (!retryable) throw lastError;
      continue;
    }

    const data = await res.json();
    // To'liq javob — bu yerda trim qilish xavfsiz
    const text = extractText(data).trim();
    if (text) return text;

    // Javob bo'sh — odatda xavfsizlik filtri to'sganda shunday bo'ladi
    const reason = data?.candidates?.[0]?.finishReason ?? "UNKNOWN";
    throw new GeminiError(`Gemini bo'sh javob qaytardi (sabab: ${reason}).`, 502, false);
  }

  throw lastError ?? new GeminiError("Gemini javob bermadi.", 503, true);
}

/**
 * Gemini javobidan matnni ajratib oladi.
 *
 * DIQQAT — bu yerda `.trim()` QILINMAYDI, va buning jiddiy sababi bor:
 *
 * Oqim (stream) rejimida javob bo'laklarga bo'linib keladi, masalan:
 *     1-bo'lak: "It"
 *     2-bo'lak: " is always nice to see old friends."
 *
 * Agar har bir bo'lakni trim qilsak, ikkinchi bo'lakning boshidagi bo'shliq
 * yo'qoladi va natija "Itis always nice..." bo'lib chiqadi — so'zlar
 * bir-biriga yopishib qoladi.
 *
 * Shuning uchun trim faqat TO'LIQ javob yig'ilgandan keyin qilinadi
 * (generateText ichida).
 */
function extractText(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";

  return parts
    .map((p: any) => {
      // Gemini 3.x "o'ylaydigan" (thinking) modellar javobga o'zining ichki
      // mulohazalarini ham qo'shishi mumkin — ular `thought: true` bilan
      // belgilanadi. Ularni foydalanuvchiga KO'RSATMASLIK kerak.
      if (p?.thought === true) return "";
      return typeof p?.text === "string" ? p.text : "";
    })
    .join("");
}

// ---------------------------------------------------------------------------
//  2) generateJSON — sxemaga mos JSON javob
// ---------------------------------------------------------------------------
//  Baholash, mashq yaratish, xatolarni tuzatish — hammasi shu funksiya orqali.
//  responseSchema berilgani uchun Gemini FAQAT to'g'ri JSON qaytaradi.
// ---------------------------------------------------------------------------

export async function generateJSON<T>(
  opts: GenerateOptions & { schema: GeminiSchema },
): Promise<T> {
  const raw = await generateText({
    temperature: 0.3, // baholashda barqarorlik muhim
    ...opts,
  });

  try {
    return JSON.parse(raw) as T;
  } catch {
    // Ehtiyot chorasi: ba'zan model JSON'ni ```json ... ``` ichiga o'raydi
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      throw new GeminiError(
        `Gemini javobini JSON sifatida o'qib bo'lmadi: ${raw.slice(0, 200)}`,
        502,
        true,
      );
    }
  }
}

// ---------------------------------------------------------------------------
//  4) callGemini — xom so'rov (ovoz, transkripsiya, talaffuz baholash uchun)
// ---------------------------------------------------------------------------
/**
 * Gemini'ga ixtiyoriy so'rov yuboradi va JSON javobni qaytaradi.
 *
 * NIMA UCHUN KERAK?
 *   generateText/generateJSON faqat MATN bilan ishlaydi. Ovoz yuborish yoki
 *   audio javob olish uchun so'rov tanasi boshqacha bo'ladi. Ilgari bunday
 *   marshrutlar to'g'ridan-to'g'ri fetch chaqirardi va QAYTA URINMASDI —
 *   tarmoq bir soniya uzilsa (ECONNRESET), butun so'rov yo'qolardi.
 *   Amalda shunday bo'ldi ham. Endi hammasi shu funksiya orqali o'tadi.
 */
export async function callGemini(
  model: string,
  body: unknown,
  options: { attempts?: number; signal?: AbortSignal } = {},
): Promise<any> {
  const attempts = options.attempts ?? 3;
  let lastError: GeminiError | null = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(700 * attempt);

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/${model}:generateContent`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": requireApiKey(),
        },
        body: JSON.stringify(body),
        signal: options.signal,
      });
    } catch {
      // Tarmoq uzildi (ECONNRESET va shunga o'xshash) — qayta urinamiz
      lastError = new GeminiError("Tarmoq xatosi: Gemini'ga ulanib bo'lmadi.", 503, true);
      continue;
    }

    if (res.ok) return res.json();

    const detail = await res.text().catch(() => "");
    const retryable = isRetryableStatus(res.status);

    lastError = new GeminiError(
      res.status === 429
        ? "Gemini bepul limiti vaqtincha tugadi. Bir daqiqadan so'ng qayta urining."
        : `Gemini xatosi (${res.status}): ${detail.slice(0, 300)}`,
      res.status,
      retryable,
    );

    if (!retryable) throw lastError;
  }

  throw lastError ?? new GeminiError("Gemini javob bermadi.", 503, true);
}

// ---------------------------------------------------------------------------
//  3) streamText — javobni harf-harf oqim (stream) qilib qaytarish
// ---------------------------------------------------------------------------
//  Chatbot uchun kerak: foydalanuvchi 5 soniya kutib o'tirmasin, matn
//  yozilayotgandek paydo bo'lsin. Bu "professional" his beradi.
// ---------------------------------------------------------------------------

export async function* streamText(opts: GenerateOptions): AsyncGenerator<string> {
  const model = opts.model || GEMINI_MODEL;
  const body = buildBody(opts);

  const res = await fetch(`${API_BASE}/${model}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": requireApiKey(),
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new GeminiError(
      res.status === 429
        ? "Gemini bepul limiti vaqtincha tugadi. Bir daqiqadan so'ng qayta urining."
        : `Gemini xatosi (${res.status}): ${detail.slice(0, 300)}`,
      res.status,
      isRetryableStatus(res.status),
    );
  }

  // SSE (Server-Sent Events) formatini o'qiymiz: har bir bo'lak "data: {...}"
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Qatorlarga ajratamiz; oxirgi (tugallanmagan) qator buferda qoladi
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      try {
        const chunk = extractText(JSON.parse(payload));
        if (chunk) yield chunk;
      } catch {
        // Buzuq bo'lak — o'tkazib yuboramiz, oqim davom etadi
      }
    }
  }
}
