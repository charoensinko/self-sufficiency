// ตัวช่วยกลางของสคริปต์ backup/restore — อ่าน .env.local + สร้าง client แบบ service role
// (service role ข้าม RLS ได้ ใช้เฉพาะในเครื่องเท่านั้น ห้ามเอา key ไปไว้ฝั่ง client)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

function loadEnvLocal() {
  const env = {};
  let text = "";
  try {
    text = readFileSync(path.join(ROOT, ".env.local"), "utf8");
  } catch {
    return env;
  }
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || match[1].startsWith("#")) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

export function createAdminClient() {
  const env = loadEnvLocal();
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      [
        "ยังตั้งค่าไม่ครบ — สคริปต์นี้ต้องใช้ 2 ค่าใน .env.local:",
        "  NEXT_PUBLIC_SUPABASE_URL=<url ของโปรเจกต์>",
        "  SUPABASE_SERVICE_ROLE_KEY=<service_role key>",
        "",
        "หา service_role key ได้ที่: Supabase Dashboard → Project Settings → API Keys",
        "(key นี้ข้าม RLS ได้ทั้งหมด — เก็บใน .env.local เท่านั้น ห้าม commit)",
      ].join("\n")
    );
    process.exit(1);
  }

  return {
    supabase: createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    url,
  };
}

/**
 * ตารางข้อมูลทั้งหมด เรียงตามลำดับ foreign key (restore ต้อง insert ตามลำดับนี้)
 * หมายเหตุ: profiles สำรองไว้เพื่ออ้างอิงเท่านั้น — ตอน restore ข้าม เพราะ
 * trigger handle_new_user จะสร้างให้ใหม่เมื่อสร้าง user ใน dashboard
 */
export const TABLES = [
  "households",
  "profiles",
  "checklist_templates",
  "land_candidates",
  "land_photos",
  "land_scores",
  "land_checklist_items",
  "budget_categories",
  "expenses",
  "ai_conversations",
  "ai_messages",
  "ai_usage_log",
  "project_phases",
  "project_tasks",
  "journal_entries",
  "crops",
  "plantings",
  "farm_layouts",
];

export const RESTORE_SKIP_TABLES = new Set(["profiles"]);

/** generated columns — insert กลับไม่ได้ ต้องตัดออกตอน restore (DB คำนวณเอง) */
export const GENERATED_COLUMNS = {
  land_candidates: ["price_per_rai"],
  land_scores: ["total_score"],
};

export const BUCKETS = [
  "land-photos",
  "receipts",
  "journal-photos",
  "layout-images",
];

/** ดึงทุกแถวของตาราง (แบ่งหน้า ครั้งละ 1000 กัน limit ของ PostgREST) */
export async function fetchAllRows(supabase, table) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

/** รายชื่อไฟล์ทั้งหมดใน bucket (ไล่ลงโฟลเดอร์ย่อย) */
export async function listAllFiles(supabase, bucket, prefix = "") {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });
  if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`);
  const files = [];
  for (const item of data ?? []) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) {
      files.push(itemPath);
    } else {
      files.push(...(await listAllFiles(supabase, bucket, itemPath)));
    }
  }
  return files;
}
