export type PhaseStatus = "not_started" | "in_progress" | "done";

export type ProjectPhase = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  duration_weeks: number | null;
  status: PhaseStatus;
  started_on: string | null;
  completed_on: string | null;
};

export type ProjectTask = {
  id: string;
  phase_id: string;
  title: string;
  detail: string | null;
  is_milestone: boolean;
  done: boolean;
  done_at: string | null;
  due_date: string | null;
  sort_order: number;
};

export type TaskWithPhase = ProjectTask & {
  project_phases: { name: string } | null;
};

export type PhaseWithProgress = ProjectPhase & {
  totalTasks: number;
  doneTasks: number;
  totalMilestones: number;
  doneMilestones: number;
  percent: number;
};

export type TaskInput = {
  title: string;
  detail: string | null;
  is_milestone: boolean;
  due_date: string | null;
};

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  not_started: "ยังไม่เริ่ม",
  in_progress: "กำลังทำ",
  done: "เสร็จแล้ว",
};

/** งานที่ยังไม่เสร็จและมีกำหนด — แบ่งเป็นเลยกำหนด / ใกล้ถึงกำหนด (ภายใน 7 วัน) */
export function splitDueTasks<T extends { done: boolean; due_date: string | null }>(
  tasks: T[]
): { overdue: T[]; dueSoon: T[] } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const soonLimit = new Date(today);
  soonLimit.setDate(soonLimit.getDate() + 7);

  const overdue: T[] = [];
  const dueSoon: T[] = [];
  for (const task of tasks) {
    if (task.done || !task.due_date) continue;
    const due = new Date(task.due_date);
    due.setHours(0, 0, 0, 0);
    if (due < today) overdue.push(task);
    else if (due <= soonLimit) dueSoon.push(task);
  }
  return { overdue, dueSoon };
}
