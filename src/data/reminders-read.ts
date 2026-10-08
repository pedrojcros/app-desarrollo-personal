import { addDays } from '../domain/calendar-date';
import type { Habit, HabitMark, Task } from '../domain/entities';
import type { CalendarDate } from '../domain/types';
import { fetchHabits, fetchHabitMarks, mapTaskRow } from './agenda';
import { fail, succeed, type DataResult } from './result';
import { supabase } from './supabase/client';

export interface ReminderData {
  tasks: Task[];
  habits: Habit[];
  marks: HabitMark[];
  categoryNames: Map<string, string>;
}
const PAGE_SIZE = 1000;

function describeReadFailure(isNetworkError: boolean): DataResult<never> {
  if (isNetworkError) {
    return fail('network_error', 'Could not reach the reminder server.');
  }
  return fail('unknown_error', 'Could not read reminder data.');
}

async function fetchReminderTasks(
  date: CalendarDate,
  lastDate: CalendarDate,
  timeZone: string,
): Promise<DataResult<Task[]>> {
  const tasks: Task[] = [];
  let offset = 0;
  while (true) {
    const pendingTaskQuery = supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending');
    const windowQuery = pendingTaskQuery
      .is('archived_at', null)
      .gte('due_date', date)
      .lte('due_date', lastDate);
    const lastRow = offset + PAGE_SIZE - 1;
    const orderedQuery = windowQuery.order('id');
    const response = await orderedQuery.range(offset, lastRow);
    if (response.error) {
      return describeReadFailure(response.status === 0);
    }
    const page = response.data.map((row) => mapTaskRow(row, timeZone));
    tasks.push(...page);
    if (page.length < PAGE_SIZE) {
      return succeed(tasks);
    }
    offset += PAGE_SIZE;
  }
}

async function fetchCategoryNames(): Promise<DataResult<Map<string, string>>> {
  const names = new Map<string, string>();
  let offset = 0;
  while (true) {
    const categoryNamesQuery = supabase
      .from('categories')
      .select('id, name')
      .order('id');
    const lastRow = offset + PAGE_SIZE - 1;
    const response = await categoryNamesQuery.range(offset, lastRow);
    if (response.error) {
      return describeReadFailure(response.status === 0);
    }
    for (const category of response.data) {
      names.set(category.id, category.name);
    }
    if (response.data.length < PAGE_SIZE) {
      return succeed(names);
    }
    offset += PAGE_SIZE;
  }
}

/** Todas las lecturas deben resolverse antes de modificar avisos; RLS limita al dueño. */
export async function fetchReminderData(
  date: CalendarDate,
  timeZone: string,
): Promise<DataResult<ReminderData>> {
  try {
    const lastDate = addDays(date, 6);
    // Una tarea posterior a la ventana puede tener dentro su aviso de antelación.
    const lastTaskDate = addDays(lastDate, 7);
    const [tasks, habits, marks, categoryNames] = await Promise.all([
      fetchReminderTasks(date, lastTaskDate, timeZone),
      fetchHabits({ includeArchived: false, timeZone }),
      fetchHabitMarks({ fromDate: date, toDate: lastDate }),
      fetchCategoryNames(),
    ]);
    if (!tasks.ok) {
      return tasks;
    }
    if (!habits.ok) {
      return habits;
    }
    if (!marks.ok) {
      return marks;
    }
    if (!categoryNames.ok) {
      return categoryNames;
    }
    const timedHabits = habits.value.filter((habit) => {
      return habit.timeOfDay !== null || habit.timeSlot !== null;
    });
    const timedHabitIds = timedHabits.map((habit) => habit.id);
    const habitIds = new Set(timedHabitIds);
    const habitMarks = marks.value.filter((mark) => habitIds.has(mark.habitId));
    return succeed({
      tasks: tasks.value,
      habits: timedHabits,
      marks: habitMarks,
      categoryNames: categoryNames.value,
    });
  } catch (error) {
    return describeReadFailure(error instanceof TypeError);
  }
}
