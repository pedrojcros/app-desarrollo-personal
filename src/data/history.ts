import { useQuery } from '@tanstack/react-query';
import { addDays } from '../domain/calendar-date';
import type { Task } from '../domain/entities';
import type { ViewData } from '../domain/items';
import type { CalendarDate } from '../domain/types';
import { getHistoryItems } from '../domain/views/history';
import { fetchHabits, fetchHabitMarks, mapTaskRow } from './agenda';
import { queryKeys } from './query-keys';
import { fail, succeed, unwrapResult, type DataResult } from './result';
import { supabase } from './supabase/client';
import { getDeviceTimeZone } from './time-zone';

const PAGE_SIZE = 1000;

async function fetchHistoryTasks(
  fromDate: CalendarDate,
  toDate: CalendarDate,
  timeZone: string,
): Promise<DataResult<Task[]>> {
  try {
    const lowerDate = addDays(fromDate, -1);
    const upperDate = addDays(toDate, 2);
    const lowerInstant = `${lowerDate}T00:00:00Z`;
    const upperInstant = `${upperDate}T00:00:00Z`;
    const datedFilter = `and(due_date.gte.${fromDate},due_date.lte.${toDate})`;
    const undatedFilter = `and(due_date.is.null,status.neq.pending,marked_at.gte.${lowerInstant},marked_at.lt.${upperInstant})`;
    const tasks: Task[] = [];
    let offset = 0;
    while (true) {
      const lastRow = offset + PAGE_SIZE - 1;
      const query = supabase
        .from('tasks')
        .select('*')
        .or(`${datedFilter},${undatedFilter}`);
      const response = await query.order('id').range(offset, lastRow);
      if (response.error) {
        return fail('read_error', 'Could not read history tasks');
      }
      const page = response.data.map((row) => mapTaskRow(row, timeZone));
      tasks.push(...page);
      if (page.length < PAGE_SIZE) {
        return succeed(tasks);
      }
      offset += PAGE_SIZE;
    }
  } catch (error) {
    const code = error instanceof TypeError ? 'network_error' : 'read_error';
    return fail(code, 'Could not read history tasks');
  }
}

/** Solo se publica la caché cuando todas las lecturas han terminado bien. */
export async function fetchHistory(
  fromDate: CalendarDate,
  toDate: CalendarDate,
  timeZone: string,
): Promise<DataResult<ViewData>> {
  const [habits, marks, tasks] = await Promise.all([
    fetchHabits({ includeArchived: true, timeZone }),
    fetchHabitMarks({ fromDate, toDate }),
    fetchHistoryTasks(fromDate, toDate, timeZone),
  ]);
  if (!habits.ok) {
    return habits;
  }
  if (!marks.ok) {
    return marks;
  }
  if (!tasks.ok) {
    return tasks;
  }
  const items = getHistoryItems({
    habits: habits.value,
    marks: marks.value,
    tasks: tasks.value,
    fromDate,
    toDate,
  });
  return succeed({ items });
}

export function useHistory(fromDate: CalendarDate, toDate: CalendarDate) {
  const timeZone = getDeviceTimeZone();
  return useQuery({
    queryKey: queryKeys.history(fromDate, toDate),
    queryFn: async () => {
      const result = await fetchHistory(fromDate, toDate, timeZone);
      return unwrapResult(result);
    },
  });
}
