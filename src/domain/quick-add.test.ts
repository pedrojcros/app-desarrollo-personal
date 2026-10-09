import { expect, it } from '@jest/globals';
import {
  getQuickAddDefaults,
  getQuickAddStartDate,
  getQuickAddShortcutDate,
  type QuickAddDateShortcut,
} from './quick-add';

it('defaults Today to today and the Inbox', () => {
  expect(getQuickAddDefaults({ kind: 'today' }, '2026-10-07')).toEqual({
    dueDate: '2026-10-07',
    categoryId: null,
    sectionId: null,
  });
});
it('defaults a category and its section to undated tasks', () => {
  expect(
    getQuickAddDefaults(
      { kind: 'category', categoryId: 'shopping' },
      '2026-10-07',
    ),
  ).toEqual({ dueDate: null, categoryId: 'shopping', sectionId: null });
  expect(
    getQuickAddDefaults(
      { kind: 'section', categoryId: 'shopping', sectionId: 'mercadona' },
      '2026-10-07',
    ),
  ).toEqual({ dueDate: null, categoryId: 'shopping', sectionId: 'mercadona' });
});
it('defaults other screens to the undated Inbox', () => {
  expect(getQuickAddDefaults({ kind: 'other' }, '2026-10-07')).toEqual({
    dueDate: null,
    categoryId: null,
    sectionId: null,
  });
});
it('uses the initial date or today as the habit start date', () => {
  expect(getQuickAddStartDate(null, '2026-10-07')).toBe('2026-10-07');
  expect(getQuickAddStartDate('2026-11-01', '2026-10-07')).toBe('2026-11-01');
});
it.each<[QuickAddDateShortcut, string, string | null]>([
  ['none', '2026-10-07', null],
  ['today', '2026-10-07', '2026-10-07'],
  ['tomorrow', '2026-12-31', '2027-01-01'],
  ['tomorrow', '2028-02-28', '2028-02-29'],
  ['tomorrow', '2026-03-29', '2026-03-30'],
  ['monday', '2026-10-07', '2026-10-12'],
  ['monday', '2026-10-12', '2026-10-19'],
  ['monday', '2026-10-11', '2026-10-12'],
])(
  'resolves %s from %s without time-zone drift',
  (shortcut, today, expected) => {
    expect(getQuickAddShortcutDate(shortcut, today)).toBe(expected);
  },
);
