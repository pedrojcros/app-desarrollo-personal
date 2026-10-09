import { expect, it, jest } from '@jest/globals';

import type { PlannedReminder } from '../domain/reminder-types';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'storeClient' },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));

// Un fallo al cargar la librería no debe impedir importar las rutas en Expo Go.
jest.mock('expo-notifications', () => {
  throw new Error('Notifications must not load in Expo Go.');
});

it('loads the adapter and makes every reminder operation inert in Expo Go', async () => {
  // Jest ejecuta módulos CommonJS; así también se prueba su carga inicial.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const notifications: typeof import('./notifications') = require('./notifications');
  const reminder: PlannedReminder = {
    key: 'task:one',
    date: '2026-10-12',
    time: '09:00',
    title: 'Preparar entrega',
    body: 'En 3 días',
    channel: 'tasks',
    target: { kind: 'task', taskId: 'one' },
  };
  const onTap = jest.fn();

  expect(notifications.isReminderPlatformSupported()).toBe(false);
  await expect(notifications.getReminderPermission()).resolves.toBe(
    'unsupported',
  );
  await expect(notifications.requestReminderPermission()).resolves.toBe(
    'unsupported',
  );
  await expect(notifications.scheduleReminder(reminder)).resolves.toEqual({
    ok: true,
    value: undefined,
  });
  await expect(notifications.getScheduledReminderKeys()).resolves.toEqual([]);
  notifications.configureReminderPresentation();
  await notifications.prepareReminderChannels();
  await notifications.cancelReminders([reminder.key]);
  await notifications.cancelAllReminders();
  const removeListener = notifications.addReminderTapListener(onTap);
  removeListener();
  expect(onTap).not.toHaveBeenCalled();
});
