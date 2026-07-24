# CLAUDE.md — เกษียณสุข (Kasian Suk)

Companion Web App ส่วนตัวสำหรับคู่สามีภรรยาวัยเกษียณ วางแผนย้ายไปทำเกษตรทฤษฎีใหม่ / โคก หนอง นา บนที่ดิน 5 ไร่ งบรวม 5 ล้านบาท ผู้ใช้จริงมี 2 คน (household เดียว) ใช้มือถือเป็นหลัก

## สถานะปัจจุบัน: Dev Phase 1 (MVP — ก่อนซื้อที่ดิน)

โมดูลที่อยู่ใน scope:
1. **Land Finder** — ฐานข้อมูลแปลงที่ดิน + Scoring Matrix 8 เกณฑ์ + Checklist 25 ข้อ + เปรียบเทียบแปลง
2. **Budget Tracker** — งบ 5 ล้านแตก 7 หมวด + บันทึกรายจ่ายจริง
3. **AI Copilot** — แชท streaming ผ่าน OpenRouter + context injection จาก DB + วิเคราะห์รูป

**ห้ามสร้างฟีเจอร์นอก scope นี้** (IoT, Smart Farm, Farm Layout, Crop Calendar, Energy, Market — เป็น Dev Phase 2–4 ยังไม่ทำ) ถ้างานที่ขอดูเกิน scope ให้ทักก่อนลงมือ

## Tech Stack

- Next.js 15 (App Router) + TypeScript strict + Tailwind CSS + shadcn/ui
- Supabase: Postgres + Auth + Storage + RLS ทุกตาราง
- OpenRouter API (server-side เท่านั้น) — streaming ผ่าน `/api/ai/chat`
- next-pwa, Recharts
- Deploy: Vercel

## โครงสร้างโปรเจกต์

```
src/
  app/              # routes: / , /land , /land/[id] , /land/compare , /budget , /ai , /settings , /api/ai/chat
  features/
    land/           # components + hooks + queries ของโมดูลที่ดิน
    budget/
    ai/             # chat UI, task router, context injection, usage log
  components/ui/    # shadcn components
  lib/              # supabase clients, utils, constants
supabase/
  migrations/       # SQL migrations + RLS policies
  seed.sql          # budget categories 7 หมวด + checklist templates 25 ข้อ
```

## Commands

```bash
npm run dev          # dev server
npm run build        # ต้อง build ผ่านก่อน commit เสมอ
npm run lint         # ESLint
npx supabase db push # apply migrations (ถ้าใช้ supabase CLI)
```

## กติกาสำคัญ (Conventions)

### Database
- ทุกตารางมี `household_id` + RLS policy: เข้าถึงได้เฉพาะสมาชิก household เดียวกัน
- แก้ schema ผ่าน migration file ใหม่เท่านั้น ห้ามแก้ migration เก่า
- `total_score` ใน `land_scores` เป็น generated column ถ่วงน้ำหนัก: น้ำ 20%, ดิน 15%, ความเสี่ยง 15%, ถนน 10%, ไฟฟ้า 10%, รพ. 10%, ชุมชน 10%, ความคุ้มราคา 10% (สเกล 0–100)
- Storage buckets: `land-photos`, `receipts` — private + RLS, บีบอัดรูปฝั่ง client ก่อนอัปโหลด (max 1600px)

### AI Layer
- `OPENROUTER_API_KEY` อยู่ server เท่านั้น — ห้าม expose ฝั่ง client เด็ดขาด
- Task Router ใน `/api/ai/chat`: แชททั่วไป → `anthropic/claude-haiku-4.5`, วิเคราะห์ลึก/เปรียบเทียบ → `anthropic/claude-sonnet-4.5`, มีรูปแนบ → `google/gemini-2.5-flash`, ผู้ใช้ override ได้จาก Settings
- ทุก call ต้องบันทึก `ai_usage_log` (tokens + cost)
- System prompt เป็นภาษาไทย บทบาท: ที่ปรึกษาเลือกซื้อที่ดินเกษตรและวางแผนเกษียณวิถีพอเพียง — ตอบกระชับ อ้างข้อมูลจริงใน DB ก่อนเสมอ ชี้ความเสี่ยงตรงไปตรงมา
- Context injection: สรุปแปลง+คะแนน+งบ+checklist ใส่ system prompt ทุกครั้ง — ดึงเฉพาะ field จำเป็น อย่า dump ทั้งตาราง

### UX (ผู้ใช้สูงวัย — สำคัญมาก)
- UI ภาษาไทยทั้งหมด ฟอนต์ Noto Sans Thai ฐาน ≥16px ปุ่ม min-height 48px contrast สูง
- Responsive สองโหมด: จอเล็ก = Bottom Navigation 4 แท็บ (หน้าหลัก / ที่ดิน / งบประมาณ / AI ที่ปรึกษา), จอ ≥1024px = Sidebar ซ้าย — เมนูชุดเดียวกันรวมศูนย์ที่ `src/components/nav-items.ts`
- ฟอร์มสั้น field น้อยต่อจอ error message ภาษาไทยอ่านเข้าใจง่าย
- ห้ามใช้ศัพท์เทคนิคใน UI (เช่น ใช้ "บันทึก" ไม่ใช่ "Submit", "แปลงที่ดิน" ไม่ใช่ "Land Candidate")

### Code Style
- TypeScript strict, ห้าม `any` (ใช้ `unknown` + type guard)
- Server Components เป็น default — ใส่ `"use client"` เฉพาะที่จำเป็น
- Data fetching: Supabase client ฝั่ง client โดยตรง (RLS คุม) ยกเว้น AI ผ่าน API route
- ชื่อ component เป็น PascalCase ภาษาอังกฤษ, ข้อความ UI ภาษาไทย hardcode ได้ (ไม่ต้องทำ i18n — ผู้ใช้ไทยเท่านั้น)
- Comment เฉพาะจุดที่ logic ไม่ชัดจากโค้ด เขียนภาษาไทยหรืออังกฤษก็ได้

## Workflow

- ทำทีละ Step ตามแผน 7 ขั้น (Scaffold → Supabase → Budget → Land → AI → Dashboard+PWA → Deploy) — จบแต่ละ Step ให้สรุปสั้นๆ และรอยืนยันก่อนขึ้น Step ถัดไป
- ก่อน commit: `npm run build` + `npm run lint` ต้องผ่าน
- Commit message ภาษาอังกฤษ รูปแบบ `feat(land): add scoring radar chart`
- ถ้าตัดสินใจเชิงสถาปัตยกรรมที่ต่างจากไฟล์นี้ ให้บันทึกเหตุผลใน `docs/decisions.md`

## เอกสารอ้างอิง

- `docs/Prompt-ClaudeCode-DevPhase1.md` — สเปกฉบับเต็ม (schema, seed data, DoD)
- `docs/webapp-concept.md` — แนวคิดภาพรวมทั้ง 4 Dev Phases
