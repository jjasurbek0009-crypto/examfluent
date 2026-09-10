import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { PracticeRunner } from "@/components/practice/PracticeRunner";
import { getSessionUser } from "@/lib/supabase/server";
import { isPracticeSkill } from "@/lib/prompts/practice";
import type { CefrLevel } from "@/lib/cefr";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { skill: string } }): Metadata {
  const name = params.skill.charAt(0).toUpperCase() + params.skill.slice(1);
  return { title: `${name} practice` };
}

export default async function PracticeSkillPage({ params }: { params: { skill: string } }) {
  // Noma'lum manzil (/practice/xyz) — 404 sahifasi
  if (!isPracticeSkill(params.skill)) notFound();

  const { profile } = await getSessionUser();
  const p = profile as Profile | null;

  if (!p?.placement_done) redirect("/placement");

  return <PracticeRunner skill={params.skill} level={p.cefr_level as CefrLevel} />;
}
