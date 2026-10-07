import { addDays, getIsoWeekday } from '../calendar-date';
import type { Habit, HabitMark, Task } from '../entities';
import {
  getHabitOccurrences,
  indexMarks,
  occurrenceToViewItem,
  taskToViewItem,
} from '../habit-occurrences';
import { compareViewItemsForDay, type ViewItem } from '../items';
import type { CalendarDate } from '../types';

type PastPendingInput = {
  habits: Habit[];
  marks: HabitMark[];
  tasks: Task[];
  today: CalendarDate;
};
export type DayGroup = { date: CalendarDate; items: ViewItem[] };

const WEEKDAY_NAMES = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
];
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

function compareNewestDateFirst(first: ViewItem, second: ViewItem): number {
  if (first.date === second.date) {
    return compareViewItemsForDay(first, second);
  }
  // Las fechas YYYY-MM-DD se ordenan igual como texto que como calendario.
  return first.date! < second.date! ? 1 : -1;
}

function getPendingHabitItems(
  habits: Habit[],
  marks: HabitMark[],
  today: CalendarDate,
): ViewItem[] {
  const items: ViewItem[] = [];
  const markIndex = indexMarks(marks);
  const yesterday = addDays(today, -1);
  for (const habit of habits) {
    // Un hábito archivado es algo que el usuario quitó: no reclama días pasados.
    if (habit.archivedOn !== null) {
      continue;
    }
    const occurrences = getHabitOccurrences(habit, habit.startDate, yesterday);
    for (const occurrence of occurrences) {
      const item = occurrenceToViewItem(habit, occurrence, markIndex);
      if (item.status === 'pending') {
        items.push(item);
      }
    }
  }
  return items;
}

function getOverdueTaskItems(tasks: Task[], today: CalendarDate): ViewItem[] {
  const items: ViewItem[] = [];
  for (const task of tasks) {
    if (task.status !== 'pending' || task.archivedOn !== null) {
      continue;
    }
    // Una tarea sin fecha no vence nunca (RN-09) y la de hoy aún no ha vencido.
    if (task.dueDate === null || task.dueDate >= today) {
      continue;
    }
    items.push(taskToViewItem(task));
  }
  return items;
}

/** Ocurrencias sin marcar de días anteriores y tareas vencidas, sin límite hacia atrás (RN-14). */
export function getPastPendingItems({
  habits,
  marks,
  tasks,
  today,
}: PastPendingInput): ViewItem[] {
  const habitItems = getPendingHabitItems(habits, marks, today);
  const taskItems = getOverdueTaskItems(tasks, today);
  const items = [...habitItems, ...taskItems];
  return items.sort(compareNewestDateFirst);
}

/** Días de más reciente a más antiguo; dentro de cada día, el orden común de las vistas. */
export function groupByDay(items: ViewItem[]): DayGroup[] {
  const groupsByDate = new Map<CalendarDate, ViewItem[]>();
  for (const item of items) {
    if (item.date === null) {
      continue;
    }
    const group = groupsByDate.get(item.date) ?? [];
    group.push(item);
    groupsByDate.set(item.date, group);
  }
  const groups: DayGroup[] = [];
  for (const [date, groupItems] of groupsByDate) {
    groupItems.sort(compareViewItemsForDay);
    groups.push({ date, items: groupItems });
  }
  return groups.sort((first, second) => (first.date < second.date ? 1 : -1));
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** «Ayer», «Anteayer» y después «Lunes, 5 de octubre» (con el año si no es el actual). */
export function describeDay(date: CalendarDate, today: CalendarDate): string {
  if (date === addDays(today, -1)) {
    return 'Ayer';
  }
  if (date === addDays(today, -2)) {
    return 'Anteayer';
  }
  const weekdayName = WEEKDAY_NAMES[getIsoWeekday(date) - 1];
  const monthName = MONTH_NAMES[Number(date.slice(5, 7)) - 1];
  const dayNumber = Number(date.slice(8, 10));
  const description = `${capitalize(weekdayName)}, ${dayNumber} de ${monthName}`;
  if (date.slice(0, 4) === today.slice(0, 4)) {
    return description;
  }
  return `${description} de ${date.slice(0, 4)}`;
}
