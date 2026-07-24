"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAllTasks, fetchPhases } from "./queries";
import { splitDueTasks } from "./types";
import type { PhaseWithProgress, ProjectPhase, ProjectTask } from "./types";

export function useProject() {
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const [allPhases, allTasks] = await Promise.all([
        fetchPhases(),
        fetchAllTasks(),
      ]);
      setPhases(allPhases);
      setTasks(allTasks);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const phasesWithProgress: PhaseWithProgress[] = useMemo(() => {
    const byPhase = new Map<string, ProjectTask[]>();
    for (const task of tasks) {
      const list = byPhase.get(task.phase_id) ?? [];
      list.push(task);
      byPhase.set(task.phase_id, list);
    }
    return phases.map((phase) => {
      const phaseTasks = byPhase.get(phase.id) ?? [];
      const milestones = phaseTasks.filter((t) => t.is_milestone);
      const doneTasks = phaseTasks.filter((t) => t.done).length;
      return {
        ...phase,
        totalTasks: phaseTasks.length,
        doneTasks,
        totalMilestones: milestones.length,
        doneMilestones: milestones.filter((t) => t.done).length,
        percent:
          phaseTasks.length > 0 ? (doneTasks / phaseTasks.length) * 100 : 0,
      };
    });
  }, [phases, tasks]);

  const totals = useMemo(() => {
    const done = tasks.filter((t) => t.done).length;
    const { overdue, dueSoon } = splitDueTasks(tasks);
    return {
      done,
      total: tasks.length,
      percent: tasks.length > 0 ? (done / tasks.length) * 100 : 0,
      overdueCount: overdue.length,
      dueSoonCount: dueSoon.length,
    };
  }, [tasks]);

  return { phasesWithProgress, totals, loading, error, reload };
}
