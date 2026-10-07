import { describe, expect, it } from '@jest/globals';

import type { Habit, HabitMark, Task } from '../entities';
import type { ViewItem } from '../items';
import { formatLongDate, getTodayItems, summarizeDay } from './today';

const today = '2026-10-07';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'brush',
    name: 'Lavarme los dientes',
    categoryId: null,
    sectionId: null,
    startDate: '2026-09-01',
    timeOfDay: null,
    timeSlot: null,
    durationMinutes: null,
    ruleVersions: [
      {
        validFrom: '2026-09-01',
        frequency: 'daily',
        weekdays: [],
        intervalDays: null,
      },
    ],
    archivedOn: null,
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'milk',
    name: 'Leche',
    notes: null,
    categoryId: null,
    sectionId: null,
    dueDate: today,
    dueTime: null,
    status: 'pending',
    markedAt: null,
    archivedOn: null,
    ...overrides,
  };
}

function names(items: ViewItem[]): string[] {
  return items.map((item) => item.name);
}

function getItems(input: {
  habits?: Habit[];
  marks?: HabitMark[];
  tasks?: Task[];
}): ViewItem[] {
  return getTodayItems({
    habits: input.habits ?? [],
    marks: input.marks ?? [],
    tasks: input.tasks ?? [],
    today,
  });
}

describe('getTodayItems', () => {
  it('shows today occurrences of habits and tasks due today', () => {
    const items = getItems({ habits: [makeHabit()], tasks: [makeTask()] });

    expect(names(items)).toEqual(['Lavarme los dientes', 'Leche']);
  });

  it('is empty when nothing is due today', () => {
    expect(getItems({})).toEqual([]);
  });

  it('skips overdue tasks (CU-03 scenario 4)', () => {
    const overdue = makeTask({ dueDate: '2026-10-06' });

    expect(getItems({ tasks: [overdue] })).toEqual([]);
  });

  it('skips tasks without a date (scenario 5)', () => {
    const undated = makeTask({ dueDate: null });

    expect(getItems({ tasks: [undated] })).toEqual([]);
  });

  it('skips tasks due tomorrow', () => {
    const tomorrow = makeTask({ dueDate: '2026-10-08' });

    expect(getItems({ tasks: [tomorrow] })).toEqual([]);
  });

  it('skips archived tasks', () => {
    const archived = makeTask({ archivedOn: '2026-10-05' });

    expect(getItems({ tasks: [archived] })).toEqual([]);
  });

  it('skips archived habits, also on the day they were archived', () => {
    const archivedBefore = makeHabit({ archivedOn: '2026-10-01' });
    const archivedToday = makeHabit({ id: 'other', archivedOn: today });

    expect(getItems({ habits: [archivedBefore, archivedToday] })).toEqual([]);
  });

  it('skips archived habits even when their archive date is after today', () => {
    const archived = makeHabit({ archivedOn: '2026-10-08' });

    expect(getItems({ habits: [archived] })).toEqual([]);
  });

  it('skips habits that start tomorrow', () => {
    const habit = makeHabit({
      startDate: '2026-10-08',
      ruleVersions: [
        {
          validFrom: '2026-10-08',
          frequency: 'daily',
          weekdays: [],
          intervalDays: null,
        },
      ],
    });

    expect(getItems({ habits: [habit] })).toEqual([]);
  });

  it('follows the rule version that applies today', () => {
    // El 7 de octubre de 2026 es miércoles: la regla nueva (solo lunes) empieza hoy.
    const habit = makeHabit({
      ruleVersions: [
        {
          validFrom: '2026-09-01',
          frequency: 'daily',
          weekdays: [],
          intervalDays: null,
        },
        {
          validFrom: today,
          frequency: 'weekdays',
          weekdays: [1],
          intervalDays: null,
        },
      ],
    });

    expect(getItems({ habits: [habit] })).toEqual([]);
  });

  it('does not show unmarked occurrences from previous days (scenario 3)', () => {
    const items = getItems({ habits: [makeHabit()] });

    const dates = items.map((item) => item.date);
    expect(dates).toEqual([today]);
  });

  it('keeps today occurrence independent from yesterday marks (scenario 10)', () => {
    const yesterdayMark: HabitMark = {
      habitId: 'brush',
      date: '2026-10-06',
      status: 'not_done',
      markedAt: '2026-10-06T20:00:00.000Z',
    };

    const [item] = getItems({ habits: [makeHabit()], marks: [yesterdayMark] });

    expect(item.status).toBe('pending');
  });

  it('includes marked items with their status', () => {
    const mark: HabitMark = {
      habitId: 'brush',
      date: today,
      status: 'done',
      markedAt: '2026-10-07T08:00:00.000Z',
    };
    const doneTask = makeTask({
      status: 'not_done',
      markedAt: '2026-10-07T09:00:00.000Z',
    });

    const items = getItems({
      habits: [makeHabit()],
      marks: [mark],
      tasks: [doneTask],
    });

    const statuses = items.map((item) => item.status);
    expect(statuses).toEqual(['done', 'not_done']);
  });

  it('orders by exact time or slot time, and items without time last', () => {
    const morningHabit = makeHabit({
      id: 'morning',
      name: 'Estirar',
      timeSlot: 'morning',
    });
    const exactHabit = makeHabit({
      id: 'exact',
      name: 'Nadar',
      timeOfDay: '07:30',
    });
    const noTimeHabit = makeHabit({ id: 'none', name: 'Leer' });
    const lateTask = makeTask({ id: 'late', name: 'Cena', dueTime: '21:00' });

    const items = getItems({
      habits: [noTimeHabit, morningHabit, exactHabit],
      tasks: [makeTask(), lateTask],
    });

    expect(names(items)).toEqual(['Nadar', 'Estirar', 'Cena', 'Leche', 'Leer']);
  });

  it('is fast with 50 habits and 2000 tasks (RNF-01)', () => {
    const habits = Array.from({ length: 50 }, (_unused, index) =>
      makeHabit({ id: `habit-${index}`, name: `Hábito ${index}` }),
    );
    const tasks = Array.from({ length: 2000 }, (_unused, index) =>
      makeTask({
        id: `task-${index}`,
        name: `Tarea ${index}`,
        dueDate: index % 40 === 0 ? today : '2026-11-01',
      }),
    );

    const startedAt = performance.now();
    const items = getItems({ habits, tasks });
    const elapsed = performance.now() - startedAt;

    expect(items).toHaveLength(100);
    expect(elapsed).toBeLessThan(50);
  });
});

describe('summarizeDay', () => {
  function makeItem(overrides: Partial<ViewItem>): ViewItem {
    return {
      target: { kind: 'task', taskId: 'item' },
      name: 'Item',
      status: 'pending',
      date: today,
      sortTime: null,
      categoryId: null,
      sectionId: null,
      markedAt: null,
      ...overrides,
    };
  }

  it('counts everything and lists marked items in marking order', () => {
    const late = makeItem({
      name: 'Tarde',
      status: 'done',
      markedAt: '2026-10-07T18:00:00.000Z',
    });
    const early = makeItem({
      name: 'Pronto',
      status: 'not_done',
      markedAt: '2026-10-07T07:00:00.000Z',
    });
    const pending = makeItem({ name: 'Pendiente' });

    const summary = summarizeDay([late, pending, early]);

    expect(summary.total).toBe(3);
    expect(names(summary.marked)).toEqual(['Pronto', 'Tarde']);
  });

  it('is empty for an empty day', () => {
    expect(summarizeDay([])).toEqual({ total: 0, marked: [] });
  });

  it('does not mutate the input list or reorder equal marking instants', () => {
    const done = makeItem({
      name: 'Hecho',
      status: 'done',
      markedAt: '2026-10-07T08:00:00Z',
    });
    const skipped = makeItem({
      name: 'No hecho',
      status: 'not_done',
      markedAt: '2026-10-07T08:00:00Z',
    });
    const pending = makeItem({ name: 'Pendiente' });
    const items = [pending, skipped, done];

    expect(names(summarizeDay(items).marked)).toEqual(['No hecho', 'Hecho']);
    expect(names(items)).toEqual(['Pendiente', 'No hecho', 'Hecho']);
  });
});

describe('formatLongDate', () => {
  it('writes the date in Spanish', () => {
    expect(formatLongDate('2026-10-06')).toBe('Martes, 6 de octubre de 2026');
    expect(formatLongDate('2026-01-04')).toBe('Domingo, 4 de enero de 2026');
  });
});
