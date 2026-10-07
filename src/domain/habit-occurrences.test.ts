import { describe, expect, it } from '@jest/globals';
import {
  toHabitSchedule,
  type Habit,
  type HabitMark,
  type Task,
} from './entities';
import {
  getHabitOccurrences,
  getOccurrenceStatus,
  indexMarks,
  occurrenceToViewItem,
  taskToViewItem,
} from './habit-occurrences';

const habit: Habit = {
  id: 'habit',
  name: 'Leer',
  categoryId: 'category',
  sectionId: 'section',
  startDate: '2026-01-01',
  timeOfDay: null,
  timeSlot: 'night',
  durationMinutes: 30,
  ruleVersions: [
    {
      validFrom: '2026-01-01',
      frequency: 'daily',
      weekdays: [],
      intervalDays: null,
    },
  ],
  archivedOn: null,
};
const marks: HabitMark[] = [
  {
    habitId: 'habit',
    date: '2026-10-07',
    status: 'not_done',
    markedAt: '2026-10-07T20:00:00Z',
  },
];

describe('Habit occurrences', () => {
  it('keeps the complete schedule for the recurrence engine', () => {
    expect(toHabitSchedule(habit)).toEqual({
      habitId: 'habit',
      startDate: '2026-01-01',
      timeOfDay: null,
      timeSlot: 'night',
      ruleVersions: habit.ruleVersions,
    });
  });
  it.each([
    [
      null,
      '2026-10-06',
      '2026-10-08',
      ['2026-10-06', '2026-10-07', '2026-10-08'],
    ],
    ['2026-10-07', '2026-10-07', '2026-10-07', []],
    ['2026-10-07', '2026-10-06', '2026-10-06', ['2026-10-06']],
    ['2026-10-07', '2026-10-06', '2026-10-08', ['2026-10-06']],
    ['2025-12-31', '2026-10-06', '2026-10-08', []],
    [null, '2026-10-08', '2026-10-06', []],
  ])(
    'excludes archive day %s in range %s to %s',
    (archivedOn, fromDate, toDate, expected) => {
      const occurrences = getHabitOccurrences(
        { ...habit, archivedOn },
        fromDate,
        toDate,
      );
      expect(occurrences.map((occurrence) => occurrence.date)).toEqual(
        expected,
      );
    },
  );
  it('delegates versioned rules and slot times to the existing engine', () => {
    const changed: Habit = {
      ...habit,
      ruleVersions: [
        ...habit.ruleVersions,
        {
          validFrom: '2026-10-07',
          frequency: 'every_n_days',
          weekdays: [],
          intervalDays: 2,
        },
      ],
    };
    expect(getHabitOccurrences(changed, '2026-10-06', '2026-10-09')).toEqual([
      { habitId: 'habit', date: '2026-10-06', sortTime: '21:00' },
      { habitId: 'habit', date: '2026-10-07', sortTime: '21:00' },
      { habitId: 'habit', date: '2026-10-09', sortTime: '21:00' },
    ]);
  });
  it('finds only the matching habit and date, with pending as default', () => {
    expect(getOccurrenceStatus(marks, 'habit', '2026-10-07')).toEqual({
      status: 'not_done',
      markedAt: '2026-10-07T20:00:00Z',
    });
    expect(getOccurrenceStatus(marks, 'other', '2026-10-07')).toEqual({
      status: 'pending',
      markedAt: null,
    });
    expect(getOccurrenceStatus(marks, 'habit', '2026-10-08')).toEqual({
      status: 'pending',
      markedAt: null,
    });
    expect(getOccurrenceStatus([], 'habit', '2026-10-07')).toEqual({
      status: 'pending',
      markedAt: null,
    });
  });
  it('converts occurrences consistently, including marks after archival', () => {
    const occurrence = {
      habitId: 'habit',
      date: '2026-10-07',
      sortTime: '21:00',
    };
    expect(
      occurrenceToViewItem(
        { ...habit, archivedOn: '2026-10-01' },
        occurrence,
        marks,
      ),
    ).toEqual({
      target: { kind: 'occurrence', habitId: 'habit', date: '2026-10-07' },
      name: 'Leer',
      status: 'not_done',
      markedAt: '2026-10-07T20:00:00Z',
      date: '2026-10-07',
      sortTime: '21:00',
      categoryId: 'category',
      sectionId: 'section',
    });
    expect(occurrenceToViewItem(habit, occurrence, []).status).toBe('pending');
  });
  it('produces identical states and items from arrays and indexes', () => {
    const markIndex = indexMarks(marks);
    for (const date of ['2026-10-07', '2026-10-08']) {
      expect(getOccurrenceStatus(markIndex, habit.id, date)).toEqual(
        getOccurrenceStatus(marks, habit.id, date),
      );
      const occurrence = { habitId: habit.id, date, sortTime: null };
      expect(occurrenceToViewItem(habit, occurrence, markIndex)).toEqual(
        occurrenceToViewItem(habit, occurrence, marks),
      );
    }
  });
  it('builds 50 daily habits for a year with indexed marks in under 200 ms', () => {
    const habits = Array.from({ length: 50 }, (_value, index) => ({
      ...habit,
      id: `habit-${index}`,
    }));
    const occurrencesByHabit = habits.map((currentHabit) =>
      getHabitOccurrences(currentHabit, '2026-01-01', '2026-12-31'),
    );
    const allMarks: HabitMark[] = [];
    for (const occurrences of occurrencesByHabit) {
      for (const occurrence of occurrences) {
        allMarks.push({
          habitId: occurrence.habitId,
          date: occurrence.date,
          status: 'done',
          markedAt: '2026-12-31T10:00:00Z',
        });
      }
    }
    const startedAt = performance.now();
    const markIndex = indexMarks(allMarks);
    const items = habits.flatMap((currentHabit, index) =>
      occurrencesByHabit[index].map((occurrence) =>
        occurrenceToViewItem(currentHabit, occurrence, markIndex),
      ),
    );
    const elapsed = performance.now() - startedAt;
    expect(items).toHaveLength(18250);
    expect(items.every((item) => item.status === 'done')).toBe(true);
    expect(getOccurrenceStatus(markIndex, 'missing', '2026-01-01')).toEqual({
      status: 'pending',
      markedAt: null,
    });
    expect(elapsed).toBeLessThan(200);
  });
});

describe('Task items', () => {
  it.each(['pending', 'done', 'not_done'] as const)(
    'preserves task fields and %s status',
    (status) => {
      const task: Task = {
        id: 'task',
        name: 'Comprar',
        notes: 'Lista',
        categoryId: 'category',
        sectionId: 'section',
        dueDate: '2026-10-07',
        dueTime: '12:30',
        status,
        markedAt: status === 'pending' ? null : '2026-10-07T10:30:00Z',
        archivedOn: null,
      };
      expect(taskToViewItem(task)).toEqual({
        target: { kind: 'task', taskId: 'task' },
        name: 'Comprar',
        date: '2026-10-07',
        sortTime: '12:30',
        status,
        markedAt: task.markedAt,
        categoryId: 'category',
        sectionId: 'section',
      });
      expect(
        taskToViewItem({
          ...task,
          dueDate: null,
          dueTime: null,
          categoryId: null,
          sectionId: null,
        }),
      ).toMatchObject({
        date: null,
        sortTime: null,
        categoryId: null,
        sectionId: null,
      });
    },
  );
});
