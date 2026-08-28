-- Al Shaimaa Academy initial PostgreSQL schema
-- Run in Supabase SQL Editor after reviewing/customizing it.

create type user_role as enum ('admin', 'teacher', 'student');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role user_role not null default 'student',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles(id) on delete cascade,
  date_of_birth date,
  country text,
  parent_name text,
  parent_phone text,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles(id) on delete cascade,
  specialization text,
  bio text,
  hourly_rate numeric(10,2),
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null,
  level text,
  duration_weeks integer,
  price numeric(10,2),
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  course_id uuid not null references courses(id) on delete restrict,
  teacher_id uuid references teachers(id) on delete set null,
  start_date date not null default current_date,
  end_date date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references enrollments(id) on delete cascade,
  teacher_id uuid references teachers(id) on delete set null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  meeting_url text,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now()
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status text not null check (status in ('present','absent','late','excused')),
  note text,
  recorded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(class_id, student_id)
);

create table progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  course_id uuid references courses(id) on delete set null,
  teacher_id uuid references teachers(id) on delete set null,
  score numeric(5,2),
  level text,
  comment text,
  recorded_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  payment_date date not null default current_date,
  method text,
  reference text,
  status text not null default 'paid',
  note text,
  created_at timestamptz not null default now()
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete set null,
  teacher_id uuid references teachers(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  created_at timestamptz not null default now()
);

create table assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  submission_url text,
  comment text,
  grade numeric(5,2),
  status text not null default 'submitted',
  submitted_at timestamptz not null default now(),
  unique(assignment_id, student_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_enrollments_student on enrollments(student_id);
create index idx_enrollments_teacher on enrollments(teacher_id);
create index idx_classes_scheduled_at on classes(scheduled_at);
create index idx_attendance_student on attendance(student_id);
create index idx_payments_student on payments(student_id);
create index idx_notifications_recipient on notifications(recipient_id);
