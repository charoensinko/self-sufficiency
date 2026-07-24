export type JournalEntry = {
  id: string;
  entry_date: string;
  content: string;
  photo_paths: string[];
  created_at: string;
};

export type JournalInput = {
  entry_date: string;
  content: string;
};

const monthFormatter = new Intl.DateTimeFormat("th-TH", {
  month: "long",
  year: "numeric",
});

/** หัวข้อกลุ่มรายเดือน เช่น "กรกฎาคม 2569" */
export function formatMonthThai(date: string): string {
  return monthFormatter.format(new Date(date));
}

const dayFormatter = new Intl.DateTimeFormat("th-TH", {
  weekday: "long",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** วันที่พร้อมวันในสัปดาห์ เช่น "วันศุกร์ที่ 24 ก.ค. 2569" */
export function formatDayThai(date: string): string {
  return dayFormatter.format(new Date(date));
}
