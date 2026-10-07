import { expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useUpdateHabit } from './habits';
import { supabase } from './supabase/client';

jest.mock('./supabase/client', () => ({
  supabase: { rpc: jest.fn(), from: jest.fn() },
}));

it('saves the whole form through one RPC and invalidates views and habit detail', async () => {
  jest
    .mocked(supabase.rpc)
    .mockResolvedValue({ data: null, error: null, status: 200 } as never);
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
  });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useUpdateHabit(), { wrapper });
  const changes = {
    name: 'Leer',
    categoryId: null,
    sectionId: null,
    timeOfDay: null,
    timeSlot: null,
  };
  await act(async () => {
    await hook.result.current.mutateAsync({
      habitId: '11111111-1111-4111-8111-111111111111',
      changes,
      schedule: {
        startDate: '2026-11-01',
        today: '2026-10-07',
        rule: { frequency: 'monthly', weekdays: [], intervalDays: null },
      },
    });
  });
  expect(supabase.rpc).toHaveBeenCalledTimes(1);
  expect(supabase.rpc).toHaveBeenCalledWith(
    'update_habit',
    expect.objectContaining({
      p_name: 'Leer',
      p_new_start_date: '2026-11-01',
      p_frequency: 'monthly',
      p_today: '2026-10-07',
    }),
  );
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['views'] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['habits'] });
  expect(supabase.from).not.toHaveBeenCalled();
  hook.unmount();
  queryClient.clear();
});
