-- ============================================================
-- ปิด security warnings จาก Supabase advisor:
-- 1) ล็อก search_path ของ set_updated_at
-- 2) จำกัดสิทธิ์ execute ฟังก์ชัน security definer ไม่ให้เรียกผ่าน REST API ได้เกินจำเป็น
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- current_household_id: ใช้ใน RLS policy — ต้องให้ authenticated เรียกได้เท่านั้น
revoke execute on function public.current_household_id() from public, anon;
grant execute on function public.current_household_id() to authenticated;

-- handle_new_user: ถูกเรียกจาก trigger บน auth.users เท่านั้น
-- (ผู้ insert คือ supabase_auth_admin) — ห้ามเรียกผ่าน API ทุก role
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;
