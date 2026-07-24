// กู้ข้อมูลจากโฟลเดอร์ backup กลับเข้า Supabase (โปรเจกต์ใหม่หรือเดิม)
// วิธีใช้: npm run restore -- backups/YYYY-MM-DD_HHMM
//
// ลำดับกู้ระบบทั้งหมด (ดู docs/backup-restore.md):
//   1. สร้างโปรเจกต์ Supabase ใหม่ → apply migrations 00001–00005 (ไม่ต้องรัน seed.sql
//      — ข้อมูลใน backup ครอบคลุม seed อยู่แล้วและรักษา id เดิมไว้)
//   2. แก้ .env.local ให้ชี้โปรเจกต์ใหม่ (URL + anon key + service_role key)
//   3. npm run restore -- backups/<โฟลเดอร์>
//   4. สร้าง user 2 คนใน Dashboard → trigger ผูกเข้า household ที่กู้มาให้เอง
//   5. อัปเดต env ใน Vercel แล้ว redeploy
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import {
  BUCKETS,
  createAdminClient,
  GENERATED_COLUMNS,
  RESTORE_SKIP_TABLES,
  ROOT,
  TABLES,
} from "./supabase-admin.mjs";

let backupArg = process.argv[2];

// ไม่ระบุโฟลเดอร์ (เช่น รันจาก restore.bat) → โหมดถาม-ตอบ
if (!backupArg) {
  const backupsRoot = path.join(ROOT, "backups");
  const folders = existsSync(backupsRoot)
    ? readdirSync(backupsRoot).filter((name) =>
        statSync(path.join(backupsRoot, name)).isDirectory()
      )
    : [];
  if (folders.length === 0) {
    console.error(
      "ยังไม่มีข้อมูลสำรองในโฟลเดอร์ backups — ต้องรัน backup อย่างน้อย 1 ครั้งก่อน"
    );
    process.exit(1);
  }

  console.log("รายการ backup ที่มี (ใหม่สุดอยู่ล่าง):");
  for (const name of folders) console.log(`  - ${name}`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const folder = (
    await rl.question("\nพิมพ์ชื่อโฟลเดอร์ที่จะกู้ (คัดลอกจากรายการข้างบน): ")
  ).trim();
  if (!folder || !existsSync(path.join(backupsRoot, folder, "tables"))) {
    rl.close();
    console.error(`ไม่พบข้อมูล backup ใน backups/${folder} — ตรวจชื่อโฟลเดอร์อีกครั้ง`);
    process.exit(1);
  }
  console.log(
    "\nจะกู้ข้อมูลเข้าโปรเจกต์ Supabase ที่ตั้งไว้ใน .env.local (แถวที่ id ตรงกันจะถูกเขียนทับ)"
  );
  const confirm = (await rl.question("พิมพ์ YES แล้วกด Enter เพื่อยืนยัน: ")).trim();
  rl.close();
  if (confirm.toUpperCase() !== "YES") {
    console.log("ยกเลิกแล้ว — ไม่มีอะไรถูกแก้ไข");
    process.exit(0);
  }
  backupArg = path.join("backups", folder);
}
const backupDir = path.isAbsolute(backupArg)
  ? backupArg
  : path.join(ROOT, backupArg);
if (!existsSync(path.join(backupDir, "tables"))) {
  console.error(`ไม่พบข้อมูล backup ที่ ${backupDir} (ต้องมีโฟลเดอร์ tables/ ข้างใน)`);
  process.exit(1);
}

const { supabase, url } = createAdminClient();

function readTable(table) {
  const file = path.join(backupDir, "tables", `${table}.json`);
  if (!existsSync(file)) return [];
  return JSON.parse(readFileSync(file, "utf8"));
}

// --- ตรวจกันพลาด: ถ้าปลายทางมี household อื่นที่ไม่ใช่ชุดใน backup และมีข้อมูลอยู่แล้ว ให้เตือน ---
const backupHouseholds = readTable("households");
if (backupHouseholds.length === 0) {
  console.error("ไฟล์ backup ไม่มีข้อมูล households — โฟลเดอร์อาจไม่สมบูรณ์");
  process.exit(1);
}
const backupHouseholdIds = new Set(backupHouseholds.map((h) => h.id));

console.log(`กู้ข้อมูลจาก ${backupDir}`);
console.log(`ปลายทาง: ${url}\n`);

// --- 1) กู้ข้อมูลตารางตามลำดับ FK (upsert ด้วย id เดิม — รันซ้ำได้) ---
const CHUNK = 500;
for (const table of TABLES) {
  if (RESTORE_SKIP_TABLES.has(table)) {
    console.log(`- ข้าม ${table} (trigger สร้างใหม่ตอนสร้าง user)`);
    continue;
  }
  let rows = readTable(table);
  const generated = GENERATED_COLUMNS[table];
  if (generated) {
    rows = rows.map((row) => {
      const copy = { ...row };
      for (const col of generated) delete copy[col];
      return copy;
    });
  }
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from(table)
      .upsert(rows.slice(i, i + CHUNK), { onConflict: "id" });
    if (error) {
      console.error(`✗ ${table}: ${error.message}`);
      process.exit(1);
    }
  }
  console.log(`✓ ${table}: ${rows.length} แถว`);
}

// --- 2) ซ่อม profiles ที่ trigger สร้างไว้ก่อน restore (ถ้ามี) ให้ชี้ household ที่กู้มา
//        แล้วลบ household แปลกปลอมที่ trigger สร้างเอง (ว่างเปล่า ไม่มีข้อมูล) ---
const mainHouseholdId = backupHouseholds[0].id;
const { data: allProfiles } = await supabase
  .from("profiles")
  .select("id, household_id");
const strayProfiles = (allProfiles ?? []).filter(
  (p) => !backupHouseholdIds.has(p.household_id)
);
for (const profile of strayProfiles) {
  await supabase
    .from("profiles")
    .update({ household_id: mainHouseholdId })
    .eq("id", profile.id);
}
if (strayProfiles.length > 0) {
  console.log(`✓ ย้าย ${strayProfiles.length} profile เข้า household ที่กู้มา`);
}
const { data: allHouseholds } = await supabase.from("households").select("id");
for (const household of allHouseholds ?? []) {
  if (!backupHouseholdIds.has(household.id)) {
    await supabase.from("households").delete().eq("id", household.id);
    console.log(`✓ ลบ household แปลกปลอม ${household.id}`);
  }
}

// --- 3) อัปโหลดไฟล์รูปกลับทุก bucket ---
const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function walkFiles(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) results.push(...walkFiles(full));
    else results.push(full);
  }
  return results;
}

let uploaded = 0;
for (const bucket of BUCKETS) {
  const bucketDir = path.join(backupDir, "storage", bucket);
  const files = walkFiles(bucketDir);
  for (const file of files) {
    const storagePath = path.relative(bucketDir, file).split(path.sep).join("/");
    const contentType =
      CONTENT_TYPES[path.extname(file).toLowerCase()] ??
      "application/octet-stream";
    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, readFileSync(file), { contentType, upsert: true });
    if (error) {
      console.warn(`! อัปโหลดไม่ได้ ${bucket}/${storagePath}: ${error.message}`);
      continue;
    }
    uploaded++;
  }
  console.log(`✓ bucket ${bucket}: ${files.length} ไฟล์`);
}

console.log(`\nกู้ข้อมูลเสร็จ (${uploaded} ไฟล์รูป)`);
console.log(
  "ถ้ายังไม่ได้สร้างผู้ใช้: ไปที่ Dashboard → Authentication → Add user (ดูอีเมลเดิมใน users.json ของ backup)"
);
console.log("อย่าลืมอัปเดต env ใน Vercel (URL + anon key ใหม่) แล้ว redeploy");
