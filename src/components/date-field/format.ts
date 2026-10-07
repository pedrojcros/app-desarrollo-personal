import type { CalendarDate } from '@/domain/types';

const fullDateFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const accessibleDateFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});
const shortDateFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
export function formatFullDate(value: CalendarDate): string {
  return fullDateFormatter.format(new Date(`${value}T12:00:00Z`));
}
export function formatAccessibleDate(value: CalendarDate): string {
  const formatted = accessibleDateFormatter.format(
    new Date(`${value}T12:00:00Z`),
  );
  return formatted.replace(',', '');
}
export function formatShortDate(value: CalendarDate): string {
  const formatted = shortDateFormatter.format(new Date(`${value}T12:00:00Z`));
  const withoutPunctuation = formatted.replace('.', '');
  return (
    withoutPunctuation.charAt(0).toUpperCase() + withoutPunctuation.slice(1)
  );
}
export function toDeviceDate(value: CalendarDate): Date {
  return new Date(`${value}T12:00:00`);
}
export function fromDeviceDate(value: Date): CalendarDate {
  const year = String(value.getFullYear()).padStart(4, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
export function fromDeviceTime(value: Date): string {
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
