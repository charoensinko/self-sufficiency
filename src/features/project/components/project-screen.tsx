"use client";

import Link from "next/link";
import { AlarmClock, Check, ChevronRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useProject } from "../use-project";
import { PHASE_STATUS_LABELS } from "../types";
import type { PhaseWithProgress } from "../types";

function statusBadgeVariant(status: PhaseWithProgress["status"]) {
  if (status === "done") return "default" as const;
  if (status === "in_progress") return "outline" as const;
  return "secondary" as const;
}

export function ProjectScreen() {
  const { phasesWithProgress, totals, loading, error } = useProject();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-96 w-full" />
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

  return (
    <div className="space-y-4">
      {/* ภาพรวมทั้งโครงการ */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="font-medium">ความคืบหน้าทั้งโครงการ</span>
            <span className="text-lg font-bold">
              {totals.done}/{totals.total} งาน
            </span>
          </div>
          <Progress value={totals.percent} className="h-3" />
          {(totals.overdueCount > 0 || totals.dueSoonCount > 0) && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <AlarmClock className="size-4 text-muted-foreground" aria-hidden />
              {totals.overdueCount > 0 && (
                <Badge variant="destructive">
                  เลยกำหนด {totals.overdueCount} งาน
                </Badge>
              )}
              {totals.dueSoonCount > 0 && (
                <Badge variant="secondary">
                  ใกล้ถึงกำหนด {totals.dueSoonCount} งาน
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline 10 เฟส — desktop แบ่งครึ่งเป็น 2 คอลัมน์ให้เห็นครบจอเดียว */}
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0">
        {[
          phasesWithProgress.slice(0, Math.ceil(phasesWithProgress.length / 2)),
          phasesWithProgress.slice(Math.ceil(phasesWithProgress.length / 2)),
        ].map((column, colIndex, columns) => (
        <ol key={colIndex} className="relative space-y-3">
        {column.map((phase, index) => {
          const lastInColumn = index === column.length - 1;
          const isLast = colIndex === columns.length - 1 && lastInColumn;
          return (
            <li key={phase.id} className="relative flex gap-3">
              {/* เส้นเชื่อม timeline — ท้ายคอลัมน์ซ่อนบน desktop แต่มือถือยังเชื่อมข้ามช่วง */}
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-5 top-12 -bottom-3 w-0.5 bg-border",
                    lastInColumn && "lg:hidden"
                  )}
                />
              )}
              <span
                aria-hidden
                className={cn(
                  "relative z-10 mt-4 flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold",
                  phase.status === "done"
                    ? "border-primary bg-primary text-primary-foreground"
                    : phase.status === "in_progress"
                      ? "border-primary bg-background text-primary"
                      : "border-border bg-muted text-muted-foreground"
                )}
              >
                {phase.status === "done" ? (
                  <Check className="size-5" />
                ) : (
                  phase.sort_order
                )}
              </span>
              <Link href={`/project/${phase.id}`} className="min-w-0 flex-1">
                <Card
                  className={cn(
                    "transition-colors hover:bg-muted/50",
                    phase.status === "in_progress" && "border-primary"
                  )}
                >
                  <CardContent className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug">
                          {phase.name}
                        </p>
                        {phase.duration_weeks != null && (
                          <p className="text-sm text-muted-foreground">
                            ประมาณ {phase.duration_weeks} สัปดาห์
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Badge variant={statusBadgeVariant(phase.status)}>
                          {PHASE_STATUS_LABELS[phase.status]}
                        </Badge>
                        <ChevronRight
                          className="size-5 text-muted-foreground"
                          aria-hidden
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={phase.percent} className="h-2 flex-1" />
                      <span className="shrink-0 text-sm text-muted-foreground">
                        {phase.doneTasks}/{phase.totalTasks} งาน
                      </span>
                    </div>
                    {phase.totalMilestones > 0 && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star
                          className="size-4 fill-amber-400 text-amber-400"
                          aria-hidden
                        />
                        เป้าหมายสำคัญ {phase.doneMilestones}/
                        {phase.totalMilestones}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </li>
          );
        })}
        </ol>
        ))}
      </div>
    </div>
  );
}
