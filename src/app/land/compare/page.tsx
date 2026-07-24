import type { Metadata } from "next";
import { CompareScreen } from "@/features/land/components/compare-screen";

export const metadata: Metadata = {
  title: "เปรียบเทียบแปลง",
};

export default function ComparePage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6 lg:max-w-5xl lg:px-8">
      <CompareScreen />
    </main>
  );
}
