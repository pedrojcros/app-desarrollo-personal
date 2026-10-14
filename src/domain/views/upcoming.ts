import {
  addDays,
  compareCalendarDates,
  getIsoWeekday,
  parseCalendarDate,
} from '../calendar-date';
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
  const currentWeekStart = getMondayOfWeek(validToday);
  // 34 días = 4 semanas completas tras la actual (28) más los 6 días hasta
  // el domingo de la última: el rango termina siempre en domingo.
  const to = addDays(currentWeekStart, 34);
  return { from, to };
}

export function getUpcomingWeeks(input: UpcomingInput): UpcomingWeek[] {
  const items = getUpcomingItems(input);
  return groupUpcomingItems(items, input.today);
}

/** Lista plana del rango, ordenada por fecha y, dentro del día, como en Hoy. */
export function getUpcomingItems(input: UpcomingInput): ViewItem[] {
  const range = getUpcomingRange(input.today);
  const items = [
    ...getHabitItems(input, range.from, range.to),
    ...getTaskItems(input.tasks, range.from, range.to),
  ];
  const dayItems = getItemsByDate(items, range.from, range.to);
  const days = [...dayItems.entries()];
  days.sort(([firstDate], [secondDate]) =>
    compareCalendarDates(firstDate, secondDate),
  );
  return days.flatMap(([, itemsOfDay]) => itemsOfDay);
}

/**
 * Agrupa por semanas y días una lista plana ya filtrada. Existe aparte para
 * que la caché de vistas guarde la lista plana (y se parchee al marcar) y la
 * pantalla agrupe al leer. Ignora lo que no tiene fecha o cae fuera del rango.
 */
export function groupUpcomingItems(
  items: ViewItem[],
  today: CalendarDate,
): UpcomingWeek[] {
  const range = getUpcomingRange(today);
  const firstWeekStart = getFirstWeekStart(today, range.from);
  const weekStarts = getWeekStarts(firstWeekStart, range.to);
  const dayItems = getItemsByDate(items, range.from, range.to);
  const currentWeekStart = getMondayOfWeek(today);

  return weekStarts.map((weekStart) => {
    const days = getDaysForWeek(weekStart, range.from, dayItems);
    // Si hoy es domingo, el lunes de su semana no está entre las semanas
    // mostradas (empiezan mañana), así que no hace falta tratarlo aparte.
    const isCurrentWeek = weekStart === currentWeekStart;
    return { weekStart, isCurrentWeek, days };
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

function getMondayOfWeek(date: CalendarDate): CalendarDate {
  const weekday = getIsoWeekday(date);
  const daysSinceMonday = weekday - 1;
  return addDays(date, -daysSinceMonday);
}

/** Con hoy en domingo la semana actual ya no tiene días por delante. */
function getFirstWeekStart(
  today: CalendarDate,
  from: CalendarDate,
): CalendarDate {
  if (getIsoWeekday(today) === 7) {
    return from;
  }
  return getMondayOfWeek(today);
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

function getHabitItems(
  input: UpcomingInput,
  rangeStart: CalendarDate,
  rangeEnd: CalendarDate,
): ViewItem[] {
  const items: ViewItem[] = [];
  const markIndex = indexMarks(input.marks);

  for (const habit of input.habits) {
    if (habit.archivedOn !== null) {
      continue;
    }
    // findRuleInForce necesita las reglas ordenadas por fecha de inicio;
    // se ordena una copia para no alterar el hábito recibido.
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
      items.push(occurrenceToViewItem(habit, occurrence, markIndex));
    }
  }
  return items;
}

function getTaskItems(
  tasks: Task[],
  rangeStart: CalendarDate,
  rangeEnd: CalendarDate,
): ViewItem[] {
  const items: ViewItem[] = [];

  for (const task of tasks) {
    if (task.archivedOn !== null || task.status !== 'pending') {
      continue;
    }
    if (
      task.dueDate === null ||
      !isDateInRange(task.dueDate, rangeStart, rangeEnd)
    ) {
      continue;
    }
    items.push(taskToViewItem(task));
  }
  return items;
}

function isDateInRange(
  date: CalendarDate,
  rangeStart: CalendarDate,
  rangeEnd: CalendarDate,
): boolean {
  return date >= rangeStart && date <= rangeEnd;
}

function getItemsByDate(
  items: ViewItem[],
  rangeStart: CalendarDate,
  rangeEnd: CalendarDate,
): Map<CalendarDate, ViewItem[]> {
  const dayItems = new Map<CalendarDate, ViewItem[]>();

  for (const item of items) {
    if (item.date === null || !isDateInRange(item.date, rangeStart, rangeEnd)) {
      continue;
    }
    addItemToDate(dayItems, item.date, item);
  }

  for (const itemsOfDay of dayItems.values()) {
    itemsOfDay.sort(compareViewItemsForDay);
  }
  return dayItems;
}

/**
 * RN-46: «diario» es lo que ocurre cada día (frecuencia diaria, cada 1 día o
 * todos los días de la semana marcados). Esos hábitos no aparecen en Próximo.
 */
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
