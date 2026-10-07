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
import { useTodayView } from './today';

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

function renderToday() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  queryClients.push(queryClient);
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  const hook = renderHook(({ date }: { date: string }) => useTodayView(date), {
    initialProps: { date: '2026-10-07' },
    wrapper: Wrapper,
  });
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

describe('useTodayView', () => {
  it('reads only active items for today, keeping marked tasks in the shared cache', async () => {
    mockRows.tasks = [
      taskRow(),
      taskRow({
        id: 'done',
        status: 'done',
        marked_at: '2026-10-07T08:00:00Z',
      }),
      taskRow({
        id: 'skipped',
        status: 'not_done',
        marked_at: '2026-10-07T09:00:00Z',
      }),
      taskRow({ id: 'overdue', due_date: '2026-10-06' }),
      taskRow({ id: 'undated', due_date: null }),
      taskRow({ id: 'archived', archived_at: '2026-10-07T07:00:00Z' }),
    ];
    const { result, queryClient } = renderToday();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const items = result.current.data!.items;
    expect(items.map((item) => item.status)).toEqual([
      'done',
      'not_done',
      'pending',
    ]);
    expect(items.map((item) => item.sortTime)).toEqual([
      '10:00',
      '10:00',
      '10:00',
    ]);
    expect(queryClient.getQueryData(queryKeys.today('2026-10-07'))).toEqual({
      items,
    });
    expect(mockFilters).toEqual(
      expect.arrayContaining([
        { table: 'habits', column: 'archived_at', value: null },
        {
          table: 'habit_marks',
          column: 'occurrence_date',
          value: '2026-10-07',
        },
        { table: 'tasks', column: 'due_date', value: '2026-10-07' },
        { table: 'tasks', column: 'archived_at', value: null },
      ]),
    );
  });

  it('reads every page when more than 1000 tasks are due today', async () => {
    mockRows.tasks = Array.from({ length: 2000 }, (_unused, index) =>
      taskRow({ id: `task-${index}` }),
    );
    const { result } = renderToday();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.items).toHaveLength(2000);
  });

  it('loads the new day under a separate cache key', async () => {
    mockRows.tasks = [
      taskRow(),
      taskRow({ id: 'tomorrow', due_date: '2026-10-08', name: 'Pan' }),
    ];
    const { result, rerender, queryClient } = renderToday();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    rerender({ date: '2026-10-08' });
    await waitFor(() =>
      expect(result.current.data?.items[0]?.name).toBe('Pan'),
    );
    expect(
      queryClient.getQueryData(queryKeys.today('2026-10-07')),
    ).toBeDefined();
    expect(
      queryClient.getQueryData(queryKeys.today('2026-10-08')),
    ).toBeDefined();
  });

  it.each(['habits', 'habit_marks', 'tasks'])(
    'reports a %s read error instead of an empty day',
    async (table) => {
      mockFailureTable = table;
      const { result } = renderToday();
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.code).toBe('unknown_error');
      expect(result.current.data).toBeUndefined();
    },
  );

  it('reports a network failure', async () => {
    mockNetworkFailure = true;
    const { result } = renderToday();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.code).toBe('network_error');
  });
});
