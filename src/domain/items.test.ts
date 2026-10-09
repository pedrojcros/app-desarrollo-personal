import { describe, expect, it } from '@jest/globals';
import {
  applyStatusToItems,
  compareViewItemsForDay,
  getMarkTargetKey,
  isSameMarkTarget,
  type ViewItem,
  type MarkTarget,
} from './items';

function makeItem(
  target: MarkTarget,
  name = 'Leer',
  sortTime: string | null = null,
): ViewItem {
  return {
    target,
    name,
    sortTime,
    status: 'pending',
    date: null,
    categoryId: null,
    sectionId: null,
    markedAt: null,
  };
}
const taskTarget: MarkTarget = { kind: 'task', taskId: 'first' };
const occurrenceTarget: MarkTarget = {
  kind: 'occurrence',
  habitId: 'first',
  date: '2026-10-07',
};

describe('Mark targets', () => {
  it('distinguishes tasks, habits and dates with stable keys', () => {
    expect(getMarkTargetKey(taskTarget)).toBe('task:first');
    expect(getMarkTargetKey(occurrenceTarget)).toBe(
      'occurrence:first:2026-10-07',
    );
    expect(isSameMarkTarget(taskTarget, { ...taskTarget })).toBe(true);
    expect(isSameMarkTarget(occurrenceTarget, { ...occurrenceTarget })).toBe(
      true,
    );
    expect(isSameMarkTarget(taskTarget, occurrenceTarget)).toBe(false);
    expect(
      isSameMarkTarget(taskTarget, { kind: 'task', taskId: 'second' }),
    ).toBe(false);
    expect(
      isSameMarkTarget(occurrenceTarget, {
        ...occurrenceTarget,
        date: '2026-10-08',
      }),
    ).toBe(false);
    expect(
      isSameMarkTarget(occurrenceTarget, {
        ...occurrenceTarget,
        habitId: 'second',
      }),
    ).toBe(false);
  });
  it('patches every match without mutating input or unrelated items', () => {
    const original = [
      makeItem(taskTarget),
      makeItem(occurrenceTarget),
      makeItem(taskTarget),
    ];
    const updated = applyStatusToItems(
      original,
      taskTarget,
      'done',
      '2026-10-07T10:00:00Z',
    );
    expect(updated).not.toBe(original);
    expect(updated[0]).toEqual({
      ...original[0],
      status: 'done',
      markedAt: '2026-10-07T10:00:00Z',
    });
    expect(updated[2]).toEqual(updated[0]);
    expect(updated[1]).toBe(original[1]);
    expect(original[0].status).toBe('pending');
    const restored = applyStatusToItems(updated, taskTarget, 'pending', null);
    expect(restored).toEqual(original);
    expect(applyStatusToItems([], taskTarget, 'not_done', null)).toEqual([]);
  });
});
describe('Day ordering', () => {
  it('puts times first, then Spanish names and stable keys', () => {
    const items = [
      makeItem(taskTarget, 'Zorro'),
      makeItem(taskTarget, 'Árbol', '09:00'),
      makeItem(occurrenceTarget, 'Árbol', '09:00'),
      makeItem(taskTarget, 'Zorro', '08:00'),
      makeItem(taskTarget, 'Barco', '09:00'),
    ];
    const sorted = [...items].sort(compareViewItemsForDay);
    expect(sorted).toEqual([items[3], items[2], items[1], items[4], items[0]]);
    expect(compareViewItemsForDay(items[1], items[1])).toBe(0);
    expect(compareViewItemsForDay(items[0], items[3])).toBeGreaterThan(0);
    expect(compareViewItemsForDay(items[3], items[0])).toBeLessThan(0);
    expect(compareViewItemsForDay(items[1], items[3])).toBeGreaterThan(0);
    expect(
      compareViewItemsForDay(
        makeItem(taskTarget, 'Árbol'),
        makeItem(taskTarget, 'Barco'),
      ),
    ).toBeLessThan(0);
  });
});
