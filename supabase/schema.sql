-- =====================================================================
-- Lire et écrire au bac : schéma de la base Supabase
-- À exécuter une seule fois dans Supabase > SQL Editor > New query > Run
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Réglages (code enseignant). Modifiez la valeur à votre convenance.
-- ---------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value text not null
);
insert into public.app_settings (key, value) values ('teacher_code', 'CRMEF-2026')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade,
  role text not null check (role in ('student', 'teacher')),
  display_name text not null,
  username text unique,
  class_id uuid,
  consent_research boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text not null default '1bac',
  code text not null unique,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table public.profiles
    add constraint profiles_class_fk foreign key (class_id) references public.classes (id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists public.attempts (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.profiles (id) on delete cascade,
  activity text not null,
  item text not null,
  competence text,
  correct_first boolean,
  correct boolean,
  tries smallint check (tries between 1 and 3),
  answer text,
  points smallint not null default 0 check (points in (0, 5, 10)),
  created_at timestamptz not null default now()
);
create index if not exists attempts_student_idx on public.attempts (student_id);
create index if not exists attempts_activity_idx on public.attempts (activity);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  activity text not null,
  theme smallint,
  level smallint,
  plan jsonb,
  text text not null,
  self_check jsonb,
  status text not null default 'submitted' check (status in ('submitted', 'graded')),
  grades jsonb,
  score numeric(4, 2),
  comment text,
  created_at timestamptz not null default now(),
  graded_at timestamptz
);
create index if not exists submissions_student_idx on public.submissions (student_id);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  title text not null,
  activities text[] not null,
  due_at timestamptz not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists assignments_class_idx on public.assignments (class_id);

-- ---------------------------------------------------------------------
-- Fonctions utilitaires (utilisées par les règles d'accès)
-- ---------------------------------------------------------------------
create or replace function public.my_profile_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where user_id = auth.uid()
$$;

create or replace function public.my_class_id() returns uuid
language sql stable security definer set search_path = public as $$
  select class_id from public.profiles where user_id = auth.uid()
$$;

create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'teacher')
$$;

create or replace function public.teaches_class(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes where id = c and teacher_id = public.my_profile_id())
$$;

create or replace function public.teaches_student(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p join public.classes c on c.id = p.class_id
    where p.id = s and c.teacher_id = public.my_profile_id()
  )
$$;

-- ---------------------------------------------------------------------
-- Création automatique du profil à l'inscription
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  r text := coalesce(m ->> 'role', 'student');
  c uuid;
begin
  if r = 'teacher' then
    if (m ->> 'teacher_code') is distinct from (select value from public.app_settings where key = 'teacher_code') then
      raise exception 'Code enseignant incorrect';
    end if;
    insert into public.profiles (user_id, role, display_name, username)
    values (new.id, 'teacher', coalesce(nullif(m ->> 'display_name', ''), 'Enseignant'), lower(new.email));
  else
    select id into c from public.classes where upper(code) = upper(trim(m ->> 'class_code'));
    if c is null then
      raise exception 'Code de classe inconnu';
    end if;
    insert into public.profiles (user_id, role, display_name, username, class_id, consent_research)
    values (new.id, 'student', coalesce(nullif(m ->> 'display_name', ''), 'Élève'), lower(m ->> 'username'), c,
            coalesce((m ->> 'consent')::boolean, false));
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Fonctions appelées par le site
-- ---------------------------------------------------------------------
create or replace function public.check_class_code(p_code text) returns text
language sql stable security definer set search_path = public as $$
  select name from public.classes where upper(code) = upper(trim(p_code))
$$;

create or replace function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where username = lower(trim(p_username)))
$$;

create or replace function public.check_teacher_code(p_code text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_settings where key = 'teacher_code' and value = trim(p_code))
$$;

create or replace function public.create_class(p_name text, p_level text) returns public.classes
language plpgsql security definer set search_path = public as $$
declare
  k text;
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  res public.classes;
begin
  if not public.is_teacher() then raise exception 'Réservé aux enseignants'; end if;
  loop
    k := case when p_level = '2bac' then '2BAC-' else '1BAC-' end;
    for i in 1..4 loop
      k := k || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.classes where code = k);
  end loop;
  insert into public.classes (name, level, code, teacher_id)
  values (p_name, coalesce(p_level, '1bac'), k, public.my_profile_id())
  returning * into res;
  return res;
end $$;

-- Classe de démonstration (données fictives générées par le site)
create or replace function public.seed_demo(payload jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  t uuid := public.my_profile_id();
  c uuid;
  s jsonb;
  m jsonb := '{}'::jsonb;
  pid uuid;
begin
  if not public.is_teacher() then raise exception 'Réservé aux enseignants'; end if;
  select id into c from public.classes where teacher_id = t and is_demo limit 1;
  if c is not null then return c; end if;
  insert into public.classes (name, level, code, teacher_id, is_demo)
  values (payload -> 'class' ->> 'name', coalesce(payload -> 'class' ->> 'level', '1bac'),
          'DEMO-' || upper(substr(md5(random()::text), 1, 4)), t, true)
  returning id into c;
  for s in select * from jsonb_array_elements(payload -> 'students') loop
    insert into public.profiles (role, display_name, class_id, consent_research, is_demo)
    values ('student', s ->> 'display_name', c, true, true)
    returning id into pid;
    m := m || jsonb_build_object(s ->> 'key', pid);
  end loop;
  insert into public.attempts (student_id, activity, item, competence, correct_first, correct, tries, answer, points, created_at)
  select (m ->> (a ->> 's'))::uuid, a ->> 'activity', a ->> 'item', a ->> 'competence',
         (a ->> 'correct_first')::boolean, (a ->> 'correct')::boolean, (a ->> 'tries')::smallint,
         a ->> 'answer', (a ->> 'points')::smallint, (a ->> 'created_at')::timestamptz
  from jsonb_array_elements(payload -> 'attempts') a;
  insert into public.submissions (student_id, activity, theme, level, plan, text, self_check, status, grades, score, comment, created_at)
  select (m ->> (x ->> 's'))::uuid, x ->> 'activity', (x ->> 'theme')::smallint, (x ->> 'level')::smallint,
         nullif(x -> 'plan', 'null'::jsonb), x ->> 'text', nullif(x -> 'self_check', 'null'::jsonb), x ->> 'status',
         nullif(x -> 'grades', 'null'::jsonb), (x ->> 'score')::numeric, x ->> 'comment', (x ->> 'created_at')::timestamptz
  from jsonb_array_elements(payload -> 'submissions') x;
  insert into public.assignments (class_id, title, activities, due_at, note)
  select c, x ->> 'title', array(select jsonb_array_elements_text(x -> 'activities')),
         (x ->> 'due_at')::timestamptz, x ->> 'note'
  from jsonb_array_elements(payload -> 'assignments') x;
  return c;
end $$;

grant execute on function public.check_class_code(text), public.username_available(text), public.check_teacher_code(text) to anon, authenticated;
grant execute on function public.create_class(text, text), public.seed_demo(jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- Droits explicites (valables même si l'exposition automatique est désactivée)
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant select, update, delete on public.classes to authenticated;
grant select, insert on public.attempts to authenticated;
grant select, insert on public.submissions to authenticated;
grant select, insert, update, delete on public.assignments to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on public.app_settings from anon, authenticated;

-- ---------------------------------------------------------------------
-- Règles d'accès (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.attempts enable row level security;
alter table public.submissions enable row level security;
alter table public.assignments enable row level security;

-- profils : chacun voit le sien ; l'enseignant voit ses élèves
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = public.my_profile_id() or public.teaches_student(id));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = public.my_profile_id()) with check (id = public.my_profile_id());
revoke update on public.profiles from anon, authenticated;
grant update (display_name, consent_research) on public.profiles to authenticated;

-- classes : l'enseignant gère les siennes ; l'élève voit la sienne
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes for select to authenticated
  using (teacher_id = public.my_profile_id() or id = public.my_class_id());
drop policy if exists classes_update on public.classes;
create policy classes_update on public.classes for update to authenticated
  using (teacher_id = public.my_profile_id()) with check (teacher_id = public.my_profile_id());
drop policy if exists classes_delete on public.classes;
create policy classes_delete on public.classes for delete to authenticated
  using (teacher_id = public.my_profile_id());

-- réponses : l'élève écrit et lit les siennes ; l'enseignant lit celles de ses élèves
drop policy if exists attempts_select on public.attempts;
create policy attempts_select on public.attempts for select to authenticated
  using (student_id = public.my_profile_id() or public.teaches_student(student_id));
drop policy if exists attempts_insert on public.attempts;
create policy attempts_insert on public.attempts for insert to authenticated
  with check (student_id = public.my_profile_id());

-- productions : l'élève envoie ; l'enseignant corrige
drop policy if exists submissions_select on public.submissions;
create policy submissions_select on public.submissions for select to authenticated
  using (student_id = public.my_profile_id() or public.teaches_student(student_id));
drop policy if exists submissions_insert on public.submissions;
create policy submissions_insert on public.submissions for insert to authenticated
  with check (student_id = public.my_profile_id() and status = 'submitted' and score is null and grades is null);
drop policy if exists submissions_update on public.submissions;
create policy submissions_update on public.submissions for update to authenticated
  using (public.teaches_student(student_id)) with check (public.teaches_student(student_id));
revoke update on public.submissions from anon, authenticated;
grant update (grades, score, comment, status, graded_at) on public.submissions to authenticated;

-- devoirs : l'enseignant gère ceux de ses classes ; l'élève voit ceux de sa classe
drop policy if exists assignments_select on public.assignments;
create policy assignments_select on public.assignments for select to authenticated
  using (public.teaches_class(class_id) or class_id = public.my_class_id());
drop policy if exists assignments_write on public.assignments;
create policy assignments_write on public.assignments for all to authenticated
  using (public.teaches_class(class_id)) with check (public.teaches_class(class_id));
