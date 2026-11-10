-- =============================================================
-- Al-Manhal Private Schools (مجمع مدارس المنهل الخاصة) — Database Schema
-- Mirrors the in-app data model (src/lib/school/types.ts).
-- Supports multi-stage operations: الأساس, المتوسطة, الثانوية.
-- Run once in the SQL editor of the Supabase / PostgreSQL cloud database.
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- Roles & App Accounts ----------
create type public.app_role as enum ('student', 'teacher', 'admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Admin profiles (مدير, حسابات, تسجيل)
create table public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade,
  username text unique not null,
  name text not null,
  title text not null check (title in ('مدير', 'حسابات', 'تسجيل')),
  created_at timestamptz not null default now()
);

-- ---------- Core School Structure ----------
create table public.classes (
  id text primary key,
  name text not null,
  short text not null,
  stage_id text not null check (stage_id in ('مرحلة الأساس', 'المرحلة المتوسطة', 'المرحلة الثانوية'))
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  employee_id text unique not null,
  subject text not null,
  phone text,
  status text not null default 'active' check (status in ('active', 'archived')),
  stage_ids text[] not null default array['المرحلة الثانوية']::text[],
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  academic_id text unique not null,
  class_id text not null references public.classes (id),
  parent_name text not null,
  parent_phone text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  total_fees numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Fees & Payments ----------
create table public.installments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  title text not null,
  amount numeric(12, 2) not null,
  due_date date not null
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  paid_on date not null default current_date,
  method text not null,
  receipt_no text unique not null,
  transaction_id text
);

-- ---------- Academic Performance & Grades ----------
create table public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_id text not null references public.classes (id) on delete cascade,
  subject text not null,
  academic_year text not null default '2025-2026',
  term text not null check (term in ('term_1', 'term_2')),
  work_score numeric(5, 2) not null check (work_score >= 0 and work_score <= 40),
  mid_score numeric(5, 2) not null check (mid_score >= 0 and mid_score <= 20),
  final_score numeric(5, 2) not null check (final_score >= 0 and final_score <= 40),
  total numeric(5, 2) not null check (total >= 0 and total <= 100),
  letter text not null,
  notes text,
  recorded_by uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  unique (student_id, subject, academic_year, term)
);

create table public.behavior_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_id text not null references public.classes (id) on delete cascade,
  title text not null,
  date date not null default current_date,
  type text not null check (type in ('positive', 'warning', 'violation', 'excellence')),
  note text not null,
  recorded_by uuid references auth.users (id)
);

-- ---------- Communication & Announcements ----------
create type public.announcement_category as enum ('urgent', 'rules', 'activities', 'general');

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category public.announcement_category not null default 'general',
  audience text not null default 'all', -- 'all' or class_id
  author text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target_role text not null default 'all', -- 'all' | 'student' | 'teacher' | 'admin'
  target_user uuid references auth.users (id) on delete cascade,
  link text,
  created_at timestamptz not null default now()
);

create table public.notification_reads (
  notification_id uuid references public.notifications (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  primary key (notification_id, user_id)
);

-- ---------- Academics, Timetables, Homework & Attendance ----------
create table public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  class_id text not null references public.classes (id) on delete cascade,
  day smallint not null check (day between 0 and 4), -- 0 = الأحد, 4 = الخميس
  period smallint not null check (period between 1 and 7),
  subject text not null,
  teacher_id uuid references public.teachers (id) on delete set null,
  room text,
  unique (class_id, day, period)
);

create table public.homework (
  id uuid primary key default gen_random_uuid(),
  class_id text not null references public.classes (id) on delete cascade,
  subject text not null,
  title text not null,
  description text,
  due_date date not null,
  kind text not null default 'homework' check (kind in ('homework', 'notes')),
  teacher_id uuid references public.teachers (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.homework_completion (
  student_id uuid references public.students (id) on delete cascade,
  homework_id uuid references public.homework (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (student_id, homework_id)
);

create type public.attendance_status as enum ('present', 'absent', 'late');

create table public.attendance (
  date date not null,
  class_id text not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  status public.attendance_status not null,
  recorded_by uuid references auth.users (id),
  primary key (date, student_id)
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  time_label text,
  type text not null check (type in ('exam', 'event', 'holiday')),
  class_id text not null default 'all',
  subject text
);

-- ---------- Access Control (Row Level Security) ----------
alter table public.user_roles enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.classes enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.installments enable row level security;
alter table public.payments enable row level security;
alter table public.grades enable row level security;
alter table public.behavior_records enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;
alter table public.timetable_slots enable row level security;
alter table public.homework enable row level security;
alter table public.homework_completion enable row level security;
alter table public.attendance enable row level security;
alter table public.calendar_events enable row level security;

-- Users can read their own role and admin profiles
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "read admin profiles" on public.admin_profiles for select to authenticated using (true);

-- Shared school-wide reading for signed-in users
create policy "read classes" on public.classes for select to authenticated using (true);
create policy "read teachers" on public.teachers for select to authenticated using (true);
create policy "read announcements" on public.announcements for select to authenticated using (true);
create policy "read timetable" on public.timetable_slots for select to authenticated using (true);
create policy "read homework" on public.homework for select to authenticated using (true);
create policy "read events" on public.calendar_events for select to authenticated using (true);
create policy "public news" on public.announcements for select to anon using (category in ('general', 'activities'));

-- Students see only their own records
create policy "student self" on public.students for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'));
create policy "own installments" on public.installments for select to authenticated
  using (student_id in (select id from public.students where user_id = auth.uid()) or public.has_role(auth.uid(), 'admin'));
create policy "own payments" on public.payments for select to authenticated
  using (student_id in (select id from public.students where user_id = auth.uid()) or public.has_role(auth.uid(), 'admin'));
create policy "own attendance" on public.attendance for select to authenticated
  using (student_id in (select id from public.students where user_id = auth.uid())
         or public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'));
create policy "own completion" on public.homework_completion for all to authenticated
  using (student_id in (select id from public.students where user_id = auth.uid()))
  with check (student_id in (select id from public.students where user_id = auth.uid()));
create policy "own grades" on public.grades for select to authenticated
  using (student_id in (select id from public.students where user_id = auth.uid())
         or public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'));
create policy "own behavior" on public.behavior_records for select to authenticated
  using (student_id in (select id from public.students where user_id = auth.uid())
         or public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'));
create policy "my notifications" on public.notifications for select to authenticated
  using (target_user = auth.uid() or target_user is null);
create policy "my reads" on public.notification_reads for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Teachers manage attendance, homework, and grades
create policy "teacher attendance" on public.attendance for all to authenticated
  using (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'));
create policy "teacher homework" on public.homework for all to authenticated
  using (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'));
create policy "teacher grades" on public.grades for all to authenticated
  using (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'));
create policy "teacher behavior" on public.behavior_records for all to authenticated
  using (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'));

-- Admin manages everything
create policy "admin announcements" on public.announcements for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin payments" on public.payments for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin installments" on public.installments for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin timetable" on public.timetable_slots for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin events" on public.calendar_events for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin students" on public.students for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin teachers" on public.teachers for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin notifications" on public.notifications for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'teacher'));

-- ---------- Grants ----------
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
