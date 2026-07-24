import type { Metadata } from "next";
import { ChatScreen } from "@/features/ai/components/chat-screen";

export const metadata: Metadata = {
  title: "AI ที่ปรึกษา",
};

export default function AiPage() {
  return (
    <main className="mx-auto h-[calc(100dvh-5rem)] max-w-lg lg:h-dvh lg:max-w-3xl">
      <ChatScreen />
    </main>
  );
}
