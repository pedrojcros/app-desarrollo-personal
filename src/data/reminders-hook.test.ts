import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';
import { useReminderSync } from './reminders';
import { fetchReminderData } from './reminders-read';
import * as platform from '../platform/notifications';
import {
  loadReminderSettings,
  reminderSettingsQueryKey,
} from './reminder-settings';
import { DEFAULT_REMINDER_SETTINGS } from '../domain/reminder-types';
import { succeed } from './result';

jest.mock('../platform/notifications');
jest.mock('expo-notifications', () => ({ setNotificationHandler: jest.fn() }));
jest.mock('./reminders-read', () => ({ fetchReminderData: jest.fn() }));
jest.mock('./reminder-settings', () => ({
  ...jest.requireActual<typeof import('./reminder-settings')>(
    './reminder-settings',
  ),
  loadReminderSettings: jest.fn(),
}));
let queryClient: QueryClient;
let onForeground: (state: AppStateStatus) => void;
let readCount: number;
let activeReads: number;
let maximumReads: number;
let releaseRead: (() => void) | undefined;
let pauseReads: boolean;

beforeEach(() => {
  jest.clearAllMocks();
  releaseRead = undefined;
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 8, 7, 30));
  readCount = 0;
  activeReads = 0;
  maximumReads = 0;
  pauseReads = false;
  queryClient = new QueryClient();
  jest.mocked(platform.isReminderPlatformSupported).mockReturnValue(true);
  jest.mocked(platform.getReminderPermission).mockResolvedValue('granted');
  jest.mocked(platform.getScheduledReminderKeys).mockResolvedValue([]);
  jest
    .mocked(loadReminderSettings)
    .mockResolvedValue(DEFAULT_REMINDER_SETTINGS);
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, listener) => {
      onForeground = listener;
      return { remove: jest.fn() };
    });
  jest.mocked(fetchReminderData).mockImplementation(async () => {
    readCount += 1;
    activeReads += 1;
    maximumReads = Math.max(maximumReads, activeReads);
    if (pauseReads) {
      await new Promise<void>((resolve) => {
        releaseRead = resolve;
      });
    }
    activeReads -= 1;
    return succeed({
      tasks: [],
      habits: [],
      marks: [],
      categoryNames: new Map(),
    });
  });
});
afterEach(() => {
  queryClient.clear();
  jest.restoreAllMocks();
  jest.useRealTimers();
});
function wrapper({ children }: { children: import('react').ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children);
}
async function flush() {
  await act(async () => {
    for (let index = 0; index < 30; index += 1) {
      await Promise.resolve();
    }
  });
}
async function mutate(isSuccessful: boolean) {
  const mutation = queryClient.getMutationCache().build(queryClient, {
    mutationFn: async () => ({ ok: isSuccessful }),
  });
  await act(async () => {
    await mutation.execute(undefined);
  });
}
it('groups successful mutations for two seconds and ignores DataResult failures', async () => {
  const { unmount } = renderHook(() => useReminderSync(true), { wrapper });
  await flush();
  expect(readCount).toBe(1);
  await mutate(false);
  await act(async () => jest.advanceTimersByTime(2000));
  expect(readCount).toBe(1);
  await mutate(true);
  await mutate(true);
  await act(async () => jest.advanceTimersByTime(1999));
  expect(readCount).toBe(1);
  await act(async () => jest.advanceTimersByTime(1));
  await flush();
  expect(readCount).toBe(2);
  unmount();
});
it('runs again after an in-flight sync without overlapping reads', async () => {
  pauseReads = true;
  const { unmount } = renderHook(() => useReminderSync(true), { wrapper });
  await flush();
  act(() => {
    onForeground('active');
    onForeground('active');
  });
  expect(readCount).toBe(1);
  pauseReads = false;
  releaseRead?.();
  await flush();
  expect(readCount).toBe(2);
  expect(maximumReads).toBe(1);
  unmount();
});
it('refreshes when settings change and when the local day changes', async () => {
  const { unmount } = renderHook(() => useReminderSync(true), { wrapper });
  await flush();
  act(() => {
    queryClient.setQueryData(reminderSettingsQueryKey, {
      ...DEFAULT_REMINDER_SETTINGS,
      enabled: false,
    });
  });
  await flush();
  expect(platform.cancelAllReminders).toHaveBeenCalled();
  act(() => {
    queryClient.setQueryData(
      reminderSettingsQueryKey,
      DEFAULT_REMINDER_SETTINGS,
    );
  });
  await flush();
  expect(readCount).toBe(2);
  await act(async () => jest.advanceTimersByTime(16.5 * 3600000));
  await flush();
  expect(readCount).toBe(3);
  unmount();
});
it('does not synchronize without a session and stops after unmount', async () => {
  const { unmount } = renderHook(() => useReminderSync(false), { wrapper });
  await flush();
  expect(readCount).toBe(0);
  unmount();
  await mutate(true);
  await act(async () => jest.advanceTimersByTime(2000));
  expect(readCount).toBe(0);
});

it('ignores rejected mutations and unrelated cached queries', async () => {
  const { unmount } = renderHook(() => useReminderSync(true), { wrapper });
  await flush();
  const mutation = queryClient.getMutationCache().build(queryClient, {
    mutationFn: async () => {
      throw new Error('Offline');
    },
  });
  await act(async () => {
    await mutation.execute(undefined).catch(() => undefined);
  });
  act(() => {
    queryClient.setQueryData(['tasks'], []);
  });
  await act(async () => jest.advanceTimersByTime(2000));
  expect(readCount).toBe(1);
  unmount();
});

it('discards a late read and queued events when the session disappears', async () => {
  let finishReading: (() => void) | undefined;
  jest.mocked(fetchReminderData).mockImplementationOnce(async () => {
    readCount += 1;
    await new Promise<void>((resolve) => {
      finishReading = resolve;
    });
    return succeed({
      tasks: [
        {
          id: 'task-one',
          name: 'Practice',
          notes: null,
          categoryId: null,
          sectionId: null,
          dueDate: '2026-10-09',
          dueTime: null,
          status: 'pending',
          markedAt: null,
          archivedOn: null,
        },
      ],
      habits: [],
      marks: [],
      categoryNames: new Map(),
    });
  });
  const { rerender, unmount } = renderHook(
    (hasSession: boolean) => useReminderSync(hasSession),
    { wrapper, initialProps: true },
  );
  await flush();
  act(() => onForeground('active'));
  rerender(false);
  finishReading?.();
  await flush();
  expect(readCount).toBe(1);
  expect(platform.scheduleReminder).not.toHaveBeenCalled();
  unmount();
});
