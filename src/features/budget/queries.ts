import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { fetchHouseholdId } from "@/lib/household";
import type {
  BudgetCategory,
  ExpenseInput,
  ExpenseWithRelations,
  Household,
  LandOption,
} from "./types";

const EXPENSE_SELECT =
  "*, budget_categories(name), land_candidates(name)";

export async function fetchHousehold(): Promise<Household> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("households")
    .select("id, name, total_budget")
    .single();
  if (error) throw error;
  return data as Household;
}

export async function updateTotalBudget(
  householdId: string,
  totalBudget: number
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("households")
    .update({ total_budget: totalBudget })
    .eq("id", householdId);
  if (error) throw error;
}

export async function fetchCategories(): Promise<BudgetCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("budget_categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data as BudgetCategory[];
}

export async function fetchExpenses(): Promise<ExpenseWithRelations[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(EXPENSE_SELECT)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ExpenseWithRelations[];
}

export async function fetchLandOptions(): Promise<LandOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("land_candidates")
    .select("id, name")
    .order("created_at");
  if (error) throw error;
  return data as LandOption[];
}

async function uploadReceipt(file: File): Promise<string> {
  const supabase = createClient();
  const householdId = await fetchHouseholdId();
  const compressed = await compressImage(file);
  const path = `${householdId}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from("receipts")
    .upload(path, compressed, { contentType: "image/jpeg" });
  if (error) throw error;
  return path;
}

export async function addExpense(input: ExpenseInput): Promise<void> {
  const supabase = createClient();
  const householdId = await fetchHouseholdId();

  const receiptPath = input.receiptFile
    ? await uploadReceipt(input.receiptFile)
    : null;

  const { error } = await supabase.from("expenses").insert({
    household_id: householdId,
    category_id: input.category_id,
    amount: input.amount,
    description: input.description || null,
    expense_date: input.expense_date,
    land_id: input.land_id,
    receipt_photo: receiptPath,
  });
  if (error) throw error;
}

export async function updateExpense(
  id: string,
  input: ExpenseInput,
  existingReceiptPath: string | null
): Promise<void> {
  const supabase = createClient();

  let receiptPath = existingReceiptPath;
  if (input.receiptFile) {
    receiptPath = await uploadReceipt(input.receiptFile);
    if (existingReceiptPath) {
      await supabase.storage.from("receipts").remove([existingReceiptPath]);
    }
  }

  const { error } = await supabase
    .from("expenses")
    .update({
      category_id: input.category_id,
      amount: input.amount,
      description: input.description || null,
      expense_date: input.expense_date,
      land_id: input.land_id,
      receipt_photo: receiptPath,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteExpense(
  id: string,
  receiptPath: string | null
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
  if (receiptPath) {
    await supabase.storage.from("receipts").remove([receiptPath]);
  }
}

export async function updatePlannedAmounts(
  changes: { id: string; planned_amount: number }[]
): Promise<void> {
  const supabase = createClient();
  for (const change of changes) {
    const { error } = await supabase
      .from("budget_categories")
      .update({ planned_amount: change.planned_amount })
      .eq("id", change.id);
    if (error) throw error;
  }
}
