import type { Metadata } from "next";
import { ChatView } from "@/components/chat/ChatView";
import { loadChat } from "../loadChat";

export const metadata: Metadata = { title: "AI Tutor" };
export const dynamic = "force-dynamic";

/** Mavjud suhbatni davom ettirish sahifasi */
export default async function ChatSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const data = await loadChat(params.sessionId);

  return (
    <ChatView
      level={data.level}
      sessions={data.sessions}
      activeSessionId={data.activeSessionId}
      initialMessages={data.messages}
      initialScenario={data.scenario}
    />
  );
}
