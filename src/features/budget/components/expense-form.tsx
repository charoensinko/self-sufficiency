"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { todayInputValue } from "@/lib/format";
import { addExpense, updateExpense } from "../queries";
import type {
  BudgetCategory,
  ExpenseWithRelations,
  LandOption,
} from "../types";

const NO_LAND = "none";

export function ExpenseForm({
  categories,
  landOptions,
  editing,
  onSaved,
}: {
  categories: BudgetCategory[];
  landOptions: LandOption[];
  /** ถ้ามีค่า = โหมดแก้ไขรายการเดิม */
  editing?: ExpenseWithRelations;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(
    editing ? String(editing.amount) : ""
  );
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [expenseDate, setExpenseDate] = useState(
    editing?.expense_date ?? todayInputValue()
  );
  const [landId, setLandId] = useState(editing?.land_id ?? NO_LAND);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("กรุณาใส่จำนวนเงินเป็นตัวเลขมากกว่า 0");
      return;
    }
    if (!categoryId) {
      setErrorMessage("กรุณาเลือกหมวดค่าใช้จ่าย");
      return;
    }

    setSaving(true);
    try {
      const input = {
        amount: parsedAmount,
        category_id: categoryId,
        description: description.trim(),
        expense_date: expenseDate,
        land_id: landId === NO_LAND ? null : landId,
        receiptFile,
      };
      if (editing) {
        await updateExpense(editing.id, input, editing.receipt_photo);
        toast.success("แก้ไขรายการแล้ว");
      } else {
        await addExpense(input);
        toast.success("บันทึกรายจ่ายแล้ว");
        setAmount("");
        setDescription("");
        setReceiptFile(null);
        setLandId(NO_LAND);
      }
      onSaved();
    } catch {
      setErrorMessage("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-base">
          จำนวนเงิน (บาท)
        </Label>
        <Input
          id="amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-12 text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-base">หมวด</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="h-12 w-full text-base">
            <SelectValue placeholder="เลือกหมวดค่าใช้จ่าย" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem
                key={category.id}
                value={category.id}
                className="min-h-12 text-base"
              >
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-base">
          รายละเอียด
        </Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="เช่น ค่ามัดจำที่ดิน"
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expense-date" className="text-base">
          วันที่จ่าย
        </Label>
        <Input
          id="expense-date"
          type="date"
          required
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          className="h-12 text-base"
        />
      </div>

      {landOptions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base">ผูกกับแปลงที่ดิน (ถ้ามี)</Label>
          <Select value={landId} onValueChange={setLandId}>
            <SelectTrigger className="h-12 w-full text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_LAND} className="min-h-12 text-base">
                ไม่ผูกกับแปลง
              </SelectItem>
              {landOptions.map((land) => (
                <SelectItem
                  key={land.id}
                  value={land.id}
                  className="min-h-12 text-base"
                >
                  {land.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="receipt" className="text-base">
          รูปใบเสร็จ (ถ้ามี)
        </Label>
        <Input
          id="receipt"
          type="file"
          accept="image/*"
          onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
          className="h-12 pt-2.5 text-base file:text-sm"
        />
        {editing?.receipt_photo && !receiptFile && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Paperclip className="size-4" aria-hidden />
            มีใบเสร็จแนบอยู่แล้ว — เลือกไฟล์ใหม่ถ้าต้องการเปลี่ยน
          </p>
        )}
      </div>

      {errorMessage && (
        <p role="alert" className="text-base text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving
          ? "กำลังบันทึก..."
          : editing
            ? "บันทึกการแก้ไข"
            : "บันทึกรายจ่าย"}
      </Button>
    </form>
  );
}
