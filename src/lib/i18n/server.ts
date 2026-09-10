/**
 * Server tomonida joriy tilni aniqlash.
 * Server Component'lar shu funksiyadan foydalanadi.
 */

import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  normalizeLocale,
  translate,
  type Locale,
  type TranslationKey,
} from "./dictionaries";

export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return value ? normalizeLocale(value) : DEFAULT_LOCALE;
}

/** Server Component ichida tarjima olish uchun */
export function getT() {
  const locale = getLocale();
  return {
    locale,
    t: (key: TranslationKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
  };
}
