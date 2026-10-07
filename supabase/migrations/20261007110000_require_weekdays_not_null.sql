-- Corrección de la revisión: con frequency = 'weekdays', un weekdays nulo
-- hacía que cardinality(...) fuese nulo y el CHECK lo aceptaba (un CHECK solo
-- rechaza cuando da falso). Ahora se exige explícitamente que no sea nulo.
alter table public.habit_rules
  drop constraint habit_rules_weekdays_required;

alter table public.habit_rules
  add constraint habit_rules_weekdays_required
  check (
    frequency <> 'weekdays'
    or (weekdays is not null and cardinality(weekdays) >= 1)
  );
