"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  History,
  ImagePlus,
  Send,
  Settings,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AI_MODEL_KEY, AI_PREFILL_KEY } from "@/lib/constants";
import { formatDateThai } from "@/lib/format";
import { compressImage } from "@/lib/image";
import { deleteConversation, fetchConversations, fetchMessages } from "../queries";
import { fileToDataUrl, streamChat } from "../use-chat-stream";
import { AUTO_MODEL, type ChatTask, type Conversation } from "../types";

type BubbleMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageCount?: number;
};

type PendingImage = { dataUrl: string };

const SUGGESTIONS = [
  "ที่ดินแปลงไหนน่าซื้อที่สุดตอนนี้ เพราะอะไร",
  "งบตอนนี้ใช้ไปเท่าไหร่แล้ว เหลือพอไหม",
  "ก่อนวางมัดจำที่ดิน ต้องตรวจอะไรบ้าง",
];

export function ChatScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<BubbleMessage[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [deep, setDeep] = useState(false);
  const [sending, setSending] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const prefillHandled = useRef(false);

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await fetchConversations());
    } catch {
      // เงียบไว้ — รายการประวัติไม่ใช่ทางหลัก
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const send = useCallback(
    async (text: string, images: PendingImage[], task: ChatTask) => {
      const trimmed = text.trim();
      if ((!trimmed && images.length === 0) || sending) return;

      setSending(true);
      setInput("");
      setPendingImages([]);
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          role: "user",
          content: trimmed || "(ส่งรูปภาพ)",
          imageCount: images.length || undefined,
        },
      ]);
      setStreamingText("");

      let acc = "";
      let failed = false;
      await streamChat(
        {
          conversationId: activeId,
          message: trimmed,
          images: images.map((img) => img.dataUrl),
          deep,
          task,
          modelOverride:
            typeof window !== "undefined"
              ? (() => {
                  const stored = localStorage.getItem(AI_MODEL_KEY);
                  return stored && stored !== AUTO_MODEL ? stored : null;
                })()
              : null,
        },
        {
          onMeta: (meta) => {
            if (!activeId) {
              setActiveId(meta.conversationId);
              void loadConversations();
            }
          },
          onDelta: (delta) => {
            acc += delta;
            setStreamingText(acc);
          },
          onError: (message) => {
            failed = true;
            toast.error(message);
          },
        }
      );

      setStreamingText(null);
      if (acc) {
        setMessages((prev) => [
          ...prev,
          { id: `local-${Date.now()}-a`, role: "assistant", content: acc },
        ]);
      } else if (!failed) {
        toast.error("ไม่ได้รับคำตอบ กรุณาลองใหม่อีกครั้ง");
      }
      setSending(false);
    },
    [activeId, deep, loadConversations, sending]
  );

  // รับ prompt จากหน้าอื่น (เปรียบเทียบแปลง/แดชบอร์ด) → เริ่มบทสนทนาใหม่และส่งทันที
  useEffect(() => {
    if (prefillHandled.current) return;
    prefillHandled.current = true;
    const raw = sessionStorage.getItem(AI_PREFILL_KEY);
    if (!raw) return;
    sessionStorage.removeItem(AI_PREFILL_KEY);

    let message = raw;
    let task: ChatTask = "chat";
    try {
      const parsed = JSON.parse(raw) as { message?: string; task?: string };
      if (parsed.message) {
        message = parsed.message;
        task = parsed.task === "compare" ? "compare" : "chat";
      }
    } catch {
      // ค่าเก่าเป็นข้อความล้วน — ใช้ตรงๆ
    }

    setActiveId(null);
    setMessages([]);
    if (task === "compare") setDeep(true);
    void send(message, [], task);
  }, [send]);

  async function openConversation(conversation: Conversation) {
    setHistoryOpen(false);
    setActiveId(conversation.id);
    setMessages([]);
    try {
      const rows = await fetchMessages(conversation.id);
      setMessages(
        rows
          .filter((m) => m.role !== "system")
          .map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
      );
    } catch {
      toast.error("โหลดบทสนทนาไม่สำเร็จ");
    }
  }

  function newConversation() {
    setActiveId(null);
    setMessages([]);
    setHistoryOpen(false);
  }

  async function removeConversation(id: string) {
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) newConversation();
      toast.success("ลบบทสนทนาแล้ว");
    } catch {
      toast.error("ลบไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  async function attachImages(files: FileList | null) {
    if (!files) return;
    const room = 3 - pendingImages.length;
    const selected = Array.from(files).slice(0, room);
    if (selected.length < files.length) {
      toast.info("แนบรูปได้สูงสุด 3 รูปต่อข้อความ");
    }
    for (const file of selected) {
      const compressed = await compressImage(file, 1024);
      const dataUrl = await fileToDataUrl(compressed);
      setPendingImages((prev) => [...prev, { dataUrl }]);
    }
  }

  const activeTitle =
    conversations.find((c) => c.id === activeId)?.title ?? "บทสนทนาใหม่";

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold">AI ที่ปรึกษา</h1>
          <p className="truncate text-sm text-muted-foreground">
            {activeTitle}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="ประวัติบทสนทนา"
          onClick={() => setHistoryOpen(true)}
        >
          <History aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="เริ่มบทสนทนาใหม่"
          onClick={newConversation}
        >
          <SquarePen aria-hidden />
        </Button>
        <Button asChild variant="ghost" size="icon" aria-label="ตั้งค่า">
          <Link href="/settings">
            <Settings aria-hidden />
          </Link>
        </Button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && streamingText === null && (
          <div className="space-y-3 py-8 text-center">
            <p className="text-muted-foreground">
              สวัสดีครับ ผมคือผู้ช่วยวางแผนเกษียณของคุณ
              <br />
              ถามได้ทุกเรื่อง — ผมเห็นข้อมูลแปลงที่ดินและงบของคุณอยู่แล้ว
            </p>
            <div className="space-y-2">
              {SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  className="h-auto w-full whitespace-normal py-3 text-left"
                  onClick={() => void send(suggestion, [], "chat")}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5",
                message.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-muted"
              )}
            >
              {message.imageCount ? (
                <p className="mb-1 text-sm opacity-80">
                  📷 แนบรูป {message.imageCount} รูป
                </p>
              ) : null}
              {message.content}
            </div>
          </div>
        ))}

        {streamingText !== null && (
          <div className="flex justify-start">
            <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-muted px-4 py-2.5">
              {streamingText || (
                <span className="animate-pulse text-muted-foreground">
                  กำลังคิด...
                </span>
              )}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-2 border-t bg-background px-4 py-3">
        {pendingImages.length > 0 && (
          <div className="flex gap-2">
            {pendingImages.map((image, index) => (
              <div key={index} className="relative size-16">
                <Image
                  src={image.dataUrl}
                  alt={`รูปแนบ ${index + 1}`}
                  fill
                  unoptimized
                  className="rounded-lg object-cover"
                />
                <button
                  type="button"
                  aria-label="เอารูปออก"
                  onClick={() =>
                    setPendingImages((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-black/70 p-1 text-white"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="แนบรูป">
            <label className="cursor-pointer">
              <ImagePlus aria-hidden />
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  void attachImages(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์คำถามที่นี่..."
            rows={1}
            className="max-h-32 min-h-12 flex-1 resize-none text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input, pendingImages, "chat");
              }
            }}
          />
          <Button
            size="icon"
            aria-label="ส่งข้อความ"
            disabled={sending || (!input.trim() && pendingImages.length === 0)}
            onClick={() => void send(input, pendingImages, "chat")}
          >
            <Send aria-hidden />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Switch id="deep-mode" checked={deep} onCheckedChange={setDeep} />
          <Label htmlFor="deep-mode" className="text-sm text-muted-foreground">
            วิเคราะห์ลึก (ช้ากว่าแต่ละเอียดกว่า)
          </Label>
        </div>
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[80dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ประวัติบทสนทนา</DialogTitle>
          </DialogHeader>
          {conversations.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              ยังไม่มีบทสนทนา
            </p>
          ) : (
            <ul className="divide-y">
              {conversations.map((conversation) => (
                <li
                  key={conversation.id}
                  className="flex items-center gap-2 py-1"
                >
                  <button
                    type="button"
                    onClick={() => void openConversation(conversation)}
                    className="min-w-0 flex-1 rounded-lg px-2 py-2.5 text-left hover:bg-muted"
                  >
                    <span className="line-clamp-1 font-medium">
                      {conversation.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDateThai(conversation.updated_at)}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`ลบบทสนทนา ${conversation.title}`}
                    className="text-destructive hover:text-destructive"
                    onClick={() => void removeConversation(conversation.id)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
