import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { getSessionUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { t } = getT();
  const { profile } = await getSessionUser();
  const p = profile as Profile | null;

  // Profil topilmasa (juda kam holat) — qaytadan kirishga yuboramiz
  if (!p) redirect("/login");

  return (
    <div className="mx-auto max-w-xl animate-fade-up">
      <h1 className="mb-5 text-2xl font-bold tracking-tight text-ink-900">
        {t("settings.title")}
      </h1>

      <SettingsForm profile={p} />
    </div>
  );
}
