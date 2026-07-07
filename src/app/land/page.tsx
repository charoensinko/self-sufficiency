import type { Metadata } from "next";
import { LandListScreen } from "@/features/land/components/land-list-screen";

export const metadata: Metadata = {
  title: "ที่ดิน",
};

export default function LandPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">แปลงที่ดิน</h1>
      <LandListScreen />
    </main>
  );
}
