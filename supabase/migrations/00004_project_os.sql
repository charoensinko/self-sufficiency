-- ============================================================
-- เกษียณสุข — Dev Phase 2 "Project OS"
-- project phases/tasks + journal + crops/plantings + farm layouts
-- + RLS + storage bucket journal-photos
-- ============================================================

-- ---------- M2: Project Tracker ----------

create table public.project_phases (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0,
  duration_weeks int check (duration_weeks > 0),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'done')),
  -- ยังไม่มีที่ดิน — วันเริ่ม/จบจริงใส่ทีหลังเมื่อเริ่มเฟสนั้น
  started_on date,
  completed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, name)
);

create index project_phases_household_idx on public.project_phases (household_id, sort_order);

create trigger project_phases_updated_at
  before update on public.project_phases
  for each row execute function public.set_updated_at();

-- งานและ milestone รวมตารางเดียว (is_milestone) — ลดความซับซ้อน ดู docs/plan-dev-phase2.md
create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  phase_id uuid not null references public.project_phases (id) on delete cascade,
  title text not null,
  detail text,
  is_milestone boolean not null default false,
  done boolean not null default false,
  done_at timestamptz,
  due_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, title)
);

create index project_tasks_phase_idx on public.project_tasks (phase_id, sort_order);
create index project_tasks_due_idx on public.project_tasks (household_id, due_date)
  where done = false and due_date is not null;

create trigger project_tasks_updated_at
  before update on public.project_tasks
  for each row execute function public.set_updated_at();

-- ---------- M7: Journal ----------

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  entry_date date not null default current_date,
  content text not null,
  photo_paths text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index journal_entries_household_date_idx
  on public.journal_entries (household_id, entry_date desc);

create trigger journal_entries_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

-- ---------- M4: Crop Planner ----------

create table public.crops (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  category text not null default 'ผักสวนครัว'
    check (category in ('ผักสวนครัว', 'สมุนไพร-เครื่องแกง', 'ไม้ผล',
                        'ไม้พี่เลี้ยง-ยืนต้น', 'ข้าว', 'ปุ๋ยพืชสด')),
  days_to_harvest int check (days_to_harvest > 0),
  spacing text,
  water_need text not null default 'ปานกลาง'
    check (water_need in ('น้อย', 'ปานกลาง', 'มาก')),
  planting_months int[] not null default '{}', -- 1-12, ว่าง = ปลูกได้ทั้งปี
  notes text,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

create index crops_household_idx on public.crops (household_id, category);

create table public.plantings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  crop_id uuid not null references public.crops (id) on delete cascade,
  zone text,
  quantity text,
  planned_date date,
  planted_date date,
  -- คำนวณฝั่งแอปจากวันปลูก + days_to_harvest (แก้เองได้)
  expected_harvest_date date,
  status text not null default 'planned'
    check (status in ('planned', 'planted', 'harvested', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plantings_household_idx on public.plantings (household_id, status);
create index plantings_crop_idx on public.plantings (crop_id);

create trigger plantings_updated_at
  before update on public.plantings
  for each row execute function public.set_updated_at();

-- ---------- M3: Farm Layout ----------

-- ผังแปลง: รูปทรงทั้งหมดเก็บเป็น jsonb (โซน/ตำแหน่ง/ขนาด) — ทำหลายผังไว้เปรียบเทียบได้
create table public.farm_layouts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  land_candidate_id uuid references public.land_candidates (id) on delete set null,
  name text not null default 'ผังแปลงใหม่',
  width_m numeric not null default 100 check (width_m > 0),
  height_m numeric not null default 80 check (height_m > 0),
  elements jsonb not null default '[]',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index farm_layouts_household_idx on public.farm_layouts (household_id);

create trigger farm_layouts_updated_at
  before update on public.farm_layouts
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------

alter table public.project_phases enable row level security;
alter table public.project_tasks enable row level security;
alter table public.journal_entries enable row level security;
alter table public.crops enable row level security;
alter table public.plantings enable row level security;
alter table public.farm_layouts enable row level security;

create policy "household members full access"
  on public.project_phases for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "household members full access"
  on public.project_tasks for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "household members full access"
  on public.journal_entries for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "household members full access"
  on public.crops for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "household members full access"
  on public.plantings for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "household members full access"
  on public.farm_layouts for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

-- ---------- Storage: journal-photos (private + RLS, path = {household_id}/...) ----------

insert into storage.buckets (id, name, public)
values ('journal-photos', 'journal-photos', false)
on conflict (id) do nothing;

create policy "household members manage journal photos"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'journal-photos'
    and (storage.foldername(name))[1] = public.current_household_id()::text
  )
  with check (
    bucket_id = 'journal-photos'
    and (storage.foldername(name))[1] = public.current_household_id()::text
  );
