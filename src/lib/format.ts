const bahtFormatter = new Intl.NumberFormat("th-TH", {
  maximumFractionDigits: 0,
});

export function formatBaht(amount: number): string {
  return `${bahtFormatter.format(amount)} บาท`;
}

export function formatNumber(amount: number): string {
  return bahtFormatter.format(amount);
}

/** รูปแบบย่อสำหรับพื้นที่จำกัด เช่น "1.8 ล้าน" */
export function formatBahtShort(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `${bahtFormatter.format(Math.round(millions * 100) / 100)} ล้าน`;
  }
  return bahtFormatter.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** วันที่แบบไทย พ.ศ. เช่น "7 ก.ค. 2569" */
export function formatDateThai(date: string | Date): string {
  return dateFormatter.format(typeof date === "string" ? new Date(date) : date);
}

/** ค่าวันนี้สำหรับ input[type=date] (YYYY-MM-DD ตามเวลาท้องถิ่น) */
export function todayInputValue(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
