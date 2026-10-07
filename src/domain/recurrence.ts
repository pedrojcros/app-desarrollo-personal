import {
  addDays,
  compareCalendarDates,
  daysBetween,
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

function validateSchedule(schedule: HabitSchedule): void {
  parseCalendarDate(schedule.startDate);
  if (schedule.timeOfDay !== null && schedule.timeSlot !== null) {
    throw new Error('A habit cannot have both a time of day and a time slot');
  }
  if (schedule.ruleVersions.length === 0) {
    throw new Error('A habit must have at least one rule version');
  }
  for (const rule of schedule.ruleVersions) {
    parseCalendarDate(rule.validFrom);
    if (rule.frequency === 'weekdays' && rule.weekdays.length === 0) {
      throw new Error('Weekday rules must have at least one weekday');
    }
    if (rule.frequency === 'every_n_days') {
      if (
        rule.intervalDays === null ||
        !Number.isInteger(rule.intervalDays) ||
        rule.intervalDays < 1
      ) {
        throw new Error('Interval days must be an integer greater than zero');
      }
    }
  }
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

function matchesRule(date: CalendarDate, rule: HabitRuleVersion): boolean {
  switch (rule.frequency) {
    case 'daily':
      return true;
    case 'weekdays': {
      const weekday = getIsoWeekday(date);
      return rule.weekdays.includes(weekday);
    }
    case 'every_n_days': {
      const elapsedDays = daysBetween(rule.validFrom, date);
      return elapsedDays % rule.intervalDays! === 0;
    }
    case 'monthly': {
      const anchorDay = Number(rule.validFrom.slice(8, 10));
      const lastDay = getLastDayOfMonth(date);
      const occurrenceDay = Math.min(anchorDay, lastDay);
      const currentDay = Number(date.slice(8, 10));
      return currentDay === occurrenceDay;
    }
  }
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
  const rules = [...schedule.ruleVersions];
  rules.sort((first, second) =>
    compareCalendarDates(first.validFrom, second.validFrom),
  );
  let date = fromDate;
  if (compareCalendarDates(date, schedule.startDate) < 0) {
    date = schedule.startDate;
  }
  const sortTime = getSortTime(schedule);
  const occurrences: Occurrence[] = [];
  let ruleIndex = -1;
  while (compareCalendarDates(date, toDate) <= 0) {
    while (
      ruleIndex + 1 < rules.length &&
      compareCalendarDates(rules[ruleIndex + 1].validFrom, date) <= 0
    ) {
      ruleIndex += 1;
    }
    const rule = rules[ruleIndex];
    if (rule !== undefined && matchesRule(date, rule)) {
      occurrences.push({ habitId: schedule.habitId, date, sortTime });
    }
    if (date === toDate) {
      break;
    }
    date = addDays(date, 1);
  }
  return occurrences;
}

export function compareOccurrencesForDay(
  first: Occurrence,
  second: Occurrence,
): number {
  if (first.sortTime === null && second.sortTime !== null) {
    return 1;
  }
  if (first.sortTime !== null && second.sortTime === null) {
    return -1;
  }
  if (
    first.sortTime !== null &&
    second.sortTime !== null &&
    first.sortTime !== second.sortTime
  ) {
    return first.sortTime < second.sortTime ? -1 : 1;
  }
  if (first.habitId === second.habitId) {
    return 0;
  }
  return first.habitId < second.habitId ? -1 : 1;
}
