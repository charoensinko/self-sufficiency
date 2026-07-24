import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { fetchHouseholdId } from "@/lib/household";
import type { FarmLayout, LayoutDraft } from "./types";

const BG_BUCKET = "layout-images";

const LAYOUT_SELECT =
  "id, name, land_candidate_id, width_m, height_m, elements, notes, bg_image_path, bg_width_m, deed_rai, deed_ngan, deed_wa";

export async function fetchLayouts(): Promise<FarmLayout[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("farm_layouts")
    .select(LAYOUT_SELECT)
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

/** ผังที่ผูกกับแปลงที่ดินแปลงหนึ่ง — ใช้ในหน้ารายละเอียดแปลง */
export type LinkedLayout = { id: string; name: string };

export async function fetchLayoutsForLand(
  landId: string
): Promise<LinkedLayout[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("farm_layouts")
    .select("id, name")
    .eq("land_candidate_id", landId)
    .order("created_at");
  if (error) throw error;
  return data as LinkedLayout[];
}

/** อัปโหลดรูปพื้นหลัง (บีบอัด ≤1600px) — คืน storage path */
export async function uploadBgImage(file: File): Promise<string> {
  const supabase = createClient();
  const householdId = await fetchHouseholdId();
  const compressed = await compressImage(file);
  const path = `${householdId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(BG_BUCKET)
    .upload(path, compressed, { contentType: "image/jpeg" });
  if (error) throw error;
  return path;
}

export async function deleteBgImage(path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(BG_BUCKET).remove([path]);
}

/** แปลง path รูปพื้นหลังเป็น URL ชั่วคราว (bucket เป็น private) */
export async function fetchBgImageUrl(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BG_BUCKET)
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}
