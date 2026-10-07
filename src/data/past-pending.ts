import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { addDays } from '../domain/calendar-date';
import type { Habit, HabitMark, Task } from '../domain/entities';
import type { ViewData } from '../domain/items';
import type { CalendarDate } from '../domain/types';
import { getPastPendingItems } from '../domain/views/past-pending';
import { fetchHabits, fetchHabitMarks, mapTaskRow } from './agenda';
import {
  describePostgrestFailure,
  describeThrownFailure,
} from './category-shared';
import { queryKeys } from './query-keys';
import {
  succeed,
  unwrapResult,
  type DataResult,
  type DataResultError,
} from './result';
import { supabase } from './supabase/client';
import { getDeviceTimeZone } from './time-zone';

const TASK_PAGE_SIZE = 1000;

async function fetchOverdueTasks(
  today: CalendarDate,
  timeZone: string,
): Promise<DataResult<Task[]>> {
  try {
    const tasks: Task[] = [];
    let offset = 0;
    while (true) {
      const query = supabase
        .from('tasks')
        .select('*')
        .eq('status', 'pending')
        .is('archived_at', null)
        .lt('due_date', today);
      const lastRow = offset + TASK_PAGE_SIZE - 1;
      const orderedQuery = query.order('id');
      const response = await orderedQuery.range(offset, lastRow);
      if (response.error) {
        return describePostgrestFailure(response.error, response.status);
      }
      const page = response.data.map((row) => mapTaskRow(row, timeZone));
      tasks.push(...page);
      if (page.length < TASK_PAGE_SIZE) {
        return succeed(tasks);
      }
      offset += TASK_PAGE_SIZE;
    }
  } catch (error) {
    return describeThrownFailure(error);
  }
}

function findOldestStartDate(habits: Habit[]): CalendarDate | null {
  let oldestStartDate: CalendarDate | null = null;
  for (const habit of habits) {
    if (oldestStartDate === null || habit.startDate < oldestStartDate) {
      oldestStartDate = habit.startDate;
    }
  }
  return oldestStartDate;
}

// Sin hábitos, o con todos empezando hoy o después, no hay marcas que leer.
async function fetchMarksUntilYesterday(
  habits: Habit[],
  today: CalendarDate,
): Promise<DataResult<HabitMark[]>> {
  const yesterday = addDays(today, -1);
  const oldestStartDate = findOldestStartDate(habits);
  if (oldestStartDate === null || oldestStartDate > yesterday) {
    return succeed([]);
  }
  return fetchHabitMarks({ fromDate: oldestStartDate, toDate: yesterday });
}

export async function fetchPastPending(
  today: CalendarDate,
): Promise<DataResult<ViewData>> {
  const timeZone = getDeviceTimeZone();
  const [habitsResult, tasksResult] = await Promise.all([
    fetchHabits({ includeArchived: false, timeZone }),
    fetchOverdueTasks(today, timeZone),
  ]);
  if (!habitsResult.ok) {
    return habitsResult;
  }
  if (!tasksResult.ok) {
    return tasksResult;
  }
  const marksResult = await fetchMarksUntilYesterday(habitsResult.value, today);
  if (!marksResult.ok) {
    return marksResult;
  }
  const items = getPastPendingItems({
    habits: habitsResult.value,
    marks: marksResult.value,
    tasks: tasksResult.value,
    today,
  });
  return succeed({ items });
}

export function usePastPending(
  today: CalendarDate,
): UseQueryResult<ViewData, DataResultError> {
  return useQuery({
    queryKey: queryKeys.pastPending(today),
    queryFn: async () => unwrapResult(await fetchPastPending(today)),
  });
}

/** Comparte la consulta de la lista: el contador cuenta lo que sigue pendiente. */
export function usePastPendingCount(today: CalendarDate): number {
  const pastPending = usePastPending(today);
  if (pastPending.data === undefined) {
    return 0;
  }
  const pendingItems = pastPending.data.items.filter(
    (item) => item.status === 'pending',
  );
  return pendingItems.length;
}
