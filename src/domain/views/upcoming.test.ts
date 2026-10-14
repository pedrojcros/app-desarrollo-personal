import { describe, expect, it } from '@jest/globals';

import type { Habit, HabitMark, Task } from '../entities';
import type { ViewItem } from '../items';
import {
  formatWeekTitle,
  getUpcomingRange,
  getUpcomingWeeks,
} from './upcoming';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit',
    name: 'Nadar',
    categoryId: null,
    sectionId: null,
    startDate: '2026-09-01',
    timeOfDay: null,
    timeSlot: null,
    durationMinutes: null,
    ruleVersions: [
      {
        validFrom: '2026-09-01',
        frequency: 'weekdays',
        weekdays: [3],
        intervalDays: null,
      },
    ],
    archivedOn: null,
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task',
    name: 'Entregar la práctica',
    notes: null,
    categoryId: null,
    sectionId: null,
    dueDate: '2026-10-19',
    dueTime: null,
    status: 'pending',
    markedAt: null,
    archivedOn: null,
    ...overrides,
  };
}

function getWeeks(input: {
  habits?: Habit[];
  marks?: HabitMark[];
  tasks?: Task[];
  today: string;
}) {
  return getUpcomingWeeks({
    habits: input.habits ?? [],
    marks: input.marks ?? [],
    tasks: input.tasks ?? [],
    today: input.today,
  });
}

function allItems(weeks: ReturnType<typeof getUpcomingWeeks>): ViewItem[] {
  const days = weeks.flatMap((week) => week.days);
  return days.flatMap((day) => day.items);
}

describe('getUpcomingRange', () => {
  it('starts tomorrow and ends on the Sunday four weeks after this week', () => {
    expect(getUpcomingRange('2026-10-14')).toEqual({
      from: '2026-10-15',
      to: '2026-11-15',
    });
  });

  it('starts the next week when today is Sunday', () => {
    expect(getUpcomingRange('2026-10-18')).toEqual({
      from: '2026-10-19',
      to: '2026-11-15',
    });
  });

  it('keeps a partial current week when today is Monday', () => {
    expect(getUpcomingRange('2026-10-12')).toEqual({
      from: '2026-10-13',
      to: '2026-11-15',
    });
  });
});

describe('getUpcomingWeeks', () => {
  it('shows the CU-03 scenario 11 items and omits daily habits', () => {
    const dailyHabit = makeHabit({
      id: 'daily',
      name: 'Lavarme los dientes',
      ruleVersions: [
        {
          validFrom: '2026-09-01',
          frequency: 'daily',
          weekdays: [],
          intervalDays: null,
        },
      ],
    });
    const weeks = getWeeks({
      today: '2026-10-14',
      habits: [makeHabit(), dailyHabit],
      tasks: [makeTask()],
    });

    expect(weeks).toHaveLength(5);
    expect(weeks[0].weekStart).toBe('2026-10-12');
    expect(weeks[0].days).toEqual([]);
    expect(allItems(weeks).map((item) => [item.name, item.date])).toEqual([
      ['Entregar la práctica', '2026-10-19'],
      ['Nadar', '2026-10-21'],
      ['Nadar', '2026-10-28'],
      ['Nadar', '2026-11-04'],
      ['Nadar', '2026-11-11'],
    ]);
  });

  it('omits the current week when today is Sunday', () => {
    const weeks = getWeeks({ today: '2026-10-18' });

    expect(weeks).toHaveLength(4);
    expect(weeks[0]).toEqual({
      weekStart: '2026-10-19',
      isCurrentWeek: false,
      days: [],
    });
  });

  it('includes all remaining days of the current week when today is Monday', () => {
    const weeks = getWeeks({ today: '2026-10-12' });

    expect(weeks[0]).toEqual({
      weekStart: '2026-10-12',
      isCurrentWeek: true,
      days: [],
    });
  });

  it('uses calendar dates across the daylight saving change', () => {
    const weeks = getWeeks({
      today: '2026-10-20',
      tasks: [makeTask({ dueDate: '2026-10-22' })],
    });

    expect(allItems(weeks).map((item) => item.date)).toEqual(['2026-10-22']);
    expect(weeks.map((week) => week.weekStart)).toEqual([
      '2026-10-19',
      '2026-10-26',
      '2026-11-02',
      '2026-11-09',
      '2026-11-16',
    ]);
  });

  it('uses the rule in force on each date when a habit stops being daily', () => {
    const changingHabit = makeHabit({
      ruleVersions: [
        {
          validFrom: '2026-09-01',
          frequency: 'daily',
          weekdays: [],
          intervalDays: null,
        },
        {
          validFrom: '2026-10-20',
          frequency: 'weekdays',
          weekdays: [2],
          intervalDays: null,
        },
      ],
    });

    const weeks = getWeeks({ today: '2026-10-18', habits: [changingHabit] });

    expect(allItems(weeks).map((item) => item.date)).toEqual([
      '2026-10-20',
      '2026-10-27',
      '2026-11-03',
      '2026-11-10',
    ]);
  });

  it('omits weekday rules containing all seven weekdays', () => {
    const everyWeekday = makeHabit({
      ruleVersions: [
        {
          validFrom: '2026-09-01',
          frequency: 'weekdays',
          weekdays: [1, 2, 3, 4, 5, 6, 7],
          intervalDays: null,
        },
      ],
    });

    expect(
      allItems(getWeeks({ today: '2026-10-14', habits: [everyWeekday] })),
    ).toEqual([]);
  });

  it('omits every one day rules and keeps other interval and monthly rules', () => {
    const everyDayByInterval = makeHabit({
      id: 'interval-daily',
      name: 'Cada día',
      ruleVersions: [
        {
          validFrom: '2026-09-01',
          frequency: 'every_n_days',
          weekdays: [],
          intervalDays: 1,
        },
      ],
    });
    const everyOtherDay = makeHabit({
      id: 'every-other-day',
      name: 'Cada dos días',
      ruleVersions: [
        {
          validFrom: '2026-09-01',
          frequency: 'every_n_days',
          weekdays: [],
          intervalDays: 2,
        },
      ],
    });
    const monthly = makeHabit({
      id: 'monthly',
      name: 'Mensual',
      startDate: '2026-10-01',
      ruleVersions: [
        {
          validFrom: '2026-10-01',
          frequency: 'monthly',
          weekdays: [],
          intervalDays: null,
        },
      ],
    });

    const items = allItems(
      getWeeks({
        today: '2026-10-14',
        habits: [everyDayByInterval, everyOtherDay, monthly],
      }),
    );

    expect(items.some((item) => item.name === 'Cada día')).toBe(false);
    expect(items.some((item) => item.name === 'Cada dos días')).toBe(true);
    expect(items.map((item) => item.date)).toContain('2026-10-31');
  });

  it('omits completed and archived tasks', () => {
    const doneTask = makeTask({ id: 'done', status: 'done' });
    const archivedTask = makeTask({ id: 'archived', archivedOn: '2026-10-01' });

    expect(
      allItems(
        getWeeks({ today: '2026-10-14', tasks: [doneTask, archivedTask] }),
      ),
    ).toEqual([]);
  });

  it('omits archived habits, undated tasks and tasks outside the range', () => {
    const archivedHabit = makeHabit({ archivedOn: '2026-10-20' });
    const undatedTask = makeTask({ dueDate: null });
    const overdueTask = makeTask({ dueDate: '2026-10-14' });
    const lateTask = makeTask({ dueDate: '2026-11-16' });

    expect(
      allItems(
        getWeeks({
          today: '2026-10-14',
          habits: [archivedHabit],
          tasks: [undatedTask, overdueTask, lateTask],
        }),
      ),
    ).toEqual([]);
  });

  it('sorts items within a day and keeps weeks with no items', () => {
    const firstTask = makeTask({ id: 'late', name: 'Tarde', dueTime: '18:00' });
    const secondTask = makeTask({
      id: 'early',
      name: 'Temprano',
      dueTime: '08:00',
    });
    const weeks = getWeeks({
      today: '2026-10-14',
      tasks: [firstTask, secondTask],
    });

    expect(weeks[1].days[0].items.map((item) => item.name)).toEqual([
      'Temprano',
      'Tarde',
    ]);
    expect(weeks.slice(2).every((week) => week.days.length === 0)).toBe(true);
  });
});

describe('formatWeekTitle', () => {
  it('formats a week that crosses a month boundary', () => {
    expect(
      formatWeekTitle({
        weekStart: '2026-10-26',
        isCurrentWeek: false,
        days: [],
      }),
    ).toBe('Semana del 26 de octubre al 1 de noviembre');
  });

  it('uses the current week title', () => {
    expect(
      formatWeekTitle({
        weekStart: '2026-10-12',
        isCurrentWeek: true,
        days: [],
      }),
    ).toBe('Esta semana');
  });

  it('formats a week within one month', () => {
    expect(
      formatWeekTitle({
        weekStart: '2026-10-19',
        isCurrentWeek: false,
        days: [],
      }),
    ).toBe('Semana del 19 al 25 de octubre');
  });
});
