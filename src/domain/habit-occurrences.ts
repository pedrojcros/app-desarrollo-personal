import { addDays, compareCalendarDates } from './calendar-date';
import {
  toHabitSchedule,
  type Habit,
  type HabitMark,
  type Task,
} from './entities';
import { getMarkTargetKey, type ItemStatus, type ViewItem } from './items';
import { getOccurrencesInRange } from './recurrence';
import type { CalendarDate, Occurrence } from './types';

/** Índice de una lectura de marcas para búsquedas constantes por hábito y fecha. */
export type MarkIndex = ReadonlyMap<string, HabitMark>;

/** Las vistas deben construir el índice una vez por consulta y pasar ese índice. */
export function indexMarks(marks: HabitMark[]): MarkIndex {
  const index = new Map<string, HabitMark>();
  for (const mark of marks) {
    const key = getMarkTargetKey({
      kind: 'occurrence',
      habitId: mark.habitId,
      date: mark.date,
    });
    index.set(key, mark);
  }
  return index;
}

/** El día del archivado ya no genera ocurrencias; las marcas no se eliminan. */
export function getHabitOccurrences(
  habit: Habit,
  fromDate: CalendarDate,
  toDate: CalendarDate,
): Occurrence[] {
  let lastDate = toDate;
  if (
    habit.archivedOn !== null &&
    compareCalendarDates(habit.archivedOn, toDate) <= 0
  ) {
    lastDate = addDays(habit.archivedOn, -1);
  }
  const schedule = toHabitSchedule(habit);
  return getOccurrencesInRange(schedule, fromDate, lastDate);
}

/** Sin marca es pendiente. El índice evita recorrer miles de marcas por elemento. */
export function getOccurrenceStatus(
  marks: HabitMark[] | MarkIndex,
  habitId: string,
  date: CalendarDate,
): { status: ItemStatus; markedAt: string | null } {
  let mark: HabitMark | undefined;
  if (Array.isArray(marks)) {
    mark = marks.find(
      (candidate) => candidate.habitId === habitId && candidate.date === date,
    );
  } else {
    const key = getMarkTargetKey({ kind: 'occurrence', habitId, date });
    mark = marks.get(key);
  }
  if (mark === undefined) {
    return { status: 'pending', markedAt: null };
  }
  return { status: mark.status, markedAt: mark.markedAt };
}

/** Conversión común; el historial puede incluir marcas posteriores al archivo. */
export function occurrenceToViewItem(
  habit: Habit,
  occurrence: Occurrence,
  marks: HabitMark[] | MarkIndex,
): ViewItem {
  const state = getOccurrenceStatus(marks, occurrence.habitId, occurrence.date);
  return {
    target: {
      kind: 'occurrence',
      habitId: occurrence.habitId,
      date: occurrence.date,
    },
    name: habit.name,
    status: state.status,
    date: occurrence.date,
    sortTime: occurrence.sortTime,
    categoryId: habit.categoryId,
    sectionId: habit.sectionId,
    markedAt: state.markedAt,
  };
}

/** Mantiene el mismo formato que las ocurrencias para todas las vistas. */
export function taskToViewItem(task: Task): ViewItem {
  return {
    target: { kind: 'task', taskId: task.id },
    name: task.name,
    status: task.status,
    date: task.dueDate,
    sortTime: task.dueTime,
    categoryId: task.categoryId,
    sectionId: task.sectionId,
    markedAt: task.markedAt,
  };
}
