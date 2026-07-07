# เกษียณสุข (Kasian Suk)

Companion Web App ส่วนตัวสำหรับวางแผนเกษียณสู่วิถีเกษตรพอเพียง (เกษตรทฤษฎีใหม่ / โคก หนอง นา)
บนที่ดิน 5 ไร่ งบรวม 5 ล้านบาท — Dev Phase 1: Land Finder + Budget Tracker + AI Copilot

## Tech Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase · OpenRouter · PWA

---

## ขั้นตอนติดตั้ง (ทำครั้งเดียว)

### 1. เตรียมเครื่อง

- ติดตั้ง [Node.js](https://nodejs.org) เวอร์ชัน 20 ขึ้นไป
- โคลนหรือดาวน์โหลดโปรเจกต์นี้ แล้วเปิดเทอร์มินัลในโฟลเดอร์โปรเจกต์
- รัน `npm install`

### 2. สร้างโปรเจกต์ Supabase

1. สมัคร/เข้าสู่ระบบที่ [supabase.com](https://supabase.com) แล้วกด **New Project**
2. ตั้งชื่อโปรเจกต์ เช่น `kasian-suk` เลือก region **Southeast Asia (Singapore)** ตั้งรหัสผ่านฐานข้อมูลแล้วจดเก็บไว้
3. รอโปรเจกต์สร้างเสร็จ (~2 นาที)

### 3. รัน migration และ seed

**วิธีที่ 1 — ผ่าน SQL Editor (ง่ายสุด):**

1. ใน Supabase Dashboard ไปที่ **SQL Editor**
2. เปิดไฟล์ `supabase/migrations/00001_initial_schema.sql` คัดลอกทั้งหมด วางแล้วกด **Run**
3. ทำแบบเดียวกันกับไฟล์ `supabase/seed.sql`

**วิธีที่ 2 — ผ่าน Supabase CLI:**

```bash
npx supabase login
npx supabase link --project-ref <รหัสโปรเจกต์>
npx supabase db push          # รัน migrations
# seed: วางเนื้อหา supabase/seed.sql ใน SQL Editor แล้ว Run
```

> migration จะสร้างตารางทั้งหมดพร้อม RLS policy และ Storage bucket
> `land-photos` / `receipts` (private) ให้อัตโนมัติ

### 4. สร้างผู้ใช้ 2 คน

1. ใน Dashboard ไปที่ **Authentication > Users > Add user > Create new user**
2. กรอกอีเมล + รหัสผ่านของสามี กด **Auto Confirm User** ✔ แล้วบันทึก
3. ทำซ้ำสำหรับภรรยา
4. ผู้ใช้ทั้งสองจะถูกผูกเข้า "ครอบครัวเกษียณสุข" โดยอัตโนมัติ (trigger ในฐานข้อมูล)

> ไม่มีหน้าสมัครสมาชิกในแอป — เพิ่มผู้ใช้ผ่าน Dashboard เท่านั้น

### 5. ตั้งค่า environment variables

1. คัดลอกไฟล์ `.env.example` เป็น `.env.local`
2. เติมค่าจาก Supabase Dashboard > **Project Settings > API**:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (เก็บเป็นความลับ)
3. `OPENROUTER_API_KEY` สร้างได้ที่ [openrouter.ai/keys](https://openrouter.ai/keys) (ใช้ใน Step AI)

### 6. รันแอป

```bash
npm run dev
```

เปิด http://localhost:3000 — ระบบจะพาไปหน้าเข้าสู่ระบบ ใช้อีเมล/รหัสผ่านที่สร้างในข้อ 4

**เปิดจากมือถือในบ้าน (WiFi เดียวกัน):** ใช้ URL จากบรรทัด `Network:` ที่แสดงตอนรัน dev
เช่น `http://192.168.1.66:3000`

---

## คำสั่งที่ใช้บ่อย

```bash
npm run dev      # dev server
npm run build    # production build (ต้องผ่านก่อน commit เสมอ)
npm run lint     # ตรวจโค้ดด้วย ESLint
```

## โครงสร้างโปรเจกต์

```
src/
  app/              # routes: / , /land , /budget , /ai , /login , /api/ai/chat
  features/         # โค้ดแยกตามโมดูล: land / budget / ai
  components/       # ส่วนประกอบใช้ร่วม (ui = shadcn)
  lib/              # supabase clients, utils
supabase/
  migrations/       # SQL migrations + RLS (แก้ schema = เพิ่มไฟล์ใหม่เท่านั้น)
  seed.sql          # งบ 7 หมวด + checklist ตรวจแปลง 25 ข้อ
docs/               # แผนแม่บท สเปก และบันทึกการตัดสินใจ
```

## หมายเหตุ Storage

รูปทุกไฟล์เก็บใน bucket แบบ private โดยใช้ path ขึ้นต้นด้วย household id:
`{household_id}/...` — RLS จะยอมให้เข้าถึงเฉพาะสมาชิกครอบครัวเดียวกัน
