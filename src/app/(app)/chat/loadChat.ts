/**
 * /chat va /chat/[sessionId] sahifalari uchun umumiy ma'lumot yuklovchi.
 * Ikkala sahifa bir xil narsani yuklaydi — takrorlamaslik uchun shu yerda.
 */

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { isCefrLevel, type CefrLevel } from "@/lib/cefr";
import { isScenario, type Scenario } from "@/lib/prompts/chat";
import type { ChatMessage, ChatSession, Profile } from "@/lib/types";

export interface ChatPageData {
  level: CefrLevel;
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  scenario: Scenario;
}

export async function loadChat(sessionId?: string): Promise<ChatPageData> {
  const { profile, supabase } = await getSessionUser();
  const p = profile as Profile | null;

  // Daraja bilinmasa suhbat ham darajaga moslanmaydi — avval testga yuboramiz
  if (!p?.placement_done) redirect("/placement");

  const level: CefrLevel = isCefrLevel(p.cefr_level) ? p.cefr_level : "B1";

  const { data: sessionRows } = await supabase
    .from("chat_sessions")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(30);

  const sessions = (sessionRows ?? []) as ChatSession[];

  // Sessiya berilmagan bo'lsa — yangi suhbat (xabarlar bo'sh)
  if (!sessionId) {
    return { level, sessions, activeSessionId: null, messages: [], scenario: "free_talk" };
  }

  const active = sessions.find((s) => s.id === sessionId);
  // Boshqa odamning yoki o'chirilgan suhbatiga kirmoqchi bo'lsa
  if (!active) redirect("/chat");

  const { data: messageRows } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(100);

  return {
    level,
    sessions,
    activeSessionId: sessionId,
    messages: (messageRows ?? []) as ChatMessage[],
    scenario: isScenario(active.scenario) ? active.scenario : "free_talk",
  };
}
