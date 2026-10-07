import { afterAll, beforeAll, expect, it } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getOccurrencesInRange } from '../domain/recurrence';
import type { HabitSchedule, IsoWeekday } from '../domain/types';
import type { Tables } from './database.types';
import {
  createAdminClient,
  createAnonymousClient,
  createTestUser,
  deleteTestUser,
  type TestUser,
} from './supabase/local-supabase';

let adminClient: SupabaseClient;
let owner: TestUser;
let stranger: TestUser;
const parameters = {
  p_name: 'Atomic habit',
  p_category_id: null,
  p_section_id: null,
  p_start_date: '2026-10-20',
  p_time_of_day: null,
  p_time_slot: null,
  p_frequency: 'daily',
  p_weekdays: [],
  p_interval_days: null,
};

beforeAll(async () => {
  adminClient = createAdminClient();
  owner = await createTestUser(adminClient);
  stranger = await createTestUser(adminClient);
}, 35000);

afterAll(async () => {
  await deleteTestUser(adminClient, owner);
  await deleteTestUser(adminClient, stranger);
});

async function readRules(habitId: string) {
  const response = await owner.client
    .from('habit_rules')
    .select('*')
    .eq('habit_id', habitId)
    .order('valid_from');
  expect(response.error).toBeNull();
  return response.data as Tables<'habit_rules'>[];
}

function buildSchedule(
  habitId: string,
  rules: Tables<'habit_rules'>[],
): HabitSchedule {
  return {
    habitId,
    startDate: '2026-09-27',
    timeOfDay: null,
    timeSlot: null,
    ruleVersions: rules.map((rule) => ({
      validFrom: rule.valid_from,
      frequency: rule.frequency,
      weekdays: (rule.weekdays ?? []) as IsoWeekday[],
      intervalDays: rule.interval_days,
    })),
  };
}

function editArguments(habitId: string, changes: Record<string, unknown> = {}) {
  return {
    p_name: parameters.p_name,
    p_category_id: null,
    p_section_id: null,
    p_time_of_day: null,
    p_time_slot: null,
    p_frequency: 'daily',
    p_weekdays: [],
    p_interval_days: null,
    p_habit_id: habitId,
    p_today: '2026-10-07',
    p_new_start_date: parameters.p_start_date,
    ...changes,
  };
}

async function createHabitId(
  changes: Record<string, unknown> = {},
): Promise<string> {
  const response = await owner.client.rpc('create_habit', {
    ...parameters,
    ...changes,
  });
  expect(response.error).toBeNull();
  expect(typeof response.data).toBe('string');
  return response.data;
}

it('creates the first rule at start_date in the same transaction', async () => {
  const habitId = await createHabitId();
  const response = await owner.client
    .from('habits')
    .select('*, habit_rules(*)')
    .eq('id', habitId)
    .single();
  expect(response.error).toBeNull();
  expect(response.data.habit_rules).toHaveLength(1);
  expect(response.data.habit_rules[0].valid_from).toBe(
    response.data.start_date,
  );
});

it('rolls back the habit when its first rule is invalid', async () => {
  const response = await owner.client.rpc('create_habit', {
    ...parameters,
    p_name: 'Must roll back',
    p_frequency: 'weekdays',
    p_weekdays: [],
  });
  expect(response.error).not.toBeNull();
  const remaining = await owner.client
    .from('habits')
    .select('id')
    .eq('name', 'Must roll back');
  expect(remaining.data).toEqual([]);
});

it('updates the same date rather than duplicating a rule', async () => {
  const habitId = await createHabitId();
  for (const weekdays of [[3], [5]]) {
    const response = await owner.client.rpc('set_habit_rule', {
      p_habit_id: habitId,
      p_today: '2026-10-07',
      p_frequency: 'weekdays',
      p_weekdays: weekdays,
      p_interval_days: null,
    });
    expect(response.error).toBeNull();
  }
  const rules = await owner.client
    .from('habit_rules')
    .select('*')
    .eq('habit_id', habitId);
  expect(rules.data).toHaveLength(1);
  expect(rules.data?.[0].weekdays).toEqual([5]);
  const duplicate = await owner.client.from('habit_rules').insert({
    habit_id: habitId,
    valid_from: '2026-10-20',
    frequency: 'daily',
  });
  expect(duplicate.error?.code).toBe('23505');
});

it('moves the single first rule and start date together', async () => {
  const habitId = await createHabitId();
  const response = await owner.client.rpc('move_habit_start_date', {
    p_habit_id: habitId,
    p_new_start_date: '2026-10-22',
    p_today: '2026-10-07',
  });
  expect(response.error).toBeNull();
  const habit = await owner.client
    .from('habits')
    .select('start_date, habit_rules(valid_from)')
    .eq('id', habitId)
    .single();
  expect(habit.data).toEqual({
    start_date: '2026-10-22',
    habit_rules: [{ valid_from: '2026-10-22' }],
  });
});

it('rejects an already started habit, a past new date and multiple versions', async () => {
  const habitId = await createHabitId();
  const started = await owner.client.rpc('move_habit_start_date', {
    p_habit_id: habitId,
    p_new_start_date: '2026-10-22',
    p_today: '2026-10-20',
  });
  expect(started.error?.code).toBe('P1001');
  const past = await owner.client.rpc('move_habit_start_date', {
    p_habit_id: habitId,
    p_new_start_date: '2026-10-06',
    p_today: '2026-10-07',
  });
  expect(past.error?.code).toBe('P1002');
  const inserted = await owner.client.from('habit_rules').insert({
    habit_id: habitId,
    valid_from: '2026-10-21',
    frequency: 'daily',
  });
  expect(inserted.error).toBeNull();
  const multiple = await owner.client.rpc('move_habit_start_date', {
    p_habit_id: habitId,
    p_new_start_date: '2026-10-22',
    p_today: '2026-10-07',
  });
  expect(multiple.error?.code).toBe('P1002');
});

it('denies anonymous access and cannot change another users habit through either function', async () => {
  const habitId = await createHabitId();
  const anonymous = await createAnonymousClient().rpc(
    'create_habit',
    parameters,
  );
  expect(anonymous.error?.code).toBe('42501');
  const rule = await stranger.client.rpc('set_habit_rule', {
    p_habit_id: habitId,
    p_today: '2026-10-07',
    p_frequency: 'daily',
    p_weekdays: [],
    p_interval_days: null,
  });
  expect(rule.error?.code).toBe('P0002');
  const moved = await stranger.client.rpc('move_habit_start_date', {
    p_habit_id: habitId,
    p_new_start_date: '2026-10-22',
    p_today: '2026-10-07',
  });
  expect(moved.error?.code).toBe('P0002');
  const foreignCategory = await owner.client
    .from('categories')
    .insert({ name: 'Private' })
    .select('id')
    .single();
  if (!foreignCategory.data) {
    throw new Error('Category fixture required');
  }
  const foreignCreation = await stranger.client.rpc('create_habit', {
    ...parameters,
    p_category_id: foreignCategory.data.id,
  });
  expect(foreignCreation.error?.code).toBe('23503');
});

it('rolls back every edit if moving an already started habit fails', async () => {
  const created = await owner.client.rpc('create_habit', {
    ...parameters,
    p_start_date: '2026-10-01',
  });
  expect(created.error).toBeNull();
  const habitId = created.data;
  const response = await owner.client.rpc('update_habit', {
    p_habit_id: habitId,
    p_name: 'Must not change',
    p_category_id: null,
    p_section_id: null,
    p_time_of_day: null,
    p_time_slot: 'night',
    p_new_start_date: '2026-10-20',
    p_frequency: 'weekdays',
    p_weekdays: [3],
    p_interval_days: null,
    p_today: '2026-10-07',
  });
  expect(response.error?.code).toBe('P1001');
  const habit = await owner.client
    .from('habits')
    .select('name, start_date, time_slot, habit_rules(valid_from, frequency)')
    .eq('id', habitId)
    .single();
  expect(habit.data).toEqual({
    name: parameters.p_name,
    start_date: '2026-10-01',
    time_slot: null,
    habit_rules: [{ valid_from: '2026-10-01', frequency: 'daily' }],
  });
});

it('calculates the effective date on the server and keeps earlier rule versions intact', async () => {
  const habitId = await createHabitId({ p_start_date: '2026-09-27' });
  const before = await readRules(habitId);
  const changed = await owner.client.rpc('set_habit_rule', {
    p_habit_id: habitId,
    p_today: '2026-10-07',
    p_frequency: 'weekdays',
    p_weekdays: [3],
    p_interval_days: null,
  });
  expect(changed.error).toBeNull();
  const after = await readRules(habitId);
  expect(after).toHaveLength(2);
  expect(after[0]).toEqual(before[0]);
  expect(after[1]).toMatchObject({
    valid_from: '2026-10-07',
    frequency: 'weekdays',
  });

  const pastDate = await owner.client.rpc('set_habit_rule', {
    p_habit_id: habitId,
    p_valid_from: '2026-09-27',
    p_frequency: 'monthly',
  });
  expect(pastDate.error?.code).toBe('PGRST202');
  expect(await readRules(habitId)).toEqual(after);
});

it('requires today rather than silently choosing an effective date', async () => {
  const habitId = await createHabitId();
  const before = await readRules(habitId);
  const response = await owner.client.rpc('set_habit_rule', {
    p_habit_id: habitId,
    p_today: null,
    p_frequency: 'monthly',
  });
  expect(response.error?.code).toBe('P1002');
  expect(await readRules(habitId)).toEqual(before);
});

it.each(['set_habit_rule', 'update_habit'])(
  '%s keeps the anchor when saving an unchanged rule twice',
  async (functionName) => {
    const habitId = await createHabitId({
      p_start_date: '2026-10-01',
      p_frequency: 'every_n_days',
      p_interval_days: 3,
    });
    const before = await readRules(habitId);
    const rule = {
      p_frequency: 'every_n_days',
      p_interval_days: 3,
      p_weekdays: [],
    };
    let argumentsForFunction: Record<string, unknown> = {
      p_habit_id: habitId,
      p_today: '2026-10-07',
      ...rule,
    };
    if (functionName === 'update_habit') {
      argumentsForFunction = editArguments(habitId, {
        ...rule,
        p_new_start_date: '2026-10-01',
      });
    }
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await owner.client.rpc(
        functionName,
        argumentsForFunction,
      );
      expect(response.error).toBeNull();
      expect(await readRules(habitId)).toEqual(before);
    }
  },
);

it.each(['set_habit_rule', 'update_habit'])(
  '%s restores the original versions when undoing a change on the same day',
  async (functionName) => {
    const habitId = await createHabitId({
      p_start_date: '2026-10-01',
      p_frequency: 'every_n_days',
      p_interval_days: 3,
    });
    const before = await readRules(habitId);
    for (const intervalDays of [2, 3]) {
      const rule = {
        p_frequency: 'every_n_days',
        p_interval_days: intervalDays,
        p_weekdays: [],
      };
      let argumentsForFunction: Record<string, unknown> = {
        p_habit_id: habitId,
        p_today: '2026-10-15',
        ...rule,
      };
      if (functionName === 'update_habit') {
        argumentsForFunction = editArguments(habitId, {
          ...rule,
          p_today: '2026-10-15',
          p_new_start_date: '2026-10-01',
        });
      }
      const response = await owner.client.rpc(
        functionName,
        argumentsForFunction,
      );
      expect(response.error).toBeNull();
    }
    expect(await readRules(habitId)).toEqual(before);
  },
);

it('update_habit preserves ten past occurrences and their marks when switching to Wednesdays', async () => {
  const habitId = await createHabitId({ p_start_date: '2026-09-27' });
  const before = await readRules(habitId);
  const pastBefore = getOccurrencesInRange(
    buildSchedule(habitId, before),
    '2026-09-27',
    '2026-10-06',
  );
  expect(pastBefore).toHaveLength(10);
  const markRows = pastBefore.map((occurrence) => ({
    habit_id: habitId,
    occurrence_date: occurrence.date,
    status: 'done',
  }));
  const inserted = await owner.client.from('habit_marks').insert(markRows);
  expect(inserted.error).toBeNull();
  const marksBefore = await owner.client
    .from('habit_marks')
    .select('*')
    .eq('habit_id', habitId)
    .order('occurrence_date');
  expect(marksBefore.error).toBeNull();

  const response = await owner.client.rpc(
    'update_habit',
    editArguments(habitId, {
      p_new_start_date: '2026-09-27',
      p_frequency: 'weekdays',
      p_weekdays: [3],
    }),
  );
  expect(response.error).toBeNull();
  const after = await readRules(habitId);
  const schedule = buildSchedule(habitId, after);
  expect(getOccurrencesInRange(schedule, '2026-09-27', '2026-10-06')).toEqual(
    pastBefore,
  );
  const future = getOccurrencesInRange(schedule, '2026-10-07', '2026-10-21');
  expect(future.map((occurrence) => occurrence.date)).toEqual([
    '2026-10-07',
    '2026-10-14',
    '2026-10-21',
  ]);
  const marksAfter = await owner.client
    .from('habit_marks')
    .select('*')
    .eq('habit_id', habitId)
    .order('occurrence_date');
  expect(marksAfter.error).toBeNull();
  expect(marksAfter.data).toEqual(marksBefore.data);
});

it('update_habit cannot edit another users habit', async () => {
  const habitId = await createHabitId();
  const before = await readRules(habitId);
  const response = await stranger.client.rpc(
    'update_habit',
    editArguments(habitId, { p_name: 'Foreign edit', p_frequency: 'monthly' }),
  );
  expect(response.error?.code).toBe('P0002');
  expect(await readRules(habitId)).toEqual(before);
  const habit = await owner.client
    .from('habits')
    .select('name')
    .eq('id', habitId)
    .single();
  expect(habit.error).toBeNull();
  expect(habit.data?.name).toBe(parameters.p_name);
});

it('update_habit moves a future start and changes its first rule atomically', async () => {
  const habitId = await createHabitId();
  const response = await owner.client.rpc(
    'update_habit',
    editArguments(habitId, {
      p_new_start_date: '2026-10-22',
      p_frequency: 'monthly',
    }),
  );
  expect(response.error).toBeNull();
  const habit = await owner.client
    .from('habits')
    .select('start_date')
    .eq('id', habitId)
    .single();
  expect(habit.error).toBeNull();
  expect(habit.data?.start_date).toBe('2026-10-22');
  const rules = await readRules(habitId);
  expect(rules).toHaveLength(1);
  expect(rules[0]).toMatchObject({
    valid_from: '2026-10-22',
    frequency: 'monthly',
  });
});
