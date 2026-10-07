-- Cambia el nombre del argumento date: ningún llamante puede elegir una fecha
-- de validez pasada; hoy sigue viniendo de la zona del dispositivo (ADR-0003).
drop function public.set_habit_rule(uuid, date, public.habit_frequency, smallint[], integer);

create function public.set_habit_rule(
  p_habit_id uuid,
  p_today date,
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
  effective_date date;
  previous_rule public.habit_rules%rowtype;
  effective_rule public.habit_rules%rowtype;
begin
  -- El mismo bloqueo que usa mover el inicio serializa los cambios del hábito.
  select start_date into habit_start_date
  from public.habits where id = p_habit_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Habit not found';
  end if;
  if p_today is null or p_frequency is null then
    raise exception using errcode = 'P1002', message = 'Today and frequency are required';
  end if;
  if p_frequency = 'every_n_days' and (p_interval_days is null or p_interval_days not between 1 and 365) then
    raise exception using errcode = 'P1002', message = 'Invalid interval days';
  end if;

  effective_date := greatest(p_today, habit_start_date);
  select * into previous_rule from public.habit_rules
  where habit_id = p_habit_id and valid_from < effective_date
  order by valid_from desc limit 1;

  -- Deshacer hoy recupera el anclaje anterior, no una copia anclada en hoy.
  -- La primera versión no tiene anterior y por eso nunca se borra aquí.
  if previous_rule.id is not null
     and previous_rule.frequency = p_frequency
     and coalesce(previous_rule.weekdays, array[]::smallint[]) = coalesce(p_weekdays, array[]::smallint[])
     and previous_rule.interval_days is not distinct from p_interval_days then
    delete from public.habit_rules
    where habit_id = p_habit_id and valid_from = effective_date;
    return;
  end if;

  select * into effective_rule from public.habit_rules
  where habit_id = p_habit_id and valid_from = effective_date;

  -- Repetir el guardado de una versión existente tampoco cambia su identidad.
  if effective_rule.id is not null
     and effective_rule.frequency = p_frequency
     and coalesce(effective_rule.weekdays, array[]::smallint[]) = coalesce(p_weekdays, array[]::smallint[])
     and effective_rule.interval_days is not distinct from p_interval_days then
    return;
  end if;

  insert into public.habit_rules (habit_id, valid_from, frequency, weekdays, interval_days)
  values (p_habit_id, effective_date, p_frequency, p_weekdays, p_interval_days)
  on conflict (habit_id, valid_from) do update
  set frequency = excluded.frequency,
      weekdays = excluded.weekdays,
      interval_days = excluded.interval_days;
end;
$$;

-- La edición completa es atómica: si el inicio o la regla fallan, los campos
-- anteriores se conservan. La política de versiones vive solo en set_habit_rule.
create or replace function public.update_habit(
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
  end if;
  if p_frequency is null then
    return;
  end if;
  perform public.set_habit_rule(p_habit_id, p_today, p_frequency, p_weekdays, p_interval_days);
end;
$$;

-- Invoker conserva RLS; las dos entradas exigen autenticación.
revoke all on function public.set_habit_rule(uuid, date, public.habit_frequency, smallint[], integer) from public, anon;
revoke all on function public.update_habit(uuid, text, date, uuid, uuid, time, public.habit_time_slot, date, public.habit_frequency, smallint[], integer) from public, anon;
grant execute on function public.set_habit_rule(uuid, date, public.habit_frequency, smallint[], integer) to authenticated;
grant execute on function public.update_habit(uuid, text, date, uuid, uuid, time, public.habit_time_slot, date, public.habit_frequency, smallint[], integer) to authenticated;
