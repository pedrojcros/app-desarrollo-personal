import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import type { Habit } from '../domain/entities';
import { fetchHabits, fetchHabitMarks } from './agenda';
import {
  fetchPastPending,
  usePastPending,
  usePastPendingCount,
} from './past-pending';
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
  id: 'invoice',
  name: 'Factura',
  notes: null,
  category_id: null,
  section_id: null,
  due_date: '2026-10-05',
  due_time: '08:30:00',
  status: 'pending',
  marked_at: null,
  archived_at: null,
  user_id: 'owner',
  created_at: '2026-10-01T00:00:00Z',
};
const habit: Habit = {
  id: 'read',
  name: 'Leer',
  categoryId: null,
  sectionId: null,
  startDate: '2026-10-04',
  timeOfDay: null,
  timeSlot: null,
  durationMinutes: null,
  archivedOn: null,
  ruleVersions: [
    {
      validFrom: '2026-10-04',
      frequency: 'daily',
      weekdays: [],
      intervalDays: null,
    },
  ],
};
const fetchHabitsMock = jest.mocked(fetchHabits);
const fetchMarksMock = jest.mocked(fetchHabitMarks);
const fromMock = jest.mocked(supabase.from);
const query = {
  select: jest.fn(),
  eq: jest.fn(),
  is: jest.fn(),
  lt: jest.fn(),
  order: jest.fn(),
  range: jest.fn<() => Promise<unknown>>(),
};
function successfulPage(data: unknown[]) {
  return { data, error: null, status: 200 };
}

beforeEach(() => {
  jest.clearAllMocks();
  fetchHabitsMock.mockResolvedValue(succeed([habit]));
  fetchMarksMock.mockResolvedValue(succeed([]));
  fromMock.mockReturnValue(query as never);
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.is.mockReturnValue(query);
  query.lt.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.range.mockResolvedValue(successfulPage([taskRow]));
});

describe('Past pending reading', () => {
  it('reads active habits, marks since the oldest start and overdue tasks', async () => {
    const result = await fetchPastPending(today);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const dates = result.value.items.map((item) => item.date);
    expect(dates).toEqual([
      '2026-10-06',
      '2026-10-05',
      '2026-10-05',
      '2026-10-04',
    ]);
    expect(fetchHabitsMock).toHaveBeenCalledWith({
      includeArchived: false,
      timeZone: 'Europe/Madrid',
    });
    expect(fetchMarksMock).toHaveBeenCalledWith({
      fromDate: '2026-10-04',
      toDate: '2026-10-06',
    });
    expect(fromMock).toHaveBeenCalledWith('tasks');
    expect(query.eq).toHaveBeenCalledWith('status', 'pending');
    expect(query.is).toHaveBeenCalledWith('archived_at', null);
    expect(query.lt).toHaveBeenCalledWith('due_date', today);
  });

  it('does not read marks when no habit has started before today', async () => {
    const rule = { ...habit.ruleVersions[0], validFrom: today };
    const habitStartingToday = {
      ...habit,
      startDate: today,
      ruleVersions: [rule],
    };
    fetchHabitsMock.mockResolvedValue(succeed([habitStartingToday]));
    await fetchPastPending(today);
    expect(fetchMarksMock).not.toHaveBeenCalled();
    fetchHabitsMock.mockResolvedValue(succeed([]));
    await fetchPastPending(today);
    expect(fetchMarksMock).not.toHaveBeenCalled();
  });

  it('paginates tasks instead of dropping rows after the REST limit', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      ...taskRow,
      id: `task-${index}`,
    }));
    query.range
      .mockResolvedValueOnce(successfulPage(firstPage))
      .mockResolvedValueOnce(successfulPage([{ ...taskRow, id: 'last' }]));
    fetchHabitsMock.mockResolvedValue(succeed([]));
    const result = await fetchPastPending(today);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.items).toHaveLength(1001);
    expect(query.range.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
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
      expect(await fetchPastPending(today)).toEqual(failure);
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
      const result = await fetchPastPending(today);
      expect(result.ok).toBe(false);
      if (result.ok) {
        return;
      }
      const expectedCode = status === 0 ? 'network_error' : 'unknown_error';
      expect(result.error.code).toBe(expectedCode);
    },
  );

  it.each([new TypeError('Offline'), new Error('Unexpected')])(
    'handles thrown task errors: %s',
    async (error) => {
      query.range.mockRejectedValue(error);
      const result = await fetchPastPending(today);
      expect(result.ok).toBe(false);
    },
  );

  it('stores ViewData under the past pending key and counts pending items', async () => {
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
      () => ({
        view: usePastPending(today),
        count: usePastPendingCount(today),
      }),
      { wrapper: Wrapper },
    );
    expect(result.current.count).toBe(0);
    await waitFor(() => expect(result.current.view.isSuccess).toBe(true));
    expect(queryClient.getQueryData(queryKeys.pastPending(today))).toEqual(
      result.current.view.data,
    );
    expect(result.current.count).toBe(4);
    unmount();
    queryClient.clear();
  });
});
