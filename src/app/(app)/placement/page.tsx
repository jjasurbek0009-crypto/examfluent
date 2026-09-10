import type { Metadata } from "next";
import { PlacementTest } from "@/components/placement/PlacementTest";
import { getSessionUser } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Placement test" };
export const dynamic = "force-dynamic";

export default async function PlacementPage() {
  const { profile } = await getSessionUser();
  const p = profile as Profile | null;

  return <PlacementTest alreadyDone={Boolean(p?.placement_done)} />;
}
