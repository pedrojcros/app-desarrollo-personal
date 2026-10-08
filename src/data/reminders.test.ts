import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { Task, Habit } from '../domain/entities';
import { DEFAULT_REMINDER_SETTINGS } from '../domain/reminder-types';
import * as platform from '../platform/notifications';
import { fetchReminderData } from './reminders-read';
import { loadReminderSettings } from './reminder-settings';
import { cancelReminderSync, syncReminders } from './reminders';
import { fail, succeed } from './result';

jest.mock('../platform/notifications');
jest.mock('expo-notifications', () => ({ setNotificationHandler: jest.fn() }));
jest.mock('./reminders-read', () => ({ fetchReminderData: jest.fn() }));
jest.mock('./reminder-settings');

const task: Task = {
  id: 'task-one',
  name: 'Practice',
  notes: null,
  categoryId: null,
  sectionId: null,
  dueDate: '2026-10-10',
  dueTime: null,
  status: 'pending',
  markedAt: null,
  archivedOn: null,
};
const habit: Habit = {
  id: 'habit-one',
  name: 'Swim',
  categoryId: null,
  sectionId: null,
  startDate: '2026-01-01',
  timeOfDay: '08:00',
  timeSlot: null,
  durationMinutes: 15,
  archivedOn: null,
  ruleVersions: [
    {
      validFrom: '2026-01-01',
      frequency: 'daily',
      weekdays: [],
      intervalDays: null,
    },
  ],
};
let tasks: Task[];
let habits: Habit[];
let marks: {
  habitId: string;
  date: string;
  status: 'done';
  markedAt: string;
}[];
let scheduled: Map<string, import('../domain/reminder-types').PlannedReminder>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 8, 7, 30));
  tasks = [task];
  habits = [];
  marks = [];
  scheduled = new Map();
  jest.mocked(platform.isReminderPlatformSupported).mockReturnValue(true);
  jest.mocked(platform.getReminderPermission).mockResolvedValue('granted');
  jest
    .mocked(loadReminderSettings)
    .mockResolvedValue(DEFAULT_REMINDER_SETTINGS);
  jest
    .mocked(fetchReminderData)
    .mockImplementation(async () =>
      succeed({ tasks, habits, marks, categoryNames: new Map() }),
    );
  jest
    .mocked(platform.getScheduledReminderKeys)
    .mockImplementation(async () => [...scheduled.keys()]);
  jest
    .mocked(platform.scheduleReminder)
    .mockImplementation(async (reminder) => {
      scheduled.set(reminder.key, reminder);
      return succeed(undefined);
    });
  jest.mocked(platform.cancelReminders).mockImplementation(async (keys) => {
    for (const key of keys) {
      scheduled.delete(key);
    }
  });
  jest.mocked(platform.cancelAllReminders).mockImplementation(async () => {
    scheduled.clear();
  });
});
afterEach(() => {
  jest.useRealTimers();
});

function moments() {
  return [...scheduled.values()].map(
    (reminder) => `${reminder.date} ${reminder.time}`,
  );
}

describe('Reminder synchronization', () => {
  it('cancels a marked task and restores future reminders after undo', async () => {
    await syncReminders();
    expect(moments()).toEqual(['2026-10-09 09:00', '2026-10-10 09:00']);
    tasks = [{ ...task, status: 'done' }];
    await syncReminders();
    expect(moments()).toEqual([]);
    tasks = [task];
    await syncReminders();
    expect(moments()).toEqual(['2026-10-09 09:00', '2026-10-10 09:00']);
  });
  it('skips only the marked occurrence and cancels archived habits', async () => {
    tasks = [];
    habits = [habit];
    await syncReminders();
    expect(moments()).toHaveLength(7);
    marks = [
      {
        habitId: habit.id,
        date: '2026-10-08',
        status: 'done',
        markedAt: '2026-10-08T05:30:00Z',
      },
    ];
    await syncReminders();
    expect(moments()).not.toContain('2026-10-08 08:00');
    expect(moments()).toContain('2026-10-09 08:00');
    habits = [{ ...habit, archivedOn: '2026-10-08' }];
    await syncReminders();
    expect(moments()).toEqual([]);
  });
  it('replaces reminders when a task date changes', async () => {
    await syncReminders();
    tasks = [{ ...task, dueDate: '2026-10-13' }];
    await syncReminders();
    expect(moments()).toEqual([
      '2026-10-10 09:00',
      '2026-10-12 09:00',
      '2026-10-13 09:00',
    ]);
  });
  it('preserves scheduled notifications when reading fails', async () => {
    await syncReminders();
    jest
      .mocked(fetchReminderData)
      .mockResolvedValue(fail('network_error', 'Offline'));
    const result = await syncReminders();
    expect(result.ok).toBe(false);
    expect(moments()).toHaveLength(2);
  });
  it.each(['denied', 'unsupported'] as const)(
    'does nothing with %s permission',
    async (permission) => {
      await syncReminders();
      jest.mocked(platform.getReminderPermission).mockResolvedValue(permission);
      tasks = [];
      await syncReminders();
      expect(moments()).toHaveLength(2);
    },
  );
  it('cancels everything when disabled, even offline', async () => {
    await syncReminders();
    jest
      .mocked(loadReminderSettings)
      .mockResolvedValue({ ...DEFAULT_REMINDER_SETTINGS, enabled: false });
    jest
      .mocked(fetchReminderData)
      .mockResolvedValue(fail('network_error', 'Offline'));
    await syncReminders();
    expect(moments()).toEqual([]);
  });
  it('never schedules the same key twice, including concurrent calls', async () => {
    await Promise.all([syncReminders(), syncReminders(), syncReminders()]);
    expect(moments()).toHaveLength(2);
    expect(platform.scheduleReminder).toHaveBeenCalledTimes(2);
  });
  it('reports scheduling failures for the next lifecycle retry', async () => {
    jest
      .mocked(platform.scheduleReminder)
      .mockResolvedValue(fail('SCHEDULE_FAILED', 'Unavailable'));
    expect(await syncReminders()).toMatchObject({
      ok: false,
      error: { code: 'SCHEDULE_FAILED' },
    });
  });
});

it('cancels an in-flight schedule before sign-out cancellation finishes', async () => {
  let releaseSchedule: (() => void) | undefined;
  jest
    .mocked(platform.scheduleReminder)
    .mockImplementation(async (reminder) => {
      await new Promise<void>((resolve) => {
        releaseSchedule = resolve;
      });
      scheduled.set(reminder.key, reminder);
      return succeed(undefined);
    });
  const syncing = syncReminders();
  for (let index = 0; index < 30; index += 1) {
    await Promise.resolve();
  }
  expect(releaseSchedule).toBeDefined();
  const closing = cancelReminderSync();
  releaseSchedule?.();
  await Promise.all([syncing, closing]);
  expect(moments()).toEqual([]);
});

it('does not read or modify reminders on an unsupported platform', async () => {
  jest.mocked(platform.isReminderPlatformSupported).mockReturnValue(false);
  await syncReminders();
  expect(fetchReminderData).not.toHaveBeenCalled();
  expect(platform.cancelAllReminders).not.toHaveBeenCalled();
  expect(platform.scheduleReminder).not.toHaveBeenCalled();
});

it('keeps existing reminders when listing scheduled notifications fails', async () => {
  await syncReminders();
  tasks = [];
  jest
    .mocked(platform.getScheduledReminderKeys)
    .mockRejectedValueOnce(new Error('Unavailable'));
  expect(await syncReminders()).toMatchObject({ ok: false });
  expect(moments()).toHaveLength(2);
});

it('does not schedule an elapsed minute when opening the app seconds after its reminder time', async () => {
  jest.setSystemTime(new Date(2026, 9, 8, 8, 0, 30));
  tasks = [];
  habits = [habit];
  await syncReminders();
  expect(moments()).not.toContain('2026-10-08 08:00');
  expect(moments()).toContain('2026-10-09 08:00');
});
