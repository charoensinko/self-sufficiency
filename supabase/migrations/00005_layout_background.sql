-- ============================================================
-- เกษียณสุข — ผังแปลงจังหวะ 1 (backlog)
-- รูปพื้นหลัง canvas + สเกล + เนื้อที่จริงตามโฉนด (ไร่-งาน-วา)
-- ============================================================

alter table public.farm_layouts
  add column bg_image_path text,
  -- ความกว้างที่รูปพื้นหลังถูกแสดงบน canvas (เมตร) — ตั้งจากการลากเส้นอ้างอิง
  add column bg_width_m numeric check (bg_width_m > 0),
  -- เนื้อที่จริงตามโฉนด ใช้เป็นตัวหาร % แทน กว้าง×ยาว ถ้ากรอกไว้
  add column deed_rai numeric check (deed_rai >= 0),
  add column deed_ngan numeric check (deed_ngan >= 0),
  add column deed_wa numeric check (deed_wa >= 0);

-- ---------- Storage: layout-images (private + RLS, path = {household_id}/...) ----------

insert into storage.buckets (id, name, public)
values ('layout-images', 'layout-images', false)
on conflict (id) do nothing;

create policy "household members manage layout images"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'layout-images'
    and (storage.foldername(name))[1] = public.current_household_id()::text
  )
  with check (
    bucket_id = 'layout-images'
    and (storage.foldername(name))[1] = public.current_household_id()::text
  );
