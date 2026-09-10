/**
 * Nutq bilan bog'liq yordamchilar.
 *
 * Ovozni matnga aylantirish Gemini orqali bajariladi
 * (src/app/api/speech/transcribe/route.ts). Sabab: brauzerning o'z
 * nutq tanish xizmati o'zbek tilini juda yomon taniydi.
 *
 * O'lchov (bir xil ovoz namunasi):
 *   Chrome Web Speech  ->  "Ssvning nima"    (tushunarsiz)
 *   Gemini flash-lite  ->  "Isming nima?"    (~2.5 soniya)
 */

/** Mikrofon tili kodidan ("uz-UZ") til nomini oladi */
export function languageNameFromCode(code: string): string {
  if (code.startsWith("uz")) return "Uzbek";
  if (code.startsWith("ru")) return "Russian";
  return "English";
}
