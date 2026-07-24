// สำรองข้อมูลทั้งหมดจาก Supabase ลงโฟลเดอร์ backups/ ในเครื่อง
// วิธีใช้: npm run backup
// ผลลัพธ์: backups/YYYY-MM-DD_HHMM/ (ข้อมูลตาราง JSON + รูปทุก bucket + รายชื่อผู้ใช้)
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  BUCKETS,
  createAdminClient,
  fetchAllRows,
  listAllFiles,
  ROOT,
  TABLES,
} from "./supabase-admin.mjs";

function timestampFolder() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

const { supabase, url } = createAdminClient();
const backupDir = path.join(ROOT, "backups", timestampFolder());
mkdirSync(path.join(backupDir, "tables"), { recursive: true });

console.log(`สำรองข้อมูลจาก ${url}`);
console.log(`ปลายทาง: ${backupDir}\n`);

const counts = {};

// --- 1) ข้อมูลตาราง ---
for (const table of TABLES) {
  const rows = await fetchAllRows(supabase, table);
  writeFileSync(
    path.join(backupDir, "tables", `${table}.json`),
    JSON.stringify(rows, null, 2),
    "utf8"
  );
  counts[table] = rows.length;
  console.log(`✓ ${table}: ${rows.length} แถว`);
}

// --- 2) รายชื่อผู้ใช้ (เพื่ออ้างอิงตอนสร้าง user ใหม่ — restore ไม่ใช้ไฟล์นี้) ---
try {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });
  if (error) throw error;
  const users = (data?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
  }));
  writeFileSync(
    path.join(backupDir, "users.json"),
    JSON.stringify(users, null, 2),
    "utf8"
  );
  console.log(`✓ ผู้ใช้: ${users.length} คน`);
} catch (err) {
  console.warn(`! ดึงรายชื่อผู้ใช้ไม่สำเร็จ (ข้ามได้): ${err.message}`);
}

// --- 3) ไฟล์ใน storage ทุก bucket ---
let fileCount = 0;
for (const bucket of BUCKETS) {
  const files = await listAllFiles(supabase, bucket);
  for (const filePath of files) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);
    if (error) {
      console.warn(`! ดาวน์โหลดไม่ได้ ${bucket}/${filePath}: ${error.message}`);
      continue;
    }
    const target = path.join(backupDir, "storage", bucket, filePath);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, Buffer.from(await data.arrayBuffer()));
    fileCount++;
  }
  console.log(`✓ bucket ${bucket}: ${files.length} ไฟล์`);
}

// --- 4) meta ---
writeFileSync(
  path.join(backupDir, "meta.json"),
  JSON.stringify(
    { backed_up_at: new Date().toISOString(), source_url: url, counts },
    null,
    2
  ),
  "utf8"
);

const totalRows = Object.values(counts).reduce((sum, n) => sum + n, 0);
console.log(
  `\nสำรองเสร็จ: ${totalRows} แถว + ${fileCount} ไฟล์รูป → ${backupDir}`
);
console.log(
  "โฟลเดอร์นี้มีข้อมูลส่วนตัว (อยู่นอก git แล้ว) — แนะนำก๊อปสำรองไว้อีกที่ เช่น external drive/cloud ส่วนตัว"
);
