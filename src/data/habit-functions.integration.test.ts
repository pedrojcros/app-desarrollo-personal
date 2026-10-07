import { afterAll, beforeAll, expect, it } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
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

async function createHabitId(): Promise<string> {
  const response = await owner.client.rpc('create_habit', parameters);
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
      p_valid_from: '2026-10-20',
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
  await owner.client.from('habit_rules').insert({
    habit_id: habitId,
    valid_from: '2026-10-21',
    frequency: 'daily',
  });
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
  expect(anonymous.error).not.toBeNull();
  const rule = await stranger.client.rpc('set_habit_rule', {
    p_habit_id: habitId,
    p_valid_from: '2026-10-20',
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
