export type Conversation = {
  id: string;
  household_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  image_paths: string[] | null;
  model: string | null;
  created_at: string;
};

export type ChatTask = "chat" | "compare";

/** model อัตโนมัติตาม Task Router ฝั่ง server */
export const AUTO_MODEL = "auto";

export const MODEL_OPTIONS = [
  {
    value: AUTO_MODEL,
    label: "อัตโนมัติ (แนะนำ)",
    description: "ระบบเลือกให้ตามลักษณะคำถาม",
  },
  {
    value: "anthropic/claude-haiku-4.5",
    label: "Claude Haiku 4.5",
    description: "เร็วและประหยัด — คุยทั่วไป (~$1/$5 ต่อล้านโทเคน)",
  },
  {
    value: "anthropic/claude-sonnet-4.5",
    label: "Claude Sonnet 4.5",
    description: "วิเคราะห์ลึก ละเอียดกว่า (~$3/$15 ต่อล้านโทเคน)",
  },
  {
    value: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    description: "อ่านรูปภาพเก่ง ประหยัด (~$0.3/$2.5 ต่อล้านโทเคน)",
  },
] as const;

export type MonthlyUsage = {
  totalCostUsd: number;
  promptTokens: number;
  completionTokens: number;
  calls: number;
};
