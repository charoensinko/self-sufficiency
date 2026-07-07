"use client";

import type { ChatTask } from "./types";

export type StreamHandlers = {
  onMeta: (meta: { conversationId: string; model: string }) => void;
  onDelta: (text: string) => void;
  onError: (message: string) => void;
};

export type SendMessageInput = {
  conversationId: string | null;
  message: string;
  images: string[];
  deep: boolean;
  task: ChatTask;
  modelOverride: string | null;
};

/** ยิงข้อความไป /api/ai/chat แล้ว stream คำตอบกลับทีละส่วน (NDJSON) */
export async function streamChat(
  input: SendMessageInput,
  handlers: StreamHandlers
): Promise<void> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok || !res.body) {
    let message = "ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
    try {
      const data = await res.json();
      if (typeof data.error === "string") message = data.error;
    } catch {
      // ใช้ข้อความ default
    }
    handlers.onError(message);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        if (event.type === "meta") {
          handlers.onMeta({
            conversationId: event.conversationId,
            model: event.model,
          });
        } else if (event.type === "delta") {
          handlers.onDelta(event.text);
        } else if (event.type === "error") {
          handlers.onError(event.message);
        }
      } catch {
        // ข้ามบรรทัดที่ parse ไม่ได้
      }
    }
  }
}

/** แปลงไฟล์รูปเป็น data URL (บีบอัดแล้ว) สำหรับส่งให้ vision model */
export async function fileToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
