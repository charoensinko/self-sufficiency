# Prompt สำหรับ Claude Code — Dev Phase 1 (MVP): Web App "เกษียณสุข สู่วิถีเกษตรพอเพียง"

> วิธีใช้: คัดลอกทั้งหมดตั้งแต่บรรทัด "=== PROMPT เริ่มต้น ===" ลงไป วางใน Claude Code ภายในโฟลเดอร์โปรเจกต์เปล่า แนะนำให้ทำทีละ Step ตามที่ระบุใน Prompt (Claude Code จะถามยืนยันก่อนขึ้น Step ถัดไป)

=== PROMPT เริ่มต้น ===

## บริบทโปรเจกต์

สร้าง Web App ชื่อ **"เกษียณสุข" (Kasian Suk)** — Companion App ส่วนตัวสำหรับคู่สามีภรรยาวัยเกษียณที่กำลังวางแผนย้ายไปทำเกษตรผสมผสานตามแนวเกษตรทฤษฎีใหม่ / โคก หนอง นา บนที่ดิน 5 ไร่ งบประมาณรวม 5 ล้านบาท

**Dev Phase 1 (MVP) โฟกัสที่ระยะ "ก่อนซื้อที่ดิน" เท่านั้น** ประกอบด้วย 3 โมดูล:
1. **Land Finder & Decision** — ฐานข้อมูลแปลงที่ดินที่สนใจ + Scoring Matrix เปรียบเทียบ + Checklist ตรวจแปลง
2. **Budget Tracker** — งบ 5 ล้านบาทแตกหมวด + บันทึกรายจ่ายจริงเทียบแผน
3. **AI Copilot** — แชทวิเคราะห์ผ่าน OpenRouter รู้บริบทข้อมูลในแอป + วิเคราะห์รูปภาพ (โฉนด/สภาพแปลง)

ห้ามสร้างฟีเจอร์นอกเหนือจาก 3 โมดูลนี้ (เช่น IoT, Farm Layout, Crop Calendar) — จะทำในเฟสถัดไป

## ผู้ใช้และหลักการ UX

- ผู้ใช้ 2 คน (สามี-ภรรยา) วัย 60+ ใช้มือถือเป็นหลัก → **Mobile-first PWA**
- UI **ภาษาไทยทั้งหมด** ฟอนต์ Noto Sans Thai ขนาดตัวอักษรฐาน 16px ขึ้นไป ปุ่มใหญ่ (min-height 48px) contrast สูง
- โครงสร้างเรียบง่าย: Bottom Navigation 4 แท็บ — หน้าหลัก / ที่ดิน / งบประมาณ / AI ที่ปรึกษา
- หน้าหลัก (Dashboard) ตอบ 3 คำถามใน 1 จอ: มีแปลงที่ดินกี่แปลงในระบบ+อันดับสูงสุด / ใช้งบไปเท่าไหร่แล้ว / งานค้างที่ต้องทำ (checklist ที่ยังไม่ครบ)

## Tech Stack (บังคับใช้)

- **Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui**
- **Supabase**: Postgres + Auth (email/password, 2 ผู้ใช้) + Storage (รูปภาพ) + Row Level Security ทุกตาราง
- **OpenRouter API** สำหรับ AI (เก็บ key ใน env ฝั่ง server เท่านั้น, เรียกผ่าน API Route, รองรับ streaming)
- **next-pwa** สำหรับ installable PWA + offline cache หน้าที่เปิดล่าสุด
- **Recharts** สำหรับกราฟงบประมาณ
- Deploy บน **Vercel**
- จัดโครงสร้างโค้ดแบบ feature-based: `src/features/land`, `src/features/budget`, `src/features/ai`, `src/components/ui`, `src/lib`

## Database Schema (Supabase)

สร้าง migration SQL ให้ครบ พร้อม RLS policy (ทุกตารางเข้าถึงได้เฉพาะ authenticated users ใน household เดียวกัน):

```sql
-- households: ครอบครัวเดียว แต่ออกแบบเผื่อไว้
households (id uuid pk, name text, created_at)
profiles (id uuid pk refs auth.users, household_id fk, display_name text, role text)

-- M1: Land Finder
land_candidates (
  id uuid pk, household_id fk,
  name text,                    -- ชื่อเรียกแปลง เช่น "แปลงลุงสมชาย อ.ปากช่อง"
  province text, district text, subdistrict text,
  lat double, lng double,       -- พิกัด
  area_rai numeric, area_ngan numeric, area_wa numeric,
  price_total numeric, price_per_rai numeric,  -- คำนวณอัตโนมัติ
  deed_type text,               -- โฉนด นส.4 / นส.3ก / นส.3 / อื่นๆ
  seller_contact text,
  status text default 'interested',  -- interested / visited / negotiating / rejected / purchased
  notes text,
  created_at, updated_at
)

land_photos (id uuid pk, land_id fk, storage_path text, caption text, photo_type text, created_at)
-- photo_type: deed / land / water / road / other

-- Scoring Matrix: เกณฑ์คงที่ 8 ด้าน คะแนน 1-5 ต่อเกณฑ์ พร้อมน้ำหนัก
land_scores (
  id uuid pk, land_id fk unique,
  water_source int,       -- แหล่งน้ำ (น้ำหนัก 20%)
  soil_quality int,       -- คุณภาพดิน (15%)
  flood_risk int,         -- ความเสี่ยงน้ำท่วม/ภัยพิบัติ ยิ่งปลอดภัยยิ่งคะแนนสูง (15%)
  road_access int,        -- ถนน/การเข้าถึง (10%)
  electricity int,        -- ไฟฟ้าถึงแปลง (10%)
  hospital_distance int,  -- ใกล้ รพ. (10%)
  community int,          -- ชุมชน/ตลาด (10%)
  price_value int,        -- ความคุ้มราคา (10%)
  total_score numeric generated,  -- คำนวณถ่วงน้ำหนัก 0-100
  scored_at timestamptz
)

-- Checklist ตรวจแปลง: template กลาง + สถานะต่อแปลง
checklist_templates (id, category text, item text, description text, sort_order int)
land_checklist_items (id, land_id fk, template_id fk, checked bool, note text, checked_at)

-- M2: Budget
budget_categories (
  id uuid pk, household_id fk,
  name text, planned_amount numeric, sort_order int
)
expenses (
  id uuid pk, household_id fk, category_id fk,
  amount numeric, description text, expense_date date,
  land_id fk nullable,   -- ผูกกับแปลงได้ เช่น ค่ามัดจำ
  receipt_photo text nullable,
  created_at
)

-- M3: AI
ai_conversations (id uuid pk, household_id fk, title text, created_at, updated_at)
ai_messages (id uuid pk, conversation_id fk, role text, content text, image_paths text[], model text, created_at)
ai_usage_log (id, household_id, model text, prompt_tokens int, completion_tokens int, cost_usd numeric, task text, created_at)
```

**Seed data ที่ต้องใส่:**

1. `budget_categories` ตามแผนแม่บท: ที่ดิน (1,800,000) / บ้านและสิ่งปลูกสร้าง (1,500,000) / ระบบน้ำและสระ (400,000) / ระบบไฟฟ้า-โซลาร์ (350,000) / เครื่องมือและอุปกรณ์ (200,000) / ปรับปรุงดิน-พันธุ์พืช-สัตว์ (150,000) / เงินสำรองฉุกเฉิน (600,000)
2. `checklist_templates` ~25 รายการ แบ่ง 5 หมวด:
   - **เอกสารสิทธิ์**: เป็นโฉนด (น.ส.4) หรือ น.ส.3ก, ตรวจหลังโฉนดที่กรมที่ดิน (ภาระผูกพัน/จำนอง), ชื่อผู้ขายตรงกับโฉนด, ขอสำเนาโฉนดก่อนวางมัดจำ, ตรวจแนวเขต-หมุดครบ
   - **น้ำ**: มีแหล่งน้ำผิวดินใกล้แปลง, สอบถามระดับน้ำบาดาลจากเพื่อนบ้าน, ตรวจข้อมูลบ่อบาดาลบริเวณใกล้เคียง (badan.dgr.go.th), น้ำประปา/ประปาหมู่บ้านถึงหรือไม่, ดูร่องรอยทางน้ำไหลผ่านแปลง
   - **ดินและสภาพแปลง**: ขุดดูหน้าดินลึก 50 ซม., เก็บตัวอย่างดินส่งตรวจกรมพัฒนาที่ดิน (ฟรี), สังเกตพืชที่ขึ้นเองบ่งบอกสภาพดิน, ระดับแปลงสูง-ต่ำกว่าถนน, ทิศทางลาดเอียง
   - **ความเสี่ยง**: ตรวจแผนที่น้ำท่วมย้อนหลัง (GISTDA disaster.gistda.or.th), สอบถามประวัติน้ำท่วมจากคนพื้นที่ 3 คนขึ้นไป, ตรวจผังเมือง-โซนสี (plludds.dpt.go.th), ระยะห่างจากรอยเลื่อนมีพลัง, โรงงาน/ฟาร์มใหญ่/เสาส่งสัญญาณใกล้เคียง
   - **การเข้าถึงและชุมชน**: ถนนเข้าแปลงเป็นทางสาธารณะ (ไม่ใช่ทางผ่านที่ดินเอกชน), ไฟฟ้าถึงแปลงหรือระยะห่างจากเสาไฟล่าสุด, สัญญาณมือถือ/อินเทอร์เน็ต, ระยะเวลาถึง รพ.อำเภอ/รพ.จังหวัด, ตลาดนัด-ตลาดสดใกล้เคียง

## ฟีเจอร์ละเอียดต่อโมดูล

### M1: Land Finder (`/land`)

- **รายการแปลง**: Card แสดงชื่อ จังหวัด ราคา ราคา/ไร่ คะแนนรวม (badge สี: เขียว ≥75, เหลือง 50–74, แดง <50) สถานะ, เรียงตามคะแนน, filter ตามสถานะ/จังหวัด
- **เพิ่ม/แก้ไขแปลง**: form ครบทุก field, ใส่พิกัดโดยวางลิงก์ Google Maps แล้ว parse lat/lng อัตโนมัติ, อัปโหลดรูปหลายรูปพร้อมระบุประเภท, บีบอัดรูปฝั่ง client ก่อนอัปโหลด (max 1600px)
- **หน้ารายละเอียดแปลง** 3 แท็บ:
  - ข้อมูล: ทุก field + แผนที่ embed (Google Maps iframe จากพิกัด) + แกลเลอรีรูป
  - คะแนน: ฟอร์มให้คะแนน 8 เกณฑ์ (slider หรือปุ่ม 1–5 พร้อมคำอธิบายแต่ละระดับ) แสดงคะแนนรวมถ่วงน้ำหนักแบบ real-time + Radar Chart
  - Checklist: รายการตรวจ 25 ข้อ แบ่งหมวด กดติ๊ก + ใส่โน้ตได้ แสดง progress bar ต่อหมวด
- **หน้าเปรียบเทียบ** (`/land/compare`): เลือก 2–4 แปลง แสดงตารางเปรียบเทียบทุกมิติ + ปุ่ม "ให้ AI ช่วยวิเคราะห์" ส่งข้อมูลทั้งหมดเข้า AI Copilot พร้อม prompt วิเคราะห์อัตโนมัติ

### M2: Budget Tracker (`/budget`)

- **ภาพรวม**: Donut chart แผน vs ใช้จริงรวม, ตารางรายหมวด (แผน / ใช้จริง / คงเหลือ / % ใช้), แถบเตือนสีแดงเมื่อหมวดใดใช้เกิน 90% ของแผน
- **บันทึกรายจ่าย**: form เร็ว (จำนวนเงิน หมวด รายละเอียด วันที่ ผูกแปลง(optional) รูปใบเสร็จ(optional)), รายการล่าสุดแสดงใต้ form ลบ/แก้ได้
- **แก้แผนงบ**: ปรับ planned_amount ต่อหมวดได้ พร้อมตรวจว่ารวมกันไม่เกิน 5,000,000 (เตือนถ้าเกิน แต่ไม่บล็อก)

### M3: AI Copilot (`/ai`)

- **แชท streaming** UI แบบ LINE (bubble ซ้าย-ขวา) รองรับหลายบทสนทนา สร้างใหม่/ลบได้ ตั้งชื่ออัตโนมัติจากข้อความแรก
- **แนบรูปได้** (เช่น รูปโฉนด รูปแปลง) ส่งเป็น base64 ไปยัง model ที่รองรับ vision
- **Context Injection**: ทุกครั้งที่ส่งข้อความ ระบบดึงข้อมูลสรุปจาก DB ใส่ system prompt อัตโนมัติ:
  - รายชื่อแปลงทั้งหมด + คะแนน + สถานะ + จุดเด่น/จุดอ่อนจากโน้ต
  - สรุปงบ: แผนต่อหมวด ใช้ไปแล้ว คงเหลือ
  - ความคืบหน้า checklist ต่อแปลง
- **System Prompt หลัก** (เขียนเป็นภาษาไทย): กำหนดบทบาทเป็น "ที่ปรึกษาการเลือกซื้อที่ดินเกษตรและวางแผนเกษียณวิถีพอเพียง เชี่ยวชาญเกษตรทฤษฎีใหม่/โคก หนอง นา เข้าใจบริบทไทย: เอกสารสิทธิ์ น้ำบาดาล ผังเมือง ความเสี่ยงภัยพิบัติ" ตอบภาษาไทย กระชับ ตรงประเด็น อ้างข้อมูลจริงในระบบก่อนเสมอ ชี้ความเสี่ยงตรงไปตรงมา
- **Task Router** (`/api/ai/chat`): 
  - แชททั่วไป → `anthropic/claude-haiku-4.5`
  - มีคำสั่งวิเคราะห์เปรียบเทียบ (จากปุ่มหน้า compare) หรือผู้ใช้เลือกโหมด "วิเคราะห์ลึก" → `anthropic/claude-sonnet-4.5`
  - มีรูปแนบ → `google/gemini-2.5-flash`
  - ผู้ใช้ override model ได้ในหน้า Settings (dropdown รายการ model + ราคาโดยประมาณ)
- **บันทึก usage**: ทุก call เก็บ tokens + คำนวณ cost ลง `ai_usage_log` แสดงยอดรวมเดือนนี้ในหน้า Settings

### Dashboard (`/`)

- การ์ด 1: "แปลงที่ดิน" — จำนวนแปลงตามสถานะ + Top 3 คะแนนสูงสุด (แตะไปหน้ารายละเอียด)
- การ์ด 2: "งบประมาณ" — mini donut ใช้ไป/คงเหลือ + รายจ่ายล่าสุด 3 รายการ
- การ์ด 3: "งานที่ต้องทำ" — แปลงที่ checklist ยังไม่ครบ เรียงตามสถานะ (visited แต่ checklist <80% ขึ้นก่อน)
- การ์ด 4: "ถาม AI" — ช่อง input ลัด พิมพ์แล้วเด้งไปหน้าแชทพร้อมส่งข้อความ

## API Routes

- `POST /api/ai/chat` — streaming chat, รับ conversation_id + message + images[], ทำ context injection + task routing
- `GET/POST/PATCH/DELETE` ผ่าน Supabase client ฝั่ง client โดยตรง (มี RLS คุม) — ไม่ต้องสร้าง REST ครอบ

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # ใช้เฉพาะ server (seed, admin)
OPENROUTER_API_KEY=             # server เท่านั้น
NEXT_PUBLIC_APP_URL=
```

สร้างไฟล์ `.env.example` พร้อมคำอธิบายภาษาไทย และเขียนขั้นตอน setup Supabase (สร้างโปรเจกต์ รัน migration เปิด Storage bucket ชื่อ `land-photos` และ `receipts` แบบ private + RLS) ไว้ใน `README.md` ภาษาไทยอย่างละเอียดทีละขั้น

## ลำดับการทำงาน (ทำทีละ Step หยุดถามยืนยันก่อนขึ้น Step ถัดไป)

1. **Scaffold**: Next.js 15 + TS + Tailwind + shadcn/ui + next-pwa + โครงสร้างโฟลเดอร์ + ฟอนต์ Noto Sans Thai + theme สีเขียวธรรมชาติ/ดินเผา อบอุ่น
2. **Supabase**: migration SQL ทั้งหมด + RLS + seed script (budget categories + checklist templates) + Supabase client helpers + Auth (หน้า login ภาษาไทย, ไม่มีหน้า register — สร้าง user ผ่าน dashboard)
3. **M2 Budget** (ทำก่อนเพราะง่ายสุด ใช้ทดสอบ Auth+RLS): ภาพรวม + บันทึกรายจ่าย + แก้แผน
4. **M1 Land Finder**: CRUD แปลง + รูปภาพ + Scoring + Checklist + Compare
5. **M3 AI Copilot**: API route + Task router + Context injection + Chat UI + Settings + Usage log
6. **Dashboard + PWA**: หน้าหลัก 4 การ์ด + manifest + icon + offline fallback
7. **Deploy**: Vercel config + คู่มือ deploy ใน README + ทดสอบ production checklist

## Definition of Done

- [ ] Login ได้ 2 users, ข้อมูลแยกตาม household ด้วย RLS (ทดสอบด้วย user นอก household มองไม่เห็นข้อมูล)
- [ ] เพิ่มแปลงที่ดินพร้อมรูป ให้คะแนน 8 เกณฑ์ เห็น Radar chart และคะแนนรวมถูกต้องตามน้ำหนัก
- [ ] Checklist 25 ข้อครบ 5 หมวด ติ๊กแล้ว progress อัปเดต
- [ ] เปรียบเทียบ 3 แปลง แล้วกดส่งให้ AI วิเคราะห์ — AI ตอบโดยอ้างข้อมูลจริงของแปลง
- [ ] บันทึกรายจ่าย เห็นยอดหมวดอัปเดต และเตือนเมื่อใกล้เกินแผน
- [ ] แชท AI streaming ลื่น แนบรูปโฉนดแล้ว AI อ่านเนื้อหาได้ (ผ่าน Gemini Flash)
- [ ] ai_usage_log บันทึกต้นทุนทุก call ยอดเดือนแสดงใน Settings
- [ ] ติดตั้งเป็น PWA บนมือถือได้ ฟอนต์ไทยสวย ปุ่มใหญ่กดง่าย
- [ ] Deploy บน Vercel ผ่าน README ได้ตั้งแต่ต้นจนจบ

=== PROMPT สิ้นสุด ===
