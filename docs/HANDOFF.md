# Handoff: เกษียณสุข (Kasian Suk) — Dev Phase 1 + 2 เสร็จสมบูรณ์

> สำหรับ session ใหม่ของโปรเจกต์ `C:\Users\Consonant\Desktop\self-sufficiency`
> อ่านคู่กับ `CLAUDE.md` (กติกาทั้งหมด), `docs/decisions.md` (การตัดสินใจ 7 เรื่อง),
> `docs/plan-dev-phase2.md` (แผน+backlog Phase 2), `docs/master-plan-10-phases.md` (แผนแม่บท),
> `docs/backup-restore.md` (สำรอง/กู้ข้อมูล), `README.md` (setup + deploy)
> — เนื้อหาในนั้นไม่ทวนซ้ำที่นี่

## สถานะ: Dev Phase 1 (MVP) + Dev Phase 2 "Project OS" จบครบแล้ว deploy ใช้งานจริง

- **Production**: https://self-sufficiency.vercel.app (Vercel: `charoensinkos-projects/self-sufficiency`)
- **GitHub**: https://github.com/charoensinko/self-sufficiency (branch `main`) — **`git push` = auto-deploy production**
- **Supabase**: โปรเจกต์ `self-sufficiency` id `cbrpqjekfzzmsrhgajvs` (ap-northeast-1) — migrations 5 ไฟล์ + seed apply แล้ว (รวม Phase 2: 10 เฟส/74 งาน/21 พืช, `00005` = รูปพื้นหลังผัง+เนื้อที่โฉนด)
- **สถานะชีวิตจริงของผู้ใช้: ยังไม่ได้ซื้อที่ดิน** — Phase 2 สร้างเตรียมไว้ล่วงหน้า ทุกโมดูลใช้ได้โดยไม่ผูกแปลงจริง
- ทุก commit ผ่าน build+lint ก่อนเสมอ — ดู `git log --oneline`

## โมดูลที่มี (Phase 1 + Phase 2)

1. **Auth**: `/login` ไทย, middleware กันทุกหน้า, trigger ผูก user ใหม่เข้า household แรก
2. **Budget** (`/budget`): 3 แท็บ, วงเงินรวมปรับได้ (`households.total_budget`)
3. **Land Finder** (`/land`, `/land/[id]`, `/land/compare`): scoring 8 เกณฑ์+radar, checklist 25 ข้อ, การ์ด "ผังของแปลงนี้" ลิงก์ไป `/layout?id=...`
4. **Project Tracker** (`/project`, `/project/[id]`): timeline 10 เฟส (desktop 2 คอลัมน์), งาน+milestone (`is_milestone`), ติ๊กเสร็จ, กำหนดเสร็จ, ปุ่มเปลี่ยนสถานะเฟสบันทึกวันเริ่ม/จบจริง
5. **Journal** (`/journal`): บันทึกรายวันจัดกลุ่มรายเดือน + รูปหลายรูป (bucket `journal-photos`)
6. **Crop Planner** (`/crops`): 3 แท็บ — ปฏิทินเดือน (รวมปลูก/เก็บเกี่ยว/งานโครงการ + พืชเหมาะปลูกเดือนนี้), แผนปลูก (คำนวณวันคาดเก็บเกี่ยวอัตโนมัติ), ฐานข้อมูลพืช
7. **Farm Layout** (`/layout`, รองรับ `?id=`): SVG canvas หน่วยเมตรจริง ลากโซน 6 ชนิด, สัดส่วนเทียบ 30:30:30:10 สด, สมดุลดินขุดสระ-ถมโคก, หลายผัง+ผูก land candidate ได้, **รูปพื้นหลัง** (bucket `layout-images`) + ตั้งสเกลด้วยเส้นอ้างอิง + เนื้อที่โฉนด (ไร่-งาน-วา) เป็นตัวหาร % — เหลือ backlog จังหวะ 2 (polygon) ใน plan-dev-phase2.md
8. **AI Copilot** (`/ai`, `/api/ai/chat`): streaming NDJSON, context injection ครบทุกโมดูล (แปลง/งบ/โครงการ/บันทึก/แผนปลูก/ผังแปลง), task router — task ใหม่ Phase 2: `weekly_summary` / `budget_check` / `next_tasks` (ใช้ Sonnet, มีปุ่มลัดในหน้าแชท), `AI_PREFILL_KEY` sessionStorage รูปแบบ `{message, task}`
9. **Dashboard** (`/`): การ์ด แปลง / งบ / โครงการ (เฟสปัจจุบัน+งานใกล้กำหนด) / งานตรวจแปลง / ถาม AI
10. **Nav**: มือถือ 5 แท็บ (แท็บ 5 = "เพิ่มเติม" → `/more`), desktop Sidebar โชว์ทุกเมนู — คุมที่เดียว `src/components/nav-items.ts` (`NAV_ITEMS` + `EXTRA_NAV_ITEMS`)

## Gotchas ของ environment นี้ (สำคัญกับ session ใหม่)

- **อินเทอร์เน็ตผู้ใช้หลุดบ่อย** — คำสั่ง npm/npx ที่ใช้เน็ตมัก stall เงียบๆ ถ้าค้าง: หยุดแล้ว**ส่งคำสั่งให้ผู้ใช้รันเอง** (พิมพ์ `! <cmd>` ในแชท)
- **ห้ามใส่ค่า secret ลง command ตรงๆ** — classifier บล็อก ให้อ่านจาก `.env.local` แล้ว pipe
- `npm run build` ห้ามใช้ `--turbopack` (service worker ไม่ generate) — dev ใช้ได้
- ทดสอบมือถือในบ้าน: `http://192.168.1.66:3000` (IP อาจเปลี่ยน) — firewall TCP 3000 เปิดแล้ว
- shadcn CLI v5 (`-b radix -p nova`), ปุ่มขยาย 48px เอง — re-add `button.tsx` ต้องปรับซ้ำ
- Secrets อยู่ `.env.local` + Vercel production แล้ว — `SUPABASE_SERVICE_ROLE_KEY`
  กรอกแล้ว (ใช้โดยสคริปต์ backup/restore เท่านั้น — ฝั่งแอปยังไม่ใช้)
- **สำรองข้อมูล**: ดับเบิลคลิก `backup.bat` / `restore.bat` (หรือ `npm run backup` /
  `npm run restore -- backups/<โฟลเดอร์>`) — manual ตามที่ผู้ใช้เลือก ยังไม่ตั้งเวลาอัตโนมัติ
  ขั้นตอนเต็ม+ลำดับกู้ระบบดู `docs/backup-restore.md`, โฟลเดอร์ `backups/` อยู่นอก git
  **ผู้ใช้รันจริงผ่านแล้ว** — backup ชุดแรกอยู่ที่ `backups/2026-07-24_1755/`
  (18 ตาราง + รูปครบ 4 buckets, แนะนำผู้ใช้ก๊อปไปเก็บนอกเครื่องแล้ว)
  หมายเหตุ encoding: ไฟล์ `.bat` ต้องเป็น ASCII เท่านั้น — ข้อความไทยอยู่ฝั่งสคริปต์ Node
- MCP: Supabase ใช้ได้จริง (apply_migration/execute_sql), Vercel ใช้ผ่าน git push แทน
- โฟลเดอร์ route `/layout` อยู่ร่วมกับ `app/layout.tsx` ได้ (ตรวจแล้ว — ดู decisions.md)
- ตาราง Phase 2 ทั้งหมด RLS แบบ `household_id = current_household_id()` เหมือนเดิม

## งานถัดไป (ยังไม่เริ่ม — รอผู้ใช้สั่ง)

- **Backlog ผังแปลงจังหวะ 2** — โซน/ขอบแปลง polygon แตะทีละจุด (รอได้ที่ดินจริง —
  ดู `docs/plan-dev-phase2.md`; จังหวะ 1 ทำเสร็จแล้ว 2026-07-24)
- **แจ้งเตือน LINE OA** — ผู้ใช้ยืนยัน 2026-07-24 ว่า**ขอค้างไว้ก่อน** (ในแอปมีแจ้งเตือนแล้ว)
  อย่าเสนอซ้ำจนกว่าผู้ใช้หยิบขึ้นมาเอง
- **Dev Phase 3 (Smart Farm/IoT)** — ยังมาไม่ถึง ห้ามเริ่มจนกว่าจะมีที่ดินจริงและผู้ใช้สั่ง
  จังหวะที่เหมาะ = แผนแม่บทเดินถึงเฟส 4–5 (ระบบน้ำ/ไฟติดตั้ง) เป็นงานเพิ่มเข้าล้วน
  ไม่ต้องแก้ของเดิม (สถาปัตยกรรมดู webapp-concept.md §4) — **ก่อนเริ่มให้เช็ค
  อินเทอร์เน็ตในแปลงจริงก่อน** ถ้าสัญญาณแย่ต้องเผื่องบเสาสัญญาณ/Starlink ในแผนงบ
- **ตั้งเวลา backup อัตโนมัติ** (เช่น Windows Task Scheduler รายเดือน) — ผู้ใช้ขอใช้แบบ
  manual ไปก่อนจนเห็นความถี่ธรรมชาติของตัวเอง แล้วค่อยสั่ง
- ค้างเล็กๆ: `ai_messages.image_paths` ยังไม่ใช้ (ตั้งใจ — ดู decisions.md)

## Workflow ที่ผู้ใช้คุ้นแล้ว

ทำทีละ Step → สรุปสั้นเป็นภาษาไทย → รอยืนยันก่อน Step ถัดไป → build+lint ผ่านแล้ว
commit (`feat(scope): ...` อังกฤษ) → push (auto-deploy) ผู้ใช้สื่อสารภาษาไทยทั้งหมด
มีการตัดสินใจสถาปัตยกรรมใหม่ → เพิ่มใน `docs/decisions.md`
