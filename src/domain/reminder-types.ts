import type { CalendarDate } from './types';

export type ReminderLead = 7 | 3 | 1 | 0;

export interface ReminderSettings {
  enabled: boolean;
  taskLeads: ReminderLead[];
  habitTimeSlots: boolean;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  taskLeads: [3, 1, 0],
  habitTimeSlots: false,
};

export type ReminderChannel = 'tasks' | 'habits';

export interface PlannedReminder {
  key: string;
  date: CalendarDate;
  time: string;
  title: string;
  body: string;
  channel: ReminderChannel;
  target:
    | { kind: 'task'; taskId: string }
    | { kind: 'habit'; habitId: string; date: CalendarDate };
}
