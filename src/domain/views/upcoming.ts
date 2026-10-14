import { addDays, getIsoWeekday, parseCalendarDate } from '../calendar-date';
import type { Habit, HabitMark, Task } from '../entities';
import { findRuleInForce } from '../recurrence';
import {
  getHabitOccurrences,
  indexMarks,
  occurrenceToViewItem,
  taskToViewItem,
} from '../habit-occurrences';
import { compareViewItemsForDay, type ViewItem } from '../items';
import type { CalendarDate, HabitRuleVersion } from '../types';

export interface UpcomingDay {
  date: CalendarDate;
  items: ViewItem[];
}

export interface UpcomingWeek {
  /** Lunes de la semana. */
  weekStart: CalendarDate;
  /** true para la semana de hoy («Esta semana»). */
  isCurrentWeek: boolean;
  /** Solo los días con algo, en orden. */
  days: UpcomingDay[];
}

type UpcomingInput = {
  habits: Habit[];
  marks: HabitMark[];
  tasks: Task[];
  today: CalendarDate;
};

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function getUpcomingRange(today: CalendarDate): {
  from: CalendarDate;
  to: CalendarDate;
} {
  const validToday = parseCalendarDate(today);
  const from = addDays(validToday, 1);
  const mondayOffset = 1 - getIsoWeekday(validToday);
  const currentWeekStart = addDays(validToday, mondayOffset);
  const to = addDays(currentWeekStart, 34);
  return { from, to };
}

export function getUpcomingWeeks(input: UpcomingInput): UpcomingWeek[] {
  const range = getUpcomingRange(input.today);
  const firstWeekStart = getFirstWeekStart(input.today, range.from);
  const weekStarts = getWeekStarts(firstWeekStart, range.to);
  const dayItems = getItemsByDate(input, range.from, range.to);

  return weekStarts.map((weekStart) => {
    const days = getDaysForWeek(weekStart, range.from, dayItems);
    return {
      weekStart,
      isCurrentWeek:
        getIsoWeekday(input.today) !== 7 &&
        weekStart === addDays(input.today, 1 - getIsoWeekday(input.today)),
      days,
    };
  });
}

export function formatWeekTitle(week: UpcomingWeek): string {
  if (week.isCurrentWeek) {
    return 'Esta semana';
  }

  const weekEnd = addDays(week.weekStart, 6);
  const startParts = week.weekStart.split('-');
  const endParts = weekEnd.split('-');
  const startDay = Number(startParts[2]);
  const endDay = Number(endParts[2]);
  const startMonth = MONTH_NAMES[Number(startParts[1]) - 1];
  const endMonth = MONTH_NAMES[Number(endParts[1]) - 1];

  if (startMonth === endMonth) {
    return `Semana del ${startDay} al ${endDay} de ${endMonth}`;
  }
  return `Semana del ${startDay} de ${startMonth} al ${endDay} de ${endMonth}`;
}

function getFirstWeekStart(
  today: CalendarDate,
  from: CalendarDate,
): CalendarDate {
  if (getIsoWeekday(today) === 7) {
    return from;
  }
  const daysSinceMonday = getIsoWeekday(today) - 1;
  return addDays(today, -daysSinceMonday);
}

function getWeekStarts(
  firstWeekStart: CalendarDate,
  rangeEnd: CalendarDate,
): CalendarDate[] {
  const weekStarts: CalendarDate[] = [];
  let weekStart = firstWeekStart;

  while (weekStart <= rangeEnd) {
    weekStarts.push(weekStart);
    weekStart = addDays(weekStart, 7);
  }
  return weekStarts;
}

function getItemsByDate(
  input: UpcomingInput,
  rangeStart: CalendarDate,
  rangeEnd: CalendarDate,
): Map<CalendarDate, ViewItem[]> {
  const dayItems = new Map<CalendarDate, ViewItem[]>();
  const markIndex = indexMarks(input.marks);

  for (const habit of input.habits) {
    if (habit.archivedOn !== null) {
      continue;
    }
    const ruleVersions = [...habit.ruleVersions];
    ruleVersions.sort((first, second) =>
      first.validFrom.localeCompare(second.validFrom),
    );
    const occurrences = getHabitOccurrences(habit, rangeStart, rangeEnd);
    for (const occurrence of occurrences) {
      const rule = findRuleInForce(ruleVersions, occurrence.date);
      if (isDailyRule(rule)) {
        continue;
      }
      const item = occurrenceToViewItem(habit, occurrence, markIndex);
      addItemToDate(dayItems, occurrence.date, item);
    }
  }

  for (const task of input.tasks) {
    if (task.archivedOn !== null || task.status !== 'pending') {
      continue;
    }
    if (
      task.dueDate === null ||
      task.dueDate < rangeStart ||
      task.dueDate > rangeEnd
    ) {
      continue;
    }
    addItemToDate(dayItems, task.dueDate, taskToViewItem(task));
  }

  for (const items of dayItems.values()) {
    items.sort(compareViewItemsForDay);
  }
  return dayItems;
}

function isDailyRule(rule: HabitRuleVersion): boolean {
  if (rule.frequency === 'daily') {
    return true;
  }
  if (rule.frequency === 'every_n_days') {
    return rule.intervalDays === 1;
  }
  if (rule.frequency !== 'weekdays') {
    return false;
  }
  const uniqueWeekdays = new Set(rule.weekdays);
  return uniqueWeekdays.size === 7;
}

function addItemToDate(
  dayItems: Map<CalendarDate, ViewItem[]>,
  date: CalendarDate,
  item: ViewItem,
): void {
  const items = dayItems.get(date);
  if (items === undefined) {
    dayItems.set(date, [item]);
    return;
  }
  items.push(item);
}

function getDaysForWeek(
  weekStart: CalendarDate,
  rangeStart: CalendarDate,
  dayItems: Map<CalendarDate, ViewItem[]>,
): UpcomingDay[] {
  const firstDate = weekStart < rangeStart ? rangeStart : weekStart;
  const lastDate = addDays(weekStart, 6);
  const days: UpcomingDay[] = [];
  let date = firstDate;

  while (date <= lastDate) {
    const items = dayItems.get(date);
    if (items !== undefined && items.length > 0) {
      days.push({ date, items });
    }
    if (date === lastDate) {
      break;
    }
    date = addDays(date, 1);
  }
  return days;
}
