import { describe, expect, test } from '@jest/globals';

import { compareOccurrencesForDay, getOccurrencesInRange } from './recurrence';
import type {
  HabitRuleVersion,
  HabitSchedule,
  IsoWeekday,
  Occurrence,
  TimeSlot,
} from './types';

function createRule(
  overrides: Partial<HabitRuleVersion> = {},
): HabitRuleVersion {
  return {
    validFrom: '2026-01-01',
    frequency: 'daily',
    weekdays: [],
    intervalDays: null,
    ...overrides,
  };
}

function createSchedule(overrides: Partial<HabitSchedule> = {}): HabitSchedule {
  return {
    habitId: 'habit',
    startDate: '2026-01-01',
    timeOfDay: null,
    timeSlot: null,
    ruleVersions: [createRule()],
    ...overrides,
  };
}

function occurrenceDates(
  schedule: HabitSchedule,
  fromDate: string,
  toDate: string,
): string[] {
  const occurrences = getOccurrencesInRange(schedule, fromDate, toDate);
  return occurrences.map((occurrence) => occurrence.date);
}

describe('recurrence', () => {
  test('uses all selected ISO weekdays including Sunday', () => {
    const schedule = createSchedule({
      ruleVersions: [
        createRule({ frequency: 'weekdays', weekdays: [7, 1, 3] }),
      ],
    });
    expect(occurrenceDates(schedule, '2026-03-23', '2026-03-30')).toEqual([
      '2026-03-23',
      '2026-03-25',
      '2026-03-29',
      '2026-03-30',
    ]);
  });

  test('an interval counts from the start date, which is also the first version', () => {
    const schedule = createSchedule({
      startDate: '2026-01-03',
      ruleVersions: [
        createRule({
          validFrom: '2026-01-03',
          frequency: 'every_n_days',
          intervalDays: 3,
        }),
      ],
    });
    expect(occurrenceDates(schedule, '2026-01-01', '2026-01-10')).toEqual([
      '2026-01-03',
      '2026-01-06',
      '2026-01-09',
    ]);
  });

  test('an interval of one day includes every day', () => {
    const schedule = createSchedule({
      ruleVersions: [
        createRule({ frequency: 'every_n_days', intervalDays: 1 }),
      ],
    });
    expect(occurrenceDates(schedule, '2026-01-01', '2026-01-03')).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
    ]);
  });

  test('includes the last representable calendar date without advancing beyond it', () => {
    expect(
      occurrenceDates(createSchedule(), '9999-12-31', '9999-12-31'),
    ).toEqual(['9999-12-31']);
  });

  test('a monthly rule change uses its own anchor and keeps previous dates', () => {
    const schedule = createSchedule({
      startDate: '2026-01-31',
      ruleVersions: [
        createRule({ validFrom: '2026-01-31', frequency: 'monthly' }),
        createRule({ validFrom: '2026-03-15', frequency: 'monthly' }),
      ],
    });
    expect(occurrenceDates(schedule, '2026-01-01', '2026-04-30')).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-15',
      '2026-04-15',
    ]);
  });

  test('CU-01 scenario 2: Tuesday at 17:00 after a Monday start', () => {
    const schedule = createSchedule({
      startDate: '2026-03-23',
      timeOfDay: '17:00',
      ruleVersions: [
        createRule({
          validFrom: '2026-03-23',
          frequency: 'weekdays',
          weekdays: [2],
        }),
      ],
    });
    expect(getOccurrencesInRange(schedule, '2026-03-23', '2026-03-24')).toEqual(
      [{ habitId: 'habit', date: '2026-03-24', sortTime: '17:00' }],
    );
  });

  test('CU-01 scenario 3: every three days does not depend on marks', () => {
    const schedule = createSchedule({
      ruleVersions: [
        createRule({ frequency: 'every_n_days', intervalDays: 3 }),
      ],
    });
    expect(occurrenceDates(schedule, '2026-01-01', '2026-01-10')).toEqual([
      '2026-01-01',
      '2026-01-04',
      '2026-01-07',
      '2026-01-10',
    ]);
  });

  test.each([
    ['2024-01-31', '2024-02-01', '2024-03-31', ['2024-02-29', '2024-03-31']],
    [
      '2026-01-31',
      '2026-02-01',
      '2026-04-30',
      ['2026-02-28', '2026-03-31', '2026-04-30'],
    ],
    [
      '2026-12-30',
      '2026-12-01',
      '2027-03-31',
      ['2026-12-30', '2027-01-30', '2027-02-28', '2027-03-30'],
    ],
  ])(
    'CU-01 scenario 4: monthly anchor %s survives short months',
    (anchor, fromDate, toDate, expected) => {
      const schedule = createSchedule({
        startDate: anchor,
        ruleVersions: [createRule({ validFrom: anchor, frequency: 'monthly' })],
      });
      expect(occurrenceDates(schedule, fromDate, toDate)).toEqual(expected);
    },
  );

  test.each([
    ['2026-03-28', '2026-03-30', ['2026-03-28', '2026-03-29', '2026-03-30']],
    ['2026-10-24', '2026-10-26', ['2026-10-24', '2026-10-25', '2026-10-26']],
  ])(
    'daily recurrence keeps every date across clock changes from %s',
    (fromDate, toDate, expected) => {
      expect(occurrenceDates(createSchedule(), fromDate, toDate)).toEqual(
        expected,
      );
    },
  );

  test.each([
    ['2026-01-30', '2026-02-06', ['2026-01-30', '2026-02-02', '2026-02-05']],
    ['2026-12-30', '2027-01-06', ['2026-12-30', '2027-01-02', '2027-01-05']],
    ['2024-02-28', '2024-03-05', ['2024-02-28', '2024-03-02', '2024-03-05']],
  ])('every N days crosses boundaries from %s', (anchor, toDate, expected) => {
    const schedule = createSchedule({
      startDate: anchor,
      ruleVersions: [
        createRule({
          validFrom: anchor,
          frequency: 'every_n_days',
          intervalDays: 3,
        }),
      ],
    });
    expect(occurrenceDates(schedule, anchor, toDate)).toEqual(expected);
  });

  test('two unordered versions preserve the past and restart the interval', () => {
    const schedule = createSchedule({
      ruleVersions: [
        createRule({
          validFrom: '2026-01-05',
          frequency: 'every_n_days',
          intervalDays: 3,
        }),
        createRule(),
      ],
    });
    const original = JSON.stringify(schedule);
    expect(occurrenceDates(schedule, '2026-01-03', '2026-01-10')).toEqual([
      '2026-01-03',
      '2026-01-04',
      '2026-01-05',
      '2026-01-08',
    ]);
    expect(JSON.stringify(schedule)).toBe(original);
    expect(occurrenceDates(schedule, '2026-01-06', '2026-01-10')).toEqual([
      '2026-01-08',
    ]);
  });

  test.each([
    [
      '2026-01-05',
      [
        '2026-01-01',
        '2026-01-04',
        '2026-01-05',
        '2026-01-12',
        '2026-01-19',
        '2026-01-20',
      ],
    ],
    [
      '2026-01-06',
      ['2026-01-01', '2026-01-04', '2026-01-12', '2026-01-19', '2026-01-20'],
    ],
  ])(
    'three versions apply weekdays at the boundary %s',
    (boundary, expected) => {
      const schedule = createSchedule({
        ruleVersions: [
          createRule({ validFrom: '2026-01-20', frequency: 'monthly' }),
          createRule({ frequency: 'every_n_days', intervalDays: 3 }),
          createRule({
            validFrom: boundary,
            frequency: 'weekdays',
            weekdays: [1],
          }),
        ],
      });
      expect(occurrenceDates(schedule, '2026-01-01', '2026-01-31')).toEqual(
        expected,
      );
    },
  );

  test('does not generate dates before the start date', () => {
    expect(
      occurrenceDates(
        createSchedule({
          startDate: '2026-01-05',
          ruleVersions: [createRule({ validFrom: '2026-01-05' })],
        }),
        '2026-01-01',
        '2026-01-06',
      ),
    ).toEqual(['2026-01-05', '2026-01-06']);
    expect(
      occurrenceDates(
        createSchedule({
          startDate: '2027-01-01',
          ruleVersions: [createRule({ validFrom: '2027-01-01' })],
        }),
        '2026-01-01',
        '2026-12-31',
      ),
    ).toEqual([]);
  });

  test('single-day ranges are inclusive, empty and reversed ranges stay empty', () => {
    expect(
      occurrenceDates(createSchedule(), '2026-01-01', '2026-01-01'),
    ).toEqual(['2026-01-01']);
    expect(
      occurrenceDates(createSchedule(), '2026-01-02', '2026-01-01'),
    ).toEqual([]);
    const schedule = createSchedule({
      ruleVersions: [createRule({ frequency: 'weekdays', weekdays: [2] })],
    });
    expect(occurrenceDates(schedule, '2026-01-01', '2026-01-01')).toEqual([]);
  });

  function expectInvalidSchedule(
    schedule: HabitSchedule,
    message: string,
  ): void {
    expect(() =>
      getOccurrencesInRange(schedule, '2026-01-01', '2026-01-10'),
    ).toThrow(new Error(message));
  }

  test.each([0, -1, 1.5, NaN, Infinity, null])(
    'rejects invalid interval %s',
    (intervalDays) => {
      const schedule = createSchedule({
        ruleVersions: [createRule({ frequency: 'every_n_days', intervalDays })],
      });
      expectInvalidSchedule(
        schedule,
        'Interval days must be an integer greater than zero',
      );
    },
  );

  test('rejects a schedule without rule versions', () => {
    expectInvalidSchedule(
      createSchedule({ ruleVersions: [] }),
      'A habit must have at least one rule version',
    );
  });

  test('rejects a time of day together with a time slot', () => {
    expectInvalidSchedule(
      createSchedule({ timeOfDay: '17:00', timeSlot: 'night' }),
      'A habit cannot have both a time of day and a time slot',
    );
  });

  test.each(['24:00', '9:00', '12:60', '12:5', '', 'noon', '12:00:00'])(
    'rejects the time of day %j',
    (timeOfDay) => {
      expectInvalidSchedule(
        createSchedule({ timeOfDay }),
        'Time of day must be a valid HH:MM time',
      );
    },
  );

  test.each(['00:00', '09:05', '23:59'])(
    'accepts the time of day %s',
    (timeOfDay) => {
      const occurrences = getOccurrencesInRange(
        createSchedule({ timeOfDay }),
        '2026-01-01',
        '2026-01-01',
      );
      expect(occurrences[0].sortTime).toBe(timeOfDay);
    },
  );

  test.each(['noon', '', 'toString'])(
    'rejects the time slot %j',
    (timeSlot) => {
      expectInvalidSchedule(
        createSchedule({ timeSlot: timeSlot as TimeSlot }),
        'Time slot must be morning, afternoon or night',
      );
    },
  );

  test('rejects an unknown frequency', () => {
    const schedule = createSchedule({
      ruleVersions: [
        createRule({ frequency: 'yearly' as HabitRuleVersion['frequency'] }),
      ],
    });
    expectInvalidSchedule(schedule, 'Unknown frequency: yearly');
  });

  test('rejects weekday rules without weekdays', () => {
    const schedule = createSchedule({
      ruleVersions: [createRule({ frequency: 'weekdays' })],
    });
    expectInvalidSchedule(
      schedule,
      'Weekday rules must have at least one weekday',
    );
  });

  test.each([null, undefined, 'monday', 3])(
    'rejects weekdays that are not an array: %j',
    (weekdays) => {
      const schedule = createSchedule({
        ruleVersions: [
          createRule({
            frequency: 'weekdays',
            weekdays: weekdays as unknown as IsoWeekday[],
          }),
        ],
      });
      expectInvalidSchedule(
        schedule,
        'Weekday rules must have a weekdays array',
      );
    },
  );

  test.each([[[0]], [[8]], [[1.5]], [['2']], [[1, NaN]]])(
    'rejects the weekdays %j',
    (weekdays) => {
      const schedule = createSchedule({
        ruleVersions: [
          createRule({
            frequency: 'weekdays',
            weekdays: weekdays as unknown as IsoWeekday[],
          }),
        ],
      });
      expectInvalidSchedule(
        schedule,
        'Weekdays must be integers from 1 (Monday) to 7 (Sunday)',
      );
    },
  );

  test('rejects versions that share the same validFrom, in any order', () => {
    const daily = createRule();
    const weekly = createRule({ frequency: 'weekdays', weekdays: [1] });
    const later = createRule({ validFrom: '2026-01-05' });
    const laterWeekly = createRule({
      validFrom: '2026-01-05',
      frequency: 'weekdays',
      weekdays: [2],
    });
    const orders = [
      [daily, weekly],
      [weekly, daily],
      [daily, later, laterWeekly],
      [laterWeekly, later, daily],
    ];
    for (const ruleVersions of orders) {
      expectInvalidSchedule(
        createSchedule({ ruleVersions }),
        'Rule versions must have distinct validFrom dates',
      );
    }
  });

  test.each(['2026-01-05', '2025-12-31'])(
    'rejects a first version starting on %s instead of the start date',
    (validFrom) => {
      const schedule = createSchedule({
        ruleVersions: [createRule({ validFrom })],
      });
      expectInvalidSchedule(
        schedule,
        'The first rule version must start on the habit start date',
      );
    },
  );

  test.each<[TimeSlot, string]>([
    ['morning', '09:00'],
    ['afternoon', '15:00'],
    ['night', '21:00'],
  ])('orders slot %s at its associated time', (timeSlot, expected) => {
    const occurrences = getOccurrencesInRange(
      createSchedule({ timeSlot }),
      '2026-01-01',
      '2026-01-01',
    );
    expect(occurrences[0].sortTime).toBe(expected);
  });

  test('orders exact times, slots and untimed habits with stable ties', () => {
    const schedules = [
      createSchedule({ habitId: 'untimed-z' }),
      createSchedule({ habitId: 'night', timeSlot: 'night' }),
      createSchedule({ habitId: 'exact', timeOfDay: '08:00' }),
      createSchedule({ habitId: 'morning-z', timeSlot: 'morning' }),
      createSchedule({ habitId: 'afternoon', timeSlot: 'afternoon' }),
      createSchedule({ habitId: 'morning-a', timeOfDay: '09:00' }),
      createSchedule({ habitId: 'untimed-a' }),
    ];
    const occurrences = schedules.flatMap((schedule) =>
      getOccurrencesInRange(schedule, '2026-01-01', '2026-01-01'),
    );
    occurrences.sort(compareOccurrencesForDay);
    expect(occurrences.map((occurrence) => occurrence.habitId)).toEqual([
      'exact',
      'morning-a',
      'morning-z',
      'afternoon',
      'night',
      'untimed-a',
      'untimed-z',
    ]);
    const first: Occurrence = {
      habitId: 'same',
      date: '2026-01-01',
      sortTime: null,
    };
    expect(compareOccurrencesForDay(first, { ...first })).toBe(0);
  });

  test('calculates five years of daily occurrences in under 200 ms', () => {
    const startedAt = performance.now();
    const occurrences = getOccurrencesInRange(
      createSchedule(),
      '2026-01-01',
      '2030-12-31',
    );
    const elapsed = performance.now() - startedAt;
    expect(occurrences).toHaveLength(1826);
    expect(elapsed).toBeLessThan(200);
  });
});
