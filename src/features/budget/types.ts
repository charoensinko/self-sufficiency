export type BudgetCategory = {
  id: string;
  household_id: string;
  name: string;
  planned_amount: number;
  sort_order: number;
};

export type Expense = {
  id: string;
  household_id: string;
  category_id: string;
  amount: number;
  description: string | null;
  expense_date: string;
  land_id: string | null;
  receipt_photo: string | null;
  created_at: string;
};

export type ExpenseWithRelations = Expense & {
  budget_categories: { name: string } | null;
  land_candidates: { name: string } | null;
};

export type ExpenseInput = {
  amount: number;
  category_id: string;
  description: string;
  expense_date: string;
  land_id: string | null;
  /** ไฟล์ใบเสร็จใหม่ (ถ้ามี) — จะถูกบีบอัดและอัปโหลดให้ */
  receiptFile: File | null;
};

export type CategorySummary = BudgetCategory & {
  spent: number;
  remaining: number;
  usedPercent: number;
};

export type LandOption = {
  id: string;
  name: string;
};

export type Household = {
  id: string;
  name: string;
  total_budget: number;
};
