"use client";

import { useState } from "react";
import { MapPin, Paperclip, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBaht, formatDateThai } from "@/lib/format";
import { deleteExpense } from "../queries";
import { ExpenseForm } from "./expense-form";
import type {
  BudgetCategory,
  ExpenseWithRelations,
  LandOption,
} from "../types";

export function ExpenseList({
  expenses,
  categories,
  landOptions,
  onChanged,
}: {
  expenses: ExpenseWithRelations[];
  categories: BudgetCategory[];
  landOptions: LandOption[];
  onChanged: () => void;
}) {
  const [editingExpense, setEditingExpense] =
    useState<ExpenseWithRelations | null>(null);
  const [deletingExpense, setDeletingExpense] =
    useState<ExpenseWithRelations | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deletingExpense) return;
    setDeleting(true);
    try {
      await deleteExpense(deletingExpense.id, deletingExpense.receipt_photo);
      toast.success("ลบรายการแล้ว");
      setDeletingExpense(null);
      onChanged();
    } catch {
      toast.error("ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDeleting(false);
    }
  }

  if (expenses.length === 0) {
    return (
      <p className="py-6 text-center text-muted-foreground">
        ยังไม่มีรายการรายจ่าย
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y">
        {expenses.map((expense) => (
          <li key={expense.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">
                {expense.description || expense.budget_categories?.name}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <span>{expense.budget_categories?.name}</span>
                <span>·</span>
                <span>{formatDateThai(expense.expense_date)}</span>
                {expense.land_candidates && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="size-3.5" aria-hidden />
                    {expense.land_candidates.name}
                  </span>
                )}
                {expense.receipt_photo && (
                  <Paperclip className="size-3.5" aria-hidden />
                )}
              </div>
            </div>
            <span className="shrink-0 font-semibold">
              {formatBaht(expense.amount)}
            </span>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="แก้ไขรายการ"
                onClick={() => setEditingExpense(expense)}
              >
                <Pencil aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="ลบรายการ"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeletingExpense(expense)}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={editingExpense !== null}
        onOpenChange={(open) => !open && setEditingExpense(null)}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขรายจ่าย</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              key={editingExpense.id}
              categories={categories}
              landOptions={landOptions}
              editing={editingExpense}
              onSaved={() => {
                setEditingExpense(null);
                onChanged();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletingExpense !== null}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ลบรายการนี้หรือไม่</DialogTitle>
            <DialogDescription className="text-base">
              {deletingExpense &&
                `${deletingExpense.description || deletingExpense.budget_categories?.name} จำนวน ${formatBaht(deletingExpense.amount)}`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeletingExpense(null)}
              disabled={deleting}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "กำลังลบ..." : "ลบรายการ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
