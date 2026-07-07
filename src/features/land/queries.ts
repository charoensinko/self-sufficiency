import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { fetchHouseholdId } from "@/lib/household";
import type {
  ChecklistItemState,
  ChecklistTemplate,
  LandCandidate,
  LandDetail,
  LandScore,
  LandStatus,
  LandWithScore,
  PhotoType,
  ScoreValues,
} from "./types";

// land_scores เป็นความสัมพันธ์ 1:1 (unique land_id) — PostgREST อาจคืน object หรือ array แล้วแต่เวอร์ชัน
function normalizeScore(value: unknown): LandScore | null {
  if (Array.isArray(value)) return (value[0] as LandScore) ?? null;
  return (value as LandScore) ?? null;
}

export async function fetchLands(): Promise<LandWithScore[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("land_candidates")
    .select("*, land_scores(total_score)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data as (LandCandidate & { land_scores: unknown })[]).map(
    (row) => ({
      ...row,
      total_score:
        normalizeScore(row.land_scores)?.total_score ?? null,
    })
  );
}

export async function fetchLand(id: string): Promise<LandDetail> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("land_candidates")
    .select("*, land_photos(*), land_scores(*)")
    .eq("id", id)
    .single();
  if (error) throw error;

  const row = data as LandCandidate & {
    land_photos: LandDetail["land_photos"];
    land_scores: unknown;
  };
  return { ...row, land_scores: normalizeScore(row.land_scores) };
}

export type LandInput = {
  name: string;
  province: string;
  district: string;
  subdistrict: string;
  lat: number | null;
  lng: number | null;
  area_rai: number;
  area_ngan: number;
  area_wa: number;
  price_total: number | null;
  deed_type: string;
  seller_contact: string;
  status: LandStatus;
  notes: string;
};

function landRow(input: LandInput) {
  return {
    name: input.name,
    province: input.province || null,
    district: input.district || null,
    subdistrict: input.subdistrict || null,
    lat: input.lat,
    lng: input.lng,
    area_rai: input.area_rai,
    area_ngan: input.area_ngan,
    area_wa: input.area_wa,
    price_total: input.price_total,
    deed_type: input.deed_type || null,
    seller_contact: input.seller_contact || null,
    status: input.status,
    notes: input.notes || null,
  };
}

export async function insertLand(input: LandInput): Promise<string> {
  const supabase = createClient();
  const householdId = await fetchHouseholdId();
  const { data, error } = await supabase
    .from("land_candidates")
    .insert({ household_id: householdId, ...landRow(input) })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateLand(id: string, input: LandInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("land_candidates")
    .update(landRow(input))
    .eq("id", id);
  if (error) throw error;
}

export async function deleteLand(id: string): Promise<void> {
  const supabase = createClient();
  const householdId = await fetchHouseholdId();

  // ลบไฟล์รูปใน storage ก่อน (แถวในตารางถูก cascade ลบพร้อมแปลง)
  const prefix = `${householdId}/${id}`;
  const { data: files } = await supabase.storage
    .from("land-photos")
    .list(prefix);
  if (files && files.length > 0) {
    await supabase.storage
      .from("land-photos")
      .remove(files.map((f) => `${prefix}/${f.name}`));
  }

  const { error } = await supabase.from("land_candidates").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadLandPhotos(
  landId: string,
  photos: { file: File; type: PhotoType }[]
): Promise<void> {
  if (photos.length === 0) return;
  const supabase = createClient();
  const householdId = await fetchHouseholdId();

  for (const photo of photos) {
    const compressed = await compressImage(photo.file);
    const path = `${householdId}/${landId}/${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("land-photos")
      .upload(path, compressed, { contentType: "image/jpeg" });
    if (uploadError) throw uploadError;

    const { error } = await supabase.from("land_photos").insert({
      land_id: landId,
      storage_path: path,
      photo_type: photo.type,
    });
    if (error) throw error;
  }
}

export async function deleteLandPhoto(
  photoId: string,
  storagePath: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("land_photos")
    .delete()
    .eq("id", photoId);
  if (error) throw error;
  await supabase.storage.from("land-photos").remove([storagePath]);
}

/** แปลง storage path เป็น URL ชั่วคราว (bucket เป็น private) */
export async function fetchPhotoUrls(
  paths: string[]
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("land-photos")
    .createSignedUrls(paths, 3600);
  if (error) throw error;

  for (const entry of data) {
    if (entry.signedUrl && entry.path) {
      urls.set(entry.path, entry.signedUrl);
    }
  }
  return urls;
}

export async function upsertScore(
  landId: string,
  values: ScoreValues
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("land_scores")
    .upsert(
      { land_id: landId, ...values, scored_at: new Date().toISOString() },
      { onConflict: "land_id" }
    );
  if (error) throw error;
}

export async function fetchChecklist(
  landId: string
): Promise<ChecklistItemState[]> {
  const supabase = createClient();
  const [templatesRes, itemsRes] = await Promise.all([
    supabase.from("checklist_templates").select("*").order("sort_order"),
    supabase
      .from("land_checklist_items")
      .select("template_id, checked, note")
      .eq("land_id", landId),
  ]);
  if (templatesRes.error) throw templatesRes.error;
  if (itemsRes.error) throw itemsRes.error;

  const itemByTemplate = new Map(
    itemsRes.data.map((item) => [item.template_id as string, item])
  );
  return (templatesRes.data as ChecklistTemplate[]).map((template) => {
    const item = itemByTemplate.get(template.id);
    return {
      template,
      checked: item?.checked ?? false,
      note: (item?.note as string | null) ?? "",
    };
  });
}

export async function saveChecklistItem(
  landId: string,
  templateId: string,
  state: { checked: boolean; note: string }
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("land_checklist_items").upsert(
    {
      land_id: landId,
      template_id: templateId,
      checked: state.checked,
      note: state.note || null,
      checked_at: state.checked ? new Date().toISOString() : null,
    },
    { onConflict: "land_id,template_id" }
  );
  if (error) throw error;
}

/** ความคืบหน้า checklist ของหลายแปลง (ใช้หน้าเปรียบเทียบ/รายการ) */
export async function fetchChecklistProgress(
  landIds: string[]
): Promise<Map<string, { done: number; total: number }>> {
  const progress = new Map<string, { done: number; total: number }>();
  if (landIds.length === 0) return progress;

  const supabase = createClient();
  const [totalRes, itemsRes] = await Promise.all([
    supabase
      .from("checklist_templates")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("land_checklist_items")
      .select("land_id, checked")
      .in("land_id", landIds)
      .eq("checked", true),
  ]);
  if (totalRes.error) throw totalRes.error;
  if (itemsRes.error) throw itemsRes.error;

  const total = totalRes.count ?? 0;
  for (const landId of landIds) {
    progress.set(landId, { done: 0, total });
  }
  for (const item of itemsRes.data) {
    const entry = progress.get(item.land_id as string);
    if (entry) entry.done += 1;
  }
  return progress;
}

export async function fetchScores(
  landIds: string[]
): Promise<Map<string, LandScore>> {
  const scores = new Map<string, LandScore>();
  if (landIds.length === 0) return scores;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("land_scores")
    .select("*")
    .in("land_id", landIds);
  if (error) throw error;

  for (const score of data as LandScore[]) {
    scores.set(score.land_id, score);
  }
  return scores;
}
