import { describe, expect, it } from '@jest/globals';
import {
  buildHistoryGrid,
  getHistoryItems,
  validateHistoryRange,
} from './history';
import type { Habit, Task, HabitMark } from '../entities';

const habit: Habit = {
  id: 'swim',
  name: 'Nadar',
  categoryId: null,
  sectionId: null,
  startDate: '2026-10-01',
  timeOfDay: '08:00',
  timeSlot: null,
  durationMinutes: null,
  archivedOn: null,
  ruleVersions: [
    {
      validFrom: '2026-10-01',
      frequency: 'daily',
      weekdays: [],
      intervalDays: null,
    },
  ],
};
const task: Task = {
  id: 'milk',
  name: 'Leche',
  notes: null,
  categoryId: null,
  sectionId: null,
  dueDate: null,
  dueTime: null,
  status: 'done',
  markedAt: '2026-10-05T22:00:00Z',
  archivedOn: null,
};
function grid(
  habits: Habit[] = [],
  tasks: Task[] = [],
  marks: HabitMark[] = [],
) {
  const items = getHistoryItems({
    habits,
    tasks,
    marks,
    fromDate: '2026-10-04',
    toDate: '2026-10-07',
  });
  return buildHistoryGrid(
    items,
    '2026-10-04',
    '2026-10-07',
    '2026-10-07',
    'Europe/Madrid',
  );
}

describe('history range', () => {
  it.each([
    ['2026-10-07', '2026-10-07', null],
    ['2025-10-07', '2026-10-07', null],
    ['2025-10-06', '2026-10-07', 'too_long'],
    ['2026-10-07', '2026-10-06', 'end_before_start'],
    ['2026-10-01', '2026-10-08', 'end_after_today'],
  ])('validates %s through %s', (fromDate, toDate, expected) => {
    expect(validateHistoryRange(fromDate, toDate, '2026-10-07')).toBe(expected);
  });
});
describe('history grid', () => {
  it('distinguishes today pending, past unmarked, done and not done', () => {
    const marks: HabitMark[] = [
      {
        habitId: 'swim',
        date: '2026-10-05',
        status: 'done',
        markedAt: '2026-10-05T09:00:00Z',
      },
      {
        habitId: 'swim',
        date: '2026-10-04',
        status: 'not_done',
        markedAt: '2026-10-04T09:00:00Z',
      },
    ];
    expect(grid([habit], [], marks)).toEqual({
      days: ['2026-10-07', '2026-10-06', '2026-10-05', '2026-10-04'],
      rows: [
        {
          key: 'habit:swim',
          name: 'Nadar',
          kind: 'habit',
          categoryId: null,
          cells: ['pending', 'unmarked', 'done', 'not_done'],
        },
      ],
      dayPercentages: [0, 0, 100, 0],
    });
  });
  it('preserves marks outside the rule and after archiving without duplicates', () => {
    const archived = { ...habit, archivedOn: '2026-10-05' };
    const marks: HabitMark[] = [
      {
        habitId: 'swim',
        date: '2026-10-04',
        status: 'done',
        markedAt: '2026-10-04T09:00:00Z',
      },
      {
        habitId: 'swim',
        date: '2026-10-06',
        status: 'not_done',
        markedAt: '2026-10-06T09:00:00Z',
      },
      {
        habitId: 'swim',
        date: '2026-10-08',
        status: 'done',
        markedAt: '2026-10-08T09:00:00Z',
      },
    ];
    expect(grid([archived], [], marks).rows[0].cells).toEqual([
      'empty',
      'not_done',
      'empty',
      'done',
    ]);
    expect(grid([{ ...habit, archivedOn: '2026-10-03' }]).rows).toEqual([]);
    expect(
      grid([{ ...habit, archivedOn: '2026-10-08' }]).rows[0].cells,
    ).toEqual(['pending', 'unmarked', 'unmarked', 'unmarked']);
  });
  it('uses the rule version valid each day and retains an old-rule mark', () => {
    const changed: Habit = {
      ...habit,
      ruleVersions: [
        ...habit.ruleVersions,
        {
          validFrom: '2026-10-05',
          frequency: 'weekdays',
          weekdays: [1],
          intervalDays: null,
        },
      ],
    };
    const marks: HabitMark[] = [
      {
        habitId: 'swim',
        date: '2026-10-06',
        status: 'done',
        markedAt: '2026-10-06T09:00:00Z',
      },
    ];
    expect(grid([changed], [], marks).rows[0].cells).toEqual([
      'empty',
      'done',
      'unmarked',
      'unmarked',
    ]);
  });
  it.each([
    ['2026-10-05T21:59:59Z', ['empty', 'empty', 'done', 'empty']],
    ['2026-10-05T22:00:00Z', ['empty', 'done', 'empty', 'empty']],
    ['2026-10-03T22:00:00Z', ['empty', 'empty', 'empty', 'done']],
    ['2026-10-07T22:00:00Z', null],
    ['2026-10-03T21:59:59Z', null],
  ])('places an undated mark at Madrid midnight %s', (markedAt, cells) => {
    const result = grid([], [{ ...task, markedAt }]);
    if (cells === null) {
      expect(result.rows).toEqual([]);
      return;
    }
    expect(result.rows[0].cells).toEqual(cells);
  });
  it('places dated tasks by due date and excludes archived pending and undated pending tasks', () => {
    const tasks: Task[] = [
      { ...task, dueDate: '2026-10-04', archivedOn: '2026-10-05' },
      { ...task, id: 'pending', status: 'pending', markedAt: null },
      {
        ...task,
        id: 'archived',
        dueDate: '2026-10-06',
        status: 'pending',
        markedAt: null,
        archivedOn: '2026-10-07',
      },
      { ...task, id: 'outside', dueDate: '2026-10-08' },
    ];
    expect(grid([], tasks).rows).toHaveLength(1);
    expect(grid([], tasks).rows[0].cells).toEqual([
      'empty',
      'empty',
      'empty',
      'done',
    ]);
  });
  it('counts every applicable cell in rounded percentages and uses null for no activity', () => {
    const tasks: Task[] = [task, { ...task, id: 'second', status: 'not_done' }];
    expect(grid([habit], tasks).dayPercentages).toEqual([0, 33, 0, 0]);
    expect(grid().dayPercentages).toEqual([null, null, null, null]);
  });
  it('orders habits by time then name, followed by tasks newest first then name', () => {
    const habits = [
      { ...habit, id: 'late', name: 'Zeta', timeOfDay: '09:00' },
      { ...habit, id: 'no-time', name: 'Alfa', timeOfDay: null },
      { ...habit, id: 'early', name: 'Alfa' },
      habit,
    ];
    const tasks = [
      { ...task, id: 'old', dueDate: '2026-10-04' },
      { ...task, id: 'new', dueDate: '2026-10-07' },
      { ...task, id: 'alphabetical', name: 'Agua', dueDate: '2026-10-07' },
      task,
    ];
    expect(grid(habits, tasks).rows.map((row) => row.key)).toEqual([
      'habit:early',
      'habit:swim',
      'habit:late',
      'habit:no-time',
      'task:alphabetical',
      'task:new',
      'task:milk',
      'task:old',
    ]);
  });
  it('builds one day and a full 366 day grid', () => {
    expect(
      buildHistoryGrid([], '2026-10-07', '2026-10-07', '2026-10-07', 'UTC')
        .days,
    ).toEqual(['2026-10-07']);
    const result = buildHistoryGrid(
      [],
      '2025-10-07',
      '2026-10-07',
      '2026-10-07',
      'UTC',
    );
    expect(result.days).toHaveLength(366);
    expect(result.days[365]).toBe('2025-10-07');
  });
});

it('uses a time slot for marks on days outside the recurrence rule', () => {
  const slotted: Habit = {
    ...habit,
    id: 'slot',
    timeOfDay: null,
    timeSlot: 'morning',
    archivedOn: '2026-10-03',
  };
  const marks: HabitMark[] = [
    {
      habitId: 'slot',
      date: '2026-10-07',
      status: 'done',
      markedAt: '2026-10-07T10:00:00Z',
    },
  ];
  const items = getHistoryItems({
    habits: [slotted],
    tasks: [],
    marks,
    fromDate: '2026-10-07',
    toDate: '2026-10-07',
  });
  expect(items[0].sortTime).toBe('09:00');
});
