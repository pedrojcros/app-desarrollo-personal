import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { loadReminderSettings } from '@/data/reminder-settings';
import {
  getReminderPermission,
  isReminderPlatformSupported,
  requestReminderPermission,
} from '@/platform/notifications';
import { renderWithTheme } from '@/tests/render-with-theme';

import { RemindersSection } from './reminders-section';

jest.mock('@/platform/notifications', () => ({
  isReminderPlatformSupported: jest.fn(),
  getReminderPermission: jest.fn(),
  requestReminderPermission: jest.fn(),
}));

const isSupportedMock = jest.mocked(isReminderPlatformSupported);
const getPermissionMock = jest.mocked(getReminderPermission);
const requestPermissionMock = jest.mocked(requestReminderPermission);

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  renderWithTheme(
    <QueryClientProvider client={queryClient}>
      <RemindersSection />
    </QueryClientProvider>,
  );
}

describe('RemindersSection', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    isSupportedMock.mockReturnValue(true);
    getPermissionMock.mockResolvedValue('granted');
    requestPermissionMock.mockResolvedValue('granted');
  });

  it('shows the reminders on and says nothing about the permission when granted (scenario 10)', async () => {
    renderSection();

    const generalSwitch = await screen.findByRole('switch', {
      name: 'Recordatorios',
    });
    expect(generalSwitch.props.value).toBe(true);
    expect(screen.queryByText('Permitir avisos')).toBeNull();
    expect(screen.queryByText(/bloqueados/)).toBeNull();
  });

  it('asks for the permission when it is still undecided', async () => {
    getPermissionMock.mockResolvedValueOnce('undetermined');
    requestPermissionMock.mockResolvedValue('granted');
    renderSection();

    fireEvent.press(await screen.findByLabelText('Permitir avisos'));

    await waitFor(() => expect(requestPermissionMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByText('Permitir avisos')).toBeNull(),
    );
  });

  it('says the notices are blocked and opens the phone settings when denied (scenario 11)', async () => {
    getPermissionMock.mockResolvedValue('denied');
    const openSettings = jest
      .spyOn(Linking, 'openSettings')
      .mockResolvedValue(undefined);
    renderSection();

    expect(
      await screen.findByText('Los avisos están bloqueados en el móvil'),
    ).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Abrir ajustes del móvil'));

    expect(openSettings).toHaveBeenCalledTimes(1);
  });

  it('turns the reminders off and saves it (scenario 12)', async () => {
    renderSection();

    const generalSwitch = await screen.findByRole('switch', {
      name: 'Recordatorios',
    });
    fireEvent(generalSwitch, 'valueChange', false);

    await waitFor(async () => {
      const settings = await loadReminderSettings();
      expect(settings.enabled).toBe(false);
    });
    await waitFor(() =>
      expect(screen.queryByLabelText('7 días antes')).toBeNull(),
    );
  });

  it('lets several lead times be chosen at once', async () => {
    renderSection();

    fireEvent.press(
      await screen.findByRole('checkbox', { name: '7 días antes' }),
    );

    await waitFor(async () => {
      const settings = await loadReminderSettings();
      expect(settings.taskLeads).toEqual([7, 3, 1, 0]);
    });
  });

  it('turns everything off and leaves no lead time marked when the last one is removed', async () => {
    renderSection();

    const labels = ['3 días antes', 'El día anterior', 'El mismo día'];
    for (const label of labels) {
      fireEvent.press(await screen.findByRole('checkbox', { name: label }));
      await waitFor(() => {
        const row = screen.queryByRole('checkbox', { name: label });
        const isStillMarked = row?.props.accessibilityState.checked === true;
        expect(isStillMarked).toBe(false);
      });
    }

    await waitFor(async () => {
      const settings = await loadReminderSettings();
      expect(settings.taskLeads).toEqual([]);
      expect(settings.enabled).toBe(false);
    });
  });

  it('saves the habit time slots switch', async () => {
    renderSection();

    const habitSwitch = await screen.findByRole('switch', {
      name: 'Avisar también de los hábitos de mañana, tarde y noche',
    });
    expect(habitSwitch.props.value).toBe(false);
    fireEvent(habitSwitch, 'valueChange', true);

    await waitFor(async () => {
      const settings = await loadReminderSettings();
      expect(settings.habitTimeSlots).toBe(true);
    });
  });

  it('only explains that reminders need the phone app on the web', () => {
    isSupportedMock.mockReturnValue(false);
    renderSection();

    expect(
      screen.getByText('Los recordatorios solo funcionan en la app instalada'),
    ).toBeTruthy();
    expect(screen.queryByRole('switch')).toBeNull();
  });
});
