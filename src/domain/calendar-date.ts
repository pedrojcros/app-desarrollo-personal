import type { CalendarDate, IsoWeekday } from './types';

const MILLISECONDS_PER_DAY = 86_400_000;
const CALENDAR_DATE_LENGTH = 10;

// La 'Z' fija UTC: sin ella el resultado dependería de la zona del proceso.
function toUtcDate(date: CalendarDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function formatCalendarDate(instant: Date): CalendarDate {
  const isoText = instant.toISOString();
  return isoText.slice(0, CALENDAR_DATE_LENGTH);
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
  // Date desborda en vez de fallar (2026-02-30 pasa a 2026-03-02), así que
  // se compara con lo que se escribió para detectar las fechas que no existen.
  const normalized = formatCalendarDate(instant);
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
  const result = formatCalendarDate(instant);
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

/** Número del día del mes, entre 1 y 31. */
export function getDayOfMonth(date: CalendarDate): number {
  return toUtcDate(date).getUTCDate();
}

/** Número del último día del mes, entre 28 y 31. */
export function getLastDayOfMonth(date: CalendarDate): number {
  const instant = toUtcDate(date);
  const month = instant.getUTCMonth();
  instant.setUTCMonth(month + 1, 0);
  return instant.getUTCDate();
}

// Crear un Intl.DateTimeFormat es caro: se guarda uno por zona horaria.
const formatterByTimeZone = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  const cachedFormatter = formatterByTimeZone.get(timeZone);
  if (cachedFormatter !== undefined) {
    return cachedFormatter;
  }
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  formatterByTimeZone.set(timeZone, formatter);
  return formatter;
}

function getDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: 'year' | 'month' | 'day',
): string {
  const part = parts.find((candidate) => candidate.type === type);
  if (part === undefined) {
    throw new Error(`Could not read the ${type} from the formatted date`);
  }
  return part.value;
}

export function getCalendarDateInTimeZone(
  instant: Date,
  timeZone: string,
): CalendarDate {
  const formatter = getFormatter(timeZone);
  const parts = formatter.formatToParts(instant);
  const year = getDatePart(parts, 'year');
  const month = getDatePart(parts, 'month');
  const day = getDatePart(parts, 'day');
  // Intl escribe los años menores de 1000 sin ceros a la izquierda.
  const paddedYear = year.padStart(4, '0');
  return parseCalendarDate(`${paddedYear}-${month}-${day}`);
}
