"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <WifiOff className="size-16 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-bold">ไม่มีอินเทอร์เน็ต</h1>
      <p className="text-muted-foreground">
        ตอนนี้เชื่อมต่ออินเทอร์เน็ตไม่ได้
        <br />
        กรุณาตรวจสอบสัญญาณแล้วลองใหม่อีกครั้ง
      </p>
      <Button
        onClick={() => {
          // โหลดใหม่ทั้งหน้าเพื่อให้ service worker ลองดึงจากเครือข่ายอีกครั้ง
          window.location.href = "/";
        }}
      >
        ลองใหม่
      </Button>
    </main>
  );
}
