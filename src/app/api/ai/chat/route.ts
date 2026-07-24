import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { splitDueTasks } from "@/features/project/types";
import { computeStats, deedAreaSqm, sqmToRai } from "@/features/layout/types";
import type { LayoutElement } from "@/features/layout/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL_HAIKU = "anthropic/claude-haiku-4.5";
const MODEL_SONNET = "anthropic/claude-sonnet-4.5";
const MODEL_GEMINI = "google/gemini-2.5-flash";
const ALLOWED_MODELS = new Set([MODEL_HAIKU, MODEL_SONNET, MODEL_GEMINI]);

// งานวิเคราะห์ (นอกจาก chat) ใช้ Sonnet เพราะต้องสังเคราะห์ข้อมูลหลายส่วน
const ALLOWED_TASKS = new Set([
  "chat",
  "compare",
  "weekly_summary",
  "budget_check",
  "next_tasks",
]);

const MAX_HISTORY = 20;
const MAX_IMAGES = 3;

type ChatRequestBody = {
  conversationId?: string | null;
  message?: string;
  /** data URL (base64) ของรูปที่แนบ */
  images?: string[];
  /** ผู้ใช้เปิดโหมด "วิเคราะห์ลึก" */
  deep?: boolean;
  task?: string;
  modelOverride?: string | null;
};

function pickModel(input: {
  modelOverride: string | null;
  hasImages: boolean;
  deep: boolean;
  task: string;
}): string {
  if (input.modelOverride && ALLOWED_MODELS.has(input.modelOverride)) {
    return input.modelOverride;
  }
  if (input.hasImages) return MODEL_GEMINI;
  if (input.deep || input.task !== "chat") return MODEL_SONNET;
  return MODEL_HAIKU;
}

/** สรุปข้อมูลจริงจาก DB แบบกระชับสำหรับ system prompt — ดึงเฉพาะ field จำเป็น */
async function buildContext(supabase: SupabaseClient): Promise<string> {
  const [
    householdRes,
    landsRes,
    categoriesRes,
    expensesRes,
    templateCountRes,
    checkedRes,
    phasesRes,
    projectTasksRes,
    journalRes,
    plantingsRes,
    layoutsRes,
  ] = await Promise.all([
    supabase.from("households").select("total_budget").single(),
    supabase
      .from("land_candidates")
      .select(
        "id, name, province, district, status, price_total, price_per_rai, area_rai, area_ngan, area_wa, deed_type, notes, land_scores(total_score, water_source, soil_quality, flood_risk, road_access, electricity, hospital_distance, community, price_value)"
      )
      .order("created_at")
      .limit(20),
    supabase
      .from("budget_categories")
      .select("id, name, planned_amount")
      .order("sort_order"),
    supabase.from("expenses").select("category_id, amount"),
    supabase
      .from("checklist_templates")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("land_checklist_items")
      .select("land_id")
      .eq("checked", true),
    supabase
      .from("project_phases")
      .select("id, name, sort_order, status, duration_weeks")
      .order("sort_order"),
    supabase
      .from("project_tasks")
      .select("phase_id, title, is_milestone, done, due_date"),
    supabase
      .from("journal_entries")
      .select("entry_date, content")
      .order("entry_date", { ascending: false })
      .limit(5),
    supabase
      .from("plantings")
      .select(
        "zone, quantity, status, planned_date, planted_date, expected_harvest_date, crops(name)"
      )
      .in("status", ["planned", "planted"])
      .limit(15),
    supabase
      .from("farm_layouts")
      .select("name, width_m, height_m, elements, deed_rai, deed_ngan, deed_wa")
      .limit(5),
  ]);

  const lines: string[] = [];
  const statusLabel: Record<string, string> = {
    interested: "สนใจ",
    visited: "ไปดูมาแล้ว",
    negotiating: "กำลังต่อรอง",
    rejected: "ตัดออก",
    purchased: "ซื้อแล้ว",
  };

  // --- แปลงที่ดิน ---
  const checklistTotal = templateCountRes.count ?? 0;
  const checkedByLand = new Map<string, number>();
  for (const row of checkedRes.data ?? []) {
    const id = row.land_id as string;
    checkedByLand.set(id, (checkedByLand.get(id) ?? 0) + 1);
  }

  const lands = landsRes.data ?? [];
  if (lands.length === 0) {
    lines.push("## แปลงที่ดิน: ยังไม่มีในระบบ");
  } else {
    lines.push(`## แปลงที่ดินในระบบ (${lands.length} แปลง)`);
    for (const land of lands) {
      const scoreRaw = land.land_scores;
      const score = Array.isArray(scoreRaw) ? scoreRaw[0] : scoreRaw;
      const area =
        land.area_rai + land.area_ngan / 4 + land.area_wa / 400;
      const parts = [
        `- ${land.name} | ${[land.district, land.province].filter(Boolean).join(" ") || "ไม่ระบุที่ตั้ง"}`,
        `สถานะ: ${statusLabel[land.status as string] ?? land.status}`,
        `เนื้อที่ ${area.toFixed(2)} ไร่`,
        land.price_total != null
          ? `ราคา ${Number(land.price_total).toLocaleString("th-TH")} บาท (${Math.round(Number(land.price_per_rai ?? 0)).toLocaleString("th-TH")}/ไร่)`
          : "ยังไม่ระบุราคา",
        `เอกสาร: ${land.deed_type ?? "ไม่ระบุ"}`,
      ];
      if (score) {
        parts.push(
          `คะแนนรวม ${score.total_score}/100 (น้ำ ${score.water_source}, ดิน ${score.soil_quality}, ปลอดภัยน้ำท่วม ${score.flood_risk}, ถนน ${score.road_access}, ไฟฟ้า ${score.electricity}, รพ. ${score.hospital_distance}, ชุมชน ${score.community}, คุ้มราคา ${score.price_value})`
        );
      } else {
        parts.push("ยังไม่ให้คะแนน");
      }
      parts.push(
        `checklist ${checkedByLand.get(land.id as string) ?? 0}/${checklistTotal} ข้อ`
      );
      if (land.notes) {
        parts.push(`โน้ต: ${String(land.notes).slice(0, 200)}`);
      }
      lines.push(parts.join(" | "));
    }
  }

  // --- งบประมาณ ---
  const spentByCategory = new Map<string, number>();
  let totalSpent = 0;
  for (const expense of expensesRes.data ?? []) {
    const amount = Number(expense.amount);
    totalSpent += amount;
    spentByCategory.set(
      expense.category_id as string,
      (spentByCategory.get(expense.category_id as string) ?? 0) + amount
    );
  }
  const totalBudget = Number(householdRes.data?.total_budget ?? 0);
  lines.push("");
  lines.push(
    `## งบประมาณ: วงเงินรวม ${totalBudget.toLocaleString("th-TH")} บาท ใช้ไปแล้ว ${totalSpent.toLocaleString("th-TH")} บาท คงเหลือ ${(totalBudget - totalSpent).toLocaleString("th-TH")} บาท`
  );
  for (const category of categoriesRes.data ?? []) {
    const spent = spentByCategory.get(category.id as string) ?? 0;
    lines.push(
      `- ${category.name}: แผน ${Number(category.planned_amount).toLocaleString("th-TH")} ใช้ไป ${spent.toLocaleString("th-TH")} บาท`
    );
  }

  // --- โครงการ (แผนแม่บท 10 เฟส) ---
  const phases = phasesRes.data ?? [];
  const projectTasks = (projectTasksRes.data ?? []) as {
    phase_id: string;
    title: string;
    is_milestone: boolean;
    done: boolean;
    due_date: string | null;
  }[];
  if (phases.length > 0) {
    const statusText: Record<string, string> = {
      not_started: "ยังไม่เริ่ม",
      in_progress: "กำลังทำ",
      done: "เสร็จแล้ว",
    };
    const current =
      phases.find((p) => p.status === "in_progress") ??
      phases.find((p) => p.status === "not_started");
    lines.push("");
    lines.push(
      `## โครงการแผนแม่บท 10 เฟส (สถานะจริง: ยังไม่ได้ซื้อที่ดิน — เตรียมแผนล่วงหน้า)` +
        (current
          ? ` | เฟสปัจจุบัน/ถัดไป: เฟส ${current.sort_order} ${current.name}`
          : "")
    );
    for (const phase of phases) {
      const phaseTasks = projectTasks.filter((t) => t.phase_id === phase.id);
      const done = phaseTasks.filter((t) => t.done).length;
      lines.push(
        `- เฟส ${phase.sort_order} ${phase.name}: ${statusText[phase.status as string] ?? phase.status} (งาน ${done}/${phaseTasks.length}, ~${phase.duration_weeks ?? "?"} สัปดาห์)`
      );
    }
    const { overdue, dueSoon } = splitDueTasks(projectTasks);
    for (const task of overdue.slice(0, 5)) {
      lines.push(`- [เลยกำหนด] ${task.title} (กำหนด ${task.due_date})`);
    }
    for (const task of dueSoon.slice(0, 5)) {
      lines.push(`- [ใกล้ถึงกำหนด] ${task.title} (กำหนด ${task.due_date})`);
    }
  }

  // --- บันทึกประจำวันล่าสุด ---
  const journal = journalRes.data ?? [];
  if (journal.length > 0) {
    lines.push("");
    lines.push(`## บันทึกประจำวันล่าสุด (${journal.length} รายการ)`);
    for (const entry of journal) {
      const content = String(entry.content).replace(/\s+/g, " ");
      lines.push(
        `- ${entry.entry_date}: ${content.length > 160 ? `${content.slice(0, 160)}…` : content}`
      );
    }
  }

  // --- แผนปลูก ---
  const plantings = plantingsRes.data ?? [];
  if (plantings.length > 0) {
    lines.push("");
    lines.push(`## แผนปลูกที่ยังไม่จบ (${plantings.length} รายการ)`);
    for (const planting of plantings) {
      const cropRaw = planting.crops as { name: string } | { name: string }[] | null;
      const cropName = Array.isArray(cropRaw) ? cropRaw[0]?.name : cropRaw?.name;
      const parts = [
        `- ${cropName ?? "พืช"}${planting.quantity ? ` ${planting.quantity}` : ""}`,
        planting.status === "planted"
          ? `ปลูกแล้ว ${planting.planted_date ?? ""}`
          : `วางแผนปลูก ${planting.planned_date ?? "ยังไม่กำหนดวัน"}`,
      ];
      if (planting.zone) parts.push(`ที่ ${planting.zone}`);
      if (planting.expected_harvest_date)
        parts.push(`คาดเก็บเกี่ยว ${planting.expected_harvest_date}`);
      lines.push(parts.join(" | "));
    }
  }

  // --- ผังแปลง (คำนวณสัดส่วนจาก elements ด้วยสูตรเดียวกับหน้าเว็บ) ---
  const layouts = layoutsRes.data ?? [];
  if (layouts.length > 0) {
    lines.push("");
    lines.push(`## ผังแปลงที่ออกแบบไว้ (เป้าสัดส่วน น้ำ30:นา30:ป่าสวน30:อยู่อาศัย10)`);
    for (const layout of layouts) {
      const stats = computeStats(
        Number(layout.width_m),
        Number(layout.height_m),
        (layout.elements ?? []) as LayoutElement[],
        deedAreaSqm({
          deed_rai: layout.deed_rai != null ? Number(layout.deed_rai) : null,
          deed_ngan: layout.deed_ngan != null ? Number(layout.deed_ngan) : null,
          deed_wa: layout.deed_wa != null ? Number(layout.deed_wa) : null,
        })
      );
      const percents = stats.groups
        .map((g) => `${Math.round(g.percent)}%`)
        .join(":");
      const earthDiff = stats.pondVolume - stats.khokFillVolume;
      lines.push(
        `- ${layout.name}: ${sqmToRai(stats.plotArea).toFixed(1)} ไร่ | สัดส่วนจริง ${percents} | ดินขุดจากสระ ${Math.round(stats.pondVolume).toLocaleString("th-TH")} ลบ.ม. ถมโคกต้องใช้ ${Math.round(stats.khokFillVolume).toLocaleString("th-TH")} ลบ.ม. (${earthDiff >= 0 ? "ดินพอ" : "ดินขาด"})`
      );
    }
  }

  return lines.join("\n");
}

/** คำสั่งเสริมต่อ task วิเคราะห์ — ต่อท้าย system prompt */
const TASK_INSTRUCTIONS: Record<string, string> = {
  weekly_summary: `งานที่ได้รับ: สรุปความก้าวหน้าช่วงที่ผ่านมา
ใช้บันทึกประจำวันล่าสุด + สถานะงานโครงการ ตอบ 3 ส่วนสั้นๆ: (1) ทำอะไรไปแล้ว (2) อะไรค้าง/เลยกำหนด (3) สัปดาห์หน้าควรโฟกัสอะไร`,
  budget_check: `งานที่ได้รับ: ตรวจสอบงบบานปลาย
เทียบรายจ่ายจริงกับแผนรายหมวดและวงเงินรวม ชี้หมวดที่ใช้เกินแผนหรือใช้เร็วผิดปกติเป็นตัวเลขชัดๆ พร้อมข้อเสนอปรับ 1-2 ข้อ ถ้ายังไม่มีความเสี่ยงให้บอกตรงๆ`,
  next_tasks: `งานที่ได้รับ: แนะนำลำดับงานถัดไป
ดูจากเฟสปัจจุบัน งานค้าง กำหนดเสร็จ แผนปลูก และฤดูกาลของไทย เสนองานที่ควรทำ 3-5 อย่างเรียงตามลำดับความสำคัญ พร้อมเหตุผลสั้นๆ ต่อข้อ`,
};

function systemPrompt(context: string, task: string): string {
  const taskInstruction = TASK_INSTRUCTIONS[task]
    ? `\n\n${TASK_INSTRUCTIONS[task]}`
    : "";
  return `คุณคือ "ผู้ช่วยเกษียณสุข" ที่ปรึกษาส่วนตัวของคู่สามีภรรยาวัยเกษียณ (60+)
ที่กำลังวางแผนซื้อที่ดิน 5 ไร่ งบจำกัด เพื่อทำเกษตรทฤษฎีใหม่ / โคก หนอง นา และอยู่อาศัยเองอย่างพอเพียง

บทบาท: ที่ปรึกษาการเลือกซื้อที่ดินเกษตรและวางแผนเกษียณวิถีพอเพียง
เชี่ยวชาญ: เกษตรทฤษฎีใหม่, โคก หนอง นา, บริบทไทย (เอกสารสิทธิ์ โฉนด/น.ส.3ก/ส.ป.ก., น้ำบาดาล, ผังเมือง, ความเสี่ยงน้ำท่วม/รอยเลื่อน/PM2.5)

กติกาการตอบ:
1. ตอบภาษาไทยเสมอ กระชับ ตรงประเด็น ใช้ภาษาเข้าใจง่ายสำหรับผู้สูงวัย หลีกเลี่ยงศัพท์เทคนิค
2. อ้างอิงข้อมูลจริงในระบบ (ด้านล่าง) ก่อนเสมอ — เรียกชื่อแปลง ตัวเลขงบ คะแนน ตามจริง อย่าแต่งข้อมูลขึ้นเอง
3. ชี้ความเสี่ยงตรงไปตรงมา ไม่เกรงใจ เพราะเป็นการตัดสินใจครั้งใหญ่ของชีวิต
4. งบมีจำกัด — แนะนำทางที่ประหยัดและทำได้จริงด้วยแรงคน 2 คนวัยเกษียณ
5. ถ้าข้อมูลในระบบไม่พอตอบ ให้บอกตรงๆ และแนะนำว่าควรไปเก็บข้อมูลอะไรเพิ่ม

# ข้อมูลปัจจุบันในระบบ (อัปเดตล่าสุด ณ ตอนนี้)
${context}${taskInstruction}`;
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่า OPENROUTER_API_KEY บนเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
  }

  const body = (await req.json()) as ChatRequestBody;
  const message = (body.message ?? "").trim();
  const images = (body.images ?? []).slice(0, MAX_IMAGES);
  if (!message && images.length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อความ" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 403 });
  }
  const householdId = profile.household_id as string;

  // --- conversation + ประวัติ (ดึงก่อน insert ข้อความใหม่) ---
  let conversationId = body.conversationId ?? null;
  let history: { role: string; content: string }[] = [];

  if (conversationId) {
    const { data } = await supabase
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(MAX_HISTORY);
    history = (data ?? []).reverse();
    await supabase
      .from("ai_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  } else {
    const title =
      message.length > 40 ? `${message.slice(0, 40)}…` : message || "รูปภาพ";
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ household_id: householdId, title })
      .select("id")
      .single();
    if (error || !data) {
      return NextResponse.json(
        { error: "สร้างบทสนทนาไม่สำเร็จ" },
        { status: 500 }
      );
    }
    conversationId = data.id as string;
  }

  await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: message || "(ส่งรูปภาพ)",
  });

  const task =
    body.task && ALLOWED_TASKS.has(body.task) ? body.task : "chat";
  const model = pickModel({
    modelOverride: body.modelOverride ?? null,
    hasImages: images.length > 0,
    deep: body.deep === true,
    task,
  });

  const context = await buildContext(supabase);

  const userContent: string | ContentPart[] =
    images.length > 0
      ? [
          { type: "text", text: message || "ช่วยวิเคราะห์รูปนี้" },
          ...images.map(
            (url): ContentPart => ({ type: "image_url", image_url: { url } })
          ),
        ]
      : message;

  const openRouterRes = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "",
        "X-Title": "Kasian Suk",
      },
      body: JSON.stringify({
        model,
        stream: true,
        // ให้ OpenRouter แนบ token/cost จริงมาใน chunk สุดท้าย
        usage: { include: true },
        messages: [
          { role: "system", content: systemPrompt(context, task) },
          ...history,
          { role: "user", content: userContent },
        ],
      }),
    }
  );

  if (!openRouterRes.ok || !openRouterRes.body) {
    return NextResponse.json(
      { error: "เรียก AI ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  const upstream = openRouterRes.body;
  const finalConversationId = conversationId;

  // แปลง SSE ของ OpenRouter เป็น NDJSON อย่างง่ายให้ฝั่ง client
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));

      send({ type: "meta", conversationId: finalConversationId, model });

      let fullText = "";
      let usage: {
        prompt_tokens?: number;
        completion_tokens?: number;
        cost?: number;
      } | null = null;

      const reader = upstream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const sseLines = buffer.split("\n");
          buffer = sseLines.pop() ?? "";
          for (const line of sseLines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const chunk = JSON.parse(payload);
              const delta = chunk.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                fullText += delta;
                send({ type: "delta", text: delta });
              }
              if (chunk.usage) usage = chunk.usage;
            } catch {
              // ข้าม chunk ที่ parse ไม่ได้
            }
          }
        }

        if (fullText) {
          await supabase.from("ai_messages").insert({
            conversation_id: finalConversationId,
            role: "assistant",
            content: fullText,
            model,
          });
        }
        await supabase.from("ai_usage_log").insert({
          household_id: householdId,
          model,
          prompt_tokens: usage?.prompt_tokens ?? 0,
          completion_tokens: usage?.completion_tokens ?? 0,
          cost_usd: usage?.cost ?? 0,
          task,
        });

        send({ type: "done" });
      } catch {
        send({ type: "error", message: "การเชื่อมต่อขาดหาย กรุณาลองใหม่" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
