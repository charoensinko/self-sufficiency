"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** เว้นที่ให้ BottomNav (มือถือ) / Sidebar (desktop) — ยกเว้นหน้า login ที่ไม่มีเมนู */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <div className={cn(!isLogin && "pb-20 lg:pb-0 lg:pl-60")}>{children}</div>
  );
}
