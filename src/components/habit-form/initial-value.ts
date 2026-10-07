import { z } from 'zod';
import { parseCalendarDate } from '@/domain/calendar-date';
import type { Habit } from '@/domain/entities';
import type { HabitInput } from '@/data/habits';

export function readHabitRouteDefaults(
  parameters: {
    categoryId?: string | string[];
    sectionId?: string | string[];
    startDate?: string | string[];
  },
  today: string,
): Partial<HabitInput> {
  const defaults: Partial<HabitInput> = {};
  const category = z.uuid().safeParse(parameters.categoryId);
  if (category.success) {
    defaults.categoryId = category.data;
    const section = z.uuid().safeParse(parameters.sectionId);
    if (section.success) {
      defaults.sectionId = section.data;
    }
  }
  if (typeof parameters.startDate !== 'string') {
    return defaults;
  }
  try {
    const startDate = parseCalendarDate(parameters.startDate);
    if (startDate >= today) {
      defaults.startDate = startDate;
    }
  } catch {
    // Un enlace mal formado mantiene los valores seguros del formulario.
  }
  return defaults;
}

export function habitToFormValue(habit: Habit): HabitInput {
  const rule = habit.ruleVersions[habit.ruleVersions.length - 1];
  return {
    name: habit.name,
    categoryId: habit.categoryId,
    sectionId: habit.sectionId,
    startDate: habit.startDate,
    timeOfDay: habit.timeOfDay,
    timeSlot: habit.timeSlot,
    frequency: rule.frequency,
    weekdays: rule.weekdays,
    intervalDays: rule.intervalDays,
  };
}
