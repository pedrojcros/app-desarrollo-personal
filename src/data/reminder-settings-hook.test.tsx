import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import {
  DEFAULT_REMINDER_SETTINGS,
  type ReminderSettings,
} from '../domain/reminder-types';
import {
  loadReminderSettings,
  reminderSettingsQueryKey,
  useReminderSettings,
} from './reminder-settings';

const savedSettings: ReminderSettings = {
  enabled: false,
  taskLeads: [7],
  habitTimeSlots: true,
};

function renderSettingsHook() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  const hook = renderHook(() => useReminderSettings(), { wrapper: Wrapper });
  return { hook, queryClient };
}

describe('useReminderSettings', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns the defaults while loading and then the stored settings', async () => {
    await AsyncStorage.setItem(
      'reminder-settings',
      JSON.stringify(savedSettings),
    );
    const { hook } = renderSettingsHook();

    expect(hook.result.current.settings).toEqual(DEFAULT_REMINDER_SETTINGS);
    await waitFor(() =>
      expect(hook.result.current.settings).toEqual(savedSettings),
    );
  });

  it('saves the settings and updates the cache', async () => {
    const { hook, queryClient } = renderSettingsHook();
    await waitFor(() =>
      expect(queryClient.getQueryData(reminderSettingsQueryKey)).toEqual(
        DEFAULT_REMINDER_SETTINGS,
      ),
    );

    await act(async () => {
      await hook.result.current.saveSettings(savedSettings);
    });

    expect(queryClient.getQueryData(reminderSettingsQueryKey)).toEqual(
      savedSettings,
    );
    await waitFor(() =>
      expect(hook.result.current.settings).toEqual(savedSettings),
    );
    await expect(loadReminderSettings()).resolves.toEqual(savedSettings);
  });
});
