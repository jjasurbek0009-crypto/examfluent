import type { Metadata } from "next";
import { VoiceDiagnostics } from "@/components/voice/VoiceDiagnostics";

export const metadata: Metadata = { title: "Ovoz diagnostikasi" };

/**
 * OVOZ DIAGNOSTIKA SAHIFASI — /voice-test
 *
 * Ovoz ishlamaganda sabab qayerdaligini aniqlash uchun. Bu sahifa
 * kirish talab qilmaydi, chunki u faqat brauzer imkoniyatlarini
 * tekshiradi — hech qanday shaxsiy ma'lumot ko'rsatmaydi.
 */
export default function VoiceTestPage() {
  return (
    <div className="min-h-screen bg-ink-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <VoiceDiagnostics />
      </div>
    </div>
  );
}
