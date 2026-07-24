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

export type ChatTask =
  | "chat"
  | "compare"
  | "weekly_summary"
  | "budget_check"
  | "next_tasks";

/** ปุ่มลัดงานวิเคราะห์ (Dev Phase 2) — server เลือก Sonnet ให้อัตโนมัติ */
export const QUICK_TASKS: { task: ChatTask; label: string; message: string }[] =
  [
    {
      task: "weekly_summary",
      label: "📋 สรุปความก้าวหน้าช่วงนี้",
      message: "ช่วยสรุปความก้าวหน้าช่วงที่ผ่านมาให้หน่อย",
    },
    {
      task: "budget_check",
      label: "💰 ตรวจงบ เสี่ยงบานปลายไหม",
      message: "ช่วยตรวจงบประมาณให้หน่อย มีหมวดไหนเสี่ยงบานปลายไหม",
    },
    {
      task: "next_tasks",
      label: "🔨 งานถัดไปควรทำอะไร",
      message: "งานถัดไปที่ควรทำคืออะไร ช่วยเรียงลำดับให้หน่อย",
    },
  ];

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
