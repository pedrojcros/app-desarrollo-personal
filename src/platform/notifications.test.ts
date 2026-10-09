import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { PlannedReminder } from '../domain/reminder-types';
import {
  prepareReminderChannels,
  requestReminderPermission,
  scheduleReminder,
} from './notifications';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'standalone' },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));

jest.mock('expo-notifications', () => ({
  AndroidImportance: {
    DEFAULT: 3,
  },
  SchedulableTriggerInputTypes: {
    DATE: 'date',
  },
  getAllScheduledNotificationsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

const reminder: PlannedReminder = {
  key: 'task:task-1:2026-10-12:3',
  date: '2026-10-12',
  time: '09:00',
  title: 'Preparar entrega',
  body: 'En 3 días',
  channel: 'tasks',
  target: { kind: 'task', taskId: 'task-1' },
};

describe('native reminder notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
    jest
      .mocked(Notifications.setNotificationChannelAsync)
      .mockResolvedValue(null);
    jest
      .mocked(Notifications.scheduleNotificationAsync)
      .mockResolvedValue(reminder.key);
  });

  it('prepares the task and habit notification channels', async () => {
    await prepareReminderChannels();

    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledTimes(2);
    expect(Notifications.setNotificationChannelAsync).toHaveBeenNthCalledWith(
      1,
      'tasks',
      expect.any(Object),
    );
    expect(Notifications.setNotificationChannelAsync).toHaveBeenNthCalledWith(
      2,
      'habits',
      expect.any(Object),
    );
  });

  it('creates channels before requesting notification permission', async () => {
    jest
      .mocked(Notifications.requestPermissionsAsync)
      .mockRejectedValue(new Error('Permission request failed.'));

    await expect(requestReminderPermission()).rejects.toThrow(
      'Permission request failed.',
    );

    const firstChannelCallOrder = jest.mocked(
      Notifications.setNotificationChannelAsync,
    ).mock.invocationCallOrder[0];
    const permissionRequestCallOrder = jest.mocked(
      Notifications.requestPermissionsAsync,
    ).mock.invocationCallOrder[0];
    expect(firstChannelCallOrder).toBeLessThan(permissionRequestCallOrder);
  });

  it('schedules with its stable identifier, local date, and channel', async () => {
    const result = await scheduleReminder(reminder);

    expect(result).toEqual({ ok: true, value: undefined });
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: reminder.key,
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { target: reminder.target },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(2026, 9, 12, 9, 0),
        channelId: 'tasks',
      },
    });
  });
});
