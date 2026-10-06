import { describe, expect, test } from '@jest/globals';

import {
  addDays,
  compareCalendarDates,
  daysBetween,
  getCalendarDateInTimeZone,
  getIsoWeekday,
  getLastDayOfMonth,
  parseCalendarDate,
} from './calendar-date';

describe('calendar dates', () => {
  test.each(['2024-02-29', '2026-12-31', '0099-01-01', '0000-02-29'])(
    'accepts real date %s',
    (date) => {
      expect(parseCalendarDate(date)).toBe(date);
    },
  );

  test.each([
    '2026-02-29',
    '1900-02-29',
    '2026-04-31',
    '2026-00-01',
    '2026-13-01',
    '2026-01-00',
    '2026-1-01',
    '2026-01-01T00:00:00Z',
    'invalid',
  ])('rejects invalid date %s', (date) => {
    expect(() => parseCalendarDate(date)).toThrow(Error);
  });

  test('compares dates chronologically', () => {
    expect(compareCalendarDates('2025-12-31', '2026-01-01')).toBeLessThan(0);
    expect(compareCalendarDates('2026-01-01', '2025-12-31')).toBeGreaterThan(0);
    expect(compareCalendarDates('2026-01-01', '2026-01-01')).toBe(0);
  });

  test.each([
    ['2026-03-28', 2, '2026-03-30'],
    ['2026-10-24', 2, '2026-10-26'],
    ['2024-02-28', 1, '2024-02-29'],
    ['2026-03-01', -1, '2026-02-28'],
    ['2026-12-31', 1, '2027-01-01'],
    ['0099-12-31', 1, '0100-01-01'],
    ['2026-01-01', 0, '2026-01-01'],
  ])('adds calendar days to %s', (date, amount, expected) => {
    expect(addDays(date, amount)).toBe(expected);
  });

  test('counts signed days across clock changes and year boundaries', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
    expect(daysBetween('2027-01-01', '2026-12-31')).toBe(-1);
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0);
  });

  test.each([
    ['2026-03-23', 1],
    ['2026-03-24', 2],
    ['2026-03-25', 3],
    ['2026-03-26', 4],
    ['2026-03-27', 5],
    ['2026-03-28', 6],
    ['2026-03-29', 7],
  ])('uses ISO weekdays for %s', (date, expected) => {
    expect(getIsoWeekday(date)).toBe(expected);
  });

  test.each([
    ['2024-02-01', 29],
    ['2026-02-01', 28],
    ['1900-02-01', 28],
    ['2000-02-01', 29],
    ['2026-04-15', 30],
    ['2026-12-01', 31],
    ['0099-02-01', 28],
  ])('finds the last day of the month for %s', (date, expected) => {
    expect(getLastDayOfMonth(date)).toBe(expected);
  });

  test.each([
    ['2026-03-28T23:30:00Z', 'Europe/Madrid', '2026-03-29'],
    ['2026-03-29T01:30:00Z', 'Europe/Madrid', '2026-03-29'],
    ['2026-10-25T00:30:00Z', 'Europe/Madrid', '2026-10-25'],
    ['2026-10-25T01:30:00Z', 'Europe/Madrid', '2026-10-25'],
    ['2026-01-01T00:30:00Z', 'America/Los_Angeles', '2025-12-31'],
    ['2026-12-31T12:30:00Z', 'Pacific/Auckland', '2027-01-01'],
    ['2026-01-01T00:30:00Z', 'UTC', '2026-01-01'],
  ])('converts %s in %s', (instant, timeZone, expected) => {
    expect(getCalendarDateInTimeZone(new Date(instant), timeZone)).toBe(
      expected,
    );
  });
});
