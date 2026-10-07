import { describe, expect, it } from '@jest/globals';
import { daysBetween } from '../calendar-date';
import type { Habit, HabitMark, Task } from '../entities';
import type { ViewItem } from '../items';
import { describeDay, getPastPendingItems, groupByDay } from './past-pending';

const today = '2026-10-07';
const dailyRule = {
  validFrom: '2026-10-01',
  frequency: 'daily' as const,
  weekdays: [],
  intervalDays: null,
};

function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'read',
    name: 'Leer',
    categoryId: null,
    sectionId: null,
    startDate: '2026-10-01',
    timeOfDay: null,
    timeSlot: null,
    durationMinutes: null,
    archivedOn: null,
    ruleVersions: [dailyRule],
    ...overrides,
  };
}

function createDailyHabit(overrides: Partial<Habit> = {}): Habit {
  const habit = createHabit(overrides);
  const rule = { ...dailyRule, validFrom: habit.startDate };
  return { ...habit, ruleVersions: [rule] };
}

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'invoice',
    name: 'Factura',
    notes: null,
    categoryId: null,
    sectionId: null,
    dueDate: '2026-10-05',
    dueTime: null,
    status: 'pending',
    markedAt: null,
    archivedOn: null,
    ...overrides,
  };
}

function createMark(
  habitId: string,
  date: string,
  status: HabitMark['status'] = 'done',
): HabitMark {
  return { habitId, date, status, markedAt: `${date}T20:00:00Z` };
}

function getDates(items: ViewItem[]): (string | null)[] {
  return items.map((item) => item.date);
}

describe('getPastPendingItems', () => {
  it('lists unmarked past occurrences and skips marked ones', () => {
    const marks = [
      createMark('read', '2026-10-02'),
      createMark('read', '2026-10-04', 'not_done'),
    ];
    const items = getPastPendingItems({
      habits: [createHabit()],
      marks,
      tasks: [],
      today,
    });
    expect(getDates(items)).toEqual([
      '2026-10-06',
      '2026-10-05',
      '2026-10-03',
      '2026-10-01',
    ]);
    expect(items.every((item) => item.status === 'pending')).toBe(true);
  });

  it('never lists today or future days', () => {
    const items = getPastPendingItems({
      habits: [createDailyHabit({ startDate: '2026-10-07' })],
      marks: [],
      tasks: [],
      today,
    });
    expect(items).toEqual([]);
  });

  it('has no limit going back (RN-14)', () => {
    const habit = createHabit({
      startDate: '2020-01-01',
      ruleVersions: [{ ...dailyRule, validFrom: '2020-01-01' }],
    });
    const items = getPastPendingItems({
      habits: [habit],
      marks: [],
      tasks: [],
      today,
    });
    const oldestItem = items[items.length - 1];
    expect(oldestItem.date).toBe('2020-01-01');
    expect(items).toHaveLength(daysBetween('2020-01-01', today));
  });

  it('follows an every-N-days rule', () => {
    const habit = createHabit({
      ruleVersions: [
        { ...dailyRule, frequency: 'every_n_days', intervalDays: 3 },
      ],
    });
    const items = getPastPendingItems({
      habits: [habit],
      marks: [],
      tasks: [],
      today,
    });
    expect(getDates(items)).toEqual(['2026-10-04', '2026-10-01']);
  });

  it('respects a rule that changed in the past', () => {
    const habit = createHabit({
      ruleVersions: [
        {
          validFrom: '2026-10-01',
          frequency: 'weekdays',
          weekdays: [4],
          intervalDays: null,
        },
        { ...dailyRule, validFrom: '2026-10-05' },
      ],
    });
    const items = getPastPendingItems({
      habits: [habit],
      marks: [],
      tasks: [],
      today,
    });
    // El jueves 1 (regla semanal) y después todos los días desde el 5.
    expect(getDates(items)).toEqual(['2026-10-06', '2026-10-05', '2026-10-01']);
  });

  it('excludes archived habits', () => {
    const habit = createHabit({ archivedOn: '2026-10-04' });
    const items = getPastPendingItems({
      habits: [habit],
      marks: [],
      tasks: [],
      today,
    });
    expect(items).toEqual([]);
  });

  it('lists overdue pending tasks only', () => {
    const tasks = [
      createTask({ id: 'overdue' }),
      createTask({ id: 'today', dueDate: today }),
      createTask({ id: 'future', dueDate: '2026-10-09' }),
      createTask({ id: 'undated', dueDate: null }),
      createTask({ id: 'done', status: 'done' }),
      createTask({ id: 'not-done', status: 'not_done' }),
      createTask({ id: 'archived', archivedOn: '2026-10-06' }),
    ];
    const items = getPastPendingItems({
      habits: [],
      marks: [],
      tasks,
      today,
    });
    expect(items.map((item) => item.target)).toEqual([
      { kind: 'task', taskId: 'overdue' },
    ]);
  });

  it('orders newest day first and then by time within each day', () => {
    const morningHabit = createHabit({
      id: 'stretch',
      name: 'Estirar',
      startDate: '2026-10-05',
      timeOfDay: '08:00',
      ruleVersions: [{ ...dailyRule, validFrom: '2026-10-05' }],
    });
    const task = createTask({ dueDate: '2026-10-05', dueTime: '07:00' });
    const items = getPastPendingItems({
      habits: [morningHabit],
      marks: [],
      tasks: [task],
      today,
    });
    const names = items.map((item) => `${item.date} ${item.name}`);
    expect(names).toEqual([
      '2026-10-06 Estirar',
      '2026-10-05 Factura',
      '2026-10-05 Estirar',
    ]);
  });
});

describe('groupByDay', () => {
  it('groups by date, newest first, and orders each day', () => {
    const habit = createDailyHabit({ startDate: '2026-10-05' });
    const task = createTask({ dueDate: '2026-10-05', dueTime: '07:00' });
    const items = getPastPendingItems({
      habits: [habit],
      marks: [],
      tasks: [task],
      today,
    });
    const groups = groupByDay([...items].reverse());
    expect(groups.map((group) => group.date)).toEqual([
      '2026-10-06',
      '2026-10-05',
    ]);
    expect(groups[1].items.map((item) => item.name)).toEqual([
      'Factura',
      'Leer',
    ]);
  });

  it('ignores items without a date and returns nothing for an empty list', () => {
    const undatedTask = createTask({ dueDate: null });
    const undatedItem = getPastPendingItems({
      habits: [],
      marks: [],
      tasks: [undatedTask],
      today,
    });
    expect(groupByDay([])).toEqual([]);
    expect(undatedItem).toEqual([]);
    const forcedItem = {
      target: { kind: 'task', taskId: 'x' },
      name: 'x',
      status: 'pending',
      date: null,
      sortTime: null,
      categoryId: null,
      sectionId: null,
      markedAt: null,
    } as ViewItem;
    expect(groupByDay([forcedItem])).toEqual([]);
  });
});

describe('describeDay', () => {
  it('names yesterday and the day before', () => {
    expect(describeDay('2026-10-06', today)).toBe('Ayer');
    expect(describeDay('2026-10-05', today)).toBe('Anteayer');
  });

  it('writes weekday, day and month for older days', () => {
    expect(describeDay('2026-10-04', today)).toBe('Domingo, 4 de octubre');
    expect(describeDay('2026-09-28', today)).toBe('Lunes, 28 de septiembre');
  });

  it('adds the year when it is not the current one', () => {
    expect(describeDay('2025-12-31', today)).toBe(
      'Miércoles, 31 de diciembre de 2025',
    );
  });

  it('handles yesterday across a year boundary', () => {
    expect(describeDay('2025-12-31', '2026-01-01')).toBe('Ayer');
  });
});

describe('performance (RNF-01)', () => {
  it('handles 50 daily habits over a year with half the marks in under 300 ms', () => {
    const habits: Habit[] = [];
    const marks: HabitMark[] = [];
    for (let habitNumber = 0; habitNumber < 50; habitNumber += 1) {
      const habitId = `habit-${habitNumber}`;
      const rule = { ...dailyRule, validFrom: '2025-10-07' };
      habits.push(
        createHabit({
          id: habitId,
          startDate: '2025-10-07',
          ruleVersions: [rule],
        }),
      );
      for (let dayNumber = 0; dayNumber < 365; dayNumber += 2) {
        const date = new Date(Date.UTC(2025, 9, 7 + dayNumber));
        marks.push(createMark(habitId, date.toISOString().slice(0, 10)));
      }
    }
    const startedAt = performance.now();
    const items = getPastPendingItems({ habits, marks, tasks: [], today });
    const groups = groupByDay(items);
    const elapsed = performance.now() - startedAt;
    expect(items).toHaveLength(50 * 182);
    expect(groups).toHaveLength(182);
    expect(elapsed).toBeLessThan(300);
  });
});
