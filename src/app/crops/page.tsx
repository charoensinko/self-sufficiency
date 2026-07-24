import type { Metadata } from "next";
import { CropsScreen } from "@/features/crops/components/crops-screen";

export const metadata: Metadata = {
  title: "ปฏิทินปลูก",
};

export default function CropsPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6 lg:max-w-5xl lg:px-8">
      <h1 className="mb-4 text-2xl font-bold">ปฏิทินปลูก</h1>
      <CropsScreen />
    </main>
  );
}
