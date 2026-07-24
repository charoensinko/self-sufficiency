import {
  Home,
  MapPin,
  Sparkles,
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

export function isNavActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
