import type {
  CalendarDate,
  HabitRuleVersion,
  HabitSchedule,
  TimeSlot,
} from './types';
import type { ItemStatus } from './items';

/** Hábito con todas las versiones de su regla, sin dependencias de persistencia. */
export interface Habit {
  id: string;
  name: string;
  categoryId: string | null;
  sectionId: string | null;
  startDate: CalendarDate;
  timeOfDay: string | null; // HH:MM.
  timeSlot: TimeSlot | null;
  durationMinutes: number | null;
  ruleVersions: HabitRuleVersion[];
  /** Fecha de archivo en la zona del dispositivo; null si está activo. */
  archivedOn: CalendarDate | null;
}

/** Solo las ocurrencias resueltas tienen una marca persistida. */
export interface HabitMark {
  habitId: string;
  date: CalendarDate;
  status: 'done' | 'not_done';
  markedAt: string; // Instante UTC ISO.
}

export interface Task {
  id: string;
  name: string;
  notes: string | null;
  categoryId: string | null;
  sectionId: string | null;
  dueDate: CalendarDate | null;
  dueTime: string | null; // HH:MM.
  status: ItemStatus;
  markedAt: string | null;
  archivedOn: CalendarDate | null;
}

/** Extrae el contrato del motor sin cambiar fechas ni reglas (ADR-0003). */
export function toHabitSchedule(habit: Habit): HabitSchedule {
  return {
    habitId: habit.id,
    startDate: habit.startDate,
    timeOfDay: habit.timeOfDay,
    timeSlot: habit.timeSlot,
    ruleVersions: habit.ruleVersions,
  };
}
