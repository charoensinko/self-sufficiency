# แนวคิดการพัฒนา Web App "เกษียณสุข สู่วิถีเกษตรพอเพียง"

Companion App ส่วนตัวสำหรับบริหารการเปลี่ยนผ่านสู่ชีวิตเกษตรพอเพียงบนที่ดิน 5 ไร่ งบ 5 ล้านบาท ตลอด 4 ระยะ — ตั้งแต่ค้นหาที่ดินจนถึงการใช้ชีวิตประจำวันบนแปลงจริง

---

## 1. Product Vision

**"ผู้ช่วยดิจิทัลคนเดียวที่รู้จักแผนแม่บททั้ง 10 Phase ของเรา"** — ไม่ใช่แอปเกษตรทั่วไป แต่เป็นระบบบริหารโครงการชีวิต (Life Project OS) ที่:

1. **นำทางตามแผน** — แปลงแผนแม่บท 10 Phases / 4 ระยะ เป็น Task, Milestone, Checklist ที่ติดตามได้จริง
2. **AI เป็นที่ปรึกษา** — วิเคราะห์ข้อมูล สรุปประเด็น เสนอแนวทางแก้ไข ในทุกโมดูล ผ่าน OpenRouter (เลือก Model ได้ตามงาน)
3. **เชื่อมโลกจริง** — รับข้อมูลจาก IoT Sensor / PLC / Solar Inverter มาแสดงผลและสั่งการ (Smart Farm + Energy Management)
4. **โตไปพร้อมกับเจ้าของ** — เฟสการพัฒนาแอปสอดคล้องกับจังหวะชีวิตจริง: ตอนนี้ยังไม่มีที่ดิน → โมดูลหาที่ดินต้องมาก่อน IoT

### ผู้ใช้หลัก
คู่สามีภรรยาวัยเกษียณ 1–2 คน ใช้งานผ่านมือถือเป็นหลัก (PWA) ต้องการ UI ภาษาไทย ตัวอักษรใหญ่ ใช้ง่าย ไม่ซับซ้อน

---

## 2. โมดูลหลักของระบบ (Functional Modules)

| # | โมดูล | หน้าที่หลัก | รองรับระยะ |
|---|--------|-------------|-----------|
| M1 | **Land Finder & Decision** | เปรียบเทียบจังหวัด/แปลงที่ดิน, Scoring Matrix, Checklist ตรวจแปลง, บันทึกรูป+พิกัด, AI วิเคราะห์เอกสารสิทธิ์และความเสี่ยง | ระยะ 1 |
| M2 | **Budget & Project Tracker** | งบ 5 ล้านแตกหมวด, บันทึกรายจ่ายจริง vs แผน, Timeline 10 Phases, Gantt/Milestone, แจ้งเตือนงานค้าง | ทุกระยะ |
| M3 | **Farm Layout Designer** | ผังแปลง 5 ไร่ แบบ Interactive (30:30:30:10), วางตำแหน่งโคก หนอง นา บ้าน โซนปลูก, คำนวณพื้นที่/ปริมาตรสระอัตโนมัติ | ระยะ 2 |
| M4 | **Crop Planner & Calendar** | ปฏิทินปลูกปีที่ 1–5, ฐานข้อมูลพืช (ระยะปลูก น้ำ ปุ๋ย เก็บเกี่ยว), แจ้งเตือนงานประจำวัน/สัปดาห์ | ระยะ 2–4 |
| M5 | **Smart Farm Dashboard** | Real-time: ความชื้นดิน ระดับน้ำสระ อุณหภูมิ ฝน, สั่งเปิด-ปิดปั๊ม/วาล์วน้ำ, Automation Rules (ถ้าความชื้น < X → รดน้ำ) | ระยะ 3–4 |
| M6 | **Energy Management** | ผลิตไฟ Solar รายวัน, สถานะแบตเตอรี่, โหลดการใช้ไฟ, วิเคราะห์คุ้มค่า, แจ้งเตือนผิดปกติ | ระยะ 3–4 |
| M7 | **Daily Life & Journal** | บันทึกประจำวัน (งาน สุขภาพ ผลผลิต), รูปภาพความก้าวหน้าแปลง, AI สรุปรายสัปดาห์/เดือน + ข้อเสนอปรับปรุง | ระยะ 4 |
| M8 | **Harvest & Market** | บันทึกผลผลิต-ส่วนเกิน, ราคาตลาด, ช่องทางขาย (ตลาดเขียว/LINE/FB), รายรับจากฟาร์ม, ต้นทุน-กำไรอย่างง่าย | ระยะ 3–4 |
| M9 | **AI Copilot (แทรกทุกโมดูล)** | แชทถาม-ตอบโดยรู้บริบทข้อมูลทั้งหมดในแอป, วิเคราะห์ วินิจฉัย เสนอแนวทาง, เลือก Model ผ่าน OpenRouter | ทุกระยะ |

---

## 3. AI Use Cases + การเลือก Model ผ่าน OpenRouter

หลักคิด: **งานต่างชนิด ใช้ Model ต่างกัน เพื่อคุมต้นทุน** — ตั้งค่า default ต่องาน และให้ผู้ใช้ override ได้ในหน้า Settings

| Use Case | ลักษณะงาน | Model แนะนำ (default) | เหตุผล |
|----------|-----------|----------------------|--------|
| วิเคราะห์เปรียบเทียบแปลงที่ดิน / ความเสี่ยง | Reasoning ซับซ้อน + ภาษาไทย | `anthropic/claude-sonnet-4.5` | วิเคราะห์หลายมิติ ภาษาไทยดี |
| อ่านเอกสารสิทธิ์ / โฉนดจากรูปถ่าย | Vision + OCR ไทย | `google/gemini-2.5-flash` | Vision ไทยดี ราคาถูก |
| วิเคราะห์รูปพืช/โรคพืช/สภาพดินจากภาพ | Vision | `google/gemini-2.5-flash` หรือ `openai/gpt-4o-mini` | เร็ว ถูก เพียงพอ |
| สรุป Journal รายสัปดาห์/เดือน | Summarization ปริมาณมาก | `google/gemini-2.5-flash-lite` หรือ `meta-llama/llama-3.3-70b` | งานง่าย เน้นถูก |
| วิเคราะห์ข้อมูล Sensor ย้อนหลัง + เสนอปรับ Automation | Data reasoning | `anthropic/claude-sonnet-4.5` | ต้องการเหตุผลแม่น |
| แชทถาม-ตอบทั่วไป (Copilot) | Conversational | `anthropic/claude-haiku-4.5` (สลับได้) | สมดุลราคา/คุณภาพ |
| วางแผนปลูก/คำนวณปฏิทิน | Structured output (JSON) | `anthropic/claude-sonnet-4.5` + JSON mode | ต้อง parse เข้าระบบ |

**สถาปัตยกรรม AI Layer:**
```
Client → Next.js API Route (/api/ai/[task])
        → Task Router (เลือก model + system prompt ต่องาน)
        → OpenRouter API (streaming)
        → บันทึก usage/cost ลง DB (ติดตามค่าใช้จ่าย AI รายเดือน)
```
- System Prompt ของทุก task ฝัง **บริบทแผนแม่บท** (สรุปย่อ) + ข้อมูลจริงจาก DB (RAG อย่างง่าย: ดึงข้อมูลที่เกี่ยวข้องจาก Supabase มาใส่ prompt — ยังไม่จำเป็นต้องใช้ Vector DB ในเฟสแรก)
- เก็บ API Key ฝั่ง server เท่านั้น (env variable) — ห้าม expose ฝั่ง client

---

## 4. สถาปัตยกรรม IoT / PLC (Smart Farm + Energy)

```
[Sensor/อุปกรณ์ภาคสนาม]                    [Cloud]                    [Web App]
ESP32 + ความชื้นดิน/DHT22 ──┐
HandySense (NECTEC)        ──┤ MQTT (TLS) ──> MQTT Broker ──> Ingest Worker ──> Supabase
ลูกลอย/Ultrasonic ระดับน้ำ  ──┤              (EMQX Cloud                        (time-series)
รีเลย์ปั๊ม/วาล์วไฟฟ้า        ──┘               free tier)   <── คำสั่งควบคุม <── Dashboard/Rules

Solar Inverter (Growatt/Deye) ──> RS485/Modbus ──> Gateway ESP32 ──> MQTT (เส้นทางเดียวกัน)
PLC (ถ้ามีในอนาคต)           ──> Modbus TCP  ──> Node-RED Gateway ──> MQTT
```

**หลักการออกแบบ:**
- **MQTT เป็นภาษากลาง** — ทุกอุปกรณ์คุยผ่าน MQTT topic มาตรฐาน เช่น `farm/zone1/soil_moisture`, `farm/pump1/cmd` ทำให้เพิ่มอุปกรณ์ใหม่ได้โดยไม่แก้แอป
- **Edge ทำงานได้เองเมื่อเน็ตล่ม** — Automation กติกาสำคัญ (เช่น รดน้ำตามความชื้น) ฝังใน ESP32/Node-RED ที่หน้างาน แอปเป็นแค่หน้าจอตั้งค่า+ดูผล → เน็ตบ้านสวนล่มบ่อย ระบบต้องไม่พึ่ง Cloud 100%
- **PLC เป็น optional เฟสท้าย** — สเกล 5 ไร่ พึ่งตนเอง ESP32 + รีเลย์เพียงพอและถูกกว่ามาก (หลักร้อย–พันบาท/จุด) PLC เหมาะเมื่อมีระบบใหญ่ เช่น โรงเรือนควบคุมสภาพแวดล้อมเต็มรูปแบบ
- **HandySense เป็นทางลัด** — เป็น Open Source ของ NECTEC ออกแบบมาเพื่อเกษตรไทยโดยเฉพาะ มี Hardware สำเร็จรูป ต่อ MQTT ได้ ลดเวลาพัฒนา

**ข้อมูล Time-series:** เริ่มด้วยตาราง `sensor_readings` ใน Supabase Postgres + BRIN index (พอสำหรับอ่านทุก 5 นาที × ~20 จุด = ~2 ล้านแถว/ปี) ถ้าโตค่อยย้าย InfluxDB/Timescale

---

## 5. Tech Stack

| ชั้น | เทคโนโลยี | เหตุผล |
|------|-----------|--------|
| Frontend | **Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui** | สอดคล้อง stack ที่ใช้อยู่ (โปรเจกต์ Consonant, AI Coaching PWA) — reuse ความรู้และ component ได้ |
| PWA | next-pwa (installable, offline cache) | ใช้กลางแปลง สัญญาณอ่อน ต้อง offline-first บางส่วน |
| UI ภาษาไทย | ฟอนต์ Noto Sans Thai / Sarabun, ขนาดตัวอักษรปรับได้ | ผู้ใช้สูงวัย |
| Charts | Recharts | Dashboard sensor + งบประมาณ |
| Layout Designer | Konva.js (canvas) หรือ SVG + drag-drop | วาดผังแปลง 5 ไร่ interactive |
| Backend | **Next.js Server Actions / API Routes** | โปรเจกต์คนเดียว ไม่ต้องแยก backend |
| Database + Auth + Storage | **Supabase** (Postgres, RLS, Auth, Storage, Realtime) | ใช้อยู่แล้ว, Realtime ใช้ push ค่า sensor ขึ้นจอสด |
| AI | **OpenRouter API** (streaming, model routing ต่องาน) | ตามโจทย์ — เลือก/สลับ model ได้ |
| IoT Broker | **EMQX Cloud (free tier)** หรือ Mosquitto บน VPS เล็ก | มาตรฐาน MQTT, TLS |
| IoT Ingest | Supabase Edge Function หรือ worker เล็กบน Railway/Fly.io subscribe MQTT → insert DB | สะพาน MQTT → Postgres |
| Edge Device | ESP32 (Arduino/ESP-IDF), HandySense, Node-RED บน Raspberry Pi (gateway/Modbus) | ถูก, ชุมชนไทยใหญ่, ซ่อมเองได้ |
| Energy | Modbus RS485 → ESP32 gateway → MQTT (Growatt/Deye อ่านผ่าน protocol เปิด) | ไม่ผูกกับ cloud ของยี่ห้อ inverter |
| Notifications | **LINE Messaging API (LINE OA)** | คนไทยวัยเกษียณอยู่บน LINE, ต่อยอด LINE OA ที่มีประสบการณ์จาก AgeTech ได้ |
| Hosting | **Vercel** (แอป) + Supabase (ข้อมูล) | ใช้อยู่แล้ว, deploy ง่ายผ่าน Claude Code |
| Dev Workflow | **Claude Code** + GitHub | ตามแนวทางที่ใช้ประจำ |

**ประมาณการค่าใช้จ่ายรายเดือน (ช่วงใช้จริง):** Vercel Hobby ฿0 / Supabase Free–Pro ฿0–900 / EMQX Free ฿0 / OpenRouter ตามการใช้ ~฿100–500 / LINE OA Free tier ฿0 → **รวม ~฿100–1,500/เดือน**

---

## 6. เฟสการพัฒนา Web App (เรียงตามลำดับความจำเป็นในชีวิตจริง)

> หลักการ: **สร้างสิ่งที่ต้องใช้ "ตอนนี้" ก่อน** — ตอนนี้อยู่ระยะหาที่ดิน จึงไม่เริ่มจาก IoT แม้จะดูน่าตื่นเต้นกว่า

### Dev Phase 1 — MVP: เครื่องมือตัดสินใจก่อนซื้อที่ดิน (4–6 สัปดาห์)
**ใช้ทันทีในระยะ 1 ของแผนแม่บท**
- M1 Land Finder: ฐานข้อมูลแปลงที่สนใจ (พิกัด รูป ราคา เอกสารสิทธิ์), Scoring Matrix เปรียบเทียบ (น้ำ ดิน ความเสี่ยง ระยะทาง รพ.), Checklist ตรวจแปลงตามแผนแม่บท
- M2 Budget Tracker (เวอร์ชันแรก): งบ 5 ล้านแตกหมวด + บันทึกจริง
- M9 AI Copilot (เวอร์ชันแรก): แชท + วิเคราะห์แปลงที่ดิน + อ่านรูปโฉนด/แปลง ผ่าน OpenRouter
- Auth (Supabase, 2 users), PWA พื้นฐาน
- **Definition of Done:** พาข้อมูลแปลงจริง ≥ 3 แปลงเข้าระบบ แล้ว AI ช่วยจัดอันดับได้

### Dev Phase 2 — Project OS: บริหารการก่อสร้างและลงมือ (4–6 สัปดาห์)
**ใช้เมื่อได้ที่ดิน เข้าสู่ระยะ 2 (โครงสร้างพื้นฐาน)**
- M2 เต็มรูปแบบ: Timeline 10 Phases, Milestone, Task แจ้งเตือนผ่าน LINE
- M3 Farm Layout Designer: วางผัง 30:30:30:10, คำนวณปริมาตรสระ/ดินถม
- M4 Crop Planner: ปฏิทินปลูกปีที่ 1–2 (ผักอายุสั้น กล้วย ไม้พี่เลี้ยง), ฐานข้อมูลพืช
- M7 Journal (เวอร์ชันแรก): บันทึก + รูปความก้าวหน้า
- AI: สรุปความก้าวหน้ารายสัปดาห์, เตือนงบบานปลาย, แนะนำลำดับงาน

### Dev Phase 3 — Smart Farm: เชื่อม IoT (6–8 สัปดาห์)
**ใช้เมื่อระบบน้ำ/ไฟในแปลงเริ่มติดตั้ง (ปลายระยะ 2 – ระยะ 3)**
- วางโครง MQTT Broker + Ingest pipeline + ตาราง time-series
- M5 Dashboard: ความชื้นดิน (2–4 โซน), ระดับน้ำสระ, อากาศ, สถานะปั๊ม
- ควบคุมปั๊ม/วาล์วจากแอป + Automation Rules (ตั้งกติกาจากแอป, ทำงานที่ Edge)
- แจ้งเตือน LINE เมื่อค่าผิดปกติ (น้ำสระต่ำ, ปั๊มทำงานนานผิดปกติ)
- AI: วิเคราะห์ข้อมูลย้อนหลัง เสนอปรับรอบน้ำ/กติกา automation

### Dev Phase 4 — Energy + Market + Longevity (6–8 สัปดาห์)
**ใช้เมื่อเข้าสู่ระยะ 3–4 (เสถียรภาพ + ชีวิตประจำวัน)**
- M6 Energy: อ่าน inverter ผ่าน Modbus gateway, กราฟผลิต/ใช้/แบต, วิเคราะห์คุ้มค่า
- M8 Harvest & Market: บันทึกผลผลิต ส่วนเกิน รายรับ, ทำเนียบช่องทางขาย
- M7 เต็มรูปแบบ: AI สรุปรายเดือน "สุขภาพฟาร์ม + สุขภาพคน + สุขภาพเงิน" หน้าเดียว
- (Optional) PLC/Node-RED สำหรับโรงเรือน, ผู้ช่วยเสียงภาษาไทยเมื่ออายุมากขึ้น

---

## 7. Data Model หลัก (ย่อ)

```
users, land_candidates (แปลงที่สนใจ + scores + photos)
budget_categories, expenses, phases, tasks, milestones
farm_zones (ผังแปลง), crops, plantings, calendar_events
devices, sensor_readings (time-series), automation_rules, device_commands
energy_readings, journal_entries, harvests, sales, ai_conversations, ai_usage_log
```
ทุกตารางเปิด Row Level Security ผูก user — ข้อมูลเป็นของครอบครัวเท่านั้น

---

## 8. ความเสี่ยงและแนวป้องกัน

| ความเสี่ยง | แนวป้องกัน |
|------------|-----------|
| สร้างฟีเจอร์เกินจำเป็น (over-engineering) | ยึด Dev Phase ตามจังหวะชีวิตจริง — ยังไม่มีที่ดิน ห้ามเขียนโค้ด IoT |
| เน็ตในแปลงไม่เสถียร | Edge-first automation + PWA offline cache + LINE แจ้งเตือนแทนการเฝ้าจอ |
| ค่า AI บานปลาย | Task router เลือก model ถูกสำหรับงานง่าย + log ต้นทุนทุก call + ตั้งเพดานรายเดือน |
| อุปกรณ์ IoT พังกลางสวน | เลือกอุปกรณ์ซ่อมง่าย หาซื้อในไทย (ESP32, HandySense), automation สำคัญไม่พึ่ง cloud |
| ผู้ใช้สูงวัยใช้แอปยาก | UI ไทย ตัวใหญ่ ปุ่มน้อย, หน้าแรกตอบ 3 คำถาม: วันนี้ทำอะไร / ฟาร์มปกติไหม / เงินเป็นอย่างไร |
