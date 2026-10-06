/** Fecha de calendario 'YYYY-MM-DD', sin hora ni zona (ADR-0003). */
export type CalendarDate = string;

export type Frequency = 'daily' | 'weekdays' | 'every_n_days' | 'monthly';
export type TimeSlot = 'morning' | 'afternoon' | 'night';

/** Día ISO de la semana: 1 = lunes … 7 = domingo. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Versión vigente desde validFrom, inclusive. */
export interface HabitRuleVersion {
  validFrom: CalendarDate;
  frequency: Frequency;
  weekdays: IsoWeekday[]; // Solo con 'weekdays'.
  intervalDays: number | null; // Solo con 'every_n_days'; entero >= 1.
}

export interface HabitSchedule {
  habitId: string;
  startDate: CalendarDate;
  timeOfDay: string | null; // 'HH:MM'; nunca junto a timeSlot.
  timeSlot: TimeSlot | null;
  ruleVersions: HabitRuleVersion[]; // En cualquier orden.
}

export interface Occurrence {
  habitId: string;
  date: CalendarDate;
  /** Hora exacta, de la franja o null si no tiene momento. */
  sortTime: string | null;
}
