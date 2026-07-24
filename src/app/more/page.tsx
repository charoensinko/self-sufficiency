import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  EXTRA_NAV_ITEMS,
  SETTINGS_NAV_ITEM,
} from "@/components/nav-items";

export const metadata: Metadata = {
  title: "เพิ่มเติม",
};

/** รวมโมดูลเพิ่มเติมสำหรับมือถือ — desktop เห็นทุกเมนูใน Sidebar อยู่แล้ว */
export default function MorePage() {
  const items = [...EXTRA_NAV_ITEMS, SETTINGS_NAV_ITEM];

  return (
    <main className="mx-auto max-w-lg px-4 py-6 lg:max-w-3xl lg:px-8">
      <h1 className="mb-4 text-2xl font-bold">เพิ่มเติม</h1>
      <div className="space-y-3">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="block">
            <Card className="flex flex-row items-center gap-4 p-4 transition-colors hover:bg-muted/50">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="size-6 text-primary" aria-hidden />
              </div>
              <span className="flex-1 text-lg font-medium">{label}</span>
              <ChevronRight
                className="size-5 text-muted-foreground"
                aria-hidden
              />
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
