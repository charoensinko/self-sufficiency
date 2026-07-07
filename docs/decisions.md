# Architecture Decisions

บันทึกการตัดสินใจเชิงสถาปัตยกรรมที่ต่างไปจาก CLAUDE.md / สเปกตั้งต้น

## 2026-07-07 — ใช้ `@ducanh2912/next-pwa` แทน `next-pwa`

สเปกระบุ `next-pwa` แต่แพ็กเกจต้นฉบับหยุดพัฒนาและไม่รองรับ Next.js 15 อย่างเป็นทางการ
จึงใช้ `@ducanh2912/next-pwa` ซึ่งเป็น fork ที่ maintain ต่อ, API เหมือนเดิม (wrap `next.config.ts`),
รองรับ App Router + Next 15 — ตั้งค่า `disable` ใน development เพื่อไม่ให้ service worker กวน dev server

## 2026-07-07 — shadcn CLI v5 (preset `radix-nova`) แทน base color `stone`

shadcn CLI เวอร์ชันปัจจุบันเลิกใช้ระบบ base color (`stone`/`zinc`/...) เปลี่ยนเป็นระบบ preset
เลือก `-b radix -p nova` (Radix UI + Lucide icons = พฤติกรรมเดียวกับ shadcn รุ่นเดิม)
ส่วนโทนสีเขียวธรรมชาติ/ดินเผา เขียน override เองทั้งพาเลตต์ใน `src/app/globals.css` (oklch)
จึงไม่ขึ้นกับ base color ของ CLI

หมายเหตุ: ปุ่ม default ของ shadcn v5 สูงเพียง 32px — ปรับ `button.tsx` ทุก size ให้ใหญ่ขึ้น
(default 48px, lg 56px) ตามกติกา UX ผู้สูงวัยใน CLAUDE.md ถ้า re-add component นี้ต้องปรับซ้ำ

## 2026-07-07 — ผู้ใช้ใหม่ถูกผูกเข้า household แรกอัตโนมัติ (trigger `handle_new_user`)

สเปกออกแบบ `households`/`profiles` เผื่อหลายครอบครัว แต่ Phase 1 มี household เดียวและ
สร้าง user ผ่าน Supabase dashboard เท่านั้น (ไม่มีหน้า register) จึงใช้ trigger บน `auth.users`
สร้าง profile + ผูกเข้า household แรกให้อัตโนมัติ — ตัดขั้นตอน insert profile ด้วยมือใน README
ถ้าอนาคตรองรับหลาย household ต้องเปลี่ยนเป็นระบบ invite แล้วลบ trigger นี้

## 2026-07-07 — AI Copilot: รูปแนบไม่ persist, model override เก็บใน localStorage

- รูปที่แนบในแชทถูกส่งเป็น base64 ให้ model ตรงๆ **ไม่บันทึกลง Storage** — คอลัมน์
  `ai_messages.image_paths` จึงยังไม่ถูกใช้ใน Phase 1 (ประวัติแชทเห็นเพียงข้อความ
  "แนบรูป n รูป") แลกกับความเรียบง่าย ไม่ต้องเพิ่ม bucket ใหม่
- model override จากหน้าตั้งค่าเก็บใน localStorage ของเครื่อง (ไม่ใช่ DB) — ตั้งค่า
  แยกต่อเครื่องได้ เหมาะกับผู้ใช้ 2 คน ไม่ต้องแก้ schema; server ตรวจ allowlist ก่อนใช้เสมอ
- ต้นทุนต่อ call ใช้ค่า `usage.cost` จริงจาก OpenRouter (ส่ง `usage: {include: true}`)
  แทนการคูณราคาต่อโทเคนเอง — ราคาไม่ต้องอัปเดตตามประกาศผู้ให้บริการ

## 2026-07-07 — วงเงินงบประมาณรวมปรับได้ (`households.total_budget`)

สเปกเดิม fix งบรวม 5 ล้านบาทในโค้ด — ผู้ใช้ขอให้ปรับเพิ่ม/ลดได้ตามสถานการณ์จริง
จึงย้ายไปเก็บเป็นคอลัมน์ `total_budget` (default 5,000,000) แก้ได้ในแท็บ "แผนงบ"
ภาพรวม (donut/คงเหลือ/%) อิงวงเงินนี้ ส่วนคำเตือนแผนรายหมวดเทียบกับวงเงินแบบเตือนไม่บล็อกเช่นเดิม
