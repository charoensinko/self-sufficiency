import { createClient } from "@/lib/supabase/client";
import { fetchHouseholdId } from "@/lib/household";
import type { FarmLayout, LayoutDraft } from "./types";

export async function fetchLayouts(): Promise<FarmLayout[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("farm_layouts")
    .select("id, name, land_candidate_id, width_m, height_m, elements, notes")
    .order("created_at");
  if (error) throw error;
  return data as FarmLayout[];
}

export async function addLayout(draft: LayoutDraft): Promise<string> {
  const supabase = createClient();
  const householdId = await fetchHouseholdId();
  const { data, error } = await supabase
    .from("farm_layouts")
    .insert({ household_id: householdId, ...draft })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateLayout(
  id: string,
  draft: LayoutDraft
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("farm_layouts")
    .update(draft)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteLayout(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("farm_layouts").delete().eq("id", id);
  if (error) throw error;
}

export type LandOption = { id: string; name: string };

export async function fetchLandOptions(): Promise<LandOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("land_candidates")
    .select("id, name")
    .order("created_at");
  if (error) throw error;
  return data as LandOption[];
}
