"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchCategories,
  fetchExpenses,
  fetchHousehold,
  fetchLandOptions,
} from "./queries";
import type {
  BudgetCategory,
  CategorySummary,
  ExpenseWithRelations,
  Household,
  LandOption,
} from "./types";

export function useBudget() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [landOptions, setLandOptions] = useState<LandOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const [home, cats, exps, lands] = await Promise.all([
        fetchHousehold(),
        fetchCategories(),
        fetchExpenses(),
        fetchLandOptions(),
      ]);
      setHousehold(home);
      setCategories(cats);
      setExpenses(exps);
      setLandOptions(lands);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const summaries: CategorySummary[] = useMemo(() => {
    const spentByCategory = new Map<string, number>();
    for (const expense of expenses) {
      spentByCategory.set(
        expense.category_id,
        (spentByCategory.get(expense.category_id) ?? 0) + expense.amount
      );
    }
    return categories.map((category) => {
      const spent = spentByCategory.get(category.id) ?? 0;
      return {
        ...category,
        spent,
        remaining: category.planned_amount - spent,
        usedPercent:
          category.planned_amount > 0
            ? (spent / category.planned_amount) * 100
            : 0,
      };
    });
  }, [categories, expenses]);

  const totals = useMemo(() => {
    const planned = summaries.reduce((sum, s) => sum + s.planned_amount, 0);
    const spent = summaries.reduce((sum, s) => sum + s.spent, 0);
    // ภาพรวมอิงวงเงินรวมของครอบครัว (ปรับได้ในแท็บแผนงบ) ไม่ใช่ผลรวมแผนรายหมวด
    const budget = household?.total_budget ?? planned;
    return {
      budget,
      planned,
      spent,
      remaining: budget - spent,
      usedPercent: budget > 0 ? (spent / budget) * 100 : 0,
    };
  }, [summaries, household]);

  return {
    household,
    categories,
    expenses,
    landOptions,
    summaries,
    totals,
    loading,
    error,
    reload,
  };
}
