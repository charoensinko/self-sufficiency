# Handoff: เกษียณสุข (Kasian Suk) — Dev Phase 1 เสร็จสมบูรณ์

> สำหรับ session ใหม่ของโปรเจกต์ `C:\Users\Consonant\Desktop\self-sufficiency`
> อ่านคู่กับ `CLAUDE.md` (กติกาทั้งหมด), `docs/decisions.md` (การตัดสินใจ 6 เรื่อง),
> `README.md` (setup + deploy + production checklist) — เนื้อหาในนั้นไม่ทวนซ้ำที่นี่

## สถานะ: Dev Phase 1 (MVP) จบครบ 7 Step แล้ว และ deploy ใช้งานจริง

- **Production**: https://self-sufficiency.vercel.app (Vercel project: `charoensinkos-projects/self-sufficiency`)
- **GitHub**: https://github.com/charoensinko/self-sufficiency (branch `main`) — **เชื่อม auto-deploy แล้ว: `git push` = deploy production อัตโนมัติ** ไม่ต้องรัน `vercel --prod`
- **Supabase**: โปรเจกต์ `self-sufficiency` id `cbrpqjekfzzmsrhgajvs` (ap-northeast-1) — migrations 3 ไฟล์ + seed apply แล้ว, ผู้ใช้ 2 คนสร้างแล้ว, login ทดสอบผ่าน
- **UI เป็น responsive สองโหมดแล้ว**: จอเล็ก = Bottom Nav เดิม, จอ ≥1024px = Sidebar ซ้าย (เมนูรวมศูนย์ `src/components/nav-items.ts`, shell ที่ `src/components/app-shell.tsx`)
- ทุก commit ผ่าน build+lint ก่อนเสมอ — ดู `git log --oneline`
- ผู้ใช้ทดสอบผ่านแล้วทุกโมดูล รวมถึงติดตั้ง PWA บนมือถือ

## สิ่งที่มีอยู่ (สรุประดับ module — โครงสร้างไฟล์ดู CLAUDE.md)

1. **Auth**: หน้า `/login` ไทย, middleware กันทุกหน้า, trigger ผูก user ใหม่เข้า household แรกอัตโนมัติ
2. **Budget** (`/budget`): 3 แท็บ ภาพรวม donut / บันทึกรายจ่าย+ใบเสร็จ / แผนงบ — **วงเงินรวมปรับได้** (`households.total_budget`, ไม่ fix 5 ล้าน)
3. **Land Finder** (`/land`, `/land/new`, `/land/[id]` 3 แท็บ, `/land/compare`): scoring 8 เกณฑ์+radar, checklist 25 ข้อ, parse ลิงก์ Google Maps, รูปหลายประเภท
4. **AI Copilot** (`/ai`, `/settings`, `/api/ai/chat`): streaming NDJSON, task router (haiku/sonnet/gemini), context injection จาก DB ทุก call, usage log ต้นทุนจริงจาก OpenRouter, ปุ่มส่งวิเคราะห์จากหน้า compare ผ่าน sessionStorage (`AI_PREFILL_KEY` ใน `src/lib/constants.ts`, รูปแบบ JSON `{message, task}`)
5. **Dashboard** (`/`): 4 การ์ด (แปลง+Top3 / งบ mini donut / งานค้าง checklist / ถาม AI ลัด)
6. **PWA**: manifest + ไอคอนต้นกล้า (regenerate: `node scripts/make-icons.mjs`) + offline fallback `/~offline`

## Gotchas ของ environment นี้ (สำคัญกับ session ใหม่)

- **อินเทอร์เน็ตผู้ใช้หลุดบ่อย** — คำสั่ง npm/npx ที่ใช้เน็ตมัก stall เงียบๆ ถ้าค้าง: หยุด task แล้ว**ส่งคำสั่งให้ผู้ใช้รันเอง** (พิมพ์ `! <cmd>` ในแชท) เป็นวิธีที่ workflow นี้ใช้มาตลอด
- **ห้ามใส่ค่า secret ลง command ตรงๆ** — classifier บล็อก ให้อ่านจาก `.env.local` แล้ว pipe (ดูตัวอย่างฟังก์ชัน `Add-VercelEnv` ที่เคยใช้)
- `npm run build` ห้ามใช้ `--turbopack` (service worker จะไม่ถูก generate) — dev ใช้ turbopack ได้
- ทดสอบจากมือถือในบ้าน: `http://192.168.1.66:3000` (IP อาจเปลี่ยน) — เปิด firewall TCP 3000 profile Private ไว้แล้ว
- shadcn CLI เป็น v5 แล้ว (`-b radix -p nova`) และปุ่มถูกขยายเป็น 48px เอง — ถ้า re-add `button.tsx` ต้องปรับซ้ำ (ดู decisions.md)
- Secrets ทั้งหมดอยู่ `.env.local` (ไม่ commit) และตั้งใน Vercel production แล้ว — `SUPABASE_SERVICE_ROLE_KEY` ยังว่าง (ยังไม่มีอะไรใช้)
- MCP ที่เชื่อมไว้: Supabase (apply_migration/execute_sql ใช้ได้) และ Vercel (deploy ผ่าน CLI เท่านั้น ตัว MCP tool ใช้ไม่ได้จริง)

## งานถัดไป (ยังไม่เริ่ม — รอผู้ใช้สั่ง)

- **Dev Phase 2 "Project OS"** (บริหารการก่อสร้างหลังซื้อที่ดิน) — สเปกภาพรวมใน `docs/webapp-concept.md` ; **ห้ามเริ่มเองจนกว่าผู้ใช้ยืนยัน scope**
- **การตัดสินใจที่ค้างไว้ (คุยแล้ว ยังไม่ทำ)**: เมนูใหม่ใน Phase 2 จะใช้แนว "เพิ่มแท็บที่ 5 ชื่อ เพิ่มเติม + สลับแท็บหลักตามช่วงชีวิต" — เพิ่มที่ `src/components/nav-items.ts` ที่เดียวขึ้นทั้งสองโหมด
- **Desktop layout ระดับ 2 (ค้างบางส่วน)**: แดชบอร์ดและรายการแปลงจัด grid แล้ว แต่หน้างบประมาณ/รายละเอียดแปลง/ฟอร์ม ยังเป็นคอลัมน์เดียวตรงกลาง — รอผู้ใช้ใช้จริงแล้วชี้ว่าหน้าไหนอยากได้ layout คู่ซ้าย-ขวา
- ค้างเล็กๆ: คอลัมน์ `ai_messages.image_paths` ยังไม่ใช้ (ตั้งใจ — ดู decisions.md)

## Suggested skills

- `verify` / `run` — ก่อน commit ฟีเจอร์ใหม่ที่มีผลจริงบนหน้าจอ
- `dataviz` — ทุกครั้งที่จะเพิ่มกราฟใหม่ (Recharts)
- `code-review` — รีวิว diff ก่อน commit ใหญ่
- `vercel:deploy` / `vercel:env` — งาน deploy รอบถัดไป
- `claude-api` — ถ้าจะแตะ model IDs/ราคาในโมดูล AI

## Workflow ที่ผู้ใช้คุ้นแล้ว

ทำทีละ Step → สรุปสั้นเป็นภาษาไทย → รอยืนยันก่อน Step ถัดไป → build+lint ผ่านแล้ว commit (`feat(scope): ...` อังกฤษ) ผู้ใช้สื่อสารภาษาไทยทั้งหมด
