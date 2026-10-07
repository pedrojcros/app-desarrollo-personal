-- El hábito y su primera regla forman una unidad: un fallo revierte ambos.
create function public.create_habit(
  p_name text,
  p_start_date date,
  p_frequency public.habit_frequency,
  p_category_id uuid default null,
  p_section_id uuid default null,
  p_time_of_day time default null,
  p_time_slot public.habit_time_slot default null,
  p_weekdays smallint[] default null,
  p_interval_days integer default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_habit_id uuid;
begin
  if p_name is null or char_length(btrim(p_name)) not between 1 and 80 then
    raise exception using errcode = 'P1002', message = 'Invalid habit name';
  end if;
  if p_frequency = 'every_n_days' and (p_interval_days is null or p_interval_days not between 1 and 365) then
    raise exception using errcode = 'P1002', message = 'Invalid interval days';
  end if;

  insert into public.habits (name, category_id, section_id, start_date, time_of_day, time_slot)
  values (btrim(p_name), p_category_id, p_section_id, p_start_date, p_time_of_day, p_time_slot)
  returning id into created_habit_id;

  insert into public.habit_rules (habit_id, valid_from, frequency, weekdays, interval_days)
  values (created_habit_id, p_start_date, p_frequency, p_weekdays, p_interval_days);
  return created_habit_id;
end;
$$;

create function public.set_habit_rule(
  p_habit_id uuid,
  p_valid_from date,
  p_frequency public.habit_frequency,
  p_weekdays smallint[] default null,
  p_interval_days integer default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  habit_start_date date;
begin
  -- Todas las operaciones de reglas bloquean primero el hábito para evitar
  -- que mover el inicio y cambiar la regla se crucen y dejen dos primeras reglas.
  select start_date into habit_start_date
  from public.habits where id = p_habit_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Habit not found';
  end if;
  if p_valid_from is null or p_valid_from < habit_start_date then
    raise exception using errcode = 'P1002', message = 'Rule cannot precede habit start date';
  end if;
  if p_frequency = 'every_n_days' and (p_interval_days is null or p_interval_days not between 1 and 365) then
    raise exception using errcode = 'P1002', message = 'Invalid interval days';
  end if;

  -- Dos cambios en la misma fecha sustituyen la versión, sin duplicarla.
  insert into public.habit_rules (habit_id, valid_from, frequency, weekdays, interval_days)
  values (p_habit_id, p_valid_from, p_frequency, p_weekdays, p_interval_days)
  on conflict (habit_id, valid_from) do update
  set frequency = excluded.frequency,
      weekdays = excluded.weekdays,
      interval_days = excluded.interval_days;
end;
$$;

create function public.move_habit_start_date(
  p_habit_id uuid,
  p_new_start_date date,
  p_today date
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  habit_start_date date;
  rule_count integer;
begin
  select start_date into habit_start_date
  from public.habits where id = p_habit_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Habit not found';
  end if;
  -- Hoy viene del dispositivo: current_date usaría la zona del servidor.
  if p_today is null or p_new_start_date is null then
    raise exception using errcode = 'P1002', message = 'Calendar dates are required';
  end if;
  if habit_start_date <= p_today then
    raise exception using errcode = 'P1001', message = 'Habit has already started';
  end if;
  if p_new_start_date < p_today then
    raise exception using errcode = 'P1002', message = 'New start date cannot precede today';
  end if;
  select count(*) into rule_count from public.habit_rules where habit_id = p_habit_id;
  if rule_count <> 1 then
    raise exception using errcode = 'P1002', message = 'Moving requires exactly one rule version';
  end if;

  update public.habits set start_date = p_new_start_date where id = p_habit_id;
  update public.habit_rules set valid_from = p_new_start_date where habit_id = p_habit_id;
end;
$$;

-- Invoker mantiene RLS; solo un usuario autenticado puede ejecutar las funciones.
revoke all on function public.create_habit(text, date, public.habit_frequency, uuid, uuid, time, public.habit_time_slot, smallint[], integer) from public, anon;
revoke all on function public.set_habit_rule(uuid, date, public.habit_frequency, smallint[], integer) from public, anon;
revoke all on function public.move_habit_start_date(uuid, date, date) from public, anon;
grant execute on function public.create_habit(text, date, public.habit_frequency, uuid, uuid, time, public.habit_time_slot, smallint[], integer) to authenticated;
grant execute on function public.set_habit_rule(uuid, date, public.habit_frequency, smallint[], integer) to authenticated;
grant execute on function public.move_habit_start_date(uuid, date, date) to authenticated;
-- Autorizado por el orquestador: la edición completa debe conservar los datos
-- anteriores si falla cualquier parte, igual que la creación (CU-06 E2).
create function public.update_habit(
  p_habit_id uuid,
  p_name text,
  p_today date,
  p_category_id uuid default null,
  p_section_id uuid default null,
  p_time_of_day time default null,
  p_time_slot public.habit_time_slot default null,
  p_new_start_date date default null,
  p_frequency public.habit_frequency default null,
  p_weekdays smallint[] default null,
  p_interval_days integer default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  habit_start_date date;
  effective_date date;
  current_rule public.habit_rules%rowtype;
begin
  select start_date into habit_start_date
  from public.habits where id = p_habit_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Habit not found';
  end if;
  if p_today is null or p_name is null or char_length(btrim(p_name)) not between 1 and 80 then
    raise exception using errcode = 'P1002', message = 'Invalid habit input';
  end if;

  update public.habits
  set name = btrim(p_name), category_id = p_category_id, section_id = p_section_id,
      time_of_day = p_time_of_day, time_slot = p_time_slot
  where id = p_habit_id;

  if p_new_start_date is not null and p_new_start_date <> habit_start_date then
    perform public.move_habit_start_date(p_habit_id, p_new_start_date, p_today);
    habit_start_date := p_new_start_date;
  end if;
  if p_frequency is null then
    return;
  end if;
  effective_date := greatest(p_today, habit_start_date);
  select * into current_rule from public.habit_rules
  where habit_id = p_habit_id and valid_from <= effective_date
  order by valid_from desc limit 1;

  -- Guardar solo el nombre no reinicia el anclaje de «cada N días» o mensual.
  if current_rule.frequency = p_frequency
     and coalesce(current_rule.weekdays, array[]::smallint[]) = coalesce(p_weekdays, array[]::smallint[])
     and current_rule.interval_days is not distinct from p_interval_days then
    return;
  end if;
  perform public.set_habit_rule(p_habit_id, effective_date, p_frequency, p_weekdays, p_interval_days);
end;
$$;
revoke all on function public.update_habit(uuid, text, date, uuid, uuid, time, public.habit_time_slot, date, public.habit_frequency, smallint[], integer) from public, anon;
grant execute on function public.update_habit(uuid, text, date, uuid, uuid, time, public.habit_time_slot, date, public.habit_frequency, smallint[], integer) to authenticated;
