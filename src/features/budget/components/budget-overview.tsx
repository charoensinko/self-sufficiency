"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatBaht, formatBahtShort, formatNumber } from "@/lib/format";
import type { CategorySummary } from "../types";

type Totals = {
  budget: number;
  planned: number;
  spent: number;
  remaining: number;
  usedPercent: number;
};

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      {payload[0].name}: {formatBaht(payload[0].value)}
    </div>
  );
}

export function BudgetOverview({
  totals,
  summaries,
}: {
  totals: Totals;
  summaries: CategorySummary[];
}) {
  const donutData = [
    { name: "ใช้ไปแล้ว", value: totals.spent },
    { name: "คงเหลือ", value: Math.max(totals.remaining, 0) },
  ];

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            ภาพรวมงบ {formatBahtShort(totals.budget)}บาท
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mx-auto h-48 w-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="70%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={totals.spent > 0 ? 1 : 0}
                  strokeWidth={0}
                >
                  {/* ใช้ไปแล้ว = เขียว primary, คงเหลือ = เทาจางตั้งใจให้เป็นพื้นหลัง */}
                  <Cell fill="var(--chart-1)" />
                  <Cell fill="var(--muted)" />
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">
                {formatNumber(Math.round(totals.usedPercent))}%
              </span>
              <span className="text-sm text-muted-foreground">ใช้ไปแล้ว</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-muted p-3">
              <div className="text-sm text-muted-foreground">ใช้ไปแล้ว</div>
              <div className="text-lg font-bold">
                {formatBaht(totals.spent)}
              </div>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <div className="text-sm text-muted-foreground">คงเหลือ</div>
              <div
                className={cn(
                  "text-lg font-bold",
                  totals.remaining < 0 && "text-destructive"
                )}
              >
                {formatBaht(totals.remaining)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">รายหมวด</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {summaries.map((summary) => {
            const nearLimit = summary.usedPercent >= 90;
            const overLimit = summary.usedPercent > 100;
            return (
              <div key={summary.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{summary.name}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {formatNumber(summary.spent)} /{" "}
                    {formatNumber(summary.planned_amount)}
                  </span>
                </div>
                <Progress
                  value={Math.min(summary.usedPercent, 100)}
                  className={cn(
                    "h-3",
                    nearLimit && "[&>[data-slot=progress-indicator]]:bg-destructive"
                  )}
                />
                {nearLimit && (
                  <p className="flex items-center gap-1 text-sm font-medium text-destructive">
                    <TriangleAlert className="size-4" aria-hidden />
                    {overLimit
                      ? `เกินแผน ${formatBaht(summary.spent - summary.planned_amount)}`
                      : `ใช้ไปแล้ว ${Math.round(summary.usedPercent)}% ของแผน`}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
