/**
 * Auth sahifalari uchun umumiy layout (login + signup).
 *
 * "(auth)" qavs ichidagi papka nomi URL'ga TA'SIR QILMAYDI.
 * Ya'ni sahifa manzili /login bo'lib qolaveradi, lekin ikkala sahifa
 * bitta dizaynni baham ko'radi. Bu Next.js'ning "route group" imkoniyati.
 */

import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <LanguageSwitcher compact />
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-4 sm:items-center sm:pt-0">
        <div className="w-full max-w-md animate-fade-up">
          <div className="card p-7 sm:p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
