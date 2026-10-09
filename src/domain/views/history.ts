import {
  addDays,
  daysBetween,
  getCalendarDateInTimeZone,
} from '../calendar-date';
import type { CalendarDate } from '../types';
import { SLOT_TIMES } from '../recurrence';
import type { Habit, HabitMark, Task } from '../entities';
import {
  getHabitOccurrences,
  indexMarks,
  occurrenceToViewItem,
  taskToViewItem,
} from '../habit-occurrences';
import {
  compareViewItemsForDay,
  getMarkTargetKey,
  type ViewItem,
} from '../items';

export type HistoryCell =
  'done' | 'not_done' | 'unmarked' | 'pending' | 'empty';
export interface HistoryRow {
  key: string;
  name: string;
  kind: 'habit' | 'task';
  categoryId: string | null;
  cells: HistoryCell[];
}
export interface HistoryGrid {
  days: CalendarDate[];
  rows: HistoryRow[];
  dayPercentages: (number | null)[];
  dimmedCells: boolean[][];
}
export interface HistoryFilters {
  status: 'all' | 'done' | 'not_done' | 'unmarked';
  categoryId: 'all' | string | null;
  itemKey: string | null;
}
export type HistoryRangeError =
  'end_before_start' | 'end_after_today' | 'too_long';

export function validateHistoryRange(
  fromDate: CalendarDate,
  toDate: CalendarDate,
  today: CalendarDate,
): HistoryRangeError | null {
  if (toDate < fromDate) {
    return 'end_before_start';
  }
  if (toDate > today) {
    return 'end_after_today';
  }
  if (daysBetween(fromDate, toDate) >= 366) {
    return 'too_long';
  }
  return null;
}

function isInRange(
  date: CalendarDate,
  fromDate: CalendarDate,
  toDate: CalendarDate,
): boolean {
  return date >= fromDate && date <= toDate;
}

export function getHistoryItems(input: {
  habits: Habit[];
  marks: HabitMark[];
  tasks: Task[];
  fromDate: CalendarDate;
  toDate: CalendarDate;
}): ViewItem[] {
  const { habits, marks, tasks, fromDate, toDate } = input;
  const markIndex = indexMarks(marks);
  const itemsByTarget = new Map<string, ViewItem>();
  const habitEntries = habits.map((habit) => [habit.id, habit] as const);
  const habitsById = new Map(habitEntries);
  for (const habit of habits) {
    const occurrences = getHabitOccurrences(habit, fromDate, toDate);
    for (const occurrence of occurrences) {
      const item = occurrenceToViewItem(habit, occurrence, markIndex);
      const key = getMarkTargetKey(item.target);
      itemsByTarget.set(key, item);
    }
  }
  for (const mark of marks) {
    if (!isInRange(mark.date, fromDate, toDate)) {
      continue;
    }
    const habit = habitsById.get(mark.habitId);
    if (habit === undefined) {
      continue;
    }
    let sortTime = habit.timeOfDay;
    if (habit.timeSlot !== null) {
      sortTime = SLOT_TIMES[habit.timeSlot];
    }
    const item = occurrenceToViewItem(
      habit,
      { habitId: habit.id, date: mark.date, sortTime },
      markIndex,
    );
    const key = getMarkTargetKey(item.target);
    // No se pisa la hora calculada de una franja al añadir marcas fuera de regla.
    if (!itemsByTarget.has(key)) {
      itemsByTarget.set(key, item);
    }
  }
  for (const task of tasks) {
    if (task.archivedOn !== null && task.status === 'pending') {
      continue;
    }
    if (task.dueDate === null) {
      if (task.status === 'pending' || task.markedAt === null) {
        continue;
      }
    } else if (!isInRange(task.dueDate, fromDate, toDate)) {
      continue;
    }
    const item = taskToViewItem(task);
    const key = getMarkTargetKey(item.target);
    itemsByTarget.set(key, item);
  }
  return Array.from(itemsByTarget.values());
}

function getItemDate(item: ViewItem, timeZone: string): CalendarDate | null {
  if (item.date !== null) {
    return item.date;
  }
  if (item.status === 'pending' || item.markedAt === null) {
    return null;
  }
  const instant = new Date(item.markedAt);
  return getCalendarDateInTimeZone(instant, timeZone);
}

function getRowKey(item: ViewItem): string {
  if (item.target.kind === 'task') {
    return `task:${item.target.taskId}`;
  }
  return `habit:${item.target.habitId}`;
}

function getCell(
  item: ViewItem,
  date: CalendarDate,
  today: CalendarDate,
): HistoryCell {
  if (item.status !== 'pending') {
    return item.status;
  }
  if (date < today) {
    return 'unmarked';
  }
  return 'pending';
}

function compareRowItems(first: ViewItem, second: ViewItem): number {
  if (first.target.kind !== second.target.kind) {
    return first.target.kind === 'occurrence' ? -1 : 1;
  }
  if (first.target.kind === 'occurrence') {
    return compareViewItemsForDay(first, second);
  }
  if (first.date !== second.date) {
    return (first.date ?? '') > (second.date ?? '') ? -1 : 1;
  }
  const nameComparison = first.name.localeCompare(second.name, 'es');
  if (nameComparison !== 0) {
    return nameComparison;
  }
  const firstKey = getRowKey(first);
  const secondKey = getRowKey(second);
  return firstKey.localeCompare(secondKey);
}

function getDayPercentage(rows: HistoryRow[], index: number): number | null {
  let total = 0;
  let done = 0;
  for (const row of rows) {
    const cell = row.cells[index];
    if (cell === 'empty') {
      continue;
    }
    total += 1;
    if (cell === 'done') {
      done += 1;
    }
  }
  if (total === 0) {
    return null;
  }
  return Math.round((done * 100) / total);
}

export function buildHistoryGrid(
  items: ViewItem[],
  fromDate: CalendarDate,
  toDate: CalendarDate,
  today: CalendarDate,
  timeZone: string,
): HistoryGrid {
  const days: CalendarDate[] = [];
  for (let date = toDate; date >= fromDate; date = addDays(date, -1)) {
    days.push(date);
  }
  const dayEntries = days.map((date, index) => [date, index] as const);
  const dayIndices = new Map(dayEntries);
  const rowsByKey = new Map<string, HistoryRow>();
  const representatives = new Map<string, ViewItem>();
  for (const item of items) {
    const date = getItemDate(item, timeZone);
    if (date === null) {
      continue;
    }
    const index = dayIndices.get(date);
    if (index === undefined) {
      continue;
    }
    const key = getRowKey(item);
    let row = rowsByKey.get(key);
    if (row === undefined) {
      row = {
        key,
        name: item.name,
        kind: item.target.kind === 'task' ? 'task' : 'habit',
        categoryId: item.categoryId,
        cells: Array<HistoryCell>(days.length).fill('empty'),
      };
      rowsByKey.set(key, row);
    }
    const representative = representatives.get(key);
    // La ocurrencia más reciente representa la hora vigente del hábito.
    if (representative === undefined || date > (representative.date ?? '')) {
      representatives.set(key, { ...item, date });
    }
    row.cells[index] = getCell(item, date, today);
  }
  const rowItems = Array.from(representatives.values());
  const orderedItems = rowItems.sort(compareRowItems);
  const rows = orderedItems.map((item) => {
    const key = getRowKey(item);
    return rowsByKey.get(key)!;
  });
  const dayPercentages = days.map((date, index) =>
    getDayPercentage(rows, index),
  );
  const dimmedCells = rows.map((row) => row.cells.map(() => false));
  return { days, rows, dayPercentages, dimmedCells };
}

function rowMatchesStatus(row: HistoryRow, status: HistoryFilters['status']) {
  if (status === 'all') {
    return true;
  }
  return row.cells.some((cell) => cell === status);
}

export function filterHistoryGrid(
  grid: HistoryGrid,
  filters: HistoryFilters,
): HistoryGrid {
  const matchingRows = grid.rows.filter((row) => {
    if (filters.categoryId !== 'all' && row.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.itemKey !== null && row.key !== filters.itemKey) {
      return false;
    }
    return rowMatchesStatus(row, filters.status);
  });
  const dimmedCells = matchingRows.map((row) =>
    row.cells.map(
      (cell) => filters.status !== 'all' && cell !== filters.status,
    ),
  );
  const dayPercentages = grid.days.map((day, index) =>
    getDayPercentage(matchingRows, index),
  );
  return {
    days: grid.days,
    rows: matchingRows,
    dayPercentages,
    dimmedCells,
  };
}
