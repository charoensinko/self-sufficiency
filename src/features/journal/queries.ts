import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { fetchHouseholdId } from "@/lib/household";
import type { JournalEntry, JournalInput } from "./types";

const BUCKET = "journal-photos";

export async function fetchEntries(): Promise<JournalEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as JournalEntry[];
}

async function uploadPhotos(files: File[]): Promise<string[]> {
  const supabase = createClient();
  const householdId = await fetchHouseholdId();
  const paths: string[] = [];
  for (const file of files) {
    const compressed = await compressImage(file);
    const path = `${householdId}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, compressed, { contentType: "image/jpeg" });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

export async function addEntry(
  input: JournalInput,
  photoFiles: File[]
): Promise<void> {
  const supabase = createClient();
  const householdId = await fetchHouseholdId();
  const photoPaths = await uploadPhotos(photoFiles);
  const { error } = await supabase.from("journal_entries").insert({
    household_id: householdId,
    entry_date: input.entry_date,
    content: input.content,
    photo_paths: photoPaths,
  });
  if (error) throw error;
}

/** keptPaths = รูปเดิมที่ยังเก็บไว้ (รูปเดิมที่ผู้ใช้กดลบจะถูกลบออกจาก storage) */
export async function updateEntry(
  entry: JournalEntry,
  input: JournalInput,
  keptPaths: string[],
  newFiles: File[]
): Promise<void> {
  const supabase = createClient();
  const newPaths = await uploadPhotos(newFiles);
  const { error } = await supabase
    .from("journal_entries")
    .update({
      entry_date: input.entry_date,
      content: input.content,
      photo_paths: [...keptPaths, ...newPaths],
    })
    .eq("id", entry.id);
  if (error) throw error;

  const removed = entry.photo_paths.filter((p) => !keptPaths.includes(p));
  if (removed.length > 0) {
    await supabase.storage.from(BUCKET).remove(removed);
  }
}

export async function deleteEntry(entry: JournalEntry): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", entry.id);
  if (error) throw error;
  if (entry.photo_paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(entry.photo_paths);
  }
}

/** แปลง storage path เป็น URL ชั่วคราว (bucket เป็น private) */
export async function fetchJournalPhotoUrls(
  paths: string[]
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, 3600);
  if (error) throw error;

  for (const entry of data) {
    if (entry.signedUrl && entry.path) {
      urls.set(entry.path, entry.signedUrl);
    }
  }
  return urls;
}
