import type { Metadata } from "next";
import { ChatView } from "@/components/chat/ChatView";
import { loadChat } from "./loadChat";

export const metadata: Metadata = { title: "AI Tutor" };
export const dynamic = "force-dynamic";

/** Yangi suhbat sahifasi */
export default async function ChatPage() {
  const data = await loadChat();

  return (
    <ChatView
      level={data.level}
      sessions={data.sessions}
      activeSessionId={null}
      initialMessages={[]}
      initialScenario={data.scenario}
    />
  );
}
