import type { Metadata } from "next";
import { LayoutScreen } from "@/features/layout/components/layout-screen";

export const metadata: Metadata = {
  title: "ผังแปลง",
};

export default function FarmLayoutPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6 lg:max-w-6xl lg:px-8">
      <h1 className="mb-1 text-2xl font-bold">ผังแปลง</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        ทดลองวางโคก หนอง นา ตามสัดส่วน 30:30:30:10 ก่อนลงมือจริง
      </p>
      <LayoutScreen />
    </main>
  );
}
