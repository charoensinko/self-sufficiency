"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBudget } from "../use-budget";
import { BudgetOverview } from "./budget-overview";
import { EditPlan } from "./edit-plan";
import { ExpenseForm } from "./expense-form";
import { ExpenseList } from "./expense-list";

export function BudgetScreen() {
  const {
    household,
    categories,
    expenses,
    landOptions,
    summaries,
    totals,
    loading,
    error,
    reload,
  } = useBudget();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !household) {
    return (
      <p role="alert" className="py-10 text-center text-destructive">
        {error ?? "โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"}
      </p>
    );
  }

  return (
    <Tabs defaultValue="overview">
      <TabsList className="grid h-12 w-full grid-cols-3">
        <TabsTrigger value="overview" className="text-base">
          ภาพรวม
        </TabsTrigger>
        <TabsTrigger value="record" className="text-base">
          บันทึกรายจ่าย
        </TabsTrigger>
        <TabsTrigger value="plan" className="text-base">
          แผนงบ
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <BudgetOverview totals={totals} summaries={summaries} />
      </TabsContent>

      <TabsContent value="record" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">บันทึกรายจ่ายใหม่</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseForm
              categories={categories}
              landOptions={landOptions}
              onSaved={reload}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">รายการล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseList
              expenses={expenses.slice(0, 10)}
              categories={categories}
              landOptions={landOptions}
              onChanged={reload}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="plan" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">แก้แผนงบต่อหมวด</CardTitle>
          </CardHeader>
          <CardContent>
            <EditPlan
              key={[
                household.total_budget,
                ...categories.map((c) => `${c.id}:${c.planned_amount}`),
              ].join("|")}
              household={household}
              categories={categories}
              onSaved={reload}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
