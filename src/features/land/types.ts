export const LAND_STATUSES = [
  "interested",
  "visited",
  "negotiating",
  "rejected",
  "purchased",
] as const;

export type LandStatus = (typeof LAND_STATUSES)[number];

export const STATUS_LABELS: Record<LandStatus, string> = {
  interested: "สนใจ",
  visited: "ไปดูมาแล้ว",
  negotiating: "กำลังต่อรอง",
  rejected: "ตัดออก",
  purchased: "ซื้อแล้ว",
};

export const DEED_TYPES = [
  "โฉนด (น.ส.4)",
  "น.ส.3ก",
  "น.ส.3",
  "ส.ป.ก. 4-01",
  "อื่นๆ",
] as const;

export const PHOTO_TYPES = [
  { value: "deed", label: "โฉนด/เอกสาร" },
  { value: "land", label: "สภาพแปลง" },
  { value: "water", label: "แหล่งน้ำ" },
  { value: "road", label: "ถนน/ทางเข้า" },
  { value: "other", label: "อื่นๆ" },
] as const;

export type PhotoType = (typeof PHOTO_TYPES)[number]["value"];

export type LandCandidate = {
  id: string;
  household_id: string;
  name: string;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  lat: number | null;
  lng: number | null;
  area_rai: number;
  area_ngan: number;
  area_wa: number;
  price_total: number | null;
  price_per_rai: number | null;
  deed_type: string | null;
  seller_contact: string | null;
  status: LandStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LandPhoto = {
  id: string;
  land_id: string;
  storage_path: string;
  caption: string | null;
  photo_type: PhotoType;
  created_at: string;
};

export const CRITERIA = [
  {
    key: "water_source",
    label: "แหล่งน้ำ",
    shortLabel: "น้ำ",
    weight: 20,
    levels: [
      "ไม่มีแหล่งน้ำ ต้องพึ่งฝนอย่างเดียว",
      "มีน้ำบางฤดู หน้าแล้งขาดน้ำ",
      "มีบ่อ/บาดาลใช้ได้ แต่ต้องลงทุนเพิ่ม",
      "มีแหล่งน้ำผิวดินใกล้ + บาดาลดี",
      "ติดคลอง/แหล่งน้ำถาวร น้ำพอทั้งปี",
    ],
  },
  {
    key: "soil_quality",
    label: "คุณภาพดิน",
    shortLabel: "ดิน",
    weight: 15,
    levels: [
      "ดินเสื่อม/เค็ม/มีชั้นดาน ปลูกยาก",
      "ดินปนทรายจัด ต้องปรับปรุงมาก",
      "ปานกลาง ปรับปรุงได้ตามปกติ",
      "ดินร่วนดี อินทรียวัตถุพอใช้",
      "ดินอุดมสมบูรณ์ ปลูกได้ทันที",
    ],
  },
  {
    key: "flood_risk",
    label: "ความปลอดภัยน้ำท่วม/ภัยพิบัติ",
    shortLabel: "ปลอดภัย",
    weight: 15,
    levels: [
      "ท่วมซ้ำซาก/พื้นที่เสี่ยงสูง",
      "เคยท่วมใหญ่ในรอบ 10 ปี",
      "เสี่ยงต่ำ มีทางระบายน้ำ",
      "ไม่เคยท่วม พื้นที่ค่อนข้างสูง",
      "ปลอดภัยมาก สูงกว่ารอบข้างชัดเจน",
    ],
  },
  {
    key: "road_access",
    label: "ถนน/การเข้าถึง",
    shortLabel: "ถนน",
    weight: 10,
    levels: [
      "ไม่มีทางเข้าสาธารณะ/ผ่านที่เอกชน",
      "ทางลูกรังแคบ หน้าฝนลำบาก",
      "ลูกรังใช้ได้ทั้งปี",
      "ถนนลาดยางอยู่ใกล้ เข้าสะดวก",
      "ติดถนนลาดยาง/คอนกรีต",
    ],
  },
  {
    key: "electricity",
    label: "ไฟฟ้าถึงแปลง",
    shortLabel: "ไฟฟ้า",
    weight: 10,
    levels: [
      "ไกลเสาไฟมาก (เกิน 1 กม.)",
      "ต้องขยายเขตหลายต้น ค่าใช้จ่ายสูง",
      "เสาไฟใกล้ ขยายเล็กน้อย",
      "ไฟฟ้าถึงขอบแปลงแล้ว",
      "มีมิเตอร์/ไฟเข้าในแปลงแล้ว",
    ],
  },
  {
    key: "hospital_distance",
    label: "ใกล้โรงพยาบาล",
    shortLabel: "รพ.",
    weight: 10,
    levels: [
      "เกิน 60 นาทีถึงโรงพยาบาล",
      "45-60 นาที",
      "30-45 นาที",
      "15-30 นาที",
      "ไม่เกิน 15 นาทีถึงโรงพยาบาล",
    ],
  },
  {
    key: "community",
    label: "ชุมชน/ตลาด",
    shortLabel: "ชุมชน",
    weight: 10,
    levels: [
      "ห่างไกลมาก ไม่มีตลาด",
      "มีร้านค้าเล็กน้อย ไกลตลาด",
      "มีตลาดนัดในระยะไปสะดวก",
      "ใกล้ชุมชน/ตลาดสด",
      "ใกล้ตลาดและชุมชนดี มีเพื่อนบ้านช่วยเหลือ",
    ],
  },
  {
    key: "price_value",
    label: "ความคุ้มราคา",
    shortLabel: "คุ้มราคา",
    weight: 10,
    levels: [
      "แพงกว่าราคาตลาดมาก",
      "แพงกว่าตลาดเล็กน้อย",
      "ตามราคาตลาด",
      "ถูกกว่าตลาด/ต่อรองได้",
      "ถูกมาก คุ้มค่าที่สุด",
    ],
  },
] as const;

export type CriterionKey = (typeof CRITERIA)[number]["key"];

export type ScoreValues = Record<CriterionKey, number>;

export type LandScore = ScoreValues & {
  id: string;
  land_id: string;
  total_score: number;
  scored_at: string;
};

export type LandWithScore = LandCandidate & {
  total_score: number | null;
};

export type LandDetail = LandCandidate & {
  land_photos: LandPhoto[];
  land_scores: LandScore | null;
};

export type ChecklistTemplate = {
  id: string;
  category: string;
  item: string;
  description: string | null;
  sort_order: number;
};

/** สถานะ checklist ต่อแปลง = template + ค่าที่ติ๊ก/โน้ตไว้ (ถ้ายังไม่เคยติ๊กจะไม่มีแถวใน DB) */
export type ChecklistItemState = {
  template: ChecklistTemplate;
  checked: boolean;
  note: string;
};

/** เนื้อที่รวมเป็นไร่ (1 ไร่ = 4 งาน = 400 ตร.วา) */
export function totalAreaRai(land: {
  area_rai: number;
  area_ngan: number;
  area_wa: number;
}): number {
  return land.area_rai + land.area_ngan / 4 + land.area_wa / 400;
}

/** ข้อความเนื้อที่แบบไทย เช่น "5 ไร่ 2 งาน 50 ตร.วา" */
export function formatArea(land: {
  area_rai: number;
  area_ngan: number;
  area_wa: number;
}): string {
  const parts: string[] = [];
  if (land.area_rai > 0) parts.push(`${land.area_rai} ไร่`);
  if (land.area_ngan > 0) parts.push(`${land.area_ngan} งาน`);
  if (land.area_wa > 0) parts.push(`${land.area_wa} ตร.วา`);
  return parts.length > 0 ? parts.join(" ") : "ไม่ระบุ";
}

/** คะแนนรวมถ่วงน้ำหนักสเกล 0-100 (สูตรเดียวกับ generated column ใน DB) */
export function computeTotalScore(values: ScoreValues): number {
  const sum = CRITERIA.reduce(
    (acc, criterion) => acc + values[criterion.key] * (criterion.weight / 100),
    0
  );
  return Math.round(sum * 20 * 10) / 10;
}

/** สีป้ายคะแนน: เขียว ≥75, เหลือง 50-74, แดง <50 */
export function scoreBadgeClass(score: number): string {
  if (score >= 75) return "bg-green-600 text-white";
  if (score >= 50) return "bg-amber-500 text-white";
  return "bg-red-600 text-white";
}
