import {
  Hammer,
  Home,
  LandPlot,
  MapPin,
  Menu,
  NotebookPen,
  Settings,
  Sparkles,
  Sprout,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** เมนูหลักชุดเดียว ใช้ทั้ง BottomNav (มือถือ) และ Sidebar (desktop) */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "หน้าหลัก", icon: Home },
  { href: "/land", label: "ที่ดิน", icon: MapPin },
  { href: "/budget", label: "งบประมาณ", icon: Wallet },
  { href: "/ai", label: "AI ที่ปรึกษา", icon: Sparkles },
];

/**
 * โมดูลเพิ่มเติม (Dev Phase 2) — มือถือรวมอยู่ใต้แท็บ "เพิ่มเติม",
 * desktop แสดงตรงๆ ใน Sidebar (เพิ่มรายการที่นี่ที่เดียวขึ้นทั้งสองโหมด)
 */
export const EXTRA_NAV_ITEMS: NavItem[] = [
  { href: "/project", label: "โครงการ", icon: Hammer },
  { href: "/journal", label: "บันทึกประจำวัน", icon: NotebookPen },
  { href: "/crops", label: "ปฏิทินปลูก", icon: Sprout },
  { href: "/layout", label: "ผังแปลง", icon: LandPlot },
];

export const MORE_NAV_ITEM: NavItem = {
  href: "/more",
  label: "เพิ่มเติม",
  icon: Menu,
};

export const SETTINGS_NAV_ITEM: NavItem = {
  href: "/settings",
  label: "ตั้งค่า",
  icon: Settings,
};

export function isNavActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** แท็บ "เพิ่มเติม" (มือถือ) active เมื่ออยู่ในโมดูลเพิ่มเติมหรือหน้าตั้งค่า */
export function isMoreActive(pathname: string): boolean {
  return [MORE_NAV_ITEM, SETTINGS_NAV_ITEM, ...EXTRA_NAV_ITEMS].some((item) =>
    pathname.startsWith(item.href)
  );
}
