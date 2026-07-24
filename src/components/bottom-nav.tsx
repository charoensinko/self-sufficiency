"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MORE_NAV_ITEM,
  NAV_ITEMS,
  isMoreActive,
  isNavActive,
} from "./nav-items";

/** เมนูล่างสำหรับจอเล็ก — จอ ≥1024px ใช้ Sidebar แทน */
export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const tabs = [...NAV_ITEMS, MORE_NAV_ITEM];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === MORE_NAV_ITEM.href
              ? isMoreActive(pathname)
              : isNavActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-6" aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
