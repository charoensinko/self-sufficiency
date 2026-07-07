-- ============================================================
-- วงเงินงบประมาณรวมปรับได้ (เดิม fix 5,000,000 ในโค้ด)
-- เก็บที่ระดับ household + เปิดสิทธิ์ให้สมาชิกแก้ไขข้อมูล household ตัวเอง
-- ============================================================

alter table public.households
  add column total_budget numeric not null default 5000000
    check (total_budget >= 0);

create policy "members can update own household"
  on public.households for update to authenticated
  using (id = public.current_household_id())
  with check (id = public.current_household_id());
