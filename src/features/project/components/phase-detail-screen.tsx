"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Pencil, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatDateThai } from "@/lib/format";
import {
  addTask,
  deleteTask,
  fetchPhase,
  fetchPhaseTasks,
  toggleTask,
  updatePhaseStatus,
  updateTask,
} from "../queries";
import { PHASE_STATUS_LABELS, splitDueTasks } from "../types";
import type { ProjectPhase, ProjectTask, TaskInput } from "../types";
import { TaskDialog } from "./task-dialog";

export function PhaseDetailScreen({ phaseId }: { phaseId: string }) {
  const [phase, setPhase] = useState<ProjectPhase | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const [phaseData, taskData] = await Promise.all([
        fetchPhase(phaseId),
        fetchPhaseTasks(phaseId),
      ]);
      setPhase(phaseData);
      setTasks(taskData);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setLoading(false);
    }
  }, [phaseId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const doneCount = tasks.filter((t) => t.done).length;
  const { overdue } = useMemo(() => splitDueTasks(tasks), [tasks]);
  const overdueIds = useMemo(
    () => new Set(overdue.map((t) => t.id)),
    [overdue]
  );

  async function handleToggle(task: ProjectTask, done: boolean) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done } : t))
    );
    try {
      await toggleTask(task.id, done);
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, done: !done } : t))
      );
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  async function handleStatusChange(status: ProjectPhase["status"]) {
    if (!phase) return;
    try {
      await updatePhaseStatus(phase.id, status, phase);
      await reload();
      toast.success("บันทึกสถานะแล้ว");
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  async function handleSaveTask(input: TaskInput) {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, input);
      } else {
        const nextOrder =
          Math.max(0, ...tasks.map((t) => t.sort_order)) + 1;
        await addTask(phaseId, input, nextOrder);
      }
      await reload();
      toast.success("บันทึกงานแล้ว");
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่");
      throw new Error("save failed");
    }
  }

  async function handleDeleteTask() {
    if (!editingTask) return;
    try {
      await deleteTask(editingTask.id);
      await reload();
      toast.success("ลบงานแล้ว");
    } catch {
      toast.error("ลบไม่สำเร็จ กรุณาลองใหม่");
      throw new Error("delete failed");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !phase) {
    return (
      <p role="alert" className="py-10 text-center text-destructive">
        {error ?? "ไม่พบเฟสนี้"}
      </p>
    );
  }

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[2fr_3fr] lg:items-start lg:gap-5 lg:space-y-0">
      <div className="space-y-4">
        <Link
          href="/project"
          className="flex items-center gap-1 text-sm text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          กลับหน้าโครงการ
        </Link>

        {/* ข้อมูลเฟส + สถานะ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-start justify-between gap-2 text-lg">
              <span>
                เฟส {phase.sort_order}: {phase.name}
              </span>
              <Badge
                variant={
                  phase.status === "done"
                    ? "default"
                    : phase.status === "in_progress"
                      ? "outline"
                      : "secondary"
                }
                className="shrink-0"
              >
                {PHASE_STATUS_LABELS[phase.status]}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {phase.description && (
              <p className="text-muted-foreground">{phase.description}</p>
            )}
            <div className="space-y-1 text-sm text-muted-foreground">
              {phase.duration_weeks != null && (
                <p>ระยะเวลาประมาณ {phase.duration_weeks} สัปดาห์</p>
              )}
              {phase.started_on && (
                <p>เริ่มทำจริง {formatDateThai(phase.started_on)}</p>
              )}
              {phase.completed_on && (
                <p>เสร็จเมื่อ {formatDateThai(phase.completed_on)}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Progress
                value={tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0}
                className="h-3 flex-1"
              />
              <span className="shrink-0 text-sm text-muted-foreground">
                {doneCount}/{tasks.length} งาน
              </span>
            </div>
            {phase.status === "not_started" && (
              <Button
                className="w-full"
                onClick={() => handleStatusChange("in_progress")}
              >
                เริ่มเฟสนี้
              </Button>
            )}
            {phase.status === "in_progress" && (
              <Button
                className="w-full"
                onClick={() => handleStatusChange("done")}
              >
                ปิดเฟสนี้ (เสร็จแล้ว)
              </Button>
            )}
            {phase.status === "done" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleStatusChange("in_progress")}
              >
                กลับมาทำต่อ
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* รายการงาน */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-lg">
            รายการงาน
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingTask(null);
                setDialogOpen(true);
              }}
            >
              <Plus aria-hidden />
              เพิ่มงาน
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {tasks.length === 0 && (
            <p className="py-6 text-center text-muted-foreground">
              ยังไม่มีงานในเฟสนี้
            </p>
          )}
          {tasks.map((task) => {
            const isOverdue = overdueIds.has(task.id);
            return (
              <div key={task.id} className="flex items-start gap-3 py-3">
                <Switch
                  checked={task.done}
                  onCheckedChange={(done) => handleToggle(task, done)}
                  aria-label={task.title}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "font-medium leading-snug",
                      task.done && "text-muted-foreground line-through"
                    )}
                  >
                    {task.is_milestone && (
                      <Star
                        className="mb-0.5 mr-1 inline size-4 fill-amber-400 text-amber-400"
                        aria-label="เป้าหมายสำคัญ"
                      />
                    )}
                    {task.title}
                  </p>
                  {task.detail && (
                    <p className="text-sm text-muted-foreground">
                      {task.detail}
                    </p>
                  )}
                  {task.due_date && !task.done && (
                    <p
                      className={cn(
                        "mt-0.5 flex items-center gap-1 text-sm",
                        isOverdue
                          ? "font-medium text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="size-4" aria-hidden />
                      กำหนด {formatDateThai(task.due_date)}
                      {isOverdue && " (เลยกำหนด)"}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`แก้ไขงาน ${task.title}`}
                  onClick={() => {
                    setEditingTask(task);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil aria-hidden />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <TaskDialog
        open={dialogOpen}
        task={editingTask}
        onOpenChange={setDialogOpen}
        onSave={handleSaveTask}
        onDelete={editingTask ? handleDeleteTask : undefined}
      />
    </div>
  );
}
