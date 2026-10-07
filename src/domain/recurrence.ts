import {
  addDays,
  compareCalendarDates,
  daysBetween,
  getDayOfMonth,
  getIsoWeekday,
  getLastDayOfMonth,
  parseCalendarDate,
} from './calendar-date';
import type {
  CalendarDate,
  HabitRuleVersion,
  HabitSchedule,
  Occurrence,
  TimeSlot,
} from './types';

export const SLOT_TIMES: Record<TimeSlot, string> = {
  morning: '09:00',
  afternoon: '15:00',
  night: '21:00',
};

const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const FIRST_ISO_WEEKDAY = 1;
const LAST_ISO_WEEKDAY = 7;

function validateTimeChoice(schedule: HabitSchedule): void {
  const { timeOfDay, timeSlot } = schedule;
  if (timeOfDay !== null && timeSlot !== null) {
    throw new Error('A habit cannot have both a time of day and a time slot');
  }
  if (timeOfDay !== null && !TIME_OF_DAY_PATTERN.test(timeOfDay)) {
    throw new Error('Time of day must be a valid HH:MM time');
  }
  if (timeSlot !== null && !Object.hasOwn(SLOT_TIMES, timeSlot)) {
    throw new Error('Time slot must be morning, afternoon or night');
  }
}

function validateWeekdays(weekdays: unknown): void {
  if (!Array.isArray(weekdays)) {
    throw new Error('Weekday rules must have a weekdays array');
  }
  if (weekdays.length === 0) {
    throw new Error('Weekday rules must have at least one weekday');
  }
  for (const weekday of weekdays) {
    const isInteger = Number.isInteger(weekday);
    const isInRange =
      weekday >= FIRST_ISO_WEEKDAY && weekday <= LAST_ISO_WEEKDAY;
    if (!isInteger || !isInRange) {
      throw new Error(
        'Weekdays must be integers from 1 (Monday) to 7 (Sunday)',
      );
    }
  }
}

function validateIntervalDays(intervalDays: number | null): void {
  if (
    intervalDays === null ||
    !Number.isInteger(intervalDays) ||
    intervalDays < 1
  ) {
    throw new Error('Interval days must be an integer greater than zero');
  }
}

function validateRuleVersion(rule: HabitRuleVersion): void {
  parseCalendarDate(rule.validFrom);
  const frequency = rule.frequency;
  switch (frequency) {
    case 'daily':
    case 'monthly':
      return;
    case 'weekdays':
      validateWeekdays(rule.weekdays);
      return;
    case 'every_n_days':
      validateIntervalDays(rule.intervalDays);
      return;
    default: {
      const unknownFrequency: never = frequency;
      throw new Error(`Unknown frequency: ${String(unknownFrequency)}`);
    }
  }
}

function sortRuleVersions(rules: HabitRuleVersion[]): HabitRuleVersion[] {
  // Se copia para no mutar la entrada de quien llama.
  const sortedRules = [...rules];
  sortedRules.sort((first, second) =>
    compareCalendarDates(first.validFrom, second.validFrom),
  );
  return sortedRules;
}

function validateRuleVersionOrder(
  rules: HabitRuleVersion[],
  startDate: CalendarDate,
): void {
  const sortedRules = sortRuleVersions(rules);
  if (sortedRules[0].validFrom !== startDate) {
    throw new Error(
      'The first rule version must start on the habit start date',
    );
  }
  for (let index = 1; index < sortedRules.length; index += 1) {
    const previousRule = sortedRules[index - 1];
    if (previousRule.validFrom === sortedRules[index].validFrom) {
      throw new Error('Rule versions must have distinct validFrom dates');
    }
  }
}

function validateSchedule(schedule: HabitSchedule): void {
  parseCalendarDate(schedule.startDate);
  validateTimeChoice(schedule);
  if (schedule.ruleVersions.length === 0) {
    throw new Error('A habit must have at least one rule version');
  }
  for (const rule of schedule.ruleVersions) {
    validateRuleVersion(rule);
  }
  validateRuleVersionOrder(schedule.ruleVersions, schedule.startDate);
}

function getSortTime(schedule: HabitSchedule): string | null {
  if (schedule.timeOfDay !== null) {
    return schedule.timeOfDay;
  }
  if (schedule.timeSlot !== null) {
    return SLOT_TIMES[schedule.timeSlot];
  }
  return null;
}

function matchesEveryNDays(
  date: CalendarDate,
  rule: HabitRuleVersion,
): boolean {
  const intervalDays = rule.intervalDays;
  if (intervalDays === null) {
    throw new Error('Interval days are required for an every_n_days rule');
  }
  const elapsedDays = daysBetween(rule.validFrom, date);
  return elapsedDays % intervalDays === 0;
}

// RN-23: si el mes no tiene el día de anclaje (31 en abril), cae el último día.
function matchesMonthly(date: CalendarDate, rule: HabitRuleVersion): boolean {
  const anchorDay = getDayOfMonth(rule.validFrom);
  const lastDay = getLastDayOfMonth(date);
  const occurrenceDay = Math.min(anchorDay, lastDay);
  const currentDay = getDayOfMonth(date);
  return currentDay === occurrenceDay;
}

function matchesRule(date: CalendarDate, rule: HabitRuleVersion): boolean {
  switch (rule.frequency) {
    case 'daily':
      return true;
    case 'weekdays': {
      const weekday = getIsoWeekday(date);
      return rule.weekdays.includes(weekday);
    }
    case 'every_n_days':
      return matchesEveryNDays(date, rule);
    case 'monthly':
      return matchesMonthly(date, rule);
  }
}

// Las reglas llegan ordenadas por validFrom; vale la última que ya empezó.
function findRuleInForce(
  sortedRules: HabitRuleVersion[],
  date: CalendarDate,
): HabitRuleVersion {
  for (let index = sortedRules.length - 1; index >= 0; index -= 1) {
    const rule = sortedRules[index];
    if (compareCalendarDates(rule.validFrom, date) <= 0) {
      return rule;
    }
  }
  throw new Error(`No rule version is in force on ${date}`);
}

function getFirstDateToCheck(
  schedule: HabitSchedule,
  fromDate: CalendarDate,
): CalendarDate {
  if (compareCalendarDates(fromDate, schedule.startDate) < 0) {
    return schedule.startDate;
  }
  return fromDate;
}

export function getOccurrencesInRange(
  schedule: HabitSchedule,
  fromDate: CalendarDate,
  toDate: CalendarDate,
): Occurrence[] {
  validateSchedule(schedule);
  parseCalendarDate(fromDate);
  parseCalendarDate(toDate);
  if (compareCalendarDates(fromDate, toDate) > 0) {
    return [];
  }
  const sortedRules = sortRuleVersions(schedule.ruleVersions);
  const sortTime = getSortTime(schedule);
  const occurrences: Occurrence[] = [];
  let date = getFirstDateToCheck(schedule, fromDate);
  while (compareCalendarDates(date, toDate) <= 0) {
    const rule = findRuleInForce(sortedRules, date);
    if (matchesRule(date, rule)) {
      occurrences.push({ habitId: schedule.habitId, date, sortTime });
    }
    // Se sale antes de sumar un día: después de 9999-12-31 no hay fecha válida.
    if (date === toDate) {
      break;
    }
    date = addDays(date, 1);
  }
  return occurrences;
}

// Los momentos se comparan como texto 'HH:MM'; sin momento va al final.
function compareSortTimes(first: string | null, second: string | null): number {
  if (first === second) {
    return 0;
  }
  if (first === null) {
    return 1;
  }
  if (second === null) {
    return -1;
  }
  return first < second ? -1 : 1;
}

export function compareOccurrencesForDay(
  first: Occurrence,
  second: Occurrence,
): number {
  const timeComparison = compareSortTimes(first.sortTime, second.sortTime);
  if (timeComparison !== 0) {
    return timeComparison;
  }
  if (first.habitId === second.habitId) {
    return 0;
  }
  return first.habitId < second.habitId ? -1 : 1;
}
