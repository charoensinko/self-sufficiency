export type CropCategory =
  | "ผักสวนครัว"
  | "สมุนไพร-เครื่องแกง"
  | "ไม้ผล"
  | "ไม้พี่เลี้ยง-ยืนต้น"
  | "ข้าว"
  | "ปุ๋ยพืชสด";

export const CROP_CATEGORIES: CropCategory[] = [
  "ผักสวนครัว",
  "สมุนไพร-เครื่องแกง",
  "ไม้ผล",
  "ไม้พี่เลี้ยง-ยืนต้น",
  "ข้าว",
  "ปุ๋ยพืชสด",
];

export type WaterNeed = "น้อย" | "ปานกลาง" | "มาก";

export const WATER_NEEDS: WaterNeed[] = ["น้อย", "ปานกลาง", "มาก"];

export type Crop = {
  id: string;
  name: string;
  category: CropCategory;
  days_to_harvest: number | null;
  spacing: string | null;
  water_need: WaterNeed;
  planting_months: number[];
  notes: string | null;
};

export type CropInput = {
  name: string;
  category: CropCategory;
  days_to_harvest: number | null;
  spacing: string | null;
  water_need: WaterNeed;
  planting_months: number[];
  notes: string | null;
};

export type PlantingStatus = "planned" | "planted" | "harvested" | "cancelled";

export const PLANTING_STATUS_LABELS: Record<PlantingStatus, string> = {
  planned: "วางแผนไว้",
  planted: "ปลูกแล้ว",
  harvested: "เก็บเกี่ยวแล้ว",
  cancelled: "ยกเลิก",
};

export type Planting = {
  id: string;
  crop_id: string;
  zone: string | null;
  quantity: string | null;
  planned_date: string | null;
  planted_date: string | null;
  expected_harvest_date: string | null;
  status: PlantingStatus;
  notes: string | null;
};

export type PlantingWithCrop = Planting & {
  crops: Pick<Crop, "name" | "category" | "days_to_harvest"> | null;
};

export type PlantingInput = {
  crop_id: string;
  zone: string | null;
  quantity: string | null;
  planned_date: string | null;
  planted_date: string | null;
  status: PlantingStatus;
  notes: string | null;
};

export const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

export const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/** เดือนที่เหมาะปลูกแบบอ่านง่าย เช่น "พ.ค.–ก.ค." หรือ "ทั้งปี" */
export function formatPlantingMonths(months: number[]): string {
  if (months.length === 0) return "ทั้งปี";
  return [...months]
    .sort((a, b) => a - b)
    .map((m) => THAI_MONTHS_SHORT[m - 1])
    .join(" ");
}

/** วันคาดเก็บเกี่ยว = วันปลูกจริง (หรือวันตามแผน) + อายุเก็บเกี่ยว */
export function computeExpectedHarvest(
  input: Pick<PlantingInput, "planted_date" | "planned_date">,
  daysToHarvest: number | null
): string | null {
  const base = input.planted_date ?? input.planned_date;
  if (!base || daysToHarvest == null) return null;
  const date = new Date(base);
  date.setDate(date.getDate() + daysToHarvest);
  return date.toISOString().slice(0, 10);
}
