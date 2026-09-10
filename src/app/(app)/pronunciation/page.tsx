import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PronunciationTrainer } from "@/components/pronunciation/PronunciationTrainer";
import { getSessionUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import type { CefrLevel } from "@/lib/cefr";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Pronunciation" };
export const dynamic = "force-dynamic";

export default async function PronunciationPage() {
  const { t } = getT();
  const { profile } = await getSessionUser();
  const p = profile as Profile | null;

  if (!p?.placement_done) redirect("/placement");

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <h1 className="mb-5 text-2xl font-bold tracking-tight text-ink-900">
        {t("pron.title")}
      </h1>

      <PronunciationTrainer level={p.cefr_level as CefrLevel} />
    </div>
  );
}
