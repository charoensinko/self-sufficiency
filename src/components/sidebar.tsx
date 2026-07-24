"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EXTRA_NAV_ITEMS,
  NAV_ITEMS,
  SETTINGS_NAV_ITEM,
  isNavActive,
} from "./nav-items";
import { LogoutButton } from "./logout-button";

/** เมนูซ้ายสำหรับจอ ≥1024px — จอเล็กใช้ BottomNav แทน */
export function Sidebar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const items = [...NAV_ITEMS, ...EXTRA_NAV_ITEMS, SETTINGS_NAV_ITEM];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
      <Link href="/" className="flex items-center gap-3 px-5 py-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary">
          <Sprout className="size-6 text-primary-foreground" aria-hidden />
        </div>
        <div>
          <div className="text-lg font-bold leading-tight">เกษียณสุข</div>
          <div className="text-xs text-muted-foreground">
            สู่วิถีเกษตรพอเพียง
          </div>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-12 items-center gap-3 rounded-lg px-3 text-base font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <LogoutButton />
      </div>
    </aside>
  );
}
