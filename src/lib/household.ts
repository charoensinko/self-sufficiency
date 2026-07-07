import { createClient } from "@/lib/supabase/client";

/** household_id ของผู้ใช้ปัจจุบัน (ฝั่ง client) */
export async function fetchHouseholdId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ยังไม่ได้เข้าสู่ระบบ");

  const { data, error } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return data.household_id as string;
}
