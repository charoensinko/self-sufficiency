-- ============================================================
-- เกษียณสุข — Initial schema (Dev Phase 1)
-- households / profiles / land finder / budget / ai + RLS + storage
-- ============================================================

-- ---------- Core: household & profiles ----------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  display_name text not null,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

-- คืน household_id ของผู้ใช้ปัจจุบัน
-- security definer เพื่อให้เรียกใน RLS policy ได้โดยไม่ชน RLS ของ profiles เอง
create or replace function public.current_household_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select household_id from public.profiles where id = auth.uid();
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ผู้ใช้ใหม่ทุกคนถูกผูกเข้า household แรกโดยอัตโนมัติ
-- (แอปส่วนตัว household เดียว สร้าง user ผ่าน Supabase dashboard เท่านั้น — ดู docs/decisions.md)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  hid uuid;
begin
  select id into hid from public.households order by created_at limit 1;
  if hid is null then
    insert into public.households (name) values ('ครอบครัวเกษียณสุข') returning id into hid;
  end if;
  insert into public.profiles (id, household_id, display_name)
  values (
    new.id,
    hid,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- M1: Land Finder ----------

create table public.land_candidates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  province text,
  district text,
  subdistrict text,
  lat double precision,
  lng double precision,
  area_rai numeric not null default 0 check (area_rai >= 0),
  area_ngan numeric not null default 0 check (area_ngan >= 0),
  area_wa numeric not null default 0 check (area_wa >= 0),
  price_total numeric check (price_total >= 0),
  -- ราคา/ไร่ คำนวณอัตโนมัติ (1 ไร่ = 4 งาน = 400 ตร.วา)
  price_per_rai numeric generated always as (
    case
      when (area_rai + area_ngan / 4 + area_wa / 400) > 0
      then price_total / (area_rai + area_ngan / 4 + area_wa / 400)
    end
  ) stored,
  deed_type text,
  seller_contact text,
  status text not null default 'interested'
    check (status in ('interested', 'visited', 'negotiating', 'rejected', 'purchased')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index land_candidates_household_idx on public.land_candidates (household_id);

create trigger land_candidates_updated_at
  before update on public.land_candidates
  for each row execute function public.set_updated_at();

create table public.land_photos (
  id uuid primary key default gen_random_uuid(),
  land_id uuid not null references public.land_candidates (id) on delete cascade,
  storage_path text not null,
  caption text,
  photo_type text not null default 'other'
    check (photo_type in ('deed', 'land', 'water', 'road', 'other')),
  created_at timestamptz not null default now()
);

create index land_photos_land_idx on public.land_photos (land_id);

-- Scoring Matrix 8 เกณฑ์ คะแนน 1-5 ต่อเกณฑ์
-- total_score ถ่วงน้ำหนัก: น้ำ 20%, ดิน 15%, ความเสี่ยง 15%, ถนน 10%,
-- ไฟฟ้า 10%, รพ. 10%, ชุมชน 10%, ความคุ้มราคา 10% → สเกล 0-100
create table public.land_scores (
  id uuid primary key default gen_random_uuid(),
  land_id uuid not null unique references public.land_candidates (id) on delete cascade,
  water_source int not null check (water_source between 1 and 5),
  soil_quality int not null check (soil_quality between 1 and 5),
  flood_risk int not null check (flood_risk between 1 and 5),
  road_access int not null check (road_access between 1 and 5),
  electricity int not null check (electricity between 1 and 5),
  hospital_distance int not null check (hospital_distance between 1 and 5),
  community int not null check (community between 1 and 5),
  price_value int not null check (price_value between 1 and 5),
  total_score numeric generated always as (
    (
      water_source * 0.20
      + soil_quality * 0.15
      + flood_risk * 0.15
      + road_access * 0.10
      + electricity * 0.10
      + hospital_distance * 0.10
      + community * 0.10
      + price_value * 0.10
    ) * 20
  ) stored,
  scored_at timestamptz not null default now()
);

-- Checklist ตรวจแปลง: template กลาง (ใช้ร่วมกันทุก household) + สถานะติ๊กต่อแปลง
create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  item text not null,
  description text,
  sort_order int not null default 0,
  unique (category, item)
);

create table public.land_checklist_items (
  id uuid primary key default gen_random_uuid(),
  land_id uuid not null references public.land_candidates (id) on delete cascade,
  template_id uuid not null references public.checklist_templates (id) on delete cascade,
  checked boolean not null default false,
  note text,
  checked_at timestamptz,
  unique (land_id, template_id)
);

create index land_checklist_items_land_idx on public.land_checklist_items (land_id);

-- ---------- M2: Budget ----------

create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  planned_amount numeric not null default 0 check (planned_amount >= 0),
  sort_order int not null default 0,
  unique (household_id, name)
);

create index budget_categories_household_idx on public.budget_categories (household_id);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  category_id uuid not null references public.budget_categories (id) on delete restrict,
  amount numeric not null check (amount > 0),
  description text,
  expense_date date not null default current_date,
  land_id uuid references public.land_candidates (id) on delete set null,
  receipt_photo text,
  created_at timestamptz not null default now()
);

create index expenses_household_date_idx on public.expenses (household_id, expense_date desc);
create index expenses_category_idx on public.expenses (category_id);

-- ---------- M3: AI ----------

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null default 'บทสนทนาใหม่',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_conversations_household_idx on public.ai_conversations (household_id);

create trigger ai_conversations_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  image_paths text[],
  model text,
  created_at timestamptz not null default now()
);

create index ai_messages_conversation_idx on public.ai_messages (conversation_id, created_at);

create table public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  model text not null,
  prompt_tokens int not null default 0,
  completion_tokens int not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  task text,
  created_at timestamptz not null default now()
);

create index ai_usage_log_household_idx on public.ai_usage_log (household_id, created_at desc);

-- ---------- Row Level Security ----------

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.land_candidates enable row level security;
alter table public.land_photos enable row level security;
alter table public.land_scores enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.land_checklist_items enable row level security;
alter table public.budget_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_usage_log enable row level security;

create policy "members can view own household"
  on public.households for select to authenticated
  using (id = public.current_household_id());

create policy "members can view household profiles"
  on public.profiles for select to authenticated
  using (household_id = public.current_household_id());

create policy "users can update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and household_id = public.current_household_id());

create policy "household members full access"
  on public.land_candidates for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "household members full access"
  on public.land_photos for all to authenticated
  using (
    exists (
      select 1 from public.land_candidates lc
      where lc.id = land_id and lc.household_id = public.current_household_id()
    )
  )
  with check (
    exists (
      select 1 from public.land_candidates lc
      where lc.id = land_id and lc.household_id = public.current_household_id()
    )
  );

create policy "household members full access"
  on public.land_scores for all to authenticated
  using (
    exists (
      select 1 from public.land_candidates lc
      where lc.id = land_id and lc.household_id = public.current_household_id()
    )
  )
  with check (
    exists (
      select 1 from public.land_candidates lc
      where lc.id = land_id and lc.household_id = public.current_household_id()
    )
  );

-- template กลาง: ทุกคนที่ login อ่านได้ แก้ไขไม่ได้ (จัดการผ่าน seed/migration เท่านั้น)
create policy "authenticated can read templates"
  on public.checklist_templates for select to authenticated
  using (true);

create policy "household members full access"
  on public.land_checklist_items for all to authenticated
  using (
    exists (
      select 1 from public.land_candidates lc
      where lc.id = land_id and lc.household_id = public.current_household_id()
    )
  )
  with check (
    exists (
      select 1 from public.land_candidates lc
      where lc.id = land_id and lc.household_id = public.current_household_id()
    )
  );

create policy "household members full access"
  on public.budget_categories for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "household members full access"
  on public.expenses for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "household members full access"
  on public.ai_conversations for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "household members full access"
  on public.ai_messages for all to authenticated
  using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.household_id = public.current_household_id()
    )
  )
  with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.household_id = public.current_household_id()
    )
  );

create policy "household members full access"
  on public.ai_usage_log for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

-- ---------- Storage: land-photos / receipts (private + RLS) ----------
-- โครงสร้าง path ในทุก bucket: {household_id}/....

insert into storage.buckets (id, name, public)
values ('land-photos', 'land-photos', false), ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "household members manage own files"
  on storage.objects for all to authenticated
  using (
    bucket_id in ('land-photos', 'receipts')
    and (storage.foldername(name))[1] = public.current_household_id()::text
  )
  with check (
    bucket_id in ('land-photos', 'receipts')
    and (storage.foldername(name))[1] = public.current_household_id()::text
  );
