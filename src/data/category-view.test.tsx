import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { fetchHabits, fetchHabitMarks } from './agenda';
import { fetchCategoryView, useCategoryView } from './category-view';
import { queryKeys } from './query-keys';
import { fail, succeed } from './result';
import { supabase } from './supabase/client';

jest.mock('./agenda', () => ({
  ...jest.requireActual<typeof import('./agenda')>('./agenda'),
  fetchHabits: jest.fn(),
  fetchHabitMarks: jest.fn(),
}));
jest.mock('./supabase/client', () => ({ supabase: { from: jest.fn() } }));
jest.mock('./time-zone', () => ({ getDeviceTimeZone: () => 'Europe/Madrid' }));

const today = '2026-10-07';
const taskRow = {
  id: 'milk',
  name: 'Leche',
  notes: null,
  category_id: 'shopping',
  section_id: null,
  due_date: '2026-10-08',
  due_time: '08:30:00',
  status: 'pending',
  marked_at: null,
  archived_at: null,
  user_id: 'owner',
  created_at: '2026-10-01T00:00:00Z',
};
const fetchHabitsMock = jest.mocked(fetchHabits);
const fetchMarksMock = jest.mocked(fetchHabitMarks);
const fromMock = jest.mocked(supabase.from);
const query = {
  select: jest.fn(),
  eq: jest.fn(),
  is: jest.fn(),
  order: jest.fn(),
  range: jest.fn<() => Promise<unknown>>(),
};
function successfulPage(data: unknown[]) {
  return { data, error: null, status: 200 };
}

beforeEach(() => {
  jest.clearAllMocks();
  fetchHabitsMock.mockResolvedValue(succeed([]));
  fetchMarksMock.mockResolvedValue(succeed([]));
  fromMock.mockReturnValue(query as never);
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.is.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.range.mockResolvedValue(successfulPage([taskRow]));
});

describe('Category view reading', () => {
  it('maps task time and scopes reads to active pending category contents', async () => {
    const result = await fetchCategoryView('shopping', today);
    expect(result).toEqual(
      succeed({
        items: [
          {
            target: { kind: 'task', taskId: 'milk' },
            name: 'Leche',
            status: 'pending',
            date: '2026-10-08',
            sortTime: '08:30',
            categoryId: 'shopping',
            sectionId: null,
            markedAt: null,
          },
        ],
      }),
    );
    expect(fetchHabitsMock).toHaveBeenCalledWith({
      includeArchived: false,
      timeZone: 'Europe/Madrid',
    });
    expect(fetchMarksMock).toHaveBeenCalledWith({
      fromDate: today,
      toDate: today,
    });
    expect(fromMock).toHaveBeenCalledWith('tasks');
    expect(query.eq.mock.calls).toEqual([
      ['status', 'pending'],
      ['category_id', 'shopping'],
    ]);
    expect(query.is).toHaveBeenCalledWith('archived_at', null);
  });
  it('uses SQL IS NULL for Inbox contents', async () => {
    query.range.mockResolvedValue(
      successfulPage([{ ...taskRow, category_id: null }]),
    );
    const result = await fetchCategoryView(null, today);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.items[0].categoryId).toBeNull();
    expect(query.is).toHaveBeenCalledWith('category_id', null);
    expect(query.eq).not.toHaveBeenCalledWith('category_id', null);
  });
  it('paginates tasks instead of dropping rows after the REST limit', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      ...taskRow,
      id: `task-${index}`,
    }));
    query.range
      .mockResolvedValueOnce(successfulPage(firstPage))
      .mockResolvedValueOnce(successfulPage([{ ...taskRow, id: 'last' }]));
    const result = await fetchCategoryView('shopping', today);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.items).toHaveLength(1001);
    expect(query.range.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
    expect(query.order).toHaveBeenCalledWith('id');
  });
  it.each(['habits', 'marks'] as const)(
    'propagates a %s read failure',
    async (source) => {
      const failure = fail('network_error', 'Could not reach server');
      if (source === 'habits') {
        fetchHabitsMock.mockResolvedValue(failure);
      } else {
        fetchMarksMock.mockResolvedValue(failure);
      }
      expect(await fetchCategoryView('shopping', today)).toEqual(failure);
    },
  );
  it.each([0, 500])(
    'returns a typed task read error for HTTP %s',
    async (status) => {
      query.range.mockResolvedValue({
        data: null,
        error: { code: 'unknown' },
        status,
      });
      const result = await fetchCategoryView('shopping', today);
      expect(result.ok).toBe(false);
      if (result.ok) {
        return;
      }
      expect(result.error.code).toBe(
        status === 0 ? 'network_error' : 'unknown_error',
      );
    },
  );
  it.each([new TypeError('Offline'), new Error('Unexpected')])(
    'handles thrown task errors: %s',
    async (error) => {
      query.range.mockRejectedValue(error);
      const result = await fetchCategoryView('shopping', today);
      expect(result.ok).toBe(false);
      if (result.ok) {
        return;
      }
      expect(result.error.code).toBe(
        error instanceof TypeError ? 'network_error' : 'unknown_error',
      );
    },
  );
  it('stores ViewData under the shared views key including today', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    function Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }
    const { result, unmount } = renderHook(
      () => useCategoryView('shopping', today),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(
      queryClient.getQueryData([...queryKeys.categoryView('shopping'), today]),
    ).toEqual(result.current.data);
    unmount();
    queryClient.clear();
  });
});
