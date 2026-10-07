import { describe, expect, it } from '@jest/globals';
import type { Habit, HabitMark, Task } from '../entities';
import type { ViewItem } from '../items';
import { getCategoryViewItems, groupBySection } from './category';

const today = '2026-10-07';
const task: Task = {
  id: 'milk',
  name: 'Leche',
  notes: null,
  categoryId: 'shopping',
  sectionId: null,
  dueDate: null,
  dueTime: null,
  status: 'pending',
  markedAt: null,
  archivedOn: null,
};
const habit: Habit = {
  id: 'read',
  name: 'Leer',
  categoryId: 'shopping',
  sectionId: null,
  startDate: '2026-01-01',
  timeOfDay: '09:00',
  timeSlot: null,
  durationMinutes: null,
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
function getItems(
  tasks: Task[] = [],
  habits: Habit[] = [],
  marks: HabitMark[] = [],
  categoryId: string | null = 'shopping',
) {
  return getCategoryViewItems({ tasks, habits, marks, categoryId, today });
}
function names(items: ViewItem[]) {
  return items.map((item) => item.name);
}

describe('Category pending items', () => {
  it('shows undated shopping tasks and keeps uncategorized tasks in the Inbox (CU-03.5)', () => {
    const tasks = [
      task,
      { ...task, id: 'bank', name: 'Llamar al banco', categoryId: null },
    ];
    expect(names(getItems(tasks))).toEqual(['Leche']);
    expect(names(getItems(tasks, [], [], null))).toEqual(['Llamar al banco']);
  });
  it('includes overdue and future tasks before undated tasks, ordered by date', () => {
    const tasks = [
      task,
      { ...task, id: 'future', name: 'Futura', dueDate: '2026-10-08' },
      { ...task, id: 'past', name: 'Vencida', dueDate: '2026-10-06' },
    ];
    expect(names(getItems(tasks))).toEqual(['Vencida', 'Futura', 'Leche']);
  });
  it('orders a day by time then Spanish name, with untimed items last', () => {
    const tasks = [
      { ...task, id: 'zebra', name: 'Zebra', dueDate: today },
      { ...task, id: 'apple', name: 'Árbol', dueDate: today },
      {
        ...task,
        id: 'early',
        name: 'Temprana',
        dueDate: today,
        dueTime: '08:00',
      },
      { ...task, id: 'late', name: 'Última', dueDate: today, dueTime: '10:00' },
    ];
    expect(names(getItems(tasks, [habit]))).toEqual([
      'Temprana',
      'Leer',
      'Última',
      'Árbol',
      'Zebra',
    ]);
  });
  it('orders undated tasks by name regardless of their time', () => {
    expect(
      names(
        getItems([
          task,
          { ...task, id: 'apple', name: 'Árbol', dueTime: '23:00' },
        ]),
      ),
    ).toEqual(['Árbol', 'Leche']);
  });
  it.each(['done', 'not_done'] as const)(
    'excludes tasks marked %s (CU-03.6)',
    (status) => {
      expect(getItems([{ ...task, status }])).toEqual([]);
    },
  );
  it('excludes archived tasks and habits even if archived after today', () => {
    expect(
      getItems(
        [{ ...task, archivedOn: '2026-10-08' }],
        [{ ...habit, archivedOn: '2026-10-08' }],
      ),
    ).toEqual([]);
  });
  it('includes only today’s pending habit occurrence, with its section and time', () => {
    const items = getItems([], [{ ...habit, sectionId: 'books' }]);
    expect(items).toEqual([
      {
        target: { kind: 'occurrence', habitId: 'read', date: today },
        name: 'Leer',
        status: 'pending',
        date: today,
        sortTime: '09:00',
        categoryId: 'shopping',
        sectionId: 'books',
        markedAt: null,
      },
    ]);
  });
  it.each(['done', 'not_done'] as const)(
    'excludes a today occurrence marked %s',
    (status) => {
      const marks: HabitMark[] = [
        {
          habitId: 'read',
          date: today,
          status,
          markedAt: '2026-10-07T09:00:00Z',
        },
      ];
      expect(getItems([], [habit], marks)).toEqual([]);
    },
  );
  it('ignores marks from other days and other habits', () => {
    const marks: HabitMark[] = [
      {
        habitId: 'read',
        date: '2026-10-06',
        status: 'done',
        markedAt: '2026-10-06T09:00:00Z',
      },
      {
        habitId: 'other',
        date: today,
        status: 'done',
        markedAt: '2026-10-07T09:00:00Z',
      },
    ];
    expect(names(getItems([], [habit], marks))).toEqual(['Leer']);
  });
  it('excludes habits that do not occur today or have not started', () => {
    const weekly: Habit = {
      ...habit,
      ruleVersions: [
        {
          validFrom: '2026-01-01',
          frequency: 'weekdays',
          weekdays: [1],
          intervalDays: null,
        },
      ],
    };
    expect(
      getItems(
        [],
        [
          weekly,
          {
            ...habit,
            id: 'future',
            startDate: '2026-10-08',
            ruleVersions: [
              { ...habit.ruleVersions[0], validFrom: '2026-10-08' },
            ],
          },
        ],
      ),
    ).toEqual([]);
  });
  it('keeps Inbox habits and dated tasks apart from categorized items', () => {
    expect(
      names(
        getItems(
          [{ ...task, categoryId: null, dueDate: '2026-10-08' }],
          [habit, { ...habit, id: 'inbox', categoryId: null }],
          [],
          null,
        ),
      ),
    ).toEqual(['Leer', 'Leche']);
  });
  it('returns an empty list with no data', () => {
    expect(getItems()).toEqual([]);
  });
  it('does not mutate its task input', () => {
    const tasks = [task, { ...task, id: 'apple', name: 'Árbol' }];
    getItems(tasks);
    expect(tasks.map((item) => item.id)).toEqual(['milk', 'apple']);
  });
});

describe('Category sections', () => {
  const sections = [
    { id: 'mercadona', name: 'Mercadona' },
    { id: 'lidl', name: 'Lidl' },
  ];
  it('groups by section name and puts unsectioned items last (CU-07.6)', () => {
    const items = getItems([
      task,
      { ...task, id: 'bread', name: 'Pan', sectionId: 'lidl' },
      { ...task, id: 'milk', sectionId: 'mercadona' },
    ]);
    const groups = groupBySection(items, sections);
    expect(
      groups.map((group) => ({
        sectionId: group.sectionId,
        names: names(group.items),
      })),
    ).toEqual([
      { sectionId: 'lidl', names: ['Pan'] },
      { sectionId: 'mercadona', names: ['Leche'] },
      { sectionId: null, names: ['Leche'] },
    ]);
    expect(sections.map((section) => section.id)).toEqual([
      'mercadona',
      'lidl',
    ]);
  });
  it('preserves item order within a section and omits empty groups', () => {
    const items = getItems([
      { ...task, id: 'later', sectionId: 'mercadona', dueDate: '2026-10-08' },
      { ...task, id: 'earlier', sectionId: 'mercadona', dueDate: '2026-10-06' },
    ]);
    const groups = groupBySection(items, sections);
    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((item) => item.date)).toEqual([
      '2026-10-06',
      '2026-10-08',
    ]);
  });
  it('does not lose items if a section disappears from category metadata', () => {
    const items = getItems([{ ...task, sectionId: 'deleted' }]);
    expect(groupBySection(items, [])).toEqual([{ sectionId: null, items }]);
  });
  it('returns no groups for empty content', () => {
    expect(groupBySection([], sections)).toEqual([]);
  });
});
