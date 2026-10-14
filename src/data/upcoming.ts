import { useCallback } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { Task } from '../domain/entities';
import type { ViewData } from '../domain/items';
import type { CalendarDate } from '../domain/types';
import {
  getUpcomingItems,
  getUpcomingRange,
  groupUpcomingItems,
  type UpcomingWeek,
} from '../domain/views/upcoming';
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

async function fetchUpcomingTasks(
  fromDate: CalendarDate,
  toDate: CalendarDate,
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
        .gte('due_date', fromDate)
        .lte('due_date', toDate);
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

export async function fetchUpcomingView(
  today: CalendarDate,
  timeZone: string = getDeviceTimeZone(),
): Promise<DataResult<ViewData>> {
  const range = getUpcomingRange(today);
  const [habitsResult, marksResult, tasksResult] = await Promise.all([
    fetchHabits({ includeArchived: false, timeZone }),
    fetchHabitMarks({ fromDate: range.from, toDate: range.to }),
    fetchUpcomingTasks(range.from, range.to, timeZone),
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
  const items = getUpcomingItems({
    habits: habitsResult.value,
    marks: marksResult.value,
    tasks: tasksResult.value,
    today,
  });
  return succeed({ items });
}

/** Agrupar al leer conserva la caché plana que parchea useMarkItem. */
export function useUpcomingView(
  today: CalendarDate,
): UseQueryResult<UpcomingWeek[], DataResultError> {
  const selectUpcomingWeeks = useCallback(
    (data: ViewData) => groupUpcomingItems(data.items, today),
    [today],
  );

  return useQuery({
    queryKey: queryKeys.upcoming(today),
    select: selectUpcomingWeeks,
    queryFn: async () => {
      const result = await fetchUpcomingView(today);
      return unwrapResult(result);
    },
  });
}
