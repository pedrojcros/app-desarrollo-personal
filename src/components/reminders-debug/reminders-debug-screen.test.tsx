import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { syncReminders } from '@/data/reminders';
import { succeed } from '@/data/result';
import {
  getReminderPermission,
  isReminderPlatformSupported,
} from '@/platform/notifications';
import {
  listScheduledReminders,
  scheduleTestReminder,
} from '@/platform/reminder-debug';
import { renderWithTheme } from '@/tests/render-with-theme';

import RemindersDebugScreen from './reminders-debug-screen';

jest.mock('@/platform/notifications', () => ({
  isReminderPlatformSupported: jest.fn(),
  getReminderPermission: jest.fn(),
}));
jest.mock('@/platform/reminder-debug', () => ({
  listScheduledReminders: jest.fn(),
  scheduleTestReminder: jest.fn(),
}));
jest.mock('@/data/reminders', () => ({ syncReminders: jest.fn() }));

const isSupportedMock = jest.mocked(isReminderPlatformSupported);
const getPermissionMock = jest.mocked(getReminderPermission);
const listRemindersMock = jest.mocked(listScheduledReminders);
const scheduleTestMock = jest.mocked(scheduleTestReminder);
const syncRemindersMock = jest.mocked(syncReminders);

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  renderWithTheme(
    <QueryClientProvider client={queryClient}>
      <RemindersDebugScreen />
    </QueryClientProvider>,
  );
}

describe('RemindersDebugScreen', () => {
  beforeEach(() => {
    isSupportedMock.mockReturnValue(true);
    getPermissionMock.mockResolvedValue('granted');
    listRemindersMock.mockResolvedValue([]);
    scheduleTestMock.mockResolvedValue(succeed('test:1'));
    syncRemindersMock.mockResolvedValue(succeed(undefined));
  });

  it('says there are no reminders on the web', () => {
    isSupportedMock.mockReturnValue(false);
    renderScreen();

    expect(screen.getByText('No hay recordatorios en la web.')).toBeTruthy();
    expect(listRemindersMock).not.toHaveBeenCalled();
  });

  it('shows the permission and the scheduled reminders', async () => {
    listRemindersMock.mockResolvedValue([
      {
        key: 'task:1:2026-10-10:0:abc',
        date: '2026-10-10',
        time: '09:00',
        title: 'Pagar el alquiler',
      },
    ]);
    renderScreen();

    expect(await screen.findByText('Pagar el alquiler')).toBeTruthy();
    expect(screen.getByText('2026-10-10 09:00')).toBeTruthy();
    expect(screen.getByText('task:1:2026-10-10:0:abc')).toBeTruthy();
    expect(screen.getByText('Permiso de avisos: concedido')).toBeTruthy();
  });

  it('syncs the reminders and reloads the list', async () => {
    renderScreen();
    await screen.findByText('No hay avisos programados.');
    listRemindersMock.mockClear();

    fireEvent.press(screen.getByText('Poner al día'));

    await waitFor(() => expect(syncRemindersMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Puesto al día.')).toBeTruthy();
    expect(listRemindersMock).toHaveBeenCalledTimes(1);
  });

  it('schedules the test reminder and reloads the list', async () => {
    renderScreen();
    await screen.findByText('No hay avisos programados.');

    fireEvent.press(screen.getByText('Probar en 10 segundos'));

    await waitFor(() => expect(scheduleTestMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/test:1/)).toBeTruthy();
  });
});
