"use client";

import { useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatBaht } from "@/lib/format";
import { updatePlannedAmounts, updateTotalBudget } from "../queries";
import type { BudgetCategory, Household } from "../types";

export function EditPlan({
  household,
  categories,
  onSaved,
}: {
  household: Household;
  categories: BudgetCategory[];
  onSaved: () => void;
}) {
  const [totalBudget, setTotalBudget] = useState(
    String(household.total_budget)
  );
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      categories.map((c) => [c.id, String(c.planned_amount)])
    )
  );
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categoriesTotal = useMemo(
    () =>
      Object.values(amounts).reduce((sum, value) => {
        const parsed = Number(value);
        return sum + (Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
      }, 0),
    [amounts]
  );

  const parsedBudget = Number(totalBudget);
  const budgetValid = Number.isFinite(parsedBudget) && parsedBudget >= 0;
  const overBudget = budgetValid && categoriesTotal > parsedBudget;
  const underAllocated = budgetValid && categoriesTotal < parsedBudget;

  async function handleSave() {
    setErrorMessage(null);
    if (!budgetValid) {
      setErrorMessage("กรุณาใส่วงเงินรวมเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");
      return;
    }

    const changes = categories
      .map((category) => ({
        id: category.id,
        planned_amount: Number(amounts[category.id]) || 0,
      }))
      .filter(
        (change) =>
          change.planned_amount !==
          categories.find((c) => c.id === change.id)?.planned_amount
      );

    const budgetChanged = parsedBudget !== household.total_budget;

    if (changes.length === 0 && !budgetChanged) {
      toast.info("ไม่มีรายการที่เปลี่ยนแปลง");
      return;
    }

    setSaving(true);
    try {
      if (budgetChanged) {
        await updateTotalBudget(household.id, parsedBudget);
      }
      if (changes.length > 0) {
        await updatePlannedAmounts(changes);
      }
      toast.success("บันทึกแผนงบแล้ว");
      onSaved();
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="total-budget" className="text-base font-semibold">
          วงเงินงบประมาณรวม (บาท)
        </Label>
        <Input
          id="total-budget"
          type="number"
          inputMode="numeric"
          min="0"
          step="10000"
          value={totalBudget}
          onChange={(e) => setTotalBudget(e.target.value)}
          className="h-12 text-base"
        />
        <p className="text-sm text-muted-foreground">
          ปรับเพิ่มหรือลดได้ตามสถานการณ์จริง เช่น มีเงินก้อนเพิ่มหรือต้องรัดเข็มขัด
        </p>
      </div>

      <Separator />

      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => (
          <div key={category.id} className="space-y-2">
            <Label htmlFor={`plan-${category.id}`} className="text-base">
              {category.name}
            </Label>
            <Input
              id={`plan-${category.id}`}
              type="number"
              inputMode="numeric"
              min="0"
              step="1000"
              value={amounts[category.id] ?? ""}
              onChange={(e) =>
                setAmounts((prev) => ({
                  ...prev,
                  [category.id]: e.target.value,
                }))
              }
              className="h-12 text-base"
            />
          </div>
        ))}
      </div>

      <div
        className={cn(
          "rounded-lg p-3 text-center",
          overBudget ? "bg-destructive/10" : "bg-muted"
        )}
      >
        <div className="text-sm text-muted-foreground">
          รวมทุกหมวด (วงเงิน {budgetValid ? formatBaht(parsedBudget) : "—"})
        </div>
        <div
          className={cn(
            "text-lg font-bold",
            overBudget && "text-destructive"
          )}
        >
          {formatBaht(categoriesTotal)}
        </div>
        {overBudget && (
          <p className="mt-1 flex items-center justify-center gap-1 text-sm font-medium text-destructive">
            <TriangleAlert className="size-4" aria-hidden />
            แผนรายหมวดเกินวงเงินอยู่ {formatBaht(categoriesTotal - parsedBudget)}
          </p>
        )}
        {underAllocated && (
          <p className="mt-1 text-sm text-muted-foreground">
            ยังไม่ได้จัดสรรอีก {formatBaht(parsedBudget - categoriesTotal)}
          </p>
        )}
      </div>

      {errorMessage && (
        <p role="alert" className="text-base text-destructive">
          {errorMessage}
        </p>
      )}

      <Button onClick={handleSave} className="w-full" disabled={saving}>
        {saving ? "กำลังบันทึก..." : "บันทึกแผนงบ"}
      </Button>
    </div>
  );
}
