"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Wallet, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "หน้าหลัก", icon: Home },
  { href: "/land", label: "ที่ดิน", icon: MapPin },
  { href: "/budget", label: "งบประมาณ", icon: Wallet },
  { href: "/ai", label: "AI ที่ปรึกษา", icon: Sparkles },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
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
