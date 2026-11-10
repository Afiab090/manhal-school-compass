-- =============================================================
-- Al-Manhal School — cloud schema aligned with src/lib/school/types.ts
-- Roles are strictly student, teacher, admin. Parent contact details
-- remain fields on students; parents and Bankak receipt workflows do not exist.
-- =============================================================
create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'teacher', 'admin');
create type public.student_status as enum ('active', 'archived');
create type public.teacher_status as enum ('active', 'archived');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.classes (
  id text primary key,
  name text not null,
  short text not null,
  stage text not null,
  stage_id text not null check (stage_id in ('stg-pri', 'stg-mid', 'stg-sec')),
  capacity integer not null default 30 check (capacity > 0)
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  employee_id text unique not null,
  subject text not null,
  phone text not null default '',
  status public.teacher_status not null default 'active'
);

create table public.teacher_stages (
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  stage_id text not null check (stage_id in ('stg-pri', 'stg-mid', 'stg-sec')),
  primary key (teacher_id, stage_id)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  academic_id text unique not null,
  class_id text not null references public.classes(id),
  parent_name text not null default '',
  parent_phone text not null default '',
  total_fees numeric(12, 2) not null default 0 check (total_fees >= 0),
  status public.student_status not null default 'active',
  gender text check (gender in ('male', 'female')),
  date_of_birth date
);

create table public.teacher_class_assignments (
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  class_id text not null references public.classes(id) on delete cascade,
  primary key (teacher_id, class_id)
);

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  title text not null check (title in ('مدير', 'حسابات', 'تسجيل')),
  display_name text not null
);

create table public.installments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  due_date date not null,
  unique (student_id, title, due_date)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  paid_on date not null default current_date,
  method text not null,
  receipt_no text unique not null
);

create type public.announcement_category as enum ('urgent', 'rules', 'activities', 'general');
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category public.announcement_category not null default 'general',
  audience text not null default 'all',
  author text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target_role text not null default 'all' check (target_role in ('all', 'student', 'teacher', 'admin')),
  target_user uuid references auth.users(id) on delete cascade,
  link text,
  created_at timestamptz not null default now()
);
create table public.notification_reads (
  notification_id uuid references public.notifications(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (notification_id, user_id)
);

create table public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  class_id text not null references public.classes(id) on delete cascade,
  day smallint not null check (day between 0 and 4),
  period smallint not null check (period between 1 and 7),
  subject text not null,
  teacher_id uuid references public.teachers(id) on delete set null,
  room text not null default '',
  unique (class_id, day, period)
);
create unique index timetable_teacher_no_overlap
  on public.timetable_slots(teacher_id, day, period) where teacher_id is not null;
create unique index timetable_room_no_overlap
  on public.timetable_slots(lower(room), day, period) where room <> '';

create table public.homework (
  id uuid primary key default gen_random_uuid(),
  class_id text not null references public.classes(id) on delete cascade,
  subject text not null,
  title text not null,
  description text,
  due_date date not null,
  kind text not null default 'homework' check (kind in ('homework', 'notes')),
  teacher_id uuid references public.teachers(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.homework_completion (
  student_id uuid references public.students(id) on delete cascade,
  homework_id uuid references public.homework(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (student_id, homework_id)
);
create type public.attendance_status as enum ('present', 'absent', 'late');
create table public.attendance (
  date date not null,
  class_id text not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status public.attendance_status not null,
  recorded_by uuid references auth.users(id),
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

-- RLS is enabled for every application table.
alter table public.user_roles enable row level security;
alter table public.classes enable row level security;
alter table public.teachers enable row level security;
alter table public.teacher_stages enable row level security;
alter table public.teacher_class_assignments enable row level security;
alter table public.students enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.installments enable row level security;
alter table public.payments enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;
alter table public.timetable_slots enable row level security;
alter table public.homework enable row level security;
alter table public.homework_completion enable row level security;
alter table public.attendance enable row level security;
alter table public.calendar_events enable row level security;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "read classes" on public.classes for select to authenticated using (true);
create policy "read teachers" on public.teachers for select to authenticated using (true);
create policy "read teacher stages" on public.teacher_stages for select to authenticated using (true);
create policy "read teacher assignments" on public.teacher_class_assignments for select to authenticated using (true);
create policy "read announcements" on public.announcements for select to authenticated using (true);
create policy "public news" on public.announcements for select to anon using (category in ('general', 'activities'));
create policy "read timetable" on public.timetable_slots for select to authenticated using (true);
create policy "read homework" on public.homework for select to authenticated using (true);
create policy "read events" on public.calendar_events for select to authenticated using (true);
create policy "student own profile" on public.students for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'));
create policy "student own installments" on public.installments for select to authenticated
  using (student_id in (select id from public.students where user_id = auth.uid()) or public.has_role(auth.uid(), 'admin'));
create policy "student own payments" on public.payments for select to authenticated
  using (student_id in (select id from public.students where user_id = auth.uid()) or public.has_role(auth.uid(), 'admin'));
create policy "student own attendance" on public.attendance for select to authenticated
  using (student_id in (select id from public.students where user_id = auth.uid()) or public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'));
create policy "student own homework completion" on public.homework_completion for all to authenticated
  using (student_id in (select id from public.students where user_id = auth.uid()))
  with check (student_id in (select id from public.students where user_id = auth.uid()));
create policy "student own notifications" on public.notifications for select to authenticated
  using (target_user = auth.uid() or target_user is null);
create policy "own notification reads" on public.notification_reads for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admin profile self or admin" on public.admin_profiles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "teacher attendance write" on public.attendance for all to authenticated
  using (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'));
create policy "teacher homework write" on public.homework for all to authenticated
  using (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'));
create policy "teacher scoped announcements" on public.announcements for insert to authenticated
  with check (public.has_role(auth.uid(), 'teacher') and audience <> 'all');

create policy "admin manage classes" on public.classes for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin manage students" on public.students for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin manage teachers" on public.teachers for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin manage teacher stages" on public.teacher_stages for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin manage teacher assignments" on public.teacher_class_assignments for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin manage admin profiles" on public.admin_profiles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin manage installments" on public.installments for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin manage payments" on public.payments for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin manage announcements" on public.announcements for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin manage timetable" on public.timetable_slots for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin manage events" on public.calendar_events for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin notifications" on public.notifications for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'teacher'));

-- Authenticated users can read; mutations remain restricted by RLS policies.
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
