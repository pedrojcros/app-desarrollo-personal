import { addDays, getIsoWeekday, parseCalendarDate } from '../calendar-date';
import type { Habit, HabitMark, Task } from '../entities';
import { compareViewItemsForDay, type ViewItem } from '../items';
import {
  getHabitOccurrences,
  indexMarks,
  occurrenceToViewItem,
  taskToViewItem,
} from '../habit-occurrences';
import type { CalendarDate, IsoWeekday } from '../types';

const WEEKDAY_NAMES: Record<IsoWeekday, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
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

/** «Martes, 6 de octubre de 2026». */
export function formatLongDate(date: CalendarDate): string {
  const validDate = parseCalendarDate(date);
  const parts = validDate.split('-');
  const [year, month, day] = parts.map(Number);
  const weekdayName = WEEKDAY_NAMES[getIsoWeekday(validDate)];
  const monthName = MONTH_NAMES[month - 1];
  return `${weekdayName}, ${day} de ${monthName} de ${year}`;
}

/** «Hoy», «Ayer», «Mañana» o el día de la semana. */
export function getDayTitle(date: CalendarDate, today: CalendarDate): string {
  if (date === today) {
    return 'Hoy';
  }
  if (date === addDays(today, -1)) {
    return 'Ayer';
  }
  if (date === addDays(today, 1)) {
    return 'Mañana';
  }
  return WEEKDAY_NAMES[getIsoWeekday(date)];
}

/** RN-05: lo que todavía no ha llegado solo se consulta. */
export function canMarkDay(date: CalendarDate, today: CalendarDate): boolean {
  // Las fechas YYYY-MM-DD se ordenan igual como texto que como calendario.
  return date <= today;
}

export function getMarkedSectionTitle(
  date: CalendarDate,
  today: CalendarDate,
): string {
  return date === today ? 'Marcadas hoy' : 'Marcadas ese día';
}
