"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { ChevronRight, ListTodo, MapPin, Send, Sparkles, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AI_PREFILL_KEY } from "@/lib/constants";
import { formatBaht, formatDateThai, formatNumber } from "@/lib/format";
import { fetchChecklistProgress, fetchLands } from "@/features/land/queries";
import {
  scoreBadgeClass,
  STATUS_LABELS,
  type LandWithScore,
} from "@/features/land/types";
import { fetchExpenses, fetchHousehold } from "@/features/budget/queries";
import type { ExpenseWithRelations, Household } from "@/features/budget/types";

type Progress2 = Map<string, { done: number; total: number }>;

export function DashboardScreen() {
  const router = useRouter();
  const [lands, setLands] = useState<LandWithScore[]>([]);
  const [checklistProgress, setChecklistProgress] = useState<Progress2>(
    new Map()
  );
  const [household, setHousehold] = useState<Household | null>(null);
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [allLands, home, allExpenses] = await Promise.all([
          fetchLands(),
          fetchHousehold(),
          fetchExpenses(),
        ]);
        const progress = await fetchChecklistProgress(
          allLands.map((l) => l.id)
        );
        setLands(allLands);
        setHousehold(home);
        setExpenses(allExpenses);
        setChecklistProgress(progress);
      } catch {
        setError("โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const land of lands) {
      counts.set(land.status, (counts.get(land.status) ?? 0) + 1);
    }
    return counts;
  }, [lands]);

  const topLands = useMemo(
    () =>
      lands
        .filter((land) => land.total_score != null)
        .sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))
        .slice(0, 3),
    [lands]
  );

  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  // งานค้าง: แปลงที่ยังตรวจ checklist ไม่ครบ (ตัดแปลงที่ตัดออก/ซื้อแล้ว)
  // แปลงที่ "ไปดูมาแล้ว" แต่ตรวจไม่ถึง 80% สำคัญสุด ขึ้นก่อน
  const pendingTasks = useMemo(() => {
    return lands
      .filter((land) => land.status !== "rejected" && land.status !== "purchased")
      .map((land) => {
        const progress = checklistProgress.get(land.id) ?? {
          done: 0,
          total: 0,
        };
        const percent =
          progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
        return { land, ...progress, percent };
      })
      .filter((task) => task.total > 0 && task.done < task.total)
      .sort((a, b) => {
        const priorityA = a.land.status === "visited" && a.percent < 80 ? 0 : 1;
        const priorityB = b.land.status === "visited" && b.percent < 80 ? 0 : 1;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return b.percent - a.percent;
      })
      .slice(0, 5);
  }, [lands, checklistProgress]);

  function askAi(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!question.trim()) return;
    sessionStorage.setItem(
      AI_PREFILL_KEY,
      JSON.stringify({ message: question.trim(), task: "chat" })
    );
    router.push("/ai");
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="py-10 text-center text-destructive">
        {error}
      </p>
    );
  }

  const budget = household?.total_budget ?? 0;
  const remaining = budget - totalSpent;
  const usedPercent = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;
  const donutData = [
    { name: "ใช้ไปแล้ว", value: totalSpent },
    { name: "คงเหลือ", value: Math.max(remaining, 0) },
  ];

  return (
    <div className="space-y-4">
      {/* การ์ด 1: แปลงที่ดิน */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" aria-hidden />
              แปลงที่ดิน ({lands.length})
            </span>
            <Link
              href="/land"
              className="flex items-center text-sm font-normal text-primary"
            >
              ดูทั้งหมด
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lands.length === 0 ? (
            <div className="space-y-3 text-center">
              <p className="text-muted-foreground">ยังไม่มีแปลงในระบบ</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/land/new">เพิ่มแปลงแรกของคุณ</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {[...statusCounts.entries()].map(([status, count]) => (
                  <Badge key={status} variant="secondary">
                    {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}{" "}
                    {count}
                  </Badge>
                ))}
              </div>
              {topLands.length > 0 && (
                <ol className="space-y-2">
                  {topLands.map((land, index) => (
                    <li key={land.id}>
                      <Link
                        href={`/land/${land.id}`}
                        className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-muted"
                      >
                        <span className="w-5 text-center text-lg">
                          {["🥇", "🥈", "🥉"][index]}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {land.name}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-sm font-bold",
                            scoreBadgeClass(land.total_score ?? 0)
                          )}
                        >
                          {Math.round(land.total_score ?? 0)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* การ์ด 2: งบประมาณ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Wallet className="size-5 text-primary" aria-hidden />
              งบประมาณ
            </span>
            <Link
              href="/budget"
              className="flex items-center text-sm font-normal text-primary"
            >
              ดูทั้งหมด
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative size-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="68%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={0}
                    isAnimationActive={false}
                  >
                    <Cell fill="var(--chart-1)" />
                    <Cell fill="var(--muted)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{usedPercent}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ใช้ไปแล้ว</span>
                <span className="font-semibold">{formatBaht(totalSpent)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">คงเหลือ</span>
                <span
                  className={cn(
                    "font-semibold",
                    remaining < 0 && "text-destructive"
                  )}
                >
                  {formatBaht(remaining)}
                </span>
              </div>
            </div>
          </div>
          {expenses.length > 0 && (
            <ul className="divide-y border-t pt-1 text-sm">
              {expenses.slice(0, 3).map((expense) => (
                <li
                  key={expense.id}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {expense.description || expense.budget_categories?.name}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatDateThai(expense.expense_date)}
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatNumber(expense.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* การ์ด 3: งานที่ต้องทำ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListTodo className="size-5 text-primary" aria-hidden />
            งานที่ต้องทำ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTasks.length === 0 ? (
            <p className="text-center text-muted-foreground">
              {lands.length === 0
                ? "เพิ่มแปลงที่ดินก่อน แล้วรายการตรวจจะแสดงที่นี่"
                : "ไม่มีงานค้าง 🎉"}
            </p>
          ) : (
            <ul className="space-y-3">
              {pendingTasks.map((task) => (
                <li key={task.land.id}>
                  <Link
                    href={`/land/${task.land.id}`}
                    className="block space-y-1.5 rounded-lg p-2 -mx-2 hover:bg-muted"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {task.land.name}
                      </span>
                      <Badge variant="secondary" className="shrink-0">
                        {STATUS_LABELS[task.land.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={task.percent}
                        className="h-2 flex-1"
                      />
                      <span className="shrink-0 text-sm text-muted-foreground">
                        ตรวจแล้ว {task.done}/{task.total}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* การ์ด 4: ถาม AI */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-primary" aria-hidden />
            ถาม AI ที่ปรึกษา
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={askAi} className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="เช่น แปลงไหนน่าซื้อที่สุด?"
              className="h-12 flex-1 text-base"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="ส่งคำถาม"
              disabled={!question.trim()}
            >
              <Send aria-hidden />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
