"use client";

/**
 * Ilova karkasi — kirgan foydalanuvchi ko'radigan doimiy ramka.
 *
 * Kompyuterda: chapda yon menyu (sidebar).
 * Telefonda:   pastda menyu paneli (bottom bar) — barmoq bilan qulay.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Mic,
  Settings,
  Target,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { Profile } from "@/lib/types";

interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: typeof LayoutDashboard;
}

const NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/chat", labelKey: "nav.chat", icon: MessageSquareText },
  { href: "/practice", labelKey: "nav.practice", icon: Target },
  { href: "/vocab", labelKey: "nav.vocab", icon: BookOpen },
  { href: "/pronunciation", labelKey: "nav.pronunciation", icon: Mic },
];

/** Telefonda pastda faqat 4 ta eng muhim bo'lim ko'rsatiladi */
const MOBILE_NAV = NAV.slice(0, 4);

export function AppShell({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const displayName = profile?.full_name || profile?.email?.split("@")[0] || "—";

  return (
    <div className="min-h-screen bg-ink-50">
      {/* =============== YON MENYU (kompyuter) =============== */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r
                   border-ink-200 bg-white lg:flex"
      >
        <div className="px-5 py-5">
          <Logo href="/dashboard" size="sm" />
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ href, labelKey, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                          transition-colors ${
                            isActive(href)
                              ? "bg-brand-50 text-brand-800"
                              : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                          }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              {t(labelKey)}
            </Link>
          ))}
        </nav>

        <div className="border-t border-ink-200 p-3">
          <ProfileBlock profile={profile} displayName={displayName} />
        </div>
      </aside>

      {/* =============== YUQORI PANEL (telefon) =============== */}
      <header
        className="sticky top-0 z-20 flex h-14 items-center justify-between border-b
                   border-ink-200 bg-white/90 px-4 backdrop-blur lg:hidden"
      >
        <Logo href="/dashboard" size="sm" />
        <div className="flex items-center gap-2">
          {profile?.cefr_level && <LevelBadge level={profile.cefr_level} size="sm" />}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="btn-ghost -mr-2 px-2"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </header>

      {/* =============== CHIQUVCHI MENYU (telefon) =============== */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col bg-white shadow-lift">
            <div className="flex items-center justify-between px-5 py-4">
              <Logo href={null} size="sm" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="btn-ghost px-2"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-3">
              {[...NAV, { href: "/settings", labelKey: "nav.settings" as TranslationKey, icon: Settings }].map(
                ({ href, labelKey, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                      isActive(href)
                        ? "bg-brand-50 text-brand-800"
                        : "text-ink-600 hover:bg-ink-50"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                    {t(labelKey)}
                  </Link>
                ),
              )}
            </nav>

            <div className="space-y-3 border-t border-ink-200 p-4">
              <LanguageSwitcher />
              <SignOutButton label={t("nav.logout")} />
            </div>
          </div>
        </div>
      )}

      {/* =============== ASOSIY QISM =============== */}
      <main className="pb-20 lg:pb-0 lg:pl-60">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>

      {/* =============== PASTKI MENYU (telefon) =============== */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-ink-200
                   bg-white/95 backdrop-blur lg:hidden"
      >
        {MOBILE_NAV.map(({ href, labelKey, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
              isActive(href) ? "text-brand-700" : "text-ink-500"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {t(labelKey)}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function ProfileBlock({
  profile,
  displayName,
}: {
  profile: Profile | null;
  displayName: string;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <Link
        href="/settings"
        className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-ink-50"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                     bg-brand-700 text-sm font-bold text-white"
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900">{displayName}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <LevelBadge level={profile?.cefr_level} size="sm" />
            {(profile?.streak_count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-orange-600">
                <Flame className="h-3 w-3" aria-hidden />
                {profile?.streak_count}
              </span>
            )}
          </div>
        </div>
      </Link>

      <LanguageSwitcher compact />
      <SignOutButton label={t("nav.logout")} />
    </div>
  );
}

function SignOutButton({ label }: { label: string }) {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm
                   font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
      >
        <LogOut className="h-[18px] w-[18px]" aria-hidden />
        {label}
      </button>
    </form>
  );
}
