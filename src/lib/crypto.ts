/**
 * KICHIK SHIFRLASH QATLAMI.
 *
 * MUAMMO:
 *   Reading/Listening mashqlarida to'g'ri javoblar bor. Agar ularni
 *   brauzerga yuborsak, foydalanuvchi sahifa kodini ochib ko'ra oladi va
 *   mashq ma'nosini yo'qotadi.
 *
 * YECHIM:
 *   To'g'ri javoblarni SHIFRLAB, "token" ko'rinishida brauzerga beramiz.
 *   Brauzer uni ocha olmaydi (kalit faqat serverda). Javob yuborilganda
 *   token qaytib keladi, server uni ochadi va baholaydi.
 *
 * Nima uchun bazaga saqlamadik? Chunki bu usul qo'shimcha jadval ham,
 * qo'shimcha so'rov ham talab qilmaydi — ya'ni tezroq va soddaroq.
 *
 * AES-256-GCM ishlatiladi: u nafaqat yashiradi, balki o'zgartirilganini
 * ham aniqlaydi (ya'ni tokenni "tahrirlab" bo'lmaydi).
 */

import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12; // GCM uchun tavsiya etilgan uzunlik
const TAG_LENGTH = 16;

/**
 * Shifrlash kalitini hosil qiladi.
 *
 * APP_SECRET berilgan bo'lsa — o'shani ishlatadi (tavsiya etiladi).
 * Berilmagan bo'lsa — GEMINI_API_KEY'dan hosil qiladi. Bu ham xavfsiz,
 * chunki u ham maxfiy va faqat serverda turadi; shunchaki kalit
 * almashtirilganda eski tokenlar ishlamay qoladi (bu muammo emas —
 * tokenlar bir necha daqiqagina yashaydi).
 */
function getKey(): Buffer {
  const secret = process.env.APP_SECRET || process.env.GEMINI_API_KEY;

  if (!secret) {
    throw new Error(
      "APP_SECRET yoki GEMINI_API_KEY o'rnatilmagan — mashq tokenlarini shifrlab bo'lmaydi.",
    );
  }

  // sha256 har doim aniq 32 bayt (256 bit) beradi — AES-256 uchun aynan shu kerak
  return createHash("sha256").update(secret).digest();
}

/** Obyektni shifrlab, matnli tokenga aylantiradi */
export function seal(payload: unknown): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, getKey(), iv);

  const data = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);

  // iv + tag + ma'lumot → bitta base64url satr
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}

/**
 * Tokenni ochadi. Token buzilgan yoki o'zgartirilgan bo'lsa — null qaytaradi
 * (dastur qulamaydi).
 */
export function open<T>(token: string): T | null {
  try {
    const raw = Buffer.from(token, "base64url");
    if (raw.length < IV_LENGTH + TAG_LENGTH) return null;

    const iv = raw.subarray(0, IV_LENGTH);
    const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const data = raw.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(tag);

    const json = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
