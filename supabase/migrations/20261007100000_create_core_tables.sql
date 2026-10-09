-- Tablas del modelo de datos de la versión 1 (docs/04-arquitectura.md).
--
-- Decisiones de seguridad que conviene revisar:
-- * Toda tabla lleva user_id (por defecto, el usuario que hace la petición).
-- * Las claves foráneas entre tablas incluyen user_id, para que nadie pueda
--   enlazar sus filas con las de otro usuario aunque conozca sus identificadores.
-- * Las políticas RLS están en la migración siguiente.

create type public.habit_time_slot as enum ('morning', 'afternoon', 'night');
create type public.habit_frequency as enum ('daily', 'weekdays', 'every_n_days', 'monthly');
create type public.mark_status as enum ('done', 'not_done');
create type public.task_status as enum ('pending', 'done', 'not_done');

-- Categorías: el contenedor principal. Una tarea u hábito sin categoría está en la Bandeja.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  icon text,
  color text,
  -- Necesario para que las claves foráneas compuestas incluyan user_id.
  unique (id, user_id)
);

-- El nombre es único por usuario sin distinguir mayúsculas.
create unique index categories_user_id_lower_name_key
  on public.categories (user_id, lower(name));

-- Secciones: una parte de una categoría.
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  name text not null check (btrim(name) <> ''),
  -- Necesario para que hábitos y tareas comprueben que la sección es de su categoría.
  unique (id, category_id, user_id),
  foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete cascade
);

-- El nombre es único dentro de su categoría.
create unique index sections_category_id_lower_name_key
  on public.sections (category_id, lower(name));
create index sections_user_id_idx on public.sections (user_id);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Vacío = Bandeja.
  category_id uuid,
  -- Vacío = sin sección. Si existe, es de la misma categoría.
  section_id uuid,
  name text not null check (btrim(name) <> ''),
  start_date date not null,
  time_of_day time,
  time_slot public.habit_time_slot,
  duration_minutes integer check (duration_minutes > 0),
  archived_at timestamptz,
  unique (id, user_id),
  foreign key (category_id, user_id)
    references public.categories (id, user_id),
  foreign key (section_id, category_id, user_id)
    references public.sections (id, category_id, user_id)
    on delete set null (section_id),
  -- La clave foránea compuesta no se comprueba si category_id es nulo: se exige aquí.
  constraint habits_section_requires_category check (section_id is null or category_id is not null),
  constraint habits_time_of_day_or_time_slot check (time_of_day is null or time_slot is null)
);

create index habits_user_id_idx on public.habits (user_id);
create index habits_category_id_idx on public.habits (category_id);
create index habits_section_id_idx on public.habits (section_id);

-- Versiones de la regla de repetición de un hábito (ADR-0003).
create table public.habit_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id uuid not null,
  valid_from date not null,
  frequency public.habit_frequency not null,
  -- Días ISO: 1 = lunes ... 7 = domingo. Contrato con el motor de ocurrencias (T03).
  weekdays smallint[],
  interval_days integer,
  foreign key (habit_id, user_id)
    references public.habits (id, user_id) on delete cascade,
  constraint habit_rules_weekdays_are_iso_days
    check (weekdays is null or weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]),
  constraint habit_rules_weekdays_required
    check (frequency <> 'weekdays' or cardinality(weekdays) >= 1),
  constraint habit_rules_interval_days_required
    check (frequency <> 'every_n_days' or interval_days is not null),
  constraint habit_rules_interval_days_positive
    check (interval_days is null or interval_days >= 1)
);

create index habit_rules_user_id_idx on public.habit_rules (user_id);
create index habit_rules_habit_id_idx on public.habit_rules (habit_id);

-- Marcas de ocurrencias: una por hábito y día de calendario.
create table public.habit_marks (
  habit_id uuid not null,
  occurrence_date date not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status public.mark_status not null,
  marked_at timestamptz not null default now(),
  primary key (habit_id, occurrence_date),
  foreign key (habit_id, user_id)
    references public.habits (id, user_id) on delete cascade
);

create index habit_marks_user_id_idx on public.habit_marks (user_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Vacío = Bandeja.
  category_id uuid,
  -- Vacío = sin sección. Si existe, es de la misma categoría.
  section_id uuid,
  name text not null check (btrim(name) <> ''),
  notes text,
  due_date date,
  due_time time,
  status public.task_status not null default 'pending',
  marked_at timestamptz,
  archived_at timestamptz,
  foreign key (category_id, user_id)
    references public.categories (id, user_id),
  foreign key (section_id, category_id, user_id)
    references public.sections (id, category_id, user_id)
    on delete set null (section_id),
  constraint tasks_section_requires_category check (section_id is null or category_id is not null),
  constraint tasks_due_time_requires_due_date check (due_time is null or due_date is not null)
);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_category_id_idx on public.tasks (category_id);
create index tasks_section_id_idx on public.tasks (section_id);
create index tasks_due_date_idx on public.tasks (due_date);
