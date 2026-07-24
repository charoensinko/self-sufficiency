import { createClient } from "@/lib/supabase/client";
import { fetchHouseholdId } from "@/lib/household";
import { todayInputValue } from "@/lib/format";
import type {
  PhaseStatus,
  ProjectPhase,
  ProjectTask,
  TaskInput,
  TaskWithPhase,
} from "./types";

export async function fetchPhases(): Promise<ProjectPhase[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_phases")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data as ProjectPhase[];
}

export async function fetchPhase(id: string): Promise<ProjectPhase> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_phases")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as ProjectPhase;
}

export async function fetchAllTasks(): Promise<ProjectTask[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_tasks")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data as ProjectTask[];
}

export async function fetchPhaseTasks(phaseId: string): Promise<ProjectTask[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_tasks")
    .select("*")
    .eq("phase_id", phaseId)
    .order("sort_order");
  if (error) throw error;
  return data as ProjectTask[];
}

/** งานค้างที่มีกำหนดเสร็จ พร้อมชื่อเฟส — ใช้แจ้งเตือนบนแดชบอร์ด */
export async function fetchTasksWithDue(): Promise<TaskWithPhase[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_tasks")
    .select("*, project_phases(name)")
    .eq("done", false)
    .not("due_date", "is", null)
    .order("due_date");
  if (error) throw error;
  return data as TaskWithPhase[];
}

export async function updatePhaseStatus(
  id: string,
  status: PhaseStatus,
  current: ProjectPhase
): Promise<void> {
  const supabase = createClient();
  const today = todayInputValue();
  const { error } = await supabase
    .from("project_phases")
    .update({
      status,
      started_on:
        status === "not_started" ? null : (current.started_on ?? today),
      completed_on: status === "done" ? (current.completed_on ?? today) : null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function toggleTask(id: string, done: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("project_tasks")
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function addTask(
  phaseId: string,
  input: TaskInput,
  sortOrder: number
): Promise<void> {
  const supabase = createClient();
  const householdId = await fetchHouseholdId();
  const { error } = await supabase.from("project_tasks").insert({
    household_id: householdId,
    phase_id: phaseId,
    title: input.title,
    detail: input.detail,
    is_milestone: input.is_milestone,
    due_date: input.due_date,
    sort_order: sortOrder,
  });
  if (error) throw error;
}

export async function updateTask(id: string, input: TaskInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("project_tasks")
    .update({
      title: input.title,
      detail: input.detail,
      is_milestone: input.is_milestone,
      due_date: input.due_date,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("project_tasks").delete().eq("id", id);
  if (error) throw error;
}
