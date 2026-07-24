# สำรองและกู้คืนข้อมูล Supabase

> ทำไมต้องมี: แผน Free ของ Supabase ไม่มี backup อัตโนมัติ — โครงสร้างระบบกู้ได้จาก
> migrations + seed ใน repo แต่**ข้อมูลที่กรอกใช้งานจริงอยู่ใน Supabase ที่เดียว**
> สคริปต์ชุดนี้เก็บสำเนาลงเครื่องของเรา (รันแบบ manual — ยังไม่ตั้งเวลาอัตโนมัติ)

## เตรียมครั้งแรก (ทำครั้งเดียว)

เพิ่ม service role key ลง `.env.local` (ข้าม RLS ได้ — ใช้ในเครื่องเท่านั้น ห้าม commit):

1. Supabase Dashboard → Project Settings → API Keys → คัดลอก `service_role`
2. วางใน `.env.local`: `SUPABASE_SERVICE_ROLE_KEY=<key>`

## สำรองข้อมูล (แนะนำ: หลังกรอกข้อมูลสำคัญ เช่น กลับจากดูแปลงจริง)

```bash
npm run backup
```

ได้โฟลเดอร์ `backups/YYYY-MM-DD_HHMM/` ประกอบด้วย:

- `tables/*.json` — ข้อมูลทุกตาราง (18 ตาราง) พร้อม id เดิม
- `storage/<bucket>/...` — รูปทั้งหมดจาก 4 buckets (แปลง/ใบเสร็จ/บันทึก/ผังพื้นหลัง)
- `users.json` — รายชื่ออีเมลผู้ใช้ (ไว้ดูตอนสร้าง user ใหม่)
- `meta.json` — เวลาที่สำรอง + จำนวนแถว

โฟลเดอร์ `backups/` อยู่นอก git แล้ว — **แนะนำก๊อปไปเก็บอีกที่หนึ่ง** (external drive /
Google Drive ส่วนตัว) เพราะถ้าเครื่องพังพร้อม Supabase ล่มก็จบเหมือนกัน

## กู้ระบบทั้งหมด (กรณี Supabase project หาย)

ทำตามลำดับนี้ **ห้ามสลับ**:

1. สร้าง Supabase project ใหม่ (region `ap-northeast-1`)
2. Apply migrations เรียงตามลำดับ `00001` → `00005` (ผ่าน MCP หรือ `npx supabase db push`)
   — **ไม่ต้องรัน seed.sql** เพราะข้อมูลใน backup ครอบคลุม seed อยู่แล้วและรักษา id เดิม
   (ถ้ารัน seed ก่อน id ของหมวดงบ/เฟส/พืช จะไม่ตรงกับข้อมูลอ้างอิงใน backup)
3. แก้ `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` เป็นของโปรเจกต์ใหม่
4. กู้ข้อมูล:
   ```bash
   npm run restore -- backups/YYYY-MM-DD_HHMM
   ```
5. สร้างผู้ใช้ 2 คนใน Dashboard → Authentication → Add user (อีเมลดูจาก `users.json`)
   — trigger `handle_new_user` จะผูกเข้า household ที่กู้มาให้อัตโนมัติ
6. อัปเดต env ใน Vercel (URL + anon key ใหม่) → redeploy → ทดสอบ login

หมายเหตุ:

- สคริปต์ restore **รันซ้ำได้** (upsert ด้วย id เดิม) และรองรับกรณีเผลอสร้าง user
  ก่อน restore — มันจะย้าย profile เข้า household ที่กู้มา และลบ household
  ว่างที่ trigger สร้างเกินให้เอง
- ประวัติแชท AI และ usage log กู้กลับมาด้วยครบ
- ตาราง `profiles` ไม่ถูก restore ตรงๆ (ผูกกับ user id เก่าที่ไม่มีแล้ว) —
  trigger สร้างใหม่ให้ตอนเพิ่ม user
