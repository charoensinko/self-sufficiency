export type ZoneKind = "pond" | "field" | "khok" | "garden" | "house" | "road";

/**
 * องค์ประกอบบนผัง — พิกัด/ขนาดเป็น "เมตร" ทั้งหมด (SVG viewBox = ขนาดแปลงจริง)
 * depth_m: สระ = ความลึกน้ำ, โคก = ความสูงดินถม (ใช้คำนวณปริมาตร)
 */
export type LayoutElement = {
  id: string;
  kind: ZoneKind;
  x: number;
  y: number;
  w: number;
  h: number;
  depth_m?: number;
};

export type FarmLayout = {
  id: string;
  name: string;
  land_candidate_id: string | null;
  width_m: number;
  height_m: number;
  elements: LayoutElement[];
  notes: string | null;
  /** รูปพื้นหลัง (โฉนด/ภาพดาวเทียม/สเก็ตช์) ใน bucket layout-images */
  bg_image_path: string | null;
  /** ความกว้างที่รูปแสดงบน canvas (เมตร) — ตั้งจากเส้นอ้างอิง */
  bg_width_m: number | null;
  /** เนื้อที่จริงตามโฉนด — ถ้ากรอกไว้ใช้เป็นตัวหาร % แทน กว้าง×ยาว */
  deed_rai: number | null;
  deed_ngan: number | null;
  deed_wa: number | null;
};

export type LayoutDraft = Omit<FarmLayout, "id">;

/** เนื้อที่โฉนดเป็น ตร.ม. (1 ไร่ = 4 งาน = 400 ตร.วา = 1,600 ตร.ม.) — null ถ้าไม่ได้กรอก */
export function deedAreaSqm(
  layout: Pick<LayoutDraft, "deed_rai" | "deed_ngan" | "deed_wa">
): number | null {
  const rai = layout.deed_rai ?? 0;
  const ngan = layout.deed_ngan ?? 0;
  const wa = layout.deed_wa ?? 0;
  const sqm = (rai + ngan / 4 + wa / 400) * 1600;
  return sqm > 0 ? sqm : null;
}

/** กลุ่มสัดส่วนตามหลัก 30:30:30:10 */
export type ZoneGroup = "water" | "rice" | "forest" | "living";

export const ZONE_CONFIG: Record<
  ZoneKind,
  {
    label: string;
    group: ZoneGroup;
    fill: string;
    stroke: string;
    shape: "ellipse" | "rect";
    defaultSize: { w: number; h: number };
    defaultDepth?: number;
  }
> = {
  pond: {
    label: "หนอง/สระน้ำ",
    group: "water",
    fill: "#93c5fd",
    stroke: "#2563eb",
    shape: "ellipse",
    defaultSize: { w: 40, h: 30 },
    defaultDepth: 4,
  },
  field: {
    label: "นาข้าว",
    group: "rice",
    fill: "#d9f99d",
    stroke: "#65a30d",
    shape: "rect",
    defaultSize: { w: 40, h: 30 },
  },
  khok: {
    label: "โคก (ป่า 3 อย่าง)",
    group: "forest",
    fill: "#6ee7b7",
    stroke: "#047857",
    shape: "rect",
    defaultSize: { w: 35, h: 25 },
    defaultDepth: 1.5,
  },
  garden: {
    label: "แปลงผัก/สวน",
    group: "forest",
    fill: "#bbf7d0",
    stroke: "#16a34a",
    shape: "rect",
    defaultSize: { w: 20, h: 15 },
  },
  house: {
    label: "บ้าน/ที่อยู่",
    group: "living",
    fill: "#fdba74",
    stroke: "#c2410c",
    shape: "rect",
    defaultSize: { w: 12, h: 10 },
  },
  road: {
    label: "ถนน/ลาน",
    group: "living",
    fill: "#e7e5e4",
    stroke: "#78716c",
    shape: "rect",
    defaultSize: { w: 30, h: 5 },
  },
};

export const ZONE_KINDS = Object.keys(ZONE_CONFIG) as ZoneKind[];

export const GROUP_CONFIG: Record<
  ZoneGroup,
  { label: string; targetPercent: number; color: string }
> = {
  water: { label: "น้ำ (หนอง/สระ)", targetPercent: 30, color: "#2563eb" },
  rice: { label: "นาข้าว", targetPercent: 30, color: "#65a30d" },
  forest: { label: "ป่า/สวน (โคก+แปลงผัก)", targetPercent: 30, color: "#047857" },
  living: { label: "ที่อยู่อาศัย/ถนน", targetPercent: 10, color: "#c2410c" },
};

export const ZONE_GROUPS = Object.keys(GROUP_CONFIG) as ZoneGroup[];

/** พื้นที่องค์ประกอบ (ตร.ม.) — สระเป็นวงรีใช้ π/4·กว้าง·ยาว */
export function elementArea(element: LayoutElement): number {
  const box = element.w * element.h;
  return ZONE_CONFIG[element.kind].shape === "ellipse"
    ? (Math.PI / 4) * box
    : box;
}

export type LayoutStats = {
  plotArea: number;
  /** true = ใช้เนื้อที่โฉนดเป็นตัวหาร (ไม่ใช่ กว้าง×ยาว ของ canvas) */
  fromDeed: boolean;
  groups: {
    group: ZoneGroup;
    area: number;
    percent: number;
    targetPercent: number;
  }[];
  usedPercent: number;
  pondVolume: number;
  khokFillVolume: number;
};

export function computeStats(
  widthM: number,
  heightM: number,
  elements: LayoutElement[],
  deedSqm?: number | null
): LayoutStats {
  const plotArea = deedSqm ?? widthM * heightM;
  const areaByGroup = new Map<ZoneGroup, number>();
  let pondVolume = 0;
  let khokFillVolume = 0;

  for (const element of elements) {
    const config = ZONE_CONFIG[element.kind];
    const area = elementArea(element);
    areaByGroup.set(config.group, (areaByGroup.get(config.group) ?? 0) + area);
    if (element.kind === "pond") {
      pondVolume += area * (element.depth_m ?? 4);
    }
    if (element.kind === "khok") {
      khokFillVolume += area * (element.depth_m ?? 1.5);
    }
  }

  const groups = ZONE_GROUPS.map((group) => {
    const area = areaByGroup.get(group) ?? 0;
    return {
      group,
      area,
      percent: plotArea > 0 ? (area / plotArea) * 100 : 0,
      targetPercent: GROUP_CONFIG[group].targetPercent,
    };
  });

  return {
    plotArea,
    fromDeed: deedSqm != null,
    groups,
    usedPercent: groups.reduce((sum, g) => sum + g.percent, 0),
    pondVolume,
    khokFillVolume,
  };
}

/** แปลง ตร.ม. เป็นไร่ (1 ไร่ = 1,600 ตร.ม.) */
export function sqmToRai(sqm: number): number {
  return sqm / 1600;
}

/** ผังตัวอย่างตามสัดส่วน 30:30:30:10 สำหรับแปลง 100×80 ม. (ปรับต่อได้) */
export function starterElements(widthM: number, heightM: number): LayoutElement[] {
  // สัดส่วนอิงขนาดแปลง — วางน้ำล่างซ้าย นาล่างขวา โคกบนซ้าย สวนบนกลาง บ้าน+ถนนบนขวา
  const w = widthM;
  const h = heightM;
  return [
    {
      id: crypto.randomUUID(),
      kind: "pond",
      x: w * 0.02,
      y: h * 0.4,
      w: w * 0.55,
      h: h * 0.56,
      depth_m: 4,
    },
    {
      id: crypto.randomUUID(),
      kind: "field",
      x: w * 0.62,
      y: h * 0.4,
      w: w * 0.36,
      h: h * 0.56,
    },
    {
      id: crypto.randomUUID(),
      kind: "khok",
      x: w * 0.02,
      y: h * 0.03,
      w: w * 0.4,
      h: h * 0.32,
      depth_m: 1.5,
    },
    {
      id: crypto.randomUUID(),
      kind: "garden",
      x: w * 0.45,
      y: h * 0.03,
      w: w * 0.24,
      h: h * 0.3,
    },
    {
      id: crypto.randomUUID(),
      kind: "house",
      x: w * 0.74,
      y: h * 0.05,
      w: w * 0.12,
      h: h * 0.15,
    },
    {
      id: crypto.randomUUID(),
      kind: "road",
      x: w * 0.74,
      y: h * 0.24,
      w: w * 0.24,
      h: h * 0.08,
    },
  ];
}
