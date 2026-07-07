import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, Conversation, MonthlyUsage } from "./types";

export async function fetchConversations(): Promise<Conversation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data as Conversation[];
}

export async function fetchMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at");
  if (error) throw error;
  return data as ChatMessage[];
}

export async function deleteConversation(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/** สรุปการใช้งาน AI เดือนปัจจุบัน */
export async function fetchMonthlyUsage(): Promise<MonthlyUsage> {
  const supabase = createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data, error } = await supabase
    .from("ai_usage_log")
    .select("prompt_tokens, completion_tokens, cost_usd")
    .gte("created_at", monthStart.toISOString());
  if (error) throw error;

  return (data ?? []).reduce<MonthlyUsage>(
    (acc, row) => ({
      totalCostUsd: acc.totalCostUsd + Number(row.cost_usd),
      promptTokens: acc.promptTokens + Number(row.prompt_tokens),
      completionTokens: acc.completionTokens + Number(row.completion_tokens),
      calls: acc.calls + 1,
    }),
    { totalCostUsd: 0, promptTokens: 0, completionTokens: 0, calls: 0 }
  );
}
