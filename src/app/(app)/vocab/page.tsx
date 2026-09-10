import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { FlashcardDeck } from "@/components/vocab/FlashcardDeck";
import { getSessionUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { MASTERED_INTERVAL_DAYS } from "@/lib/vocab/sm2";
import type { Profile, VocabCard } from "@/lib/types";

export const metadata: Metadata = { title: "Vocabulary" };
export const dynamic = "force-dynamic";

/** Bir sessiyada ko'rsatiladigan maksimal kartochka soni */
const SESSION_LIMIT = 20;

export default async function VocabPage() {
  const { t } = getT();
  const { profile, supabase } = await getSessionUser();
  const p = profile as Profile | null;

  if (!p?.placement_done) redirect("/placement");

  const today = new Date().toISOString().slice(0, 10);

  // Uchala so'rovni parallel bajaramiz
  const [dueRes, totalRes, masteredRes] = await Promise.all([
    supabase
      .from("vocab_cards")
      .select("*")
      .lte("due_date", today)
      .order("due_date", { ascending: true })
      .limit(SESSION_LIMIT),
    supabase.from("vocab_cards").select("id", { count: "exact", head: true }),
    supabase
      .from("vocab_cards")
      .select("id", { count: "exact", head: true })
      .gte("interval_days", MASTERED_INTERVAL_DAYS),
  ]);

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <h1 className="mb-5 text-2xl font-bold tracking-tight text-ink-900">
        {t("vocab.title")}
      </h1>

      <FlashcardDeck
        initialCards={(dueRes.data ?? []) as VocabCard[]}
        totalCards={totalRes.count ?? 0}
        masteredCards={masteredRes.count ?? 0}
      />
    </div>
  );
}
