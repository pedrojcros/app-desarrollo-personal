import type { CalendarDate, IsoWeekday } from './types';

const MILLISECONDS_PER_DAY = 86_400_000;

function toUtcDate(date: CalendarDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function parseCalendarDate(value: string): CalendarDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Invalid calendar date: expected YYYY-MM-DD');
  }
  const instant = toUtcDate(value);
  const timestamp = instant.getTime();
  if (!Number.isFinite(timestamp)) {
    throw new Error('Invalid calendar date: date does not exist');
  }
  const normalized = instant.toISOString().slice(0, 10);
  if (normalized !== value) {
    throw new Error('Invalid calendar date: date does not exist');
  }
  return value;
}

export function compareCalendarDates(
  first: CalendarDate,
  second: CalendarDate,
): number {
  if (first === second) {
    return 0;
  }
  return first < second ? -1 : 1;
}

export function addDays(date: CalendarDate, amount: number): CalendarDate {
  const instant = toUtcDate(date);
  const day = instant.getUTCDate();
  instant.setUTCDate(day + amount);
  const result = instant.toISOString().slice(0, 10);
  return parseCalendarDate(result);
}

export function daysBetween(from: CalendarDate, to: CalendarDate): number {
  const fromTimestamp = toUtcDate(from).getTime();
  const toTimestamp = toUtcDate(to).getTime();
  return (toTimestamp - fromTimestamp) / MILLISECONDS_PER_DAY;
}

export function getIsoWeekday(date: CalendarDate): IsoWeekday {
  const weekday = toUtcDate(date).getUTCDay();
  if (weekday === 0) {
    return 7;
  }
  return weekday as IsoWeekday;
}

/** Número del último día del mes, entre 28 y 31. */
export function getLastDayOfMonth(date: CalendarDate): number {
  const instant = toUtcDate(date);
  const month = instant.getUTCMonth();
  instant.setUTCMonth(month + 1, 0);
  return instant.getUTCDate();
}

export function getCalendarDateInTimeZone(
  instant: Date,
  timeZone: string,
): CalendarDate {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(instant);
  const year = parts.find((part) => part.type === 'year')!.value;
  const month = parts.find((part) => part.type === 'month')!.value;
  const day = parts.find((part) => part.type === 'day')!.value;
  return parseCalendarDate(`${year.padStart(4, '0')}-${month}-${day}`);
}
