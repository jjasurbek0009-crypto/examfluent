/**
 * Ildiz (root) layout — barcha sahifalar shu ichida ochiladi.
 * Bu yerda til konteksti va sahifa metadata'si o'rnatiladi.
 */

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/provider";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "ExamFluent — Ingliz tilini AI bilan o'rganing",
    template: "%s · ExamFluent",
  },
  description:
    "CEFR darajangizni aniqlang, AI suhbatdosh bilan mashq qiling va IELTS band ballingizni real baholashda kuzating.",
  openGraph: {
    title: "ExamFluent",
    description: "Speak with confidence. Test with results.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#1a34d9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Tilni cookie'dan serverda o'qiymiz — shunda sahifa TO'G'RI tilda
  // yuklanadi va "avval o'zbekcha chiqib, keyin ruschaga o'zgarish" bo'lmaydi.
  const locale = getLocale();

  return (
    <html lang={locale}>
      <body>
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
