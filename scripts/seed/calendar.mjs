// Aritmética de fechas de calendario `YYYY-MM-DD`, sin zonas horarias.
const MILLISECONDS_PER_DAY = 86_400_000;

function toUtcDate(date) {
  return new Date(`${date}T00:00:00.000Z`);
}

export function addDays(date, amount) {
  const instant = toUtcDate(date);
  instant.setUTCDate(instant.getUTCDate() + amount);
  return instant.toISOString().slice(0, 10);
}

export function daysBetween(from, to) {
  const difference = toUtcDate(to).getTime() - toUtcDate(from).getTime();
  return difference / MILLISECONDS_PER_DAY;
}

// Días ISO: 1 = lunes ... 7 = domingo.
export function getIsoWeekday(date) {
  const weekday = toUtcDate(date).getUTCDay();
  if (weekday === 0) {
    return 7;
  }
  return weekday;
}

export function getDayOfMonth(date) {
  return toUtcDate(date).getUTCDate();
}

export function getLastDayOfMonth(date) {
  const instant = toUtcDate(date);
  const nextMonthStart = Date.UTC(
    instant.getUTCFullYear(),
    instant.getUTCMonth() + 1,
    0,
  );
  return new Date(nextMonthStart).getUTCDate();
}

export function getCalendarDateInTimeZone(instant, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone });
  return formatter.format(instant);
}
