"use client";

import { Globe } from "lucide-react";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/provider";

/** Til almashtirgich — o'zbek, rus va ingliz tillari */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const visible: Locale[] = [...LOCALES];

  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-ink-100 p-1">
      {!compact && <Globe className="ml-1.5 h-4 w-4 text-ink-500" aria-hidden />}
      {visible.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
            locale === code
              ? "bg-white text-ink-900 shadow-sm"
              : "text-ink-500 hover:text-ink-800"
          }`}
        >
          {compact ? code.toUpperCase() : LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
