import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { queryKeys } from './query-keys';
import { useUpcomingView } from './upcoming';

type Row = Record<string, unknown>;
let mockRows: Record<string, Row[]> = {};
let mockFailureTable: string | null = null;
let mockNetworkFailure = false;
const mockFilters: { table: string; column: string; value: unknown }[] = [];
const queryClients: QueryClient[] = [];

jest.mock('./time-zone', () => ({ getDeviceTimeZone: () => 'Europe/Madrid' }));

// La simulación reproduce el límite REST; una lectura sin paginar pierde tareas.
jest.mock('./supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      let rows = mockRows[table] ?? [];
      let firstRow = 0;
      let lastRow = 999;
      const builder = {
        select: () => builder,
        is: (column: string, value: unknown) => {
          mockFilters.push({ table, column, value });
          rows = rows.filter((row) => row[column] === value);
          return builder;
        },
        eq: (column: string, value: unknown) => {
          mockFilters.push({ table, column, value });
          rows = rows.filter((row) => row[column] === value);
          return builder;
        },
        gte: (column: string, value: string) => {
          mockFilters.push({ table, column, value });
          rows = rows.filter((row) => String(row[column]) >= value);
          return builder;
        },
        lte: (column: string, value: string) => {
          mockFilters.push({ table, column, value });
          rows = rows.filter((row) => String(row[column]) <= value);
          return builder;
        },
        order: () => builder,
        range: (from: number, to: number) => {
          firstRow = from;
          lastRow = to;
          return builder;
        },
        then: (onFulfilled: never, onRejected: never) => {
          if (mockNetworkFailure) {
            return Promise.reject(new TypeError('Network unavailable')).then(
              onFulfilled,
              onRejected,
            );
          }
          const response =
            table === mockFailureTable
              ? { data: null, error: { message: 'Read failed' }, status: 500 }
              : {
                  data: rows.slice(firstRow, lastRow + 1),
                  error: null,
                  status: 200,
                };
          return Promise.resolve(response).then(onFulfilled, onRejected);
        },
      };
      return builder;
    },
  },
}));

function taskRow(overrides: Row = {}): Row {
  return {
    id: 'task',
    name: 'Leche',
    notes: null,
    category_id: null,
    section_id: null,
    due_date: '2026-10-07',
    due_time: '10:00:00',
    status: 'pending',
    marked_at: null,
    archived_at: null,
    ...overrides,
  };
}

function renderUpcoming() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  queryClients.push(queryClient);
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  const hook = renderHook(
    ({ date }: { date: string }) => useUpcomingView(date),
    {
      initialProps: { date: '2026-10-07' },
      wrapper: Wrapper,
    },
  );
  return { ...hook, queryClient };
}

beforeEach(() => {
  mockRows = {};
  mockFailureTable = null;
  mockNetworkFailure = false;
  mockFilters.length = 0;
});

afterEach(() => {
  cleanup();
  for (const queryClient of queryClients) {
    queryClient.clear();
  }
  queryClients.length = 0;
});

describe('useUpcomingView', () => {
  it('groups at read time while the cache keeps a flat ViewData', async () => {
    mockRows.tasks = [
      taskRow({ due_date: '2026-10-08' }),
      taskRow({ id: 'last', due_date: '2026-11-08' }),
      taskRow(),
      taskRow({ id: 'outside', due_date: '2026-11-09' }),
    ];
    const { result, queryClient } = renderUpcoming();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(5);
    expect(result.current.data![0].days[0].date).toBe('2026-10-08');
    const cached = queryClient.getQueryData<{ items: unknown[] }>(
      queryKeys.upcoming('2026-10-07'),
    );
    expect(cached?.items).toHaveLength(2);
    expect(cached).toEqual({ items: expect.any(Array) });
    expect(mockFilters).toEqual(
      expect.arrayContaining([
        { table: 'tasks', column: 'due_date', value: '2026-10-08' },
        { table: 'tasks', column: 'due_date', value: '2026-11-08' },
        {
          table: 'habit_marks',
          column: 'occurrence_date',
          value: '2026-10-08',
        },
        {
          table: 'habit_marks',
          column: 'occurrence_date',
          value: '2026-11-08',
        },
      ]),
    );
  });
  it('reads all task pages', async () => {
    mockRows.tasks = Array.from({ length: 1001 }, (_unused, index) =>
      taskRow({ id: `task-${index}`, due_date: '2026-10-08' }),
    );
    const { result } = renderUpcoming();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].days[0].items).toHaveLength(1001);
  });
  it.each(['habits', 'habit_marks', 'tasks'])(
    'does not publish partial data after a %s error',
    async (table) => {
      mockFailureTable = table;
      const { result } = renderUpcoming();
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.data).toBeUndefined();
    },
  );
  it('reports a network failure', async () => {
    mockNetworkFailure = true;
    const { result } = renderUpcoming();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.code).toBe('network_error');
  });
});
