import { expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useHistory } from './history';
import { queryKeys } from './query-keys';
import { applyStatusToItems, type ViewData } from '../domain/items';
import { buildHistoryGrid } from '../domain/views/history';

jest.mock('./supabase/client', () => ({ supabase: {} }));

it('shares the ViewData cache and immediately reflects a mark patched by another view', async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, gcTime: Infinity, retry: false },
    },
  });
  const key = queryKeys.history('2026-10-06', '2026-10-07');
  const data: ViewData = {
    items: [
      {
        target: { kind: 'occurrence', habitId: 'swim', date: '2026-10-06' },
        name: 'Nadar',
        status: 'pending',
        date: '2026-10-06',
        sortTime: null,
        categoryId: null,
        sectionId: null,
        markedAt: null,
      },
    ],
  };
  queryClient.setQueryData(key, data);
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  const hook = renderHook(() => useHistory('2026-10-06', '2026-10-07'), {
    wrapper: Wrapper,
  });
  expect(hook.result.current.data).toEqual(data);
  act(() => {
    queryClient.setQueriesData<ViewData>(
      { queryKey: queryKeys.views() },
      (cached) => {
        if (cached === undefined) {
          return cached;
        }
        const items = applyStatusToItems(
          cached.items,
          data.items[0].target,
          'done',
          '2026-10-07T10:00:00Z',
        );
        return { items };
      },
    );
  });
  await waitFor(() =>
    expect(hook.result.current.data?.items[0].status).toBe('done'),
  );
  const grid = buildHistoryGrid(
    hook.result.current.data!.items,
    '2026-10-06',
    '2026-10-07',
    '2026-10-07',
    'Europe/Madrid',
  );
  expect(grid.rows[0].cells).toEqual(['empty', 'done']);
  expect(grid.dayPercentages).toEqual([null, 100]);
  hook.unmount();
  queryClient.clear();
});
