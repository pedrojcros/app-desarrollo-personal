-- RLS en todas las tablas (ADR-0004): cada fila solo la ve y la cambia su dueño.
--
-- * Las políticas son solo para `authenticated`; `anon` pierde además todo permiso.
-- * `(select auth.uid())` se evalúa una vez por consulta, no una vez por fila.
-- * Una política por operación y tabla, escritas a mano para poder revisarlas una a una.
-- * `force row level security` obliga también al dueño de la tabla.

revoke all on table
  public.categories,
  public.sections,
  public.habits,
  public.habit_rules,
  public.habit_marks,
  public.tasks
from anon;

-- categories
alter table public.categories enable row level security;
alter table public.categories force row level security;

create policy categories_select_own on public.categories
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy categories_insert_own on public.categories
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy categories_update_own on public.categories
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy categories_delete_own on public.categories
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- sections
alter table public.sections enable row level security;
alter table public.sections force row level security;

create policy sections_select_own on public.sections
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy sections_insert_own on public.sections
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy sections_update_own on public.sections
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy sections_delete_own on public.sections
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- habits
alter table public.habits enable row level security;
alter table public.habits force row level security;

create policy habits_select_own on public.habits
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy habits_insert_own on public.habits
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy habits_update_own on public.habits
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy habits_delete_own on public.habits
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- habit_rules
alter table public.habit_rules enable row level security;
alter table public.habit_rules force row level security;

create policy habit_rules_select_own on public.habit_rules
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy habit_rules_insert_own on public.habit_rules
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy habit_rules_update_own on public.habit_rules
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy habit_rules_delete_own on public.habit_rules
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- habit_marks
alter table public.habit_marks enable row level security;
alter table public.habit_marks force row level security;

create policy habit_marks_select_own on public.habit_marks
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy habit_marks_insert_own on public.habit_marks
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy habit_marks_update_own on public.habit_marks
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy habit_marks_delete_own on public.habit_marks
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- tasks
alter table public.tasks enable row level security;
alter table public.tasks force row level security;

create policy tasks_select_own on public.tasks
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy tasks_insert_own on public.tasks
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy tasks_update_own on public.tasks
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy tasks_delete_own on public.tasks
  for delete to authenticated
  using (user_id = (select auth.uid()));
