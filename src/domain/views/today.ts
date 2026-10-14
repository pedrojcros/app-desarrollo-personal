import type { Habit, HabitMark, Task } from '../entities';
import { compareViewItemsForDay, type ViewItem } from '../items';
import {
  getHabitOccurrences,
  indexMarks,
  occurrenceToViewItem,
  taskToViewItem,
} from '../habit-occurrences';
import type { CalendarDate } from '../types';

/** Todo lo de hoy, pendiente y marcado, en el orden de la vista Hoy. */
export function getTodayItems(input: {
  habits: Habit[];
  marks: HabitMark[];
  tasks: Task[];
  today: CalendarDate;
}): ViewItem[] {
  const markIndex = indexMarks(input.marks);
  const items: ViewItem[] = [];

  for (const habit of input.habits) {
    if (habit.archivedOn !== null) {
      continue;
    }
    const occurrences = getHabitOccurrences(habit, input.today, input.today);
    for (const occurrence of occurrences) {
      items.push(occurrenceToViewItem(habit, occurrence, markIndex));
    }
  }

  for (const task of input.tasks) {
    const isArchived = task.archivedOn !== null;
    if (isArchived || task.dueDate !== input.today) {
      continue;
    }
    items.push(taskToViewItem(task));
  }

  return items.sort(compareViewItemsForDay);
}

/** Total del día y lo ya marcado, en el orden en que se marcó. */
export function summarizeDay(items: ViewItem[]): {
  total: number;
  marked: ViewItem[];
} {
  const marked = items.filter((item) => item.status !== 'pending');
  marked.sort(compareByMarkedAt);
  return { total: items.length, marked };
}

function compareByMarkedAt(first: ViewItem, second: ViewItem): number {
  const firstDate = new Date(first.markedAt ?? 0);
  const secondDate = new Date(second.markedAt ?? 0);
  const firstInstant = firstDate.getTime();
  const secondInstant = secondDate.getTime();
  return firstInstant - secondInstant;
}

/** RN-05: lo que todavía no ha llegado solo se consulta. */
export function canMarkDay(date: CalendarDate, today: CalendarDate): boolean {
  // Las fechas YYYY-MM-DD se ordenan igual como texto que como calendario.
  return date <= today;
}
