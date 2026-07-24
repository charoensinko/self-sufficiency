import type { Metadata } from "next";
import { BudgetScreen } from "@/features/budget/components/budget-screen";

export const metadata: Metadata = {
  title: "งบประมาณ",
};

export default function BudgetPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6 lg:max-w-3xl lg:px-8">
      <h1 className="mb-4 text-2xl font-bold">งบประมาณ</h1>
      <BudgetScreen />
    </main>
  );
}
