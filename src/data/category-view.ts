import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { Task } from '../domain/entities';
import type { ViewData } from '../domain/items';
import type { CalendarDate } from '../domain/types';
import { getCategoryViewItems } from '../domain/views/category';
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

async function fetchCategoryTasks(
  categoryId: string | null,
  timeZone: string,
): Promise<DataResult<Task[]>> {
  try {
    const tasks: Task[] = [];
    let offset = 0;
    while (true) {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('status', 'pending')
        .is('archived_at', null);
      if (categoryId === null) {
        query = query.is('category_id', null);
      } else {
        query = query.eq('category_id', categoryId);
      }
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

export async function fetchCategoryView(
  categoryId: string | null,
  today: CalendarDate,
): Promise<DataResult<ViewData>> {
  const timeZone = getDeviceTimeZone();
  const [habitsResult, marksResult, tasksResult] = await Promise.all([
    fetchHabits({ includeArchived: false, timeZone }),
    fetchHabitMarks({ fromDate: today, toDate: today }),
    fetchCategoryTasks(categoryId, timeZone),
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
  const items = getCategoryViewItems({
    habits: habitsResult.value,
    marks: marksResult.value,
    tasks: tasksResult.value,
    categoryId,
    today,
  });
  return succeed({ items });
}

export function useCategoryView(
  categoryId: string | null,
  today: CalendarDate,
): UseQueryResult<ViewData, DataResultError> {
  return useQuery({
    queryKey: [...queryKeys.categoryView(categoryId), today],
    queryFn: async () =>
      unwrapResult(await fetchCategoryView(categoryId, today)),
  });
}
