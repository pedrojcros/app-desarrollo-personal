import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { Task } from '../domain/entities';
import type { ViewData } from '../domain/items';
import type { CalendarDate } from '../domain/types';
import { getTodayItems } from '../domain/views/today';
import { fetchHabitMarks, fetchHabits, mapTaskRow } from './agenda';
import { queryKeys } from './query-keys';
import {
  fail,
  succeed,
  unwrapResult,
  type DataResult,
  type DataResultError,
} from './result';
import { supabase } from './supabase/client';
import { getDeviceTimeZone } from './time-zone';

const TASK_PAGE_SIZE = 1000;

// El total incluye las marcas: filtrar por estado impediría actualizar el progreso.
async function fetchTasksDueOn(
  date: CalendarDate,
  timeZone: string,
): Promise<DataResult<Task[]>> {
  try {
    const tasks: Task[] = [];
    let offset = 0;
    while (true) {
      const lastRow = offset + TASK_PAGE_SIZE - 1;
      const query = supabase
        .from('tasks')
        .select('*')
        .is('archived_at', null)
        .eq('due_date', date);
      // Un orden estable evita repetir o saltar filas entre páginas.
      const response = await query.order('id').range(offset, lastRow);
      if (response.error) {
        const code = response.status === 0 ? 'network_error' : 'unknown_error';
        return fail(code, 'Could not read tasks');
      }
      const page = response.data.map((row) => mapTaskRow(row, timeZone));
      tasks.push(...page);
      if (page.length < TASK_PAGE_SIZE) {
        return succeed(tasks);
      }
      offset += TASK_PAGE_SIZE;
    }
  } catch {
    return fail('network_error', 'Could not reach the agenda server');
  }
}

export async function fetchTodayView(
  today: CalendarDate,
  timeZone: string = getDeviceTimeZone(),
): Promise<DataResult<ViewData>> {
  const [habitsResult, marksResult, tasksResult] = await Promise.all([
    fetchHabits({ includeArchived: false, timeZone }),
    fetchHabitMarks({ fromDate: today, toDate: today }),
    fetchTasksDueOn(today, timeZone),
  ]);
  if (!habitsResult.ok) {
    return habitsResult;
  }
  if (!marksResult.ok) {
    return marksResult;
  }
  if (!tasksResult.ok) {
    return tasksResult;
  }
  const items = getTodayItems({
    habits: habitsResult.value,
    marks: marksResult.value,
    tasks: tasksResult.value,
    today,
  });
  return succeed({ items });
}

/** Todo lo de hoy; la caché es la que parchea useMarkItem al marcar. */
export function useTodayView(
  today: CalendarDate,
): UseQueryResult<ViewData, DataResultError> {
  return useQuery({
    queryKey: queryKeys.today(today),
    queryFn: async () => {
      const result = await fetchTodayView(today);
      return unwrapResult(result);
    },
  });
}
