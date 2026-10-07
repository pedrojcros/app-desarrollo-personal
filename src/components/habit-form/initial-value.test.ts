import { expect, it } from '@jest/globals';
import type { Habit } from '@/domain/entities';
import { habitToFormValue } from './initial-value';

const habit: Habit = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Leer',
  categoryId: null,
  sectionId: null,
  startDate: '2026-10-01',
  timeOfDay: null,
  timeSlot: null,
  durationMinutes: null,
  archivedOn: null,
  ruleVersions: [
    {
      validFrom: '2026-10-08',
      frequency: 'monthly',
      weekdays: [],
      intervalDays: null,
    },
    {
      validFrom: '2026-10-01',
      frequency: 'daily',
      weekdays: [],
      intervalDays: null,
    },
    {
      validFrom: '2026-10-07',
      frequency: 'every_n_days',
      weekdays: [],
      intervalDays: 3,
    },
  ],
};

it('uses the rule in force today even if another version starts tomorrow', () => {
  const value = habitToFormValue(habit, '2026-10-06');
  expect(value).toMatchObject({ frequency: 'daily', intervalDays: null });
});

it('uses the first rule of a future habit before its start', () => {
  const futureHabit = {
    ...habit,
    startDate: '2026-10-08',
    ruleVersions: [habit.ruleVersions[0]],
  };
  expect(habitToFormValue(futureHabit, '2026-10-06')).toMatchObject({
    frequency: 'monthly',
  });
});

it('returns a controlled empty result when no rule is available', () => {
  expect(
    habitToFormValue({ ...habit, ruleVersions: [] }, '2026-10-07'),
  ).toBeNull();
});
