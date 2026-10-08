import { describe, expect, it } from '@jest/globals';

import type { PlannedReminder } from '../domain/reminder-types';
import {
  addReminderTapListener,
  cancelAllReminders,
  cancelReminders,
  getReminderPermission,
  getScheduledReminderKeys,
  isReminderPlatformSupported,
  prepareReminderChannels,
  requestReminderPermission,
  scheduleReminder,
} from './notifications.web';

const reminder: PlannedReminder = {
  key: 'habit:habit-1:2026-10-12',
  date: '2026-10-12',
  time: '09:00',
  title: 'Salir a caminar',
  body: 'Es hora de caminar',
  channel: 'habits',
  target: {
    kind: 'habit',
    habitId: 'habit-1',
    date: '2026-10-12',
  },
};

describe('web reminder notifications', () => {
  it('reports reminders as unsupported and performs no operations', async () => {
    expect(isReminderPlatformSupported()).toBe(false);
    await expect(getReminderPermission()).resolves.toBe('unsupported');
    await expect(requestReminderPermission()).resolves.toBe('unsupported');
    await expect(prepareReminderChannels()).resolves.toBeUndefined();
    await expect(getScheduledReminderKeys()).resolves.toEqual([]);
    await expect(scheduleReminder(reminder)).resolves.toEqual({
      ok: true,
      value: undefined,
    });
    await expect(cancelReminders([reminder.key])).resolves.toBeUndefined();
    await expect(cancelAllReminders()).resolves.toBeUndefined();
    expect(addReminderTapListener(() => undefined)()).toBeUndefined();
  });
});
