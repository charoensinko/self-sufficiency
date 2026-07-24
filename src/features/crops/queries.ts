import { createClient } from "@/lib/supabase/client";
import { fetchHouseholdId } from "@/lib/household";
import { computeExpectedHarvest } from "./types";
import type { Crop, CropInput, PlantingInput, PlantingWithCrop } from "./types";

const PLANTING_SELECT = "*, crops(name, category, days_to_harvest)";

export async function fetchCrops(): Promise<Crop[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("crops")
    .select("*")
    .order("category")
    .order("name");
  if (error) throw error;
  return data as Crop[];
}

export async function addCrop(input: CropInput): Promise<void> {
  const supabase = createClient();
  const householdId = await fetchHouseholdId();
  const { error } = await supabase
    .from("crops")
    .insert({ household_id: householdId, ...input });
  if (error) throw error;
}

export async function updateCrop(id: string, input: CropInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("crops").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteCrop(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("crops").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchPlantings(): Promise<PlantingWithCrop[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("plantings")
    .select(PLANTING_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as PlantingWithCrop[];
}

export async function addPlanting(
  input: PlantingInput,
  daysToHarvest: number | null
): Promise<void> {
  const supabase = createClient();
  const householdId = await fetchHouseholdId();
  const { error } = await supabase.from("plantings").insert({
    household_id: householdId,
    ...input,
    expected_harvest_date: computeExpectedHarvest(input, daysToHarvest),
  });
  if (error) throw error;
}

export async function updatePlanting(
  id: string,
  input: PlantingInput,
  daysToHarvest: number | null
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("plantings")
    .update({
      ...input,
      expected_harvest_date: computeExpectedHarvest(input, daysToHarvest),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePlanting(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("plantings").delete().eq("id", id);
  if (error) throw error;
}
