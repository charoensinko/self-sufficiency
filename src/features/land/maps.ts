export type LatLng = { lat: number; lng: number };

const PATTERNS: RegExp[] = [
  /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/, // .../maps/@14.97,102.08,15z
  /[?&]q=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/, // ...?q=14.97,102.08
  /[?&]ll=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/, // ...?ll=14.97,102.08
  /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/, // ...!3d14.97!4d102.08
  /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/, // วางพิกัดตรงๆ "14.97, 102.08"
];

/** ดึง lat/lng จากลิงก์ Google Maps หรือข้อความพิกัด — คืน null ถ้าอ่านไม่ออก */
export function parseGoogleMapsLink(text: string): LatLng | null {
  for (const pattern of PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  }
  return null;
}

/** URL สำหรับ embed แผนที่ใน iframe (ไม่ต้องใช้ API key) */
export function mapEmbedUrl(lat: number, lng: number): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=15&hl=th&output=embed`;
}

/** ลิงก์เปิดแอป Google Maps */
export function mapLinkUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
