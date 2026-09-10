/**
 * Kirgan foydalanuvchi sahifalari uchun layout.
 *
 * Bu yerda profil BIR MARTA yuklanadi va AppShell'ga beriladi —
 * shunda har bir sahifa alohida so'rov yubormaydi (tezlik uchun).
 */

import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getSessionUser } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getSessionUser();

  // Middleware allaqachon tekshiradi, lekin bu ikkinchi himoya qatlami.
  if (!user) redirect("/login");

  return <AppShell profile={profile as Profile | null}>{children}</AppShell>;
}
