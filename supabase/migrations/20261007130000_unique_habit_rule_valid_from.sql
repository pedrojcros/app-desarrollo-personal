-- Corrección de la revisión de T03: dos versiones de regla de un mismo hábito
-- con el mismo valid_from no tienen un orden definido, y el motor de
-- ocurrencias elegiría una u otra según el orden en que llegasen. Se prohíbe
-- en la base de datos para que el dato corrupto no pueda existir.
alter table public.habit_rules
  add constraint habit_rules_habit_id_valid_from_key
  unique (habit_id, valid_from);
