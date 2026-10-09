import { describe, expect, test } from '@jest/globals';
import type { Habit, HabitMark, Task } from './entities';
import {
  DEFAULT_REMINDER_SETTINGS,
  diffReminders,
  planReminders,
} from './reminders';
import type { ReminderSettings } from './reminder-types';

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    name: 'Entregar práctica',
    notes: null,
    categoryId: 'university',
    sectionId: null,
    dueDate: '2026-11-20',
    dueTime: null,
    status: 'pending',
    markedAt: null,
    archivedOn: null,
    ...overrides,
  };
}

function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Nadar',
    categoryId: null,
    sectionId: null,
    startDate: '2026-11-01',
    timeOfDay: '17:00',
    timeSlot: null,
    durationMinutes: null,
    archivedOn: null,
    ruleVersions: [
      {
        validFrom: '2026-11-01',
        frequency: 'weekdays',
        weekdays: [3],
        intervalDays: null,
      },
    ],
    ...overrides,
  };
}

function plan(
  overrides: {
    tasks?: Task[];
    habits?: Habit[];
    marks?: HabitMark[];
    now?: { date: string; time: string };
    settings?: ReminderSettings;
  } = {},
) {
  return planReminders({
    tasks: [],
    habits: [],
    marks: [],
    categoryNames: new Map([['university', 'Universidad']]),
    now: { date: '2026-11-16', time: '00:00' },
    settings: DEFAULT_REMINDER_SETTINGS,
    ...overrides,
  });
}

describe('task reminders', () => {
  test('describes a midnight crossing relative to the day of the reminder', () => {
    const reminders = plan({
      tasks: [createTask({ dueDate: '2026-11-17', dueTime: '00:30' })],
      settings: { ...DEFAULT_REMINDER_SETTINGS, taskLeads: [0] },
    });
    expect(reminders).toEqual([
      expect.objectContaining({
        date: '2026-11-16',
        time: '23:30',
        body: 'Universidad · Mañana a las 00:30',
      }),
    ]);
  });

  test('excludes the previous-day timed reminder once its moment has passed', () => {
    const reminders = plan({
      tasks: [createTask({ dueDate: '2026-11-17', dueTime: '00:30' })],
      settings: { ...DEFAULT_REMINDER_SETTINGS, taskLeads: [0] },
      now: { date: '2026-11-17', time: '00:00' },
    });
    expect(reminders).toEqual([]);
  });

  test('schedules the three leads with the category and relative wording', () => {
    const reminders = plan({ tasks: [createTask()] });
    expect(
      reminders.map(({ date, time, title, body, channel, target }) => ({
        date,
        time,
        title,
        body,
        channel,
        target,
      })),
    ).toEqual([
      {
        date: '2026-11-17',
        time: '09:00',
        title: 'Entregar práctica',
        body: 'Universidad · En 3 días, el viernes 20',
        channel: 'tasks',
        target: { kind: 'task', taskId: 'task-1' },
      },
      {
        date: '2026-11-19',
        time: '09:00',
        title: 'Entregar práctica',
        body: 'Universidad · Mañana',
        channel: 'tasks',
        target: { kind: 'task', taskId: 'task-1' },
      },
      {
        date: '2026-11-20',
        time: '09:00',
        title: 'Entregar práctica',
        body: 'Universidad · Hoy',
        channel: 'tasks',
        target: { kind: 'task', taskId: 'task-1' },
      },
    ]);
  });

  test('warns one hour before a timed task instead of at nine', () => {
    const reminders = plan({
      tasks: [createTask({ dueDate: '2026-11-16', dueTime: '23:59' })],
      now: { date: '2026-11-16', time: '12:00' },
    });
    expect(reminders).toHaveLength(1);
    expect(reminders[0]).toMatchObject({
      date: '2026-11-16',
      time: '22:59',
      body: 'Universidad · Hoy a las 23:59',
    });
  });

  test.each([
    { dueDate: null },
    { dueDate: '2026-11-15' },
    { dueDate: '2026-11-16' },
    { status: 'done' as const },
    { status: 'not_done' as const },
    { archivedOn: '2026-11-16' },
  ])('excludes past, undated, marked and archived tasks: %j', (overrides) => {
    expect(
      plan({
        tasks: [createTask(overrides)],
        now: { date: '2026-11-16', time: '10:00' },
      }),
    ).toEqual([]);
  });

  test('undo restores only future reminders and diff cancels resolved tasks', () => {
    const original = plan({ tasks: [createTask()] });
    const scheduledKeys = original.map((reminder) => reminder.key);
    const resolved = plan({ tasks: [createTask({ status: 'done' })] });
    expect(diffReminders(resolved, scheduledKeys)).toEqual({
      toCancel: scheduledKeys,
      toSchedule: [],
    });
    const restored = plan({
      tasks: [createTask()],
      now: { date: '2026-11-19', time: '10:00' },
    });
    expect(restored.map((reminder) => reminder.date)).toEqual(['2026-11-20']);
    expect(diffReminders(restored, [])).toEqual({
      toCancel: [],
      toSchedule: restored,
    });
  });

  test('rescheduling cancels old keys and schedules the new date', () => {
    const original = plan({ tasks: [createTask()] });
    const moved = plan({ tasks: [createTask({ dueDate: '2026-11-23' })] });
    const scheduledKeys = original.map((reminder) => reminder.key);
    expect(moved.map((reminder) => reminder.date)).toEqual([
      '2026-11-20',
      '2026-11-22',
    ]);
    expect(diffReminders(moved, scheduledKeys)).toEqual({
      toCancel: scheduledKeys,
      toSchedule: moved,
    });
  });
});

describe('habit reminders', () => {
  test('uses only Wednesdays and the exact time', () => {
    expect(plan({ habits: [createHabit()] })).toEqual([
      expect.objectContaining({
        date: '2026-11-18',
        time: '17:00',
        title: 'Nadar',
        body: 'Ahora, a las 17:00',
        channel: 'habits',
        target: { kind: 'habit', habitId: 'habit-1', date: '2026-11-18' },
      }),
    ]);
  });

  test.each([
    { timeSlot: 'morning' as const, time: '09:00' },
    { timeSlot: 'afternoon' as const, time: '15:00' },
    { timeSlot: 'night' as const, time: '21:00' },
  ])('enables the $timeSlot slot at $time', ({ timeSlot, time }) => {
    const habit = createHabit({
      timeOfDay: null,
      timeSlot,
      ruleVersions: [
        {
          validFrom: '2026-11-01',
          frequency: 'daily',
          weekdays: [],
          intervalDays: null,
        },
      ],
    });
    expect(plan({ habits: [habit] })).toEqual([]);
    const enabled = plan({
      habits: [habit],
      settings: { ...DEFAULT_REMINDER_SETTINGS, habitTimeSlots: true },
    });
    expect(enabled).toHaveLength(7);
    expect(enabled.map((reminder) => reminder.time)).toEqual(
      Array(7).fill(time),
    );
  });

  test.each(['done', 'not_done'] as const)(
    'skips only the %s occurrence',
    (status) => {
      const habit = createHabit({
        timeOfDay: '08:00',
        ruleVersions: [
          {
            validFrom: '2026-11-01',
            frequency: 'daily',
            weekdays: [],
            intervalDays: null,
          },
        ],
      });
      const marks: HabitMark[] = [
        {
          habitId: habit.id,
          date: '2026-11-16',
          status,
          markedAt: '2026-11-16T06:30:00Z',
        },
      ];
      const reminders = plan({
        habits: [habit],
        marks,
        now: { date: '2026-11-16', time: '07:30' },
      });
      expect(reminders.map((reminder) => reminder.date)).toEqual([
        '2026-11-17',
        '2026-11-18',
        '2026-11-19',
        '2026-11-20',
        '2026-11-21',
        '2026-11-22',
      ]);
    },
  );

  test('excludes archived habits and habits without a time', () => {
    expect(
      plan({
        habits: [
          createHabit({ archivedOn: '2026-11-16' }),
          createHabit({ timeOfDay: null }),
        ],
      }),
    ).toEqual([]);
  });

  test('notifies every three days on days one, four and seven', () => {
    const habit = createHabit({
      timeOfDay: '08:00',
      ruleVersions: [
        {
          validFrom: '2026-11-01',
          frequency: 'every_n_days',
          weekdays: [],
          intervalDays: 3,
        },
      ],
    });
    const reminders = plan({
      habits: [habit],
      now: { date: '2026-11-01', time: '00:00' },
    });
    expect(reminders.map((reminder) => [reminder.date, reminder.time])).toEqual(
      [
        ['2026-11-01', '08:00'],
        ['2026-11-04', '08:00'],
        ['2026-11-07', '08:00'],
      ],
    );
  });

  test('uses the rule version valid on each day in the window', () => {
    const habit = createHabit({
      ruleVersions: [
        {
          validFrom: '2026-11-01',
          frequency: 'daily',
          weekdays: [],
          intervalDays: null,
        },
        {
          validFrom: '2026-11-18',
          frequency: 'weekdays',
          weekdays: [5],
          intervalDays: null,
        },
      ],
    });
    const reminders = plan({ habits: [habit] });
    const dates = reminders.map((reminder) => reminder.date);
    expect(dates).toEqual(['2026-11-16', '2026-11-17', '2026-11-20']);
  });

  test.each(['2026-03-08', '2026-03-29', '2026-10-25', '2026-11-01'])(
    'keeps one local nine oclock reminder on clock change %s',
    (date) => {
      const habit = createHabit({
        startDate: '2026-01-01',
        timeOfDay: '09:00',
        ruleVersions: [
          {
            validFrom: '2026-01-01',
            frequency: 'daily',
            weekdays: [],
            intervalDays: null,
          },
        ],
      });
      const reminders = plan({ habits: [habit], now: { date, time: '00:00' } });
      expect(reminders).toHaveLength(7);
      expect(reminders.filter((reminder) => reminder.date === date)).toEqual([
        expect.objectContaining({ date, time: '09:00' }),
      ]);
      const dates = reminders.map((reminder) => reminder.date);
      const uniqueDates = new Set(dates);
      expect(uniqueDates.size).toBe(7);
    },
  );
});

describe('planning and synchronization', () => {
  test('includes the current minute and the seventh date, excluding the eighth', () => {
    const tasks = [
      createTask({ id: 'now', dueDate: '2026-11-16' }),
      createTask({ id: 'last', dueDate: '2026-11-22' }),
      createTask({ id: 'outside', dueDate: '2026-11-23' }),
    ];
    const reminders = plan({
      tasks,
      settings: { ...DEFAULT_REMINDER_SETTINGS, taskLeads: [0] },
      now: { date: '2026-11-16', time: '09:00' },
    });
    expect(reminders.map((reminder) => reminder.date)).toEqual([
      '2026-11-16',
      '2026-11-22',
    ]);
  });

  test('includes a midnight reminder for a task just beyond the window', () => {
    const reminders = plan({
      tasks: [createTask({ dueDate: '2026-11-23', dueTime: '00:30' })],
      settings: { ...DEFAULT_REMINDER_SETTINGS, taskLeads: [0] },
    });
    expect(reminders).toEqual([
      expect.objectContaining({ date: '2026-11-22', time: '23:30' }),
    ]);
  });

  test('disabling settings cancels everything', () => {
    const original = plan({ tasks: [createTask()], habits: [createHabit()] });
    const disabled = plan({
      tasks: [createTask()],
      habits: [createHabit()],
      settings: { ...DEFAULT_REMINDER_SETTINGS, enabled: false },
    });
    const scheduledKeys = original.map((reminder) => reminder.key);
    expect(disabled).toEqual([]);
    expect(diffReminders(disabled, scheduledKeys).toCancel).toEqual(
      scheduledKeys,
    );
  });

  test('retains the 64 earliest reminders regardless of input order', () => {
    const tasks = Array.from({ length: 100 }, (unusedValue, index) =>
      createTask({
        id: `task-${index}`,
        dueDate: '2026-11-16',
        dueTime: index < 64 ? '20:00' : '10:00',
      }),
    );
    const reminders = plan({ tasks });
    expect(reminders).toHaveLength(64);
    const earlierReminders = reminders.slice(0, 36);
    const earlierTimes = earlierReminders.map((reminder) => reminder.time);
    expect(earlierTimes).toEqual(Array(36).fill('09:00'));
    const laterReminders = reminders.slice(36);
    const laterTimes = laterReminders.map((reminder) => reminder.time);
    expect(laterTimes).toEqual(Array(28).fill('19:00'));
  });

  test('is idempotent and ignores ordering of tasks and scheduled keys', () => {
    const tasks = [createTask(), createTask({ id: 'task-2' })];
    const original = plan({ tasks });
    const reversed = plan({ tasks: [...tasks].reverse() });
    expect(reversed).toEqual(original);
    const scheduledKeys = original.map((reminder) => reminder.key);
    scheduledKeys.reverse();
    expect(diffReminders(reversed, scheduledKeys)).toEqual({
      toCancel: [],
      toSchedule: [],
    });
  });

  test.each([{ name: 'Nueva práctica' }, { categoryId: null }])(
    'replaces keys when content changes: %j',
    (overrides) => {
      const original = plan({ tasks: [createTask()] });
      const changed = plan({ tasks: [createTask(overrides)] });
      const scheduledKeys = original.map((reminder) => reminder.key);
      expect(diffReminders(changed, scheduledKeys)).toEqual({
        toCancel: scheduledKeys,
        toSchedule: changed,
      });
      expect(original[0].key).toMatch(/^task:task-1:2026-11-20:3:/);
    },
  );

  test('replaces the timed reminder while keeping unchanged advance reminders', () => {
    const original = plan({ tasks: [createTask()] });
    const changed = plan({ tasks: [createTask({ dueTime: '23:59' })] });
    const scheduledKeys = original.map((reminder) => reminder.key);
    expect(diffReminders(changed, scheduledKeys)).toEqual({
      toCancel: [original[2].key],
      toSchedule: [changed[2]],
    });
    expect(changed[2].key).not.toBe(original[2].key);
  });

  test('replaces habit keys when name or time changes', () => {
    const original = plan({ habits: [createHabit()] });
    for (const overrides of [{ name: 'Natación' }, { timeOfDay: '18:00' }]) {
      const changed = plan({ habits: [createHabit(overrides)] });
      expect(changed[0].key).not.toBe(original[0].key);
      expect(changed[0].key).toMatch(/^habit:habit-1:2026-11-18:/);
    }
  });

  test('uses selected leads including seven days and avoids duplicate leads', () => {
    const reminders = plan({
      tasks: [createTask({ dueDate: '2026-11-23' })],
      settings: { ...DEFAULT_REMINDER_SETTINGS, taskLeads: [7, 7] },
    });
    expect(reminders).toHaveLength(1);
    expect(reminders[0]).toMatchObject({
      date: '2026-11-16',
      time: '09:00',
      body: 'Universidad · En 7 días, el lunes 23',
    });
  });
});
