import { addDays, getIsoWeekday } from './calendar-date';
import type { CalendarDate } from './types';
export interface QuickAddDefaults {
  dueDate: CalendarDate | null;
  categoryId: string | null;
  sectionId: string | null;
}
export type QuickAddOrigin =
  | { kind: 'today' | 'other' }
  | { kind: 'category'; categoryId: string }
  | { kind: 'section'; categoryId: string; sectionId: string };
export type QuickAddDateShortcut = 'none' | 'today' | 'tomorrow' | 'monday';
export function getQuickAddDefaults(
  origin: QuickAddOrigin,
  today: CalendarDate,
): QuickAddDefaults {
  if (origin.kind === 'today') {
    return { dueDate: today, categoryId: null, sectionId: null };
  }
  if (origin.kind === 'category') {
    return { dueDate: null, categoryId: origin.categoryId, sectionId: null };
  }
  if (origin.kind === 'section') {
    return {
      dueDate: null,
      categoryId: origin.categoryId,
      sectionId: origin.sectionId,
    };
  }
  return { dueDate: null, categoryId: null, sectionId: null };
}
export function getQuickAddStartDate(
  date: CalendarDate | null,
  today: CalendarDate,
): CalendarDate {
  return date ?? today;
}
export function getQuickAddShortcutDate(
  shortcut: QuickAddDateShortcut,
  today: CalendarDate,
): CalendarDate | null {
  if (shortcut === 'none') {
    return null;
  }
  if (shortcut === 'today') {
    return today;
  }
  if (shortcut === 'tomorrow') {
    return addDays(today, 1);
  }
  const weekday = getIsoWeekday(today);
  const daysUntilMonday = 8 - weekday;
  return addDays(today, daysUntilMonday);
}
